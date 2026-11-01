begin;
-- Paired players advance independently in their own question order.
create function quiz_game_internal.duel_next_round(duel uuid,player uuid) returns integer
language sql stable set search_path='' as $$
  select coalesce(min(r),4) from generate_series(1,3) r where public.quiz_duel_count(duel,player,r)<10
$$;
create function quiz_game_internal.duel_can_play(d public.quiz_duels,player uuid,r integer) returns boolean
language sql stable set search_path='' as $$
  select coalesce(player in (d.creator,d.opponent) and r between 1 and 3 and d.due_at>clock_timestamp()
    and r=quiz_game_internal.duel_next_round(d.id,player)
    and ((d.status='preparing' and player=d.creator and r=1) or (d.status='active' and d.opponent is not null)),false)
$$;
-- One shared 72-hour deadline starts at pairing. Only a player who has
-- finished all three rounds can win by timeout; two unfinished sides cancel.
create or replace function quiz_game_internal.duel_effective(d public.quiz_duels) returns public.quiz_duels
language plpgsql stable set search_path='' as $$
declare common boolean; done uuid;
begin
  if d.status in ('preparing','waiting','active') and d.due_at<=clock_timestamp() then
    select exists(select 1 from public.quiz_duel_answers where duel_id=d.id and answered_at is not null group by round_no having count(*)=20) into common;
    done:=case when public.quiz_duel_count(d.id,d.creator,3)=10 then d.creator when public.quiz_duel_count(d.id,d.opponent,3)=10 then d.opponent else null end;
    d.reason:=case when d.status='waiting' then 'no_opponent' else 'timeout' end;
    d.winner:=case when d.status='active' and common then done else null end;
    d.status:=case when d.winner is not null then 'forfeit' else 'cancelled' end;
    d.finished_at:=d.due_at; d.turn_owner:=null;
  end if;
  return d;
end$$;

