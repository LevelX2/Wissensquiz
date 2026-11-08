-- Private, single-screen party games. No writes to learning, XP or rankings.
begin;
create schema quiz_hot_seat_internal;
revoke all on schema quiz_hot_seat_internal from public,anon,authenticated;

create table quiz_hot_seat_internal.parties (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 setup jsonb not null, players jsonb not null, roster jsonb not null,
 round_topics text[] not null, round_index integer not null default 0,
 turn_index integer not null default 0, item_index integer not null default -1,
 tie_round integer not null default 0, winners jsonb not null default '[]',
 phase text not null default 'ready' check(phase in ('ready','question','handoff','offer-steal','stealing','moderate','reveal','interval','result')),
 status text not null default 'active' check(status in ('active','completed','aborted')),
 revision integer not null default 0,
 created_at timestamptz not null default clock_timestamp(),
 finished_at timestamptz
);
create unique index hot_seat_one_active on quiz_hot_seat_internal.parties(owner_id) where status='active';
create index hot_seat_history on quiz_hot_seat_internal.parties(owner_id,created_at desc,id);
create table quiz_hot_seat_internal.questions (
 party_id uuid not null references quiz_hot_seat_internal.parties(id) on delete cascade,
 position integer not null, theme text not null, difficulty text not null,
 knowledge_id text not null, question jsonb not null, answer_order jsonb not null,
 answers jsonb not null default '[]', double_players jsonb not null default '[]',
 stealer integer, deadline timestamptz,
 primary key(party_id,position), unique(party_id,knowledge_id)
);
create table quiz_hot_seat_internal.templates (
 owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 60), setup jsonb not null,
 primary key(owner_id,name)
);
create table quiz_hot_seat_internal.receipts (
 owner_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null, proof text not null,
 party_id uuid references quiz_hot_seat_internal.parties(id) on delete cascade,
 primary key(owner_id,request_id)
);
alter table quiz_hot_seat_internal.parties enable row level security;
alter table quiz_hot_seat_internal.questions enable row level security;
alter table quiz_hot_seat_internal.templates enable row level security;
alter table quiz_hot_seat_internal.receipts enable row level security;
revoke all on all tables in schema quiz_hot_seat_internal from public,anon,authenticated;

create function quiz_hot_seat_internal.setup(value jsonb) returns jsonb
language plpgsql immutable set search_path='' as $$
declare f jsonb:=value->'filters'; t text;
begin
 if jsonb_typeof(value) is distinct from 'object' or length(value::text)>16000 or
  coalesce(value->>'mode','') not in ('quiz','hunt','risk','all') or
  coalesce(value->>'rounds','') not in ('3','6','9') or
  coalesce(value->>'seconds','') not in ('0','30') or
  coalesce(value->>'input','') not in ('moderated','hidden') or
  jsonb_typeof(value->'topics') is distinct from 'array' or
  jsonb_array_length(value->'topics') not between 1 and 16 or
  jsonb_typeof(f) is distinct from 'object' then raise exception 'hot_seat_setup'; end if;
 foreach t in array array['teams','double','steal','tieBreak','sound','explanations'] loop
  if jsonb_typeof(value->t) is distinct from 'boolean' then raise exception 'hot_seat_setup'; end if;
 end loop;
 if jsonb_typeof(f->'sources') is distinct from 'array' or jsonb_array_length(f->'sources') not between 1 and 3 or
  not (f->'sources' <@ '["film","actors","awards"]'::jsonb) or
  jsonb_typeof(f->'familiarities') is distinct from 'array' or jsonb_array_length(f->'familiarities') not between 1 and 4 or
  not (f->'familiarities' <@ '[1,2,3,4]'::jsonb) or
  (f ? 'workTypes' and (jsonb_typeof(f->'workTypes')<>'array' or jsonb_array_length(f->'workTypes') not between 1 and 2 or not(f->'workTypes' <@ '["film","series"]'::jsonb))) or
  (f ? 'techniques' and (jsonb_typeof(f->'techniques')<>'array' or jsonb_array_length(f->'techniques') not between 1 and 2 or not(f->'techniques' <@ '["animation","live-action"]'::jsonb))) then raise exception 'hot_seat_setup'; end if;
 for t in select jsonb_array_elements_text(value->'topics') loop
  if t not in ('mix','actors','awards') and (left(t,6)<>'genre:' or length(t) not between 7 and 160) then raise exception 'hot_seat_setup'; end if;
 end loop;
 -- Only supported filters cross this boundary; no private learning filters.
 f:=jsonb_build_object('sources',f->'sources','familiarities',f->'familiarities',
  'genres',null,'difficulties',jsonb_build_array('leicht','mittel','schwer'))
  ||case when f ? 'workTypes' then jsonb_build_object('workTypes',f->'workTypes') else '{}' end
  ||case when f ? 'techniques' then jsonb_build_object('techniques',f->'techniques') else '{}' end;
 return jsonb_build_object('mode',value->'mode','rounds',(value->>'rounds')::integer,
  'seconds',(value->>'seconds')::integer,'input',value->'input','topics',value->'topics',
  'teams',value->'teams','double',value->'double','steal',case when value->>'mode'='all' then 'false'::jsonb else value->'steal' end,
  'tieBreak',value->'tieBreak','sound',value->'sound','explanations',value->'explanations','filters',f);
