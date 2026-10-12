begin;
-- Compact achievement maxima belong to one account generation. Source answers,
-- current learning and XP remain authoritative and are never rewritten here.
create table quiz_game_internal.learning_achievements(
 owner_id uuid not null,generation uuid not null,counts jsonb not null,
 primary key(owner_id,generation),
 foreign key(owner_id,generation) references public.quiz_sync_generations(owner_id,id) on delete cascade);
create table quiz_game_internal.round_learning_achievements(
 owner_id uuid not null,generation uuid not null,round_id text not null,value jsonb not null,
 primary key(owner_id,generation,round_id),
 foreign key(owner_id,generation) references public.quiz_sync_generations(owner_id,id) on delete cascade);
alter table quiz_game_internal.learning_achievements enable row level security;
alter table quiz_game_internal.round_learning_achievements enable row level security;
revoke all on quiz_game_internal.learning_achievements,quiz_game_internal.round_learning_achievements from public,anon,authenticated;

create function quiz_game_internal.learning_achievement_progress(player uuid,target uuid) returns jsonb
language sql stable set search_path='' as $$
 with facts as materialized (
  select distinct m.knowledge_id,m.source,m.topic,m.genre,m.difficulty,
   exists(select 1 from quiz_game_internal.secure_goals s where s.owner_id=player and s.generation=target and s.goal=m.knowledge_id and s.difficulty=m.difficulty
    and s.area=case m.source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else m.genre end) safe,
   l.id is not null seen,l.value->>'status'='gefestigt' mastered
  from quiz_game_internal.catalog_meta m
  left join public.quiz_sync_entries l on l.owner_id=player and l.generation=target and l.kind='learning' and l.id=m.knowledge_id and not l.deleted
 ), topics as materialized (
  select source,topic,array_agg(distinct genre) genres,bool_and(safe) filter(where difficulty='leicht') learned
  from facts group by source,topic having count(*) filter(where difficulty='leicht')>0
 ), genres as (
  select genre,count(*) filter(where learned)::integer n,count(*)::integer available from topics cross join lateral unnest(genres) genre where source='film' group by genre
 ), entries as (
  select case source when 'film' then 'films' else source end id,count(*) filter(where learned)::integer n,count(*)::integer available from topics group by source
  union all select 'films:'||genre,n,available from genres
  union all select 'genreBreadth',count(*) filter(where n>0)::integer,count(*)::integer from genres
  union all select 'secureFacts',count(distinct knowledge_id) filter(where safe)::integer,count(distinct knowledge_id)::integer from facts
  union all select 'discoveredFacts',count(distinct knowledge_id) filter(where seen)::integer,count(distinct knowledge_id)::integer from facts
  union all select 'masteredFacts',count(distinct knowledge_id) filter(where mastered)::integer,count(distinct knowledge_id)::integer from facts
  union all select 'experience',coalesce((select value::text::integer from public.quiz_sync_entries where owner_id=player and generation=target and kind='field' and id='experience' and not deleted),0),10000
  union all select 'sciFiMastery',case when count(distinct knowledge_id) filter(where mastered)>=10 or exists(select 1 from public.quiz_sync_entries where owner_id=player and generation=target and kind='field' and id='badges' and not deleted and value ? 'sci-fi-10-v1') then 10 else 0 end,
   case when count(distinct knowledge_id)>=10 then 10 else 0 end from facts where source='film' and genre='Science-Fiction' and difficulty='leicht'
 ) select jsonb_build_object('counts',coalesce(jsonb_object_agg(id,n),'{}'),'available',coalesce(jsonb_object_agg(id,available),'{}')) from entries
$$;

create function quiz_game_internal.refresh_learning_achievements(player uuid,target uuid,revision bigint) returns void
language plpgsql set search_path='' as $$
declare before_counts jsonb; progress jsonb; maxima jsonb; rounds text[];
begin
 select coalesce(array_agg(id),array[]::text[]) into rounds from public.quiz_sync_entries
 where owner_id=player and generation=target and kind='round' and not deleted and changed_revision=revision and value->>'status'='completed';
 if cardinality(rounds)=0 then return;end if;
 select counts into before_counts from quiz_game_internal.learning_achievements where owner_id=player and generation=target;
 before_counts:=coalesce(before_counts,'{}');
 progress:=quiz_game_internal.learning_achievement_progress(player,target);
 select coalesce(jsonb_object_agg(key,n),'{}') into maxima from (
  select key,max(value::integer) n from (select * from jsonb_each_text(before_counts) union all select * from jsonb_each_text(progress->'counts')) x group by key
 ) m;
 insert into quiz_game_internal.learning_achievements values(player,target,maxima)
 on conflict(owner_id,generation) do update set counts=excluded.counts;
 -- A receipt or re-projection cannot replace the first completion snapshot.
 insert into quiz_game_internal.round_learning_achievements
 select player,target,r,jsonb_build_object('before',before_counts,'after',jsonb_set(progress,'{counts}',maxima)) from unnest(rounds) r
 on conflict(owner_id,generation,round_id) do nothing;
end$$;

-- Initialize only current generations in the current format. No historical
-- payload adaptation, source rewrite or retrospective celebration.
insert into quiz_game_internal.learning_achievements
select owner_id,generation,quiz_game_internal.learning_achievement_progress(owner_id,generation)->'counts'
from public.quiz_account_heads where generation is not null;

do $patch$ declare d text; original text;begin
 original:=pg_get_functiondef('quiz_game_internal.finish_projection(uuid,uuid,bigint)'::regprocedure);
 d:=replace(original,'perform quiz_sync_internal.project(player,target,','perform quiz_game_internal.refresh_learning_achievements(player,target,revision); perform quiz_sync_internal.project(player,target,');
 if d=original then raise exception 'learning_achievement_finish_patch_missing';end if;execute d;
 original:=pg_get_functiondef('quiz_game_internal.view(text)'::regprocedure);
 d:=replace(original,'if action=''info'' then','if action=''learning-achievements'' then
 result:=quiz_game_internal.learning_achievement_progress(player,target);
 return jsonb_set(result,''{counts}'',coalesce((select counts from quiz_game_internal.learning_achievements where owner_id=player and generation=target),result->''counts''));
 end if; if action=''info'' then');
 if d=original then raise exception 'learning_achievement_view_patch_missing';end if;execute d;
 original:=pg_get_functiondef('quiz_game_internal.achievement_reward(uuid,uuid,text,jsonb)'::regprocedure);
 d:=replace(original,'''achievements'',','''learningAchievements'',(select value from quiz_game_internal.round_learning_achievements where owner_id=player and generation=target and round_id=round_key),''achievements'',');
 if d=original then raise exception 'learning_achievement_reward_patch_missing';end if;execute d;
end$patch$;
revoke all on function quiz_game_internal.learning_achievement_progress(uuid,uuid),quiz_game_internal.refresh_learning_achievements(uuid,uuid,bigint) from public,anon,authenticated;
commit;
