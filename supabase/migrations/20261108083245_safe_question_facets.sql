-- Public taxonomy is prepared with the same answer-safety guard as the UI.
begin;
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
 ||case when q->'presentation' ? 'facets' then jsonb_build_object('facets',q->'presentation'->'facets') else '{}'::jsonb end
 ||case when q ? 'image' then jsonb_build_object('image',q->'image') else '{}'::jsonb end from displayed
$$;
revoke all on function quiz_ranked_internal.visible(jsonb) from public,anon,authenticated;
commit;
