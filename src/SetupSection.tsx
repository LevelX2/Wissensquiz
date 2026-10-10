import type { ReactNode, Ref } from "react";

export function SetupSection({
  title,
  selection,
  illustration,
  actionLabel,
  className = "",
  children,
  detailsRef,
  open,
  onOpenChange,
}: {
  title: string;
  selection: ReactNode;
  illustration?: ReactNode;
  actionLabel?: string;
  className?: string;
  children: ReactNode;
  detailsRef?: Ref<HTMLDetailsElement>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <details
      ref={detailsRef}
      open={open}
      className={`setup-section ${className}`}
    >
      <summary
        className={illustration ? "illustrated-summary" : undefined}
        aria-expanded={open}
        onClick={
          onOpenChange
            ? (event) => {
                event.preventDefault();
                onOpenChange(!open);
              }
            : undefined
        }
      >
        {illustration}
        <span className="setup-section-title">{title}</span>
        <span className="setup-section-selection">{selection}</span>
        {actionLabel && (
          <span className="setup-section-action">{actionLabel}</span>
        )}
      </summary>
      {open !== false && (
        <div className="setup-section-content">{children}</div>
      )}
    </details>
  );
}
