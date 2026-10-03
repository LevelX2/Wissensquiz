import type { ReactNode, Ref } from "react";

export function SetupSection({
  title,
  selection,
  illustration,
  actionLabel,
  className = "",
  children,
  detailsRef,
}: {
  title: string;
  selection: ReactNode;
  illustration?: ReactNode;
  actionLabel?: string;
  className?: string;
  children: ReactNode;
  detailsRef?: Ref<HTMLDetailsElement>;
}) {
  return (
    <details ref={detailsRef} className={`setup-section ${className}`}>
      <summary>
        {illustration}
        <span className="setup-section-title">{title}</span>
        <span className="setup-section-selection">{selection}</span>
        {actionLabel && (
          <span className="setup-section-action">{actionLabel} →</span>
        )}
      </summary>
      <div className="setup-section-content">{children}</div>
    </details>
  );
}
