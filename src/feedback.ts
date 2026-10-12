import type { State } from "./model";
import { successTiers, type SuccessTier } from "./successTiers";

export type FeedbackKind =
  | "click"
  | "start"
  | "next"
  | "correct"
  | "wrong"
  | "reveal"
  | "timeout"
  | "complete"
  | "success";
const tones: Record<FeedbackKind, number[]> = {
  click: [600],
  start: [392, 523],
  next: [440],
  correct: [659, 831],
  wrong: [349, 294],
  reveal: [523, 659],
  timeout: [330, 262, 220],
  complete: [523, 659, 784],
  success: [...successTiers[0].tones],
};
const vibrations: Record<FeedbackKind, number | number[]> = {
  click: 10,
  start: 15,
  next: 10,
  correct: [20, 40, 25],
  wrong: 45,
  reveal: [12, 40, 12],
  timeout: [35, 40, 35],
  complete: [25, 50, 25, 50, 40],
  success: [...successTiers[0].vibration],
};
let context: AudioContext | undefined;
let resuming: Promise<void> | undefined;
let generation = 0;
const active = new Set<OscillatorNode>();
export const supportsHaptics = () =>
  typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

// Call in the user's click/keyboard gesture. Never request sound on page load.
export type SoundStatus = "off" | "unavailable" | "ready" | "blocked";
export async function unlockSound(
  settings: State["settings"],
): Promise<SoundStatus> {
  if (settings.sound === false) return "off";
  try {
    const Audio =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Audio) return "unavailable";
    if (!context || context.state === "closed") {
      context = new Audio();
      resuming = undefined;
      generation++;
    }
    const audio = context;
    // Safari also pauses audio as "interrupted" after leaving the app.
    if (audio.state !== "running") {
      // A pending resume may belong to a gesture the browser did not accept.
      // Always use the new gesture; waiting on the old promise loses it.
      let timer: ReturnType<typeof setTimeout>;
      const pending = Promise.race([
        audio.resume(),
        new Promise<void>((resolve) => {
          timer = setTimeout(resolve, 1000);
        }),
      ])
        .catch(() => {})
        .finally(() => {
          clearTimeout(timer);
          if (resuming === pending) resuming = undefined;
        });
      resuming = pending;
      await pending;
    }
    return audio.state === "running" ? "ready" : "blocked";
  } catch {
    /* Sound support must never prevent an answer from being saved. */
    return "blocked";
  }
}
export function stopFeedback() {
  generation++;
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
export function playFeedback(
  kind: FeedbackKind,
  settings: State["settings"],
  tier?: SuccessTier,
) {
  if (typeof document !== "undefined" && document.visibilityState === "hidden")
    return;
  let haptics: "off" | "unavailable" | "requested" | "blocked" =
    settings.haptics ? "unavailable" : "off";
  try {
    if (settings.haptics && supportsHaptics())
      haptics = navigator.vibrate(
        kind === "success" && tier ? [...tier.vibration] : vibrations[kind],
      )
        ? "requested"
        : "blocked";
  } catch {
    haptics = "blocked";
  }
  if (settings.sound === false || !context) return haptics;
  const audio = context;
  if (audio.state === "running") playTones(kind, audio, tier);
  else if (resuming) {
    const requestedAt = performance.now(),
      requestGeneration = generation;
    // A save may finish before resume(). Keep its signal briefly, without
    // delaying persistence or replaying stale sounds after mute/backgrounding.
    void resuming.then(() => {
      if (
        requestGeneration === generation &&
        performance.now() - requestedAt < 1000 &&
        audio.state === "running" &&
        document.visibilityState !== "hidden"
      )
        playTones(kind, audio, tier);
    });
  }
  return haptics;
}

function playTones(
  kind: FeedbackKind,
  audio: AudioContext,
  tier?: SuccessTier,
) {
  try {
    // Brief, soft answer tones: an ascending major third for success and a
    // quieter descending pair for a miss, distinct by register and direction.
    const voice =
      kind === "click"
        ? {
            type: "sine" as OscillatorType,
            spacing: 0,
            duration: 0.07,
            peak: 0.03,
          }
        : kind === "correct"
          ? {
              type: "sine" as OscillatorType,
              spacing: 0.065,
              duration: 0.12,
              peak: 0.032,
            }
          : kind === "wrong"
            ? {
                type: "sine" as OscillatorType,
                spacing: 0.065,
                duration: 0.105,
                peak: 0.018,
              }
            : kind === "reveal"
              ? {
                  type: "sine" as OscillatorType,
                  spacing: 0.12,
                  duration: 0.18,
                  peak: 0.026,
                }
              : {
                  type: (kind === "success"
                    ? "triangle"
                    : "sine") as OscillatorType,
                  spacing: 0.1,
                  duration: 0.15,
                  peak: 0.045,
                };
    const melody = kind === "success" && tier ? tier.tones : tones[kind];
    melody.forEach((frequency, index) => {
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
}

export function playClickFeedback(
  target: EventTarget | null,
  settings: State["settings"],
) {
  if (!(target instanceof Element)) return;
  const control = target.closest(
    "button, a[href], summary, input[type='checkbox'], input[type='radio'], [role='button']",
  );
  if (
    !control ||
    control.closest('[data-feedback="own"]') ||
    control.matches(':disabled, [aria-disabled="true"]')
  )
    return;
  void unlockSound(settings);
  playFeedback("click", { ...settings, haptics: false });
}
