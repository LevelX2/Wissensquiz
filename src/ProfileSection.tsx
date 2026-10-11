import type { ReactNode } from "react";
import { DisclosureArtwork, type DisclosureSubject } from "./DisclosureArtwork";

export function ProfileSection({
  title,
  subject,
  children,
}: {
  title: string;
  subject: DisclosureSubject;
  children: ReactNode;
}) {
  return (
    <section className="profile-section-group" aria-label={title}>
      <details className="profile-section">
        <summary className="illustrated-summary">
          <DisclosureArtwork subject={subject} />
          {title}
        </summary>
        <div className="profile-section-content">{children}</div>
      </details>
    </section>
  );
}
