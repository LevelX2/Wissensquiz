-- Incremental approved statistics. Never expose private questions or histories.
begin;
-- Reordering a complete packet must not depend on the order of its upserts.
drop index public.quiz_sync_sequence;
alter table public.quiz_sync_entries add column sequence_position integer generated always as
  (case when kind in ('round','event') and not deleted then position else null end) stored;
alter table public.quiz_sync_entries add constraint quiz_sync_sequence unique(owner_id,generation,kind,sequence_position) deferrable initially deferred;
create table public.quiz_round_contributions (
  owner_id uuid not null references auth.users(id) on delete cascade,
  generation uuid,
  round_id text not null,
  genre text not null,
  difficulty text not null,
  completed bigint not null check(completed=1),
  answered bigint not null check(answered>=0),
  correct bigint not null check(correct>=0),
  primary key(owner_id,round_id,genre,difficulty),
  foreign key(owner_id,generation) references public.quiz_sync_generations(owner_id,id) on delete cascade
);
create table public.quiz_player_totals (
  owner_id uuid not null references auth.users(id) on delete cascade,
  genre text not null,
  difficulty text not null,
  completed bigint not null default 0 check(completed>=0),
  answered bigint not null default 0 check(answered>=0),
  correct bigint not null default 0 check(correct>=0),
  experience bigint not null default 0 check(experience>=0),
  primary key(owner_id,genre,difficulty)
);
create index quiz_player_totals_filter on public.quiz_player_totals(genre,difficulty,owner_id);
alter table public.quiz_round_contributions enable row level security;
alter table public.quiz_player_totals enable row level security;
revoke all on public.quiz_round_contributions,public.quiz_player_totals from public,anon,authenticated;

