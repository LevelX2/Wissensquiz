-- New duels draw the chronological rank first. Existing catalogs, duels and
-- answer facts remain unchanged. The helper is internal, with no client grants.
create function public.quiz_year_question(q jsonb) returns jsonb
language plpgsql volatile security invoker set search_path='' as $$
declare
  y integer; min_gap integer; max_gap integer; lower_limit integer;
  below integer[]; above integer[]; ranks integer[]; chosen integer;
  answer_item jsonb; result_answers jsonb; values_count integer;
  original_values text[]; letter text; generated boolean;
begin
  generated := coalesce(q->'metadata'->>'fact_kind'='year',false);
  select a into answer_item from jsonb_array_elements(q->'answers') a where a->>'id'=q->>'correctId';
  if answer_item is null or answer_item->>'text' !~ '^\d{4}$' then return q; end if;
  y := (answer_item->>'text')::integer;
  if generated then
    if q->'metadata'->>'film_year' is distinct from answer_item->>'text' then return q; end if;
    lower_limit := 1895;
  else
    if q->'metadata'->>'question_id' is distinct from q->>'id' then return q; end if;
    select array_agg(q->'metadata'->>('answer_'||l) order by l),count(distinct q->'metadata'->>('answer_'||l))
      into original_values,values_count from unnest(array['a','b','c','d']) l;
    if values_count<>4 or exists(select 1 from unnest(original_values) v where v !~ '^\d{4}$' or v::integer not between 1000 and 2026) then return q; end if;
    letter := replace(lower(q->'metadata'->>'correct_answer'),'answer_','');
    if not letter=any(array['a','b','c','d']) then
      select l into letter from unnest(array['a','b','c','d']) l where q->'metadata'->>('answer_'||l)=q->'metadata'->>'correct_answer';
    end if;
    if letter is null or q->>'correctId' is distinct from (q->>'id')||':'||letter
      or answer_item->>'text' is distinct from q->'metadata'->>('answer_'||letter) then return q; end if;
    lower_limit := 1000;
  end if;
  min_gap := case q->>'difficulty' when 'leicht' then 8 else 3 end;
  max_gap := case q->>'difficulty' when 'leicht' then 25 when 'mittel' then 10 else 8 end;
  select coalesce(array_agg(v order by random()),'{}') into below from generate_series(y-max_gap,y-min_gap) v where v>=lower_limit;
  select coalesce(array_agg(v order by random()),'{}') into above from generate_series(y+min_gap,y+max_gap) v where v<=2026;
  select array_agg(r) into ranks from generate_series(0,3) r where cardinality(below)>=r and cardinality(above)>=3-r;
  if ranks is null then return q; end if;
  chosen := ranks[1+floor(random()*cardinality(ranks))::integer];
  result_answers := jsonb_build_array(answer_item);
  for i in 1..3 loop
    y := case when i<=chosen then below[i] else above[i-chosen] end;
    result_answers := result_answers||jsonb_build_array(jsonb_build_object(
      'id',(q->>'id')||':y'||y,'text',y::text,
      'feedback',case when generated then y||' ist hier nicht gesucht. Die erste Veröffentlichung war '||(q->'metadata'->>'film_year')||'.'
        else y||' ist hier nicht gesucht. Das gesuchte Jahr ist '||(answer_item->>'text')||'.' end));
  end loop;
  return jsonb_set(q,'{answers}',result_answers);
end $$;
revoke all on function public.quiz_year_question(jsonb) from public,anon,authenticated;

create or replace function public.quiz_duel_create(display text,invited boolean,request uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare p uuid:=public.quiz_duel_lock(); d public.quiz_duels; pack jsonb:='[]'; block jsonb; taken text[]:='{}';
begin
  if display not in ('question','round') or display is null or request is null or invited is null then raise exception 'invalid_duel'; end if;
  select * into d from public.quiz_duels where creator=p and request_id=request;
  if found then return public.quiz_duel_summary(d,p); end if;
  select * into d from public.quiz_duels where opponent=p and join_request=request;
  if found then return public.quiz_duel_summary(d,p); end if;
  if public.quiz_duel_slots(p)>=5 then raise exception 'duel_limit'; end if;
  if not invited then
    select * into d from public.quiz_duels where status='waiting' and kind='random' and creator<>p and solution_display=display
      and public.quiz_duel_slots(creator)<=5 order by created_at limit 1;
    if found then
      update public.quiz_duels set opponent=p,status='active',turn_owner=p,turn_round=1,due_at=clock_timestamp()+interval '72 hours',join_request=request where id=d.id returning * into d;
      return public.quiz_duel_summary(d,p);
    end if;
  end if;
  if exists(select 1 from public.quiz_duels where creator=p and opponent is null and status in ('preparing','waiting')) then raise exception 'waiting_limit'; end if;
  for r in 1..3 loop
    with goals as (
      select distinct on (knowledge_id) * from public.quiz_duel_catalog where enabled and difficulty in ('leicht','mittel','schwer') and not knowledge_id=any(taken)
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
  insert into public.quiz_duels(creator,kind,solution_display,questions,turn_owner,request_id)
    values(p,case when invited then 'invite' else 'random' end,display,pack,p,request) returning * into d;
  return public.quiz_duel_summary(d,p);
end $$;
