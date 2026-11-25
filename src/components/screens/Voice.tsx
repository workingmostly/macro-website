import { useEffect, useRef } from 'react';
import { SCALES } from './scales';

/*
  The voice estimate, as the app does it. Hold the plus on Today and it opens into a bar along the bottom that
  listens while held, then logs the meal straight away. On the entry screen the mic sits where the plus was: a tap
  opens the same bar, a tap on the bar finishes, and the number on screen glides to the estimate.

  The site can't listen, so each demo plays back a made-up sentence. The bar's waveform is a port of the app's
  VoiceWaveform and WaveformFeed, fed by a script of syllables rather than a microphone.
*/

export type VoicePhase = 'idle' | 'listening' | 'estimating';

export interface Guess {
  name: string;
  calories: number;
  protein: number;
  emoji: string;
}

/* ── Scripts ────────────────────────────────────────────────── */

interface Syllable {
  start: number;
  length: number;
  /** 'f' opens with a burst of hiss or a click (high bands) before its vowel; 'v' is voiced throughout. */
  kind: 'v' | 'f';
  loudness: number;
  /** Per-bump colour, so no two syllables move the line the same way. */
  tint: number[];
}

export interface Script {
  said: string;
  /** Each word, with the time (seconds from the start of listening) it's first heard. */
  words: { text: string; at: number }[];
  /** When the speaker has finished, in seconds from the start of listening. */
  length: number;
  syllables: Syllable[];
  guess: Guess;
}

// A small deterministic hash, so the waveform looks the same every time without shipping a random seed.
const hash = (a: number, b: number) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Turns a sentence into rough syllables: one per vowel group, a hiss or click wherever a word opens with one. */
function makeScript(said: string, guess: Guess): Script {
  const syllables: Syllable[] = [];
  const words: Script['words'] = [];
  let t = 0.32; // Speech starts a moment after listening does, as it would with a person.
  said.split(' ').forEach((text, w) => {
    const lower = text.toLowerCase();
    // A breath before "and".
    if (lower === 'and') t += 0.14;
    words.push({ text, at: t });
    let count = (lower.match(/[aeiouy]+/g) ?? ['']).length;
    if (count > 1 && lower.endsWith('e')) count--;
    const each = Math.min(0.24, Math.max(0.09, (0.07 + 0.026 * lower.length) / count));
    for (let i = 0; i < count; i++) {
      const n = syllables.length;
      const opensHard = i === 0 && /^(ch|sh|th|[sckptfdbg])/.test(lower);
      syllables.push({
        start: t,
        length: each,
        kind: opensHard ? 'f' : 'v',
        loudness: (i === 0 && lower.length > 3 ? 0.95 : 0.78) + 0.08 * hash(n, w + i),
        tint: Array.from({ length: 8 }, (_, b) => 0.65 + 0.35 * hash(n + 1, b)),
      });
      t += each + 0.03;
    }
    t += 0.05;
  });
  return { said, words, length: t, syllables, guess };
}

/** The voice card's lunch, described on the entry screen. */
export const BURRITO = makeScript('A chicken burrito and a Diet Coke', {
  name: 'Chicken burrito',
  calories: 690,
  protein: 41,
  emoji: '🌯',
});

/** The hero's pudding, said into the plus on Today. */
export const ICE_CREAM = makeScript('Two scoops of vanilla ice cream', {
  name: 'Vanilla ice cream',
  calories: 270,
  protein: 5,
  emoji: '🍨',
});

// How strongly each of the eight bumps (in WaveformFeed's order) follows a vowel and a burst. Bumps 2 and 4 follow
// the lowest bands, 0, 6 and 7 the highest.
const VOWEL = [0.15, 0.85, 1, 0.45, 0.95, 0.7, 0.25, 0.1];
const BURST = [0.8, 0.2, 0.15, 0.6, 0.2, 0.35, 0.95, 0.85];

/** How loud each bump's bands are at `t` seconds into listening, 0...1. */
function speechLevels(script: Script, t: number): number[] {
  const levels = new Array(8).fill(0);
  for (const s of script.syllables) {
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

interface Bump {
  center: number;
  width: number;
  height: number;
}

class Feed {
  heights = LAYOUT.map(() => 0);
  phases = LAYOUT.map((_, i) => i * 1.7);

  /** Advances by `step` seconds. `t` is time into listening; `clock` any running clock, for the breathing. */
  bumps(step: number, t: number, clock: number, mode: BarMode, script: Script): Bump[] {
    let goals: number[];
    if (mode === 'estimating') {
      goals = LAYOUT.map((_, i) => 0.12 + (0.14 * (Math.sin(clock * 3.2 + i * 1.3) + 1)) / 2);
    } else if (mode === 'listening') {
      const levels = speechLevels(script, t);
      const overall = Math.max(...levels);
      goals = levels.map((own) => 0.2 * overall + 0.8 * own ** 1.3);
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
        center: bump.center + 0.04 * Math.sin(this.phases[i]),
        width: bump.width * (0.85 + 0.35 * this.heights[i]),
        height: this.heights[i],
      };
    });
  }
}

