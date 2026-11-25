import { useEffect, useRef } from 'react';

/*
  The voice estimate, as the app does it: tap the mic, describe the meal, tap again, and Apple's on-device model
  fills in the numbers. The site can't listen, so it plays back one made-up description instead. The waveform is a
  port of the app's VoiceWaveform and WaveformFeed, fed by a script of syllables rather than a microphone.
*/

export type VoicePhase = 'idle' | 'listening' | 'estimating';

/** What the made-up speaker says, and what the estimate comes back with (MealEstimator's MealGuess). */
export const SAID = 'A chicken burrito and a Diet Coke';
export const GUESS = { name: 'Chicken burrito', calories: 690, protein: 41, emoji: '🌯' };

/* ── The script ─────────────────────────────────────────────── */

// Each word's syllables: 'v' is mostly voiced (low and middle bands), 'f' opens with a burst of hiss or a
// click (high bands) before its vowel. Lengths in seconds; stressed syllables are a little louder.
const WORDS: { text: string; syllables: { kind: 'v' | 'f'; length: number; stress?: boolean }[] }[] = [
  { text: 'A', syllables: [{ kind: 'v', length: 0.1 }] },
  { text: 'chicken', syllables: [{ kind: 'f', length: 0.17, stress: true }, { kind: 'v', length: 0.12 }] },
  {
    text: 'burrito',
    syllables: [{ kind: 'v', length: 0.13 }, { kind: 'v', length: 0.12, stress: true }, { kind: 'f', length: 0.18 }],
  },
  { text: 'and', syllables: [{ kind: 'v', length: 0.15 }] },
  { text: 'a', syllables: [{ kind: 'v', length: 0.07 }] },
  { text: 'Diet', syllables: [{ kind: 'f', length: 0.15, stress: true }, { kind: 'f', length: 0.11 }] },
  { text: 'Coke', syllables: [{ kind: 'f', length: 0.26, stress: true }] },
];

/** Speech starts this long after listening does, as it would with a person. */
const LEAD_IN = 0.32;

interface Syllable {
  start: number;
  length: number;
  kind: 'v' | 'f';
  loudness: number;
  /** Per-bump colour, so no two syllables move the line the same way. */
  tint: number[];
}

// A small deterministic hash, so the waveform looks the same every time without shipping a random seed.
const hash = (a: number, b: number) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const { SYLLABLES, WORD_STARTS, SPEECH_END } = (() => {
  const syllables: Syllable[] = [];
  const wordStarts: number[] = [];
  let t = LEAD_IN;
  WORDS.forEach((word, w) => {
    // A breath between "burrito" and "and".
    if (word.text === 'and') t += 0.14;
    wordStarts.push(t);
    word.syllables.forEach((s, i) => {
      const n = syllables.length;
      syllables.push({
        start: t,
        length: s.length,
        kind: s.kind,
        loudness: (s.stress ? 0.95 : 0.78) + 0.08 * hash(n, w + i),
        tint: Array.from({ length: 8 }, (_, b) => 0.65 + 0.35 * hash(n + 1, b)),
      });
      t += s.length + 0.03;
    });
    t += 0.05;
  });
  return { SYLLABLES: syllables, WORD_STARTS: wordStarts, SPEECH_END: t };
})();

/** The words of SAID, each with the time (in seconds from the start of listening) it's first heard. */
export const SAID_WORDS = WORDS.map((w, i) => ({ text: w.text, at: WORD_STARTS[i] }));
/** When the speaker has finished, in seconds from the start of listening. */
export const SAID_LENGTH = SPEECH_END;

// How strongly each of the eight bumps (in WaveformFeed's order) follows a vowel and a burst. Bumps 2 and 4 follow
// the lowest bands, 0, 6 and 7 the highest.
const VOWEL = [0.15, 0.85, 1, 0.45, 0.95, 0.7, 0.25, 0.1];
const BURST = [0.8, 0.2, 0.15, 0.6, 0.2, 0.35, 0.95, 0.85];

/** How loud each bump's bands are at `t` seconds into listening, 0...1. */
function speechLevels(t: number): number[] {
  const levels = new Array(8).fill(0);
  for (const s of SYLLABLES) {
    const x = (t - s.start) / s.length;
    if (x <= 0 || x >= 1) continue;
    const body = Math.sin(Math.PI * x) ** 0.6 * s.loudness;
    const burst = s.kind === 'f' && x < 0.28 ? (1 - x / 0.28) * s.loudness : 0;
    for (let b = 0; b < 8; b++) {
      levels[b] = Math.min(1, levels[b] + (body * VOWEL[b] + burst * BURST[b]) * s.tint[b]);
    }
  }
  return levels;
}

/* ── WaveformFeed ───────────────────────────────────────────── */

const LAYOUT = [
  { center: 0.1, width: 0.03, speed: 0.55 },
  { center: 0.22, width: 0.04, speed: 0.4 },
  { center: 0.34, width: 0.045, speed: 0.65 },
  { center: 0.45, width: 0.035, speed: 0.45 },
  { center: 0.56, width: 0.045, speed: 0.6 },
  { center: 0.67, width: 0.04, speed: 0.5 },
  { center: 0.78, width: 0.035, speed: 0.7 },
  { center: 0.9, width: 0.03, speed: 0.45 },
];
const DRIFT = 0.04;
const SHARED_LOUDNESS = 0.2;

interface Bump {
  center: number;
  width: number;
  height: number;
}

class Feed {
  heights = LAYOUT.map(() => 0);
  phases = LAYOUT.map((_, i) => i * 1.7);

