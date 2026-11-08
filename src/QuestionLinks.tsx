import type { Question } from "./model";
import { DisclosureArtwork } from "./DisclosureArtwork";
import { SourceLink } from "./SourceLink";
import {
  databaseLinksFor,
  evidenceLinksFor,
  evidenceLabel,
  sourceKey,
} from "./sourceLinks";

export function QuestionLinks({ q }: { q: Question }) {
  const evidence = evidenceLinksFor(q);
  const databases = databaseLinksFor(q);
  const evidenceKeys = new Set(evidence.map(({ source }) => sourceKey(source)));
  const further = databases.filter(
    ({ source }) => !evidenceKeys.has(sourceKey(source)),
  );
  if (!evidence.length && !further.length) return null;
  return (
    <details className="answer-sources">
      <summary className="illustrated-summary">
        <DisclosureArtwork subject="sources" />
        Quellen und Links
      </summary>
      {evidence.length > 0 && (
        <section aria-label="Belegquellen">
          <h3>Belegquellen</h3>
          <ul>
            {evidence.map(({ source, subject }) => (
              <li key={sourceKey(source)}>
                <SourceLink
                  source={source}
                  q={q}
                  subject={subject}
                  label={evidenceLabel(source, databases)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
      {further.length > 0 && (
        <section aria-label="Weiterführende Datenbanken">
          <h3>Weiterführende Datenbanken</h3>
          <ul>
            {further.map(({ source, label, kind }) => (
              <li key={sourceKey(source)}>
                <SourceLink source={source} q={q} label={label} />
                <small className="source-link-kind">{kind}</small>
              </li>
            ))}
          </ul>
        </section>
      )}
    </details>
  );
}
