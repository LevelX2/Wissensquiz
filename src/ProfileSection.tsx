import type { ReactNode } from "react";
import { DisclosureArtwork, type DisclosureSubject } from "./DisclosureArtwork";

export function ProfileSection({
  title,
  subject,
  children,
  onToggle,
}: {
  title: string;
  subject: DisclosureSubject;
  children: ReactNode;
  onToggle?: (open: boolean) => void;
}) {
  return (
    <section className="profile-section-group" aria-label={title}>
      <details
        className="profile-section"
        onToggle={(event) => onToggle?.(event.currentTarget.open)}
      >
        <summary className="illustrated-summary">
          <DisclosureArtwork subject={subject} />
          {title}
        </summary>
        <div className="profile-section-content">{children}</div>
      </details>
    </section>
  );
}
