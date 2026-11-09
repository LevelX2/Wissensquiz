import welcomeWide from "./assets/artwork/filmfieber-wide-1600.webp";
import welcomeWideSmall from "./assets/artwork/filmfieber-wide-1280.webp";
import welcomePortrait from "./assets/artwork/filmfieber-portrait-960.webp";
import welcomePortraitSmall from "./assets/artwork/filmfieber-portrait-640.webp";

export function WelcomeArtwork({ onReady }: { onReady?: () => void }) {
  return (
    <picture className="welcome-artwork" aria-hidden="true">
      <source
        media="(max-width: 640px)"
        srcSet={`${welcomePortraitSmall} 640w, ${welcomePortrait} 960w`}
        sizes="100vw"
        width="1024"
        height="1536"
      />
      <img
        src={welcomeWide}
        srcSet={`${welcomeWideSmall} 1280w, ${welcomeWide} 1600w`}
        sizes="(max-width: 1440px) 100vw, 1440px"
        width="1600"
        height="900"
        fetchPriority="high"
        alt=""
        onLoad={onReady}
        onError={onReady}
      />
    </picture>
  );
}
