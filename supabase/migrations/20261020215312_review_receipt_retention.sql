begin;
-- A request may be retried while its run is active and for at least seven days
-- after closure. One start identity belongs to the durable run, so pruning a
-- technical reply can never silently execute that start again.
alter table quiz_ranked_internal.runs add column start_request_id uuid;
create unique index ranked_start_request on quiz_ranked_internal.runs(owner_id,start_request_id);
create index ranked_closed_retention on quiz_ranked_internal.runs(owner_id,finished_at,id) where status<>'active';
create index ranked_receipt_run on quiz_ranked_internal.receipts(owner_id,((response#>>'{run,id}')::uuid));

create function quiz_ranked_internal.prune_receipts(player uuid default null) returns bigint
language plpgsql set search_path='' as $$
declare removed bigint;
begin
 delete from quiz_ranked_internal.receipts c using quiz_ranked_internal.runs r
 where r.id=(c.response#>>'{run,id}')::uuid and r.owner_id=c.owner_id
 and (player is null or c.owner_id=player) and r.status<>'active'
 and r.finished_at<clock_timestamp()-interval '7 days';
 get diagnostics removed=row_count;
 return removed;
end$$;
create function quiz_ranked_internal.prune_after_receipt() returns trigger
language plpgsql set search_path='' as $$begin
 perform quiz_ranked_internal.prune_receipts(new.owner_id);
 return new;
end$$;
create trigger ranked_receipt_retention after insert on quiz_ranked_internal.receipts
for each row execute function quiz_ranked_internal.prune_after_receipt();

do $patch$declare original text; d text;begin
 original:=pg_get_functiondef('quiz_ranked_internal.call(text)'::regprocedure);
 d:=replace(original,'solution_display,category)', 'solution_display,category,start_request_id)');
 d:=replace(d,'::text) returning * into r;', '::text,request_id) returning * into r;');
 if d=original or position('category,start_request_id)' in d)=0 then raise exception 'ranked_start_identity_hook_missing';end if;
 original:=d;
 d:=replace(d,'insert into quiz_ranked_internal.limits values(p,stamp,1,case when action=''start'' then 1 else 0 end)',
 'if exists(select 1 from quiz_ranked_internal.runs where owner_id=p and start_request_id=request_id)
 or (action<>''start'' and exists(select 1 from quiz_ranked_internal.runs where owner_id=p and id=(req->>''runId'')::uuid
 and status<>''active'' and finished_at<stamp-interval ''7 days'')) then raise exception ''ranked_request_expired''; end if;
 insert into quiz_ranked_internal.limits values(p,stamp,1,case when action=''start'' then 1 else 0 end)');
 if d=original then raise exception 'ranked_expiry_hook_missing';end if;
 execute d;
end$patch$;
revoke all on function quiz_ranked_internal.prune_receipts(uuid),quiz_ranked_internal.prune_after_receipt() from public,anon,authenticated,service_role;
commit;
