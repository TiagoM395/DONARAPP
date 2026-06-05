export const API = "http://127.0.0.1:8000";
export const PP_UMBRAL = 60;

export async function fetchJSON(url: string) {
  const r = await fetch(url);
  return r.json();
}

let _ttsAudio: HTMLAudioElement | null = null;
export function playTTS(texto: string) {
  if (_ttsAudio) {
    _ttsAudio.pause();
    _ttsAudio.src = "";
    _ttsAudio = null;
  }
  const audio = new Audio(`${API}/tts?texto=${encodeURIComponent(texto)}`);
  _ttsAudio = audio;
  audio.play().catch(() => {});
}
