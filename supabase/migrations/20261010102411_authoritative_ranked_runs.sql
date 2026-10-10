-- Ranked solo games have their own authority. Client saves/imports never write
-- these tables, and public rankings no longer read client score projections.
begin;
create schema quiz_ranked_internal;
revoke all on schema quiz_ranked_internal from public,anon,authenticated;

create table quiz_ranked_internal.catalog (
  release_hash text not null references public.quiz_catalog_releases(hash),
  id text not null, knowledge_id text not null, difficulty text not null,
  genre text not null, source text not null check(source in ('film','actors','awards')),
  question jsonb not null, primary key(release_hash,id)
);
create index ranked_catalog_selection on quiz_ranked_internal.catalog(release_hash,source,genre,difficulty);
create table quiz_ranked_internal.config (
  id boolean primary key check(id), release_hash text not null references public.quiz_catalog_releases(hash)
);
create table quiz_ranked_internal.runs (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null, release_hash text not null references public.quiz_catalog_releases(hash),
  mode text not null check(mode in ('rekord','fehlerfrei','zeitkonto')),
  preset text not null check(preset in ('standard','genre')), filters jsonb not null, category text not null,
  solution_display text not null check(solution_display in ('question','round')),
  status text not null default 'active' check(status in ('active','completed','aborted')),
  queue jsonb not null default '[]', queue_position integer not null default 0 check(queue_position between 0 and 100000), cycle integer not null default 0,
  answered integer not null default 0 check(answered between 0 and 100000),
  points integer not null default 0, hits integer not null default 0,
  elapsed_ms bigint not null default 0, bank_ms integer not null default 120000,
  created_at timestamptz not null default clock_timestamp(), touched_at timestamptz not null default clock_timestamp(),
  finished_at timestamptz
);
create unique index ranked_one_active on quiz_ranked_internal.runs(owner_id) where status='active';
create index ranked_owner_history on quiz_ranked_internal.runs(owner_id,created_at desc);
create index ranked_completed on quiz_ranked_internal.runs(mode,finished_at) where status='completed';
create index ranked_category_time on quiz_ranked_internal.runs(category,finished_at) where status='completed';
create index ranked_release on quiz_ranked_internal.runs(release_hash);
create table quiz_ranked_internal.questions (
  run_id uuid not null references quiz_ranked_internal.runs(id) on delete cascade,
  index integer not null check(index between 0 and 99999), nonce uuid not null default gen_random_uuid(),
  question jsonb not null, answer_order jsonb not null,
  issued_at timestamptz not null, deadline timestamptz not null,
  event jsonb, primary key(run_id,index)
);
create table quiz_ranked_internal.receipts (
  owner_id uuid not null references auth.users(id) on delete cascade, request_id uuid not null,
  proof text not null, response jsonb not null, primary key(owner_id,request_id)
);
create table quiz_ranked_internal.limits (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  window_at timestamptz not null, mutations integer not null, starts integer not null
);
alter table quiz_ranked_internal.catalog enable row level security;
alter table quiz_ranked_internal.config enable row level security;
alter table quiz_ranked_internal.runs enable row level security;
alter table quiz_ranked_internal.questions enable row level security;
alter table quiz_ranked_internal.receipts enable row level security;
alter table quiz_ranked_internal.limits enable row level security;
revoke all on all tables in schema quiz_ranked_internal from public,anon,authenticated;

create function quiz_ranked_internal.summary(r quiz_ranked_internal.runs) returns jsonb
language sql stable set search_path='' as $$
 select jsonb_build_object('id',r.id,'mode',r.mode,'recordPreset',r.preset,'filters',r.filters,
   'ruleVersion','solo-server-v1.'||r.mode||'.'||r.preset,'solutionDisplay',r.solution_display,
   'status',r.status,'answered',r.answered,'points',r.points,'hits',r.hits,'bankMs',r.bank_ms,
   'startedAt',floor(extract(epoch from r.created_at)*1000)::bigint,
   'finishedAt',floor(extract(epoch from r.finished_at)*1000)::bigint)
$$;

