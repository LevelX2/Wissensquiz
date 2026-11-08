begin;

-- A run keeps its result; the player's badge shows the current profile career.
create or replace function public.quiz_own_record_runs(selected_category text,selected_period text default 'all',page_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare p uuid:=quiz_sync_internal.require_owner(auth.uid());
  from_at timestamptz:=public.quiz_period_start(selected_period);
  career_xp bigint; result jsonb;
begin
  career_xp:=coalesce((select t.experience from public.quiz_player_totals t
    where t.owner_id=p and t.genre='' and t.difficulty=''),0);
  with ranked as (
    select s.*,rank() over(order by s.points desc) place
    from quiz_ranked_internal.scores s
    where s.owner_id=p and s.category=selected_category
      and s.finished_at>=extract(epoch from from_at)*1000
      and s.finished_at<extract(epoch from now()+interval '5 minutes')*1000
      and (selected_period='all' or s.finished_at<extract(epoch from
        (date_trunc(selected_period,now() at time zone 'Europe/Berlin')+
          case selected_period when 'week' then interval '1 week' when 'month' then interval '1 month' else interval '1 year' end) at time zone 'Europe/Berlin')*1000)
  ), page as (
    select * from ranked order by place,finished_at,round_id
    limit 50 offset greatest(0,coalesce(page_offset,0))
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'round_id',round_id,'player_name',player_name,'points',points,'correct',correct,
    'answers',question_count,'elapsed_ms',elapsed_ms,'finished_at',finished_at,
    'place',place,'is_mine',true,'experience',career_xp)
    order by place,finished_at,round_id),'[]') into result from page;
  return result;
end$$;

create or replace function public.quiz_record_runs(selected_category text,selected_period text default 'all',page_offset integer default 0)
returns table(player_name text,points integer,correct integer,answers integer,elapsed_ms bigint,finished_at double precision,place bigint,is_mine boolean,experience bigint)
language plpgsql stable security definer set search_path='' as $$
declare from_at timestamptz:=public.quiz_period_start(selected_period);
begin
  return query with ranked as (
    select s.*,rank() over(order by s.points desc) as position
    from quiz_ranked_internal.scores s join auth.users u on u.id=s.owner_id
    where s.category=selected_category and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
      and s.finished_at>=extract(epoch from from_at)*1000
      and s.finished_at<extract(epoch from now()+interval '5 minutes')*1000
      and (selected_period='all' or s.finished_at<extract(epoch from
        (date_trunc(selected_period,now() at time zone 'Europe/Berlin')+
          case selected_period when 'week' then interval '1 week' when 'month' then interval '1 month' else interval '1 year' end) at time zone 'Europe/Berlin')*1000)
  )
  select s.player_name,s.points,s.correct,s.question_count,s.elapsed_ms,s.finished_at,s.position,
    coalesce(s.owner_id=auth.uid() and public.quiz_verified_user(),false),coalesce(t.experience,0)
    from ranked s left join public.quiz_player_totals t on t.owner_id=s.owner_id and t.genre='' and t.difficulty=''
    order by s.position,s.finished_at,s.owner_id,s.round_id limit 50 offset greatest(0,coalesce(page_offset,0));
end$$;

revoke all on function public.quiz_own_record_runs(text,text,integer),public.quiz_record_runs(text,text,integer) from public,anon,authenticated;
grant execute on function public.quiz_own_record_runs(text,text,integer) to authenticated;
grant execute on function public.quiz_record_runs(text,text,integer) to anon,authenticated;
notify pgrst,'reload schema';
commit;
