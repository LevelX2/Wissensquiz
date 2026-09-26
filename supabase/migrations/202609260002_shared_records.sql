-- Voluntary training leaderboard. Source snapshots remain private.
begin;
create table public.quiz_sharing (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false
);
create table public.quiz_shared_scores (
  owner_id uuid references auth.users(id) on delete cascade,
  round_id text not null,
  player_name text not null,
  category text not null,
  genres text[] not null,
  difficulties text[] not null,
  topic text not null,
  question_count integer not null,
  rule_version text not null,
  points integer not null,
  correct integer not null,
  elapsed_ms bigint not null,
  finished_at double precision not null,
  primary key(owner_id, round_id)
);
create index quiz_shared_category on public.quiz_shared_scores(category,points desc,finished_at);
alter table public.quiz_sharing enable row level security;
alter table public.quiz_shared_scores enable row level security;
revoke all on public.quiz_sharing, public.quiz_shared_scores from public, anon, authenticated;
grant select on public.quiz_sharing to authenticated;
create policy own_sharing on public.quiz_sharing for select to authenticated
  using (owner_id = (select auth.uid()) and (select public.quiz_verified_user()));

-- Internal projection: never expose private snapshots, email or account IDs.
-- Scores are recomputed from answers/timing, but the snapshots themselves are
-- client-authored. This is a training leaderboard, not a verified competition.
create function public.quiz_project_scores(player uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare snapshot jsonb; r jsonb; q jsonb; e jsonb; gs text[]; ds text[];
  n integer; hits integer; total integer; duration bigint; ms integer;
  valid boolean; display text; finished double precision; cat text;
begin
  delete from public.quiz_shared_scores where owner_id=player;
  if not exists(select 1 from public.quiz_sharing where owner_id=player and enabled) then return; end if;
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

create function public.quiz_scores_after_save() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.quiz_project_scores(new.owner_id);
  return new;
end;
$$;
revoke all on function public.quiz_scores_after_save() from public, anon, authenticated;
create trigger quiz_scores_saved after insert or update of state on public.quiz_saves
  for each row execute function public.quiz_scores_after_save();

create function public.quiz_set_sharing(participate boolean, expected_owner uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare player uuid:=auth.uid();
begin
  if player is null or not public.quiz_verified_user() then raise exception 'verified_account_required' using errcode='42501'; end if;
  if player is distinct from expected_owner then raise exception 'account_changed' using errcode='42501'; end if;
  if participate is null then raise exception 'invalid_preference'; end if;
  -- Serialize against autosave so withdrawal cannot race with publication.
  perform 1 from public.quiz_saves where owner_id=player for update;
  insert into public.quiz_sharing values(player,participate) on conflict(owner_id) do update set enabled=excluded.enabled;
  perform public.quiz_project_scores(player);
  return participate;
end;
$$;
revoke all on function public.quiz_set_sharing(boolean,uuid) from public, anon;
grant execute on function public.quiz_set_sharing(boolean,uuid) to authenticated;

create function public.quiz_score_categories() returns table(category text,genres text[],difficulties text[],topic text,question_count integer,rule_version text)
language sql stable security definer set search_path = '' as $$
  select distinct s.category,s.genres,s.difficulties,s.topic,s.question_count,s.rule_version
  from public.quiz_shared_scores s join auth.users u on u.id=s.owner_id
  where exists(select 1 from public.quiz_sharing p where p.owner_id=s.owner_id and p.enabled) and public.quiz_verified_user() and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
  order by s.category;
$$;
revoke all on function public.quiz_score_categories() from public, anon;
grant execute on function public.quiz_score_categories() to authenticated;

create function public.quiz_rankings(selected_category text, page_offset integer default 0)
returns table(player_name text,points integer,correct integer,elapsed_ms bigint,finished_at double precision,place bigint,is_mine boolean)
language sql stable security definer set search_path = '' as $$
  select s.player_name,s.points,s.correct,s.elapsed_ms,s.finished_at,
    rank() over(order by s.points desc),s.owner_id=auth.uid()
  from public.quiz_shared_scores s join auth.users u on u.id=s.owner_id
  where exists(select 1 from public.quiz_sharing p where p.owner_id=s.owner_id and p.enabled) and public.quiz_verified_user() and s.category=selected_category
    and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
  order by s.points desc,s.finished_at,s.owner_id,s.round_id
  limit 50 offset greatest(coalesce(page_offset,0),0);
$$;
revoke all on function public.quiz_rankings(text,integer) from public, anon;
grant execute on function public.quiz_rankings(text,integer) to authenticated;
notify pgrst, 'reload schema';
commit;