end$$;

create function quiz_hot_seat_internal.pool(config jsonb,theme text,diff text,party uuid default null)
returns setof quiz_game_internal.catalog_meta language sql stable set search_path='' as $$
 select m.* from quiz_game_internal.catalog_meta m
 where m.difficulty=diff and quiz_game_internal.matches(m,config->'filters','Alle Themen')
 and case when theme='mix' then true when theme='actors' then m.source='actors'
  when theme='awards' then m.source='awards' else m.source='film' and
   quiz_game_internal.matches_work(m.works,jsonb_set(config->'filters','{genres}',jsonb_build_array(substr(theme,7)))) end
 and not exists(select 1 from quiz_hot_seat_internal.questions q where q.party_id=party and q.knowledge_id=m.knowledge_id)
$$;

create function quiz_hot_seat_internal.options(config jsonb,party uuid default null) returns jsonb
language sql stable set search_path='' as $$
 with filtered as materialized (
  select m.* from quiz_game_internal.catalog_meta m
  where m.difficulty in ('leicht','mittel','schwer') and quiz_game_internal.matches(m,config->'filters','Alle Themen')
  and not exists(select 1 from quiz_hot_seat_internal.questions q where q.party_id=party and q.knowledge_id=m.knowledge_id)
 ), topics as (
  select 'mix' id,'Bunter Mix' label,knowledge_id,difficulty from filtered
  union all select 'actors','Schauspieler',knowledge_id,difficulty from filtered where source='actors'
  union all select 'awards','Preise',knowledge_id,difficulty from filtered where source='awards'
  union all select 'genre:'||g,g,knowledge_id,difficulty from filtered
   cross join lateral jsonb_array_elements(works) w cross join lateral jsonb_array_elements_text(w->'genres') g
   where source='film' and quiz_game_internal.matches_work(jsonb_build_array(w),config->'filters')
 ), counts as (select id,label,difficulty,count(distinct knowledge_id) n from topics group by id,label,difficulty),
 combined as (select id,label,jsonb_object_agg(difficulty,n) counts from counts group by id,label)
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'label',label,'counts',counts) order by case id when 'mix' then 0 else 1 end,label),'[]') from combined
$$;

create function quiz_hot_seat_internal.difficulty(s quiz_hot_seat_internal.parties) returns text
language sql immutable set search_path='' as $$
 select case when s.tie_round>0 then 'mittel'
  when s.round_index<(s.setup->>'rounds')::integer/3 then 'leicht'
  when s.round_index<2*(s.setup->>'rounds')::integer/3 then 'mittel' else 'schwer' end
