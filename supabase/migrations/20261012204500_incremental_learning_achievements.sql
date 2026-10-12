begin;
-- Content definitions are shared, prepared once by the operator's existing
-- refresh_groups path. Account reads never join the question catalogue.
create table quiz_game_internal.achievement_catalog(
 id boolean primary key check(id),signature text not null,available jsonb not null,sci_fi integer not null);
create table quiz_game_internal.achievement_goals(goal text primary key,sci_fi boolean not null);
create table quiz_game_internal.achievement_topics(
 source text not null,topic text not null,genres text[] not null,primary key(source,topic));
create table quiz_game_internal.achievement_requirements(
 source text not null,topic text not null,goal text not null,area text not null,
 primary key(source,topic,goal,area));
create index achievement_requirement_goal on quiz_game_internal.achievement_requirements(goal,source,topic);

-- Current contributions are separate from permanent achievement maxima. A
-- removed answer may lower a contribution, never an already reached badge.
create table quiz_game_internal.achievement_goal_progress(
 owner_id uuid not null,generation uuid not null,goal text not null,
 secure boolean not null,seen boolean not null,mastered boolean not null,sci_fi boolean not null,
 primary key(owner_id,generation,goal),
 foreign key(owner_id,generation) references public.quiz_sync_generations(owner_id,id) on delete cascade);
create table quiz_game_internal.achievement_topic_progress(
 owner_id uuid not null,generation uuid not null,source text not null,topic text not null,
 primary key(owner_id,generation,source,topic),
 foreign key(owner_id,generation) references public.quiz_sync_generations(owner_id,id) on delete cascade);
create table quiz_game_internal.achievement_current(
 owner_id uuid not null,generation uuid not null,signature text not null,counts jsonb not null,
 primary key(owner_id,generation),
 foreign key(owner_id,generation) references public.quiz_sync_generations(owner_id,id) on delete cascade);
create table quiz_game_internal.achievement_dirty_goals(
 owner_id uuid not null,generation uuid not null,goal text not null,
 primary key(owner_id,generation,goal),
 foreign key(owner_id,generation) references public.quiz_sync_generations(owner_id,id) on delete cascade);
create table quiz_game_internal.goal_reward_totals(
 owner_id uuid not null,generation uuid not null,xp integer not null,
 primary key(owner_id,generation),
 foreign key(owner_id,generation) references public.quiz_sync_generations(owner_id,id) on delete cascade);
do $security$declare t text;begin
 foreach t in array array['achievement_catalog','achievement_goals','achievement_topics','achievement_requirements',
 'achievement_goal_progress','achievement_topic_progress','achievement_current','achievement_dirty_goals','goal_reward_totals'] loop
  execute format('alter table quiz_game_internal.%I enable row level security',t);
  execute format('revoke all on quiz_game_internal.%I from public,anon,authenticated',t);
 end loop;
end$security$;

