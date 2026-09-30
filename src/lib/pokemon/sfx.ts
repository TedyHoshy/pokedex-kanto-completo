type Note = {
  freq: number;
  at: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
};

let audio: AudioContext | null = null;
let muted = false;
let loopId: number | null = null;
let cryEl: HTMLAudioElement | null = null;

function ctx(): AudioContext {
  if (!audio) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    audio = new AC();
  }
  return audio;
}

export function isMuted() {
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  if (value) stopAll();
  try {
    localStorage.setItem("pk-muted", value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function loadMutePref() {
  try {
    muted = localStorage.getItem("pk-muted") === "1";
  } catch {
    muted = false;
  }
  return muted;
}

export async function unlockAudio() {
  const c = ctx();
  if (c.state === "suspended") await c.resume();
}

function tone(c: AudioContext, n: Note, t0: number) {
  const osc = c.createOscillator();
  const amp = c.createGain();
  const filt = c.createBiquadFilter();
  osc.type = n.type ?? "square";
  osc.frequency.value = n.freq;
  filt.type = "lowpass";
  filt.frequency.value = 2400;
  const g = n.gain ?? 0.07;
  const start = t0 + n.at;
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(g, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + n.dur);
  osc.connect(filt);
  filt.connect(amp);
  amp.connect(c.destination);
  osc.start(start);
  osc.stop(start + n.dur + 0.02);
}

function playNotes(notes: Note[]) {
  if (muted) return;
  const c = ctx();
  if (c.state === "suspended") void c.resume();
  const t0 = c.currentTime + 0.01;
  for (const n of notes) tone(c, n, t0);
}

export function stopLoop() {
  if (loopId != null) {
    window.clearInterval(loopId);
    loopId = null;
  }
}

export function stopCry() {
  if (cryEl) {
    cryEl.pause();
    cryEl = null;
  }
}

export function stopAll() {
  stopLoop();
  stopCry();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function playBoot() {
  playNotes([
    { freq: 196, at: 0, dur: 0.1 },
    { freq: 262, at: 0.1, dur: 0.1 },
    { freq: 330, at: 0.2, dur: 0.1 },
    { freq: 392, at: 0.3, dur: 0.14 },
    { freq: 523, at: 0.44, dur: 0.32, type: "triangle", gain: 0.09 },
  ]);
}

export function playClick() {
  playNotes([{ freq: 880, at: 0, dur: 0.05, type: "square", gain: 0.04 }]);
}

export function playDexOpen() {
  playNotes([
    { freq: 392, at: 0, dur: 0.08 },
    { freq: 523, at: 0.08, dur: 0.08 },
    { freq: 659, at: 0.16, dur: 0.16, type: "triangle" },
  ]);
}

export function playWhoIsThat() {
  playNotes([
    { freq: 294, at: 0, dur: 0.16, type: "triangle", gain: 0.08 },
    { freq: 247, at: 0.18, dur: 0.16, type: "triangle", gain: 0.08 },
    { freq: 330, at: 0.36, dur: 0.18, type: "triangle", gain: 0.08 },
    { freq: 196, at: 0.56, dur: 0.42, type: "triangle", gain: 0.09 },
  ]);
}

export function playQuizLoop() {
  stopLoop();
  if (muted) return;
  const motif = () => {
    playNotes([
      { freq: 220, at: 0, dur: 0.16, type: "triangle", gain: 0.045 },
      { freq: 196, at: 0.2, dur: 0.16, type: "triangle", gain: 0.045 },
      { freq: 247, at: 0.4, dur: 0.2, type: "triangle", gain: 0.05 },
      { freq: 165, at: 0.64, dur: 0.28, type: "triangle", gain: 0.04 },
    ]);
  };
  motif();
  loopId = window.setInterval(motif, 1500);
}

export function playBattleLoop() {
  stopLoop();
  if (muted) return;
  const motif = () => {
    playNotes([
      { freq: 523, at: 0, dur: 0.17, type: "square", gain: 0.028 },
      { freq: 587, at: 0.22, dur: 0.17, type: "square", gain: 0.028 },
      { freq: 659, at: 0.44, dur: 0.17, type: "square", gain: 0.03 },
      { freq: 784, at: 0.66, dur: 0.28, type: "triangle", gain: 0.032 },
      { freq: 698, at: 0.99, dur: 0.17, type: "square", gain: 0.028 },
      { freq: 659, at: 1.21, dur: 0.17, type: "square", gain: 0.028 },
      { freq: 587, at: 1.43, dur: 0.17, type: "square", gain: 0.028 },
      { freq: 523, at: 1.65, dur: 0.3, type: "triangle", gain: 0.032 },
      { freq: 131, at: 0, dur: 0.34, type: "triangle", gain: 0.022 },
      { freq: 196, at: 0.44, dur: 0.34, type: "triangle", gain: 0.022 },
      { freq: 164, at: 0.88, dur: 0.34, type: "triangle", gain: 0.022 },
      { freq: 196, at: 1.32, dur: 0.34, type: "triangle", gain: 0.022 },
      { freq: 131, at: 1.76, dur: 0.34, type: "triangle", gain: 0.022 },
    ]);
  };
  motif();
  loopId = window.setInterval(motif, 2200);
}

export function playBattleDangerLoop() {
  stopLoop();
  if (muted) return;
  const motif = () => {
    playNotes([
      { freq: 659, at: 0, dur: 0.11, type: "square", gain: 0.035 },
      { freq: 659, at: 0.16, dur: 0.11, type: "square", gain: 0.035 },
      { freq: 784, at: 0.32, dur: 0.13, type: "square", gain: 0.038 },
      { freq: 659, at: 0.5, dur: 0.13, type: "square", gain: 0.035 },
      { freq: 523, at: 0.82, dur: 0.11, type: "square", gain: 0.035 },
      { freq: 659, at: 0.98, dur: 0.11, type: "square", gain: 0.035 },
      { freq: 784, at: 1.14, dur: 0.18, type: "triangle", gain: 0.04 },
      { freq: 196, at: 0.82, dur: 0.2, type: "triangle", gain: 0.025 },
    ]);
  };
  motif();
  loopId = window.setInterval(motif, 1650);
}

export function playBattleAttack() {
  playNotes([
    { freq: 220, at: 0, dur: 0.09, type: "sawtooth", gain: 0.04 },
    { freq: 440, at: 0.04, dur: 0.07, type: "square", gain: 0.045 },
    { freq: 880, at: 0.12, dur: 0.09, type: "square", gain: 0.04 },
  ]);
}

export function playBattleHit() {
  playNotes([
    { freq: 196, at: 0, dur: 0.08, type: "square", gain: 0.05 },
    { freq: 110, at: 0.07, dur: 0.14, type: "sawtooth", gain: 0.045 },
  ]);
}

export function playBattleHeal() {
  playNotes([
    { freq: 523, at: 0, dur: 0.1, type: "square", gain: 0.035 },
    { freq: 659, at: 0.12, dur: 0.1, type: "square", gain: 0.035 },
    { freq: 784, at: 0.24, dur: 0.1, type: "square", gain: 0.035 },
    { freq: 1046, at: 0.36, dur: 0.24, type: "triangle", gain: 0.04 },
  ]);
}

export function playBattleFlee() {
  playNotes([
    { freq: 784, at: 0, dur: 0.12, type: "square", gain: 0.035 },
    { freq: 587, at: 0.14, dur: 0.12, type: "square", gain: 0.03 },
    { freq: 392, at: 0.28, dur: 0.18, type: "triangle", gain: 0.028 },
  ]);
}

export function playCorrectSfx() {
  stopLoop();
  playNotes([
    { freq: 523, at: 0, dur: 0.1 },
    { freq: 659, at: 0.1, dur: 0.1 },
    { freq: 784, at: 0.2, dur: 0.12 },
    { freq: 1046, at: 0.32, dur: 0.34, type: "triangle", gain: 0.09 },
  ]);
}

export function playWrongSfx() {
  stopLoop();
  playNotes([
    { freq: 196, at: 0, dur: 0.16, type: "sawtooth", gain: 0.05 },
    { freq: 165, at: 0.14, dur: 0.16, type: "sawtooth", gain: 0.05 },
    { freq: 110, at: 0.28, dur: 0.36, type: "sawtooth", gain: 0.06 },
  ]);
}

export function playCry(url: string) {
  if (muted) return;
  stopCry();
  const el = new Audio(url);
  el.volume = 0.72;
  cryEl = el;
  void el.play().catch(() => {});
}
