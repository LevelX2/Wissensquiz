begin;
-- Verification is read-only. Writes lock one account for slots and one duel
-- for turn/answer changes; independent players no longer share a mutex.
create or replace function public.quiz_duel_lock() returns uuid language plpgsql security definer set search_path='' as $$
declare p uuid:=auth.uid();begin
 if p is null or not public.quiz_verified_user() then raise exception 'verified_account_required' using errcode='42501';end if;return p;
end$$;
create or replace function public.quiz_duel_slots(p uuid) returns integer language sql stable security definer set search_path='' as $$
 select count(*)::integer from public.quiz_duels where (creator=p or opponent=p) and status in ('preparing','waiting','active') and due_at>clock_timestamp()
$$;
create function quiz_game_internal.duel_effective(d public.quiz_duels) returns public.quiz_duels language plpgsql stable set search_path='' as $$
declare common boolean;begin
 if d.status in ('preparing','waiting','active') and d.due_at<=clock_timestamp() then
  select exists(select 1 from public.quiz_duel_answers where duel_id=d.id and answered_at is not null group by round_no having count(*)=20) into common;
  d.reason:=case when d.status='waiting' then 'no_opponent' else 'timeout' end;
  d.winner:=case when d.status='active' and common then case when d.turn_owner=d.creator then d.opponent else d.creator end else null end;
  d.status:=case when d.status='active' and common then 'forfeit' else 'cancelled' end;d.finished_at:=d.due_at;d.turn_owner:=null;
 end if;return d;
end$$;
create function quiz_game_internal.duel_target(duel uuid,player uuid) returns public.quiz_duels language plpgsql set search_path='' as $$
declare d public.quiz_duels; effective public.quiz_duels;begin
 select * into d from public.quiz_duels where id=duel and (creator=player or opponent=player) for update;
 if not found then return null;end if;
 effective:=quiz_game_internal.duel_effective(d);
 if effective.status<>d.status then update public.quiz_duels set status=effective.status,winner=effective.winner,reason=effective.reason,finished_at=effective.finished_at,turn_owner=null where id=d.id returning * into d;end if;
 return d;
end$$;
do $patch$declare name text; d text;begin
 foreach name in array array['public.quiz_duel_start(uuid,integer,integer)','public.quiz_duel_answer(uuid,integer,integer,text,boolean,boolean)','public.quiz_duel_guess(uuid,integer,integer)','public.quiz_duel_close(uuid)'] loop
  d:=pg_get_functiondef(name::regprocedure);
  if position('select * into d from public.quiz_duels where id=duel and (creator=p or opponent=p);' in d)=0 then raise exception 'duel_lock_contract_missing';end if;
  d:=replace(d,'select * into d from public.quiz_duels where id=duel and (creator=p or opponent=p);','d:=quiz_game_internal.duel_target(duel,p);');
  d:=replace(d,'if not found','if d.id is null');execute d;
 end loop;
 d:=pg_get_functiondef('public.quiz_duel_view(uuid,integer)'::regprocedure);
 d:=replace(d,'''sources''','''sources''-''presentation''');
 d:=replace(d,'n:=public.quiz_duel_count(d.id,p,round_number);','d:=quiz_game_internal.duel_effective(d); n:=public.quiz_duel_count(d.id,p,round_number);');execute d;
 d:=pg_get_functiondef('public.quiz_duel_create(text,boolean,uuid)'::regprocedure);
 d:=replace(d,'begin'||chr(10),'begin'||chr(10)||'  perform pg_advisory_xact_lock(hashtextextended(p::text,20261011));'||chr(10));
 d:=replace(d,'and public.quiz_duel_slots(creator)<=5 order by created_at limit 1;','and due_at>clock_timestamp() order by created_at limit 1 for update skip locked;');
 d:=replace(d,'and status in (''preparing'',''waiting''))','and status in (''preparing'',''waiting'') and due_at>clock_timestamp())');execute d;
 d:=pg_get_functiondef('public.quiz_duel_join(text)'::regprocedure);
 d:=replace(d,'begin'||chr(10),'begin'||chr(10)||'  perform pg_advisory_xact_lock(hashtextextended(p::text,20261011));'||chr(10));
 d:=replace(d,'where token=invitation and kind=''invite'';','where token=invitation and kind=''invite'' for update;');
 d:=replace(d,'if d.status<>''waiting''','if d.due_at<=clock_timestamp() or d.opponent is not null or d.status<>''waiting''');execute d;
