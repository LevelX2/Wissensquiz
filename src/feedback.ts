import type { State } from "./model";

export type FeedbackKind =
  | "start"
  | "next"
  | "correct"
  | "wrong"
  | "reveal"
  | "timeout"
  | "complete"
  | "badge"
  | "unlock";
const tones: Record<FeedbackKind, number[]> = {
  start: [392, 523],
  next: [440],
  correct: [659, 880],
  wrong: [277, 196],
  reveal: [523, 659],
  timeout: [330, 262, 220],
  complete: [523, 659, 784],
  badge: [523, 659, 784, 1047],
  unlock: [523, 659, 784, 1047, 784, 1047, 1319, 1568],
};
const vibrations: Record<FeedbackKind, number | number[]> = {
  start: 15,
  next: 10,
  correct: [20, 40, 25],
  wrong: 45,
  reveal: [12, 40, 12],
  timeout: [35, 40, 35],
  complete: [25, 50, 25, 50, 40],
  badge: [30, 50, 30, 50, 60],
  unlock: [35, 50, 35, 70, 75],
};
let context: AudioContext | undefined;
const active = new Set<OscillatorNode>();
export const supportsHaptics = () =>
  typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

// Call in the user's click/keyboard gesture. Never request sound on page load.
export async function unlockSound(settings: State["settings"]) {
  if (settings.sound === false) return;
  try {
    const Audio =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Audio) return;
    if (!context || context.state === "closed") context = new Audio();
    if (context.state === "suspended") await context.resume().catch(() => {});
  } catch {
    /* Sound support must never prevent an answer from being saved. */
  }
}
export function stopFeedback() {
  for (const oscillator of active) {
    try {
      oscillator.stop();
    } catch {
      /* Already stopped. */
    }
  }
  active.clear();
  try {
    if (supportsHaptics()) navigator.vibrate(0);
  } catch {
    /* Optional hardware. */
  }
}
export function playFeedback(kind: FeedbackKind, settings: State["settings"]) {
  if (typeof document !== "undefined" && document.visibilityState === "hidden")
    return;
  let haptics: "off" | "unavailable" | "requested" | "blocked" =
    settings.haptics ? "unavailable" : "off";
  try {
    if (settings.haptics && supportsHaptics())
      haptics = navigator.vibrate(vibrations[kind]) ? "requested" : "blocked";
  } catch {
    haptics = "blocked";
  }
  if (settings.sound === false || context?.state !== "running") return haptics;
  try {
    const audio = context;
    // Answers differ in register, direction and timbre, without a loud buzzer.
    const voice =
      kind === "correct"
        ? {
            type: "sine" as OscillatorType,
            spacing: 0.09,
            duration: 0.16,
            peak: 0.035,
          }
        : kind === "wrong"
          ? {
              type: "triangle" as OscillatorType,
              spacing: 0.085,
              duration: 0.18,
              peak: 0.024,
            }
          : kind === "reveal"
            ? {
                type: "sine" as OscillatorType,
                spacing: 0.12,
                duration: 0.18,
                peak: 0.026,
              }
            : {
                type: (kind === "unlock"
                  ? "triangle"
                  : "sine") as OscillatorType,
                spacing: kind === "unlock" ? 0.13 : 0.1,
                duration: 0.15,
                peak: 0.045,
              };
    tones[kind].forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const at = audio.currentTime + index * voice.spacing;
      oscillator.type = voice.type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(voice.peak, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, at + voice.duration - 0.02);
      oscillator.connect(gain).connect(audio.destination);
      active.add(oscillator);
      oscillator.onended = () => {
        active.delete(oscillator);
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start(at);
      oscillator.stop(at + voice.duration);
    });
  } catch {
    /* Optional sound; visible feedback remains available. */
  }
  return haptics;
}
