begin;

-- Private, incremental achievement projection. Existing result/profile RPCs
-- remain constant-size reads; no client download of the account history.
alter table quiz_game_internal.profile_totals add column zero_tens bigint not null default 0 check(zero_tens>=0);
create table quiz_game_internal.round_achievements(
 owner_id uuid not null,generation uuid not null,round_id text not null,
 completed_reached bigint not null,zero_reached bigint not null default 0,
 primary key(owner_id,generation,round_id),
 foreign key(owner_id,generation) references public.quiz_sync_generations(owner_id,id) on delete cascade);
alter table quiz_game_internal.round_achievements enable row level security;
revoke all on quiz_game_internal.round_achievements from public,anon,authenticated;

create function quiz_game_internal.refresh_round_achievements(player uuid,target uuid,round_key text) returns void
language plpgsql set search_path='' as $$
declare r jsonb; was_zero boolean; is_zero boolean:=false; total bigint; completed_count bigint;
begin
 if not exists(select 1 from public.quiz_sync_generations where owner_id=player and id=target) then return;end if;
 select exists(select 1 from quiz_game_internal.round_achievements where owner_id=player and generation=target and round_id=round_key and zero_reached>0) into was_zero;
 select value into r from public.quiz_sync_entries where owner_id=player and generation=target and kind='round' and id=round_key and not deleted;
 if r->>'status'='completed' and jsonb_array_length(r->'questions')=10 then
  select count(*)=10 and count(distinct e.value->>'questionId')=10 and count(distinct e.value->>'knowledgeId')=10
   and bool_and(coalesce(e.value->>'correct'='false' and (e.value->>'answerId' is not null or e.value->>'dontKnow'='true')
    and exists(select 1 from jsonb_array_elements(r->'questions') q where q->>'id'=e.value->>'questionId'),false))
  into is_zero from public.quiz_sync_entries e where owner_id=player and generation=target and kind='event' and round_id=round_key and not deleted;
 end if;
 is_zero:=coalesce(is_zero,false);
 if is_zero is distinct from was_zero then
  update quiz_game_internal.profile_totals set zero_tens=zero_tens+case when is_zero then 1 else -1 end
   where owner_id=player and generation=target;
 end if;
 if r->>'status'='completed' then
  select completed,zero_tens into completed_count,total from quiz_game_internal.profile_totals where owner_id=player and generation=target;
  insert into quiz_game_internal.round_achievements values(player,target,round_key,completed_count,case when is_zero then total else 0 end)
   on conflict(owner_id,generation,round_id) do update set zero_reached=case
    when not is_zero then 0 when not was_zero then excluded.zero_reached else round_achievements.zero_reached end;
 else
  delete from quiz_game_internal.round_achievements where owner_id=player and generation=target and round_id=round_key;
 end if;
end$$;

create function quiz_game_internal.round_achievement_entry() returns trigger
language plpgsql security invoker set search_path='' as $$
declare player uuid;target uuid;prior text;next text;
begin
 if tg_op='DELETE' then player:=old.owner_id;target:=old.generation;else player:=new.owner_id;target:=new.generation;end if;
 if tg_op<>'INSERT' then prior:=case when old.kind='round' then old.id else old.round_id end;end if;
 if tg_op<>'DELETE' then next:=case when new.kind='round' then new.id else new.round_id end;end if;
 if prior is not null then perform quiz_game_internal.refresh_round_achievements(player,target,prior);end if;
 if next is not null and next is distinct from prior then perform quiz_game_internal.refresh_round_achievements(player,target,next);end if;
 return null;
end$$;
-- PostgreSQL orders same-event triggers by name. Run after profile_entry so
-- the completion ordinal uses the already updated account counter.
create trigger zz_round_achievement_insert after insert on public.quiz_sync_entries for each row when(new.kind in('round','event')) execute function quiz_game_internal.round_achievement_entry();
create trigger zz_round_achievement_update after update on public.quiz_sync_entries for each row when(new.kind in('round','event') or old.kind in('round','event')) execute function quiz_game_internal.round_achievement_entry();
create trigger zz_round_achievement_delete after delete on public.quiz_sync_entries for each row when(old.kind in('round','event')) execute function quiz_game_internal.round_achievement_entry();

