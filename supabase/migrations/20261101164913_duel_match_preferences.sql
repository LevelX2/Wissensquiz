begin;
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
-- The allowed topics are consent to join immediately. No eligible offer
-- means no match, without silently creating a new challenge.
create function public.quiz_duel_find(allowed_topics text[],request uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p uuid:=public.quiz_duel_lock(); d public.quiz_duels;
begin
  if allowed_topics is null or cardinality(allowed_topics) not between 1 and 15 or request is null
    or exists(select 1 from unnest(allowed_topics) t where t is null or t not in ('all','actors','awards','Science-Fiction','Action','Horror','Fantasy','Komödie','Western','Drama','Abenteuer','Musik','Thriller','Martial Arts & Asia-Film','Rom-Com')) then
    raise exception 'invalid_duel_topic';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p::text,20261011));
  select * into d from public.quiz_duels where opponent=p and join_request=request;
  if found then return public.quiz_duel_summary(d,p); end if;
  if public.quiz_duel_slots(p)>=10 then raise exception 'duel_limit'; end if;
  select * into d from public.quiz_duels where status='waiting' and kind='random' and creator<>p
    and solution_display='question' and selection=any(allowed_topics) and due_at>clock_timestamp()
    order by created_at,id limit 1 for update skip locked;
  if not found then return null; end if;
  update public.quiz_duels set opponent=p,status='active',turn_owner=p,turn_round=1,
    due_at=clock_timestamp()+interval '72 hours',join_request=request where id=d.id returning * into d;
  return public.quiz_duel_summary(d,p);
end $$;
revoke all on function public.quiz_duel_find(text[],uuid) from public,anon;
grant execute on function public.quiz_duel_find(text[],uuid) to authenticated;
commit;
