-- Competitive totals have only server-authoritative inputs. Private learning
-- saves and their historical projections stay independent and never write here.
begin;
create schema quiz_competition_internal;
revoke all on schema quiz_competition_internal from public,anon,authenticated;
create table quiz_competition_internal.batches (
  owner_id uuid not null references auth.users(id) on delete cascade,
  source text not null, source_id text not null, primary key(owner_id,source,source_id)
);
create table quiz_competition_internal.days (
  owner_id uuid not null references auth.users(id) on delete cascade,
  knowledge_id text not null, day date not null,
  participation integer not null check(participation between 0 and 1),
  correct_xp integer not null check(correct_xp between 0 and 5),
  primary key(owner_id,knowledge_id,day)
);
create table quiz_competition_internal.totals (
  owner_id uuid not null references auth.users(id) on delete cascade,
  genre text not null default '', difficulty text not null default '',
  completed bigint not null default 0, answered bigint not null default 0,
  correct bigint not null default 0, experience bigint not null default 0,
  primary key(owner_id,genre,difficulty)
);
create table quiz_competition_internal.duel_awards (
  first_player uuid not null references auth.users(id) on delete cascade,
  second_player uuid not null references auth.users(id) on delete cascade,
  day date not null, duel_id uuid not null unique references public.quiz_duels(id) on delete cascade,
  primary key(first_player,second_player,day), check(first_player<second_player)
);
alter table quiz_competition_internal.batches enable row level security;
alter table quiz_competition_internal.days enable row level security;
alter table quiz_competition_internal.totals enable row level security;
alter table quiz_competition_internal.duel_awards enable row level security;
revoke all on all tables in schema quiz_competition_internal from public,anon,authenticated;

-- One small projection per completed run/block, no replay during leaderboard reads.
-- XP: one per selected answer plus 2/3/5 per correct answer, once per goal/UTC day.
create function quiz_competition_internal.credit(player uuid,kind text,key text,items jsonb) returns void
language plpgsql set search_path='' as $$
declare item record; prior quiz_competition_internal.days; gain bigint:=0;
begin
  perform pg_advisory_xact_lock(hashtextextended('competition:'||player::text,0));
  insert into quiz_competition_internal.batches values(player,kind,key) on conflict do nothing;
  if not found then return; end if;
  for item in
    with events as (
      select i->>'knowledgeId' as goal,(to_timestamp((i->>'at')::double precision/1000) at time zone 'UTC')::date as day,
        case when i->>'answerId' is not null or i->'dontKnow'='true'::jsonb then 1 else 0 end as participation,
        case when (i->>'correct')::boolean then case i->>'difficulty' when 'leicht' then 2 when 'mittel' then 3 else 5 end else 0 end as correct_xp
      from jsonb_array_elements(items) i
    ) select goal,day,max(participation) as participation,max(correct_xp) as correct_xp from events group by goal,day
  loop
    select * into prior from quiz_competition_internal.days where owner_id=player and knowledge_id=item.goal and day=item.day;
    gain:=gain+greatest(0,item.participation-coalesce(prior.participation,0))+greatest(0,item.correct_xp-coalesce(prior.correct_xp,0));
    insert into quiz_competition_internal.days values(player,item.goal,item.day,item.participation,item.correct_xp)
      on conflict(owner_id,knowledge_id,day) do update set participation=greatest(days.participation,excluded.participation),correct_xp=greatest(days.correct_xp,excluded.correct_xp);
  end loop;
  insert into quiz_competition_internal.totals(owner_id,genre,difficulty,completed,answered,correct)
    select player,g.genre,d.difficulty,1,count(*) filter(where i->>'answerId' is not null or i->'dontKnow'='true'::jsonb),count(*) filter(where (i->>'correct')::boolean)
    from jsonb_array_elements(items) i
      cross join lateral (select '' as genre union all select i->>'genre' where coalesce(i->>'genre','')<>'') g
      cross join lateral (select '' as difficulty union all select i->>'difficulty') d
    group by g.genre,d.difficulty
    on conflict(owner_id,genre,difficulty) do update set completed=totals.completed+excluded.completed,
      answered=totals.answered+excluded.answered,correct=totals.correct+excluded.correct;
  update quiz_competition_internal.totals set experience=experience+gain where owner_id=player and genre='' and difficulty='';
end $$;
create function quiz_competition_internal.solo_completed() returns trigger
language plpgsql security definer set search_path='' as $$declare items jsonb;begin
  if new.status<>'completed' or old.status='completed' then return new; end if;
  select coalesce(jsonb_agg(jsonb_build_object('knowledgeId',q.question->>'knowledgeId','difficulty',q.question->>'difficulty',
    'genre',coalesce(nullif(q.question->'metadata'->>'subdomain',''),q.question->>'domain'),
    'answerId',q.event->'answerId','dontKnow',q.event->'dontKnow','correct',q.event->'correct','at',q.event->'at')),'[]') into items
    from quiz_ranked_internal.questions q where q.run_id=new.id and q.event is not null;
  if jsonb_array_length(items)>0 then perform quiz_competition_internal.credit(new.owner_id,'solo',new.id::text,items); end if;
  return new;
end $$;
create trigger competition_solo_completed after update of status on quiz_ranked_internal.runs
  for each row execute function quiz_competition_internal.solo_completed();
