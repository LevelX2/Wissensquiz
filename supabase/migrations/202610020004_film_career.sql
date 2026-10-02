-- Public training career totals only; full saves and identities stay private.
begin;
create function public.quiz_career_experience(snapshot jsonb) returns bigint
language plpgsql immutable set search_path = '' as $$
declare completed bigint; legacy_xp bigint; legacy_level bigint;
begin
  if snapshot->'career'->>'version'='1' and snapshot->>'experience' ~ '^[0-9]+$'
    and length(snapshot->>'experience')<=10 then
    if (snapshot->>'experience')::bigint <= 3000000000 then
      return (snapshot->>'experience')::bigint;
    end if;
  end if;
  select count(*) into completed
  from jsonb_array_elements(case when jsonb_typeof(snapshot->'rounds')='array' then snapshot->'rounds' else '[]'::jsonb end) r
  where r->>'status'='completed' and r->>'mode' in ('rekord','entdecken','ueben','fehler');
  legacy_xp := completed*10;
  legacy_level := 1+legacy_xp/100;
  return 25*(legacy_level-1)*(legacy_level+2) + (legacy_xp%100)*(100+50*(legacy_level-1))/100;
end;
$$;
revoke all on function public.quiz_career_experience(jsonb) from public,anon,authenticated;

-- Return shape changes need drop/recreate; grants are reapplied in this transaction.
drop function public.quiz_players(text,text,text,integer);
create or replace function public.quiz_players(sort_by text default 'rounds', selected_genre text default '', selected_difficulty text default '', page_offset integer default 0)
returns table(player_name text, completed bigint, answered bigint, correct bigint, accuracy numeric, place bigint, is_mine boolean, experience bigint)
language plpgsql stable security definer set search_path = '' set jit = off as $$
begin
  if auth.uid() is null or not public.quiz_verified_user() then raise exception 'authentication_required'; end if;
  if sort_by not in ('rounds','correct','accuracy','experience') then raise exception 'invalid_sort'; end if;
  if sort_by='experience' then selected_genre:=''; selected_difficulty:=''; end if;
  return query
  with participants as materialized (
    select u.id as owner_id, s.state->'rounds' as saved_rounds, s.state->'events' as saved_events, public.quiz_career_experience(s.state) as career_xp,
      coalesce(nullif(left(btrim(u.raw_user_meta_data->>'display_name'),40),''),'Spieler') as name
    from auth.users u left join public.quiz_saves s on s.owner_id=u.id
    where u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
  ), answers_by_question as materialized (
    select distinct on (p.owner_id, e.value->>'roundId', e.value->>'questionId')
      p.owner_id, e.value->>'roundId' as round_id, e.value->>'questionId' as question_id, e.value as event
    from participants p
    cross join lateral jsonb_array_elements(case when jsonb_typeof(p.saved_events)='array' then p.saved_events else '[]'::jsonb end) with ordinality e(value, ordinal)
    where e.value->>'roundId' is not null and e.value->>'questionId' is not null
    order by p.owner_id, e.value->>'roundId', e.value->>'questionId', e.ordinal
  ), questions as (
    select p.owner_id, r->>'id' as round_id, r->>'mode' as mode, q
    from participants p
    cross join lateral jsonb_array_elements(case when jsonb_typeof(p.saved_rounds)='array' then p.saved_rounds else '[]'::jsonb end) r
    cross join lateral jsonb_array_elements(case when jsonb_typeof(r->'questions')='array' then r->'questions' else '[]'::jsonb end) q
    where r->>'status'='completed' and r->>'mode' in ('rekord','entdecken','ueben','fehler')
      and (selected_genre='' or coalesce(nullif(q->'metadata'->>'subdomain',''),q->>'domain')=selected_genre)
      and (selected_difficulty='' or q->>'difficulty'=selected_difficulty)
  ), totals as (
    select q.owner_id, count(distinct q.round_id) as rounds,
      count(*) filter(where e.event->>'answerId' is not null or
        (e.event->'dontKnow'='true'::jsonb and
          (q.mode<>'rekord' or case when e.event->>'elapsedMs' ~ '^[0-9]+([.][0-9]+)?$' then (e.event->>'elapsedMs')::numeric<30000 else false end))) as answers,
      count(*) filter(where e.event->>'answerId'=q.q->>'correctId' and
        (q.mode<>'rekord' or case when e.event->>'elapsedMs' ~ '^[0-9]+([.][0-9]+)?$' then (e.event->>'elapsedMs')::numeric<30000 else false end)) as hits
    from questions q
    left join answers_by_question e on e.owner_id=q.owner_id and e.round_id=q.round_id and e.question_id=q.q->>'id'
    group by q.owner_id
  ), all_totals as (
    select p.owner_id,p.name,p.career_xp,coalesce(t.rounds,0) as rounds,coalesce(t.answers,0) as answers,coalesce(t.hits,0) as hits
    from participants p left join totals t on t.owner_id=p.owner_id
    where t.owner_id is not null or (selected_genre='' and selected_difficulty='')
  ), measured as (
    select t.*,case when answers>0 then 100.0*hits/answers else null end as ratio
    from all_totals t where sort_by<>'accuracy' or answers>=50
  ), ranked as (
    select m.*,rank() over(order by case sort_by when 'rounds' then rounds when 'correct' then hits when 'experience' then career_xp else ratio end desc nulls last) as position
    from measured m
  )
  select name,rounds,answers,hits,round(ratio,1),position,owner_id=auth.uid(),career_xp
  from ranked order by position,name,owner_id limit 50 offset greatest(0,coalesce(page_offset,0));
end;
$$;
revoke all on function public.quiz_players(text,text,text,integer) from public,anon;
grant execute on function public.quiz_players(text,text,text,integer) to authenticated;

drop function public.quiz_rankings(text,integer);
create function public.quiz_rankings(selected_category text, page_offset integer default 0)
returns table(player_name text,points integer,correct integer,elapsed_ms bigint,finished_at double precision,place bigint,is_mine boolean,experience bigint)
language sql stable security definer set search_path = '' as $$
  select s.player_name,s.points,s.correct,s.elapsed_ms,s.finished_at,
    rank() over(order by s.points desc),s.owner_id=auth.uid(),public.quiz_career_experience(saved.state)
  from public.quiz_shared_scores s join auth.users u on u.id=s.owner_id
  left join public.quiz_saves saved on saved.owner_id=s.owner_id
  where public.quiz_verified_user() and s.category=selected_category
    and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
  order by s.points desc,s.finished_at,s.owner_id,s.round_id
  limit 50 offset greatest(coalesce(page_offset,0),0);
$$;
revoke all on function public.quiz_rankings(text,integer) from public,anon;
grant execute on function public.quiz_rankings(text,integer) to authenticated;
notify pgrst, 'reload schema';
commit;
