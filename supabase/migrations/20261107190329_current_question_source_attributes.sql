begin;

-- Read a metadata value from the current questions-field-refs-v1 encoding.
-- An encoded reference to an empty answer feedback is not a person identity.
create function quiz_game_internal.packed_question_person_id(packed jsonb)
returns text language sql immutable strict set search_path='' as $$
 select case jsonb_typeof(packed->'metadata'->'person_id')
 when 'string' then packed->'metadata'->>'person_id'
 when 'number' then jsonb_build_array(
  packed->>'id',packed->>'knowledgeId',packed->>'language',packed->>'domain',
  packed->>'difficulty',packed->>'question',packed->>'explanation',packed->>'context','',
  packed->'answers'->0->>'text',packed->'answers'->0->>'feedback',
  packed->'answers'->1->>'text',packed->'answers'->1->>'feedback',
  packed->'answers'->2->>'text',packed->'answers'->2->>'feedback',
  packed->'answers'->3->>'text',packed->'answers'->3->>'feedback'
 )->>((packed->'metadata'->>'person_id')::integer)
 end
$$;
revoke all on function quiz_game_internal.packed_question_person_id(jsonb) from public,anon,authenticated;

create or replace function quiz_game_internal.refresh_secure_goal(player uuid,target uuid,goal_id text default null)
returns void language plpgsql set search_path='' as $$
begin
 delete from quiz_game_internal.secure_goals
 where owner_id=player and generation=target and (goal_id is null or goal=goal_id);
 insert into quiz_game_internal.secure_goals
 select distinct player,target,e.value->>'knowledgeId',
  case when coalesce(q->'metadata'->>'person_id','')<>'' or
   coalesce(quiz_game_internal.packed_question_person_id(o.content::jsonb->0),'')<>'' then 'Schauspieler'
  when q->'tags' ? 'Preisträger' or o.content::jsonb->0->'tags' ? 'Preisträger' then 'Preisträger'
  else coalesce(q->'metadata'->>'subdomain',q->>'domain') end,q->>'difficulty'
 from public.quiz_sync_entries e
 join public.quiz_sync_entries r on r.owner_id=e.owner_id and r.generation=e.generation
  and r.kind='round' and r.id=e.round_id and not r.deleted
 cross join lateral jsonb_array_elements(r.value->'questions') q
 left join public.quiz_private_catalog_objects o on o.owner_id=player and o.generation=target and o.hash=q->'ref'->>'object'
 where e.owner_id=player and e.generation=target and e.kind='event' and not e.deleted
  and (goal_id is null or e.value->>'knowledgeId'=goal_id)
  and r.value->>'status'='completed' and q->>'id'=e.value->>'questionId'
  and e.value->>'correct'='true' and e.value->>'guessed'='false' and e.value->>'answerId' is not null;
end$$;

commit;
