import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { InputScreen, Phone, PROTEIN_BLUE, TodayScreen, calorieAccent, type MealGroup } from './screens/ios';
import { TYPICAL_STEPS, TypicalScreen, screenKey, type TypicalFrame } from './screens/Typical';

/*
  The same spag bol logged in a typical tracker and in Macro, played side by side.
  Every step gets the same slot of time on both phones, so nothing here is about speed: Macro is done
  after its second step and waits while the other carries on to its fourteenth, then both sit logged.
*/

const SLOT = 1600;
const HOLD = 4000;
const PUSH_MS = 380;
const N = TYPICAL_STEPS.length;
const LOOP = N * SLOT + HOLD;

// Ballpark numbers for a quarter of the pot. The typical tracker works it out to 471 kcal and 38 g.
const MACRO_STEPS = [
  { field: 'calories' as const, value: 500, caption: 'Drag to 500 kcal' },
  { field: 'protein' as const, value: 35, caption: 'Drag to 35 g protein' },
];
const MACRO_DAY: MealGroup[] = [
  { id: 'b', label: 'Breakfast', time: '8 AM', emojis: ['🥣', '☕'], calories: 410, protein: 32 },
  { id: 'l', label: 'Lunch', time: '1 PM', emojis: ['🥪', '🍎'], calories: 620, protein: 41 },
  { id: 'd', label: 'Dinner', time: '7 PM', emojis: ['🍽️'], calories: 500, protein: 35 },
];

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const within = (p: number, a: number, b: number) => p >= a && p < b;

/* ── Phones ───────────────────────────────────────────────── */

const PHONE = '[--s:0.36] sm:[--s:0.5] md:[--s:0.54] lg:[--s:0.58] xl:[--s:0.62]';
// Crops each phone at about 700 of its 876 points, so the card ends partway down the device.
const STAGE = 'h-[252px] sm:h-[350px] md:h-[378px] lg:h-[406px] xl:h-[434px]';

function TypicalPhone({ index, p, local }: { index: number; p: number; local: number }) {
  const step: TypicalFrame = index < N ? TYPICAL_STEPS[index] : 'done';
  const prev: TypicalFrame = index === 0 ? 'done' : TYPICAL_STEPS[index - 1];
  const pushing = local < PUSH_MS && screenKey(prev) !== screenKey(step);

  return (
    <Phone className={PHONE} time="19:30">
      {pushing && (
        <div key={`out-${screenKey(prev)}`} className="tt-layer tt-push-out">
          <TypicalScreen step={prev} p={1} />
        </div>
      )}
      <div key={screenKey(step)} className={`tt-layer ${pushing ? 'tt-push-in' : ''}`}>
        <TypicalScreen step={step} p={p} />
      </div>
    </Phone>
  );
}

function MacroPhone({ index, p }: { index: number; p: number }) {
  if (index >= MACRO_STEPS.length) {
    return (
      <Phone className={PHONE} time="19:30">
        <TodayScreen meals={MACRO_DAY} newId="d" />
      </Phone>
    );
  }

  // Drag up to the number, let go, then tap to confirm.
  const { field, value } = MACRO_STEPS[index];
  const u = ease(clamp((p - 0.1) / 0.55));
  const shown = field === 'calories' ? Math.round((value * u) / 10) * 10 : Math.round(value * u);
  const pressed = within(p, 0.06, 0.7) || within(p, 0.8, 0.88);

  return (
    <Phone className={PHONE} time="19:30">
      <InputScreen field={field} value={shown} stepIndex={index} stepCount={MACRO_STEPS.length} label="Dinner" time="19:30" />
      <div
        className="ghost-touch"
        data-pressed={pressed}
        style={{ left: 255, top: 640 - 260 * u, opacity: within(p, 0.02, 0.94) ? 1 : 0 }}
      />
    </Phone>
  );
}

/* ── Card ─────────────────────────────────────────────────── */

interface CardProps {
  id: string;
  name: string;
  icon: ReactNode;
  steps: string[];
  /** Current step, or steps.length once logged. */
  index: number;
  /** How far through the current step, 0–1. */
  progress: number;
  dark?: boolean;
  segment: (i: number) => string;
  glow?: string;
  children: ReactNode;
}