$$;
create function quiz_hot_seat_internal.player(s quiz_hot_seat_internal.parties) returns integer
language sql immutable set search_path='' as $$
 select (s.roster->>((s.turn_index+s.round_index)%jsonb_array_length(s.roster)))::integer
$$;
create function quiz_hot_seat_internal.pick(s quiz_hot_seat_internal.parties,theme text,diff text,pos integer) returns void
language plpgsql set search_path='' as $$
declare content jsonb; goal text; chosen_works jsonb; ordering jsonb;
begin
 select public.quiz_year_question(c.question),m.knowledge_id,m.works into content,goal,chosen_works
 from (select distinct on (knowledge_id) * from quiz_hot_seat_internal.pool(s.setup,theme,diff,s.id) order by knowledge_id,random()) m
 join quiz_ranked_internal.catalog c on c.id=m.id and c.release_hash=(select release_hash from quiz_ranked_internal.config where id)
 where coalesce(c.question->>'demo','false')='false'
 order by (exists(select 1 from quiz_hot_seat_internal.questions old where old.party_id=s.id and
  ((coalesce(c.question->'metadata'->>'person_id','')<>'' and old.question->'metadata'->>'person_id'=c.question->'metadata'->>'person_id') or
   exists(select 1 from jsonb_array_elements(m.works) w join jsonb_array_elements(coalesce(old.question->'works','[]')) used
    on used->>'type'=w->>'type' and used->>'originalTitle'=w->>'originalTitle' and used->>'year'=w->>'year'))))::integer, random()
 limit 1;
 if content is null then raise exception 'hot_seat_pool:%:%',theme,diff; end if;
 content:=content||jsonb_build_object('works',chosen_works);
 select jsonb_agg(a->'id' order by random()) into ordering from jsonb_array_elements(content->'answers') a;
 insert into quiz_hot_seat_internal.questions(party_id,position,theme,difficulty,knowledge_id,question,answer_order)
 values(s.id,pos,theme,diff,goal,content,ordering);
end$$;

create function quiz_hot_seat_internal.leaders(s quiz_hot_seat_internal.parties) returns jsonb
language sql immutable set search_path='' as $$
 with scores as (
  select i::integer idx,case when s.tie_round>0 then (p->>'tieScore')::integer
   when s.setup->>'mode'='hunt' then jsonb_array_length(p->'badges')*10000+(p->>'score')::integer else (p->>'score')::integer end score
  from jsonb_array_elements(s.players) with ordinality v(p,n)
  cross join lateral (select (n-1)::text i) x where s.roster @> jsonb_build_array((n-1)::integer)
 ) select coalesce(jsonb_agg(idx order by idx),'[]') from scores where score=(select max(score) from scores)
$$;

create function quiz_hot_seat_internal.award(s quiz_hot_seat_internal.parties,who integer,correct boolean,diff text,theme text,doubled boolean,kind text)
returns quiz_hot_seat_internal.parties language plpgsql set search_path='' as $$
declare p jsonb:=s.players->who; pts integer; badges jsonb:=p->'badges'; streak integer;
begin
 if s.tie_round>0 then
  p:=jsonb_set(p,'{tieScore}',to_jsonb((p->>'tieScore')::integer+case when correct then 1 else 0 end));
 else
  pts:=case when kind='steal' then case when correct then 1 else 0 end
   when s.setup->>'mode'='risk' then case diff when 'leicht' then case when correct then 1 else 0 end
    when 'mittel' then case when correct then 3 else -1 end else case when correct then 5 else -2 end end
   when correct then case diff when 'leicht' then 1 when 'mittel' then 2 else 3 end else 0 end;
  if doubled and pts>0 and kind='regular' then pts:=2*pts; end if;
  if s.setup->>'mode'='hunt' and correct and kind='regular' and not badges ? theme then badges:=badges||jsonb_build_array(theme); end if;
  streak:=case when kind='regular' then case when correct then (p->>'streak')::integer+1 else 0 end else (p->>'streak')::integer end;
  p:=p||jsonb_build_object('score',(p->>'score')::integer+pts,'badges',badges,'streak',streak,
   'bestStreak',greatest(streak,(p->>'bestStreak')::integer),'hits',(p->>'hits')::integer+case when correct and kind='regular' then 1 else 0 end,
   'answered',(p->>'answered')::integer+case when kind='regular' then 1 else 0 end);
 end if;
 s.players:=jsonb_set(s.players,array[who::text],p);
 return s;
