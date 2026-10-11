begin;
create table quiz_game_internal.presentations(id text primary key,version text not null,question text not null,context text not null,value jsonb not null);
alter table quiz_game_internal.presentations enable row level security;
revoke all on quiz_game_internal.presentations from public,anon,authenticated;
create function quiz_game_internal.enrich(q jsonb) returns jsonb language sql volatile set search_path='' as $$
 select case when p.value is null then q else q||jsonb_build_object('presentation',p.value)||case when q->'metadata' ? 'question_image_id' and jsonb_array_length(p.value->'portraits')>0 then
  jsonb_build_object('image',jsonb_strip_nulls(jsonb_build_object('src',image->'src','width',image->'width','height',image->'height','crop',image->'crop'))) else '{}'::jsonb end end
 from (select 1) one left join quiz_game_internal.presentations p on p.id=q->>'id' and p.version=q->>'version' and p.question=q->>'question' and p.context=q->>'context'
 left join lateral (select p.value->'portraits'->floor(random()*jsonb_array_length(p.value->'portraits'))::integer image) picture on true
$$;
-- Central year preparation is shared by learning, time games, trial and duels.
do $patch$declare definition text;begin
 select pg_get_functiondef('public.quiz_year_question(jsonb)'::regprocedure) into definition;
 definition:=replace(definition,'public.quiz_year_question','quiz_game_internal.year_question');
 execute definition;
end$patch$;
create or replace function public.quiz_year_question(q jsonb) returns jsonb language sql volatile set search_path='' as $$
 select quiz_game_internal.enrich(quiz_game_internal.year_question(q))
$$;
-- Whitelist exactly what the unanswered question may disclose.
create or replace function quiz_ranked_internal.visible(q jsonb) returns jsonb
language sql immutable set search_path='' as $$
 with displayed as (select coalesce(q->'presentation'->>'questionText',q->>'question') text)
 select jsonb_build_object('id',q->'id','knowledgeId',q->'knowledgeId','version',q->'version',
 'language',q->'language','domain',q->'domain','topic',q->'topic','difficulty',q->'difficulty',
 'question',displayed.text,'answers',(select jsonb_agg(jsonb_build_object('id',a->'id','text',a->'text')) from jsonb_array_elements(q->'answers') a),
 'metadata',jsonb_strip_nulls(jsonb_build_object('subdomain',coalesce(q->'metadata'->>'subdomain',''),
 'person_id',case when q->'metadata' ? 'person_id' then 'actor' end,
 'film_title_de',case when length(q->'metadata'->>'film_title_de')>0 and strpos(displayed.text,q->'metadata'->>'film_title_de')>0 then q->'metadata'->>'film_title_de' end,
 'film_title_original',case when length(q->'metadata'->>'film_title_original')>0 and strpos(displayed.text,q->'metadata'->>'film_title_original')>0 then q->'metadata'->>'film_title_original' end)),
 'tags',case when q->'tags' ? 'Preisträger' then '["Preisträger"]'::jsonb else '[]'::jsonb end,'badgeTags','[]'::jsonb,'demo',false)
 ||case when q ? 'image' then jsonb_build_object('image',q->'image') else '{}'::jsonb end from displayed
$$;
revoke all on all functions in schema quiz_game_internal from public,anon,authenticated;
revoke all on function public.quiz_year_question(jsonb) from public,anon,authenticated;
commit;
