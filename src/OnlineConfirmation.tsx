export function OnlineConfirmation({ at }: { at?: number }) {
  if (at === undefined || !Number.isFinite(at) || at < 0) return null;
  return (
    <p className="tiny muted online-confirmation">
      Zuletzt online bestätigt: {new Date(at).toLocaleString("de-DE")}
    </p>
  );
}
