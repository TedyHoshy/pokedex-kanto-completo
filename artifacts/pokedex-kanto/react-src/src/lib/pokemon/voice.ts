import { isMuted } from "./sfx";

function pickSpanishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.toLowerCase().startsWith("es-mx")) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("es-es")) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("es")) ??
    null
  );
}

export function speakDex(text: string) {
  if (typeof window === "undefined") return;
  if (isMuted()) return;
  const synth = window.speechSynthesis;
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
  if (typeof window === "undefined") return;
  window.speechSynthesis.cancel();
}

export function warmupVoices() {
  if (typeof window === "undefined") return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    window.speechSynthesis.getVoices();
  });
}
