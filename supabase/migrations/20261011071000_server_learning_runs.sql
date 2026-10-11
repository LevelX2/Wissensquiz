-- Learning queues and solutions stay private. A request touches one issued
-- question and one goal; only closing a round writes its bounded archive.
begin;
create table quiz_game_internal.runs(
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 generation uuid not null, release_hash text not null, setup jsonb not null, timezone text not null,
 queue text[] not null check(cardinality(queue) between 1 and 10), answered integer not null default 0,
 status text not null default 'active' check(status in ('active','completed','aborted')),
 started_at timestamptz not null default clock_timestamp(), finished_at timestamptz
);
create unique index game_active on quiz_game_internal.runs(owner_id) where status='active';
create index game_owner_runs on quiz_game_internal.runs(owner_id,started_at desc);
create table quiz_game_internal.questions(
 run_id uuid not null references quiz_game_internal.runs(id) on delete cascade, index integer not null check(index between 0 and 9),
 nonce uuid not null default gen_random_uuid(), question jsonb not null, answer_order jsonb not null,
 issued_at timestamptz not null default clock_timestamp(), event jsonb, primary key(run_id,index)
);
create table quiz_game_internal.receipts(
 owner_id uuid not null references auth.users(id) on delete cascade, request_id uuid not null,
 request text not null, reply jsonb not null, created_at timestamptz not null default clock_timestamp(), primary key(owner_id,request_id)
);
create index game_receipts_age on quiz_game_internal.receipts(owner_id,created_at desc);
create table quiz_game_internal.goal_rewards(
 owner_id uuid not null references auth.users(id) on delete cascade,generation uuid not null,goal text not null,
 xp integer not null, primary key(owner_id,generation,goal)
);
create table quiz_game_internal.event_zones(
 owner_id uuid not null references auth.users(id) on delete cascade,event_id text not null,timezone text not null,primary key(owner_id,event_id)
);
alter table quiz_game_internal.runs enable row level security;
alter table quiz_game_internal.questions enable row level security;
alter table quiz_game_internal.receipts enable row level security;
alter table quiz_game_internal.goal_rewards enable row level security;
alter table quiz_game_internal.event_zones enable row level security;
revoke all on all tables in schema quiz_game_internal from public,anon,authenticated;

create function quiz_game_internal.day_key(stamp bigint,zone text) returns text language sql stable set search_path='' as $$
 select extract(year from d)::integer||'-'||extract(month from d)::integer||'-'||extract(day from d)::integer
 from (select to_timestamp(stamp/1000.0) at time zone zone d) x
$$;
create function quiz_game_internal.next_at(p jsonb,stamp bigint,zone text) returns bigint language sql stable set search_path='' as $$
 select case when p->>'lastAdvancedDay'=quiz_game_internal.day_key(stamp,zone) then greatest((p->>'due')::bigint,
 (extract(epoch from ((to_timestamp(stamp/1000.0) at time zone zone)::date+1)::timestamp at time zone zone)*1000)::bigint)
 else (p->>'due')::bigint end
$$;
create function quiz_game_internal.learn(p jsonb,e jsonb,zone text) returns jsonb language plpgsql set search_path='' as $$
declare stamp bigint:=(e->>'at')::bigint; day text; stage integer; days jsonb; gap bigint;
begin
 p:=coalesce(p,jsonb_build_object('knowledgeId',e->'knowledgeId','stage',0,'status','entdeckt','due',0,'lastSecure',null,'lastSeenAt',null,'lastAdvancedDay',null,'secureDays','[]'::jsonb,'seen',0));
 p:=p||jsonb_build_object('lastSeenAt',stamp,'seen',(p->>'seen')::integer+1);
 if e->>'correct'<>'true' or e->>'guessed'='true' then
  return p||jsonb_build_object('stage',0,'status','entdeckt','due',stamp+case when e->>'guessed'='true' then 21600000 else 600000 end);
 end if;
 day:=quiz_game_internal.day_key(stamp,zone);
 if p->>'lastAdvancedDay'=day or ((p->>'stage')::integer>0 and stamp<(p->>'due')::bigint) then return p; end if;
 gap:=coalesce(stamp-(p->>'lastSecure')::bigint,0); days:=p->'secureDays';
 if not(days ? day) then days:=days||to_jsonb(day); end if;
 stage:=least(4,(p->>'stage')::integer+1);
 return p||jsonb_build_object('stage',stage,'status',case when p->>'status'='gefestigt' or (stage=4 and jsonb_array_length(days)>=4 and gap>=604800000) then 'gefestigt' else 'geübt' end,
 'secureDays',days,'lastSecure',stamp,'lastAdvancedDay',day,'due',stamp+(array[86400000::bigint,259200000,604800000,1814400000])[stage]);