create function quiz_game_internal.prepare_achievement_catalog() returns void
language plpgsql set search_path='' as $$
declare fingerprint text; available jsonb;
begin
 select md5(coalesce(string_agg(row(knowledge_id,source,topic,genre,difficulty)::text,E'\n'
  order by knowledge_id,source,topic,genre,difficulty),'')) into fingerprint
 from (select distinct knowledge_id,source,topic,genre,difficulty from quiz_game_internal.catalog_meta) f;
 if exists(select 1 from quiz_game_internal.achievement_catalog where id and signature=fingerprint) then return;end if;
 delete from quiz_game_internal.achievement_goals;
 delete from quiz_game_internal.achievement_topics;
 delete from quiz_game_internal.achievement_requirements;
 insert into quiz_game_internal.achievement_goals
 select knowledge_id,bool_or(source='film' and genre='Science-Fiction' and difficulty='leicht')
 from quiz_game_internal.catalog_meta group by knowledge_id;
 insert into quiz_game_internal.achievement_topics
 select source,topic,array_agg(distinct genre order by genre) from quiz_game_internal.catalog_meta
 group by source,topic having bool_or(difficulty='leicht');
 insert into quiz_game_internal.achievement_requirements
 select distinct source,topic,knowledge_id,case source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else genre end
 from quiz_game_internal.catalog_meta where difficulty='leicht';
 with sizes as (
  select case s when 'film' then 'films' else s end id,count(t.topic)::integer n
  from unnest(array['film','actors','awards']) s left join quiz_game_internal.achievement_topics t on t.source=s group by s
  union all select 'films:'||g,count(*)::integer from quiz_game_internal.achievement_topics cross join lateral unnest(genres) g where source='film' group by g
  union all select 'genreBreadth',count(distinct g)::integer from quiz_game_internal.achievement_topics cross join lateral unnest(genres) g where source='film'
  union all select k,(select count(*)::integer from quiz_game_internal.achievement_goals) from unnest(array['secureFacts','discoveredFacts','masteredFacts']) k
  union all select 'experience',10000
  union all select 'sciFiMastery',case when count(*)>=10 then 10 else 0 end from quiz_game_internal.achievement_goals where sci_fi
 ) select jsonb_object_agg(id,n) into available from sizes;
 insert into quiz_game_internal.achievement_catalog select true,fingerprint,available,count(*)::integer from quiz_game_internal.achievement_goals where sci_fi
 on conflict(id) do update set signature=excluded.signature,available=excluded.available,sci_fi=excluded.sci_fi;
 analyze quiz_game_internal.achievement_goals;
 analyze quiz_game_internal.achievement_topics;
 analyze quiz_game_internal.achievement_requirements;
end$$;

-- One batched, indexed evaluation for the changed goals, also used for the
-- initial/current-content projection. Variants contribute only once per goal.
create function quiz_game_internal.achievement_goal_values(player uuid,target uuid,goals text[])
returns table(goal text,secure boolean,seen boolean,mastered boolean,sci_fi boolean)
language sql stable set search_path='' as $$
 select g.goal,exists(
  select 1 from quiz_game_internal.secure_goals s join quiz_game_internal.catalog_meta m on m.knowledge_id=s.goal
  and m.difficulty=s.difficulty and s.area=case m.source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else m.genre end
  where s.owner_id=player and s.generation=target and s.goal=g.goal),
  l.id is not null,coalesce(l.value->>'status'='gefestigt',false),g.sci_fi and coalesce(l.value->>'status'='gefestigt',false)
 from unnest(goals) selected(goal) join quiz_game_internal.achievement_goals g on g.goal=selected.goal
 left join public.quiz_sync_entries l on l.owner_id=player and l.generation=target and l.kind='learning' and l.id=g.goal and not l.deleted
$$;

