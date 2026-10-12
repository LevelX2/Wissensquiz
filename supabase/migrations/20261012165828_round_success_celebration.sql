begin;
-- Maintain one compact row per perfect round and one account counter.
-- Reads of results/collection use existing RPCs, without replaying history.
alter table quiz_game_internal.profile_totals add column perfect_tens bigint not null default 0 check(perfect_tens>=0);
create table quiz_game_internal.perfect_rounds(
 owner_id uuid not null,generation uuid not null,round_id text not null,reached bigint not null,
 primary key(owner_id,generation,round_id),
 foreign key(owner_id,generation) references public.quiz_sync_generations(owner_id,id) on delete cascade);
alter table quiz_game_internal.perfect_rounds enable row level security;
revoke all on quiz_game_internal.perfect_rounds from public,anon,authenticated;
create function quiz_game_internal.refresh_perfect_round(player uuid,target uuid,round_key text) returns void language plpgsql set search_path='' as $$
declare r jsonb; was_perfect boolean; is_perfect boolean:=false; total bigint;
begin
 if not exists(select 1 from public.quiz_sync_generations where owner_id=player and id=target) then return;end if;
 select exists(select 1 from quiz_game_internal.perfect_rounds where owner_id=player and generation=target and round_id=round_key) into was_perfect;
 select value into r from public.quiz_sync_entries where owner_id=player and generation=target and kind='round' and id=round_key and not deleted;
 if r->>'status'='completed' and jsonb_array_length(r->'questions')=10 then
  select count(*)=10 and count(distinct e.value->>'questionId')=10 and count(distinct e.value->>'knowledgeId')=10
   and bool_and(e.value->>'correct'='true' and e.value->>'guessed'='false' and e.value->>'answerId' is not null
    and exists(select 1 from jsonb_array_elements(r->'questions') q where q->>'id'=e.value->>'questionId'))
  into is_perfect from public.quiz_sync_entries e where owner_id=player and generation=target and kind='event' and round_id=round_key and not deleted;
 end if;
 if coalesce(is_perfect,false)=was_perfect then return;end if;
 insert into quiz_game_internal.profile_totals(owner_id,generation) values(player,target) on conflict do nothing;
 update quiz_game_internal.profile_totals set perfect_tens=perfect_tens+case when is_perfect then 1 else -1 end
  where owner_id=player and generation=target returning perfect_tens into total;
 if is_perfect then insert into quiz_game_internal.perfect_rounds values(player,target,round_key,total);
 else delete from quiz_game_internal.perfect_rounds where owner_id=player and generation=target and round_id=round_key;end if;
end$$;
create function quiz_game_internal.perfect_round_entry() returns trigger language plpgsql security definer set search_path='' as $$
declare player uuid;target uuid;prior text;next text;
begin
 if tg_op='DELETE' then player:=old.owner_id;target:=old.generation;else player:=new.owner_id;target:=new.generation;end if;
 if tg_op<>'INSERT' then prior:=case when old.kind='round' then old.id else old.round_id end;end if;
 if tg_op<>'DELETE' then next:=case when new.kind='round' then new.id else new.round_id end;end if;
 if prior is not null then perform quiz_game_internal.refresh_perfect_round(player,target,prior);end if;
 if next is not null and next is distinct from prior then perform quiz_game_internal.refresh_perfect_round(player,target,next);end if;
 return null;
end$$;
create trigger perfect_round_insert after insert on public.quiz_sync_entries for each row when(new.kind in('round','event')) execute function quiz_game_internal.perfect_round_entry();
create trigger perfect_round_update after update on public.quiz_sync_entries for each row when(new.kind in('round','event') or old.kind in('round','event')) execute function quiz_game_internal.perfect_round_entry();
create trigger perfect_round_delete after delete on public.quiz_sync_entries for each row when(old.kind in('round','event')) execute function quiz_game_internal.perfect_round_entry();
-- Initialize only the current source data; no historical format adapter.
do $initialize$declare r record;begin
 perform 1 from public.quiz_account_heads for update;
 for r in select e.owner_id,e.generation,e.id from public.quiz_sync_entries e join public.quiz_account_heads h on h.owner_id=e.owner_id and h.generation=e.generation where e.kind='round' and not e.deleted and e.value->>'status'='completed' and jsonb_array_length(e.value->'questions')=10 order by (e.value->>'finishedAt')::bigint,e.id loop
  perform quiz_game_internal.refresh_perfect_round(r.owner_id,r.generation,r.id);
 end loop;
end$initialize$;
do $views$declare original text;d text;begin
 original:=pg_get_functiondef('quiz_game_internal.view(text)'::regprocedure);
 d:=replace(original,'from quiz_game_internal.round_rewards where owner_id=player and generation=target and round_id=req->>''scope''; return result; end if;',
 'from quiz_game_internal.round_rewards where owner_id=player and generation=target and round_id=req->>''scope''; if result is null and not exists(select 1 from quiz_game_internal.perfect_rounds where owner_id=player and generation=target and round_id=req->>''scope'') then return null;end if; return coalesce(result,''{}''::jsonb)||jsonb_build_object(''perfectTens'',coalesce((select reached from quiz_game_internal.perfect_rounds where owner_id=player and generation=target and round_id=req->>''scope''),0)); end if;');
 d:=replace(d,'jsonb_build_object(''badge'',result)','jsonb_build_object(''badge'',result,''perfectTens'',coalesce((select perfect_tens from quiz_game_internal.profile_totals where owner_id=player and generation=target),0))');
 if d=original or position('return coalesce(result,''{}''::jsonb)||jsonb_build_object(''perfectTens''' in d)=0 then raise exception 'perfect_round_view_patch_missing';end if;execute d;
end$views$;
revoke all on function quiz_game_internal.refresh_perfect_round(uuid,uuid,text),quiz_game_internal.perfect_round_entry() from public,anon,authenticated;
commit;