-- Whitelist visible fields. Metadata/feedback can contain names and solutions.
create function quiz_ranked_internal.visible(q jsonb) returns jsonb
language sql immutable set search_path='' as $$
 select jsonb_build_object('id',q->'id','knowledgeId',q->'knowledgeId','version',q->'version',
   'language',q->'language','domain',q->'domain','topic',q->'topic','difficulty',q->'difficulty',
   'question',q->'question','answers',(select jsonb_agg(jsonb_build_object('id',a->'id','text',a->'text')) from jsonb_array_elements(q->'answers') a),
   'metadata',jsonb_build_object('subdomain',coalesce(q->'metadata'->>'subdomain','')),
   'tags','[]'::jsonb,'badgeTags','[]'::jsonb,'demo',false)
$$;

-- Full official content is installed by the operator, never by an account RPC.
-- Queue order, cycle and future contents remain private, including save reads.
create function quiz_ranked_internal.refill(r quiz_ranked_internal.runs) returns jsonb
language sql volatile set search_path='' as $$
 with goals as (
   select distinct on (knowledge_id) id,knowledge_id,difficulty from quiz_ranked_internal.catalog c
   where c.release_hash=r.release_hash and c.difficulty in ('leicht','mittel','schwer')
     and (r.preset='standard' or (c.source='film' and c.genre=r.filters->'genres'->>0))
   order by knowledge_id,gen_random_uuid()
 ), levels as (
   select *,row_number() over(partition by difficulty order by gen_random_uuid())-1 as n from goals
 ) select coalesce(jsonb_agg(id order by n/(case when difficulty='mittel' then 4 else 3 end),gen_random_uuid()),'[]') from levels
$$;

create function quiz_ranked_internal.fact(q jsonb) returns jsonb
language sql immutable set search_path='' as $$
 select jsonb_build_object('id',q->'id','knowledgeId',q->'knowledgeId','version',q->'version','domain',q->'domain','difficulty',q->'difficulty',
   'correctId',q->'correctId','answerIds',(select jsonb_agg(a->'id') from jsonb_array_elements(q->'answers') a),
   'metadata',jsonb_strip_nulls(jsonb_build_object('subdomain',nullif(q->'metadata'->>'subdomain',''),'person_id',case when q->'metadata' ? 'person_id' then 'actor' else null end)),
   'tags',case when q->'tags' ? 'Preisträger' then '["Preisträger"]'::jsonb else '[]'::jsonb end)
$$;

create function quiz_ranked_internal.issue(run_id uuid) returns jsonb
language plpgsql set search_path='' as $$
declare r quiz_ranked_internal.runs; item quiz_ranked_internal.questions; q jsonb; lim integer; stamp timestamptz;
begin
 select * into strict r from quiz_ranked_internal.runs where id=run_id;
 select * into item from quiz_ranked_internal.questions where questions.run_id=r.id and index=r.answered;
 if not found then
   if r.answered>=100000 then raise exception 'ranked_run_limit'; end if;
   if r.queue_position>=jsonb_array_length(r.queue) then
     r.queue:=quiz_ranked_internal.refill(r); r.queue_position:=0; r.cycle:=r.cycle+1;
     -- Avoid an immediate repeat at a cycle boundary when another goal exists.
     if jsonb_array_length(r.queue)>1 and exists(
       select 1 from quiz_ranked_internal.questions p join quiz_ranked_internal.catalog c
         on c.release_hash=r.release_hash and c.id=r.queue->>0
       where p.run_id=r.id and p.index=r.answered-1 and p.question->>'knowledgeId'=c.knowledge_id) then
       r.queue:=(r.queue-0)||jsonb_build_array(r.queue->0);
     end if;
     update quiz_ranked_internal.runs set queue=r.queue,queue_position=0,cycle=r.cycle where id=r.id;
   end if;
   select public.quiz_year_question(question) into q from quiz_ranked_internal.catalog
     where release_hash=r.release_hash and id=r.queue->>r.queue_position;
   if q is null then raise exception 'ranked_catalog_missing'; end if;
   lim:=case when r.mode='zeitkonto' then least(30000,r.bank_ms) else 30000 end;
   stamp:=clock_timestamp();
   insert into quiz_ranked_internal.questions(run_id,index,question,answer_order,issued_at,deadline)
   values(r.id,r.answered,q,(select jsonb_agg(a->>'id' order by gen_random_uuid()) from jsonb_array_elements(q->'answers') a),stamp,stamp+lim*interval '1 millisecond') returning * into item;
   -- Keep the large TOASTed queue unchanged between cycles. Advance only a
   -- small cursor, rather than rewriting thousands of IDs for every question.
   update quiz_ranked_internal.runs set queue_position=queue_position+1,touched_at=stamp where id=r.id;
 end if;
 return jsonb_build_object('index',item.index,'nonce',item.nonce,'question',quiz_ranked_internal.visible(item.question),
   'order',item.answer_order,'issuedAt',floor(extract(epoch from item.issued_at)*1000)::bigint,
   'deadline',floor(extract(epoch from item.deadline)*1000)::bigint);
