begin;
-- Private compact counters, maintained with source entry changes. Profile reads
-- one row, not the account event/round history or any question catalog.
create table quiz_game_internal.profile_totals(owner_id uuid not null,generation uuid not null,played bigint not null default 0,completed bigint not null default 0,answered bigint not null default 0,correct bigint not null default 0,record_rounds bigint not null default 0,encountered bigint not null default 0,primary key(owner_id,generation),foreign key(owner_id,generation) references public.quiz_sync_generations(owner_id,id) on delete cascade);
create table quiz_game_internal.profile_questions(owner_id uuid not null,generation uuid not null,id text not null,refs bigint not null check(refs>0),goal text not null,answered bigint not null default 0,correct bigint not null default 0,guessed_correct bigint not null default 0,primary key(owner_id,generation,id),foreign key(owner_id,generation) references public.quiz_sync_generations(owner_id,id) on delete cascade);
alter table quiz_game_internal.profile_totals enable row level security;
alter table quiz_game_internal.profile_questions enable row level security;
revoke all on quiz_game_internal.profile_totals,quiz_game_internal.profile_questions from public,anon,authenticated;
create function quiz_game_internal.profile_entry() returns trigger language plpgsql security definer set search_path='' as $$
declare prior jsonb; next jsonb; player uuid; target uuid; old_q text; new_q text; remaining bigint; delta_known integer:=0;
 old_answer integer:=0; new_answer integer:=0;
begin
 if tg_op='DELETE' then player:=old.owner_id;target:=old.generation;else player:=new.owner_id;target:=new.generation;end if;
 if not exists(select 1 from public.quiz_sync_generations where owner_id=player and id=target) then return null;end if;
 if tg_op<>'INSERT' and not old.deleted then prior:=old.value;end if;
 if tg_op<>'DELETE' and not new.deleted then next:=new.value;end if;
 if prior is not distinct from next then return null;end if;
 insert into quiz_game_internal.profile_totals(owner_id,generation) values(player,target) on conflict do nothing;
 if coalesce(new.kind,old.kind)='round' then
  update quiz_game_internal.profile_totals set played=played+(next is not null)::integer-(prior is not null)::integer,
   completed=completed+coalesce((next->>'status'='completed')::integer,0)-coalesce((prior->>'status'='completed')::integer,0),
   record_rounds=record_rounds+coalesce((next->>'status'='completed' and next->>'mode' in ('rekord','fehlerfrei','zeitkonto'))::integer,0)-coalesce((prior->>'status'='completed' and prior->>'mode' in ('rekord','fehlerfrei','zeitkonto'))::integer,0)
  where owner_id=player and generation=target;
 else
  old_answer:=case when prior->>'answerId' is not null or prior->>'dontKnow'='true' then 1 else 0 end;
  new_answer:=case when next->>'answerId' is not null or next->>'dontKnow'='true' then 1 else 0 end;
  old_q:=prior->>'questionId'; new_q:=next->>'questionId';
  if old_q is distinct from new_q then
   if old_q is not null then
    select refs into remaining from quiz_game_internal.profile_questions where owner_id=player and generation=target and id=old_q for update;
    if remaining=1 then delete from quiz_game_internal.profile_questions where owner_id=player and generation=target and id=old_q;delta_known:=delta_known-1;
    else update quiz_game_internal.profile_questions set answered=answered-old_answer,correct=correct-case when prior->>'correct'='true' then old_answer else 0 end,guessed_correct=guessed_correct-case when prior->>'correct'='true' and prior->>'guessed'='true' then old_answer else 0 end,refs=refs-1 where owner_id=player and generation=target and id=old_q;end if;
   end if;
   if new_q is not null then
    insert into quiz_game_internal.profile_questions values(player,target,new_q,1,next->>'knowledgeId',new_answer,case when next->>'correct'='true' then new_answer else 0 end,case when next->>'correct'='true' and next->>'guessed'='true' then new_answer else 0 end) on conflict(owner_id,generation,id) do update set refs=profile_questions.refs+1,answered=profile_questions.answered+excluded.answered,correct=profile_questions.correct+excluded.correct,guessed_correct=profile_questions.guessed_correct+excluded.guessed_correct returning refs into remaining;
    if remaining=1 then delta_known:=delta_known+1;end if;
   end if;
  end if;
  if old_q=new_q then
   update quiz_game_internal.profile_questions set answered=answered+new_answer-old_answer,correct=correct+case when next->>'correct'='true' then new_answer else 0 end-case when prior->>'correct'='true' then old_answer else 0 end,
    guessed_correct=guessed_correct+case when next->>'correct'='true' and next->>'guessed'='true' then new_answer else 0 end-case when prior->>'correct'='true' and prior->>'guessed'='true' then old_answer else 0 end where owner_id=player and generation=target and id=new_q;
  end if;
  update quiz_game_internal.profile_totals set answered=answered+new_answer-old_answer,
   correct=correct+case when next->>'correct'='true' then new_answer else 0 end-case when prior->>'correct'='true' then old_answer else 0 end,
   encountered=encountered+delta_known where owner_id=player and generation=target;
 end if;
 return null;
