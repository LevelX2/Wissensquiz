begin;
alter table quiz_game_internal.questions add column learning_before jsonb;
create or replace function quiz_game_internal.issue(r quiz_game_internal.runs) returns jsonb language plpgsql set search_path='' as $$
declare q quiz_game_internal.questions; content jsonb; previous jsonb;
begin
 select * into q from quiz_game_internal.questions where run_id=r.id and index=r.answered;
 if not found then
  select public.quiz_year_question(c.question) into strict content from quiz_ranked_internal.catalog c where release_hash=r.release_hash and id=r.queue[r.answered+1];
  select value into previous from public.quiz_sync_entries where owner_id=r.owner_id and generation=r.generation and kind='learning' and id=content->>'knowledgeId' and not deleted;
  insert into quiz_game_internal.questions(run_id,index,question,answer_order,learning_before) values(r.id,r.answered,content,
   (select jsonb_agg(a->>'id' order by gen_random_uuid()) from jsonb_array_elements(content->'answers') a),previous) returning * into q;
 end if;
 return jsonb_build_object('index',q.index,'nonce',q.nonce,'question',quiz_ranked_internal.visible(q.question),'order',q.answer_order);
end$$;
do $patch$ declare definition text; original text; begin
 select pg_get_functiondef('quiz_game_internal.call(text)'::regprocedure) into original;
 definition:=replace(original,'''event'',t.event)', '''event'',t.event,''before'',t.learning_before)');
 definition:=replace(definition,'''event'',event))','''event'',event,''before'',q.learning_before))');
 if definition=original then raise exception 'game_review_call_patch_missing'; end if;
 execute definition;
 select pg_get_functiondef('quiz_game_internal.view(text)'::regprocedure) into original;
 definition:=replace(original,'elsif action=''summary'' then',
 'elsif action=''round-repetitions'' then
  zone:=coalesce(req->>''timezone'',''UTC'');
  if not exists(select 1 from pg_timezone_names where name=zone) then raise exception ''invalid_game_timezone''; end if;
  with goals as (
   select distinct m.knowledge_id from public.quiz_sync_entries e
   join quiz_game_internal.catalog_meta m on m.knowledge_id=e.value->>''knowledgeId'' and m.source=''film''
   where e.owner_id=player and e.generation=target and e.kind=''event'' and not e.deleted and e.round_id=req->>''scope''
  ), times as materialized (
   select quiz_game_internal.next_at(l.value,stamp,zone) next_at from goals g join public.quiz_sync_entries l
   on l.owner_id=player and l.generation=target and l.kind=''learning'' and l.id=g.knowledge_id and not l.deleted
  )
  select jsonb_build_object(''due'',count(*) filter(where times.next_at<=stamp),''nextAt'',min(times.next_at) filter(where times.next_at>stamp)) into result from times;
  return result;
 elsif action=''summary'' then');
 if definition=original then raise exception 'game_review_view_patch_missing'; end if;
 execute definition;
end$patch$;
revoke all on all functions in schema quiz_game_internal from public,anon,authenticated;
commit;