end$$;

-- Replay only the changed goal. This also handles a late guessed marker or a
-- bounded trial import without replaying the player's entire history.
create function quiz_game_internal.project_goal(player uuid,target uuid,goal_id text,revision bigint,zone text) returns void
language plpgsql set search_path='' as $$
declare p jsonb; row record; e jsonb; safe boolean; mistake boolean:=false; was_mistake boolean;
 discovered boolean:=false; recovered boolean:=false; mastered boolean:=false; answered_days text[]:=array[]::text[]; safe_days text[]:=array[]::text[];
 day text; xp integer:=0;
begin
 for row in
  select * from (select e.value event,r.value->>'status' status,q->>'difficulty' difficulty,coalesce(z.timezone,zone) timezone,e.position ordinal
  from public.quiz_sync_entries e join public.quiz_sync_entries r on r.owner_id=e.owner_id and r.generation=e.generation and r.kind='round' and r.id=e.round_id and not r.deleted
  cross join lateral jsonb_array_elements(r.value->'questions') q
  left join quiz_game_internal.event_zones z on z.owner_id=e.owner_id and z.event_id=e.id
  where e.owner_id=player and e.generation=target and e.kind='event' and not e.deleted and e.value->>'knowledgeId'=goal_id and q->>'id'=e.value->>'questionId'
  union all
  select q.event,r.status,q.question->>'difficulty',r.timezone,q.index from quiz_game_internal.runs r join quiz_game_internal.questions q on q.run_id=r.id
  where r.owner_id=player and r.generation=target and r.status='active' and q.event->>'knowledgeId'=goal_id
  ) history order by (event->>'at')::bigint,ordinal
 loop
  e:=row.event; p:=quiz_game_internal.learn(p,e,row.timezone); safe:=e->>'correct'='true' and e->>'guessed'='false'; was_mistake:=mistake;
  if e->>'correct'='false' then mistake:=true; elsif safe then mistake:=false; end if;
  if row.status<>'completed' then continue; end if;
  day:=quiz_game_internal.day_key((e->>'at')::bigint,row.timezone);
  if (e->>'answerId' is not null or e->>'dontKnow'='true') and not(day=any(answered_days)) then xp:=xp+1; answered_days:=array_append(answered_days,day); end if;
  if not safe then continue; end if;
  if not(day=any(safe_days)) then xp:=xp+case row.difficulty when 'leicht' then 2 when 'mittel' then 3 else 5 end; safe_days:=array_append(safe_days,day); end if;
  if not discovered then xp:=xp+2; discovered:=true; end if;
  if was_mistake and not recovered then xp:=xp+4; recovered:=true; end if;
  if p->>'status'='gefestigt' and not mastered then xp:=xp+8; mastered:=true; end if;
 end loop;
 if p is null then
  update public.quiz_sync_entries set deleted=true,value=null,changed_revision=revision where owner_id=player and generation=target and kind='learning' and id=goal_id;
 else
  insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,deleted,changed_revision)
   values(player,target,'learning',goal_id,(select coalesce(max(position)+1,0) from public.quiz_sync_entries where owner_id=player and generation=target and kind='learning'),p,false,revision)
   on conflict(owner_id,generation,kind,id) do update set value=excluded.value,deleted=false,changed_revision=excluded.changed_revision;
 end if;
 insert into quiz_game_internal.goal_rewards values(player,target,goal_id,xp) on conflict(owner_id,generation,goal) do update set xp=excluded.xp;
end$$;

