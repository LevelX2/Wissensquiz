import { WelcomeArtwork } from "./WelcomeArtwork";

export function StartupScreen({
  onArtworkReady,
}: {
  onArtworkReady?: () => void;
}) {
  return (
    <main
      className="trial-page is-welcome startup-screen"
      aria-labelledby="startup-title"
    >
      <div className="brand">
        <img src="/icon.svg" alt="" />
        <span>
          Filmfieber<small>DEIN QUIZ FÜR FILM & SERIE</small>
        </span>
      </div>
      <section className="welcome-hero">
        <WelcomeArtwork onReady={onArtworkReady} />
        <div className="welcome-content">
          <span className="eyebrow">DEIN QUIZ FÜR FILM & SERIE</span>
          <h1 id="startup-title">
            Großes Kino.
            <br />
            <em>Steckt in Dir.</em>
          </h1>
          <p className="startup-status" role="status">
            Dein Filmkosmos wird vorbereitet …
          </p>
        </div>
      </section>
    </main>
  );
}
