import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { MicGlyph, Spinner, type Script } from '../../../src/components/screens/Voice';
import emojiMap from './emoji.json';

/* ── Time ───────────────────────────────────────────────────── */

export const TOTAL = 9;
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** How far `t` is through [a, b], 0...1. */
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
export const easeOut = (k: number) => 1 - (1 - k) ** 3;
export const easeIn = (k: number) => k * k * k;
/** 1 inside [a, b], easing in and out over `edge` seconds at each end. */
export const within = (t: number, a: number, b: number, edge = 0.2) =>
  Math.min(easeInOut(prog(t, a, a + edge)), 1 - easeInOut(prog(t, b - edge, b)));

/* ── Emoji ──────────────────────────────────────────────────── */

/**
 * Apple's artwork (emoji-data, 64px), standing in for the character wherever the site's components take an emoji,
 * so the phones look like an iPhone rather than Linux.
 */
export function em(e: string): string {
  const file = (emojiMap as Record<string, string>)[e];
  if (!file) return e;
  return (<img className="emoji-img" src={`/emoji/${file}`} alt={e} draggable={false} />) as unknown as string;
}

/* ── Chrome ─────────────────────────────────────────────────── */

/** Top of every slide: what it's about, and where it sits in the post. */
export function Header({ topic, n, dark = false }: { topic: string; n: number; dark?: boolean }) {
  return (
    <div className="hdr" data-dark={dark}>
      <span>
        <b>Macro</b>
        <i>/</i>
        {topic}
      </span>
      <span>
        {String(n).padStart(2, '0')} / {String(TOTAL).padStart(2, '0')}
      </span>
    </div>
  );
}

/* ── A finger on the glass ──────────────────────────────────── */

export interface Finger {
  x: number;
  y: number;
  /** 0...1: on screen. */
  shown: number;
  /** 0...1: pressing the glass. */
  press: number;
}

/** The site's ghost touch, with its fade and press worked out from `t` instead of CSS transitions. */
export function Touch({ f }: { f: Finger }) {
  if (f.shown <= 0.002) return null;
  return (
    <div
      className="ghost-touch"
      style={{
        left: f.x,
        top: f.y,
        opacity: f.shown,
        transform: `scale(${1 - 0.18 * f.press})`,
        background: `rgb(0 0 0 / ${0.14 + 0.08 * f.press})`,
      }}
    />
  );
}

/**
 * A tap at (x, y) at `at` seconds: the ring fades in over the spot, presses briefly, and fades out.
 * Returns null outside its window so taps can be chained with ??.
 */
export function tapAt(t: number, at: number, x: number, y: number): Finger | null {
  if (t < at - 0.45 || t > at + 0.4) return null;
  return {
    x,
    y,
    shown: within(t, at - 0.45, at + 0.4, 0.2),
    press: within(t, at - 0.1, at + 0.06, 0.05),
  };
}

/* ── The voice bar, frame by frame ──────────────────────────── */

// A port of the site's Voice.tsx waveform (itself a port of the app's VoiceWaveform and WaveformFeed), stepped from
// a fixed start to `t` on every frame instead of running on the display's clock, so each frame is reproducible.

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
const VOWEL = [0.15, 0.85, 1, 0.45, 0.95, 0.7, 0.25, 0.1];
const BURST = [0.8, 0.2, 0.15, 0.6, 0.2, 0.35, 0.95, 0.85];

type WaveMode = 'starting' | 'listening' | 'estimating';
interface Bump {
  center: number;
  width: number;
  height: number;
}

function speechLevels(script: Script, t: number) {
  const levels = new Array(8).fill(0);
  for (const s of script.syllables) {
    const x = (t - s.start) / s.length;
    if (x <= 0 || x >= 1) continue;
    const body = Math.sin(Math.PI * x) ** 0.6 * s.loudness;
    const burst = s.kind === 'f' && x < 0.28 ? (1 - x / 0.28) * s.loudness : 0;
    for (let b = 0; b < 8; b++) levels[b] = Math.min(1, levels[b] + (body * VOWEL[b] + burst * BURST[b]) * s.tint[b]);
  }
  return levels;
}