/* ── The bar's waveform ─────────────────────────────────────── */

// As in VoiceHoldButton: 30 tall, filling whatever the label leaves.
const WAVE_HEIGHT = 30;
const BAR = 2;
const GAP = 2.5;

function draw(ctx: CanvasRenderingContext2D, width: number, bumps: Bump[], clock: number) {
  const pitch = BAR + GAP;
  const count = Math.max(1, Math.floor((width + GAP) / pitch));
  const originX = (width - (count * pitch - GAP)) / 2;
  ctx.clearRect(0, 0, width, WAVE_HEIGHT);
  ctx.fillStyle = '#fff';
  for (let i = 0; i < count; i++) {
    const position = (i + 0.5) / count;
    let sum = 0;
    for (const b of bumps) {
      const d = (position - b.center) / b.width;
      sum += b.height * Math.exp(-0.5 * d * d);
    }
    // A slight shimmer bar to bar, so bumps don't look machined.
    const level = Math.tanh(sum * 1.3) * (0.9 + 0.1 * Math.sin(i * 2.3 + clock * 6));
    const height = Math.max(BAR, WAVE_HEIGHT * level);
    const brightness = Math.min(1, level / 0.35);
    // Resting dots at 0.3, bars brightening to full as they grow.
    ctx.globalAlpha = 0.3 + 0.7 * brightness * (2 - brightness);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(originX + i * pitch, (WAVE_HEIGHT - height) / 2, BAR, height, BAR / 2);
    else ctx.rect(originX + i * pitch, (WAVE_HEIGHT - height) / 2, BAR, height);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * Dim dots in silence, swelling while the speaker talks, then breathing on its own while the estimate loads. Its
 * speech starts when it mounts, so mount it as listening starts.
 */
function BarWaveform({ mode, script, still }: { mode: BarMode; script: Script; still: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    // The phone is drawn at up to 0.8× on screens up to 3×, so 2.5 backing pixels a point stays sharp.
    const scale = 2.5;
    let width = 0;
    const size = () => {
      // Layout width, in screen points: the phone's scale is a transform, which offsetWidth ignores.
      width = canvas.parentElement?.offsetWidth ?? 0;
      canvas.width = width * scale;
      canvas.height = WAVE_HEIGHT * scale;
      canvas.style.width = `${width}px`;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
    };
    size();
    const resize = new ResizeObserver(size);
    if (canvas.parentElement) resize.observe(canvas.parentElement);
    const feed = new Feed();

    if (still) {
      // Run the feed to a moment mid-sentence, then draw that.
      let bumps: Bump[] = [];
      for (let t = 0; t < 1.05; t += 1 / 60) bumps = feed.bumps(1 / 60, t, t, 'listening', script);
      draw(ctx, width, bumps, 1.05);
      return () => resize.disconnect();
    }

    let raf = 0;
    let last = performance.now();
    const start = last;
    // Listening time stops counting once the estimate starts, so the speech never replays.
    let heard = 0;
    const frame = (now: number) => {
      const step = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      if (modeRef.current === 'listening') heard += step;
      draw(ctx, width, feed.bumps(step, heard, (now - start) / 1000, modeRef.current, script), now / 1000);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
    };
  }, [script, still]);

  return <canvas ref={canvasRef} className="block" style={{ height: WAVE_HEIGHT }} aria-hidden="true" />;
}

/* ── The voice bar ──────────────────────────────────────────── */

export type BarMode = 'starting' | 'listening' | 'estimating' | 'confirmed';

interface VoiceBarProps {
  mode: BarMode;
  script: Script;
  /** Started by a tap rather than a hold, so a tap on the bar finishes and it shows a stop square. */
  handsFree?: boolean;
  /** Held: "Slide up to cancel" floats above its end, or "Release to cancel" once slid far enough. */
  cancel?: 'slide' | 'armed' | null;
  /** What the bar shows for a moment after the plus has logged a meal. */
  confirmation?: { emoji?: string; title: string; detail?: string } | null;
  stillWave?: boolean;
  onPress?: () => void;
}

/**
 * VoiceHoldButton, opened: a blue glass capsule along the bottom, from 20pt in on the left to where the round
 * button sat on the right, with the round button's icon still at that end.
 */
export function VoiceBar({ mode, script, handsFree = false, cancel = null, confirmation, stillWave = false, onPress }: VoiceBarProps) {
  const armed = cancel === 'armed';
  const icon = armed ? (
    <XGlyph />
  ) : mode === 'starting' || mode === 'estimating' ? (
    <Spinner />
  ) : mode === 'confirmed' ? (
    <CheckGlyph />
  ) : handsFree ? (
    <StopGlyph />
  ) : (
    <span className="ios-pulse">
      <MicGlyph size={22} />
    </span>
  );

  return (
    <>
      {/* Beside the bar rather than in it, since the bar clips to its capsule as it opens. */}
      {cancel && (
        <span className="ios-voice-cancel" data-armed={armed} aria-hidden="true">
          {armed ? <XGlyph size={11} /> : <ChevronUpGlyph />}
          {armed ? 'Release to cancel' : 'Slide up to cancel'}
        </span>
      )}
      <div
        className="ios-voice-bar"
        data-armed={armed}
        role={onPress ? 'button' : undefined}
        tabIndex={onPress ? 0 : undefined}
        aria-label={onPress ? 'Stop and estimate' : undefined}
        onPointerDown={onPress ? (ev) => ev.stopPropagation() : undefined}
        onClick={onPress}
        onKeyDown={
          onPress
            ? (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                  ev.preventDefault();
                  onPress();
                }
              }
            : undefined
        }
      >
        <div className="ios-voice-bar-content" key={mode === 'confirmed' ? 'done' : 'voice'}>
          {mode === 'confirmed' && confirmation ? (
            <>
              {confirmation.emoji && <span className="emoji">{confirmation.emoji}</span>}
              <b>{confirmation.title}</b>
              {confirmation.detail && <span className="detail">{confirmation.detail}</span>}
            </>
          ) : (
            <>
              <b className={mode === 'starting' ? 'opacity-0' : undefined}>
                {mode === 'estimating' ? 'Estimating' : 'Listening'}
              </b>
              <span className={`wave ${mode === 'starting' ? 'opacity-50' : ''}`}>
                <BarWaveform mode={mode} script={script} still={stillWave} />
              </span>
            </>
          )}
        </div>
        <span className="ios-voice-bar-icon">{icon}</span>
      </div>
    </>
  );
}

