-- Individual training runs and calendar rankings. No snapshots or account IDs
-- are exposed. Solo scores remain client-authored training comparisons.
begin;
alter table public.quiz_shared_scores add column mode text not null default 'rekord';
create index quiz_shared_mode_category on public.quiz_shared_scores(mode,category);
create index quiz_shared_category_time on public.quiz_shared_scores(category,finished_at);
create index quiz_duel_completed_time on public.quiz_duels(finished_at) where status='completed';
alter function public.quiz_project_scores(uuid) rename to quiz_project_legacy_scores;
revoke all on function public.quiz_project_legacy_scores(uuid) from public,anon,authenticated;
do $$ declare definition text; begin
  select pg_get_functiondef('public.quiz_project_legacy_scores(uuid)'::regprocedure) into definition;
  execute replace(definition,'insert into public.quiz_shared_scores values',
    'insert into public.quiz_shared_scores(owner_id,round_id,player_name,category,genres,difficulties,topic,question_count,rule_version,points,correct,elapsed_ms,finished_at) values');
end $$;

create function public.quiz_period_start(selected_period text) returns timestamptz
language plpgsql stable set search_path='' as $$
begin
  if selected_period='all' then return '-infinity'::timestamptz; end if;
  if selected_period is null or selected_period not in ('week','month','year') then raise exception 'invalid_period'; end if;
  return date_trunc(selected_period,now() at time zone 'Europe/Berlin') at time zone 'Europe/Berlin';
end $$;
revoke all on function public.quiz_period_start(text) from public,anon,authenticated;

create function public.quiz_project_scores(player uuid) returns void
language plpgsql security definer set search_path='' as $$
declare snapshot jsonb; r jsonb; q jsonb; e jsonb; events jsonb;
  gs text[]; ds text[]; n integer; i integer; total integer; hits integer;
  duration numeric; ms numeric; bank numeric; lim numeric; hit boolean; ended boolean;
  valid boolean; display text; finished double precision; cat text; rule text;