end $$;

-- Receipts keep outcome facts, not another copy of the question/explanation.
-- Question snapshots are immutable; a replay only needs one primary-key read.
create function quiz_ranked_internal.expand_receipt(reply jsonb) returns jsonb
language plpgsql set search_path='' as $$
declare q jsonb;
begin
 if reply ? 'current' then
   select question into strict q from quiz_ranked_internal.questions where run_id=(reply->'run'->>'id')::uuid and index=(reply->'current'->>'index')::integer;
   reply:=jsonb_set(reply,'{current,question}',quiz_ranked_internal.visible(q));
 elsif reply ? 'item' then
   select question into strict q from quiz_ranked_internal.questions where run_id=(reply->'run'->>'id')::uuid and index=(reply->>'questionIndex')::integer;
   reply:=jsonb_set(reply,'{item,question}',q);
 end if;
 return (reply-'questionIndex')||jsonb_build_object('serverNow',floor(extract(epoch from clock_timestamp())*1000)::bigint);
end$$;

create function quiz_ranked_internal.call(request_text text) returns jsonb
language plpgsql set search_path='' as $$
<<ranked_request>>
declare p uuid:=auth.uid(); req jsonb; action text; rid uuid; sid uuid; request_id uuid;
  proof text; prior quiz_ranked_internal.receipts; r quiz_ranked_internal.runs;
  item quiz_ranked_internal.questions; result jsonb; stored jsonb; event jsonb; active_id uuid;
  stamp timestamptz; spent integer; lim integer; hit boolean; ended boolean;
  chosen text; unknown_answer boolean; genres jsonb; run_filters jsonb; release_hash text; n integer;
