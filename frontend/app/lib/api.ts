export const API = "http://127.0.0.1:8000";
export const PP_UMBRAL = 60;

export async function fetchJSON(url: string) {
  const r = await fetch(url);
  return r.json();
}

function sanitizeForTTS(text: string): string {
  return text
    .replace(/📍/g, "dirección")
    .replace(/📞/g, "teléfono")
    .replace(/🕒/g, "horarios")
    .replace(/⚠️/g, "atención,")
    .replace(/[✓❌⏳•🎙️💬🔊🔄]/gu, "")
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

let _ttsAudio: HTMLAudioElement | null = null;
let _ttsQueue: string[] = [];
let _isPlaying = false;
let _onAllDone: (() => void) | null = null;

export function stopTTS() {
  _ttsQueue = [];
  _isPlaying = false;
  _onAllDone = null;
  if (_ttsAudio) {
    _ttsAudio.onended = null;
    _ttsAudio.onerror = null;
    _ttsAudio.pause();
    _ttsAudio.src = "";
    _ttsAudio = null;
  }
}

function _advance() {
  _ttsAudio = null;
  if (_ttsQueue.length === 0) {
    _isPlaying = false;
    const cb = _onAllDone;
    _onAllDone = null;
    cb?.();
    return;
  }
  const texto = _ttsQueue.shift()!;
  const audio = new Audio(`${API}/tts?texto=${encodeURIComponent(texto)}`);
  _ttsAudio = audio;
  audio.onended = _advance;
  audio.onerror = _advance;
  audio.play().catch(_advance);
}

export function playTTS(texto: string, onEnded?: () => void) {
  const sanitized = sanitizeForTTS(texto);
  if (!sanitized) { onEnded?.(); return; }
  if (onEnded) _onAllDone = onEnded;
  _ttsQueue.push(sanitized);
  if (!_isPlaying) {
    _isPlaying = true;
    _advance();
  }
}