end$$;

create function quiz_hot_seat_internal.view(s quiz_hot_seat_internal.parties) returns jsonb
language plpgsql stable set search_path='' as $$
declare q quiz_hot_seat_internal.questions; displayed jsonb; who integer; choices jsonb:='[]';
begin
 select * into q from quiz_hot_seat_internal.questions where party_id=s.id and position=s.item_index;
 who:=quiz_hot_seat_internal.player(s);
 if s.phase in ('offer-steal','stealing') then who:=q.stealer; end if;
 if s.phase in ('question','offer-steal','stealing','moderate','reveal') then
  displayed:=jsonb_build_object('position',q.position,'theme',q.theme,'difficulty',q.difficulty,
   'question',case when s.phase in ('moderate','reveal') then q.question else quiz_ranked_internal.visible(q.question) end,
   'order',q.answer_order,'deadline',case when q.deadline is null then null else floor(extract(epoch from q.deadline)*1000)::bigint end,
   'doublePlayers',q.double_players,'answers',case when s.phase='reveal' then q.answers else '[]'::jsonb end);
 end if;
 if s.phase='ready' and s.setup->>'mode' in ('risk','hunt') then
  select coalesce(jsonb_agg(o),'[]') into choices from jsonb_array_elements(quiz_hot_seat_internal.options(s.setup,s.id)) o where s.setup->'topics' ? (o->>'id');
 end if;
 return jsonb_build_object('id',s.id,'setup',s.setup,'players',s.players,'roster',s.roster,
  'round',s.round_index,'turn',s.turn_index,'tieRound',s.tie_round,'phase',s.phase,'status',s.status,
  'revision',s.revision,'player',who,'theme',s.round_topics[1+s.round_index%cardinality(s.round_topics)],
  'difficulty',quiz_hot_seat_internal.difficulty(s),'current',displayed,'choices',choices,'winners',s.winners,
  'createdAt',floor(extract(epoch from s.created_at)*1000)::bigint,
  'finishedAt',case when s.finished_at is null then null else floor(extract(epoch from s.finished_at)*1000)::bigint end,
  'serverNow',floor(extract(epoch from clock_timestamp())*1000)::bigint);
end$$;

create function quiz_hot_seat_internal.call(request_text text) returns jsonb
language plpgsql set search_path='' as $$
declare player uuid:=quiz_sync_internal.require_owner(auth.uid()); req jsonb; action text;
 s quiz_hot_seat_internal.parties; q quiz_hot_seat_internal.questions; receipt quiz_hot_seat_internal.receipts;
 config jsonb; ps jsonb:='[]'; p jsonb; members jsonb; names text[]:=array[]::text[]; total integer:=0;
 theme text; diff text; who integer; k integer; n integer; pos integer; needed integer;
 chosen text; correct boolean; before_score integer; gained integer; answers jsonb; doubles jsonb;
 v_request_id uuid; leaders jsonb; target uuid; page_no integer; reply jsonb; count_found integer;