begin
  perform public.quiz_project_legacy_scores(player);
  delete from public.quiz_shared_scores where owner_id=player and rule_version like 'solo-v1.%';
  select left(coalesce(nullif(btrim(raw_user_meta_data->>'display_name'),''),'Spieler'),40) into display
    from auth.users where id=player and email_confirmed_at is not null and not coalesce(is_anonymous,false);
  if display is null then return; end if;
  select state into snapshot from public.quiz_saves where owner_id=player;
  if jsonb_typeof(snapshot->'rounds') is distinct from 'array' or jsonb_typeof(snapshot->'events') is distinct from 'array' then return; end if;
  select jsonb_object_agg(value->>'id',value) into events from jsonb_array_elements(snapshot->'events') where value->>'id' is not null;
  for r in select value from jsonb_array_elements(snapshot->'rounds') loop
    begin
      if r->>'mode' not in ('rekord','fehlerfrei','zeitkonto') or r->>'status'<>'completed' or
        coalesce(r->>'recordPreset','') not in ('standard','custom') or jsonb_typeof(r->'questions') is distinct from 'array' or
        jsonb_typeof(r->'events') is distinct from 'array' or coalesce(length(r->>'id'),0) not between 1 and 200 then continue; end if;
      rule:=r->>'ruleVersion';
      if rule is null or (rule<>'solo-v1.'||(r->>'mode')||'.'||(r->>'recordPreset') and
        (r->>'mode'<>'rekord' or rule<>'solo-v1.rekord.'||(r->>'recordPreset')||'.L')) then continue; end if;
      n:=jsonb_array_length(r->'questions');
      if n not between 1 and 100000 or n<>jsonb_array_length(r->'events') or
        (r->>'mode'='rekord' and n>10) then continue; end if;
      if (select count(distinct value) from jsonb_array_elements_text(r->'events'))<>n then continue; end if;
      finished:=(r->>'finishedAt')::double precision;
      if finished is null or finished<0 or finished>extract(epoch from now())*1000+300000 then continue; end if;
      total:=0; hits:=0; duration:=0; bank:=120000; ended:=false; valid:=true;
      for i in 0..n-1 loop
        q:=r->'questions'->i; e:=events->(r->'events'->>i);
        if ended or e is null or e->>'roundId' is distinct from r->>'id' or
          e->>'questionId' is distinct from q->>'id' then valid:=false; exit; end if;
        ms:=(e->>'elapsedMs')::numeric;
        lim:=case when r->>'mode'='zeitkonto' then least(bank,30000) else 30000 end;
        if ms is null or ms<0 or ms>lim then valid:=false; exit; end if;
        hit:=coalesce(e->>'answerId'=q->>'correctId' and ms<lim,false);
        duration:=duration+ms;
        if hit then hits:=hits+1; total:=total+100+2*floor((30000-ms)/1000)::integer; end if;
        if r->>'mode'='fehlerfrei' then ended:=not hit; end if;
        if r->>'mode'='zeitkonto' then
          bank:=greatest(0,bank-ms);
          if bank>0 then bank:=greatest(0,least(120000,bank+case when hit then 15000 else -45000 end)); end if;
          ended:=bank=0;
        end if;
      end loop;
      if not valid or (r->>'mode'<>'rekord' and (not ended or r->'run'->'ended' is distinct from 'true'::jsonb)) or
        (r->>'mode'='zeitkonto' and (r->'run'->>'bankMs' is null or abs(bank-(r->'run'->>'bankMs')::numeric)>0.001)) then continue; end if;
      select array_agg(distinct value order by value) into gs from jsonb_array_elements_text(r->'filters'->'genres');
      select array_agg(distinct value order by value) into ds from jsonb_array_elements_text(r->'filters'->'difficulties');
      gs:=coalesce(gs,'{}'::text[]);
      if ds is null or cardinality(gs)>30 or cardinality(ds)>4 or
        exists(select 1 from unnest(gs||ds) x where length(x)>100) or length(coalesce(r->>'topic',''))>200 then continue; end if;
      cat:=jsonb_build_array('records-v3',r->>'mode',r->'filters',coalesce(r->>'topic','Alle Themen'),
        case when r->>'mode'='rekord' then n::text else 'endless' end,rule)::text;
      insert into public.quiz_shared_scores(owner_id,round_id,player_name,category,genres,difficulties,topic,question_count,rule_version,points,correct,elapsed_ms,finished_at,mode)
        values(player,r->>'id',display,cat,gs,ds,coalesce(r->>'topic','Alle Themen'),n,rule,total,hits,round(duration)::bigint,finished,r->>'mode')
        on conflict(owner_id,round_id) do nothing;
    exception when invalid_text_representation or numeric_value_out_of_range then continue;
    end;
  end loop;
end $$;
revoke all on function public.quiz_project_scores(uuid) from public,anon,authenticated;

create function public.quiz_record_categories(selected_mode text)
returns table(category text,genres text[],difficulties text[],topic text,question_count integer,rule_version text,selection jsonb)
language plpgsql stable security definer set search_path='' as $$
begin
  if selected_mode is null or selected_mode not in ('rekord','fehlerfrei','zeitkonto') then raise exception 'invalid_mode'; end if;
  return query select distinct s.category,s.genres,s.difficulties,s.topic,
    case when s.mode='rekord' then s.question_count else 0 end,s.rule_version,
    case when (s.category::jsonb)->>0='records-v3' then (s.category::jsonb)->2 else null end
    from public.quiz_shared_scores s join auth.users u on u.id=s.owner_id
    where s.mode=selected_mode and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
    order by s.category;
