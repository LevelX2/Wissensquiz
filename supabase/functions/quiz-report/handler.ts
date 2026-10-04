import {
  issueContent,
  parseReceipt,
  parseReport,
  reportMarker,
  reportTypes,
  repository,
  type IssueReceipt,
} from "./contracts.ts";

export type Reservation = {
  action: "send" | "reconcile" | "pending" | "sent";
  createdAt: string;
  number?: number;
  url?: string;
};
export type ReportPorts = {
  authenticate: (token: string) => Promise<string | null>;
  reserve: (owner: string, id: string, hash: string) => Promise<Reservation>;
  settle: (
    owner: string,
    id: string,
    status: "sent" | "failed" | "uncertain",
    issue?: IssueReceipt,
  ) => Promise<void>;
  fetch: typeof fetch;
  githubToken: string;
  allowedOrigins: string[];
};
export function createReportHandler(ports: ReportPorts) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("origin");
    const allowed = !origin || ports.allowedOrigins.includes(origin);
    const headers = {
      ...(origin && allowed ? { "Access-Control-Allow-Origin": origin } : {}),
      "Access-Control-Allow-Headers":
        "authorization, apikey, content-type, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      Vary: "Origin",
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    };
    const response = (status: number, value: unknown) =>
      new Response(JSON.stringify(value), { status, headers });
    if (!allowed) return response(403, { code: "origin_denied" });
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    if (request.method !== "POST")
      return response(405, { code: "method_not_allowed" });
    const token = request.headers
      .get("authorization")
      ?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) return response(401, { code: "verified_account_required" });
    let owner: string | null;
    try {
      owner = await ports.authenticate(token);
    } catch {
      return response(503, { code: "service_unavailable" });
    }
    if (!owner) return response(401, { code: "verified_account_required" });
    if (!ports.githubToken)
      return response(503, { code: "reporting_not_configured" });
    let report;
    try {
      if (!request.headers.get("content-type")?.startsWith("application/json"))
        throw new Error();
      // Bound streamed bodies as well as requests with a Content-Length header.
      const reader = request.body?.getReader();
      if (!reader) throw new Error();
      let bytes = 0;
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.length;
        if (bytes > 24_000) {
          await reader.cancel();
          throw new Error();
        }
        chunks.push(value);
      }
      const body = new Uint8Array(bytes);
      let at = 0;
      for (const chunk of chunks) {
        body.set(chunk, at);
        at += chunk.length;
      }
      report = parseReport(
        JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body)),
      );
    } catch {
      return response(400, { code: "invalid_report" });
    }
    const { id, ...content } = report;
    const hash = Array.from(
      new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(JSON.stringify(content)),
        ),
      ),
    )
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("");
    let reservation: Reservation;
    try {
      reservation = await ports.reserve(owner, id, hash);
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      if (message === "rate_limited")
        return response(429, { code: "rate_limited" });
      if (message === "report_changed")
        return response(409, { code: "report_changed" });
      return response(503, { code: "service_unavailable" });
    }
    if (reservation.action === "sent") {
      try {
        return response(200, parseReceipt(reservation));
      } catch {
        return response(503, { code: "service_unavailable" });
      }
    }
    if (reservation.action === "pending")
      return response(409, { code: "report_pending" });
    const settle = async (
      status: "sent" | "failed" | "uncertain",
      issue?: IssueReceipt,
    ) => {
      try {
        await ports.settle(owner!, id, status, issue);
      } catch {
        /* Retain reservation; reconciliation recovers confirmed GitHub creation. */
      }
    };
    const github = (path: string, init: RequestInit = {}) =>
      ports.fetch(`https://api.github.com/repos/${repository}/${path}`, {
        ...init,
        signal: AbortSignal.timeout(15_000),
        redirect: "error",
        headers: {
          Authorization: `Bearer ${ports.githubToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2026-03-10",
          "Content-Type": "application/json",
          ...init.headers,
        },
      });
    if (reservation.action === "reconcile") {
      try {
        for (let page = 1; page <= 5; page++) {
          const result = await github(
            `issues?state=all&since=${encodeURIComponent(reservation.createdAt)}&per_page=100&page=${page}`,
          );
          if (!result.ok) break;
          const issues = await result.json();
          if (!Array.isArray(issues)) break;
          const found = issues.find(
            (issue) =>
              !issue.pull_request &&
              typeof issue.body === "string" &&
              issue.body.includes(reportMarker(id)),
          );
          if (found) {
            const receipt = parseReceipt({
              number: found.number,
              url: found.html_url,
            });
            await settle("sent", receipt);
            return response(200, receipt);
          }
          if (issues.length < 100) break;
        }
      } catch {
        /* An uncertain create is never repeated automatically. */
      }
      await settle("uncertain");
      return response(409, { code: "report_uncertain" });
    }
    // Ensure labels exist before creating an issue. Setup failures cannot have
    // created an issue, so they remain safely retryable with the same ID.
    try {
      const label = reportTypes[report.type];
      let result = await github(`labels/${encodeURIComponent(label.label)}`);
      if (result.status === 404) {
        result = await github("labels", {
          method: "POST",
          body: JSON.stringify({
            name: label.label,
            color: label.color,
            description: `Wissensquiz: ${label.name}`,
          }),
        });
        if (result.status === 422)
          result = await github(`labels/${encodeURIComponent(label.label)}`);
      }
      if (!result.ok) throw new Error();
    } catch {
      await settle("failed");
      return response(503, { code: "github_unavailable" });
    }
    try {
      const result = await github("issues", {
        method: "POST",
        body: JSON.stringify(issueContent(report)),
      });
      if (!result.ok) {
        await settle(
          result.status >= 500 || result.status === 408
            ? "uncertain"
            : "failed",
        );
        return response(503, { code: "github_unavailable" });
      }
      const issue = await result.json();
      const receipt = parseReceipt({
        number: issue.number,
        url: issue.html_url,
      });
      await settle("sent", receipt);
      return response(200, receipt);
    } catch {
      await settle("uncertain");
      return response(409, { code: "report_uncertain" });
    }
  };
}
