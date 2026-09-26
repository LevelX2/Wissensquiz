import fs from "node:fs";
import Papa from "papaparse";
const result = Papa.parse(fs.readFileSync("public/fragen.csv", "utf8"), {
  header: true,
  skipEmptyLines: "greedy",
});
const values = (key) => [...new Set(result.data.map((r) => r[key]))];
console.log(
  JSON.stringify(
    {
      records: result.data.length,
      errors: result.errors,
      columns: result.meta.fields,
      distinct: Object.fromEntries(
        [
          "domain",
          "subdomain",
          "franchise",
          "difficulty",
          "question_type",
          "verification_status",
        ].map((k) => [k, values(k)]),
      ),
      knowledgeGoals: values("knowledge_id").length,
      variants: result.data.filter((r) => r.variant_of).length,
      missing: Object.fromEntries(
        result.meta.fields.map((k) => [
          k,
          result.data.filter((r) => !r[k]).length,
        ]),
      ),
      duplicateQuestionIds: result.data.length - values("question_id").length,
      themes: values("film_title_de"),
    },
    null,
    2,
  ),
);
