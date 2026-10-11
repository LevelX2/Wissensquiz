begin;
-- Keep each issued answer's authoritative learning result. No replay of an
-- incomplete browser history, and no extra account history in result traffic.
alter table quiz_game_internal.questions add column learning_after jsonb;
alter table quiz_game_internal.questions add column resolved_mistake boolean not null default false;
alter table quiz_game_internal.questions add column first_solved boolean not null default false;
do $patch$declare d text;original text;begin
 original:=pg_get_functiondef('quiz_game_internal.project_goal(uuid,uuid,text,bigint,text)'::regprocedure);
 d:=replace(original,'was_mistake:=mistake;',
 'was_mistake:=mistake;
 if (row.status=''active'' or row.changed_revision=revision) and e->>''roundId'' ~ ''^learn-[0-9a-f-]{36}$'' then
 update quiz_game_internal.questions set learning_after=p,resolved_mistake=was_mistake and safe,first_solved=not discovered and safe
 where run_id=substring(e->>''roundId'' from 7)::uuid and event->>''id''=e->>''id'';
 end if;');
 if d=original then raise exception 'learning_evidence_project_missing';end if;execute d;
 original:=pg_get_functiondef('quiz_game_internal.call(text)'::regprocedure);
 d:=replace(original,'''before'',t.learning_before)', '''before'',t.learning_before,''progress'',jsonb_build_object(''previous'',t.learning_before,''current'',t.learning_after,''resolvedMistake'',t.resolved_mistake,''firstSolved'',t.first_solved))');
 d:=replace(d,'''before'',q.learning_before)', '''before'',q.learning_before,''progress'',(select jsonb_build_object(''previous'',t.learning_before,''current'',t.learning_after,''resolvedMistake'',t.resolved_mistake,''firstSolved'',t.first_solved) from quiz_game_internal.questions t where t.run_id=q.run_id and t.index=q.index))');
 if d=original then raise exception 'learning_evidence_call_missing';end if;execute d;
 original:=pg_get_functiondef('quiz_game_internal.view(text)'::regprocedure);
 d:=replace(original,'select value into result from quiz_game_internal.round_rewards where owner_id=player and generation=target and round_id=req->>''scope'';',
 'select value||jsonb_build_object(''learning'',(select coalesce(jsonb_agg(jsonb_build_object(''eventId'',q.event->>''id'',''previous'',q.learning_before,''current'',q.learning_after,''resolvedMistake'',q.resolved_mistake,''firstSolved'',q.first_solved) order by q.index),''[]'') from quiz_game_internal.runs r join quiz_game_internal.questions q on q.run_id=r.id where r.owner_id=player and r.generation=target and ''learn-''||r.id::text=req->>''scope'')) into result from quiz_game_internal.round_rewards where owner_id=player and generation=target and round_id=req->>''scope'';');
 if d=original then raise exception 'learning_evidence_view_missing';end if;execute d;
end$patch$;
revoke all on all functions in schema quiz_game_internal from public,anon,authenticated;
commit;