-- Derive the new projection from current-format account data only. Do not
-- modify source entries, learning, XP, revisions or the account generation.
do $initialize$declare r record;begin
 perform 1 from public.quiz_account_heads for update;
 for r in select e.owner_id,e.generation,e.id from public.quiz_sync_entries e join public.quiz_account_heads h on h.owner_id=e.owner_id and h.generation=e.generation
  where e.kind='round' and not e.deleted and e.value->>'status'='completed' order by (e.value->>'finishedAt')::bigint,e.id loop
  perform quiz_game_internal.refresh_round_achievements(r.owner_id,r.generation,r.id);
 end loop;
 with ordinals as (
  select e.owner_id,e.generation,e.id,row_number() over(partition by e.owner_id,e.generation order by (e.value->>'finishedAt')::bigint,e.id) reached
  from public.quiz_sync_entries e join public.quiz_account_heads h on h.owner_id=e.owner_id and h.generation=e.generation
  where e.kind='round' and not e.deleted and e.value->>'status'='completed')
 update quiz_game_internal.round_achievements a set completed_reached=o.reached from ordinals o where a.owner_id=o.owner_id and a.generation=o.generation and a.round_id=o.id;
end$initialize$;

create function quiz_game_internal.achievement_reward(player uuid,target uuid,round_key text,reward jsonb) returns jsonb
language sql stable set search_path='' as $$
 select case when reward is null and a.round_id is null and p.round_id is null then null else
  coalesce(reward,'{}'::jsonb)||jsonb_build_object('perfectTens',coalesce(p.reached,0),'achievements',
   jsonb_build_object('completed',coalesce(a.completed_reached,0),'perfectTens',coalesce(p.reached,0),'zeroTens',coalesce(a.zero_reached,0))) end
 from (select 1) anchor left join quiz_game_internal.round_achievements a on a.owner_id=player and a.generation=target and a.round_id=round_key
 left join quiz_game_internal.perfect_rounds p on p.owner_id=player and p.generation=target and p.round_id=round_key
$$;

do $views$declare original text;d text;begin
 original:=pg_get_functiondef('quiz_game_internal.view(text)'::regprocedure);
 d:=replace(original,
 'if result is null and not exists(select 1 from quiz_game_internal.perfect_rounds where owner_id=player and generation=target and round_id=req->>''scope'') then return null;end if; return coalesce(result,''{}''::jsonb)||jsonb_build_object(''perfectTens'',coalesce((select reached from quiz_game_internal.perfect_rounds where owner_id=player and generation=target and round_id=req->>''scope''),0));',
 'return quiz_game_internal.achievement_reward(player,target,req->>''scope'',result);');
 if d=original then raise exception 'round_achievement_reward_patch_missing';end if;
 original:=d;
 d:=replace(d,'''recordRounds'',record_rounds,''accuracy''','''recordRounds'',record_rounds,''perfectTens'',perfect_tens,''zeroTens'',zero_tens,''accuracy''');
 if d=original then raise exception 'round_achievement_totals_patch_missing';end if;
 original:=d;
 d:=replace(d,'''recordRounds'',0,''accuracy''','''recordRounds'',0,''perfectTens'',0,''zeroTens'',0,''accuracy''');
 if d=original then raise exception 'round_achievement_empty_patch_missing';end if;
 execute d;
end$views$;
revoke all on function quiz_game_internal.refresh_round_achievements(uuid,uuid,text),quiz_game_internal.round_achievement_entry(),quiz_game_internal.achievement_reward(uuid,uuid,text,jsonb) from public,anon,authenticated;
commit;