end $$;
create function public.quiz_record_runs(selected_category text,selected_period text default 'all',page_offset integer default 0)
returns table(player_name text,points integer,correct integer,answers integer,elapsed_ms bigint,finished_at double precision,place bigint,is_mine boolean,experience bigint)
language plpgsql stable security definer set search_path='' as $$
declare from_at timestamptz:=public.quiz_period_start(selected_period);
begin
  return query with ranked as (
    select s.*,rank() over(order by s.points desc) as position
    from public.quiz_shared_scores s join auth.users u on u.id=s.owner_id
    where s.category=selected_category and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
      and s.finished_at>=extract(epoch from from_at)*1000
      and s.finished_at<extract(epoch from now()+interval '5 minutes')*1000
      and (selected_period='all' or s.finished_at<extract(epoch from
        (date_trunc(selected_period,now() at time zone 'Europe/Berlin') +
          case selected_period when 'week' then interval '1 week' when 'month' then interval '1 month' else interval '1 year' end) at time zone 'Europe/Berlin')*1000)
  )
  select s.player_name,s.points,s.correct,s.question_count,s.elapsed_ms,s.finished_at,s.position,
    coalesce(s.owner_id=auth.uid() and public.quiz_verified_user(),false),public.quiz_career_experience(saved.state)
    from ranked s left join public.quiz_saves saved on saved.owner_id=s.owner_id
    order by s.position,s.finished_at,s.owner_id,s.round_id limit 50 offset greatest(0,coalesce(page_offset,0));
end $$;
revoke all on function public.quiz_record_categories(text),public.quiz_record_runs(text,text,integer) from public;
grant execute on function public.quiz_record_categories(text),public.quiz_record_runs(text,text,integer) to anon,authenticated;