create function quiz_game_internal.rebuild_achievement_current(player uuid,target uuid) returns void
language plpgsql set search_path='' as $$
declare goals text[]; counts jsonb;
begin
 select coalesce(array_agg(goal),array[]::text[]) into goals from (
  select goal from quiz_game_internal.secure_goals where owner_id=player and generation=target
  union select id from public.quiz_sync_entries where owner_id=player and generation=target and kind='learning' and not deleted
 ) touched;
 delete from quiz_game_internal.achievement_goal_progress where owner_id=player and generation=target;
 insert into quiz_game_internal.achievement_goal_progress select player,target,v.* from quiz_game_internal.achievement_goal_values(player,target,goals) v;
 delete from quiz_game_internal.achievement_topic_progress where owner_id=player and generation=target;
 insert into quiz_game_internal.achievement_topic_progress
 select player,target,t.source,t.topic from (
  select distinct t.source,t.topic from quiz_game_internal.achievement_requirements r
  join quiz_game_internal.achievement_topics t using(source,topic) where r.goal=any(goals)
 ) t
 where not exists(select 1 from quiz_game_internal.achievement_requirements r where r.source=t.source and r.topic=t.topic
  and not exists(select 1 from quiz_game_internal.secure_goals s where s.owner_id=player and s.generation=target and s.goal=r.goal and s.area=r.area and s.difficulty='leicht'));
 with entries as (
  select 'secureFacts' id,count(*) filter(where secure)::integer n from quiz_game_internal.achievement_goal_progress where owner_id=player and generation=target
  union all select 'discoveredFacts',count(*) filter(where seen)::integer from quiz_game_internal.achievement_goal_progress where owner_id=player and generation=target
  union all select 'masteredFacts',count(*) filter(where mastered)::integer from quiz_game_internal.achievement_goal_progress where owner_id=player and generation=target
  union all select '_sciFiMastered',count(*) filter(where sci_fi)::integer from quiz_game_internal.achievement_goal_progress where owner_id=player and generation=target
  union all select case source when 'film' then 'films' else source end,count(*)::integer from quiz_game_internal.achievement_topic_progress where owner_id=player and generation=target group by source
  union all select 'films:'||g,count(*)::integer from quiz_game_internal.achievement_topic_progress p
   join quiz_game_internal.achievement_topics t using(source,topic) cross join lateral unnest(t.genres) g where p.owner_id=player and p.generation=target and p.source='film' group by g
 ) select jsonb_object_agg(id,n) into counts from entries;
 insert into quiz_game_internal.achievement_current
 select player,target,signature,counts from quiz_game_internal.achievement_catalog where id
 on conflict(owner_id,generation) do update set signature=excluded.signature,counts=excluded.counts;
 delete from quiz_game_internal.achievement_dirty_goals where owner_id=player and generation=target;
end$$;

-- The canonical goal projector always writes goal_rewards after learning and
-- secure evidence. Queue each changed goal once; keep XP by delta as well.
insert into quiz_game_internal.goal_reward_totals
select g.owner_id,g.generation,sum(g.xp)::integer from quiz_game_internal.goal_rewards g
join public.quiz_sync_generations s on s.owner_id=g.owner_id and s.id=g.generation group by g.owner_id,g.generation;
create function quiz_game_internal.goal_reward_delta() returns trigger
language plpgsql set search_path='' as $$
declare player uuid; target uuid; goal_id text; difference integer;
begin
 if tg_op='DELETE' then player:=old.owner_id;target:=old.generation;goal_id:=old.goal;difference:=-old.xp;
 else player:=new.owner_id;target:=new.generation;goal_id:=new.goal;difference:=new.xp-case when tg_op='INSERT' then 0 else old.xp end;end if;
 if not exists(select 1 from public.quiz_sync_generations where owner_id=player and id=target) then return null;end if;
 if difference<>0 then
  insert into quiz_game_internal.goal_reward_totals values(player,target,difference)
  on conflict(owner_id,generation) do update set xp=goal_reward_totals.xp+excluded.xp;
 end if;
 insert into quiz_game_internal.achievement_dirty_goals values(player,target,goal_id) on conflict do nothing;
 return null;
end$$;
create trigger goal_reward_delta after insert or update or delete on quiz_game_internal.goal_rewards
for each row execute function quiz_game_internal.goal_reward_delta();

create or replace function quiz_game_internal.refresh_learning_achievements(player uuid,target uuid,revision bigint) returns void
language plpgsql set search_path='' as $$
declare before_counts jsonb; current_counts jsonb; maxima jsonb; rounds text[]; goals text[]; changes jsonb;
 fingerprint text; t record; entry record; was_learned boolean; is_learned boolean; difference integer; counter_key text;
