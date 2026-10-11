// Operator-only public metadata. Never contains account records or credentials.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
const curriculum = JSON.parse(
  readFileSync("src/journeyCurriculum.json", "utf8"),
).genres;
const familiarity = JSON.parse(
  readFileSync("src/filmFamiliarity.json", "utf8"),
).films;
const literal = (value) =>
  "'" + JSON.stringify(value).replaceAll("'", "''") + "'::jsonb";
const sql = `begin;
delete from quiz_game_internal.curriculum;
insert into quiz_game_internal.curriculum select key,value from jsonb_each(${literal(curriculum)});
delete from quiz_game_internal.familiarity;
insert into quiz_game_internal.familiarity select value->>'film',(value->>'level')::integer from jsonb_array_elements(${literal(familiarity)});
select quiz_game_internal.refresh_content();
commit;\n`;
mkdirSync("tmp-sync-catalog", { recursive: true });
writeFileSync("tmp-sync-catalog/game-content.sql", sql);
console.log("Öffentliche Server-Metadaten vorbereitet.");