-- Match history is private. Public duel standings use only full server-scored
-- 3x10 matches, preventing points from mutual early forfeits.
create function public.quiz_duel_results(selected_period text default 'all',page_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare p uuid:=auth.uid(); from_at timestamptz:=public.quiz_period_start(selected_period); result jsonb;
begin
  if p is null or not public.quiz_verified_user() then raise exception 'authentication_required'; end if;
  select coalesce(jsonb_agg(public.quiz_duel_summary(d,p)||jsonb_build_object('finishedAt',floor(extract(epoch from d.finished_at)*1000)::bigint)
    order by d.finished_at desc,d.id),'[]'::jsonb) into result from (
    select * from public.quiz_duels d where (d.creator=p or d.opponent=p) and d.status in ('completed','forfeit','cancelled')
      and d.finished_at>=from_at and d.finished_at<=now()
    order by d.finished_at desc,d.id limit 50 offset greatest(0,coalesce(page_offset,0))) d;
  return result;
end $$;
create function public.quiz_duel_rankings(selected_period text default 'all',page_offset integer default 0)
returns table(player_name text,points bigint,wins bigint,draws bigint,losses bigint,completed bigint,place bigint,is_mine boolean)
language plpgsql stable security definer set search_path='' as $$
declare from_at timestamptz:=public.quiz_period_start(selected_period);
begin
  return query with matches as (
    select d.* from public.quiz_duels d
      join auth.users u on u.id=d.creator join auth.users v on v.id=d.opponent
    where d.status='completed' and d.finished_at>=from_at and d.finished_at<=now()
      and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
      and v.email_confirmed_at is not null and not coalesce(v.is_anonymous,false)
      and (select count(*) from public.quiz_duel_answers a where a.duel_id=d.id and a.answered_at is not null and (a.player=d.creator or a.player=d.opponent))=60
  ), results as (
    select d.winner,p.player from matches d cross join lateral (values(d.creator),(d.opponent)) p(player)
  ), totals as (
    select player,sum(case when winner=player then 3 when winner is null then 1 else 0 end)::bigint as pts,
      count(*) filter(where winner=player) as win,count(*) filter(where winner is null) as draw,
      count(*) filter(where winner is not null and winner<>player) as loss,count(*) as n from results group by player
  ), ranked as (select t.*,rank() over(order by pts desc) as position from totals t)
  select public.quiz_duel_name(player),pts,win,draw,loss,n,position,
    coalesce(player=auth.uid() and public.quiz_verified_user(),false)
    from ranked order by position,public.quiz_duel_name(player),player limit 50 offset greatest(0,coalesce(page_offset,0));
end $$;
revoke all on function public.quiz_duel_results(text,integer) from public,anon;
grant execute on function public.quiz_duel_results(text,integer) to authenticated;
revoke all on function public.quiz_duel_rankings(text,integer) from public;
grant execute on function public.quiz_duel_rankings(text,integer) to anon,authenticated;

alter table public.quiz_guest_activity_events drop constraint quiz_guest_activity_events_answers_check;
alter table public.quiz_guest_activity_events add constraint quiz_guest_activity_events_answers_check check(answers between 0 and 100000);
-- Preserve the original guest delivery checks with the expanded run limit.
do $$ declare definition text; begin
  select pg_get_functiondef('public.quiz_report_guest_activity(uuid,text,timestamptz,integer,integer)'::regprocedure) into definition;
  execute replace(definition,'answers not between 0 and 100','answers not between 0 and 100000');
end $$;

-- Match each question occurrence with its answer occurrence. Repeated goals in
-- endless cycles must count as separate answers, without multiplying joins.
create function public.quiz_training_totals(selected_genre text,selected_difficulty text)
returns table(owner_id uuid,name text,career_xp bigint,rounds bigint,answers bigint,hits bigint)
language sql stable security definer set search_path='' set jit=off as $$
  with participants as materialized (
    select u.id as owner_id,s.state->'rounds' as saved_rounds,s.state->'events' as saved_events,public.quiz_career_experience(s.state) as career_xp,
      coalesce(nullif(left(btrim(u.raw_user_meta_data->>'display_name'),40),''),'Spieler') as name
    from auth.users u left join public.quiz_saves s on s.owner_id=u.id
    where u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
  ), events as materialized (
    select p.owner_id,e.value->>'roundId' as round_id,e.value->>'questionId' as question_id,e.value as event,
      row_number() over(partition by p.owner_id,e.value->>'roundId',e.value->>'questionId' order by e.ordinal) as occurrence
    from participants p cross join lateral jsonb_array_elements(case when jsonb_typeof(p.saved_events)='array' then p.saved_events else '[]'::jsonb end) with ordinality e(value,ordinal)
  ), questions as materialized (
    select p.owner_id,r->>'id' as round_id,r->>'mode' as mode,q.value as q,
      row_number() over(partition by p.owner_id,r->>'id',q.value->>'id' order by q.ordinal) as occurrence
    from participants p cross join lateral jsonb_array_elements(case when jsonb_typeof(p.saved_rounds)='array' then p.saved_rounds else '[]'::jsonb end) r
    cross join lateral jsonb_array_elements(case when jsonb_typeof(r->'questions')='array' then r->'questions' else '[]'::jsonb end) with ordinality q(value,ordinal)
    where r->>'status'='completed' and r->>'mode' in ('rekord','fehlerfrei','zeitkonto','entdecken','ueben','fehler')
      and (selected_genre='' or coalesce(nullif(q.value->'metadata'->>'subdomain',''),q.value->>'domain')=selected_genre)
      and (selected_difficulty='' or q.value->>'difficulty'=selected_difficulty)
  ), totals as (
    select q.owner_id,count(distinct q.round_id) as rounds,
      count(*) filter(where e.event->>'answerId' is not null or (e.event->'dontKnow'='true'::jsonb and
        (q.mode not in ('rekord','fehlerfrei','zeitkonto') or case when e.event->>'elapsedMs' ~ '^[0-9]+([.][0-9]+)?$' then (e.event->>'elapsedMs')::numeric<30000 else false end))) as answers,
      count(*) filter(where e.event->>'answerId'=q.q->>'correctId' and
        (q.mode not in ('rekord','fehlerfrei','zeitkonto') or case when e.event->>'elapsedMs' ~ '^[0-9]+([.][0-9]+)?$' then (e.event->>'elapsedMs')::numeric<30000 else false end)) as hits
    from questions q left join events e on e.owner_id=q.owner_id and e.round_id=q.round_id and e.question_id=q.q->>'id' and e.occurrence=q.occurrence
    group by q.owner_id
  )
  select p.owner_id,p.name,p.career_xp,coalesce(t.rounds,0),coalesce(t.answers,0),coalesce(t.hits,0)
    from participants p left join totals t on t.owner_id=p.owner_id
    where t.owner_id is not null or (selected_genre='' and selected_difficulty='');
$$;
revoke all on function public.quiz_training_totals(text,text) from public,anon,authenticated;
create or replace function public.quiz_public_players(sort_by text default 'experience',page_offset integer default 0)
returns table(player_name text,completed bigint,answered bigint,correct bigint,accuracy numeric,place bigint,is_mine boolean,experience bigint)
language plpgsql stable security definer set search_path='' set jit=off as $$
begin
  if sort_by is null or sort_by not in ('rounds','correct','accuracy','experience') then raise exception 'invalid_sort'; end if;
  return query with measured as (
    select t.*,case when answers>0 then 100.0*hits/answers else null end as ratio from public.quiz_training_totals('','') t
    where sort_by<>'accuracy' or answers>=50
  ), ranked as (
    select m.*,rank() over(order by case sort_by when 'rounds' then rounds when 'correct' then hits when 'experience' then career_xp else ratio end desc nulls last) as position from measured m
  )
  select name,rounds,answers,hits,round(ratio,1),position,coalesce(owner_id=auth.uid() and public.quiz_verified_user(),false),career_xp
    from ranked order by position,name,owner_id limit 50 offset greatest(0,coalesce(page_offset,0));
end $$;
create or replace function public.quiz_players(sort_by text default 'rounds',selected_genre text default '',selected_difficulty text default '',page_offset integer default 0)
returns table(player_name text,completed bigint,answered bigint,correct bigint,accuracy numeric,place bigint,is_mine boolean,experience bigint)
language plpgsql stable security definer set search_path='' set jit=off as $$
begin
  if auth.uid() is null or not public.quiz_verified_user() then raise exception 'authentication_required'; end if;
  if sort_by is null or sort_by not in ('rounds','correct','accuracy','experience') then raise exception 'invalid_sort'; end if;
  if sort_by='experience' then selected_genre:=''; selected_difficulty:=''; end if;
  return query with measured as (
    select t.*,case when answers>0 then 100.0*hits/answers else null end as ratio from public.quiz_training_totals(selected_genre,selected_difficulty) t
    where sort_by<>'accuracy' or answers>=50
  ), ranked as (
    select m.*,rank() over(order by case sort_by when 'rounds' then rounds when 'correct' then hits when 'experience' then career_xp else ratio end desc nulls last) as position from measured m
  )
  select name,rounds,answers,hits,round(ratio,1),position,owner_id=auth.uid(),career_xp
    from ranked order by position,name,owner_id limit 50 offset greatest(0,coalesce(page_offset,0));
end $$;
-- Preserve legacy XP reconstruction while including new completed modes.
do $$ declare definition text; begin
  select pg_get_functiondef('public.quiz_career_experience(jsonb)'::regprocedure) into definition;
  execute replace(definition,'''rekord'',''entdecken'',''ueben'',''fehler''','''rekord'',''entdecken'',''ueben'',''fehler'',''fehlerfrei'',''zeitkonto''');
end $$;
do $$ declare player uuid; begin
  for player in select owner_id from public.quiz_saves loop perform public.quiz_project_scores(player); end loop;
end $$;
notify pgrst, 'reload schema';
commit;
