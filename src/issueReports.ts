import { createContext } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseReceipt,
  type IssueReport,
} from "../supabase/functions/quiz-report/contracts";
import { requestWithin } from "./request";

export const ReportContext = createContext<{
  client: SupabaseClient;
  storageKey: string;
} | null>(null);
const errorMessages: Record<string, string> = {
  verified_account_required:
    "Bitte melde Dich mit einem bestätigten Quiz-Konto an.",
  reporting_not_configured:
    "Der Meldungsdienst ist noch nicht eingerichtet. Bitte versuche es später erneut.",
  invalid_report:
    "Bitte prüfe Titel und Beschreibung: mindestens drei Zeichen im Titel und zehn in der Beschreibung.",
  rate_limited:
    "Bitte warte mindestens eine Minute zwischen Meldungen. Pro Konto sind höchstens fünf Meldungen innerhalb von 24 Stunden möglich.",
  report_pending:
    "Diese Meldung wird noch verarbeitet. Warte eine Minute und prüfe den Versand erneut.",
  report_uncertain:
    "GitHub hat den Versand noch nicht bestätigt. Prüfe diese Meldung später erneut; wir legen sie nicht doppelt an.",
  report_changed:
    "Diese Meldung wurde bereits mit einem anderen Inhalt gesendet. Öffne das Formular für eine neue Meldung erneut.",
};
export async function sendIssueReport(
  client: SupabaseClient,
  body: IssueReport,
) {
  const { data, error } = await requestWithin(
    (signal) => client.functions.invoke("quiz-report", { body, signal }),
    30_000,
  );
  if (error) {
    const response =
      "context" in error && error.context instanceof Response
        ? error.context
        : null;
    const detail = await response?.json().catch(() => null);
    throw new Error(
      errorMessages[detail?.code] ??
        "Der Versand wurde nicht bestätigt. Prüfe dieselbe Meldung später erneut; dabei bleibt ihre Meldungs-ID erhalten.",
    );
  }
  return parseReceipt(data);
}
