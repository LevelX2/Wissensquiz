begin;
alter table public.quiz_duels add column selection text not null default 'all'
  check(selection in ('all','actors','awards','Science-Fiction','Action','Horror','Fantasy','Komödie','Western','Drama','Abenteuer','Musik','Thriller','Martial Arts & Asia-Film','Rom-Com'));
create index duel_topic_waiting on public.quiz_duels(selection,solution_display,created_at) where status='waiting' and kind='random';

-- The current public operator catalog also supplies actor-only duels.
select pg_advisory_xact_lock(hashtextextended('quiz_current_content',0));
insert into public.quiz_duel_catalog(id,knowledge_id,difficulty,genre,familiarity,question,enabled)
select c.id,c.knowledge_id,c.difficulty,c.genre,coalesce(f.level,0),c.question,true
from quiz_ranked_internal.catalog c left join quiz_game_internal.familiarity f
  on f.film=(c.question->'metadata'->>'film_title_original')||'|'||(c.question->'metadata'->>'film_year')
where c.source='actors' and c.difficulty in ('leicht','mittel','schwer') and c.question->>'demo'='false'
on conflict(id) do nothing;

do $topic$
declare definition text; updated text;
begin
  definition:=pg_get_functiondef('quiz_game_internal.activate_content(text,integer,jsonb)'::regprocedure);
  updated:=replace(definition,'where c.source<>''actors'' and c.difficulty','where c.difficulty');
  if updated=definition then raise exception 'duel_actor_catalog_contract_missing'; end if;
  execute updated;

  definition:=pg_get_functiondef('public.quiz_duel_summary(public.quiz_duels,uuid)'::regprocedure);
  updated:=replace(definition,'''status'',d.status','''selection'',d.selection,''status'',d.status');
  if updated=definition then raise exception 'duel_summary_topic_contract_missing'; end if;
  execute updated;

end $topic$;

drop function public.quiz_duel_create(text,boolean,uuid);
create or replace function public.quiz_duel_create(display text,invited boolean,request uuid, selected_topic text default 'all') returns jsonb language plpgsql security definer set search_path='' as $$
declare p uuid:=public.quiz_duel_lock(); d public.quiz_duels; pack jsonb:='[]'; block jsonb; taken text[]:='{}';
begin
  perform pg_advisory_xact_lock(hashtextextended(p::text,20261011));
  if display not in ('question','round') or display is null or request is null or invited is null then raise exception 'invalid_duel'; end if;
  select * into d from public.quiz_duels where creator=p and request_id=request;
  if found then return public.quiz_duel_summary(d,p); end if;
  select * into d from public.quiz_duels where opponent=p and join_request=request;
  if found then return public.quiz_duel_summary(d,p); end if;
  if selected_topic is null or selected_topic not in ('all','actors','awards','Science-Fiction','Action','Horror','Fantasy','Komödie','Western','Drama','Abenteuer','Musik','Thriller','Martial Arts & Asia-Film','Rom-Com') then raise exception 'invalid_duel_topic'; end if;
  if public.quiz_duel_slots(p)>=10 then raise exception 'duel_limit'; end if;
  if not invited then
    select * into d from public.quiz_duels where status='waiting' and kind='random' and creator<>p and solution_display=display and selection=selected_topic
      and due_at>clock_timestamp() order by created_at limit 1 for update skip locked;
    if found then
      update public.quiz_duels set opponent=p,status='active',turn_owner=p,turn_round=1,due_at=clock_timestamp()+interval '72 hours',join_request=request where id=d.id returning * into d;
      return public.quiz_duel_summary(d,p);
    end if;
  end if;
  for r in 1..3 loop
    with goals as (
      select distinct on (knowledge_id) * from public.quiz_duel_catalog where enabled and (selected_topic='all'
      or selected_topic='actors' and coalesce(question->'metadata'->>'person_id','')<>''
      or selected_topic='awards' and coalesce(question->'metadata'->>'person_id','')='' and question->'tags' ? 'Preisträger'
      or selected_topic not in ('all','actors','awards') and genre=selected_topic and coalesce(question->'metadata'->>'person_id','')='' and not(question->'tags' ? 'Preisträger')) and difficulty in ('leicht','mittel','schwer') and not knowledge_id=any(taken)
        order by knowledge_id,random()
    ), spread as (
      select *,row_number() over(partition by difficulty,genre order by -ln(greatest(random(),0.0001))/case when familiarity in(1,2) then 3 else 1 end) as genre_rank from goals
    ), picked as (
      select *,row_number() over(partition by difficulty order by genre_rank,random()) as difficulty_rank from spread
    ), prepared as materialized (
      select public.quiz_year_question(question) as question from picked where difficulty_rank<=case when difficulty='mittel' then 4 else 3 end
    ) select coalesce(jsonb_agg(jsonb_build_object('question',question,'order',(select jsonb_agg(a->>'id' order by random()) from jsonb_array_elements(question->'answers') a)) order by random()),'[]') into block
      from prepared;
    if jsonb_array_length(block)<>10 then raise exception 'duel_catalog_missing'; end if;
    select taken||array_agg(q->'question'->>'knowledgeId') into taken from jsonb_array_elements(block) q;
    pack:=pack||block;
  end loop;
  insert into public.quiz_duels(creator,kind,solution_display,questions,turn_owner,request_id,selection)
    values(p,case when invited then 'invite' else 'random' end,display,pack,p,request,selected_topic) returning * into d;
  return public.quiz_duel_summary(d,p);
end $$;

revoke all on function public.quiz_duel_create(text,boolean,uuid,text) from public,anon;
grant execute on function public.quiz_duel_create(text,boolean,uuid,text) to authenticated;
commit;