create function quiz_game_internal.select_queue(player uuid,target uuid,setup jsonb,zone text) returns text[] language plpgsql set search_path='' as $$
declare journey jsonb:=quiz_game_internal.cached_journey(player,target); mode text:=setup->>'mode'; stamp bigint:=floor(extract(epoch from clock_timestamp())*1000)::bigint; selected text[]; due text[]; unseen text[]; intro text[]; repeats text[]; ids text[]:=array[]::text[]; item text; recent text[];
begin
 select coalesce(array_agg(e.value->>'knowledgeId'),array[]::text[]) into recent from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind='event' and not e.deleted and e.round_id in
 (select id from public.quiz_sync_entries where owner_id=player and generation=target and kind='round' and not deleted order by position desc limit 3);
 with variants as (
  select distinct on(m.knowledge_id) m.*,l.value progress from quiz_game_internal.pool(player,target,mode,setup->'filters',setup->>'topic',journey) m
  left join public.quiz_sync_entries l on l.owner_id=player and l.generation=target and l.kind='learning' and l.id=m.knowledge_id and not l.deleted
  where mode<>'fehler' or (m.source='film' and l.value is not null and quiz_game_internal.next_at(l.value,stamp,zone)<=stamp and
   (setup->>'sourceRoundId' is null or exists(select 1 from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind='event' and e.round_id=setup->>'sourceRoundId' and e.value->>'knowledgeId'=m.knowledge_id and not e.deleted)))
  order by m.knowledge_id,gen_random_uuid()
 ), contexts as (
  select v.*,case source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else genre end area from variants v
 ), stages as (
  select *,case when (journey->area->>'expertUnlocked')::boolean then 'experte' when (journey->area->>'hardUnlocked')::boolean then 'schwer' when (journey->area->>'mediumUnlocked')::boolean then 'mittel' end priority from contexts
 ), introduced as (
  select *,count(*) filter(where progress is not null and difficulty=priority) over(partition by area) stage_seen,
   count(*) filter(where progress is not null and familiarity=(journey->area->>'familiarity')::integer) over(partition by area) group_seen from stages
 ) select
  array_agg(id order by gen_random_uuid()),
  array_agg(id order by (progress->>'due')::bigint,gen_random_uuid()) filter(where progress is not null and quiz_game_internal.next_at(progress,stamp,zone)<=stamp),
  array_agg(id order by gen_random_uuid()) filter(where progress is null),
  array_agg(id order by gen_random_uuid()) filter(where progress is null and ((difficulty=priority and stage_seen<5) or
   (familiarity=(journey->area->>'familiarity')::integer and familiarity>(journey->area->>'first')::integer and not(priority is not null and stage_seen<5) and group_seen<5))),
  array_agg(id order by knowledge_id=any(recent),coalesce((progress->>'lastSeenAt')::bigint,(progress->>'lastSecure')::bigint,0),(progress->>'seen')::integer,gen_random_uuid()) filter(where progress is not null)
 into selected,due,unseen,intro,repeats from introduced;
 if mode='ueben' then return selected[1:10]; end if;
 if mode='fehler' then return due[1:10]; end if;
 foreach item in array coalesce(due[1:4],array[]::text[])||coalesce(intro[1:6],array[]::text[])||coalesce(unseen,array[]::text[])||coalesce(due,array[]::text[])||coalesce(repeats,array[]::text[]) loop
  if cardinality(ids)=10 then exit; end if;
  if not(item=any(ids)) then ids:=array_append(ids,item); end if;
 end loop;
 return (select array_agg(x order by gen_random_uuid()) from unnest(ids) x);
end$$;

create function quiz_game_internal.summary(r quiz_game_internal.runs) returns jsonb language sql stable set search_path='' as $$
 select r.setup-'sourceRoundId'||jsonb_build_object('id',r.id,'status',r.status,'answered',r.answered,'size',cardinality(r.queue),
 'startedAt',floor(extract(epoch from r.started_at)*1000)::bigint,'finishedAt',floor(extract(epoch from r.finished_at)*1000)::bigint)
