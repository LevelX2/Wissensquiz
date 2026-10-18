-- Test-only helpers for a fresh, isolated loopback database. Never deploy.
create schema bench;
create table bench.metrics(scenario text, operation text, ms numeric, response_bytes integer);
create table bench.scenario(name text);
insert into bench.scenario values('short');
create function bench.player(n integer) returns uuid language sql immutable set search_path='' as $$
 select ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid
$$;
create function bench.call_game(body jsonb, is_view boolean default false) returns jsonb language plpgsql set search_path='' as $$
declare started timestamptz:=clock_timestamp(); reply jsonb;
begin
 if is_view then reply:=public.quiz_game_view(body::text); else reply:=public.quiz_game_call(body::text); end if;
 insert into bench.metrics select name,case when is_view then 'view_' else 'game_' end||(body->>'action'),
  extract(epoch from clock_timestamp()-started)*1000,octet_length(reply::text) from bench.scenario;
 return reply;
end$$;
create function bench.play(n integer) returns void language plpgsql set search_path='' as $$
declare p uuid:=bench.player(n); reply jsonb; run_id text; q jsonb; head public.quiz_account_heads;
 setup jsonb; started timestamptz; boot jsonb; i integer;
begin
 perform set_config('request.jwt.claim.sub',p::text,true);
 -- Calendar is fixed; elapsed SQL durations still use the real server clock.
 perform set_config('quiz.test_now','1792317600000',true);
 setup:=jsonb_build_object('mode','entdecken','topic','Alle Themen','solutionDisplay','question',
  'filters',jsonb_build_object('genres',(select value->'genres' from quiz_game_internal.content_info where id),
  'sources','["film","actors","awards"]'::jsonb,'difficulties','["leicht","mittel","schwer","experte"]'::jsonb,'familiarities','[1,2,3,4]'::jsonb));
 perform bench.call_game((setup-'solutionDisplay')||'{"action":"selection","timezone":"Europe/Berlin"}'::jsonb,true);
 reply:=bench.call_game(jsonb_build_object('action','start','requestId',gen_random_uuid(),'setup',setup,'timezone','Europe/Berlin'));
 run_id:=reply->'run'->>'id';
 for i in 0..(reply->'run'->>'size')::integer-1 loop
  q:=reply->'current';
  reply:=bench.call_game(jsonb_build_object('action','answer','requestId',gen_random_uuid(),'runId',run_id,
   'index',i,'nonce',q->>'nonce','answerId',null,'dontKnow',true,'guessed',false));
  if i+1<(reply->'run'->>'size')::integer then
   reply:=bench.call_game(jsonb_build_object('action','question','requestId',gen_random_uuid(),'runId',run_id,'index',i+1));
  end if;
 end loop;
 perform bench.call_game(jsonb_build_object('action','finish','requestId',gen_random_uuid(),'runId',run_id));
 perform bench.call_game('{"action":"summary"}',true);
 perform bench.call_game('{"action":"topics"}',true);
 select * into strict head from public.quiz_account_heads where owner_id=p;
 started:=clock_timestamp();
 boot:=public.quiz_sync_scope_page(p,head.generation,head.revision,'{"kind":"boot"}','',200);
 insert into bench.metrics select name,'boot',extract(epoch from clock_timestamp()-started)*1000,octet_length(boot::text) from bench.scenario;
end$$;

-- Add 100 * 10 closed historical answers per synthetic account. Current
-- immutable facts are copied; IDs, order and timestamps remain distinct.
-- Rebuild through the real projectors, rather than inventing summary counters.
create function bench.grow_history() returns void language plpgsql set search_path='' as $$
declare h record; original record; e record; historical_round text; event_id text; at bigint;
 event_ids jsonb; round_position integer; event_position integer; target_revision bigint; goal text; j integer; k integer;
begin
 for h in select * from public.quiz_account_heads order by owner_id loop
  select * into strict original from public.quiz_sync_entries where owner_id=h.owner_id and generation=h.generation and kind='round' and not deleted order by position limit 1;
  select coalesce(max(position),-1) into round_position from public.quiz_sync_entries where owner_id=h.owner_id and generation=h.generation and kind='round';
  select coalesce(max(position),-1) into event_position from public.quiz_sync_entries where owner_id=h.owner_id and generation=h.generation and kind='event';
  target_revision:=h.revision+1;
  for j in 1..100 loop
   historical_round:='bench-history-'||j; event_ids:='[]'; k:=0; at:=1792317600000-j::bigint*86400000;
   insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision)
   values(h.owner_id,h.generation,'round',historical_round,round_position+j,
    original.value||jsonb_build_object('id',historical_round,'startedAt',at-20000,'finishedAt',at,'events','[]'::jsonb),target_revision);
   for e in select history.* from public.quiz_sync_entries history where history.owner_id=h.owner_id and history.generation=h.generation and history.kind='event' and history.round_id=original.id order by history.position loop
    k:=k+1; event_id:=historical_round||':'||(e.value->>'knowledgeId'); event_ids:=event_ids||to_jsonb(event_id);
    insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision)
    values(h.owner_id,h.generation,'event',event_id,event_position+(j-1)*10+k,
     e.value||jsonb_build_object('id',event_id,'roundId',historical_round,'at',at-10000+k*500),target_revision);
   end loop;
   update public.quiz_sync_entries set value=jsonb_set(value,'{events}',event_ids) where owner_id=h.owner_id and generation=h.generation and kind='round' and id=historical_round;
  end loop;
  for goal in select distinct value->>'knowledgeId' from public.quiz_sync_entries where owner_id=h.owner_id and generation=h.generation and kind='event' loop
   perform quiz_game_internal.project_goal(h.owner_id,h.generation,goal,target_revision,'Europe/Berlin');
  end loop;
  update public.quiz_account_heads set revision=target_revision where owner_id=h.owner_id;
  perform quiz_game_internal.finish_projection(h.owner_id,h.generation,target_revision);
 end loop;
end$$;
