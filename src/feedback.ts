import type { State } from "./model";

export type FeedbackKind =
  "start" | "next" | "correct" | "wrong" | "timeout" | "complete" | "badge";
const tones: Record<FeedbackKind, number[]> = {
  start: [392, 523],
  next: [440],
  correct: [523, 659],
  wrong: [294, 247],
  timeout: [330, 262, 220],
  complete: [523, 659, 784],
  badge: [523, 659, 784, 1047],
};
const vibrations: Record<FeedbackKind, number | number[]> = {
  start: 15,
  next: 10,
  correct: [20, 40, 25],
  wrong: 45,
  timeout: [35, 40, 35],
  complete: [25, 50, 25, 50, 40],
  badge: [30, 50, 30, 50, 60],
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
  try {
    if (settings.haptics && supportsHaptics())
      navigator.vibrate(vibrations[kind]);
  } catch {
    /* Optional hardware. */
  }
  if (settings.sound === false || context?.state !== "running") return;
  try {
    const audio = context;
    tones[kind].forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const at = audio.currentTime + index * 0.1;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(0.045, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.13);
      oscillator.connect(gain).connect(audio.destination);
      active.add(oscillator);
      oscillator.onended = () => {
        active.delete(oscillator);
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start(at);
      oscillator.stop(at + 0.15);
    });
  } catch {
    /* Optional sound; visible feedback remains available. */
  }
}