$$;
create function quiz_game_internal.issue(r quiz_game_internal.runs) returns jsonb language plpgsql set search_path='' as $$
declare q quiz_game_internal.questions; content jsonb;
begin
 select * into q from quiz_game_internal.questions where run_id=r.id and index=r.answered;
 if not found then
  select public.quiz_year_question(c.question) into strict content from quiz_ranked_internal.catalog c where release_hash=r.release_hash and id=r.queue[r.answered+1];
  insert into quiz_game_internal.questions(run_id,index,question,answer_order) values(r.id,r.answered,content,
   (select jsonb_agg(a->>'id' order by gen_random_uuid()) from jsonb_array_elements(content->'answers') a)) returning * into q;
 end if;
 return jsonb_build_object('index',q.index,'nonce',q.nonce,'question',quiz_ranked_internal.visible(q.question),'order',q.answer_order);
end$$;
create function quiz_game_internal.close_run(r quiz_game_internal.runs,revision bigint) returns void language plpgsql set search_path='' as $$
declare archive jsonb; facts jsonb; events jsonb; position integer; event_position integer; empty_hash text; item record; round_id text:='learn-'||r.id;
begin
 if r.answered=0 then return; end if;
 empty_hash:=encode(sha256(convert_to('["quiz-object-v1","json-v1","{}"]','UTF8')),'hex');
 perform quiz_sync_internal.add_object(r.owner_id,r.generation,empty_hash,'json-v1','{}');
 select jsonb_agg(quiz_ranked_internal.fact(question) order by index),jsonb_agg(event->>'id' order by index) into facts,events from quiz_game_internal.questions where run_id=r.id and event is not null;
 select coalesce(max(e.position)+1,0) into position from public.quiz_sync_entries e where owner_id=r.owner_id and generation=r.generation and kind='round';
 select coalesce(max(e.position)+1,0) into event_position from public.quiz_sync_entries e where owner_id=r.owner_id and generation=r.generation and kind='event';
 archive:=r.setup-array['sourceRoundId']||jsonb_build_object('id',round_id,'difficulty','Alle Stufen','ruleVersion','learn-server-v1','status',r.status,'startedAt',floor(extract(epoch from r.started_at)*1000)::bigint,
 'finishedAt',floor(extract(epoch from r.finished_at)*1000)::bigint,'archive',jsonb_build_object('version',1),'questions',facts,'order','[]'::jsonb,'events',events,'beforeObject',empty_hash);
 insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,deleted,changed_revision) values(r.owner_id,r.generation,'round',round_id,position,archive,false,revision);
 for item in select event,index from quiz_game_internal.questions where run_id=r.id and event is not null order by index loop
  insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,deleted,changed_revision) values(r.owner_id,r.generation,'event',item.event->>'id',event_position+item.index,item.event,false,revision);
  insert into quiz_game_internal.event_zones values(r.owner_id,item.event->>'id',r.timezone);
 end loop;
end$$;

create function quiz_game_internal.call(request_text text) returns jsonb language plpgsql set search_path='' as $$
<<game_call>>
declare player uuid:=auth.uid(); req jsonb; action text; request_id uuid; receipt quiz_game_internal.receipts; r quiz_game_internal.runs; q quiz_game_internal.questions;
 head public.quiz_account_heads; reply jsonb; event jsonb; stamp bigint:=floor(extract(epoch from clock_timestamp())*1000)::bigint; setup jsonb; queue text[]; zone text; correct boolean; goal text; xp integer;
