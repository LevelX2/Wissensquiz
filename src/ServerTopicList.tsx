import { useState } from "react";
import type { State } from "./model";
import { useServerView } from "./serverViews";
import { TopicCard } from "./TopicCard";
export function ServerTopicList({
  state,
  scope,
  answeredOnly = false,
}: {
  state: State;
  scope?: { kind: string; name: string } | null;
  answeredOnly?: boolean;
}) {
  const [cursors, setCursors] = useState<string[]>([""]);
  const page = useServerView({
    action: "topics",
    scope: scope?.name,
    scopeKind: scope?.kind,
    answeredOnly,
    cursor: cursors.at(-1),
  });
  return (
    <>
      {page.error ? (
        <p role="alert" className="notice">
          {page.error}
          <button onClick={page.retry}>Erneut versuchen</button>
        </p>
      ) : !page.value ? (
        <p role="status">Deine Themen werden geladen …</p>
      ) : (
        <>
          {!page.value.items.length && (
            <p>Für diese Auswahl gibt es noch keine Einträge.</p>
          )}
          <div className="topic-grid">
            {page.value.items.map((item) => (
              <TopicCard
                key={item.topic}
                topic={item.topic}
                state={state}
                summary={item}
              />
            ))}
          </div>
          <div className="account-actions">
            {cursors.length > 1 && (
              <button onClick={() => setCursors((c) => c.slice(0, -1))}>
                ← Vorherige Themen
              </button>
            )}
            {page.value.nextCursor && (
              <button
                onClick={() =>
                  setCursors((c) => [...c, page.value!.nextCursor!])
                }
              >
                Weitere Themen →
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}
