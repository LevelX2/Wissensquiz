import { Component, type ReactNode } from "react";

export class PageBoundary extends Component<
  { children: ReactNode },
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
          <h2>Diese Ansicht konnte nicht geladen werden.</h2>
          <p>
            Dein lokal gespeicherter Fortschritt bleibt erhalten. Prüfe Deine
            Verbindung und lade die App erneut.
          </p>
          <button onClick={() => location.reload()}>App neu laden</button>
        </section>
      );
    return this.props.children;
  }
}
