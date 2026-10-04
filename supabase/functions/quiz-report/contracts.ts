export const reportTypes = {
  bug: {
    name: "Technischer Fehler",
    label: "meldung:technik",
    color: "d73a4a",
  },
  content: { name: "Inhalt falsch", label: "meldung:inhalt", color: "e4e669" },
  wording: { name: "Textverbesserung", label: "meldung:text", color: "0075ca" },
  other: { name: "Sonstiges", label: "meldung:sonstiges", color: "7057ff" },
} as const;
export type ReportType = keyof typeof reportTypes;
export type IssueReport = {
  id: string;
  type: ReportType;
  title: string;
  comment: string;
  appVersion: number;
  question?: { id: string; version: string };
};
export type IssueReceipt = { number: number; url: string };
export const repository = "LevelX2/Wissensquiz";
export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, min: number, max: number) =>
  typeof v === "string" &&
  v.trim().length >= min &&
  v.length <= max &&
  !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v);
export function parseReport(value: unknown): IssueReport {
  if (
    !record(value) ||
    Object.keys(value).some(
      (key) =>
        !["id", "type", "title", "comment", "appVersion", "question"].includes(
          key,
        ),
    ) ||
    typeof value.id !== "string" ||
    !uuidPattern.test(value.id) ||
    typeof value.type !== "string" ||
    !Object.hasOwn(reportTypes, value.type) ||
    !text(value.title, 3, 120) ||
    /[\r\n]/.test(value.title as string) ||
    !text(value.comment, 10, 4000) ||
    typeof value.appVersion !== "number" ||
    !Number.isSafeInteger(value.appVersion) ||
    value.appVersion < 0
  )
    throw new Error("invalid_report");
  const q = value.question;
  if (
    q !== undefined &&
    (!record(q) ||
      Object.keys(q).some((key) => !["id", "version"].includes(key)) ||
      !text(q.id, 1, 200) ||
      !text(q.version, 1, 200) ||
      /[\r\n]/.test(`${q.id}${q.version}`))
  )
    throw new Error("invalid_report");
  return {
    id: value.id.toLowerCase(),
    type: value.type as ReportType,
    title: (value.title as string).trim(),
    comment: (value.comment as string).trim(),
    appVersion: value.appVersion,
    ...(q === undefined
      ? {}
      : {
          question: {
            id: (q as Record<string, string>).id,
            version: (q as Record<string, string>).version,
          },
        }),
  };
}
export function parseReceipt(value: unknown): IssueReceipt {
  if (
    !record(value) ||
    typeof value.number !== "number" ||
    !Number.isSafeInteger(value.number) ||
    value.number < 1 ||
    value.url !== `https://github.com/${repository}/issues/${value.number}`
  )
    throw new Error("invalid_receipt");
  return { number: value.number, url: value.url as string };
}
export const reportMarker = (id: string) => `<!-- wissensquiz-report:${id} -->`;
// Render all user text as quoted plain text, avoiding HTML and GitHub mentions.
const quoted = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("@", "@\u200b")
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
export function issueContent(report: IssueReport) {
  return {
    title: `[${reportTypes[report.type].name}] ${report.title.replaceAll("@", "@\u200b")}`,
    labels: [reportTypes[report.type].label],
    body: `## Meldung aus dem Wissensquiz\n\n${quoted(report.comment)}\n\n## Kontext\n\nTyp: ${reportTypes[report.type].name}\n\nApp-Version: ${report.appVersion || "Lokale Entwicklung"}${report.question ? `\n\nFragen-ID:\n${quoted(report.question.id)}\n\nInhaltsversion:\n${quoted(report.question.version)}` : "\n\nAllgemeine Meldung ohne Fragenbezug."}\n\n${reportMarker(report.id)}`,
  };
}
