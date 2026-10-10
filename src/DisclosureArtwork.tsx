export type DisclosureSubject =
  "history" | "answers" | "context" | "film" | "sources" | "learning";

/** Decorative artwork; the summary text supplies the accessible name. */
export function DisclosureArtwork({ subject }: { subject: DisclosureSubject }) {
  return (
    <img
      className="disclosure-artwork"
      src={`/disclosures/${subject}.png`}
      alt=""
      aria-hidden="true"
      width={40}
      height={40}
      decoding="async"
    />
  );
}
