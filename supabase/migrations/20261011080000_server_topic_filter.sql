-- Qualify function arguments: unqualified topic resolves to catalog_meta.topic.
begin;
create or replace function quiz_game_internal.pool(player uuid,target uuid,mode text,filters jsonb,topic text,journey jsonb)
returns setof quiz_game_internal.catalog_meta language sql stable set search_path='' as $$
 select m.* from quiz_game_internal.catalog_meta m where quiz_game_internal.matches(m,pool.filters,pool.topic)
 and (mode<>'entdecken' or case when m.source='film' then
 m.familiarity>0 and m.familiarity<=coalesce((journey->m.genre->>'familiarity')::integer,0) and m.difficulty<>'experte'
 and (m.difficulty='leicht' or (journey->m.genre->>case m.difficulty when 'mittel' then 'mediumUnlocked' else 'hardUnlocked' end)::boolean)
 else m.difficulty='leicht' or (journey->case m.source when 'actors' then 'Schauspieler' else 'Preisträger' end->>
 case m.difficulty when 'mittel' then 'mediumUnlocked' when 'schwer' then 'hardUnlocked' else 'expertUnlocked' end)::boolean end)
$$;

commit;
