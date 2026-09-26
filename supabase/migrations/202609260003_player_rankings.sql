begin;
-- Aggregate only voluntarily shared saves; return no private identifiers or events.
create function public.quiz_players(sort_by text default 'rounds', selected_genre text default '', selected_difficulty text default '', page_offset integer default 0)
returns table(player_name text, completed bigint, answered bigint, correct bigint, accuracy numeric, place bigint, is_mine boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.quiz_verified_user() then raise exception 'authentication_required'; end if;
  if sort_by not in ('rounds','correct','accuracy') then raise exception 'invalid_sort'; end if;
  return query
  with participants as (
    select s.owner_id, s.state, coalesce(nullif(left(btrim(u.raw_user_meta_data->>'display_name'),40),''),'Spieler') as name
    from public.quiz_saves s join public.quiz_sharing p on p.owner_id=s.owner_id and p.enabled
    join auth.users u on u.id=s.owner_id and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
  ), questions as (
    select p.owner_id,p.name,r->>'id' as round_id,r->>'mode' as mode,q,
      p.state->'events' as events
    from participants p
    cross join lateral jsonb_array_elements(case when jsonb_typeof(p.state->'rounds')='array' then p.state->'rounds' else '[]'::jsonb end) r
    cross join lateral jsonb_array_elements(case when jsonb_typeof(r->'questions')='array' then r->'questions' else '[]'::jsonb end) q
    where r->>'status'='completed' and r->>'mode' in ('rekord','entdecken','ueben')
      and (selected_genre='' or coalesce(nullif(q->'metadata'->>'subdomain',''),q->>'domain')=selected_genre)
      and (selected_difficulty='' or q->>'difficulty'=selected_difficulty)
  ), totals as (
    select q.owner_id,q.name,count(distinct q.round_id) as rounds,
      count(*) filter(where e->>'answerId' is not null) as answers,
      count(*) filter(where e->>'answerId'=q.q->>'correctId' and
        (q.mode<>'rekord' or case when e->>'elapsedMs' ~ '^[0-9]+([.][0-9]+)?$' then (e->>'elapsedMs')::numeric<30000 else false end)) as hits
    from questions q
    left join lateral (
      select value as e from jsonb_array_elements(case when jsonb_typeof(q.events)='array' then q.events else '[]'::jsonb end)
      where value->>'roundId'=q.round_id and value->>'questionId'=q.q->>'id' limit 1
    ) chosen on true
    group by q.owner_id,q.name
  ), measured as (
    select t.*,case when answers>0 then 100.0*hits/answers else null end as ratio
    from totals t where sort_by<>'accuracy' or answers>=50
  ), ranked as (
    select m.*,rank() over(order by case sort_by when 'rounds' then rounds when 'correct' then hits else ratio end desc nulls last) as position
    from measured m
  )
  select name,rounds,answers,hits,round(ratio,1),position,owner_id=auth.uid()
  from ranked order by position,name,owner_id limit 50 offset greatest(0,coalesce(page_offset,0));
end;
$$;
revoke all on function public.quiz_players(text,text,text,integer) from public,anon;
grant execute on function public.quiz_players(text,text,text,integer) to authenticated;
notify pgrst, 'reload schema';
commit;
