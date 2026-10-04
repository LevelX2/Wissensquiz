import { useContext, useRef, useState } from "react";
import { ReportContext, sendIssueReport } from "./issueReports";
import {
  parseReport,
  reportTypes,
  type IssueReport,
  type IssueReceipt,
  type ReportType,
} from "../supabase/functions/quiz-report/contracts";

export function IssueReportForm({
  question,
}: {
  question?: { id: string; version: string };
}) {
  const account = useContext(ReportContext);
  const draftKey = `wissensquiz-issue:${account?.storageKey}:${question ? `${question.id}:${question.version}` : "general"}`;
  const [draft] = useState<IssueReport | null>(() => {
    if (!account) return null;
    try {
      const value = sessionStorage.getItem(draftKey);
      return value ? parseReport(JSON.parse(value)) : null;
    } catch {
      return null;
    }
  });
  const [type, setType] = useState<ReportType>(
    draft?.type ?? (question ? "content" : "bug"),
  );
  const [title, setTitle] = useState(
    draft?.title ?? (question ? `Frage ${question.id}` : ""),
  );
  const [comment, setComment] = useState(draft?.comment ?? "");
  const [consent, setConsent] = useState(!!draft);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<IssueReceipt | null>(null);
  const pending = useRef<IssueReport | null>(draft);
  const locked = useRef(false);
  // A form is tied to one question and stays mounted while its panel is hidden.
  // Keep its submitted content and ID unchanged after an uncertain response.
  if (!account)
    return (
      <p className="notice">
        Zum Melden bitte mit Deinem bestätigten Quiz-Konto im Profil anmelden.
        Ein GitHub-Konto brauchst Du dafür nicht.
      </p>
    );
  if (receipt)
    return (
      <p className="notice" role="status">
        Danke! Deine Meldung wurde als{" "}
        <a href={receipt.url} target="_blank" rel="noopener noreferrer">
          GitHub-Issue #{receipt.number}
        </a>{" "}
        aufgenommen.
      </p>
    );
  const frozen = !!pending.current;
  return (
    <form
      className="issue-report-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (locked.current || !consent) return;
        let report: IssueReport;
        try {
          report =
            pending.current ??
            parseReport({
              id: crypto.randomUUID(),
              type,
              title,
              comment,
              appVersion: Number(import.meta.env.VITE_SITE_VERSION ?? 0),
              ...(question ? { question } : {}),
            });
        } catch {
          setError(
            "Bitte gib einen Titel mit mindestens drei und eine Beschreibung mit mindestens zehn Zeichen ein.",
          );
          return;
        }
        try {
          sessionStorage.setItem(draftKey, JSON.stringify(report));
        } catch {
          setError(
            "Der Browser konnte die Meldungs-ID nicht speichern. Bitte erlaube den Gerätespeicher und versuche es erneut.",
          );
          return;
        }
        pending.current = report;
        locked.current = true;
        setSending(true);
        setError("");
        try {
          const confirmed = await sendIssueReport(account.client, report);
          setReceipt(confirmed);
          sessionStorage.removeItem(draftKey);
        } catch (failure) {
          setError(
            failure instanceof Error
              ? failure.message
              : "Der Versand wurde nicht bestätigt. Bitte prüfe die Meldung erneut.",
          );
        } finally {
          locked.current = false;
          setSending(false);
        }
      }}
    >
      <label>
        Meldungstyp
        <select
          value={type}
          disabled={frozen || sending}
          onChange={(event) => setType(event.target.value as ReportType)}
        >
          {Object.entries(reportTypes).map(([value, item]) => (
            <option key={value} value={value}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Kurztitel
        <input
          value={title}
          minLength={3}
          maxLength={120}
          required
          disabled={frozen || sending}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label>
        Was ist Dir aufgefallen?
        <textarea
          value={comment}
          minLength={10}
          maxLength={4000}
          required
          disabled={frozen || sending}
          onChange={(event) => setComment(event.target.value)}
        />
      </label>
      {question && (
        <p className="tiny muted">
          Fragen-ID: {question.id} · Inhaltsversion: {question.version}
        </p>
      )}
      <p className="tiny muted">
        Deine Meldung wird öffentlich in GitHub veröffentlicht. Automatisch
        ergänzt werden die App-Version
        {question ? ", Fragen-ID und Inhaltsversion" : ""}. E-Mail-Adresse und
        Spielstand werden nicht mitgesendet. Bitte schreibe keine privaten
        Angaben in Deine Meldung.
      </p>
      <label className="filter-choice">
        <input
          type="checkbox"
          checked={consent}
          disabled={frozen || sending}
          onChange={(event) => setConsent(event.target.checked)}
        />
        Meine Meldung darf öffentlich auf GitHub erscheinen.
      </label>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      <button className="secondary" disabled={!consent || sending}>
        {sending
          ? "Meldung wird gesendet …"
          : frozen
            ? "Versand erneut prüfen"
            : "Meldung senden"}
      </button>
    </form>
  );
}
