-- Automatic rankings for confirmed accounts; no email or full save exposure.
begin;
create or replace function public.quiz_project_scores(player uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare snapshot jsonb; r jsonb; q jsonb; e jsonb; gs text[]; ds text[];
  n integer; hits integer; total integer; duration bigint; ms integer;
  valid boolean; display text; finished double precision; cat text;
begin
  delete from public.quiz_shared_scores where owner_id=player;
  select left(coalesce(nullif(btrim(raw_user_meta_data->>'display_name'),''),'Spieler'),40)
    into display from auth.users where id=player and email_confirmed_at is not null and not coalesce(is_anonymous,false);
  if display is null then return; end if;
  select state into snapshot from public.quiz_saves where owner_id=player;
  if jsonb_typeof(snapshot->'rounds') is distinct from 'array' or jsonb_typeof(snapshot->'events') is distinct from 'array' then return; end if;
  for r in select value from jsonb_array_elements(snapshot->'rounds') loop
    begin
      if r->>'mode' <> 'rekord' or r->>'status' <> 'completed' or
        jsonb_typeof(r->'questions') is distinct from 'array' or coalesce(length(r->>'id'),0) not between 1 and 200 then continue; end if;
      n:=jsonb_array_length(r->'questions');
      if n not between 1 and 100 or coalesce(length(r->>'ruleVersion'),0) not between 1 and 100 then continue; end if;
      finished:=(r->>'finishedAt')::double precision;
      if finished is null or finished < 0 or finished > extract(epoch from now())*1000+300000 then continue; end if;
      if (select count(distinct value->>'id') from jsonb_array_elements(r->'questions')) <> n then continue; end if;
      total:=0; hits:=0; duration:=0; valid:=true;
      for q in select value from jsonb_array_elements(r->'questions') loop
        if (select count(*) from jsonb_array_elements(snapshot->'events') where value->>'roundId'=r->>'id' and value->>'questionId'=q->>'id') <> 1 then valid:=false; exit; end if;
        select value into e from jsonb_array_elements(snapshot->'events') where value->>'roundId'=r->>'id' and value->>'questionId'=q->>'id';
        ms:=(e->>'elapsedMs')::integer;
        if ms is null or ms not between 0 and 30000 then valid:=false; exit; end if;
        duration:=duration+ms;
        if e->>'answerId'=q->>'correctId' and ms < 30000 then
          hits:=hits+1; total:=total+100+2*((30000-ms)/1000);
        end if;
      end loop;
      if not valid then continue; end if;
      if jsonb_typeof(r->'filters'->'genres')='array' and jsonb_typeof(r->'filters'->'difficulties')='array' then
        select array_agg(distinct value order by value) into gs from jsonb_array_elements_text(r->'filters'->'genres');
        select array_agg(distinct value order by value) into ds from jsonb_array_elements_text(r->'filters'->'difficulties');
      else
        select array_agg(distinct coalesce(value->'metadata'->>'subdomain',value->>'domain') order by coalesce(value->'metadata'->>'subdomain',value->>'domain')) into gs from jsonb_array_elements(r->'questions');
        ds:=array['historisch:'||coalesce(r->>'difficulty','Alle Stufen')];
      end if;
      if gs is null or ds is null or array_length(gs,1)>30 or array_length(ds,1)>4 or
        exists(select 1 from unnest(gs||ds) x where length(x)>100) or length(coalesce(r->>'topic',''))>200 then continue; end if;
      cat:=jsonb_build_array(gs,ds,coalesce(r->>'topic','Alle Themen'),n,r->>'ruleVersion')::text;
      insert into public.quiz_shared_scores values(player,r->>'id',display,cat,gs,ds,coalesce(r->>'topic','Alle Themen'),n,r->>'ruleVersion',total,hits,duration,finished)
        on conflict(owner_id,round_id) do nothing;
    exception when invalid_text_representation or numeric_value_out_of_range then
      continue;
    end;
  end loop;
end;
$$;
revoke all on function public.quiz_project_scores(uuid) from public, anon, authenticated;

create or replace function public.quiz_score_categories() returns table(category text,genres text[],difficulties text[],topic text,question_count integer,rule_version text)
language sql stable security definer set search_path = '' as $$
  select distinct s.category,s.genres,s.difficulties,s.topic,s.question_count,s.rule_version
  from public.quiz_shared_scores s join auth.users u on u.id=s.owner_id
  where public.quiz_verified_user() and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
  order by s.category;
$$;
revoke all on function public.quiz_score_categories() from public, anon;
grant execute on function public.quiz_score_categories() to authenticated;

create or replace function public.quiz_rankings(selected_category text, page_offset integer default 0)
returns table(player_name text,points integer,correct integer,elapsed_ms bigint,finished_at double precision,place bigint,is_mine boolean)
language sql stable security definer set search_path = '' as $$
  select s.player_name,s.points,s.correct,s.elapsed_ms,s.finished_at,
    rank() over(order by s.points desc),s.owner_id=auth.uid()
  from public.quiz_shared_scores s join auth.users u on u.id=s.owner_id
  where public.quiz_verified_user() and s.category=selected_category
    and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
  order by s.points desc,s.finished_at,s.owner_id,s.round_id
  limit 50 offset greatest(coalesce(page_offset,0),0);
$$;
revoke all on function public.quiz_rankings(text,integer) from public, anon;
grant execute on function public.quiz_rankings(text,integer) to authenticated;
create or replace function public.quiz_players(sort_by text default 'rounds', selected_genre text default '', selected_difficulty text default '', page_offset integer default 0)
returns table(player_name text, completed bigint, answered bigint, correct bigint, accuracy numeric, place bigint, is_mine boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.quiz_verified_user() then raise exception 'authentication_required'; end if;
  if sort_by not in ('rounds','correct','accuracy') then raise exception 'invalid_sort'; end if;
  return query
  with participants as (
    select u.id as owner_id, s.state, coalesce(nullif(left(btrim(u.raw_user_meta_data->>'display_name'),40),''),'Spieler') as name
    from auth.users u left join public.quiz_saves s on s.owner_id=u.id
    where u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
  ), questions as (
    select p.owner_id,p.name,r->>'id' as round_id,r->>'mode' as mode,q,
      p.state->'events' as events
    from participants p
    cross join lateral jsonb_array_elements(case when jsonb_typeof(p.state->'rounds')='array' then p.state->'rounds' else '[]'::jsonb end) r
    cross join lateral jsonb_array_elements(case when jsonb_typeof(r->'questions')='array' then r->'questions' else '[]'::jsonb end) q
    where r->>'status'='completed' and r->>'mode' in ('rekord','entdecken','ueben')
      and (selected_genre='' or coalesce(nullif(q->'metadata'->>'subdomain',''),q->>'domain')=selected_genre)
      and (selected_difficulty='' or q->>'difficulty'=selected_difficulty)
  ), totals as (
    select q.owner_id,q.name,count(distinct q.round_id) as rounds,
      count(*) filter(where e->>'answerId' is not null) as answers,
      count(*) filter(where e->>'answerId'=q.q->>'correctId' and
        (q.mode<>'rekord' or case when e->>'elapsedMs' ~ '^[0-9]+([.][0-9]+)?$' then (e->>'elapsedMs')::numeric<30000 else false end)) as hits
    from questions q
    left join lateral (
      select value as e from jsonb_array_elements(case when jsonb_typeof(q.events)='array' then q.events else '[]'::jsonb end)
      where value->>'roundId'=q.round_id and value->>'questionId'=q.q->>'id' limit 1
    ) chosen on true
    group by q.owner_id,q.name
  ), all_totals as (
    select p.owner_id,p.name,coalesce(t.rounds,0) as rounds,coalesce(t.answers,0) as answers,coalesce(t.hits,0) as hits
    from participants p left join totals t on t.owner_id=p.owner_id
    where t.owner_id is not null or (selected_genre='' and selected_difficulty='')
  ), measured as (
    select t.*,case when answers>0 then 100.0*hits/answers else null end as ratio
    from all_totals t where sort_by<>'accuracy' or answers>=50
  ), ranked as (
    select m.*,rank() over(order by case sort_by when 'rounds' then rounds when 'correct' then hits else ratio end desc nulls last) as position
    from measured m
  )
  select name,rounds,answers,hits,round(ratio,1),position,owner_id=auth.uid()
  from ranked order by position,name,owner_id limit 50 offset greatest(0,coalesce(page_offset,0));
end;
$$;
revoke all on function public.quiz_players(text,text,text,integer) from public,anon;
grant execute on function public.quiz_players(text,text,text,integer) to authenticated;

-- Old clients cannot withdraw automatic participation. Private saves remain unchanged.
revoke all on function public.quiz_set_sharing(boolean,uuid) from public,anon,authenticated;
revoke all on public.quiz_sharing from public,anon,authenticated;
-- Rebuild summaries for existing accounts, including previously disabled preferences.
do $$ declare player uuid; begin
  for player in select owner_id from public.quiz_saves loop
    perform public.quiz_project_scores(player);
  end loop;
end $$;
-- Confirmation and display-name changes also refresh existing record summaries.
create function public.quiz_scores_after_identity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.quiz_project_scores(new.id);
  return new;
end;
$$;
revoke all on function public.quiz_scores_after_identity() from public,anon,authenticated;
create trigger quiz_scores_identity after update of email_confirmed_at,raw_user_meta_data,is_anonymous on auth.users
for each row execute function public.quiz_scores_after_identity();
notify pgrst, 'reload schema';
commit;
