begin;
-- Reuse current career projections. No answer replay, copied player data or
-- changes to the independent competition totals and their scoring rules.
create function quiz_sync_internal.career_players(page_offset integer)
returns table(player_name text,completed bigint,answered bigint,correct bigint,accuracy numeric,place bigint,is_mine boolean,experience bigint)
language sql stable security definer set search_path='' set jit=off as $$
  with totals as (
    select u.id as owner_id,coalesce(nullif(left(btrim(u.raw_user_meta_data->>'display_name'),40),''),'Spieler') as name,
      coalesce(t.completed,0) as rounds,coalesce(t.answered,0) as answers,coalesce(t.correct,0) as hits,
      coalesce(t.experience,0) as xp
    from auth.users u
    left join public.quiz_player_totals t on t.owner_id=u.id and t.genre='' and t.difficulty=''
    where u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
  ), ranked as (
    select t.*,rank() over(order by xp desc) as position from totals t
  ) select name,rounds,answers,hits,case when answers>0 then round(100.0*hits/answers,1) else null end,
      position,coalesce(owner_id=auth.uid() and public.quiz_verified_user(),false),xp
    from ranked order by position,name,owner_id limit 50 offset greatest(0,coalesce(page_offset,0));
$$;
revoke all on function quiz_sync_internal.career_players(integer) from public,anon,authenticated;

create or replace function public.quiz_players(sort_by text default 'rounds',selected_genre text default '',selected_difficulty text default '',page_offset integer default 0)
returns table(player_name text,completed bigint,answered bigint,correct bigint,accuracy numeric,place bigint,is_mine boolean,experience bigint)
language plpgsql stable security definer set search_path='' as $$begin
  if auth.uid() is null or not public.quiz_verified_user() then raise exception 'authentication_required'; end if;
  if sort_by is null or sort_by not in ('rounds','correct','accuracy','experience','career_experience') then raise exception 'invalid_sort'; end if;
  if sort_by='career_experience' then
    return query select * from quiz_sync_internal.career_players(page_offset);
    return;
  end if;
  if sort_by='experience' then selected_genre:=''; selected_difficulty:=''; end if;
  return query select * from quiz_sync_internal.players(sort_by,selected_genre,selected_difficulty,page_offset);
end$$;
create or replace function public.quiz_public_players(sort_by text default 'experience',page_offset integer default 0)
returns table(player_name text,completed bigint,answered bigint,correct bigint,accuracy numeric,place bigint,is_mine boolean,experience bigint)
language plpgsql stable security definer set search_path='' as $$begin
  if sort_by is null or sort_by not in ('rounds','correct','accuracy','experience','career_experience') then raise exception 'invalid_sort'; end if;
  if sort_by='career_experience' then
    return query select * from quiz_sync_internal.career_players(page_offset);
    return;
  end if;
  return query select * from quiz_sync_internal.players(sort_by,'','',page_offset);
end$$;
revoke all on function public.quiz_players(text,text,text,integer) from public,anon;
grant execute on function public.quiz_players(text,text,text,integer) to authenticated;
revoke all on function public.quiz_public_players(text,integer) from public;
grant execute on function public.quiz_public_players(text,integer) to anon,authenticated;
notify pgrst,'reload schema';
commit;
