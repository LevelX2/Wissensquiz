-- Index answer occurrences once per completed run, including long endless runs.
begin;
create or replace function quiz_sync_internal.project_round(player uuid,target uuid,input_round jsonb,input_events jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare round_key text:=input_round->>'id'; prior jsonb; next_rows jsonb; item jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('genre',c.genre,'difficulty',c.difficulty,'completed',c.completed,'answered',c.answered,'correct',c.correct) order by c.genre,c.difficulty),'[]')
    into prior from public.quiz_round_contributions c where c.owner_id=player and c.round_id=round_key;
  if input_round->>'status'='completed' and input_round->>'mode' in ('rekord','entdecken','ueben','fehler','fehlerfrei','zeitkonto') then
    with questions as (
      select q,ordinal,coalesce(nullif(q->'metadata'->>'subdomain',''),q->>'domain') as genre,q->>'difficulty' as difficulty
      from jsonb_array_elements(input_round->'questions') with ordinality questions(q,ordinal)
    ), event_lookup as (
      select coalesce(jsonb_object_agg(e->>'id',e order by ordinal desc),'{}') as by_id
      from jsonb_array_elements(input_events) with ordinality events(e,ordinal)
      where e->>'id' is not null and e->>'roundId'=round_key
    ), expanded as (
      select q.q,g.genre,d.difficulty,lookup.by_id->(input_round->'events'->>((q.ordinal-1)::integer)) as event
      from questions q cross join event_lookup lookup
      cross join lateral (select distinct unnest(array['',q.genre]) as genre) g
      cross join lateral (select distinct unnest(array['',q.difficulty]) as difficulty) d
    ), counts as (
      select genre,difficulty,1::bigint as completed,
        count(*) filter(where event->>'answerId' is not null or (event->'dontKnow'='true'::jsonb and
          (input_round->>'mode' not in ('rekord','fehlerfrei','zeitkonto') or case when event->>'elapsedMs' ~ '^[0-9]+([.][0-9]+)?$' then (event->>'elapsedMs')::numeric<30000 else false end))) as answered,
        count(*) filter(where event->>'answerId'=q->>'correctId' and
          (input_round->>'mode' not in ('rekord','fehlerfrei','zeitkonto') or case when event->>'elapsedMs' ~ '^[0-9]+([.][0-9]+)?$' then (event->>'elapsedMs')::numeric<30000 else false end)) as correct
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


revoke all on function quiz_sync_internal.project_round(uuid,uuid,jsonb,jsonb) from public,anon,authenticated;
notify pgrst, 'reload schema';
commit;
