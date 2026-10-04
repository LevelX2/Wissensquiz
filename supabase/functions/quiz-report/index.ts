import { createReportHandler, type Reservation } from "./handler.ts";
import { uuidPattern, type IssueReceipt } from "./contracts.ts";

const url = Deno.env.get("SUPABASE_URL")!;
const key: string = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!)[
  "default"
];
async function rpc(name: string, body: unknown) {
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (["rate_limited", "report_changed"].includes(data.message))
      throw new Error(data.message);
    throw new Error("database_unavailable");
  }
  return response.json();
}
Deno.serve(
  createReportHandler({
    githubToken: Deno.env.get("GITHUB_REPORT_TOKEN") ?? "",
    allowedOrigins: [
      "https://wissensquiz-filmkosmos.levelx2.chatgpt.site",
      "http://localhost:5173",
      "http://localhost:4173",
    ],
    fetch,
    authenticate: async (token) => {
      if (!key) throw new Error("server_key_missing");
      const response = await fetch(`${url}/auth/v1/user`, {
        headers: { apikey: key, Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5_000),
      });
      if (response.status === 401 || response.status === 403) return null;
      if (!response.ok) throw new Error("auth_unavailable");
      const user = await response.json();
      return typeof user.id === "string" &&
        uuidPattern.test(user.id) &&
        user.email_confirmed_at &&
        user.is_anonymous === false
        ? user.id
        : null;
    },
    reserve: (owner, id, hash) =>
      rpc("quiz_issue_begin", {
        expected_owner: owner,
        submission_id: id,
        content_hash: hash,
      }) as Promise<Reservation>,
    settle: async (owner, id, status, issue?: IssueReceipt) => {
      await rpc("quiz_issue_finish", {
        expected_owner: owner,
        submission_id: id,
        outcome: status,
        issue_number: issue?.number ?? null,
        issue_url: issue?.url ?? null,
      });
    },
  }),
);