end$$;
-- Lock source writes before initializing the current materialized projection.
create trigger profile_entry_insert after insert on public.quiz_sync_entries for each row when (new.kind in ('round','event')) execute function quiz_game_internal.profile_entry();
create trigger profile_entry_update after update on public.quiz_sync_entries for each row when (new.kind in ('round','event') or old.kind in ('round','event')) execute function quiz_game_internal.profile_entry();
create trigger profile_entry_delete after delete on public.quiz_sync_entries for each row when (old.kind in ('round','event')) execute function quiz_game_internal.profile_entry();
insert into quiz_game_internal.profile_questions select owner_id,generation,value->>'questionId',count(*),min(value->>'knowledgeId'),count(*) filter(where value->>'answerId' is not null or value->>'dontKnow'='true'),count(*) filter(where (value->>'answerId' is not null or value->>'dontKnow'='true') and value->>'correct'='true'),count(*) filter(where (value->>'answerId' is not null or value->>'dontKnow'='true') and value->>'correct'='true' and value->>'guessed'='true') from public.quiz_sync_entries where kind='event' and not deleted and value->>'questionId' is not null group by owner_id,generation,value->>'questionId';
insert into quiz_game_internal.profile_totals(owner_id,generation,played,completed,answered,correct,record_rounds,encountered)
 select owner_id,generation,count(*) filter(where kind='round'),count(*) filter(where kind='round' and value->>'status'='completed'),
 count(*) filter(where kind='event' and (value->>'answerId' is not null or value->>'dontKnow'='true')),
 count(*) filter(where kind='event' and (value->>'answerId' is not null or value->>'dontKnow'='true') and value->>'correct'='true'),
 count(*) filter(where kind='round' and value->>'status'='completed' and value->>'mode' in ('rekord','fehlerfrei','zeitkonto')),
 count(distinct value->>'questionId') filter(where kind='event')
 from public.quiz_sync_entries where not deleted group by owner_id,generation;
create index profile_questions_goal on quiz_game_internal.profile_questions(owner_id,generation,goal);
create index game_question_goal on quiz_game_internal.questions(run_id,(question->>'knowledgeId')) where event is not null;
create index ranked_question_goal on quiz_ranked_internal.questions(run_id,(question->>'knowledgeId')) where event is not null;
create function quiz_game_internal.question_tally(player uuid,target uuid,qid text,goal_id text) returns jsonb language sql stable set search_path='' as $history$
 with contributions as (
 select id,refs,answered,correct,guessed_correct from quiz_game_internal.profile_questions where owner_id=player and generation=target and goal=goal_id
 union all
 select q.question->>'id',1,case when q.event->>'answerId' is not null or q.event->>'dontKnow'='true' then 1 else 0 end,case when q.event->>'correct'='true' and (q.event->>'answerId' is not null or q.event->>'dontKnow'='true') then 1 else 0 end,case when q.event->>'correct'='true' and q.event->>'guessed'='true' and (q.event->>'answerId' is not null or q.event->>'dontKnow'='true') then 1 else 0 end
 from quiz_game_internal.runs r join quiz_game_internal.questions q on q.run_id=r.id where r.owner_id=player and r.generation=target and r.status='active' and q.question->>'knowledgeId'=goal_id and q.event is not null
 union all
 select q.question->>'id',1,case when q.event->>'answerId' is not null or q.event->>'dontKnow'='true' then 1 else 0 end,case when q.event->>'correct'='true' and (q.event->>'answerId' is not null or q.event->>'dontKnow'='true') then 1 else 0 end,case when q.event->>'correct'='true' and q.event->>'guessed'='true' and (q.event->>'answerId' is not null or q.event->>'dontKnow'='true') then 1 else 0 end
 from quiz_ranked_internal.runs r join quiz_ranked_internal.questions q on q.run_id=r.id where r.owner_id=player and r.status='active' and q.question->>'knowledgeId'=goal_id and q.event is not null
 ), totals as (select is_question,coalesce(sum(refs),0) seen,coalesce(sum(answered),0) answered,coalesce(sum(correct),0) correct,coalesce(sum(guessed_correct),0) guessed from contributions cross join unnest(array[true,false]) is_question where not is_question or id=qid group by is_question), scope as (select value is_question from unnest(array[true,false]) value)
 select jsonb_object_agg(case when s.is_question then 'question' else 'goal' end,jsonb_build_object('seen',coalesce(t.seen,0),'answered',coalesce(t.answered,0),'correct',coalesce(t.correct,0),'wrong',coalesce(t.answered-t.correct,0),'unanswered',coalesce(t.seen-t.answered,0),'guessedCorrect',coalesce(t.guessed,0))) from scope s left join totals t using(is_question)
$history$;
do $patch$declare d text;original text;begin
 original:=pg_get_functiondef('quiz_game_internal.view(text)'::regprocedure);
 d:=replace(original,'if action=''info'' then','if action=''question-history'' then return quiz_game_internal.question_tally(player,target,req->>''scope'',req->>''topic'');end if;if action=''profile-stats'' then select jsonb_build_object(''played'',played,''completed'',completed,''answered'',answered,''correct'',correct,''encountered'',encountered,''recordRounds'',record_rounds,''accuracy'',case when answered=0 then null else round(100.0*correct/answered) end) into result from quiz_game_internal.profile_totals where owner_id=player and generation=target;return coalesce(result,jsonb_build_object(''played'',0,''completed'',0,''answered'',0,''correct'',0,''encountered'',0,''recordRounds'',0,''accuracy'',null));end if;if action=''info'' then');
 if d=original then raise exception 'profile_view_patch_missing';end if;execute d;
end$patch$;
revoke all on all functions in schema quiz_game_internal from public,anon,authenticated;
commit;
