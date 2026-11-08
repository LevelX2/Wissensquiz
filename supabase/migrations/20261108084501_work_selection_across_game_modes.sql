-- Consistent work identity and scoped familiarity in every new selection.
begin;
select pg_advisory_xact_lock(hashtextextended('quiz_current_content',0));
CREATE OR REPLACE FUNCTION quiz_game_internal.matches(m quiz_game_internal.catalog_meta, filters jsonb, topic text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare prefix text; selected text[]; suffix text; matched boolean;
begin
 if filters is not null then
  if not(filters->'difficulties' ? m.difficulty) or (filters ? 'sources' and not(filters->'sources' ? m.source)) then return false;end if;
  if not((coalesce(filters->'genres','null'::jsonb)='null'::jsonb and not(filters ? 'workTypes') and not(filters ? 'techniques') and not(filters ? 'collections')) or quiz_game_internal.matches_work(m.works,filters)) then return false;end if;
  if filters ? 'familiarities' and not(filters->'familiarities' @> '[1,2,3,4]'::jsonb) then
   if m.source='film' and m.works<>'[]'::jsonb then
    if not exists(select 1 from quiz_game_internal.catalog_paths p where p.id=m.id and p.own
     and filters->'familiarities' @> to_jsonb(p.familiarity) and quiz_game_internal.matches_work(p.works,filters)) then return false;end if;
   elsif m.familiarity=0 or not(filters->'familiarities' @> to_jsonb(m.familiarity)) then return false;end if;
  end if;
 end if;
 if topic is null or topic='Alle Themen' then return true; end if;
 prefix:=split_part(topic,': ',1); selected:=string_to_array(prefix,' + ');
 suffix:=case when position(': ' in topic)>0 then substr(topic,length(prefix)+3) else null end;
 if selected[1]='Filmfragen' and selected<@array['Filmfragen','Classics','Arthouse','Schauspieler','Preisträger'] then
  matched:=case m.source when 'film' then not(selected && array['Classics','Arthouse']) or m.tags ?| selected
   when 'actors' then 'Schauspieler'=any(selected) else 'Preisträger'=any(selected) end;
 elsif selected<@array['Classics','Arthouse','Schauspieler','Preisträger'] then
  matched:=m.tags ?| selected;
 else return topic=m.topic; end if;
 return matched and (suffix is null or m.topic=suffix);
end$function$;

create or replace function quiz_game_internal.refresh_content() returns jsonb
language plpgsql set search_path='' as $$
declare release text; info jsonb;
begin
 select release_hash into release from quiz_ranked_internal.config where id;
 if release is null then raise exception 'game_content_missing'; end if;
 delete from quiz_game_internal.catalog_meta;
 insert into quiz_game_internal.catalog_meta(id,knowledge_id,topic,genre,source,difficulty,familiarity,tags,works,variant_of)
 select c.id,c.knowledge_id,c.question->>'topic',c.genre,c.source,c.difficulty,
  coalesce((p.value->>'familiarity')::integer,0),c.question->'tags',quiz_game_internal.work_references(c.question),coalesce(c.question->'metadata'->>'variant_of','')
 from quiz_ranked_internal.catalog c left join quiz_game_internal.presentations p on p.id=c.id
 where c.release_hash=release;
 select jsonb_build_object('hash',release,'questions',count(*),'goals',count(distinct knowledge_id),
  'genres',(select coalesce(jsonb_agg(value order by value),'[]'::jsonb) from (
   select distinct quiz_game_internal.work_area(w->>'type',g.value) value from quiz_game_internal.catalog_meta m
   cross join lateral jsonb_array_elements(m.works) w
   cross join lateral jsonb_array_elements_text(w->'genres') g where m.source='film') genres),
  'workTypes',(select coalesce(jsonb_agg(value order by value),'[]'::jsonb) from (
   select distinct w->>'type' value from quiz_game_internal.catalog_meta m
   cross join lateral jsonb_array_elements(m.works) w) types),
  'techniques',(select coalesce(jsonb_agg(value order by value),'[]'::jsonb) from (
   select distinct t.value from quiz_game_internal.catalog_meta m
   cross join lateral jsonb_array_elements(m.works) w
   cross join lateral jsonb_array_elements_text(w->'techniques') t) techniques),
  'areas',count(distinct case source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else genre end))
 into info from quiz_game_internal.catalog_meta;
 insert into quiz_game_internal.content_info values(true,info) on conflict(id) do update set value=excluded.value;
 delete from quiz_game_internal.journey_cache;
 perform quiz_game_internal.refresh_groups();
 analyze quiz_game_internal.catalog_meta;
 return (select value from quiz_game_internal.content_info where id);
end$$;

CREATE OR REPLACE FUNCTION quiz_ranked_internal.refill(r quiz_ranked_internal.runs)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO ''
AS $function$
 with goals as (
   select distinct on (knowledge_id) id,knowledge_id,difficulty from quiz_ranked_internal.catalog c
   where c.release_hash=(select release_hash from quiz_ranked_internal.config where id) and c.difficulty in ('leicht','mittel','schwer')
     and (r.preset='standard' or (c.source='film' and quiz_game_internal.matches_work(quiz_game_internal.work_references(c.question),r.filters)))
   order by knowledge_id,gen_random_uuid()
 ), levels as (
   select *,row_number() over(partition by difficulty order by gen_random_uuid())-1 as n from goals
 ) select coalesce(jsonb_agg(id order by n/(case when difficulty='mittel' then 4 else 3 end),gen_random_uuid()),'[]') from levels
$function$;

CREATE OR REPLACE FUNCTION quiz_ranked_internal.call(request_text text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
 if exists(select 1 from quiz_ranked_internal.runs where owner_id=p and start_request_id=request_id)
 or (action<>'start' and exists(select 1 from quiz_ranked_internal.runs where owner_id=p and id=(req->>'runId')::uuid
 and status<>'active' and finished_at<stamp-interval '7 days')) then raise exception 'ranked_request_expired'; end if;
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
   if not exists(select 1 from quiz_ranked_internal.config cfg where cfg.release_hash=ranked_request.release_hash and cfg.question_count>=10) then raise exception 'ranked_catalog_missing'; end if;
   select jsonb_agg(distinct area order by area) into genres from quiz_game_internal.catalog_paths p join quiz_game_internal.catalog_meta m using(id) where p.own and m.source='film';
   if req->>'preset'='genre' then
     if req->>'genre' is null or not genres ? (req->>'genre') then raise exception 'invalid_ranked_request'; end if;
     genres:=jsonb_build_array(case when req->>'genre' like 'Serien · %' then substr(req->>'genre',10) else req->>'genre' end);
   else genres:='null'::jsonb; end if;
   run_filters:=jsonb_build_object('genres',genres,'sources',case when req->>'preset'='genre' then '["film"]'::jsonb else '["film","awards","actors"]'::jsonb end,
     'difficulties','["leicht","mittel","schwer"]'::jsonb,'familiarities','[1,2,3,4]'::jsonb);
   if req->>'preset'='genre' then run_filters:=run_filters||jsonb_build_object('workTypes',jsonb_build_array(case when req->>'genre' like 'Serien · %' then 'series' else 'film' end));end if;
   insert into quiz_ranked_internal.runs(owner_id,session_id,release_hash,mode,preset,filters,solution_display,category,start_request_id)
   values(p,sid,release_hash,req->>'mode',req->>'preset',run_filters,req->>'solutionDisplay',
     jsonb_build_array('records-v3',req->>'mode',run_filters,'Alle Themen',case when req->>'mode'='rekord' then '10' else 'endless' end,'solo-server-v1.'||(req->>'mode')||'.'||(req->>'preset'))::text,request_id) returning * into r;
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
end $function$;

alter table public.quiz_duels drop constraint quiz_duels_selection_check;
alter table public.quiz_duels add constraint quiz_duels_selection_check check(selection in ('all','actors','awards','Science-Fiction','Action','Horror','Fantasy','Komödie','Western','Drama','Abenteuer','Musik','Thriller','Martial Arts & Asia-Film','Rom-Com','films','series','animation','Serien · Science-Fiction','Serien · Action','Serien · Horror','Serien · Fantasy','Serien · Komödie','Serien · Western','Serien · Drama','Serien · Abenteuer','Serien · Musik','Serien · Thriller','Serien · Martial Arts & Asia-Film','Serien · Rom-Com'));
create function quiz_game_internal.duel_matches(q jsonb,topic text) returns boolean
language sql immutable set search_path='' as $$
 select topic='all' or
  (topic='actors' and coalesce(q->'metadata'->>'person_id','')<>'') or
  (topic='awards' and coalesce(q->'metadata'->>'person_id','')='' and q->'tags' ? 'Preisträger') or
  (topic not in ('all','actors','awards') and coalesce(q->'metadata'->>'person_id','')='' and not(q->'tags' ? 'Preisträger')
   and quiz_game_internal.matches_work(quiz_game_internal.work_references(q),case
    when topic='films' then '{"genres":null,"workTypes":["film"]}'::jsonb
    when topic='series' then '{"genres":null,"workTypes":["series"]}'::jsonb
    when topic='animation' then '{"genres":null,"techniques":["animation"]}'::jsonb
    when topic like 'Serien · %' then jsonb_build_object('genres',jsonb_build_array(substr(topic,10)),'workTypes','["series"]'::jsonb)
    else jsonb_build_object('genres',jsonb_build_array(topic),'workTypes','["film"]'::jsonb) end))
$$;
revoke all on function quiz_game_internal.duel_matches(jsonb,text) from public,anon,authenticated;
create or replace function public.quiz_duel_create(display text,invited boolean,request uuid, selected_topic text default 'all') returns jsonb language plpgsql security definer set search_path='' as $$
declare p uuid:=public.quiz_duel_lock(); d public.quiz_duels; pack jsonb:='[]'; block jsonb; taken text[]:='{}';
begin
  perform pg_advisory_xact_lock(hashtextextended(p::text,20261011));
  if display not in ('question','round') or display is null or request is null or invited is null then raise exception 'invalid_duel'; end if;
  select * into d from public.quiz_duels where creator=p and request_id=request;
  if found then return public.quiz_duel_summary(d,p); end if;
  select * into d from public.quiz_duels where opponent=p and join_request=request;
  if found then return public.quiz_duel_summary(d,p); end if;
  if selected_topic is null or selected_topic not in ('all','actors','awards','Science-Fiction','Action','Horror','Fantasy','Komödie','Western','Drama','Abenteuer','Musik','Thriller','Martial Arts & Asia-Film','Rom-Com','films','series','animation','Serien · Science-Fiction','Serien · Action','Serien · Horror','Serien · Fantasy','Serien · Komödie','Serien · Western','Serien · Drama','Serien · Abenteuer','Serien · Musik','Serien · Thriller','Serien · Martial Arts & Asia-Film','Serien · Rom-Com') then raise exception 'invalid_duel_topic'; end if;
  if public.quiz_duel_slots(p)>=10 then raise exception 'duel_limit'; end if;
  for r in 1..3 loop
    with goals as (
      select distinct on (knowledge_id) * from public.quiz_duel_catalog where enabled and quiz_game_internal.duel_matches(question,selected_topic) and difficulty in ('leicht','mittel','schwer') and not knowledge_id=any(taken)
        order by knowledge_id,random()
    ), spread as (
      select *,row_number() over(partition by difficulty,genre order by -ln(greatest(random(),0.0001))/case when familiarity in(1,2) then 3 else 1 end) as genre_rank from goals
    ), picked as (
      select *,row_number() over(partition by difficulty order by genre_rank,random()) as difficulty_rank from spread
    ), prepared as materialized (
      select public.quiz_year_question(question) as question from picked where difficulty_rank<=case when difficulty='mittel' then 4 else 3 end
    ) select coalesce(jsonb_agg(jsonb_build_object('question',question,'order',(select jsonb_agg(a->>'id' order by random()) from jsonb_array_elements(question->'answers') a)) order by random()),'[]') into block
      from prepared;
    if jsonb_array_length(block)<>10 then raise exception 'duel_catalog_missing'; end if;
    select taken||array_agg(q->'question'->>'knowledgeId') into taken from jsonb_array_elements(block) q;
    pack:=pack||block;
  end loop;
  insert into public.quiz_duels(creator,kind,solution_display,questions,turn_owner,request_id,selection)
    values(p,case when invited then 'invite' else 'random' end,display,pack,p,request,selected_topic) returning * into d;
  return public.quiz_duel_summary(d,p);
end $$;
-- The allowed topics are consent to join immediately. No eligible offer
-- means no match, without silently creating a new challenge.
create or replace function public.quiz_duel_find(allowed_topics text[],request uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p uuid:=public.quiz_duel_lock(); d public.quiz_duels;
begin
  if allowed_topics is null or cardinality(allowed_topics) not between 1 and 30 or request is null
    or exists(select 1 from unnest(allowed_topics) t where t is null or t not in ('all','actors','awards','Science-Fiction','Action','Horror','Fantasy','Komödie','Western','Drama','Abenteuer','Musik','Thriller','Martial Arts & Asia-Film','Rom-Com','films','series','animation','Serien · Science-Fiction','Serien · Action','Serien · Horror','Serien · Fantasy','Serien · Komödie','Serien · Western','Serien · Drama','Serien · Abenteuer','Serien · Musik','Serien · Thriller','Serien · Martial Arts & Asia-Film','Serien · Rom-Com')) then
    raise exception 'invalid_duel_topic';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p::text,20261011));
  select * into d from public.quiz_duels where opponent=p and join_request=request;
  if found then return public.quiz_duel_summary(d,p); end if;
  if public.quiz_duel_slots(p)>=10 then raise exception 'duel_limit'; end if;
  select * into d from public.quiz_duels where status='waiting' and kind='random' and creator<>p
    and solution_display='question' and selection=any(allowed_topics) and due_at>clock_timestamp()
    order by created_at,id limit 1 for update skip locked;
  if not found then return null; end if;
  update public.quiz_duels set opponent=p,status='active',turn_owner=p,turn_round=1,
    due_at=clock_timestamp()+interval '72 hours',join_request=request where id=d.id returning * into d;
  return public.quiz_duel_summary(d,p);
end $$;
revoke all on function public.quiz_duel_find(text[],uuid) from public,anon;
grant execute on function public.quiz_duel_find(text[],uuid) to authenticated;

revoke all on function quiz_game_internal.matches(quiz_game_internal.catalog_meta,jsonb,text) from public,anon,authenticated;
revoke all on function quiz_ranked_internal.call(text) from public,anon,authenticated;
revoke all on function quiz_ranked_internal.refill(quiz_ranked_internal.runs) from public,anon,authenticated;

-- Universal has no genre restriction; category responses still return an array.
create or replace view quiz_ranked_internal.scores with (security_invoker=true) as
 select r.owner_id,'ranked-'||r.id::text as round_id,public.quiz_duel_name(r.owner_id) as player_name,
   r.category,
   array(select jsonb_array_elements_text(nullif(r.filters->'genres','null'::jsonb))) as genres,
   array['leicht','mittel','schwer']::text[] as difficulties,
   'Alle Themen'::text as topic,r.answered as question_count,'solo-server-v1.'||r.mode||'.'||r.preset as rule_version,
   r.points,r.hits as correct,r.elapsed_ms,extract(epoch from r.finished_at)::double precision*1000 as finished_at,r.mode
 from quiz_ranked_internal.runs r join auth.users u on u.id=r.owner_id
 where r.status='completed' and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false);

select quiz_game_internal.refresh_content() where exists(select 1 from quiz_ranked_internal.config where release_hash is not null);
commit;
