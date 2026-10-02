-- Freizeitduelle. Only the service owner installs the public question catalog.
create table public.quiz_duel_catalog (
  id text primary key, knowledge_id text not null, difficulty text not null,
  genre text not null, familiarity integer not null default 0,
  question jsonb not null, enabled boolean not null default true
);
create table public.quiz_duel_mutex (id integer primary key check(id=1));
insert into public.quiz_duel_mutex values(1);
create table public.quiz_duels (
  id uuid primary key default gen_random_uuid(),
  creator uuid not null references auth.users(id) on delete cascade,
  opponent uuid references auth.users(id) on delete cascade,
  kind text not null check(kind in ('random','invite')),
  solution_display text not null check(solution_display in ('question','round')),
  token text not null unique default replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-',''),
  request_id uuid not null,
  join_request uuid,
  questions jsonb not null check(jsonb_array_length(questions)=30),
  status text not null default 'preparing' check(status in ('preparing','waiting','active','completed','cancelled','forfeit')),
  turn_owner uuid, turn_round integer not null default 1 check(turn_round between 1 and 3),
  due_at timestamptz not null default now()+interval '72 hours',
  created_at timestamptz not null default now(), finished_at timestamptz,
  winner uuid, reason text,
  unique(creator,request_id), unique(opponent,join_request), check(opponent is null or opponent<>creator)
);
create index quiz_duel_waiting on public.quiz_duels(solution_display,created_at) where status='waiting' and kind='random';
create index quiz_duel_creator on public.quiz_duels(creator,status);
create index quiz_duel_opponent on public.quiz_duels(opponent,status);
create table public.quiz_duel_answers (
  duel_id uuid not null references public.quiz_duels(id) on delete cascade,
  player uuid not null references auth.users(id) on delete cascade,
  round_no integer not null check(round_no between 1 and 3),
  question_no integer not null check(question_no between 0 and 9),
  started_at timestamptz, answered_at timestamptz,
  answer_id text, dont_know boolean not null default false,
  correct boolean not null default false, guessed boolean not null default false,
  elapsed_ms integer not null default 0,
  primary key(duel_id,player,round_no,question_no)
);
alter table public.quiz_duel_catalog enable row level security;
alter table public.quiz_duel_mutex enable row level security;
alter table public.quiz_duels enable row level security;
alter table public.quiz_duel_answers enable row level security;
revoke all on public.quiz_duel_catalog,public.quiz_duel_mutex,public.quiz_duels,public.quiz_duel_answers from public,anon,authenticated;

-- Every mutation takes the same short lock, covering joining and both slot limits.
create function public.quiz_duel_lock() returns uuid language plpgsql security definer set search_path='' as $$
declare p uuid:=auth.uid();
begin
  if p is null or not public.quiz_verified_user() then raise exception 'verified_account_required' using errcode='42501'; end if;
  perform 1 from public.quiz_duel_mutex where id=1 for update;
  update public.quiz_duels d set status=case when d.status='active' and exists(
      select 1 from public.quiz_duel_answers a where a.duel_id=d.id and a.answered_at is not null
      group by a.round_no having count(*)=20) then 'forfeit' else 'cancelled' end,
    winner=case when d.status='active' and exists(
      select 1 from public.quiz_duel_answers a where a.duel_id=d.id and a.answered_at is not null
      group by a.round_no having count(*)=20) then case when d.turn_owner=d.creator then d.opponent else d.creator end else null end,
    finished_at=d.due_at, reason=case when d.status='waiting' then 'no_opponent' else 'timeout' end
    where d.status in ('preparing','waiting','active') and d.due_at<=clock_timestamp();
  return p;
end $$;

create function public.quiz_duel_slots(p uuid) returns integer language sql stable security definer set search_path='' as $$
  select count(*)::integer from public.quiz_duels where (creator=p or opponent=p) and status in ('preparing','waiting','active');
$$;
create function public.quiz_duel_count(d uuid,p uuid,r integer) returns integer language sql stable security definer set search_path='' as $$
  select count(*)::integer from public.quiz_duel_answers where duel_id=d and player=p and round_no=r and question_no between 0 and 9 and answered_at is not null;