  /** Advances by `step` seconds. `t` is time into listening; `clock` any running clock, for the breathing. */
  bumps(step: number, t: number, clock: number, phase: VoicePhase): Bump[] {
    let goals: number[];
    if (phase === 'estimating') {
      goals = LAYOUT.map((_, i) => 0.12 + (0.14 * (Math.sin(clock * 3.2 + i * 1.3) + 1)) / 2);
    } else if (phase === 'listening') {
      const levels = speechLevels(t);
      const overall = Math.max(...levels);
      goals = levels.map((own) => SHARED_LOUDNESS * overall + (1 - SHARED_LOUDNESS) * own ** 1.3);
    } else {
      goals = LAYOUT.map(() => 0);
    }

    const rise = 1 - Math.exp(-step / 0.018);
    const fall = 1 - Math.exp(-step / 0.09);
    let loudness = 0;
    this.heights = this.heights.map((h, i) => {
      const next = h + (goals[i] - h) * (goals[i] > h ? rise : fall);
      loudness = Math.max(loudness, next);
      return next;
    });

    return LAYOUT.map((bump, i) => {
      this.phases[i] += step * bump.speed * (1 + 4 * loudness);
      return {
        center: bump.center + DRIFT * Math.sin(this.phases[i]),
        width: bump.width * (0.85 + 0.35 * this.heights[i]),
        height: this.heights[i],
      };
    });
  }
}

/* ── VoiceWaveform ──────────────────────────────────────────── */

// In points, as in InputView: the waveform spans the screen less 28 either side, and draws 110 tall.
export const WAVE_WIDTH = 393 - 2 * 28;
export const WAVE_HEIGHT = 110;
const BAR = 2;
const GAP = 2.5;
const RESTING_OPACITY = 0.3;
const FULL_OPACITY_LEVEL = 0.35;

function draw(ctx: CanvasRenderingContext2D, bumps: Bump[], clock: number) {
  const pitch = BAR + GAP;
  const count = Math.max(1, Math.floor((WAVE_WIDTH + GAP) / pitch));
  const originX = (WAVE_WIDTH - (count * pitch - GAP)) / 2;
  ctx.clearRect(0, 0, WAVE_WIDTH, WAVE_HEIGHT);
  ctx.fillStyle = '#000';
  for (let i = 0; i < count; i++) {
    const position = (i + 0.5) / count;
    let sum = 0;
    for (const b of bumps) {
      const d = (position - b.center) / b.width;
      sum += b.height * Math.exp(-0.5 * d * d);
    }
    // A slight shimmer bar to bar, so bumps don't look machined.
    const texture = 0.9 + 0.1 * Math.sin(i * 2.3 + clock * 6);
    const level = Math.tanh(sum * 1.3) * texture;
    const height = Math.max(BAR, WAVE_HEIGHT * level);
    const brightness = Math.min(1, level / FULL_OPACITY_LEVEL);
    ctx.globalAlpha = RESTING_OPACITY + (1 - RESTING_OPACITY) * brightness * (2 - brightness);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(originX + i * pitch, (WAVE_HEIGHT - height) / 2, BAR, height, BAR / 2);
    else ctx.rect(originX + i * pitch, (WAVE_HEIGHT - height) / 2, BAR, height);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

interface WaveformProps {
  phase: VoicePhase;
  /** Draws a single frame, partway through the speech, instead of animating (reduced motion). */
  still?: boolean;
}

/**
 * The line of thin bars that stands in for the number while Macro listens: dim dots in silence, swelling while
 * the speaker talks, then breathing on its own while the estimate loads. Mount it when listening starts.
 */
export function VoiceWaveform({ phase, still = false }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    // Sharp at any phone size on any screen: the phone is never shown above 0.8×, so 2.5× covers a 3× display.
    const scale = 2.5;
    canvas.width = WAVE_WIDTH * scale;
    canvas.height = WAVE_HEIGHT * scale;
    ctx.scale(scale, scale);
    const feed = new Feed();

    if (still) {
      // Run the feed up to a moment mid-sentence, then draw that.
      let bumps: Bump[] = [];
      for (let t = 0; t < 1.18; t += 1 / 60) bumps = feed.bumps(1 / 60, t, t, 'listening');
      draw(ctx, bumps, 1.18);
      return;
    }

    let raf = 0;
    let last = performance.now();
    const start = last;
    // Listening time stops counting once the estimate starts, so the speech never replays.
    let heard = 0;
    const frame = (now: number) => {
      const step = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      if (phaseRef.current === 'listening') heard += step;
      draw(ctx, feed.bumps(step, heard, (now - start) / 1000, phaseRef.current), now / 1000);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [still]);

  return <canvas ref={canvasRef} className="ios-wave-canvas" style={{ width: WAVE_WIDTH, height: WAVE_HEIGHT }} />;
}

/* ── Glyphs (SF Symbol stand-ins) ───────────────────────────── */

export function MicGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="6.6" y="1.2" width="6.8" height="11" rx="3.4" fill="currentColor" />
      <path d="M3.9 9.2a6.1 6.1 0 0012.2 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M10 15.4v3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function StopGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1.5" y="1.5" width="13" height="13" rx="3" fill="currentColor" />
    </svg>
  );
}

/** UIActivityIndicatorView: eight spokes, fading round the circle, stepping as it spins. */
export function Spinner() {
  return (
    <svg className="ios-spinner" width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={i}
          x="9.9"
          y="1.6"
          width="2.2"
          height="5.8"
          rx="1.1"
          fill="currentColor"
          opacity={0.25 + (0.75 * i) / 7}
          transform={`rotate(${i * 45} 11 11)`}
        />
      ))}
    </svg>
  );
}
