function beep(freq: number, duration: number, type: OscillatorType, gain = 0.07) {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new AudioCtx();
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.value = gain;
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start();
  amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.stop(ctx.currentTime + duration);
  osc.onended = () => void ctx.close();
}

export function playCorrectSfx() {
  beep(660, 0.1, "square");
  window.setTimeout(() => beep(990, 0.16, "square"), 90);
}

export function playWrongSfx() {
  beep(196, 0.28, "sawtooth", 0.06);
}
