-- New duels draw the chronological rank first. Existing catalogs, duels and
-- answer facts remain unchanged. The helper is internal, with no client grants.
create or replace function public.quiz_year_question(q jsonb) returns jsonb
language plpgsql volatile security invoker set search_path='' as $$
declare
  y integer; min_gap integer; max_gap integer; lower_limit integer;
  below integer[]; above integer[]; ranks integer[]; chosen integer;
  answer_item jsonb; result_answers jsonb; values_count integer;
  original_values text[]; wrong_ids text[]; letter text; generated boolean;
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
  select array_agg(a->>'id' order by n) into wrong_ids from jsonb_array_elements(q->'answers') with ordinality v(a,n) where a->>'id'<>q->>'correctId';
  result_answers := jsonb_build_array(answer_item);
  for i in 1..3 loop
    y := case when i<=chosen then below[i] else above[i-chosen] end;
    result_answers := result_answers||jsonb_build_array(jsonb_build_object(
      'id',case when generated then (q->>'id')||':y'||y else wrong_ids[i] end,'text',y::text,
      'feedback',case when generated then y||' ist hier nicht gesucht. Die erste Veröffentlichung war '||(q->'metadata'->>'film_year')||'.'
        else y||' ist hier nicht gesucht. Das gesuchte Jahr ist '||(answer_item->>'text')||'.' end));
  end loop;
  return jsonb_set(q,'{answers}',result_answers);
end $$;
revoke all on function public.quiz_year_question(jsonb) from public,anon,authenticated;
