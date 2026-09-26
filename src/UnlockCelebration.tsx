import { useEffect, useRef, type CSSProperties } from "react";
import { genreLabel, difficultyLabel } from "./filters";
import type { PathUnlock } from "./learningPath";

export function UnlockCelebration({
  unlocks,
  onClose,
}: {
  unlocks: PathUnlock[];
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current!;
    el.showModal();
    return () => el.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="unlock-celebration"
      aria-labelledby="unlock-title"
      aria-describedby="unlock-description"
      onCancel={onClose}
    >
      <div className="unlock-scene" aria-hidden="true">
        {[0, 1, 2].map((burst) => (
          <div className={`firework firework-${burst}`} key={burst}>
            <span className="firework-trail" />
            {Array.from({ length: 16 }, (_, i) => {
              const angle = (i * Math.PI) / 8;
              return (
                <i
                  key={i}
                  style={
                    {
                      "--x": `${Math.cos(angle) * (70 + (i % 3) * 15)}px`,
                      "--y": `${Math.sin(angle) * (70 + (i % 3) * 15)}px`,
                      "--spin": `${i * 55}deg`,
                      "--delay": `${0.45 + burst * 0.45}s`,
                      "--spark": ["#ffda82", "#a4f0df", "#f5a5bc", "#fff4d6"][
                        i % 4
                      ],
                    } as CSSProperties
                  }
                />
              );
            })}
          </div>
        ))}
        <div className="unlock-medal">
          <svg viewBox="0 0 100 100" fill="none">
            <path
              className="unlock-shackle"
              d="M34 46V31a16 16 0 0 1 32 0v15"
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <rect
              x="23"
              y="44"
              width="54"
              height="43"
              rx="12"
              fill="currentColor"
            />
            <path
              d="m50 53 3.5 7.5 8.5 1-6.2 5.8 1.7 8.2-7.5-4.2-7.5 4.2 1.7-8.2-6.2-5.8 8.5-1Z"
              fill="#433319"
            />
          </svg>
        </div>
      </div>
      <div className="unlock-copy">
        <span className="eyebrow">DEIN WISSEN BRINGT DICH WEITER</span>
        <h2 id="unlock-title">
          {unlocks.length === 1
            ? "Neue Stufe freigeschaltet!"
            : "Neue Stufen freigeschaltet!"}
        </h2>
        <ul className="unlock-levels">
          {unlocks.map(({ genre, difficulty }) => (
            <li key={`${genre}:${difficulty}`}>
              <span>{genreLabel(genre)}</span>
              <strong>{difficultyLabel(difficulty)}</strong>
            </li>
          ))}
        </ul>
        <p id="unlock-description">
          Geschafft! Deine sicheren Antworten haben die nächste Tür geöffnet.{" "}
          {unlocks.length === 1
            ? "Diese Stufe steht Dir jetzt auch im Lernpfad zur Verfügung."
            : "Diese Stufen stehen Dir jetzt auch im Lernpfad zur Verfügung."}
        </p>
        <button className="primary" autoFocus onClick={onClose}>
          Weiter zum Ergebnis
        </button>
      </div>
    </dialog>
  );
}