$$;
create function public.quiz_duel_name(p uuid) returns text language sql stable security definer set search_path='' as $$
  select left(coalesce(nullif(raw_user_meta_data->>'display_name',''),'Filmspieler'),40) from auth.users where id=p;
$$;

create function public.quiz_duel_summary(d public.quiz_duels,p uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare other uuid:=case when p=d.creator then d.opponent else d.creator end;
  rounds jsonb:='[]'; mine integer; theirs integer; hit integer; otherhit integer;
begin
  for r in 1..3 loop
    mine:=public.quiz_duel_count(d.id,p,r); theirs:=public.quiz_duel_count(d.id,other,r);
    select count(*) filter(where correct)::integer into hit from public.quiz_duel_answers where duel_id=d.id and player=p and round_no=r and answered_at is not null;
    select count(*) filter(where correct)::integer into otherhit from public.quiz_duel_answers where duel_id=d.id and player=other and round_no=r and answered_at is not null;
    rounds:=rounds||jsonb_build_array(jsonb_build_object('number',r,'answered',mine,
      'mine',case when mine=10 then hit else null end,
      'opponent',case when mine=10 and theirs=10 then otherhit else null end));
  end loop;
  return jsonb_build_object('id',d.id,'opponent',coalesce(public.quiz_duel_name(other),'Gegner wird gesucht'),
    'status',d.status,'kind',d.kind,'solutionDisplay',d.solution_display,'round',d.turn_round,
    'myTurn',d.turn_owner=p and d.status in ('preparing','active'),
    'dueAt',floor(extract(epoch from d.due_at)*1000)::bigint,
    'createdAt',floor(extract(epoch from d.created_at)*1000)::bigint,
    'reason',d.reason,'result',case when d.status='completed' and d.winner is null then 'draw' when d.winner=p then 'win' when d.winner=other then 'loss' else null end,
    'invitation',case when d.creator=p and d.kind='invite' and d.status='waiting' then d.token else null end,'rounds',rounds);
end $$;

create function public.quiz_duel_list() returns jsonb language plpgsql security definer set search_path='' as $$
declare p uuid:=public.quiz_duel_lock(); result jsonb;
begin
  select coalesce(jsonb_agg(public.quiz_duel_summary(d,p) order by (d.status in ('preparing','waiting','active')) desc,d.created_at desc),'[]') into result
    from (select * from public.quiz_duels where creator=p or opponent=p order by (status in ('preparing','waiting','active')) desc,created_at desc limit 100) d;
  return result;
end $$;

create function public.quiz_duel_create(display text,invited boolean,request uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare p uuid:=public.quiz_duel_lock(); d public.quiz_duels; pack jsonb:='[]'; block jsonb; taken text[]:='{}';
begin
  if display not in ('question','round') or display is null or request is null or invited is null then raise exception 'invalid_duel'; end if;
  select * into d from public.quiz_duels where creator=p and request_id=request;
  if found then return public.quiz_duel_summary(d,p); end if;
  -- An idempotent matching retry uses the request id too, without exposing it.
  select * into d from public.quiz_duels where opponent=p and join_request=request;
  if found then return public.quiz_duel_summary(d,p); end if;
  if public.quiz_duel_slots(p)>=5 then raise exception 'duel_limit'; end if;
  if not invited then
    select * into d from public.quiz_duels where status='waiting' and kind='random' and creator<>p and solution_display=display
      and public.quiz_duel_slots(creator)<=5 order by created_at limit 1;
    if found then
      update public.quiz_duels set opponent=p,status='active',turn_owner=p,turn_round=1,due_at=clock_timestamp()+interval '72 hours',join_request=request where id=d.id returning * into d;
      return public.quiz_duel_summary(d,p);
    end if;
  end if;
  if exists(select 1 from public.quiz_duels where creator=p and opponent is null and status in ('preparing','waiting')) then raise exception 'waiting_limit'; end if;
  for r in 1..3 loop
    with goals as (
      select distinct on (knowledge_id) * from public.quiz_duel_catalog where enabled and difficulty in ('leicht','mittel','schwer') and not knowledge_id=any(taken)
        order by knowledge_id,random()
    ), spread as (
      select *,row_number() over(partition by difficulty,genre order by -ln(greatest(random(),0.0001))/case when familiarity in(1,2) then 3 else 1 end) as genre_rank from goals
    ), picked as (
      select *,row_number() over(partition by difficulty order by genre_rank,random()) as difficulty_rank from spread
    ) select coalesce(jsonb_agg(jsonb_build_object('question',question,'order',(select jsonb_agg(a->>'id' order by random()) from jsonb_array_elements(question->'answers') a)) order by random()),'[]') into block
      from picked where difficulty_rank<=case when difficulty='mittel' then 4 else 3 end;
    if jsonb_array_length(block)<>10 then raise exception 'duel_catalog_missing'; end if;
    select taken||array_agg(q->'question'->>'knowledgeId') into taken from jsonb_array_elements(block) q;
    pack:=pack||block;
  end loop;
  insert into public.quiz_duels(creator,kind,solution_display,questions,turn_owner,request_id)
    values(p,case when invited then 'invite' else 'random' end,display,pack,p,request) returning * into d;
  return public.quiz_duel_summary(d,p);
end $$;

create function public.quiz_duel_join(invitation text) returns jsonb language plpgsql security definer set search_path='' as $$
declare p uuid:=public.quiz_duel_lock(); d public.quiz_duels;
begin
  if invitation is null or invitation !~ '^[a-f0-9]{64}$' then raise exception 'invalid_invitation'; end if;
  select * into d from public.quiz_duels where token=invitation and kind='invite';
  if not found then raise exception 'invalid_invitation'; end if;
  if d.creator=p then raise exception 'self_duel'; end if;
  if d.opponent=p then return public.quiz_duel_summary(d,p); end if;
  if d.status<>'waiting' then raise exception 'invitation_unavailable'; end if;
  if public.quiz_duel_slots(p)>=5 then raise exception 'duel_limit'; end if;
  update public.quiz_duels set opponent=p,status='active',turn_owner=p,turn_round=1,due_at=clock_timestamp()+interval '72 hours' where id=d.id returning * into d;
  return public.quiz_duel_summary(d,p);
end $$;

-- An own answered question becomes available for learning; an unanswered one is scrubbed.
create function public.quiz_duel_view(duel uuid,round_number integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare p uuid:=public.quiz_duel_lock(); d public.quiz_duels; items jsonb:='[]'; q jsonb; a public.quiz_duel_answers; n integer; current_item jsonb;
begin
  select * into d from public.quiz_duels where id=duel and (creator=p or opponent=p);
  if not found or round_number not between 1 and 3 or round_number is null then raise exception 'duel_unavailable' using errcode='42501'; end if;
  n:=public.quiz_duel_count(d.id,p,round_number);
  for i in 0..n-1 loop
    select * into a from public.quiz_duel_answers where duel_id=d.id and player=p and round_no=round_number and question_no=i;
    q:=d.questions->((round_number-1)*10+i);
    if d.solution_display='round' and n<10 and d.status in ('preparing','active','waiting') then
      q:=jsonb_set(q,'{question}',(q->'question')-'correctId'-'explanation'-'context'-'anchor'-'sources');
      q:=jsonb_set(q,'{question,answers}',(select jsonb_agg(jsonb_build_object('id',v->>'id','text',v->>'text')) from jsonb_array_elements(q->'question'->'answers') v));
      q:=jsonb_set(q,'{question,metadata}',jsonb_build_object('subdomain',coalesce(q->'question'->'metadata'->>'subdomain','')));
    end if;
    items:=items||jsonb_build_array(q||jsonb_build_object('event',jsonb_build_object('answerId',a.answer_id,'dontKnow',a.dont_know,
      'correct',case when d.solution_display='round' and n<10 and d.status in ('preparing','active','waiting') then null else a.correct end,
      'guessed',case when d.solution_display='round' and n<10 and d.status in ('preparing','active','waiting') then false else a.guessed end,
      'at',floor(extract(epoch from a.answered_at)*1000)::bigint,'elapsedMs',a.elapsed_ms)));
  end loop;
  if n<10 and d.turn_owner=p and d.turn_round=round_number and d.status in ('preparing','active') then
    q:=d.questions->((round_number-1)*10+n);
    q:=jsonb_set(q,'{question}',(q->'question')-'correctId'-'explanation'-'context'-'anchor'-'sources');
    q:=jsonb_set(q,'{question,answers}',(select jsonb_agg(jsonb_build_object('id',v->>'id','text',v->>'text')) from jsonb_array_elements(q->'question'->'answers') v));
    q:=jsonb_set(q,'{question,metadata}',jsonb_build_object('subdomain',coalesce(q->'question'->'metadata'->>'subdomain','')));
    select * into a from public.quiz_duel_answers where duel_id=d.id and player=p and round_no=round_number and question_no=n;
    current_item:=q||jsonb_build_object('index',n,'startedAt',case when a.started_at is null then null else floor(extract(epoch from a.started_at)*1000)::bigint end);
  end if;
  return jsonb_build_object('duel',public.quiz_duel_summary(d,p),'number',round_number,'answered',n,'items',items,'current',current_item,'serverNow',floor(extract(epoch from clock_timestamp())*1000)::bigint);
end $$;

create function public.quiz_duel_start(duel uuid,round_number integer,question_number integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare p uuid:=public.quiz_duel_lock(); d public.quiz_duels; a public.quiz_duel_answers;
begin
  select * into d from public.quiz_duels where id=duel and (creator=p or opponent=p);
  if not found or d.turn_owner<>p or d.turn_round is distinct from round_number or d.status not in ('preparing','active') then raise exception 'not_your_turn'; end if;
  if question_number is distinct from public.quiz_duel_count(d.id,p,round_number) or question_number not between 0 and 9 then raise exception 'invalid_question'; end if;
  insert into public.quiz_duel_answers(duel_id,player,round_no,question_no,started_at) values(d.id,p,round_number,question_number,clock_timestamp()) on conflict do nothing;
  select * into a from public.quiz_duel_answers where duel_id=d.id and player=p and round_no=round_number and question_no=question_number;
  return jsonb_build_object('elapsedMs',least(30000,greatest(0,floor(extract(epoch from (clock_timestamp()-a.started_at))*1000)))::integer);
end $$;

create function public.quiz_duel_answer(duel uuid,round_number integer,question_number integer,answer_id text,unknown_answer boolean,was_guessed boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare p uuid:=public.quiz_duel_lock(); d public.quiz_duels; a public.quiz_duel_answers; q jsonb; ms integer; left_hits integer; right_hits integer;
begin
  select * into d from public.quiz_duels where id=duel and (creator=p or opponent=p);
  if not found or round_number not between 1 and 3 or question_number not between 0 and 9 or round_number is null or question_number is null then raise exception 'duel_unavailable'; end if;
  select * into a from public.quiz_duel_answers where duel_id=d.id and player=p and round_no=round_number and question_no=question_number;
  if a.answered_at is not null then return public.quiz_duel_view(d.id,round_number); end if;
  if d.turn_owner<>p or d.turn_round is distinct from round_number or d.status not in ('preparing','active') or a.started_at is null then raise exception 'not_your_turn'; end if;
  if unknown_answer is null or was_guessed is null or (unknown_answer and answer_id is not null) then raise exception 'invalid_answer'; end if;
  q:=d.questions->((round_number-1)*10+question_number)->'question';
  if answer_id is not null and not exists(select 1 from jsonb_array_elements(q->'answers') v where v->>'id'=answer_id) then raise exception 'invalid_answer'; end if;
  ms:=least(2147483647,greatest(0,floor(extract(epoch from (clock_timestamp()-a.started_at))*1000)))::integer;
  if answer_id is null and not unknown_answer and ms<30000 then raise exception 'question_not_expired'; end if;
  update public.quiz_duel_answers set answered_at=clock_timestamp(),answer_id=case when ms<30000 then quiz_duel_answer.answer_id else null end,
    dont_know=unknown_answer and ms<30000,correct=coalesce(quiz_duel_answer.answer_id=q->>'correctId' and ms<30000,false),
    guessed=coalesce(was_guessed and quiz_duel_answer.answer_id=q->>'correctId' and ms<30000,false),elapsed_ms=ms
    where duel_id=d.id and player=p and round_no=round_number and question_no=question_number;
  -- null SQL comparisons must become an explicit false, including Keine Ahnung.
  update public.quiz_duel_answers set correct=coalesce(correct,false),guessed=coalesce(guessed,false) where duel_id=d.id and player=p and round_no=round_number and question_no=question_number;
  if question_number=9 then
    if round_number=1 and p=d.creator then
      update public.quiz_duels set status='waiting',turn_owner=null,due_at=clock_timestamp()+interval '7 days' where id=d.id;
    elsif round_number=1 then
      update public.quiz_duels set turn_round=2 where id=d.id; -- same B block, same deadline
    elsif round_number=2 and p=d.opponent then
      update public.quiz_duels set turn_owner=d.creator,due_at=clock_timestamp()+interval '72 hours' where id=d.id;
    elsif round_number=2 then
      update public.quiz_duels set turn_round=3 where id=d.id; -- same A block, same deadline
    elsif p=d.creator then
      update public.quiz_duels set turn_owner=d.opponent,due_at=clock_timestamp()+interval '72 hours' where id=d.id;
    else
      select count(*) filter(where correct)::integer into left_hits from public.quiz_duel_answers where duel_id=d.id and player=d.creator;
      select count(*) filter(where correct)::integer into right_hits from public.quiz_duel_answers where duel_id=d.id and player=d.opponent;
      update public.quiz_duels set status='completed',turn_owner=null,finished_at=clock_timestamp(),winner=case when left_hits>right_hits then d.creator when right_hits>left_hits then d.opponent else null end where id=d.id;
    end if;
  end if;
  return public.quiz_duel_view(d.id,round_number);
end $$;

create function public.quiz_duel_guess(duel uuid,round_number integer,question_number integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare p uuid:=public.quiz_duel_lock(); d public.quiz_duels;
begin
  select * into d from public.quiz_duels where id=duel and (creator=p or opponent=p);
  if not found or d.solution_display<>'question' or round_number not between 1 and 3 or question_number not between 0 and 9 or public.quiz_duel_count(d.id,p,round_number)<>question_number+1 then raise exception 'guess_unavailable'; end if;
  update public.quiz_duel_answers set guessed=true where duel_id=d.id and player=p and round_no=round_number and question_no=question_number and correct;
  return public.quiz_duel_view(d.id,round_number);
end $$;

create function public.quiz_duel_close(duel uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare p uuid:=public.quiz_duel_lock(); d public.quiz_duels; common boolean;
begin
  select * into d from public.quiz_duels where id=duel and (creator=p or opponent=p);
  if not found then raise exception 'duel_unavailable' using errcode='42501'; end if;
  if d.status not in ('preparing','waiting','active') then return public.quiz_duel_summary(d,p); end if;
  select exists(select 1 from public.quiz_duel_answers where duel_id=d.id and answered_at is not null group by round_no having count(*)=20) into common;
  update public.quiz_duels set status=case when common then 'forfeit' else 'cancelled' end,finished_at=clock_timestamp(),turn_owner=null,
    winner=case when common then case when p=d.creator then d.opponent else d.creator end else null end,
    reason=case when d.opponent is null then 'withdrawn' else 'surrender' end where id=d.id returning * into d;
  return public.quiz_duel_summary(d,p);
end $$;

-- Internal helpers and tables are never callable/readable by clients.
revoke all on function public.quiz_duel_lock(),public.quiz_duel_slots(uuid),public.quiz_duel_count(uuid,uuid,integer),public.quiz_duel_name(uuid),public.quiz_duel_summary(public.quiz_duels,uuid) from public,anon,authenticated;
revoke all on function public.quiz_duel_list(),public.quiz_duel_create(text,boolean,uuid),public.quiz_duel_join(text),public.quiz_duel_view(uuid,integer),public.quiz_duel_start(uuid,integer,integer),public.quiz_duel_answer(uuid,integer,integer,text,boolean,boolean),public.quiz_duel_guess(uuid,integer,integer),public.quiz_duel_close(uuid) from public,anon;
grant execute on function public.quiz_duel_list(),public.quiz_duel_create(text,boolean,uuid),public.quiz_duel_join(text),public.quiz_duel_view(uuid,integer),public.quiz_duel_start(uuid,integer,integer),public.quiz_duel_answer(uuid,integer,integer,text,boolean,boolean),public.quiz_duel_guess(uuid,integer,integer),public.quiz_duel_close(uuid) to authenticated;
