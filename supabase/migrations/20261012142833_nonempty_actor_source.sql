-- An empty CSV person_id is not an actor identity. Keep source selection
-- consistent with the client without changing questions, answers or learning IDs.
begin;
select pg_advisory_xact_lock(hashtextextended('quiz_current_content',0));

do $definitions$
declare signature text; definition text; updated text;
begin
 foreach signature in array array[
  'quiz_game_internal.activate_content(text,integer,jsonb)',
  'quiz_game_internal.refresh_secure_goal(uuid,uuid,text)',
  'quiz_ranked_internal.fact(jsonb)',
  'quiz_ranked_internal.visible(jsonb)'
 ] loop
  definition:=pg_get_functiondef(signature::regprocedure);
  updated:=replace(definition,$old$q->'metadata' ? 'person_id'$old$,$new$coalesce(q->'metadata'->>'person_id','')<>''$new$);
  updated:=replace(updated,$old$question->'metadata' ? 'person_id'$old$,$new$coalesce(question->'metadata'->>'person_id','')<>''$new$);
  updated:=replace(updated,$old$o.content::jsonb->0->'metadata' ? 'person_id'$old$,$new$coalesce(o.content::jsonb->0->'metadata'->>'person_id','')<>''$new$);
  if updated=definition then raise exception 'actor_source_predicate_missing: %',signature;end if;
  execute updated;
 end loop;
end$definitions$;

-- Prepare the affected current content once; no catalog scan per player request.
create temporary table actor_source_fix on commit drop as
 select c.* from quiz_ranked_internal.catalog c
 where source='actors' and coalesce(question->'metadata'->>'person_id','')='';

-- Lock account writes before checking that private source entries stay intact.
do $repair$
declare h record; progress jsonb; earned jsonb; rev bigint; before_hash text; after_hash text;
begin
 if not exists(select 1 from actor_source_fix) then return;end if;
 perform 1 from public.quiz_account_heads for update;
 select md5(coalesce(string_agg(md5(row_to_json(e)::text),'' order by owner_id,generation,kind,id),'')) into before_hash
  from public.quiz_sync_entries e where not(kind='field' and id='journey');

 update quiz_ranked_internal.catalog c set source=case when c.question->'tags' ? 'Preisträger' then 'awards' else 'film' end
  from actor_source_fix f where c.release_hash=f.release_hash and c.id=f.id;
 perform quiz_game_internal.refresh_content();

 -- Questions already issued to a duel or learning round retain their sequence.
 insert into public.quiz_duel_catalog(id,knowledge_id,difficulty,genre,familiarity,question,enabled)
 select c.id,c.knowledge_id,c.difficulty,c.genre,coalesce(f.level,0),c.question,true
 from quiz_ranked_internal.catalog c join actor_source_fix changed on changed.id=c.id and changed.release_hash=c.release_hash
 left join quiz_game_internal.familiarity f on f.film=(c.question->'metadata'->>'film_title_original')||'|'||(c.question->'metadata'->>'film_year')
 where c.difficulty in ('leicht','mittel','schwer') and c.question->>'demo'='false'
 on conflict(id) do nothing;

 for h in select owner_id,generation from public.quiz_account_heads where generation is not null loop
  perform quiz_game_internal.refresh_secure_goal(h.owner_id,h.generation);
  progress:=quiz_game_internal.journey(h.owner_id,h.generation);
  select jsonb_object_agg(key,jsonb_build_object('difficulty',case when (value->>'expertUnlocked')::boolean then 3 when (value->>'hardUnlocked')::boolean then 2 when (value->>'mediumUnlocked')::boolean then 1 else 0 end,'familiarity',value->'familiarity')) into earned from jsonb_each(progress);
  update public.quiz_account_heads set revision=revision+1 where owner_id=h.owner_id returning revision into rev;
  update public.quiz_sync_entries set value=jsonb_build_object('version',1,'earned',coalesce(earned,'{}'),'independentAreas',true),changed_revision=rev
   where owner_id=h.owner_id and generation=h.generation and kind='field' and id='journey' and not deleted;
 end loop;
 select md5(coalesce(string_agg(md5(row_to_json(e)::text),'' order by owner_id,generation,kind,id),'')) into after_hash
  from public.quiz_sync_entries e where not(kind='field' and id='journey');
 if after_hash is distinct from before_hash then raise exception 'actor_source_private_entries_changed';end if;
end$repair$;
commit;
