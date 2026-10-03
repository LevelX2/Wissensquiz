-- Anonymous round counters; no guest profiles, question contents or save data.
begin;
create table public.quiz_guest_activity_config (
  singleton boolean primary key default true check (singleton),
  collection_started_at timestamptz not null default now()
);
insert into public.quiz_guest_activity_config(singleton) values(true);
create table public.quiz_guest_activity_events (
  event_id uuid not null,
  event_kind text not null check(event_kind in ('started','completed')),
  happened_at timestamptz not null,
  answers integer not null check(answers between 0 and 100),
  hits integer not null check(hits between 0 and answers),
  primary key(event_id,event_kind),
  check(event_kind='completed' or (answers=0 and hits=0))
);
create index quiz_guest_activity_time on public.quiz_guest_activity_events(happened_at);
alter table public.quiz_guest_activity_config enable row level security;
alter table public.quiz_guest_activity_events enable row level security;
revoke all on public.quiz_guest_activity_config,public.quiz_guest_activity_events from public,anon,authenticated;

create function public.quiz_report_guest_activity(event_id uuid,event_kind text,happened_at timestamptz,answers integer default 0,hits integer default 0)
returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is not null then raise exception 'guest_only'; end if;
  if event_id is null or event_kind is null or event_kind not in ('started','completed')
    or happened_at is null or happened_at<now()-interval '7 days' or happened_at>now()+interval '5 minutes'
    or answers is null or hits is null or answers not between 0 and 100 or hits not between 0 and answers
    or (event_kind='started' and (answers<>0 or hits<>0)) then raise exception 'invalid_activity'; end if;
  -- Do not backfill history before collection began, including restored saves.
  if happened_at < (select collection_started_at from public.quiz_guest_activity_config) then return; end if;
  delete from public.quiz_guest_activity_events e where e.happened_at<now()-interval '8 days';
  insert into public.quiz_guest_activity_events values(event_id,event_kind,happened_at,answers,hits)
    on conflict do nothing;
end;
$$;
revoke all on function public.quiz_report_guest_activity(uuid,text,timestamptz,integer,integer) from public,authenticated;
grant execute on function public.quiz_report_guest_activity(uuid,text,timestamptz,integer,integer) to anon;

create function public.quiz_guest_activity()
returns table(activity_day date,started bigint,completed bigint,answered bigint,correct bigint,collection_started_at timestamptz)
language sql stable security definer set search_path='' as $$
  with days as (
    select (now() at time zone 'Europe/Berlin')::date-n as day from generate_series(0,6) n
  ), counts as (
    select (e.happened_at at time zone 'Europe/Berlin')::date as day,
      count(*) filter(where e.event_kind='started') as starts,
      count(*) filter(where e.event_kind='completed') as finishes,
      sum(e.answers) as answers,sum(e.hits) as hits
    from public.quiz_guest_activity_events e
    where e.happened_at>=(((now() at time zone 'Europe/Berlin')::date-6)::timestamp at time zone 'Europe/Berlin')
      and e.happened_at<(((now() at time zone 'Europe/Berlin')::date+1)::timestamp at time zone 'Europe/Berlin')
    group by 1
  )
  select d.day,coalesce(c.starts,0),coalesce(c.finishes,0),coalesce(c.answers,0),coalesce(c.hits,0),cfg.collection_started_at
  from days d left join counts c on c.day=d.day cross join public.quiz_guest_activity_config cfg order by d.day desc;
$$;
revoke all on function public.quiz_guest_activity() from public;
grant execute on function public.quiz_guest_activity() to anon,authenticated;

-- The public list returns only the approved name and aggregate training values.
-- Existing authenticated record/filtered ranking RPCs keep their access gates.
create function public.quiz_public_players(sort_by text default 'experience',page_offset integer default 0)
returns table(player_name text,completed bigint,answered bigint,correct bigint,accuracy numeric,place bigint,is_mine boolean,experience bigint)
language plpgsql stable security definer set search_path='' set jit=off as $$
begin
  if sort_by is null or sort_by not in ('rounds','correct','accuracy','experience') then raise exception 'invalid_sort'; end if;
  return query
  with participants as materialized (
    select u.id as owner_id,s.state->'rounds' as saved_rounds,s.state->'events' as saved_events,public.quiz_career_experience(s.state) as career_xp,
      coalesce(nullif(left(btrim(u.raw_user_meta_data->>'display_name'),40),''),'Spieler') as name
    from auth.users u left join public.quiz_saves s on s.owner_id=u.id
    where u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
  ), answers_by_question as materialized (
    select distinct on(p.owner_id,e.value->>'roundId',e.value->>'questionId')
      p.owner_id,e.value->>'roundId' as round_id,e.value->>'questionId' as question_id,e.value as event
    from participants p
    cross join lateral jsonb_array_elements(case when jsonb_typeof(p.saved_events)='array' then p.saved_events else '[]'::jsonb end) with ordinality e(value,ordinal)
    where e.value->>'roundId' is not null and e.value->>'questionId' is not null
    order by p.owner_id,e.value->>'roundId',e.value->>'questionId',e.ordinal
  ), questions as (
    select p.owner_id,r->>'id' as round_id,r->>'mode' as mode,q
    from participants p
    cross join lateral jsonb_array_elements(case when jsonb_typeof(p.saved_rounds)='array' then p.saved_rounds else '[]'::jsonb end) r
    cross join lateral jsonb_array_elements(case when jsonb_typeof(r->'questions')='array' then r->'questions' else '[]'::jsonb end) q
    where r->>'status'='completed' and r->>'mode' in ('rekord','entdecken','ueben','fehler')
  ), totals as (
    select q.owner_id,count(distinct q.round_id) as rounds,
      count(*) filter(where e.event->>'answerId' is not null or (e.event->'dontKnow'='true'::jsonb and
        (q.mode<>'rekord' or case when e.event->>'elapsedMs' ~ '^[0-9]+([.][0-9]+)?$' then (e.event->>'elapsedMs')::numeric<30000 else false end))) as answers,
      count(*) filter(where e.event->>'answerId'=q.q->>'correctId' and
        (q.mode<>'rekord' or case when e.event->>'elapsedMs' ~ '^[0-9]+([.][0-9]+)?$' then (e.event->>'elapsedMs')::numeric<30000 else false end)) as hits
    from questions q left join answers_by_question e on e.owner_id=q.owner_id and e.round_id=q.round_id and e.question_id=q.q->>'id'
    group by q.owner_id
  ), measured as (
    select p.owner_id,p.name,p.career_xp,coalesce(t.rounds,0) as rounds,coalesce(t.answers,0) as answers,coalesce(t.hits,0) as hits,
      case when t.answers>0 then 100.0*t.hits/t.answers else null end as ratio
    from participants p left join totals t on t.owner_id=p.owner_id
    where sort_by<>'accuracy' or t.answers>=50
  ), ranked as (
    select m.*,rank() over(order by case sort_by when 'rounds' then rounds when 'correct' then hits when 'experience' then career_xp else ratio end desc nulls last) as position
    from measured m
  )
  select name,rounds,answers,hits,round(ratio,1),position,coalesce(owner_id=auth.uid() and public.quiz_verified_user(),false),career_xp
  from ranked order by position,name,owner_id limit 50 offset greatest(0,coalesce(page_offset,0));
end;
$$;
revoke all on function public.quiz_public_players(text,integer) from public;
grant execute on function public.quiz_public_players(text,integer) to anon,authenticated;
notify pgrst, 'reload schema';
commit;
