const SOUND_KEY = "quizzy.sound";

export function isSoundOn(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SOUND_KEY) !== "off";
}

export function setSoundOn(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOUND_KEY, on ? "on" : "off");
}

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type Note = { freq: number; at: number; dur: number; type?: OscillatorType; gain?: number };

function playNotes(notes: Note[]) {
  if (!isSoundOn()) return;
  const audio = getCtx();
  if (!audio) return;
  const now = audio.currentTime;
  for (const note of notes) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = note.type ?? "sine";
    osc.frequency.value = note.freq;
    const start = now + note.at;
    const peak = note.gain ?? 0.16;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + note.dur + 0.05);
  }
}

export const sfx = {
  click: () => playNotes([{ freq: 660, at: 0, dur: 0.09, gain: 0.1 }]),
  tap: () => playNotes([{ freq: 520, at: 0, dur: 0.07, gain: 0.08 }]),
  correct: () =>
    playNotes([
      { freq: 660, at: 0, dur: 0.12 },
      { freq: 880, at: 0.1, dur: 0.16 },
      { freq: 1175, at: 0.22, dur: 0.2 },
    ]),
  wrong: () =>
    playNotes([
      { freq: 300, at: 0, dur: 0.15, type: "triangle" },
      { freq: 190, at: 0.13, dur: 0.22, type: "triangle" },
    ]),
  unlock: () =>
    playNotes([
      { freq: 523, at: 0, dur: 0.14 },
      { freq: 659, at: 0.12, dur: 0.14 },
      { freq: 784, at: 0.24, dur: 0.16 },
      { freq: 1046, at: 0.38, dur: 0.3 },
    ]),
  celebrate: () =>
    playNotes([
      { freq: 523, at: 0, dur: 0.16 },
      { freq: 659, at: 0.14, dur: 0.16 },
      { freq: 784, at: 0.28, dur: 0.16 },
      { freq: 1046, at: 0.42, dur: 0.24 },
      { freq: 1318, at: 0.62, dur: 0.36 },
    ]),
};