begin
 if request_text is null or length(request_text)>24000 then raise exception 'hot_seat_request'; end if;
 req:=request_text::jsonb; action:=req->>'action';
 if action='options' then
  config:=quiz_hot_seat_internal.setup(req->'setup');
  return jsonb_build_object('options',quiz_hot_seat_internal.options(config));
 end if;
 if action='lobby' then
  page_no:=greatest(0,least(100000,coalesce((req->>'page')::integer,0)));
  return jsonb_build_object(
   'active',(select quiz_hot_seat_internal.view(v) from quiz_hot_seat_internal.parties v where owner_id=player and status='active'),
   'history',(select coalesce(jsonb_agg(quiz_hot_seat_internal.view(v) order by created_at desc,id),'[]') from
    (select * from quiz_hot_seat_internal.parties where owner_id=player and status<>'active' order by created_at desc,id limit 10 offset page_no*10) v),
   'hasMore',(select count(*)>page_no*10+10 from quiz_hot_seat_internal.parties where owner_id=player and status<>'active'),
   'templates',(select coalesce(jsonb_agg(jsonb_build_object('name',name,'setup',setup) order by name),'[]') from quiz_hot_seat_internal.templates where owner_id=player));
 end if;
 if action='resume' then
  select * into s from quiz_hot_seat_internal.parties where id=(req->>'partyId')::uuid and owner_id=player;
  if not found then raise exception 'hot_seat_missing'; end if;
  return jsonb_build_object('party',quiz_hot_seat_internal.view(s));
 end if;
 -- A separate per-host lock serializes only this feature, never other accounts.
 perform pg_advisory_xact_lock(hashtextextended(player::text,20261108));
 v_request_id:=(req->>'requestId')::uuid;
 if v_request_id is null then raise exception 'hot_seat_request'; end if;
 select * into receipt from quiz_hot_seat_internal.receipts r where owner_id=player and r.request_id=v_request_id;
 if found then
  if receipt.proof<>md5(request_text) then raise exception 'hot_seat_request'; end if;
  if receipt.party_id is null then return jsonb_build_object('ok',true); end if;
  select * into strict s from quiz_hot_seat_internal.parties where id=receipt.party_id and owner_id=player;
  return jsonb_build_object('party',quiz_hot_seat_internal.view(s));
 end if;
 if action in ('template-save','template-delete') then
  theme:=btrim(req->>'name');
  if coalesce(length(theme),0) not between 1 and 60 then raise exception 'hot_seat_setup'; end if;
  if action='template-save' then
   config:=quiz_hot_seat_internal.setup(req->'setup');
   if (select count(*) from quiz_hot_seat_internal.templates where owner_id=player)>=20 and
    not exists(select 1 from quiz_hot_seat_internal.templates where owner_id=player and name=theme) then raise exception 'hot_seat_templates'; end if;
   insert into quiz_hot_seat_internal.templates values(player,theme,config) on conflict(owner_id,name) do update set setup=excluded.setup;
  else delete from quiz_hot_seat_internal.templates where owner_id=player and name=theme; end if;
 elsif action='create' then
  config:=quiz_hot_seat_internal.setup(req->'setup');
  if exists(select 1 from quiz_hot_seat_internal.parties where owner_id=player and status='active') then raise exception 'hot_seat_active'; end if;
  if jsonb_typeof(req->'players') is distinct from 'array' or jsonb_array_length(req->'players') not between 2 and 8 then raise exception 'hot_seat_players'; end if;
  for p in select value from jsonb_array_elements(req->'players') loop
   theme:=btrim(p->>'name'); members:=p->'members';
   if coalesce(length(theme),0) not between 1 and 28 or lower(theme)=any(names) or
    jsonb_typeof(members) is distinct from 'array' or jsonb_array_length(members) not between 1 and 7 or
    exists(select 1 from jsonb_array_elements(members) member where jsonb_typeof(member)<>'string' or length(btrim(member#>>'{}')) not between 1 and 40) then raise exception 'hot_seat_players'; end if;
   if config->>'teams'='false' and jsonb_array_length(members)<>1 then raise exception 'hot_seat_players'; end if;
   names:=array_append(names,lower(theme)); total:=total+jsonb_array_length(members);
   ps:=ps||jsonb_build_array(jsonb_build_object('name',theme,'members',members,'score',0,'hits',0,'answered',0,
    'badges','[]'::jsonb,'doubleUsed',false,'stealUsed',false,'streak',0,'bestStreak',0,'tieScore',0));
  end loop;
  if total>8 then raise exception 'hot_seat_players'; end if;
  select array_agg(t order by random()) into names from jsonb_array_elements_text(config->'topics') t;
  insert into quiz_hot_seat_internal.parties(owner_id,setup,players,roster,round_topics)
   values(player,config,ps,(select jsonb_agg(i) from generate_series(0,jsonb_array_length(ps)-1) i),names) returning * into s;
  n:=case when config->>'mode'='all' then 1 else jsonb_array_length(ps) end;
  if config->>'mode' in ('quiz','all') then
   -- Reserve the entire finite schedule privately. No later catalog update or
   -- overlapping topic can silently shorten a player's allocation.
   for pos in 0..(config->>'rounds')::integer*n-1 loop
    s.round_index:=pos/n;
    theme:=names[1+s.round_index%cardinality(names)]; diff:=quiz_hot_seat_internal.difficulty(s);
    perform quiz_hot_seat_internal.pick(s,theme,diff,pos);
   end loop;
   s.round_index:=0;
  else
   -- Free choices remain available only while an unused target exists.
   select count(distinct knowledge_id) into count_found from quiz_game_internal.catalog_meta m
    where quiz_game_internal.matches(m,config->'filters','Alle Themen') and
     exists(select 1 from jsonb_array_elements_text(config->'topics') t where
      t='mix' or (t='actors' and m.source='actors') or (t='awards' and m.source='awards') or
      (left(t,6)='genre:' and m.source='film' and exists(select 1 from jsonb_array_elements(m.works) w where w->'genres' ? substr(t,7))));
   if count_found<(config->>'rounds')::integer*n then raise exception 'hot_seat_capacity'; end if;
   foreach theme in array names loop
    foreach diff in array array['leicht','mittel','schwer'] loop
     needed:=case when config->>'mode'='risk' then n else 1 end;
     if (select count(distinct knowledge_id) from quiz_hot_seat_internal.pool(config,theme,diff,s.id))<needed then raise exception 'hot_seat_pool:%:%',theme,diff; end if;
    end loop;
   end loop;
  end if;
  target:=s.id;
 else
  select * into s from quiz_hot_seat_internal.parties where id=(req->>'partyId')::uuid and owner_id=player for update;
  if not found then raise exception 'hot_seat_missing'; end if;
  target:=s.id;
  if action='delete' then
   if s.status='active' then raise exception 'hot_seat_active'; end if;
   delete from quiz_hot_seat_internal.parties where id=s.id;
   target:=null;
  else
   if s.revision is distinct from (req->>'revision')::integer then raise exception 'hot_seat_conflict'; end if;
   if s.status<>'active' then raise exception 'hot_seat_closed'; end if;
   select * into q from quiz_hot_seat_internal.questions where party_id=s.id and position=s.item_index;
   who:=quiz_hot_seat_internal.player(s);
   if action='abort' then
    s.status:='aborted'; s.phase:='result'; s.finished_at:=clock_timestamp(); s.winners:='[]';
   elsif action='start-question' then
    if s.phase<>'ready' then raise exception 'hot_seat_phase'; end if;
    theme:=s.round_topics[1+s.round_index%cardinality(s.round_topics)]; diff:=quiz_hot_seat_internal.difficulty(s);
    if s.tie_round=0 and s.setup->>'mode'='hunt' then theme:=req->>'theme'; end if;
    if s.tie_round=0 and s.setup->>'mode'='risk' then diff:=req->>'difficulty'; end if;
    if not s.setup->'topics' ? theme or coalesce(diff,'') not in ('leicht','mittel','schwer') then raise exception 'hot_seat_setup'; end if;
    s.item_index:=s.item_index+1;
    if s.tie_round>0 or s.setup->>'mode' in ('hunt','risk') then perform quiz_hot_seat_internal.pick(s,theme,diff,s.item_index); end if;
    select * into strict q from quiz_hot_seat_internal.questions where party_id=s.id and position=s.item_index;
    s.phase:='question';
   elsif action='ready' then
    if s.phase<>'handoff' then raise exception 'hot_seat_phase'; end if;
    s.phase:='question';
   elsif action in ('take-steal','pass-steal') then
    if s.phase<>'offer-steal' then raise exception 'hot_seat_phase'; end if;
    if action='take-steal' then
     s.players:=jsonb_set(s.players,array[q.stealer::text,'stealUsed'],'true'); s.phase:='stealing';
    else s.phase:='reveal'; q.deadline:=null; end if;
   elsif action='answer' then
    if s.phase not in ('question','stealing') or (s.setup->>'mode'='all' and s.setup->>'input'='moderated') then raise exception 'hot_seat_phase'; end if;
    if s.phase='stealing' then who:=q.stealer; end if;
    chosen:=req->>'answerId';
    if chosen is not null and not exists(select 1 from jsonb_array_elements(q.question->'answers') a where a->>'id'=chosen) then raise exception 'hot_seat_answer'; end if;
    if q.deadline is not null and clock_timestamp()>=q.deadline then chosen:=null; end if;
    correct:=coalesce(chosen=q.question->>'correctId',false);
    before_score:=(s.players->who->>'score')::integer;
    if s.setup->>'mode'<>'all' then
     s:=quiz_hot_seat_internal.award(s,who,correct,q.difficulty,q.theme,q.double_players @> jsonb_build_array(who),case when s.phase='stealing' then 'steal' else 'regular' end);
    end if;
    gained:=(s.players->who->>'score')::integer-before_score;
    q.answers:=q.answers||jsonb_build_array(jsonb_build_object('player',who,'answerId',chosen,'correct',correct,'points',gained,'kind',case when s.phase='stealing' then 'steal' else 'regular' end));
    if s.setup->>'mode'='all' and jsonb_array_length(q.answers)<jsonb_array_length(s.roster) then
     s.turn_index:=s.turn_index+1; s.phase:='handoff';
    elsif s.phase='question' and s.setup->>'mode'<>'all' and not correct and s.setup->>'steal'='true' and s.tie_round=0 then
     q.stealer:=null;
     for k in 1..jsonb_array_length(s.players)-1 loop
      n:=(who+k)%jsonb_array_length(s.players);
      if s.players->n->>'stealUsed'='false' then q.stealer:=n; exit; end if;
     end loop;
     s.phase:=case when q.stealer is null then 'reveal' else 'offer-steal' end;
    else
     if s.setup->>'mode'='all' then
      answers:='[]';
      for p in select value from jsonb_array_elements(q.answers) loop
       n:=(p->>'player')::integer; before_score:=(s.players->n->>'score')::integer;
       s:=quiz_hot_seat_internal.award(s,n,(p->>'correct')::boolean,q.difficulty,q.theme,q.double_players @> jsonb_build_array(n),'regular');
       answers:=answers||jsonb_build_array(p||jsonb_build_object('points',(s.players->n->>'score')::integer-before_score));
      end loop;
      q.answers:=answers;
     end if;
     s.phase:='reveal';
    end if;
    q.deadline:=null;
   elsif action='reveal' then
    if s.phase<>'question' or s.setup->>'mode'<>'all' or s.setup->>'input'<>'moderated' then raise exception 'hot_seat_phase'; end if;
    s.phase:='moderate'; q.deadline:=null;
   elsif action='moderate' then
    if s.phase<>'moderate' then raise exception 'hot_seat_phase'; end if;
    answers:=req->'correctPlayers';
    if jsonb_typeof(answers) is distinct from 'array' or not answers <@ s.roster then raise exception 'hot_seat_answer'; end if;
    for who in select value::integer from jsonb_array_elements_text(s.roster) loop
     correct:=answers @> jsonb_build_array(who); before_score:=(s.players->who->>'score')::integer;
     s:=quiz_hot_seat_internal.award(s,who,correct,q.difficulty,q.theme,q.double_players @> jsonb_build_array(who),'regular');
     q.answers:=q.answers||jsonb_build_array(jsonb_build_object('player',who,'answerId',null,'correct',correct,'points',(s.players->who->>'score')::integer-before_score,'kind','regular'));
    end loop;
    s.phase:='reveal';
   elsif action='next' then
    if s.phase not in ('reveal','interval') then raise exception 'hot_seat_phase'; end if;
    if s.phase='interval' then s.phase:='ready';
    else
     s.turn_index:=case when s.setup->>'mode'='all' then jsonb_array_length(s.roster) else s.turn_index+1 end;
     if s.turn_index>=jsonb_array_length(s.roster) then
      s.turn_index:=0; s.round_index:=s.round_index+1; s.phase:='interval';
      if s.round_index>=(s.setup->>'rounds')::integer or s.tie_round>0 then
       leaders:=quiz_hot_seat_internal.leaders(s);
       if s.setup->>'tieBreak'='true' and jsonb_array_length(leaders)>1 and s.tie_round<3 then
        s.tie_round:=s.tie_round+1; s.roster:=leaders;
       else s.winners:=leaders; s.phase:='result'; s.status:='completed'; s.finished_at:=clock_timestamp(); end if;
      end if;
     else s.phase:='ready'; end if;
    end if;
   else raise exception 'hot_seat_request'; end if;
   if action in ('start-question','ready') then
    who:=quiz_hot_seat_internal.player(s);
    doubles:=coalesce(req->'doublePlayers','[]'::jsonb);
    if jsonb_typeof(doubles) is distinct from 'array' or not doubles <@ s.roster or
     (s.setup->>'mode'<>'all' or s.setup->>'input'='hidden') and not doubles <@ jsonb_build_array(who) then raise exception 'hot_seat_setup'; end if;
    if jsonb_array_length(doubles)>0 then
     if s.setup->>'double'<>'true' or s.tie_round>0 then raise exception 'hot_seat_joker'; end if;
     for k in select distinct value::integer from jsonb_array_elements_text(doubles) loop
      if s.players->k->>'doubleUsed'='true' then raise exception 'hot_seat_joker'; end if;
      s.players:=jsonb_set(s.players,array[k::text,'doubleUsed'],'true');
     end loop;
     q.double_players:=q.double_players||doubles;
    end if;
   end if;
   if action in ('start-question','ready','take-steal') then
    q.deadline:=case when (s.setup->>'seconds')::integer=0 then null else clock_timestamp()+make_interval(secs=>(s.setup->>'seconds')::integer) end;
   end if;
   if q.party_id is not null then
    update quiz_hot_seat_internal.questions set answers=q.answers,double_players=q.double_players,stealer=q.stealer,deadline=q.deadline where party_id=s.id and position=q.position;
   end if;
   s.revision:=s.revision+1;
   update quiz_hot_seat_internal.parties set players=s.players,roster=s.roster,round_index=s.round_index,turn_index=s.turn_index,
    item_index=s.item_index,tie_round=s.tie_round,winners=s.winners,phase=s.phase,status=s.status,revision=s.revision,finished_at=s.finished_at where id=s.id;
  end if;
 end if;
 insert into quiz_hot_seat_internal.receipts values(player,v_request_id,md5(request_text),target);
 if target is null then return jsonb_build_object('ok',true); end if;
 return jsonb_build_object('party',quiz_hot_seat_internal.view(s));
end$$;

-- The sole exposed entry point has an explicit confirmed-owner check inside.
create function public.quiz_hot_seat_call(request_text text) returns jsonb
language sql security definer set search_path='' as $$select quiz_hot_seat_internal.call(request_text)$$;
revoke all on all functions in schema quiz_hot_seat_internal from public,anon,authenticated;
revoke all on function public.quiz_hot_seat_call(text) from public,anon,authenticated;
grant execute on function public.quiz_hot_seat_call(text) to authenticated;
commit;