begin
 perform quiz_sync_internal.require_owner(p);
 if request_text is null or octet_length(request_text)>4096 then raise exception 'invalid_ranked_request'; end if;
 req:=request_text::jsonb; action:=req->>'action';
 if jsonb_typeof(req) is distinct from 'object' or coalesce(action,'') not in ('start','question','answer','guess','abort','status','pending','history') then raise exception 'invalid_ranked_request'; end if;
 if req-array['action','requestId','sessionId','runId','mode','preset','genre','releaseHash','solutionDisplay','index','nonce','answerId','dontKnow','guessed','offset','factsOnly']<>'{}'::jsonb then raise exception 'invalid_ranked_request'; end if;
 -- Also reject time/score fields rather than silently treating them as trusted.
 perform pg_advisory_xact_lock(hashtextextended('ranked:'||p::text,20261010));
 stamp:=clock_timestamp();
 if action='status' then
   select id into active_id from quiz_ranked_internal.runs where owner_id=p and status='active';
   return jsonb_build_object('activeId',active_id);
 end if;
 if action='pending' then
   select coalesce(jsonb_agg(id order by created_at),'[]') into result from (
     select saved_run.id,saved_run.created_at from quiz_ranked_internal.runs saved_run where saved_run.owner_id=p and saved_run.status<>'active' and saved_run.answered>0
       and not exists(select 1 from public.quiz_account_heads h join public.quiz_sync_entries e
         on e.owner_id=h.owner_id and e.generation=h.generation and e.kind='round' and e.id='ranked-'||saved_run.id::text and not e.deleted
         where h.owner_id=p)
     order by saved_run.created_at limit 20) missing;
   return result;
 end if;
 if action='history' then
   rid:=(req->>'runId')::uuid;
   select * into r from quiz_ranked_internal.runs where id=rid and owner_id=p and status<>'active';
   if not found then raise exception 'ranked_unavailable'; end if;
   n:=coalesce((req->>'offset')::integer,0);
   if n<0 or n>100000 then raise exception 'invalid_ranked_request'; end if;
   select coalesce(jsonb_agg(case when req->'factsOnly'='true'::jsonb
     then jsonb_build_object('fact',quiz_ranked_internal.fact(items.question),'event',items.event)
     else jsonb_build_object('question',items.question,'order',items.answer_order,'event',items.event) end order by items.index),'[]') into result
     from (select * from quiz_ranked_internal.questions q where q.run_id=r.id and q.event is not null and q.index>=n order by q.index limit 50) items;
   return jsonb_build_object('run',quiz_ranked_internal.summary(r),'items',result);
 end if;
 request_id:=(req->>'requestId')::uuid;
 if request_id is null then raise exception 'invalid_ranked_request'; end if;
 proof:=encode(sha256(convert_to(request_text,'UTF8')),'hex');
 select * into prior from quiz_ranked_internal.receipts where owner_id=p and receipts.request_id=ranked_request.request_id;
 if found then
   if prior.proof<>proof then raise exception 'ranked_request_reused'; end if;
   return quiz_ranked_internal.expand_receipt(prior.response);
 end if;
 insert into quiz_ranked_internal.limits values(p,stamp,1,case when action='start' then 1 else 0 end)
 on conflict(owner_id) do update set
   window_at=case when limits.window_at<=stamp-interval '1 minute' then stamp else limits.window_at end,
   mutations=case when limits.window_at<=stamp-interval '1 minute' then 1 else limits.mutations+1 end,
   starts=case when limits.window_at<=stamp-interval '1 minute' then (case when action='start' then 1 else 0 end) else limits.starts+(case when action='start' then 1 else 0 end) end;
 if exists(select 1 from quiz_ranked_internal.limits where owner_id=p and (mutations>240 or starts>10)) then raise exception 'ranked_rate_limit'; end if;
 if action='start' then
   sid:=(req->>'sessionId')::uuid; release_hash:=req->>'releaseHash';
   if sid is null or coalesce(req->>'mode','') not in ('rekord','fehlerfrei','zeitkonto') or
     coalesce(req->>'preset','') not in ('standard','genre') or coalesce(req->>'solutionDisplay','') not in ('question','round') then raise exception 'invalid_ranked_request'; end if;
   if exists(select 1 from quiz_ranked_internal.runs where owner_id=p and status='active') then raise exception 'ranked_active'; end if;
   if not exists(select 1 from quiz_ranked_internal.config cfg join public.quiz_catalog_releases c on c.hash=cfg.release_hash
     where c.hash=ranked_request.release_hash and c.question_count=(select count(*) from quiz_ranked_internal.catalog q where q.release_hash=c.hash)) then raise exception 'ranked_catalog_missing'; end if;
   select jsonb_agg(distinct genre order by genre) into genres from quiz_ranked_internal.catalog c where c.release_hash=ranked_request.release_hash and source='film';
   if req->>'preset'='genre' then
     if req->>'genre' is null or not genres ? (req->>'genre') then raise exception 'invalid_ranked_request'; end if;
     genres:=jsonb_build_array(req->>'genre');
   end if;
   run_filters:=jsonb_build_object('genres',genres,'sources',case when req->>'preset'='genre' then '["film"]'::jsonb else '["film","awards","actors"]'::jsonb end,
     'difficulties','["leicht","mittel","schwer"]'::jsonb,'familiarities','[1,2,3,4]'::jsonb);
   insert into quiz_ranked_internal.runs(owner_id,session_id,release_hash,mode,preset,filters,solution_display,category)
   values(p,sid,release_hash,req->>'mode',req->>'preset',run_filters,req->>'solutionDisplay',
     jsonb_build_array('records-v3',req->>'mode',run_filters,'Alle Themen',case when req->>'mode'='rekord' then '10' else 'endless' end,'solo-server-v1.'||(req->>'mode')||'.'||(req->>'preset'))::text) returning * into r;
   r.queue:=quiz_ranked_internal.refill(r);
   if jsonb_array_length(r.queue)<10 or exists(
     select 1 from unnest(array['leicht','mittel','schwer']) d where
       (select count(*) from jsonb_array_elements_text(r.queue) q join quiz_ranked_internal.catalog c on c.release_hash=r.release_hash and c.id=q.value where c.difficulty=d)<case when d='mittel' then 4 else 3 end
   ) then raise exception 'ranked_catalog_missing'; end if;
   if r.mode='rekord' then
     select jsonb_agg(value order by ordinal) into r.queue from jsonb_array_elements(r.queue) with ordinality q(value,ordinal) where ordinal<=10;
   end if;
   update quiz_ranked_internal.runs set queue=r.queue,cycle=1 where id=r.id;
   result:=jsonb_build_object('run',quiz_ranked_internal.summary(r),'current',quiz_ranked_internal.issue(r.id));
 else
   rid:=(req->>'runId')::uuid;
   select * into r from quiz_ranked_internal.runs where id=rid and owner_id=p for update;
   if not found or (r.status<>'active' and action not in ('guess','abort')) then raise exception 'ranked_unavailable'; end if;
   if action='abort' then
     if r.status='active' then
       update quiz_ranked_internal.runs set status='aborted',queue='[]',finished_at=stamp,touched_at=stamp where id=r.id returning * into r;
     end if;
     result:=jsonb_build_object('run',quiz_ranked_internal.summary(r));
   else
     sid:=(req->>'sessionId')::uuid;
     if sid is distinct from r.session_id then raise exception 'ranked_other_device'; end if;
     if action='guess' then
       if req->'index' is distinct from to_jsonb(r.answered-1) or exists(select 1 from quiz_ranked_internal.questions where run_id=r.id and index=r.answered) then raise exception 'ranked_wrong_question'; end if;
       select * into item from quiz_ranked_internal.questions q where q.run_id=r.id and q.index=r.answered-1 and q.event->'correct'='true'::jsonb;
       if not found then raise exception 'invalid_ranked_answer'; end if;
       item.event:=item.event||'{"guessed":true}'::jsonb;
       update quiz_ranked_internal.questions set event=item.event where run_id=r.id and index=r.answered-1;
       result:=jsonb_build_object('run',quiz_ranked_internal.summary(r),'item',jsonb_build_object('question',item.question,'order',item.answer_order,'event',item.event));
     elsif req->'index' is distinct from to_jsonb(r.answered) then raise exception 'ranked_wrong_question';
     elsif action='question' then
       result:=jsonb_build_object('run',quiz_ranked_internal.summary(r),'current',quiz_ranked_internal.issue(r.id));
     else
       select * into item from quiz_ranked_internal.questions where run_id=r.id and index=r.answered;
       if not found or item.nonce is distinct from (req->>'nonce')::uuid or item.event is not null then raise exception 'ranked_wrong_question'; end if;
       chosen:=req->>'answerId'; unknown_answer:=coalesce((req->>'dontKnow')::boolean,false);
       if (chosen is not null and unknown_answer) or (chosen is not null and not exists(select 1 from jsonb_array_elements(item.question->'answers') a where a->>'id'=chosen)) then raise exception 'invalid_ranked_answer'; end if;
       -- Capture reception after serialization, never accept a client clock.
       stamp:=clock_timestamp(); lim:=floor(extract(epoch from item.deadline-item.issued_at)*1000)::integer;
       spent:=least(lim,greatest(0,floor(extract(epoch from stamp-item.issued_at)*1000)::integer));
       if chosen is null and not unknown_answer and stamp<item.deadline then raise exception 'ranked_not_expired'; end if;
       hit:=coalesce(chosen=item.question->>'correctId' and stamp<item.deadline,false);
       if stamp>=item.deadline then chosen:=null; unknown_answer:=false; end if;
       event:=jsonb_build_object('id','ranked-'||r.id::text||':'||(item.question->>'knowledgeId')||case when r.mode='rekord' then '' else ':'||r.answered end,'roundId','ranked-'||r.id::text,
         'questionId',item.question->'id','knowledgeId',item.question->'knowledgeId','version',item.question->'version',
         'answerId',chosen,'correct',hit,'guessed',coalesce((req->>'guessed')::boolean,false) and hit,'at',floor(extract(epoch from stamp)*1000)::bigint,
         'elapsedMs',spent,'knowledgePoints',case when hit then 100 else 0 end,'timeBonus',case when hit then 2*floor((30000-spent)/1000)::integer else 0 end);
       if unknown_answer then event:=event||'{"dontKnow":true}'::jsonb; end if;
       if r.mode='zeitkonto' then
         r.bank_ms:=greatest(0,r.bank_ms-spent);
         if r.bank_ms>0 then r.bank_ms:=greatest(0,least(120000,r.bank_ms+case when hit then 15000 else -45000 end)); end if;
       end if;
       ended:=case r.mode when 'rekord' then r.answered=9 when 'fehlerfrei' then not hit else r.bank_ms=0 end;
       update quiz_ranked_internal.questions set event=ranked_request.event where run_id=r.id and index=r.answered;
       update quiz_ranked_internal.runs set answered=answered+1,points=points+(event->>'knowledgePoints')::integer+(event->>'timeBonus')::integer,
         hits=hits+case when hit then 1 else 0 end,elapsed_ms=elapsed_ms+spent,bank_ms=r.bank_ms,touched_at=stamp,
         status=case when ended then 'completed' else 'active' end,finished_at=case when ended then stamp else null end
         ,queue=case when ended then '[]'::jsonb else queue end
         where id=r.id returning * into r;
       result:=jsonb_build_object('run',quiz_ranked_internal.summary(r),'item',jsonb_build_object('question',item.question,'order',item.answer_order,'event',event));
     end if;
   end if;
 end if;
 result:=result||jsonb_build_object('serverNow',floor(extract(epoch from clock_timestamp())*1000)::bigint);
 stored:=result-'serverNow';
 if stored ? 'current' then stored:=jsonb_set(stored,'{current}',(stored->'current')-'question');
 elsif stored ? 'item' then stored:=jsonb_set(stored,'{item}',(stored->'item')-'question')||jsonb_build_object('questionIndex',item.index); end if;
 insert into quiz_ranked_internal.receipts values(p,request_id,proof,stored);
 return result;
