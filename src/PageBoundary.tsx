import { Component, type ReactNode } from "react";

export class PageBoundary extends Component<
  { children: ReactNode; scope?: "page" | "app" },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <section className="notice error" role="alert">
          <h2>
            {this.props.scope === "app"
              ? "Das Quiz konnte nicht angezeigt werden."
              : "Diese Ansicht konnte nicht geladen werden."}
          </h2>
          <p>
            Bereits online bestätigter Fortschritt bleibt erhalten. Noch nicht
            bestätigte Eingaben können beim Neuladen verloren gehen.
          </p>
          <button onClick={() => location.reload()}>App neu laden</button>
        </section>
      );
    return this.props.children;
  }
}