create function quiz_competition_internal.duel_block_completed() returns trigger
language plpgsql security definer set search_path='' as $$declare items jsonb;begin
  if new.answered_at is null or old.answered_at is not null then return new; end if;
  if public.quiz_duel_count(new.duel_id,new.player,new.round_no)<>10 then return new; end if;
  select jsonb_agg(jsonb_build_object('knowledgeId',q->>'knowledgeId','difficulty',q->>'difficulty',
    'genre',coalesce(nullif(q->'metadata'->>'subdomain',''),q->>'domain'),
    'answerId',a.answer_id,'dontKnow',a.dont_know,'correct',a.correct,'at',floor(extract(epoch from a.answered_at)*1000)::bigint)) into items
    from public.quiz_duel_answers a join public.quiz_duels d on d.id=a.duel_id
      cross join lateral (select d.questions->((a.round_no-1)*10+a.question_no)->'question' as q) content
    where a.duel_id=new.duel_id and a.player=new.player and a.round_no=new.round_no and a.answered_at is not null;
  perform quiz_competition_internal.credit(new.player,'duel',new.duel_id::text||':'||new.round_no::text,items);
  return new;
end $$;
create trigger competition_duel_block_completed after update of answered_at on public.quiz_duel_answers
  for each row execute function quiz_competition_internal.duel_block_completed();
create function quiz_competition_internal.duel_completed() returns trigger
language plpgsql security definer set search_path='' as $$begin
  if new.status='completed' and old.status<>'completed' and new.opponent is not null
    and (select count(*) from public.quiz_duel_answers a where a.duel_id=new.id and a.answered_at is not null
      and a.player in (new.creator,new.opponent))=60 then
    insert into quiz_competition_internal.duel_awards values(least(new.creator,new.opponent),greatest(new.creator,new.opponent),
      (new.finished_at at time zone 'UTC')::date,new.id) on conflict do nothing;
  end if;
  return new;
end $$;
create trigger competition_duel_completed after update of status on public.quiz_duels
  for each row execute function quiz_competition_internal.duel_completed();

-- Reading an overview or accepting an answer cannot reveal an unstarted question.
do $$declare definition text;begin
  definition:=pg_get_functiondef('public.quiz_duel_view(uuid,integer)'::regprocedure);
  if position('current_item:=q||jsonb_build_object(' in definition)=0 or position('''startedAt'',case when a.started_at is null then null else floor(extract(epoch from a.started_at)*1000)::bigint end);' in definition)=0 then raise exception 'duel_view_contract_missing'; end if;
  definition:=replace(definition,'current_item:=q||jsonb_build_object(',
    'if a.started_at is not null then q:=jsonb_set(q,''{question}'',quiz_ranked_internal.visible(q->''question'')); current_item:=q||jsonb_build_object(');
  definition:=replace(definition,'''startedAt'',case when a.started_at is null then null else floor(extract(epoch from a.started_at)*1000)::bigint end);',
    '''startedAt'',floor(extract(epoch from a.started_at)*1000)::bigint); end if;');
  execute definition;
end $$;
create or replace function public.quiz_duel_start(duel uuid,round_number integer,question_number integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p uuid:=public.quiz_duel_lock(); d public.quiz_duels;
begin
  select * into d from public.quiz_duels where id=duel and (creator=p or opponent=p);
  if not found or d.turn_owner<>p or d.turn_round is distinct from round_number or d.status not in ('preparing','active') then raise exception 'not_your_turn'; end if;
  if question_number is distinct from public.quiz_duel_count(d.id,p,round_number) or question_number not between 0 and 9 then raise exception 'invalid_question'; end if;
  insert into public.quiz_duel_answers(duel_id,player,round_no,question_no,started_at)
    values(d.id,p,round_number,question_number,clock_timestamp()) on conflict do nothing;
  return public.quiz_duel_view(d.id,round_number)-'items';
end $$;
-- Summary exposes only whether this completed match received its daily award.
do $$declare definition text;begin
  definition:=pg_get_functiondef('public.quiz_duel_summary(public.quiz_duels,uuid)'::regprocedure);
  if position('''invitation'',case' in definition)=0 then raise exception 'duel_summary_contract_missing'; end if;
  definition:=replace(definition,'''invitation'',case',
    '''ranked'',case when d.status=''completed'' then exists(select 1 from quiz_competition_internal.duel_awards a where a.duel_id=d.id) else null end,''invitation'',case');
  execute definition;
  definition:=pg_get_functiondef('public.quiz_duel_rankings(text,integer)'::regprocedure);
  if position('select d.* from public.quiz_duels d' in definition)=0 then raise exception 'duel_rankings_contract_missing'; end if;
  definition:=replace(definition,'select d.* from public.quiz_duels d',
    'select d.* from public.quiz_duels d join quiz_competition_internal.duel_awards a on a.duel_id=d.id');
  execute definition;
end $$;
-- Preserve small public response contracts, replace every public XP source.
do $$declare name text; definition text;begin
  foreach name in array array['quiz_sync_internal.players(text,text,text,integer)',
    'public.quiz_record_runs(text,text,integer)','public.quiz_rankings(text,integer)'] loop
    definition:=pg_get_functiondef(name::regprocedure);
    if position('public.quiz_player_totals' in definition)=0 then raise exception 'competition_projection_source_missing'; end if;
    definition:=replace(definition,'public.quiz_player_totals','quiz_competition_internal.totals');
    if name='quiz_sync_internal.players(text,text,text,integer)' then
      definition:=replace(definition,'(t.completed>0 or (selected_genre='''' and selected_difficulty=''''))','t.completed>0');
    end if;
    execute definition;
  end loop;
end $$;
revoke all on all functions in schema quiz_competition_internal from public,anon,authenticated;
revoke all on function public.quiz_duel_start(uuid,integer,integer) from public,anon;
grant execute on function public.quiz_duel_start(uuid,integer,integer) to authenticated;
notify pgrst,'reload schema';
commit;