/** The words of a script, each appearing as it's said. Mount it when listening starts. */
export function Transcript({ script, all = false }: { script: Script; all?: boolean }) {
  return (
    <span>
      {script.words.map((w, i) => (
        <span
          key={`${w.text}-${i}`}
          className={all ? undefined : 'said-word-in'}
          style={all ? undefined : { animationDelay: `${w.at}s` }}
        >
          {i === 0 && '“'}
          {w.text}
          {i < script.words.length - 1 ? ' ' : '”'}
        </span>
      ))}
    </span>
  );
}

/* ── The estimate arriving ──────────────────────────────────── */

/**
 * InputView.autoSlide: the number moves to the estimate the way a finger would, through the same drag gearing,
 * easing in and out over about half a second. Returns the value `elapsed` seconds in, and the glide's length.
 */
export function glide(field: 'calories' | 'protein', from: number, to: number) {
  const scale = SCALES[field];
  const step = field === 'calories' ? 10 : 1;
  const a = scale.position(from);
  const b = scale.position(to);
  const duration = Math.min(0.85, Math.max(0.5, Math.abs(b - a) / 1100));
  return {
    duration,
    at(elapsed: number) {
      const t = Math.min(1, Math.max(0, elapsed / duration));
      if (t >= 1) return to;
      const eased = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
      return Math.max(0, Math.round(scale.value(a + (b - a) * eased) / step) * step);
    },
  };
}

/* ── Glyphs (SF Symbol stand-ins) ───────────────────────────── */

export function MicGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="6.6" y="1.2" width="6.8" height="11" rx="3.4" fill="currentColor" />
      <path d="M3.9 9.2a6.1 6.1 0 0012.2 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M10 15.4v3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function StopGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1.5" y="1.5" width="13" height="13" rx="3" fill="currentColor" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3.5 10.5l4.2 4.2L16.5 5.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

function ChevronUpGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 8l4-4 4 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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
