import { describe, expect, it, vi } from "vitest";
import {
  createReportHandler,
  type ReportPorts,
} from "../supabase/functions/quiz-report/handler";
import {
  issueContent,
  parseReport,
  reportTypes,
} from "../supabase/functions/quiz-report/contracts";
import { sendIssueReport } from "../src/issueReports";
import type { SupabaseClient } from "@supabase/supabase-js";
const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const payload = {
  id,
  type: "wording",
  title: "Formulierung genauer machen",
  comment: "Die Beschreibung ist hier missverständlich.",
  appVersion: 54,
  question: { id: "TEST-Q", version: "csv-example" },
};
const receipt = {
  number: 42,
  url: "https://github.com/LevelX2/Wissensquiz/issues/42",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
function setup(overrides: Partial<ReportPorts> = {}) {
  const ports: ReportPorts = {
    authenticate: vi.fn(async () => "11111111-1111-4111-8111-111111111111"),
    reserve: vi.fn(async () => ({
      action: "send" as const,
      createdAt: "2026-10-04T12:00:00Z",
    })),
    settle: vi.fn(async () => {}),
    fetch: vi.fn(async (url) =>
      String(url).includes("/labels/")
        ? json({ name: "meldung:text" })
        : json({ number: 42, html_url: receipt.url }, 201),
    ),
    githubToken: "test-only-secret",
    allowedOrigins: ["https://quiz.example"],
    ...overrides,
  };
  const handler = createReportHandler(ports);
  const call = (
    body: unknown = payload,
    headers: Record<string, string> = {},
  ) =>
    handler(
      new Request("https://example/quiz-report", {
        method: "POST",
        headers: {
          Origin: "https://quiz.example",
          Authorization: "Bearer test-user",
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(body),
      }),
    );
  return { ports, handler, call };
}
describe("GitHub-Fragenmeldungen", () => {
  it("sendet die erlaubten Felder und das passende Label erst nach Konto- und Inhaltprüfung", async () => {
    const { ports, call } = setup();
    const response = await call();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(receipt);
    const calls = vi.mocked(ports.fetch).mock.calls;
    const issue = JSON.parse(calls[1][1]!.body as string);
    expect(issue.labels).toEqual(["meldung:text"]);
    expect(issue.body).toContain("TEST-Q");
    expect(issue.body).toContain("csv-example");
    expect(issue.body).not.toContain("11111111");
    expect(issue.body).not.toContain("test-only-secret");
    expect(ports.settle).toHaveBeenCalledWith(
      expect.any(String),
      id,
      "sent",
      receipt,
    );
    expect(ports.reserve).toHaveBeenCalledWith(
      expect.any(String),
      id,
      expect.stringMatching(/^[a-f0-9]{64}$/),
    );
  });
  it("weist zusätzliche private Felder, unbekannte Typen und zu große Beschreibungen zurück", async () => {
    const { ports, call } = setup();
    for (const invalid of [
      { ...payload, email: "private@example.test" },
      { ...payload, type: "unknown" },
      { ...payload, comment: "x".repeat(4001) },
      { ...payload, question: { ...payload.question, owner: "private" } },
      { ...payload, title: "a\nb" },
    ])
      expect((await call(invalid)).status).toBe(400);
    expect(ports.reserve).not.toHaveBeenCalled();
    expect(ports.fetch).not.toHaveBeenCalled();
  });
  it("sperrt Gäste, unbestätigte Konten und fremde Origins; Preflight erzeugt keine Meldung", async () => {
    const { ports, call, handler } = setup({
      authenticate: vi.fn(async () => null),
    });
    expect((await call()).status).toBe(401);
    expect(
      (await call(payload, { Origin: "https://evil.example" })).status,
    ).toBe(403);
    expect((await call(payload, { Authorization: "" })).status).toBe(401);
    expect(
      (
        await handler(
          new Request("https://example", {
            method: "OPTIONS",
            headers: { Origin: "https://quiz.example" },
          }),
        )
      ).status,
    ).toBe(204);
    expect(ports.reserve).not.toHaveBeenCalled();
    expect(ports.fetch).not.toHaveBeenCalled();
  });
  it("meldet fehlende Konfiguration und Mengenbegrenzung ohne GitHub-Aufruf", async () => {
    expect((await setup({ githubToken: "" }).call()).status).toBe(503);
    const { ports, call } = setup({
      reserve: async () => {
        throw new Error("rate_limited");
      },
    });
    expect((await call()).status).toBe(429);
    expect(ports.fetch).not.toHaveBeenCalled();
  });
  it("bestätigt eine bereits gesendete Meldung ohne erneuten GitHub-Aufruf", async () => {
    const { ports, call } = setup({
      reserve: async () => ({
        action: "sent",
        createdAt: "2026-10-04T12:00:00Z",
        ...receipt,
      }),
    });
    expect(await (await call()).json()).toEqual(receipt);
    expect(ports.fetch).not.toHaveBeenCalled();
  });
  it("verspricht nach einem Timeout keinen Versand und findet das schon angelegte Issue beim nächsten Versuch", async () => {
    const { ports, call } = setup({
      fetch: vi.fn(async (url) => {
        if (String(url).includes("labels/")) return json({});
        throw new Error("network lost after GitHub create");
      }),
    });
    expect((await call()).status).toBe(409);
    expect(ports.settle).toHaveBeenCalledWith(
      expect.any(String),
      id,
      "uncertain",
      undefined,
    );
    ports.reserve = vi.fn(async () => ({
      action: "reconcile" as const,
      createdAt: "2026-10-04T12:00:00Z",
    }));
    ports.fetch = vi.fn(async () =>
      json([
        {
          number: 42,
          html_url: receipt.url,
          body: `<!-- wissensquiz-report:${id} -->`,
        },
      ]),
    );
    expect(await (await call()).json()).toEqual(receipt);
    expect(ports.fetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(ports.fetch).mock.calls[0][1]?.method).not.toBe("POST");
  });
  it("legt bei einem noch ungeklärten Versand auch nach negativem Abgleich kein zweites Issue an", async () => {
    const { ports, call } = setup({
      reserve: async () => ({
        action: "reconcile",
        createdAt: "2026-10-04T12:00:00Z",
      }),
      fetch: vi.fn(async () => json([])),
    });
    expect((await call()).status).toBe(409);
    expect(
      vi
        .mocked(ports.fetch)
        .mock.calls.every(([, init]) => init?.method !== "POST"),
    ).toBe(true);
  });
  it("richtet ein fehlendes typgebundenes Label vor dem Issue ein", async () => {
    const { ports, call } = setup({
      fetch: vi.fn(async (url, init) =>
        String(url).includes("labels/")
          ? json({}, 404)
          : String(url).endsWith("/labels")
            ? json({}, 201)
            : json({ number: 42, html_url: receipt.url }, 201),
      ),
    });
    expect((await call()).status).toBe(200);
    expect(
      JSON.parse(vi.mocked(ports.fetch).mock.calls[1][1]!.body as string),
    ).toMatchObject({ name: "meldung:text" });
  });
  it("neutralisiert HTML und Erwähnungen und bietet alle vier Typen an", () => {
    const report = parseReport({
      ...payload,
      comment:
        "@LevelX2 <script>alert(1)</script>\n<!-- wissensquiz-report:forged -->",
    });
    const { body } = issueContent(report);
    expect(body).not.toContain("@LevelX2");
    expect(body).not.toContain("<script>");
    expect(body).not.toContain("<!-- wissensquiz-report:forged -->");
    expect(Object.keys(reportTypes)).toHaveLength(4);
  });
  it("akzeptiert im Browser nur bestätigte Issue-Links dieses Repositorys", async () => {
    const invoke = vi.fn(async () => ({ data: receipt, error: null }));
    const client = { functions: { invoke } } as unknown as SupabaseClient;
    expect(await sendIssueReport(client, parseReport(payload))).toEqual(
      receipt,
    );
    invoke.mockResolvedValueOnce({
      data: { ...receipt, url: "https://evil.example" },
      error: null,
    });
    await expect(sendIssueReport(client, parseReport(payload))).rejects.toThrow(
      "invalid_receipt",
    );
  });
});