function Card({ id, name, icon, steps, index, progress, dark = false, segment, glow, children }: CardProps) {
  const total = steps.length;
  const done = index >= total;
  const caption = done ? `Logged in ${total} steps.` : steps[index];

  return (
    <article
      aria-labelledby={id}
      className={`relative flex flex-col overflow-hidden rounded-[1.75rem] px-4 pt-5 sm:rounded-card sm:px-8 sm:pt-8 lg:px-10 lg:pt-10 ${
        dark ? 'bg-night text-white' : 'bg-surface'
      }`}
    >
      {glow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-20%] left-1/2 h-[60%] w-[80%] -translate-x-1/2 rounded-full opacity-30 blur-[80px] transition-[background-color] duration-700"
          style={{ backgroundColor: glow }}
        />
      )}

      <div className="relative flex h-9 items-center gap-2.5 sm:h-12 sm:gap-3.5">
        {icon}
        <h3 id={id} className="font-display text-[15px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-xl lg:text-2xl">
          <span aria-hidden="true">{name}</span>
          <span className="sr-only">{`${name}, ${total} steps`}</span>
        </h3>
      </div>
      <ol className="sr-only">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>

      <div aria-hidden="true" className="relative">
        <div className="mt-5 flex gap-[3px] sm:mt-8 sm:gap-1">
          {steps.map((s, i) => {
            const fill = done || i < index ? 1 : i === index ? progress : 0;
            return (
              <span
                key={s}
                className={`relative h-[3px] flex-1 overflow-hidden rounded-full sm:h-1 ${dark ? 'bg-white/15' : 'bg-ink/10'}`}
              >
                <span className={`absolute inset-y-0 left-0 rounded-full ${segment(i)}`} style={{ width: `${fill * 100}%` }} />
              </span>
            );
          })}
        </div>
        <p
          className={`mt-3 flex items-center gap-1.5 text-xs font-medium tabular-nums sm:mt-4 sm:text-sm ${
            dark ? 'text-white/55' : 'text-muted'
          }`}
        >
          {done ? (
            <>
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none" className="text-ios-green">
                <path d="M1 5.2l3.3 3.3L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Done
            </>
          ) : (
            `Step ${index + 1} of ${total}`
          )}
        </p>
        <p
          key={caption}
          className="cd-caption mt-1 h-[2.2em] font-display text-[15px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-xl lg:text-[1.625rem]"
        >
          {caption}
        </p>
      </div>

      <div aria-hidden="true" className={`relative mt-3 flex justify-center sm:mt-6 ${STAGE}`}>
        {children}
      </div>
    </article>
  );
}

/* ── Section ──────────────────────────────────────────────── */

export default function CompareDemo() {
  // Server-rendered at the end, both logged, so without JavaScript it's a still of the result.
  const [t, setT] = useState(LOOP - 1);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tRef = useRef(t);

  useEffect(() => {
    setReady(true);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      tRef.current = 0;
      setT(0);
      setPlaying(true);
    }
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !inView) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      tRef.current = (tRef.current + Math.min(100, now - last)) % LOOP;
      last = now;
      setT(tRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, inView]);

  const slot = Math.floor(t / SLOT);
  const local = t - slot * SLOT;
  const p = local / SLOT;
  const typical = Math.min(slot, N);
  const macro = Math.min(slot, MACRO_STEPS.length);
  const glow = macro === 1 ? PROTEIN_BLUE : calorieAccent(MACRO_STEPS[0].value);

  return (
    <div ref={rootRef}>
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <Card
          id="compare-typical"
          name="A typical tracker"
          icon={
            <span className="grid size-9 shrink-0 place-items-center rounded-[22%] bg-white text-ink/35 ring-1 ring-black/[0.06] sm:size-12">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-4 sm:size-5">
                <circle cx="6.8" cy="6.8" r="5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M10.6 10.6l3.6 3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
          }
          steps={TYPICAL_STEPS.map((s) => s.caption)}
          index={typical}
          progress={p}
          segment={() => 'bg-ink/70'}
        >
          <TypicalPhone index={typical} p={p} local={local} />
        </Card>

        <Card
          id="compare-macro"
          name="Macro"
          icon={
            <img
              src="/icon.png"
              alt=""
              width="48"
              height="48"
              className="size-9 shrink-0 rounded-[22%] ring-1 ring-white/15 sm:size-12"
            />
          }
          steps={MACRO_STEPS.map((s) => s.caption)}
          index={macro}
          progress={p}
          dark
          segment={(i) => (i === 0 ? 'bg-ios-green' : 'bg-ios-blue')}
          glow={glow}
        >
          <MacroPhone index={macro} p={p} />
        </Card>
      </div>

      <div className="mt-5 flex justify-center sm:mt-6">
        <button
          type="button"
          onClick={() => setPlaying((v) => !v)}
          aria-label={playing ? 'Pause the comparison' : 'Play the comparison'}
          className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ios-blue/45 ${
            ready ? '' : 'invisible'
          }`}
        >
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <rect x="2" y="1.5" width="2.6" height="9" rx="0.8" fill="currentColor" />
              <rect x="7.4" y="1.5" width="2.6" height="9" rx="0.8" fill="currentColor" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M3 1.8v8.4c0 .5.6.8 1 .5l6.3-4.2a.6.6 0 000-1L4 1.3c-.4-.3-1 0-1 .5z" fill="currentColor" />
            </svg>
          )}
          {playing ? 'Pause' : 'Play'}
        </button>
      </div>
    </div>
  );
}