create function quiz_sync_internal.project_record(player uuid,input_round jsonb,input_events jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare snapshot jsonb; r jsonb; q jsonb; e jsonb; gs text[]; ds text[];
  n integer; hits integer; total integer; duration bigint; ms integer;
  valid boolean; display text; finished double precision; cat text; projected boolean:=false;
begin
  if input_round->>'mode' is distinct from 'rekord' or input_round->>'status' is distinct from 'completed' then
    delete from public.quiz_shared_scores where owner_id=player and round_id=input_round->>'id'; return;
  end if;
  select left(coalesce(nullif(btrim(raw_user_meta_data->>'display_name'),''),'Spieler'),40)
    into display from auth.users where id=player and email_confirmed_at is not null and not coalesce(is_anonymous,false);
  if display is null then delete from public.quiz_shared_scores where owner_id=player and round_id=input_round->>'id'; return; end if;
  snapshot:=jsonb_build_object('rounds',jsonb_build_array(input_round),'events',input_events);
  if jsonb_typeof(snapshot->'rounds') is distinct from 'array' or jsonb_typeof(snapshot->'events') is distinct from 'array' then return; end if;
  for r in select value from jsonb_array_elements(snapshot->'rounds') loop
    begin
      if r->>'mode' <> 'rekord' or r->>'status' <> 'completed' or
        jsonb_typeof(r->'questions') is distinct from 'array' or coalesce(length(r->>'id'),0) not between 1 and 200 then continue; end if;
      n:=jsonb_array_length(r->'questions');
      if n not between 1 and 100 or coalesce(length(r->>'ruleVersion'),0) not between 1 and 100 then continue; end if;
      finished:=(r->>'finishedAt')::double precision;
      if finished is null or finished < 0 or finished > extract(epoch from now())*1000+300000 then continue; end if;
      if (select count(distinct value->>'id') from jsonb_array_elements(r->'questions')) <> n then continue; end if;
      total:=0; hits:=0; duration:=0; valid:=true;
      for q in select value from jsonb_array_elements(r->'questions') loop
        if (select count(*) from jsonb_array_elements(snapshot->'events') where value->>'roundId'=r->>'id' and value->>'questionId'=q->>'id') <> 1 then valid:=false; exit; end if;
        select value into e from jsonb_array_elements(snapshot->'events') where value->>'roundId'=r->>'id' and value->>'questionId'=q->>'id';
        ms:=(e->>'elapsedMs')::integer;
        if ms is null or ms not between 0 and 30000 then valid:=false; exit; end if;
        duration:=duration+ms;
        if e->>'answerId'=q->>'correctId' and ms < 30000 then
          hits:=hits+1; total:=total+100+2*((30000-ms)/1000);
        end if;
      end loop;
      if not valid then continue; end if;
      if jsonb_typeof(r->'filters'->'genres')='array' and jsonb_typeof(r->'filters'->'difficulties')='array' then
        select array_agg(distinct value order by value) into gs from jsonb_array_elements_text(r->'filters'->'genres');
        select array_agg(distinct value order by value) into ds from jsonb_array_elements_text(r->'filters'->'difficulties');
      else
        select array_agg(distinct coalesce(value->'metadata'->>'subdomain',value->>'domain') order by coalesce(value->'metadata'->>'subdomain',value->>'domain')) into gs from jsonb_array_elements(r->'questions');
        ds:=array['historisch:'||coalesce(r->>'difficulty','Alle Stufen')];
      end if;
      if gs is null or ds is null or array_length(gs,1)>30 or array_length(ds,1)>4 or
        exists(select 1 from unnest(gs||ds) x where length(x)>100) or length(coalesce(r->>'topic',''))>200 then continue; end if;
      cat:=jsonb_build_array(gs,ds,coalesce(r->>'topic','Alle Themen'),n,r->>'ruleVersion')::text;
      insert into public.quiz_shared_scores values(player,r->>'id',display,cat,gs,ds,coalesce(r->>'topic','Alle Themen'),n,r->>'ruleVersion',total,hits,duration,finished)
        on conflict(owner_id,round_id) do update set player_name=excluded.player_name,category=excluded.category,genres=excluded.genres,difficulties=excluded.difficulties,
          topic=excluded.topic,question_count=excluded.question_count,rule_version=excluded.rule_version,points=excluded.points,correct=excluded.correct,elapsed_ms=excluded.elapsed_ms,finished_at=excluded.finished_at
          where (quiz_shared_scores.player_name,quiz_shared_scores.category,quiz_shared_scores.points,quiz_shared_scores.correct,quiz_shared_scores.elapsed_ms,quiz_shared_scores.finished_at)
            is distinct from (excluded.player_name,excluded.category,excluded.points,excluded.correct,excluded.elapsed_ms,excluded.finished_at);
      projected:=true;
    exception when invalid_text_representation or numeric_value_out_of_range then
      continue;
    end;
  end loop;
  if not projected then delete from public.quiz_shared_scores where owner_id=player and round_id=input_round->>'id'; end if;
end;
$$;

create function quiz_sync_internal.project_round(player uuid,target uuid,input_round jsonb,input_events jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare round_key text:=input_round->>'id'; prior jsonb; next_rows jsonb; item jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('genre',c.genre,'difficulty',c.difficulty,'completed',c.completed,'answered',c.answered,'correct',c.correct) order by c.genre,c.difficulty),'[]')
    into prior from public.quiz_round_contributions c where c.owner_id=player and c.round_id=round_key;
  if input_round->>'status'='completed' and input_round->>'mode' in ('rekord','entdecken','ueben','fehler') then
    with questions as (
      select q,coalesce(nullif(q->'metadata'->>'subdomain',''),q->>'domain') as genre,q->>'difficulty' as difficulty
      from jsonb_array_elements(input_round->'questions') q
    ), expanded as (
      select q.q,g.genre,d.difficulty,e.event
      from questions q
      cross join lateral (select distinct unnest(array['',q.genre]) as genre) g
      cross join lateral (select distinct unnest(array['',q.difficulty]) as difficulty) d
      left join lateral (select e as event from jsonb_array_elements(input_events) with ordinality events(e,ordinal)
        where e->>'roundId'=round_key and e->>'questionId'=q.q->>'id' order by ordinal limit 1) e on true
    ), counts as (
      select genre,difficulty,1::bigint as completed,
        count(*) filter(where event->>'answerId' is not null or (event->'dontKnow'='true'::jsonb and
          (input_round->>'mode'<>'rekord' or case when event->>'elapsedMs' ~ '^[0-9]+([.][0-9]+)?$' then (event->>'elapsedMs')::numeric<30000 else false end))) as answered,
        count(*) filter(where event->>'answerId'=q->>'correctId' and
          (input_round->>'mode'<>'rekord' or case when event->>'elapsedMs' ~ '^[0-9]+([.][0-9]+)?$' then (event->>'elapsedMs')::numeric<30000 else false end)) as correct
      from expanded group by genre,difficulty
    ) select coalesce(jsonb_agg(to_jsonb(counts) order by genre,difficulty),'[]') into next_rows from counts;
  else next_rows:='[]'; end if;
  if prior is distinct from next_rows then
    for item in select value from jsonb_array_elements(prior) loop
      update public.quiz_player_totals t set completed=t.completed-(item->>'completed')::bigint,
        answered=t.answered-(item->>'answered')::bigint,correct=t.correct-(item->>'correct')::bigint
        where t.owner_id=player and t.genre=item->>'genre' and t.difficulty=item->>'difficulty';
    end loop;
    delete from public.quiz_round_contributions where owner_id=player and round_id=round_key;
    for item in select value from jsonb_array_elements(next_rows) loop
      insert into public.quiz_round_contributions values(player,target,round_key,item->>'genre',item->>'difficulty',1,(item->>'answered')::bigint,(item->>'correct')::bigint);
      insert into public.quiz_player_totals(owner_id,genre,difficulty,completed,answered,correct)
        values(player,item->>'genre',item->>'difficulty',1,(item->>'answered')::bigint,(item->>'correct')::bigint)
        on conflict(owner_id,genre,difficulty) do update set completed=quiz_player_totals.completed+excluded.completed,
          answered=quiz_player_totals.answered+excluded.answered,correct=quiz_player_totals.correct+excluded.correct;
    end loop;
    delete from public.quiz_player_totals where owner_id=player and completed=0 and (genre<>'' or difficulty<>'');
  end if;
  perform quiz_sync_internal.project_record(player,input_round,input_events);
