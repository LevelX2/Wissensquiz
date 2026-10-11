begin;
-- Persist the small authoritative reward while already replaying one affected
-- goal. Result views never reconstruct career totals from a partial client boot.
create table quiz_game_internal.round_goal_rewards(owner_id uuid not null,generation uuid not null,round_id text not null,goal text not null,breakdown jsonb not null,primary key(owner_id,generation,round_id,goal),foreign key(owner_id,generation) references public.quiz_sync_generations(owner_id,id) on delete cascade);
create table quiz_game_internal.round_rewards(owner_id uuid not null,generation uuid not null,round_id text not null,value jsonb not null,primary key(owner_id,generation,round_id),foreign key(owner_id,generation) references public.quiz_sync_generations(owner_id,id) on delete cascade);
alter table quiz_game_internal.round_goal_rewards enable row level security;
alter table quiz_game_internal.round_rewards enable row level security;
revoke all on quiz_game_internal.round_goal_rewards,quiz_game_internal.round_rewards from public,anon,authenticated;
do $patch$declare d text; original text;begin
 original:=pg_get_functiondef('quiz_game_internal.project_goal(uuid,uuid,text,bigint,text)'::regprocedure);
 d:=replace(original,'day text; xp integer:=0;','day text; xp integer:=0; event_xp jsonb;');
 d:=replace(d,'  day:=quiz_game_internal.day_key((e->>''at'')::bigint,row.timezone);
  if (e->>''answerId'' is not null or e->>''dontKnow''=''true'') and not(day=any(answered_days)) then xp:=xp+1; answered_days:=array_append(answered_days,day); end if;
  if not safe then continue; end if;
  if not(day=any(safe_days)) then xp:=xp+case row.difficulty when ''leicht'' then 2 when ''mittel'' then 3 else 5 end; safe_days:=array_append(safe_days,day); end if;
  if not discovered then xp:=xp+2; discovered:=true; end if;
  if was_mistake and not recovered then xp:=xp+4; recovered:=true; end if;
  if p->>''status''=''gefestigt'' and not mastered then xp:=xp+8; mastered:=true; end if;','  day:=quiz_game_internal.day_key((e->>''at'')::bigint,row.timezone);
  event_xp:=jsonb_build_object(''participation'',0,''correct'',0,''discovered'',0,''recovered'',0,''mastered'',0);
  if (e->>''answerId'' is not null or e->>''dontKnow''=''true'') and not(day=any(answered_days)) then event_xp:=jsonb_set(event_xp,''{participation}'',''1''); answered_days:=array_append(answered_days,day); end if;
  if safe then
   if not(day=any(safe_days)) then event_xp:=jsonb_set(event_xp,''{correct}'',to_jsonb(case row.difficulty when ''leicht'' then 2 when ''mittel'' then 3 else 5 end)); safe_days:=array_append(safe_days,day); end if;
   if not discovered then event_xp:=jsonb_set(event_xp,''{discovered}'',''2''); discovered:=true; end if;
   if was_mistake and not recovered then event_xp:=jsonb_set(event_xp,''{recovered}'',''4''); recovered:=true; end if;
   if p->>''status''=''gefestigt'' and not mastered then event_xp:=jsonb_set(event_xp,''{mastered}'',''8''); mastered:=true; end if;
  end if;
  xp:=xp+(select sum(value::integer) from jsonb_each_text(event_xp));
  if row.changed_revision=revision then
  insert into quiz_game_internal.round_goal_rewards(owner_id,generation,round_id,goal,breakdown) values(player,target,e->>''roundId'',goal_id,event_xp)
  on conflict(owner_id,generation,round_id,goal) do update set breakdown=excluded.breakdown where round_goal_rewards.breakdown is distinct from excluded.breakdown;
  end if;');
 d:=replace(d,'e.position ordinal','e.position ordinal,e.changed_revision');
 d:=replace(d,'r.timezone,q.index from quiz_game_internal.runs','r.timezone,q.index,null::bigint from quiz_game_internal.runs');
 if d=original or position('event_xp:=jsonb_build_object' in d)=0 then raise exception 'game_reward_patch_missing';end if;execute d;
 original:=pg_get_functiondef('quiz_game_internal.finish_projection(uuid,uuid,bigint)'::regprocedure);
 d:=replace(original,'update public.quiz_sync_entries set value=to_jsonb(xp),changed_revision=revision',
 'insert into quiz_game_internal.round_rewards(owner_id,generation,round_id,value)
 select player,target,e.id,jsonb_build_object(''xp'',(select jsonb_object_agg(key,n) from (select key,sum(value::integer) n from quiz_game_internal.round_goal_rewards g cross join lateral jsonb_each_text(g.breakdown) where g.owner_id=player and g.generation=target and g.round_id=e.id group by key) b),''before'',coalesce((select value::text::integer from public.quiz_sync_entries where owner_id=player and generation=target and kind=''field'' and id=''experience'' and not deleted),0),''after'',xp)
 from public.quiz_sync_entries e join quiz_game_internal.runs r on ''learn-''||r.id::text=e.id and r.owner_id=player and r.generation=target and r.status=''completed''
 where e.owner_id=player and e.generation=target and e.kind=''round'' and not e.deleted and e.changed_revision=revision
 on conflict(owner_id,generation,round_id) do nothing;
 update public.quiz_sync_entries set value=to_jsonb(xp),changed_revision=revision');
 if d=original then raise exception 'game_reward_finish_patch_missing';end if;execute d;
 original:=pg_get_functiondef('quiz_game_internal.view(text)'::regprocedure);
 d:=replace(original,'if action=''info'' then','if action=''round-experience'' then select value into result from quiz_game_internal.round_rewards where owner_id=player and generation=target and round_id=req->>''scope''; return result; end if; if action=''info'' then');
 if d=original then raise exception 'game_reward_view_patch_missing';end if;execute d;
end$patch$;
revoke all on all functions in schema quiz_game_internal from public,anon,authenticated;
commit;