begin
 select coalesce(array_agg(id),array[]::text[]) into rounds from public.quiz_sync_entries
 where owner_id=player and generation=target and kind='round' and not deleted and changed_revision=revision and value->>'status'='completed';
 if cardinality(rounds)=0 then return;end if;
 select coalesce(counts,'{}') into before_counts from quiz_game_internal.learning_achievements where owner_id=player and generation=target;
 before_counts:=coalesce(before_counts,'{}');
 select signature into fingerprint from quiz_game_internal.achievement_catalog where id;
 select counts into current_counts from quiz_game_internal.achievement_current where owner_id=player and generation=target and signature=fingerprint;
 if current_counts is null then
  -- Only an explicit reset/import or a changed content definition requires
  -- rebuilding the current-format projection. Ordinary rounds use the delta.
  perform quiz_game_internal.rebuild_achievement_current(player,target);
  select counts into current_counts from quiz_game_internal.achievement_current where owner_id=player and generation=target;
 else
  with removed as (delete from quiz_game_internal.achievement_dirty_goals where owner_id=player and generation=target returning goal)
  select coalesce(array_agg(goal),array[]::text[]) into goals from removed;
  with next as materialized(select * from quiz_game_internal.achievement_goal_values(player,target,goals)),
  prior as materialized(select * from quiz_game_internal.achievement_goal_progress where owner_id=player and generation=target and goal=any(goals)),
  saved as (
   insert into quiz_game_internal.achievement_goal_progress select player,target,v.* from next v
   on conflict(owner_id,generation,goal) do update set secure=excluded.secure,seen=excluded.seen,mastered=excluded.mastered,sci_fi=excluded.sci_fi
   where (achievement_goal_progress.secure,achievement_goal_progress.seen,achievement_goal_progress.mastered,achievement_goal_progress.sci_fi)
    is distinct from (excluded.secure,excluded.seen,excluded.mastered,excluded.sci_fi)
  ),
  deltas as (
   select 'secureFacts' id,coalesce(sum(secure::integer),0) n from next union all select 'secureFacts',-coalesce(sum(secure::integer),0) from prior
   union all select 'discoveredFacts',coalesce(sum(seen::integer),0) from next union all select 'discoveredFacts',-coalesce(sum(seen::integer),0) from prior
   union all select 'masteredFacts',coalesce(sum(mastered::integer),0) from next union all select 'masteredFacts',-coalesce(sum(mastered::integer),0) from prior
   union all select '_sciFiMastered',coalesce(sum(sci_fi::integer),0) from next union all select '_sciFiMastered',-coalesce(sum(sci_fi::integer),0) from prior
  ) select jsonb_object_agg(id,n) into changes from (select id,sum(n)::integer n from deltas group by id) d;
  for entry in select * from jsonb_each_text(changes) loop
   current_counts:=jsonb_set(current_counts,array[entry.key],to_jsonb(coalesce((current_counts->>entry.key)::integer,0)+entry.value::integer));
  end loop;
  for t in select distinct definition.* from quiz_game_internal.achievement_requirements r join quiz_game_internal.achievement_topics definition using(source,topic) where r.goal=any(goals) loop
   select exists(select 1 from quiz_game_internal.achievement_topic_progress where owner_id=player and generation=target and source=t.source and topic=t.topic) into was_learned;
   select not exists(select 1 from quiz_game_internal.achievement_requirements r where r.source=t.source and r.topic=t.topic
    and not exists(select 1 from quiz_game_internal.secure_goals s where s.owner_id=player and s.generation=target and s.goal=r.goal and s.area=r.area and s.difficulty='leicht')) into is_learned;
   if was_learned=is_learned then continue;end if;
   difference:=case when is_learned then 1 else -1 end;
   if is_learned then insert into quiz_game_internal.achievement_topic_progress values(player,target,t.source,t.topic);
   else delete from quiz_game_internal.achievement_topic_progress where owner_id=player and generation=target and source=t.source and topic=t.topic;end if;
   counter_key:=case t.source when 'film' then 'films' else t.source end;
   current_counts:=jsonb_set(current_counts,array[counter_key],to_jsonb(coalesce((current_counts->>counter_key)::integer,0)+difference));
   if t.source='film' then foreach counter_key in array t.genres loop
    current_counts:=jsonb_set(current_counts,array['films:'||counter_key],to_jsonb(coalesce((current_counts->>('films:'||counter_key))::integer,0)+difference));
   end loop;end if;
  end loop;
 end if;
 current_counts:=current_counts||jsonb_build_object(
 'genreBreadth',(select count(*) from jsonb_each_text(current_counts) where key like 'films:%' and value::integer>0),
 'experience',coalesce((select value::text::integer from public.quiz_sync_entries where owner_id=player and generation=target and kind='field' and id='experience' and not deleted),0),
 'sciFiMastery',case when (current_counts->>'_sciFiMastered')::integer>=10 or exists(select 1 from public.quiz_sync_entries where owner_id=player and generation=target and kind='field' and id='badges' and not deleted and value ? 'sci-fi-10-v1') then 10 else 0 end
 );
 update quiz_game_internal.achievement_current set counts=current_counts where owner_id=player and generation=target and counts is distinct from current_counts;
 select jsonb_object_agg(key,n) into maxima from (
  select key,max(value::integer) n from (select * from jsonb_each_text(before_counts) union all select * from jsonb_each_text(current_counts-'_sciFiMastered')) all_counts group by key
 ) m;
 insert into quiz_game_internal.learning_achievements values(player,target,maxima)
 on conflict(owner_id,generation) do update set counts=excluded.counts where learning_achievements.counts is distinct from excluded.counts;
 insert into quiz_game_internal.round_learning_achievements
 select player,target,r,jsonb_build_object('before',before_counts,'after',jsonb_build_object('counts',maxima,'available',c.available))
 from unnest(rounds) r cross join quiz_game_internal.achievement_catalog c where c.id
 on conflict(owner_id,generation,round_id) do nothing;