end$$;

create or replace function quiz_sync_internal.project(player uuid,target uuid,round_ids text[],fields_changed boolean) returns void
language plpgsql security definer set search_path='' as $$
declare r record; round_value jsonb; events jsonb; xp bigint; small_state jsonb;
begin
  if round_ids is null then
    delete from public.quiz_round_contributions where owner_id=player;
    delete from public.quiz_player_totals where owner_id=player;
    delete from public.quiz_shared_scores where owner_id=player;
  end if;
  for r in
    select id,value,deleted from public.quiz_sync_entries where owner_id=player and generation=target and kind='round'
      and (round_ids is null or id=any(round_ids))
  loop
    if r.deleted then round_value:=jsonb_build_object('id',r.id,'questions','[]'::jsonb); events:='[]';
    else
      select jsonb_set(r.value,'{questions}',coalesce(jsonb_agg(q-'ref' order by ordinality),'[]')) into round_value
        from jsonb_array_elements(r.value->'questions') with ordinality questions(q,ordinality);
      select coalesce(jsonb_agg(e.value order by e.position),'[]') into events from public.quiz_sync_entries e
        where e.owner_id=player and e.generation=target and e.kind='event' and not e.deleted and e.round_id=r.id;
    end if;
    perform quiz_sync_internal.project_round(player,target,round_value,events);
  end loop;
  if fields_changed or round_ids is null then
    select coalesce(jsonb_object_agg(id,value),'{}') into small_state from public.quiz_sync_entries
      where owner_id=player and generation=target and kind='field' and not deleted and id in ('experience','career');
    -- Canonical career version 1 is persisted by the unchanged App career rules.
    -- Preserve the old SQL fallback for legacy snapshots that have no v1 ledger.
    if small_state->'career'->>'version' is distinct from '1' then
      select jsonb_set(small_state,'{rounds}',coalesce(jsonb_agg(value),'[]')) into small_state
        from public.quiz_sync_entries where owner_id=player and generation=target and kind='round' and not deleted;
    end if;
    xp:=public.quiz_career_experience(small_state);
    insert into public.quiz_player_totals(owner_id,genre,difficulty,experience) values(player,'','',xp)
      on conflict(owner_id,genre,difficulty) do update set experience=excluded.experience where quiz_player_totals.experience is distinct from excluded.experience;
  end if;