end$patch$;
-- One answer aggregation instead of twelve count queries per summary.
create or replace function public.quiz_duel_summary(d public.quiz_duels,p uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare other uuid:=case when p=d.creator then d.opponent else d.creator end; rounds jsonb; target uuid;
begin
 d:=quiz_game_internal.duel_effective(d);
 select generation into target from public.quiz_account_heads where owner_id=p;
 with counts as (
 select round_no,count(*) filter(where player=p)::integer mine,count(*) filter(where player=other)::integer theirs,
 count(*) filter(where player=p and correct)::integer hit,count(*) filter(where player=other and correct)::integer otherhit
 from public.quiz_duel_answers where duel_id=d.id and answered_at is not null group by round_no
 ) select jsonb_agg(jsonb_build_object('number',r,'answered',coalesce(c.mine,0),'mine',case when c.mine=10 then c.hit else null end,'opponent',case when c.mine=10 and c.theirs=10 then c.otherhit else null end,
 'imported',coalesce((select jsonb_array_length(value->'events')>=coalesce(c.mine,0) from public.quiz_sync_entries where owner_id=p and generation=target and kind='round' and id='duel-'||d.id::text||'-'||r and not deleted),false)) order by r)
 into rounds from generate_series(1,3) r left join counts c on c.round_no=r;
 return jsonb_build_object('id',d.id,'opponent',coalesce(public.quiz_duel_name(other),'Gegner wird gesucht'),'status',d.status,'kind',d.kind,'solutionDisplay',d.solution_display,'round',d.turn_round,
 'myTurn',d.turn_owner=p and d.status in ('preparing','active'),'dueAt',floor(extract(epoch from d.due_at)*1000)::bigint,'createdAt',floor(extract(epoch from d.created_at)*1000)::bigint,
 'reason',d.reason,'result',case when d.status='completed' and d.winner is null then 'draw' when d.winner=p then 'win' when d.winner=other then 'loss' else null end,
 'ranked',case when d.status='completed' then exists(select 1 from quiz_competition_internal.duel_awards a where a.duel_id=d.id) else null end,
 'invitation',case when d.creator=p and d.kind='invite' and d.status='waiting' then d.token else null end,'rounds',rounds);
end$$;
-- Expired own matches belong in result history even before a later write.
create or replace function public.quiz_duel_results(selected_period text default 'all',page_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare p uuid:=auth.uid(); from_at timestamptz:=public.quiz_period_start(selected_period); result jsonb;
begin
 if p is null or not public.quiz_verified_user() then raise exception 'authentication_required';end if;
 select coalesce(jsonb_agg(public.quiz_duel_summary(d,p)||jsonb_build_object('finishedAt',floor(extract(epoch from d.finished_at)*1000)::bigint) order by d.finished_at desc,d.id),'[]'::jsonb) into result from (
  select effective.* from public.quiz_duels stored cross join lateral quiz_game_internal.duel_effective(stored) effective
  where (stored.creator=p or stored.opponent=p) and (stored.status in ('completed','forfeit','cancelled') or stored.due_at<=clock_timestamp())
  and effective.status in ('completed','forfeit','cancelled') and effective.finished_at>=from_at and effective.finished_at<=now()
  order by effective.finished_at desc,effective.id limit 50 offset greatest(0,coalesce(page_offset,0))
 ) d;
 return result;
end$$;
alter table public.quiz_duels add column revision bigint not null default 0;
create function quiz_game_internal.duel_changed() returns trigger language plpgsql set search_path='' as $$begin new.revision:=old.revision+1;return new;end$$;
create trigger duel_changed before update on public.quiz_duels for each row execute function quiz_game_internal.duel_changed();
create function quiz_game_internal.duel_answer_changed() returns trigger language plpgsql set search_path='' as $$begin update public.quiz_duels set revision=revision+1 where id=new.duel_id;return new;end$$;
create trigger duel_answer_changed after insert or update on public.quiz_duel_answers for each row execute function quiz_game_internal.duel_answer_changed();
create index duel_creator_archive on public.quiz_duels(creator,created_at desc,id desc);
create index duel_opponent_archive on public.quiz_duels(opponent,created_at desc,id desc);
create function public.quiz_duel_overview(request_text text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare p uuid:=public.quiz_duel_lock(); req jsonb:=request_text::jsonb; ids uuid[]; rev text; result jsonb; next_cursor text; head bigint;
begin
 if request_text is null or octet_length(request_text)>2048 or coalesce(req->>'scope','') not in ('active','archive') or jsonb_typeof(req) is distinct from 'object' or req-array['scope','cursor','revision']<>'{}' then raise exception 'invalid_duel';end if;
 select revision into head from public.quiz_account_heads where owner_id=p;
 with page as materialized (
 select id,revision,created_at,due_at,status from public.quiz_duels where (creator=p or opponent=p)
 and case when req->>'scope'='active' then status in ('preparing','waiting','active') and due_at>clock_timestamp() else status not in ('preparing','waiting','active') or due_at<=clock_timestamp() end
 and (req->>'cursor' is null or (created_at,id)<(split_part(req->>'cursor','|',1)::timestamptz,split_part(req->>'cursor','|',2)::uuid)) order by created_at desc,id desc limit 21
 ), limited as (select * from page order by created_at desc,id desc limit 20)
 select array_agg(id order by created_at desc,id desc),md5(coalesce(string_agg(id::text||':'||revision||':'||(due_at<=clock_timestamp())::text,',' order by created_at desc,id desc),'')||':'||coalesce(head,0)),
 case when (select count(*) from page)>20 then (array_agg(created_at::text||'|'||id::text order by created_at,id))[1] else null end into ids,rev,next_cursor from limited;
 if rev=req->>'revision' then return jsonb_build_object('revision',rev,'unchanged',true,'nextCursor',next_cursor);end if;
 select coalesce(jsonb_agg(public.quiz_duel_summary(d,p) order by d.created_at desc,d.id desc),'[]') into result from public.quiz_duels d where id=any(ids);
 return jsonb_build_object('revision',rev,'unchanged',false,'items',result,'nextCursor',next_cursor);
end$$;
revoke all on all functions in schema quiz_game_internal from public,anon,authenticated;
revoke all on function public.quiz_duel_overview(text) from public,anon,authenticated;
grant execute on function public.quiz_duel_overview(text) to authenticated;
drop table public.quiz_duel_mutex;
commit;
