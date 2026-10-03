import type { ReactNode } from "react";

export function SetupSection({
  title,
  selection,
  children,
}: {
  title: string;
  selection: string;
  children: ReactNode;
}) {
  return (
    <details className="setup-section">
      <summary>
        <span className="setup-section-title">{title}</span>
        <span className="setup-section-selection">{selection}</span>
      </summary>
      <div className="setup-section-content">{children}</div>
    </details>
  );
}