end$$;

create function quiz_sync_internal.project_legacy(player uuid,snapshot jsonb,previous jsonb default null) returns void
language plpgsql security definer set search_path='' as $$
declare r record; events jsonb; xp bigint;
begin
  if previous is null then
    delete from public.quiz_round_contributions where owner_id=player;
    delete from public.quiz_player_totals where owner_id=player;
    delete from public.quiz_shared_scores where owner_id=player;
  end if;
  for r in
    with old_rounds as (select value->>'id' as id,value from jsonb_array_elements(coalesce(previous->'rounds','[]'))),
      new_rounds as (select value->>'id' as id,value from jsonb_array_elements(coalesce(snapshot->'rounds','[]'))),
      old_events as (select value->>'roundId' as id,jsonb_agg(value order by n) as value from jsonb_array_elements(coalesce(previous->'events','[]')) with ordinality e(value,n) group by 1),
      new_events as (select value->>'roundId' as id,jsonb_agg(value order by n) as value from jsonb_array_elements(coalesce(snapshot->'events','[]')) with ordinality e(value,n) group by 1)
    select coalesce(o.id,n.id) as id,coalesce(n.value,jsonb_build_object('id',o.id,'questions','[]'::jsonb)) as value,coalesce(ne.value,'[]') as events
      from old_rounds o full join new_rounds n on n.id=o.id
      left join old_events oe on oe.id=coalesce(o.id,n.id) left join new_events ne on ne.id=coalesce(o.id,n.id)
      where o.value is distinct from n.value or oe.value is distinct from ne.value
  loop perform quiz_sync_internal.project_round(player,null,r.value,r.events); end loop;
  xp:=public.quiz_career_experience(snapshot);
  insert into public.quiz_player_totals(owner_id,genre,difficulty,experience) values(player,'','',xp)
    on conflict(owner_id,genre,difficulty) do update set experience=excluded.experience where quiz_player_totals.experience is distinct from excluded.experience;
end$$;
create or replace function public.quiz_project_scores(player uuid) returns void
language plpgsql security definer set search_path='' as $$declare snapshot jsonb; target uuid; begin
  select generation into target from public.quiz_account_heads where owner_id=player;
  if target is not null then perform quiz_sync_internal.project(player,target,null,true);
  else select state into snapshot from public.quiz_saves where owner_id=player;perform quiz_sync_internal.project_legacy(player,coalesce(snapshot,'{}'),null); end if;
end$$;
create or replace function public.quiz_scores_after_save() returns trigger
language plpgsql security definer set search_path='' as $$begin
  if tg_op='INSERT' then perform quiz_sync_internal.project_legacy(new.owner_id,new.state,null);
  elsif new.state->'rounds' is distinct from old.state->'rounds' or new.state->'events' is distinct from old.state->'events'
    or new.state->'experience' is distinct from old.state->'experience' or new.state->'career' is distinct from old.state->'career' then
    perform quiz_sync_internal.project_legacy(new.owner_id,new.state,old.state);
  end if;
  return new;
end$$;
create or replace function public.quiz_scores_after_identity() returns trigger
language plpgsql security definer set search_path='' as $$declare display text; begin
  if new.email_confirmed_at is not null and not coalesce(new.is_anonymous,false)
    and (old.email_confirmed_at is null or coalesce(old.is_anonymous,false)) then perform public.quiz_project_scores(new.id);
  else
    display:=left(coalesce(nullif(btrim(new.raw_user_meta_data->>'display_name'),''),'Spieler'),40);
    update public.quiz_shared_scores set player_name=display where owner_id=new.id and player_name is distinct from display;
  end if;
  return new;
end$$;

