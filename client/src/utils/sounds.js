/**
 * Lightweight sound effects using the Web Audio API.
 * No external audio files required — all sounds are generated
 * programmatically as short synthesized tones.
 */

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  // Resume if suspended (browsers require user gesture first).
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a short sine-wave tone.
 * @param {number} freq  Frequency in Hz
 * @param {number} duration  Seconds
 * @param {number} volume  0–1
 * @param {string} type  OscillatorNode type
 */
function playTone(freq, duration = 0.1, volume = 0.15, type = "sine") {
  const ctx = getCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

/** Soft click for buttons / toggles */
export function playClick() {
  const ctx = getCtx();
  if (!ctx) return;
  // A very short broadband tick — like a tiny tap
  const bufferSize = ctx.sampleRate * 0.04;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

/** Soft swoosh when sending a message */
export function playSend() {
  playTone(520, 0.08, 0.1);
  setTimeout(() => playTone(680, 0.06, 0.08), 40);
}

/** Pleasant chime when the AI responds */
export function playResponse() {
  playTone(523, 0.12, 0.12, "sine");
  setTimeout(() => playTone(659, 0.12, 0.1, "sine"), 100);
  setTimeout(() => playTone(784, 0.18, 0.08, "sine"), 200);
}

/** Brief error buzz */
export function playError() {
  playTone(220, 0.15, 0.1, "sawtooth");
  setTimeout(() => playTone(180, 0.2, 0.08, "sawtooth"), 100);
}

/** Upload complete ping */
export function playSuccess() {
  playTone(660, 0.1, 0.1);
  setTimeout(() => playTone(880, 0.15, 0.08), 80);
}

/** Delete confirmation pop */
export function playDelete() {
  playTone(300, 0.06, 0.08, "triangle");
  setTimeout(() => playTone(200, 0.08, 0.06, "triangle"), 50);
}
