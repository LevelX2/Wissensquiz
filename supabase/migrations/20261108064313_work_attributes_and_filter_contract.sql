-- Current work relations and uniform filters; account events and learning IDs
-- are not rewritten. Activation is reserved for an approved publication.
begin;
select pg_advisory_xact_lock(hashtextextended('quiz_current_content',0));

create function quiz_game_internal.work_references(q jsonb) returns jsonb
language sql immutable set search_path='' as $$
 select case when q ? 'works' then q->'works' else coalesce((
  select jsonb_agg(jsonb_build_object('type','film','originalTitle',title,'year',year_text::integer,
   'genres',case when ref=primary_ref and genre not in ('Film','Personen','Schauspieler','Preisträger','')
    then jsonb_build_array(case genre when 'Sci-Fi' then 'Science-Fiction' when 'RomCom' then 'Rom-Com' else genre end) else '[]'::jsonb end,
   'techniques','[]'::jsonb,'collections',case when ref=primary_ref then
    (select coalesce(jsonb_agg(c),'[]'::jsonb) from unnest(array['Classics','Arthouse']) c where q->'tags' ? c)
    else '[]'::jsonb end) order by ordinal)
  from (
   select distinct on(ref) ref,ordinal,primary_ref,genre,
    regexp_replace(ref,'\|[^|]*$','') title,substring(ref from '\|([^|]*)$') year_text
   from (
    select reference ref,ordinal,
     (q->'metadata'->>'film_title_original')||'|'||(q->'metadata'->>'film_year') primary_ref,
     coalesce(nullif(q->'metadata'->>'subdomain',''),q->>'domain','') genre
    from unnest(array_prepend(
     case when coalesce(q->'metadata'->>'film_title_original','')<>'' then
      (q->'metadata'->>'film_title_original')||'|'||(q->'metadata'->>'film_year') end,
     string_to_array(coalesce(q->'metadata'->>'film_refs',''),';'))) with ordinality r(reference,ordinal)
   ) refs where ref is not null and ref<>'' order by ref,ordinal
  ) parsed where title<>'' and year_text~'^[1-9][0-9]{3}$'
 ),'[]'::jsonb) end
$$;

alter table quiz_game_internal.catalog_meta add column works jsonb not null default '[]'::jsonb;

create or replace function quiz_game_internal.refresh_content() returns jsonb
language plpgsql set search_path='' as $$
declare release text; info jsonb;
begin
 select release_hash into release from quiz_ranked_internal.config where id;
 if release is null then raise exception 'game_content_missing'; end if;
 delete from quiz_game_internal.catalog_meta;
 insert into quiz_game_internal.catalog_meta(id,knowledge_id,topic,genre,source,difficulty,familiarity,tags,works)
 select c.id,c.knowledge_id,c.question->>'topic',c.genre,c.source,c.difficulty,
  coalesce((p.value->>'familiarity')::integer,0),c.question->'tags',quiz_game_internal.work_references(c.question)
 from quiz_ranked_internal.catalog c left join quiz_game_internal.presentations p on p.id=c.id
 where c.release_hash=release;
 select jsonb_build_object('hash',release,'questions',count(*),'goals',count(distinct knowledge_id),
  'genres',(select coalesce(jsonb_agg(value order by value),'[]'::jsonb) from (
   select distinct g.value from quiz_game_internal.catalog_meta m
   cross join lateral jsonb_array_elements(m.works) w
   cross join lateral jsonb_array_elements_text(w->'genres') g where m.source='film') genres),
  'workTypes',(select coalesce(jsonb_agg(value order by value),'[]'::jsonb) from (
   select distinct w->>'type' value from quiz_game_internal.catalog_meta m
   cross join lateral jsonb_array_elements(m.works) w) types),
  'techniques',(select coalesce(jsonb_agg(value order by value),'[]'::jsonb) from (
   select distinct t.value from quiz_game_internal.catalog_meta m
   cross join lateral jsonb_array_elements(m.works) w
   cross join lateral jsonb_array_elements_text(w->'techniques') t) techniques),
  'areas',count(distinct case source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else genre end))
 into info from quiz_game_internal.catalog_meta;
 insert into quiz_game_internal.content_info values(true,info) on conflict(id) do update set value=excluded.value;
 delete from quiz_game_internal.journey_cache;
 perform quiz_game_internal.refresh_groups();
 analyze quiz_game_internal.catalog_meta;
 return info;
end$$;

create function quiz_game_internal.matches_work(works jsonb,filters jsonb) returns boolean
language sql immutable set search_path='' as $$
 select (coalesce(filters->'genres','null'::jsonb)='null'::jsonb and
   not(filters ? 'workTypes') and not(filters ? 'techniques') and not(filters ? 'collections')) or exists(
  select 1 from jsonb_array_elements(works) w
  where (coalesce(filters->'genres','null'::jsonb)='null'::jsonb or
   exists(select 1 from jsonb_array_elements_text(w->'genres') g where filters->'genres' ? g))
  and (not(filters ? 'workTypes') or filters->'workTypes' ? (w->>'type'))
  and (not(filters ? 'techniques') or
   exists(select 1 from jsonb_array_elements_text(w->'techniques') t where filters->'techniques' ? t))
  and (not(filters ? 'collections') or
   exists(select 1 from jsonb_array_elements_text(coalesce(w->'collections','[]'::jsonb)) c where filters->'collections' ? c))
 )
$$;

create or replace function quiz_game_internal.matches(m quiz_game_internal.catalog_meta,filters jsonb,topic text) returns boolean
language plpgsql immutable set search_path='' as $$
declare prefix text; selected text[]; suffix text; matched boolean;
begin
 if not (filters is null or (filters->'difficulties' ? m.difficulty and
  (not(filters ? 'sources') or filters->'sources' ? m.source) and
  quiz_game_internal.matches_work(m.works,filters) and
  (not(filters ? 'familiarities') or
   (m.familiarity>0 and filters->'familiarities' @> to_jsonb(m.familiarity)) or
   (m.familiarity=0 and filters->'familiarities' @> '[1,2,3,4]'::jsonb)))) then return false; end if;
 if topic is null or topic='Alle Themen' then return true; end if;
 prefix:=split_part(topic,': ',1); selected:=string_to_array(prefix,' + ');
 suffix:=case when position(': ' in topic)>0 then substr(topic,length(prefix)+3) else null end;
 if selected[1]='Filmfragen' and selected<@array['Filmfragen','Classics','Arthouse','Schauspieler','Preisträger'] then
  matched:=case m.source when 'film' then not(selected && array['Classics','Arthouse']) or m.tags ?| selected
   when 'actors' then 'Schauspieler'=any(selected) else 'Preisträger'=any(selected) end;
 elsif selected<@array['Classics','Arthouse','Schauspieler','Preisträger'] then
  matched:=m.tags ?| selected;
 else return topic=m.topic; end if;
 return matched and (suffix is null or m.topic=suffix);
end$$;

revoke all on function quiz_game_internal.work_references(jsonb) from public,anon,authenticated;
revoke all on function quiz_game_internal.matches_work(jsonb,jsonb) from public,anon,authenticated;

-- Refresh the current projection only; private account facts are unchanged.
do $refresh$begin
 if exists(select 1 from quiz_ranked_internal.config where id) then
  perform quiz_game_internal.refresh_content();
 end if;
end$refresh$;
commit;