create function quiz_sync_internal.players(sort_by text,selected_genre text,selected_difficulty text,page_offset integer)
returns table(player_name text,completed bigint,answered bigint,correct bigint,accuracy numeric,place bigint,is_mine boolean,experience bigint)
language sql stable security definer set search_path='' set jit=off as $$
  with totals as (
    select u.id as owner_id,coalesce(nullif(left(btrim(u.raw_user_meta_data->>'display_name'),40),''),'Spieler') as name,
      coalesce(t.completed,0) as rounds,coalesce(t.answered,0) as answers,coalesce(t.correct,0) as hits,
      coalesce(xp.experience,0) as career_xp,
      case when t.answered>0 then 100.0*t.correct/t.answered else null end as ratio
    from auth.users u left join public.quiz_player_totals t on t.owner_id=u.id and t.genre=selected_genre and t.difficulty=selected_difficulty
      left join public.quiz_player_totals xp on xp.owner_id=u.id and xp.genre='' and xp.difficulty=''
    where u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
      and (t.completed>0 or (selected_genre='' and selected_difficulty='')) and (sort_by<>'accuracy' or t.answered>=50)
  ), ranked as (
    select t.*,rank() over(order by case sort_by when 'rounds' then rounds when 'correct' then hits when 'experience' then career_xp else ratio end desc nulls last) as position from totals t
  ) select name,rounds,answers,hits,round(ratio,1),position,coalesce(owner_id=auth.uid() and public.quiz_verified_user(),false),career_xp
    from ranked order by position,name,owner_id limit 50 offset greatest(0,coalesce(page_offset,0));
$$;
create or replace function public.quiz_players(sort_by text default 'rounds',selected_genre text default '',selected_difficulty text default '',page_offset integer default 0)
returns table(player_name text,completed bigint,answered bigint,correct bigint,accuracy numeric,place bigint,is_mine boolean,experience bigint)
language plpgsql stable security definer set search_path='' as $$begin
  if auth.uid() is null or not public.quiz_verified_user() then raise exception 'authentication_required'; end if;
  if sort_by is null or sort_by not in ('rounds','correct','accuracy','experience') then raise exception 'invalid_sort'; end if;
  if sort_by='experience' then selected_genre:=''; selected_difficulty:=''; end if;
  return query select * from quiz_sync_internal.players(sort_by,selected_genre,selected_difficulty,page_offset);
end$$;
create or replace function public.quiz_public_players(sort_by text default 'experience',page_offset integer default 0)
returns table(player_name text,completed bigint,answered bigint,correct bigint,accuracy numeric,place bigint,is_mine boolean,experience bigint)
language plpgsql stable security definer set search_path='' as $$begin
  if sort_by is null or sort_by not in ('rounds','correct','accuracy','experience') then raise exception 'invalid_sort'; end if;
  return query select * from quiz_sync_internal.players(sort_by,'','',page_offset);
end$$;
create or replace function public.quiz_rankings(selected_category text,page_offset integer default 0)
returns table(player_name text,points integer,correct integer,elapsed_ms bigint,finished_at double precision,place bigint,is_mine boolean,experience bigint)
language sql stable security definer set search_path='' as $$
  select s.player_name,s.points,s.correct,s.elapsed_ms,s.finished_at,rank() over(order by s.points desc),s.owner_id=auth.uid(),coalesce(xp.experience,0)
  from public.quiz_shared_scores s join auth.users u on u.id=s.owner_id
    left join public.quiz_player_totals xp on xp.owner_id=s.owner_id and xp.genre='' and xp.difficulty=''
  where public.quiz_verified_user() and s.category=selected_category and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
  order by s.points desc,s.finished_at,s.owner_id,s.round_id limit 50 offset greatest(coalesce(page_offset,0),0);
$$;
revoke all on function quiz_sync_internal.project_round(uuid,uuid,jsonb,jsonb),quiz_sync_internal.project_legacy(uuid,jsonb,jsonb),quiz_sync_internal.players(text,text,text,integer),quiz_sync_internal.project_record(uuid,jsonb,jsonb) from public,anon,authenticated;
-- Existing RPC grants and verification gates are preserved by replacement.
do $$declare player uuid;begin for player in select owner_id from public.quiz_saves loop perform public.quiz_project_scores(player);end loop;end$$;
notify pgrst,'reload schema';
commit;
