import { isMuted } from "./sfx";

function getSynth(): SpeechSynthesis | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }
  return window.speechSynthesis;
}

function pickSpanishVoice(): SpeechSynthesisVoice | null {
  const synth = getSynth();
  if (!synth) return null;

  const voices = synth.getVoices();
  return (
    voices.find((v) => v.lang.toLowerCase().startsWith("es-mx")) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("es-es")) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("es")) ??
    null
  );
}

export function speakDex(text: string) {
  const synth = getSynth();
  if (!synth || isMuted()) return;

  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "es-ES";
  utter.rate = 0.94;
  utter.pitch = 0.82;
  utter.volume = 0.95;

  const voice = pickSpanishVoice();
  if (voice) utter.voice = voice;

  synth.speak(utter);
}

export function stopSpeak() {
  const synth = getSynth();
  if (!synth) return;

  synth.cancel();
}

export function warmupVoices() {
  const synth = getSynth();
  if (!synth) return;

  synth.getVoices();
  synth.addEventListener("voiceschanged", () => {
    synth.getVoices();
  });
}