end $$;

-- Small authenticated wrapper; privileged implementation remains unexposed.
create function public.quiz_ranked_call(request_text text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 perform quiz_sync_internal.require_owner(auth.uid());
 return quiz_ranked_internal.call(request_text);
end $$;
revoke all on all functions in schema quiz_ranked_internal from public,anon,authenticated;
revoke all on function public.quiz_ranked_call(text) from public,anon;
grant execute on function public.quiz_ranked_call(text) to authenticated;

-- No save/import/generation/projection function is a source for this view.
create view quiz_ranked_internal.scores with (security_invoker=true) as
 select r.owner_id,'ranked-'||r.id::text as round_id,public.quiz_duel_name(r.owner_id) as player_name,
   r.category,
   array(select jsonb_array_elements_text(r.filters->'genres')) as genres,array['leicht','mittel','schwer']::text[] as difficulties,
   'Alle Themen'::text as topic,r.answered as question_count,'solo-server-v1.'||r.mode||'.'||r.preset as rule_version,
   r.points,r.hits as correct,r.elapsed_ms,extract(epoch from r.finished_at)::double precision*1000 as finished_at,r.mode
 from quiz_ranked_internal.runs r join auth.users u on u.id=r.owner_id
 where r.status='completed' and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false);
revoke all on quiz_ranked_internal.scores from public,anon,authenticated;

-- Keep public response contracts; replace their only score source. Historical
-- private results and old projection rows are neither rewritten nor deleted.
do $$declare name text; definition text; patched text;begin
 foreach name in array array['public.quiz_record_categories(text)','public.quiz_record_runs(text,text,integer)','public.quiz_score_categories()','public.quiz_rankings(text,integer)'] loop
   definition:=pg_get_functiondef(name::regprocedure);
   patched:=replace(definition,'public.quiz_shared_scores','quiz_ranked_internal.scores');
   if patched=definition then raise exception 'ranked_projection_source_missing'; end if;
   execute patched;
 end loop;
end$$;
notify pgrst,'reload schema';
commit;