function waveAt(script: Script, elapsed: number, listenFor: number, estimateFrom: number): Bump[] {
  const heights = LAYOUT.map(() => 0);
  const phases = LAYOUT.map((_, i) => i * 1.7);
  const step = 1 / 60;
  let heard = 0;
  let bumps: Bump[] = LAYOUT.map((b) => ({ center: b.center, width: b.width, height: 0 }));
  for (let clock = 0; clock < elapsed; clock += step) {
    const mode: WaveMode = clock < listenFor ? 'starting' : clock < estimateFrom ? 'listening' : 'estimating';
    if (mode === 'listening') heard += step;
    let goals: number[];
    if (mode === 'estimating') goals = LAYOUT.map((_, i) => 0.12 + (0.14 * (Math.sin(clock * 3.2 + i * 1.3) + 1)) / 2);
    else if (mode === 'listening') {
      const levels = speechLevels(script, heard);
      const overall = Math.max(...levels);
      goals = levels.map((own) => 0.2 * overall + 0.8 * own ** 1.3);
    } else goals = LAYOUT.map(() => 0);
    const rise = 1 - Math.exp(-step / 0.018);
    const fall = 1 - Math.exp(-step / 0.09);
    let loudness = 0;
    for (let i = 0; i < 8; i++) {
      heights[i] += (goals[i] - heights[i]) * (goals[i] > heights[i] ? rise : fall);
      loudness = Math.max(loudness, heights[i]);
    }
    bumps = LAYOUT.map((b, i) => {
      phases[i] += step * b.speed * (1 + 4 * loudness);
      return { center: b.center + 0.04 * Math.sin(phases[i]), width: b.width * (0.85 + 0.35 * heights[i]), height: heights[i] };
    });
  }
  return bumps;
}

const WAVE_HEIGHT = 30;

