import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { emptyState } from "../src/model";

const settings = emptyState().settings;
import { successTiers } from "../src/successTiers";
let feedback: typeof import("../src/feedback");
let audio: FakeAudio;
let initialState = "running";
let resume: () => Promise<void>;
const oscillators: { stop: ReturnType<typeof vi.fn> }[] = [];

class FakeAudio {
  state = initialState;
  currentTime = 0;
  destination = {};
  resume = vi.fn(() => resume());
  constructor() {
    audio = this;
  }
  createOscillator() {
    const oscillator = {
      frequency: { value: 0 },
      type: "sine",
      onended: null,
      connect: (gain: unknown) => gain,
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    };
    oscillators.push(oscillator);
    return oscillator;
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  vi.resetModules();
  initialState = "running";
  oscillators.length = 0;
  resume = async () => {
    audio.state = "running";
  };
  vi.stubGlobal("window", { AudioContext: FakeAudio });
  vi.stubGlobal("document", { visibilityState: "visible" });
  vi.stubGlobal("navigator", { vibrate: vi.fn(() => true) });
  feedback = await import("../src/feedback");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("signalisiert jede Erfolgsstufe einmal mit ihrer Melodie und Haptik; beide bleiben getrennt abschaltbar", async () => {
  await feedback.unlockSound(settings);
  for (const tier of successTiers) {
    oscillators.length = 0;
    vi.mocked(navigator.vibrate).mockClear();
    feedback.playFeedback("success", { ...settings, haptics: true }, tier);
    expect(oscillators).toHaveLength(tier.tones.length);
    expect(navigator.vibrate).toHaveBeenCalledExactlyOnceWith([
      ...tier.vibration,
    ]);
    oscillators.length = 0;
    vi.mocked(navigator.vibrate).mockClear();
    feedback.playFeedback(
      "success",
      { ...settings, haptics: false, sound: false },
      tier,
    );
    expect(oscillators).toHaveLength(0);
    expect(navigator.vibrate).not.toHaveBeenCalled();
  }
});

it("startet beim Laden keine Audioausgabe und respektiert ausgeschalteten Ton", async () => {
  feedback.playFeedback("correct", settings);
  expect(oscillators).toHaveLength(0);
  expect(await feedback.unlockSound({ ...settings, sound: false })).toBe("off");
  expect(await feedback.unlockSound(settings)).toBe("ready");
  feedback.playFeedback("correct", { ...settings, sound: false });
  expect(oscillators).toHaveLength(0);
});

it("setzt auch einen unterbrochenen Audiokontext beim nächsten Bedienimpuls fort", async () => {
  initialState = "interrupted";
  expect(await feedback.unlockSound(settings)).toBe("ready");
  expect(audio.resume).toHaveBeenCalledOnce();
  feedback.playFeedback("correct", settings);
  expect(oscillators).toHaveLength(2);
});

it("übergeht den iPhone-Stummmodus nicht durch eine andere Audio-Session", async () => {
  const session = { type: "auto" };
  vi.stubGlobal("navigator", { audioSession: session });
  expect(session.type).toBe("auto");
  await feedback.unlockSound({ ...settings, sound: false });
  expect(session.type).toBe("auto");
  await feedback.unlockSound(settings);
  expect(session.type).toBe("auto");
  feedback.stopFeedback();
  expect(session.type).toBe("auto");
  await feedback.unlockSound(settings);
  expect(session.type).toBe("auto");
});

it("verliert das Antwortsignal nicht, wenn die Speicherung vor resume fertig ist", async () => {
  initialState = "suspended";
  let release!: () => void;
  const activation = new Promise<void>((resolve) => {
    release = () => {
      audio.state = "running";
      resolve();
    };
  });
  resume = () => activation;
  const unlocking = feedback.unlockSound(settings);
  const second = feedback.unlockSound(settings);
  feedback.playFeedback("wrong", settings);
  expect(oscillators).toHaveLength(0);
  expect(audio.resume).toHaveBeenCalledTimes(2);
  release();
  expect(await unlocking).toBe("ready");
  await second;
  expect(oscillators).toHaveLength(2);
});

it("nutzt einen neuen Bedienimpuls trotz noch wartender Audioaktivierung", async () => {
  initialState = "suspended";
  let attempts = 0;
  resume = () => {
    attempts++;
    if (attempts === 1) return new Promise<void>(() => {});
    audio.state = "running";
    return Promise.resolve();
  };
  const first = feedback.unlockSound(settings);
  feedback.playFeedback("click", settings);
  await vi.advanceTimersByTimeAsync(100);

  const second = feedback.unlockSound(settings);
  feedback.playFeedback("click", settings);
  await vi.advanceTimersByTimeAsync(0);
  expect(await second).toBe("ready");
  expect(audio.resume).toHaveBeenCalledTimes(2);
  expect(oscillators).toHaveLength(1);

  await vi.advanceTimersByTimeAsync(1000);
  await first;
  expect(oscillators).toHaveLength(1);
});

it.each(["mute", "hidden"])("verwirft wartende Töne bei %s", async (reason) => {
  initialState = "suspended";
  let release!: () => void;
  resume = () =>
    new Promise<void>((resolve) => {
      release = () => {
        audio.state = "running";
        resolve();
      };
    });
  const unlocking = feedback.unlockSound(settings);
  feedback.playFeedback("correct", settings);
  if (reason === "mute") feedback.stopFeedback();
  else Object.assign(document, { visibilityState: "hidden" });
  release();
  await unlocking;
  expect(oscillators).toHaveLength(0);
});

it("begrenzt eine blockierte Aktivierung und spielt alte Signale später nicht nach", async () => {
  initialState = "suspended";
  let release!: () => void;
  resume = () =>
    new Promise<void>((resolve) => {
      release = () => {
        audio.state = "running";
        resolve();
      };
    });
  const unlocking = feedback.unlockSound(settings);
  feedback.playFeedback("start", settings);
  await vi.advanceTimersByTimeAsync(1000);
  expect(await unlocking).toBe("blocked");
  release();
  await Promise.resolve();
  expect(oscillators).toHaveLength(0);
  feedback.playFeedback("next", settings);
  expect(oscillators).toHaveLength(1);
});

it("meldet fehlende oder abgelehnte Audioausgabe ohne Ausnahme", async () => {
  vi.stubGlobal("window", {});
  expect(await feedback.unlockSound(settings)).toBe("unavailable");
  vi.stubGlobal("window", { AudioContext: FakeAudio });
  initialState = "suspended";
  resume = async () => {
    throw new Error("blocked");
  };
  expect(await feedback.unlockSound(settings)).toBe("blocked");
  expect(() => feedback.playFeedback("wrong", settings)).not.toThrow();
  expect(oscillators).toHaveLength(0);
});

it("stoppt laufende Töne und ersetzt einen geschlossenen Audiokontext", async () => {
  await feedback.unlockSound(settings);
  feedback.playFeedback("correct", settings);
  feedback.stopFeedback();
  expect(
    oscillators.every((oscillator) => oscillator.stop.mock.calls.length === 2),
  ).toBe(true);
  const previous = audio;
  previous.state = "closed";
  expect(await feedback.unlockSound(settings)).toBe("ready");
  expect(audio).not.toBe(previous);
});