end$$;

create or replace function quiz_game_internal.learning_achievement_progress(player uuid,target uuid) returns jsonb
language sql stable set search_path='' as $$
 select jsonb_build_object('counts',
  (select jsonb_object_agg(key,0) from jsonb_each(c.available))||coalesce(a.counts,'{}'), 'available',c.available)
 from quiz_game_internal.achievement_catalog c left join quiz_game_internal.learning_achievements a on a.owner_id=player and a.generation=target where c.id
$$;

-- Stage summaries aggregate only the account's learned goals. Unseen counts
-- and catalogue sizes come from the prepared definition, not a catalogue scan.
create function quiz_game_internal.learning_summary(player uuid,target uuid) returns jsonb
language sql stable set search_path='' as $$
 with learned as materialized (
  select coalesce((l.value->>'stage')::integer,-1) stage,l.value->>'status' status,g.sci_fi
  from public.quiz_sync_entries l join quiz_game_internal.achievement_goals g on g.goal=l.id
  where l.owner_id=player and l.generation=target and l.kind='learning' and not l.deleted
 ), totals as (
  select count(*) filter(where stage>=0) seen,count(*) filter(where stage=0) discovered,
   jsonb_build_array(count(*) filter(where stage=1),count(*) filter(where stage=2),count(*) filter(where stage=3),count(*) filter(where stage=4)) stages,
   count(*) filter(where status='gefestigt') mastered,coalesce(sum(greatest(0,stage)),0) steps,
   count(*) filter(where sci_fi and status='gefestigt') sci_fi_mastered from learned
 ) select jsonb_build_object('unseen',(c.available->>'secureFacts')::integer-t.seen,'discovered',t.discovered,
  'stages',t.stages,'mastered',t.mastered,'steps',t.steps,'maximum',(c.available->>'secureFacts')::integer*4,
  'percent',case when (c.available->>'secureFacts')::integer=0 then 0 else round(100.0*t.steps/((c.available->>'secureFacts')::integer*4),2) end,
  'badge',jsonb_build_object('available',c.sci_fi,'mastered',t.sci_fi_mastered),
  'perfectTens',coalesce((select perfect_tens from quiz_game_internal.profile_totals where owner_id=player and generation=target),0))
 from totals t cross join quiz_game_internal.achievement_catalog c where c.id
