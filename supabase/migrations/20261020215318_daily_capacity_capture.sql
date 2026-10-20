begin;
-- Uses the existing daily job after an actual service result is recorded.
-- No extra public RPC, endpoint, scheduler or player telemetry.
create function quiz_ops.capture_capacity_after_check() returns trigger
language plpgsql set search_path='' as $$begin
 perform quiz_ranked_internal.prune_receipts();
 perform quiz_capacity_internal.capture_sample();
 return null;
end$$;
create trigger service_capacity_capture after insert on quiz_ops.service_checks
for each statement execute function quiz_ops.capture_capacity_after_check();
revoke all on function quiz_ops.capture_capacity_after_check() from public,anon,authenticated,service_role;
commit;