begin
 perform quiz_sync_internal.require_owner(player);
 if request_text is null or octet_length(request_text)>8192 then raise exception 'invalid_game_request'; end if;
 req:=request_text::jsonb; action:=req->>'action';
 if jsonb_typeof(req)<>'object' or req-array['action','requestId','runId','index','nonce','answerId','dontKnow','guessed','setup','timezone']<>'{}' then raise exception 'invalid_game_request'; end if;
 -- Same lock as entry writes: a closure cannot race a settings/duel packet.
 perform pg_advisory_xact_lock(hashtextextended(player::text,20261003));
 select * into head from public.quiz_account_heads where owner_id=player;
 if head.generation is null then raise exception 'game_account_missing'; end if;
 if action='status' then
  select * into r from quiz_game_internal.runs where owner_id=player and generation=head.generation and status='active';
  return jsonb_build_object('active',case when r.id is null then null else quiz_game_internal.summary(r) end);
 end if;
 if action='resume' then
  select * into strict r from quiz_game_internal.runs where owner_id=player and generation=head.generation and id=(req->>'runId')::uuid;
  select coalesce(jsonb_agg(jsonb_build_object('question',t.question,'order',t.answer_order,'event',t.event) order by t.index),'[]') into reply from quiz_game_internal.questions t where t.run_id=r.id and t.event is not null;
  if r.status='active' then
   select * into q from quiz_game_internal.questions where run_id=r.id order by index desc limit 1;
   return jsonb_build_object('run',quiz_game_internal.summary(r),'items',reply,'current',jsonb_build_object('index',q.index,'nonce',q.nonce,'question',quiz_ranked_internal.visible(q.question),'order',q.answer_order));
  end if;
  return jsonb_build_object('run',quiz_game_internal.summary(r),'items',reply);
 end if;
 request_id:=(req->>'requestId')::uuid;
 if request_id is null then raise exception 'invalid_game_request'; end if;
 select * into receipt from quiz_game_internal.receipts where owner_id=player and receipts.request_id=game_call.request_id;
 if found then
  if receipt.request<>request_text then raise exception 'game_receipt_mismatch'; end if;
  reply:=receipt.reply;
  if reply ? 'itemIndex' then
   select * into strict q from quiz_game_internal.questions where run_id=(reply->'run'->>'id')::uuid and index=(reply->>'itemIndex')::integer;
   reply:=jsonb_set(reply-'itemIndex','{item,question}',q.question);
  elsif reply ? 'current' then
   select question into strict event from quiz_game_internal.questions where run_id=(reply->'run'->>'id')::uuid and index=(reply->'current'->>'index')::integer;
   reply:=jsonb_set(reply,'{current,question}',quiz_ranked_internal.visible(event));
  end if;
  return reply;
 end if;
 if action='start' then
  setup:=req->'setup'; zone:=req->>'timezone';
  if coalesce(setup->>'mode','') not in ('entdecken','ueben','fehler') or jsonb_typeof(setup->'filters')<>'object' or length(setup->>'topic')>8192 or
   coalesce(setup->>'solutionDisplay','') not in ('question','round') or not exists(select 1 from pg_timezone_names where name=zone) then raise exception 'invalid_game_setup'; end if;
  if exists(select 1 from quiz_game_internal.runs where owner_id=player and status='active') then raise exception 'game_active'; end if;
  if setup->>'mode'<>'ueben' then setup:=jsonb_set(setup,'{solutionDisplay}','"question"'); end if;
  queue:=quiz_game_internal.select_queue(player,head.generation,setup,zone);
  if coalesce(cardinality(queue),0)=0 then raise exception 'game_empty'; end if;
  insert into quiz_game_internal.runs(owner_id,generation,release_hash,setup,timezone,queue) values(player,head.generation,(select release_hash from quiz_ranked_internal.config where id),setup,zone,queue) returning * into r;
  reply:=jsonb_build_object('run',quiz_game_internal.summary(r),'current',quiz_game_internal.issue(r));
 else
  select * into strict r from quiz_game_internal.runs where id=(req->>'runId')::uuid and owner_id=player and generation=head.generation;
  if action='question' then
   if r.status<>'active' or (req->>'index')::integer<>r.answered or r.answered>=cardinality(r.queue) then raise exception 'game_question_changed'; end if;
   reply:=jsonb_build_object('run',quiz_game_internal.summary(r),'current',quiz_game_internal.issue(r));
  elsif action in ('answer','guess','finish','abort') then
   if r.status<>'active' then raise exception 'game_closed'; end if;
   if action='answer' then
    select * into strict q from quiz_game_internal.questions where run_id=r.id and index=r.answered;
    if (req->>'index')::integer is distinct from q.index or (req->>'nonce')::uuid is distinct from q.nonce or q.event is not null then raise exception 'game_question_changed'; end if;
    if req->>'answerId' is not null and not exists(select 1 from jsonb_array_elements(q.question->'answers') a where a->>'id'=req->>'answerId') then raise exception 'invalid_game_answer'; end if;
    if req->>'answerId' is null and coalesce(req->>'dontKnow','false')<>'true' then raise exception 'invalid_game_answer'; end if;
    correct:=req->>'answerId'=q.question->>'correctId';
    event:=jsonb_build_object('id','learn-'||r.id||':'||(q.question->>'knowledgeId'),'roundId','learn-'||r.id,'questionId',q.question->'id','knowledgeId',q.question->'knowledgeId','version',q.question->'version',
     'answerId',req->'answerId','correct',coalesce(correct,false),'guessed',coalesce(correct and req->>'guessed'='true',false),'at',stamp,'elapsedMs',greatest(0,stamp-floor(extract(epoch from q.issued_at)*1000)::bigint),'knowledgePoints',0,'timeBonus',0)
     ||case when req->>'answerId' is null then '{"dontKnow":true}'::jsonb else '{}'::jsonb end;
    update quiz_game_internal.questions set event=game_call.event where run_id=r.id and index=q.index;
    update quiz_game_internal.runs set answered=answered+1 where id=r.id returning * into r;
    perform quiz_game_internal.project_goal(player,head.generation,event->>'knowledgeId',head.revision+1,r.timezone);
    reply:=jsonb_build_object('run',quiz_game_internal.summary(r),'item',jsonb_build_object('question',q.question,'order',q.answer_order,'event',event));
   elsif action='guess' then
    select * into strict q from quiz_game_internal.questions t where run_id=r.id and index=(req->>'index')::integer and t.event is not null;
    if q.index<>r.answered-1 or q.event->>'correct'<>'true' then raise exception 'invalid_game_guess'; end if;
    event:=q.event||'{"guessed":true}'::jsonb;
    update quiz_game_internal.questions set event=game_call.event where run_id=r.id and index=q.index;
    perform quiz_game_internal.project_goal(player,head.generation,event->>'knowledgeId',head.revision+1,r.timezone);
    reply:=jsonb_build_object('run',quiz_game_internal.summary(r),'item',jsonb_build_object('question',q.question,'order',q.answer_order,'event',event));
   else
    if action='finish' and r.answered<>cardinality(r.queue) then raise exception 'game_incomplete'; end if;
    update quiz_game_internal.runs set status=case when action='finish' then 'completed' else 'aborted' end,finished_at=clock_timestamp() where id=r.id returning * into r;
    perform quiz_game_internal.close_run(r,head.revision+1);
    for goal in select t.event->>'knowledgeId' from quiz_game_internal.questions t where run_id=r.id and t.event is not null loop
     perform quiz_game_internal.project_goal(player,head.generation,goal,head.revision+1,r.timezone);
    end loop;
    select coalesce(sum(g.xp),0) into xp from quiz_game_internal.goal_rewards g where owner_id=player and generation=head.generation;
    update public.quiz_sync_entries set value=to_jsonb(xp),changed_revision=head.revision+1 where owner_id=player and generation=head.generation and kind='field' and id='experience';
    reply:=jsonb_build_object('run',quiz_game_internal.summary(r));
   end if;
   update public.quiz_account_heads set revision=head.revision+1,updated_at=clock_timestamp() where owner_id=player;
  else raise exception 'invalid_game_action'; end if;
 end if;
 -- Store a compact receipt. Replays read the immutable issued snapshot by PK.
 event:=reply;
 if reply ? 'item' then event:=(reply#-'{item,question}')||jsonb_build_object('itemIndex',q.index);
 elsif reply ? 'current' then event:=reply#-'{current,question}'; end if;
 insert into quiz_game_internal.receipts(owner_id,request_id,request,reply) values(player,request_id,request_text,event);
 delete from quiz_game_internal.receipts old where old.owner_id=player and old.request_id in
 (select t.request_id from quiz_game_internal.receipts t where t.owner_id=player order by t.created_at desc,t.request_id desc offset 1000);
 return reply;
end$$;
create function public.quiz_game_call(request_text text) returns jsonb language sql security definer set search_path='' as $$select quiz_game_internal.call(request_text)$$;
revoke all on all functions in schema quiz_game_internal from public,anon,authenticated;
revoke all on function public.quiz_game_call(text) from public,anon,authenticated;
grant execute on function public.quiz_game_call(text) to authenticated;
commit;