$$;
-- Profile statistics and achievements share a single small request.
create index profile_mastered_goals on public.quiz_sync_entries(owner_id,generation,id)
where kind='learning' and not deleted and value->>'status'='gefestigt';
do $patch$declare original text; d text;h record;begin
 original:=pg_get_functiondef('quiz_game_internal.refresh_groups()'::regprocedure);
 -- Append before the function's final END, not any embedded CASE END.
 d:=regexp_replace(original,'end\s*\$function\$', 'perform quiz_game_internal.prepare_achievement_catalog(); end$function$', 'i');
 if d=original then raise exception 'achievement_content_hook_missing';end if;execute d;
 perform quiz_game_internal.prepare_achievement_catalog();
 for h in select owner_id,generation from public.quiz_account_heads where generation is not null loop
  perform quiz_game_internal.rebuild_achievement_current(h.owner_id,h.generation);
 end loop;
 original:=pg_get_functiondef('quiz_game_internal.finish_projection(uuid,uuid,bigint)'::regprocedure);
 d:=replace(original,'select coalesce(sum(g.xp),0) into xp from quiz_game_internal.goal_rewards g where owner_id=player and generation=target;',
 'select coalesce((select g.xp from quiz_game_internal.goal_reward_totals g where owner_id=player and generation=target),0) into xp;');
 if d=original then raise exception 'achievement_xp_finish_hook_missing';end if;execute d;
 original:=pg_get_functiondef('quiz_game_internal.call(text)'::regprocedure);
 d:=replace(original,'select coalesce(sum(g.xp),0) into xp from quiz_game_internal.goal_rewards g where owner_id=player and generation=head.generation;',
 'select coalesce((select g.xp from quiz_game_internal.goal_reward_totals g where owner_id=player and generation=head.generation),0) into xp;');
 if d=original then raise exception 'achievement_xp_call_hook_missing';end if;execute d;
 original:=pg_get_functiondef('quiz_game_internal.view(text)'::regprocedure);
 d:=replace(original,'result:=quiz_game_internal.learning_achievement_progress(player,target);
 return jsonb_set(result,''{counts}'',coalesce((select counts from quiz_game_internal.learning_achievements where owner_id=player and generation=target),result->''counts''));',
 'return quiz_game_internal.learning_achievement_progress(player,target);');
 if d=original then raise exception 'achievement_read_hook_missing';end if;
 original:=d;
 d:=regexp_replace(original,'elsif action=''summary'' then.*?elsif action=''topics'' then',
 'elsif action=''summary'' then return quiz_game_internal.learning_summary(player,target); elsif action=''topics'' then','s');
 if d=original then raise exception 'achievement_summary_hook_missing';end if;
 original:=d;
 d:=replace(original,'if action=''info'' then','if action=''profile-progress'' then
 select count(*) into total from public.quiz_sync_entries l where l.owner_id=player and l.generation=target and l.kind=''learning'' and not l.deleted and l.value->>''status''=''gefestigt'' and exists(select 1 from quiz_game_internal.achievement_goals g where g.goal=l.id);
 return jsonb_build_object(''statistics'',quiz_game_internal.view(''{"action":"profile-stats"}'')||jsonb_build_object(''mastered'',total),''achievements'',quiz_game_internal.learning_achievement_progress(player,target));
 end if; if action=''info'' then');
 -- Keep the profile count local to this owner-checked view invocation.
 d:=replace(d,'declare player uuid', 'declare total integer; player uuid');
 if d=original then raise exception 'achievement_profile_hook_missing';end if;execute d;
end$patch$;
revoke all on function quiz_game_internal.prepare_achievement_catalog(),quiz_game_internal.achievement_goal_values(uuid,uuid,text[]),
quiz_game_internal.rebuild_achievement_current(uuid,uuid),quiz_game_internal.goal_reward_delta(),quiz_game_internal.learning_summary(uuid,uuid) from public,anon,authenticated;
commit;