create or replace function public.quiz_duel_summary(d public.quiz_duels,p uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare other uuid:=case when p=d.creator then d.opponent else d.creator end; rounds jsonb; target uuid;
begin
 d:=quiz_game_internal.duel_effective(d);
 select generation into target from public.quiz_account_heads where owner_id=p;
 with counts as (
 select round_no,count(*) filter(where player=p)::integer mine,count(*) filter(where player=other)::integer theirs,
 count(*) filter(where player=p and correct)::integer hit,count(*) filter(where player=other and correct)::integer otherhit
 from public.quiz_duel_answers where duel_id=d.id and answered_at is not null group by round_no
 ) select jsonb_agg(jsonb_build_object('number',r,'answered',coalesce(c.mine,0),'opponentAnswered',coalesce(c.theirs,0),'mine',case when c.mine=10 then c.hit else null end,'opponent',case when c.mine=10 and c.theirs=10 then c.otherhit else null end,
 'imported',coalesce((select jsonb_array_length(value->'events')>=coalesce(c.mine,0) from public.quiz_sync_entries where owner_id=p and generation=target and kind='round' and id='duel-'||d.id::text||'-'||r and not deleted),false)) order by r)
 into rounds from generate_series(1,3) r left join counts c on c.round_no=r;
 return jsonb_build_object('id',d.id,'opponent',coalesce(public.quiz_duel_name(other),'Gegner wird gesucht'),'status',d.status,'kind',d.kind,'solutionDisplay',d.solution_display,'paired',d.opponent is not null,'round',least(3,quiz_game_internal.duel_next_round(d.id,p)),
 'myTurn',quiz_game_internal.duel_can_play(d,p,quiz_game_internal.duel_next_round(d.id,p)),'dueAt',floor(extract(epoch from d.due_at)*1000)::bigint,'createdAt',floor(extract(epoch from d.created_at)*1000)::bigint,
 'reason',d.reason,'result',case when d.status='completed' and d.winner is null then 'draw' when d.winner=p then 'win' when d.winner=other then 'loss' else null end,
 'ranked',case when d.status='completed' then exists(select 1 from quiz_competition_internal.duel_awards a where a.duel_id=d.id) else null end,
 'invitation',case when d.creator=p and d.kind='invite' and d.status='waiting' then d.token else null end,'rounds',rounds);
end$$;

create or replace function public.quiz_duel_view(duel uuid,round_number integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare p uuid:=public.quiz_duel_lock(); d public.quiz_duels; items jsonb:='[]'; q jsonb; a public.quiz_duel_answers; n integer; current_item jsonb;
begin
  select * into d from public.quiz_duels where id=duel and (creator=p or opponent=p);
  if not found or round_number not between 1 and 3 or round_number is null then raise exception 'duel_unavailable' using errcode='42501'; end if;
  d:=quiz_game_internal.duel_effective(d);
  n:=public.quiz_duel_count(d.id,p,round_number);
  for i in 0..n-1 loop
    select * into a from public.quiz_duel_answers where duel_id=d.id and player=p and round_no=round_number and question_no=i;
    q:=d.questions->((round_number-1)*10+i);
    if d.solution_display='round' and n<10 and d.status in ('preparing','active','waiting') then
      q:=jsonb_set(q,'{question}',(q->'question')-'correctId'-'explanation'-'context'-'anchor'-'sources'-'presentation');
      q:=jsonb_set(q,'{question,answers}',(select jsonb_agg(jsonb_build_object('id',v->>'id','text',v->>'text')) from jsonb_array_elements(q->'question'->'answers') v));
      q:=jsonb_set(q,'{question,metadata}',jsonb_build_object('subdomain',coalesce(q->'question'->'metadata'->>'subdomain','')));
    end if;
    items:=items||jsonb_build_array(q||jsonb_build_object('event',jsonb_build_object('answerId',a.answer_id,'dontKnow',a.dont_know,
      'correct',case when d.solution_display='round' and n<10 and d.status in ('preparing','active','waiting') then null else a.correct end,
      'guessed',case when d.solution_display='round' and n<10 and d.status in ('preparing','active','waiting') then false else a.guessed end,
      'at',floor(extract(epoch from a.answered_at)*1000)::bigint,'elapsedMs',a.elapsed_ms)));
  end loop;
  if n<10 and quiz_game_internal.duel_can_play(d,p,round_number) then
    q:=d.questions->((round_number-1)*10+n);
    q:=jsonb_set(q,'{question}',(q->'question')-'correctId'-'explanation'-'context'-'anchor'-'sources'-'presentation');
    q:=jsonb_set(q,'{question,answers}',(select jsonb_agg(jsonb_build_object('id',v->>'id','text',v->>'text')) from jsonb_array_elements(q->'question'->'answers') v));
    q:=jsonb_set(q,'{question,metadata}',jsonb_build_object('subdomain',coalesce(q->'question'->'metadata'->>'subdomain','')));
    select * into a from public.quiz_duel_answers where duel_id=d.id and player=p and round_no=round_number and question_no=n;
    if a.started_at is not null then q:=jsonb_set(q,'{question}',quiz_ranked_internal.visible(q->'question')); current_item:=q||jsonb_build_object('index',n,'startedAt',floor(extract(epoch from a.started_at)*1000)::bigint); end if;
  end if;
  return jsonb_build_object('duel',public.quiz_duel_summary(d,p),'number',round_number,'answered',n,'items',items,'current',current_item,'serverNow',floor(extract(epoch from clock_timestamp())*1000)::bigint);
end $$;

create or replace function public.quiz_duel_start(duel uuid,round_number integer,question_number integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p uuid:=public.quiz_duel_lock(); d public.quiz_duels;
begin
  d:=quiz_game_internal.duel_target(duel,p);
  if d.id is null or not quiz_game_internal.duel_can_play(d,p,round_number) then raise exception 'not_your_turn'; end if;
  if question_number is distinct from public.quiz_duel_count(d.id,p,round_number) or question_number not between 0 and 9 then raise exception 'invalid_question'; end if;
  insert into public.quiz_duel_answers(duel_id,player,round_no,question_no,started_at)
    values(d.id,p,round_number,question_number,clock_timestamp()) on conflict do nothing;
  return public.quiz_duel_view(d.id,round_number)-'items';
end $$;

create or replace function public.quiz_duel_answer(duel uuid,round_number integer,question_number integer,answer_id text,unknown_answer boolean,was_guessed boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare p uuid:=public.quiz_duel_lock(); d public.quiz_duels; a public.quiz_duel_answers; q jsonb; ms integer; left_hits integer; right_hits integer;
begin
  d:=quiz_game_internal.duel_target(duel,p);
  if d.id is null or round_number not between 1 and 3 or question_number not between 0 and 9 or round_number is null or question_number is null then raise exception 'duel_unavailable'; end if;
  select * into a from public.quiz_duel_answers where duel_id=d.id and player=p and round_no=round_number and question_no=question_number;
  if a.answered_at is not null then return public.quiz_duel_view(d.id,round_number); end if;
  if not quiz_game_internal.duel_can_play(d,p,round_number) or a.started_at is null then raise exception 'not_your_turn'; end if;
  if unknown_answer is null or was_guessed is null or (unknown_answer and answer_id is not null) then raise exception 'invalid_answer'; end if;
  q:=d.questions->((round_number-1)*10+question_number)->'question';
  if answer_id is not null and not exists(select 1 from jsonb_array_elements(q->'answers') v where v->>'id'=answer_id) then raise exception 'invalid_answer'; end if;
  ms:=least(2147483647,greatest(0,floor(extract(epoch from (clock_timestamp()-a.started_at))*1000)))::integer;
  if answer_id is null and not unknown_answer and ms<30000 then raise exception 'question_not_expired'; end if;
  update public.quiz_duel_answers set answered_at=clock_timestamp(),answer_id=case when ms<30000 then quiz_duel_answer.answer_id else null end,
    dont_know=unknown_answer and ms<30000,correct=coalesce(quiz_duel_answer.answer_id=q->>'correctId' and ms<30000,false),
    guessed=coalesce(was_guessed and quiz_duel_answer.answer_id=q->>'correctId' and ms<30000,false),elapsed_ms=ms
    where duel_id=d.id and player=p and round_no=round_number and question_no=question_number;
  -- null SQL comparisons must become an explicit false, including Keine Ahnung.
  update public.quiz_duel_answers set correct=coalesce(correct,false),guessed=coalesce(guessed,false) where duel_id=d.id and player=p and round_no=round_number and question_no=question_number;
  if question_number=9 then
    if d.opponent is null then
      update public.quiz_duels set status='waiting',turn_owner=null,due_at=clock_timestamp()+interval '7 days' where id=d.id;
    elsif public.quiz_duel_count(d.id,d.creator,3)=10 and public.quiz_duel_count(d.id,d.opponent,3)=10 then
      select count(*) filter(where correct)::integer into left_hits from public.quiz_duel_answers where duel_id=d.id and player=d.creator;
      select count(*) filter(where correct)::integer into right_hits from public.quiz_duel_answers where duel_id=d.id and player=d.opponent;
      update public.quiz_duels set status='completed',turn_owner=null,finished_at=clock_timestamp(),winner=case when left_hits>right_hits then d.creator when right_hits>left_hits then d.opponent else null end where id=d.id;
    end if;
  end if;
  return public.quiz_duel_view(d.id,round_number);
end $$;

create or replace function public.quiz_duel_create(display text,invited boolean,request uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare p uuid:=public.quiz_duel_lock(); d public.quiz_duels; pack jsonb:='[]'; block jsonb; taken text[]:='{}';
begin
  perform pg_advisory_xact_lock(hashtextextended(p::text,20261011));
  if display not in ('question','round') or display is null or request is null or invited is null then raise exception 'invalid_duel'; end if;
  select * into d from public.quiz_duels where creator=p and request_id=request;
  if found then return public.quiz_duel_summary(d,p); end if;
  select * into d from public.quiz_duels where opponent=p and join_request=request;
  if found then return public.quiz_duel_summary(d,p); end if;
  if public.quiz_duel_slots(p)>=10 then raise exception 'duel_limit'; end if;
  if not invited then
    select * into d from public.quiz_duels where status='waiting' and kind='random' and creator<>p and solution_display=display
      and due_at>clock_timestamp() order by created_at limit 1 for update skip locked;
    if found then
      update public.quiz_duels set opponent=p,status='active',turn_owner=p,turn_round=1,due_at=clock_timestamp()+interval '72 hours',join_request=request where id=d.id returning * into d;
      return public.quiz_duel_summary(d,p);
    end if;
  end if;
  for r in 1..3 loop
    with goals as (
      select distinct on (knowledge_id) * from public.quiz_duel_catalog where enabled and difficulty in ('leicht','mittel','schwer') and not knowledge_id=any(taken)
        order by knowledge_id,random()
    ), spread as (
      select *,row_number() over(partition by difficulty,genre order by -ln(greatest(random(),0.0001))/case when familiarity in(1,2) then 3 else 1 end) as genre_rank from goals
    ), picked as (
      select *,row_number() over(partition by difficulty order by genre_rank,random()) as difficulty_rank from spread
    ), prepared as materialized (
      select public.quiz_year_question(question) as question from picked where difficulty_rank<=case when difficulty='mittel' then 4 else 3 end
    ) select coalesce(jsonb_agg(jsonb_build_object('question',question,'order',(select jsonb_agg(a->>'id' order by random()) from jsonb_array_elements(question->'answers') a)) order by random()),'[]') into block
      from prepared;
    if jsonb_array_length(block)<>10 then raise exception 'duel_catalog_missing'; end if;
    select taken||array_agg(q->'question'->>'knowledgeId') into taken from jsonb_array_elements(block) q;
    pack:=pack||block;
  end loop;
  insert into public.quiz_duels(creator,kind,solution_display,questions,turn_owner,request_id)
    values(p,case when invited then 'invite' else 'random' end,display,pack,p,request) returning * into d;
  return public.quiz_duel_summary(d,p);
end $$;

create or replace function public.quiz_duel_join(invitation text) returns jsonb language plpgsql security definer set search_path='' as $$
declare p uuid:=public.quiz_duel_lock(); d public.quiz_duels;
begin
  perform pg_advisory_xact_lock(hashtextextended(p::text,20261011));
  if invitation is null or invitation !~ '^[a-f0-9]{64}$' then raise exception 'invalid_invitation'; end if;
  select * into d from public.quiz_duels where token=invitation and kind='invite' for update;
  if not found then raise exception 'invalid_invitation'; end if;
  if d.creator=p then raise exception 'self_duel'; end if;
  if d.opponent=p then return public.quiz_duel_summary(d,p); end if;
  if d.due_at<=clock_timestamp() or d.opponent is not null or d.status<>'waiting' then raise exception 'invitation_unavailable'; end if;
  if public.quiz_duel_slots(p)>=10 then raise exception 'duel_limit'; end if;
  update public.quiz_duels set opponent=p,status='active',turn_owner=p,turn_round=1,due_at=clock_timestamp()+interval '72 hours' where id=d.id returning * into d;
  return public.quiz_duel_summary(d,p);
end $$;
revoke all on function quiz_game_internal.duel_next_round(uuid,uuid),quiz_game_internal.duel_can_play(public.quiz_duels,uuid,integer) from public,anon,authenticated;
commit;