function Wave({ bumps, clock }: { bumps: Bump[]; clock: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const scale = 3; // backing pixels per point: the phones are drawn at up to about 1.6x
    const width = canvas.parentElement?.offsetWidth ?? 0;
    if (canvas.width !== Math.round(width * scale)) {
      canvas.width = Math.round(width * scale);
      canvas.height = WAVE_HEIGHT * scale;
      canvas.style.width = `${width}px`;
    }
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, width, WAVE_HEIGHT);
    ctx.fillStyle = '#fff';
    const pitch = 4.5;
    const count = Math.max(1, Math.floor((width + 2.5) / pitch));
    const originX = (width - (count * pitch - 2.5)) / 2;
    for (let i = 0; i < count; i++) {
      const position = (i + 0.5) / count;
      let sum = 0;
      for (const b of bumps) {
        const d = (position - b.center) / b.width;
        sum += b.height * Math.exp(-0.5 * d * d);
      }
      const level = Math.tanh(sum * 1.3) * (0.9 + 0.1 * Math.sin(i * 2.3 + clock * 6));
      const height = Math.max(2, WAVE_HEIGHT * level);
      const brightness = Math.min(1, level / 0.35);
      ctx.globalAlpha = 0.3 + 0.7 * brightness * (2 - brightness);
      ctx.beginPath();
      ctx.roundRect(originX + i * pitch, (WAVE_HEIGHT - height) / 2, 2, height, 1);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
  return <canvas ref={ref} className="block" style={{ height: WAVE_HEIGHT }} />;
}

export interface BarTimes {
  /** The plus (or mic) opens into the bar. */
  open: number;
  /** It starts listening (the plus is held 0.2s first). */
  listen: number;
  /** The finger lets go: it estimates. */
  estimate: number;
  /** The estimate is in. */
  confirm: number;
  /** The bar closes back into the plus. */
  close: number;
}

/** VoiceHoldButton, opened, at time `t`: the site's .ios-voice-bar, with every animation worked out from `t`. */
export function VoiceBarFrame({
  t,
  times,
  script,
  handsFree = false,
  confirmation,
}: {
  t: number;
  times: BarTimes;
  script: Script;
  handsFree?: boolean;
  confirmation?: { emoji: string; title: string; detail: string };
}) {
  if (t < times.open || t > times.close + 0.3) return null;
  const opening = easeOut(prog(t, times.open, times.open + 0.34));
  const closing = easeInOut(prog(t, times.close, times.close + 0.3));
  const open = opening * (1 - closing);
  const mode = t < times.listen ? 'starting' : t < times.estimate ? 'listening' : t < times.confirm ? 'estimating' : 'confirmed';
  const contentIn = mode === 'confirmed' ? prog(t, times.confirm, times.confirm + 0.2) : prog(t, times.open + 0.09, times.open + 0.29);

  let icon: ReactNode;
  if (mode === 'starting' || mode === 'estimating') {
    // UIActivityIndicatorView: steps round in eighths, a turn every 0.8s.
    icon = (
      <span style={{ display: 'grid', transform: `rotate(${(Math.floor(t / 0.1) % 8) * 45}deg)` }}>
        <Spinner />
      </span>
    );
  } else if (mode === 'confirmed') {
    icon = (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3.5 10.5l4.2 4.2L16.5 5.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  } else if (handsFree) {
    icon = (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <rect x="1.5" y="1.5" width="13" height="13" rx="3" fill="currentColor" />
      </svg>
    );
  } else {
    // The held mic's .symbolEffect(.pulse).
    const pulse = 0.5 + 0.5 * Math.cos(((t - times.listen) / 1.1) * Math.PI * 2);
    icon = (
      <span style={{ display: 'grid', opacity: 0.45 + 0.55 * pulse }}>
        <MicGlyph size={22} />
      </span>
    );
  }

  const elapsed = t - times.open;
  return (
    <div
      className="ios-voice-bar"
      style={{ clipPath: `inset(0 0 0 calc((100% - 58px) * ${(1 - open).toFixed(4)}) round 29px)` }}
    >
      <div className="ios-voice-bar-content" style={{ opacity: contentIn }}>
        {mode === 'confirmed' && confirmation ? (
          <>
            <span className="emoji">{em(confirmation.emoji)}</span>
            <b>{confirmation.title}</b>
            <span className="detail">{confirmation.detail}</span>
          </>
        ) : (
          <>
            <b style={{ opacity: mode === 'starting' ? 0 : 1 }}>{mode === 'estimating' ? 'Estimating' : 'Listening'}</b>
            <span className="wave" style={{ opacity: mode === 'starting' ? 0.5 : 1 }}>
              <Wave
                bumps={waveAt(script, elapsed, times.listen - times.open, times.estimate - times.open)}
                clock={elapsed}
              />
            </span>
          </>
        )}
      </div>
      <span className="ios-voice-bar-icon">{icon}</span>
    </div>
  );
}

/** The words of a script, each fading in as it's said `heard` seconds into listening. */
export function Words({ script, heard }: { script: Script; heard: number }) {
  return (
    <>
      {script.words.map((w, i) => (
        <span key={i} style={{ opacity: easeOut(prog(heard, w.at, w.at + 0.18)) }}>
          {i === 0 && '“'}
          {w.text}
          {i < script.words.length - 1 ? ' ' : '”'}
        </span>
      ))}
    </>
  );
}

/* ── Layout ─────────────────────────────────────────────────── */

/** Absolutely positioned box, for laying slides out on the 1080 × 1440 canvas. */
export function At({ x, y, w, h, children, style, className }: { x: number; y: number; w?: number; h?: number; children: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <div className={className} style={{ position: 'absolute', left: x, top: y, width: w, height: h, ...style }}>
      {children}
    </div>
  );
}
