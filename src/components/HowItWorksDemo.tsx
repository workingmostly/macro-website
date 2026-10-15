import { useEffect, useRef, useState } from 'react';
import { InputScreen, Phone, TodayScreen, type MealGroup } from './screens/ios';

/*
  How it works, played out across the three cards in turn: one drag up for calories, one for protein, then the meal
  dropping into Today with carbs and fat estimated. It loops while on screen. Server-rendered at the end, so without
  JavaScript, or with reduced motion, each card shows its finished state.
*/

const STEPS = [
  {
    title: 'Drag your calories',
    body: 'Drag anywhere on the screen: up for more, down for less. The colour warms from green towards red as the meal gets bigger.',
    tint: 'bg-green-tint',
    glow: 'rgb(52 199 89 / 0.28)',
  },
  {
    title: 'Drag your protein',
    body: "Tap to confirm, then do the same for protein. The slider is finest where most meals land, so it's easy to be about right.",
    tint: 'bg-blue-tint',
    glow: 'rgb(0 122 255 / 0.22)',
  },
  {
    title: 'We do the rest',
    body: 'Macro does the maths. Carbs and fat are estimated from the calories left after protein, and the meal drops into your day with everything filled in.',
    tint: 'bg-orange-tint',
    glow: 'rgb(255 149 0 / 0.2)',
  },
];

const CALORIES = 520;
const PROTEIN = 38;
const BREAKFAST: MealGroup = { id: 'b', label: 'Breakfast', time: '8 AM', emojis: ['🥣', '☕'], calories: 410, protein: 32 };
const LUNCH: MealGroup = { id: 'l', label: 'Lunch', time: '1 PM', emojis: ['🥪'], calories: CALORIES, protein: PROTEIN };

// Timeline, in ms: drag calories, tap; drag protein, tap; the meal lands; hold; start again.
const DRAG = 1400;
const TAP = 500;
const LANDS = 2 * (DRAG + TAP);
const LOOP = LANDS + 4200;

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const within = (t: number, a: number, b: number) => t >= a && t < b;

/** One drag and a tap, starting at `start`: the value so far, and where the finger is. */
function drag(t: number, start: number, value: number, round: (v: number) => number) {
  const u = ease(clamp((t - start) / DRAG));
  return {
    shown: round(value * u),
    u,
    touching: within(t, start - 150, start + DRAG + TAP - 100),
    pressed: within(t, start, start + DRAG) || within(t, start + DRAG + 200, start + DRAG + 320),
  };
}

function Touch({ u, show, pressed }: { u: number; show: boolean; pressed: boolean }) {
  return <div className="ghost-touch" data-pressed={pressed} style={{ left: 352, top: 640 - 260 * u, opacity: show ? 1 : 0 }} />;
}

export default function HowItWorksDemo() {
  // Server-rendered at the end of the loop, with every card finished.
  const [t, setT] = useState(LOOP - 1);
  const [inView, setInView] = useState(false);
  const [animate, setAnimate] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tRef = useRef(t);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setAnimate(true);
    tRef.current = 0;
    setT(0);
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!animate || !inView) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      tRef.current = (tRef.current + Math.min(100, Math.max(0, now - last))) % LOOP;
      last = now;
      setT(tRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, inView]);

  const cal = drag(t, 0, CALORIES, (v) => Math.round(v / 10) * 10);
  const pro = drag(t, DRAG + TAP, PROTEIN, Math.round);
  const landed = t >= LANDS;

  return (
    <div ref={rootRef} className="mt-14 grid gap-3 sm:mt-20 sm:gap-4 md:grid-cols-3">
      {STEPS.map((step, i) => (
        <article key={step.title} className="reveal overflow-hidden rounded-card bg-surface" style={{ transitionDelay: `${i * 90}ms` }}>
          <div className={`relative flex h-[400px] justify-center overflow-hidden pt-10 sm:h-[460px] ${step.tint}`}>
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{ background: `radial-gradient(70% 60% at 50% 60%, ${step.glow}, transparent)` }}
            />
            <Phone className="relative [--s:0.58] md:[--s:0.5] lg:[--s:0.6]">
              {i === 0 && (
                <InputScreen field="calories" value={cal.shown} stepIndex={0}>
                  {animate && <Touch u={cal.u} show={cal.touching} pressed={cal.pressed} />}
                </InputScreen>
              )}
              {i === 1 && (
                <InputScreen field="protein" value={pro.shown} stepIndex={1}>
                  {animate && <Touch u={pro.u} show={pro.touching} pressed={pro.pressed} />}
                </InputScreen>
              )}
              {i === 2 && (
                <TodayScreen meals={landed ? [BREAKFAST, LUNCH] : [BREAKFAST]} expanded newId={animate ? 'l' : null} />
              )}
            </Phone>
          </div>
          <div className="p-8 sm:p-10">
            <h3 className="font-display text-2xl font-semibold tracking-[-0.03em] sm:text-[1.75rem]">
              <span className="text-ink/30">{i + 1}.</span> {step.title}
            </h3>
            <p className="mt-3 text-[17px] leading-relaxed text-muted">{step.body}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
