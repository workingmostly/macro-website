import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import {
  EMOJI_PALETTE,
  InputScreen,
  Phone,
  PROTEIN_BLUE,
  SCALES,
  TodayScreen,
  calorieAccent,
  type MealGroup,
} from './screens/ios';

type Step = 'calories' | 'protein' | 'emoji' | 'today';

/** A mouse covers less ground than a thumb on a real phone, so the web demo gears up a little. */
const GAIN = 1.6;
/** Same as the app: a drag shorter than this still counts as a tap. */
const TAP_SLOP = 6;
/** Left 32% of the screen goes back, like Instagram Stories. */
const BACK_ZONE = 0.32;

const SEED: MealGroup[] = [
  { id: 'b', label: 'Breakfast', time: '8 AM', emojis: ['🥣', '☕'], calories: 410, protein: 32 },
  { id: 'l', label: 'Lunch', time: '1 PM', emojis: ['🥪', '🍎'], calories: 620, protein: 41 },
];

interface Ghost {
  x: number;
  y: number;
  visible: boolean;
  pressed: boolean;
}

interface Drag {
  pointerId: number;
  x0: number;
  y0: number;
  pos0: number;
  scale: number;
  left: number;
  width: number;
  moved: boolean;
}

class Cancelled extends Error {}

const snapCalories = (v: number) => Math.max(0, Math.round(v / 10) * 10);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export default function HeroDemo() {
  const [step, setStep] = useState<Step>('calories');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [emoji, setEmoji] = useState('🍽️');
  const [meals, setMeals] = useState<MealGroup[]>(SEED);
  const [newId, setNewId] = useState<string | null>(null);
  const [auto, setAuto] = useState(true);
  const [inView, setInView] = useState(false);
  const [ghost, setGhostState] = useState<Ghost>({ x: 250, y: 640, visible: false, pressed: false });

  const wrapRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const runRef = useRef(0);
  const ghostRef = useRef(ghost);
  const dragRef = useRef<Drag | null>(null);

  const setGhost = useCallback((next: Partial<Ghost>) => {
    ghostRef.current = { ...ghostRef.current, ...next };
    setGhostState(ghostRef.current);
  }, []);

  /* ── Flow ─────────────────────────────────────────────── */

  const commit = (c: number, p: number, e: string) => {
    const last = meals[meals.length - 1];
    if (last && last.label === 'Dinner') {
      const merged = { ...last, emojis: [...last.emojis, e].slice(-4), calories: last.calories + c, protein: last.protein + p };
      setMeals([...meals.slice(0, -1), merged]);
      setNewId(merged.id);
    } else {
      const id = `d${Date.now()}`;
      setMeals([...meals, { id, label: 'Dinner', time: '7 PM', emojis: [e], calories: c, protein: p }]);
      setNewId(id);
    }
    setStep('today');
  };

  const advance = () => {
    if (step === 'calories') setStep('protein');
    else if (step === 'protein') setStep('emoji');
    else if (step === 'emoji') commit(calories, protein, emoji);
  };

  const back = () => {
    if (step === 'calories') cancel();
    else if (step === 'protein') setStep('calories');
    else if (step === 'emoji') setStep('protein');
  };

  const cancel = () => {
    setNewId(null);
    setStep('today');
  };

  const startNew = () => {
    setCalories(0);
    setProtein(0);
    setEmoji('🍽️');
    setNewId(null);
    setStep('calories');
  };

  /* ── Autoplay ─────────────────────────────────────────── */

  const stopAuto = useCallback(() => {
    if (!auto) return;
    runRef.current++;
    setAuto(false);
    setGhost({ visible: false, pressed: false });
  }, [auto, setGhost]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setAuto(false);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !inView) return;
    const token = ++runRef.current;
    const alive = () => {
      if (token !== runRef.current) throw new Cancelled();
    };
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms)).then(alive);
    const tween = (ms: number, frame: (t: number) => void) =>
      new Promise<void>((resolve, reject) => {
        const start = performance.now();
        const tick = (now: number) => {
          if (token !== runRef.current) return reject(new Cancelled());
          const t = Math.min(1, (now - start) / ms);
          frame(easeInOut(t));
          if (t < 1) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
    const moveTo = (x: number, y: number, ms = 420) => {
      const { x: x0, y: y0 } = ghostRef.current;
      return tween(ms, (t) => setGhost({ x: x0 + (x - x0) * t, y: y0 + (y - y0) * t }));
    };
    const tap = async () => {
      setGhost({ pressed: true });
      await sleep(130);
      setGhost({ pressed: false });
      await sleep(120);
    };

    const play = async () => {
      for (;;) {
        setStep('calories');
        setCalories(0);
        setProtein(0);
        setEmoji('🍽️');
        setMeals(SEED);
        setNewId(null);
        setGhost({ x: 255, y: 660, visible: false, pressed: false });
        await sleep(1000);

        // Drag up to ~520 kcal
        setGhost({ visible: true });
        await sleep(300);
        setGhost({ pressed: true });
        await sleep(120);
        await tween(1900, (t) => {
          setCalories(snapCalories(520 * t));
          setGhost({ y: 660 - 300 * t });
        });
        await sleep(220);
        setGhost({ pressed: false });
        await sleep(500);
        await tap();
        setStep('protein');
        await sleep(450);

        // Drag up to 38 g
        await moveTo(255, 660);
        setGhost({ pressed: true });
        await sleep(120);
        await tween(1500, (t) => {
          setProtein(Math.round(38 * t));
          setGhost({ y: 660 - 260 * t });
        });
        await sleep(220);
        setGhost({ pressed: false });
        await sleep(450);
        await tap();
        setStep('emoji');
        await sleep(500);

        // Pick sushi, then confirm
        await moveTo(107, 712, 520);
        await sleep(120);
        await tap();
        setEmoji('🍣');
        await sleep(450);
        await moveTo(270, 420, 480);
        await tap();
        setMeals([...SEED, { id: 'auto', label: 'Dinner', time: '7 PM', emojis: ['🍣'], calories: 520, protein: 38 }]);
        setNewId('auto');
        setStep('today');
        setGhost({ visible: false });
        await sleep(4200);
      }
    };

    play().catch((err) => {
      if (!(err instanceof Cancelled)) throw err;
    });
    return () => {
      runRef.current++;
    };
  }, [auto, inView, setGhost]);

  /* ── Direct manipulation ──────────────────────────────── */

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    stopAuto();
    if (step === 'today' || !screenRef.current) return;
    const rect = screenRef.current.getBoundingClientRect();
    const value = step === 'calories' ? calories : protein;
    dragRef.current = {
      pointerId: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      pos0: step === 'emoji' ? 0 : SCALES[step].position(value),
      scale: rect.width / 393,
      left: rect.left,
      width: rect.width,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dy = (d.y0 - e.clientY) / d.scale;
    const dx = (e.clientX - d.x0) / d.scale;
    if (!d.moved && Math.hypot(dx, dy) > TAP_SLOP) d.moved = true;
    if (!d.moved) return;
    if (step === 'calories') setCalories(snapCalories(SCALES.calories.value(d.pos0 + dy * GAIN)));
    else if (step === 'protein') setProtein(Math.max(0, Math.round(SCALES.protein.value(d.pos0 + dy * GAIN))));
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d || d.pointerId !== e.pointerId || d.moved) return;
    if ((e.clientX - d.left) / d.width < BACK_ZONE) back();
    else advance();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const big = e.shiftKey;
    let handled = true;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const dir = e.key === 'ArrowUp' ? 1 : -1;
      if (step === 'calories') setCalories((v) => Math.max(0, v + dir * (big ? 50 : 10)));
      else if (step === 'protein') setProtein((v) => Math.max(0, v + dir * (big ? 5 : 1)));
      else handled = false;
    } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && step === 'emoji') {
      const i = EMOJI_PALETTE.indexOf(emoji);
      const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + EMOJI_PALETTE.length) % EMOJI_PALETTE.length;
      setEmoji(EMOJI_PALETTE[next]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (step === 'today') startNew();
      else advance();
    } else if (e.key === 'Escape' || e.key === 'Backspace') {
      if (step !== 'today') back();
    } else {
      handled = false;
    }
    if (handled) {
      e.preventDefault();
      stopAuto();
    }
  };

  /* ── Render ───────────────────────────────────────────── */

  const glow =
    step === 'calories' ? calorieAccent(calories) : step === 'protein' ? PROTEIN_BLUE : step === 'today' ? '#34c759' : '#c7c7cc';

  const hint = auto
    ? 'Go on, have a go. Drag the screen.'
    : step === 'calories' || step === 'protein'
      ? 'Drag up or down anywhere. Tap to confirm.'
      : step === 'emoji'
        ? 'Pick a food, or just tap to skip.'
        : 'Tap + to add a meal.';

  const stepIndex = step === 'calories' ? 0 : step === 'protein' ? 1 : 2;
  const announce =
    step === 'calories'
      ? `${calories} kilocalories`
      : step === 'protein'
        ? `${protein} grams of protein`
        : step === 'emoji'
          ? `Food: ${emoji}`
          : 'Meal logged';

  return (
    <div ref={wrapRef} className="relative flex flex-col items-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[12%] left-1/2 h-[70%] w-[90%] -translate-x-1/2 rounded-full opacity-40 blur-[70px] transition-[background-color] duration-500"
        style={{ backgroundColor: glow }}
      />
      <Phone className="[--s:0.64] sm:[--s:0.72] xl:[--s:0.78]" time="19:30" interactive>
        <div
          ref={screenRef}
          className="absolute inset-0 cursor-grab outline-none active:cursor-grabbing"
          tabIndex={0}
          role="group"
          aria-roledescription="interactive demo"
          aria-label="Try Macro. Use the up and down arrow keys to change the value, Enter to confirm and Escape to go back."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (dragRef.current = null)}
          onKeyDown={onKeyDown}
        >
          {step === 'today' ? (
            <TodayScreen
              meals={meals}
              newId={newId}
              onAdd={() => {
                stopAuto();
                startNew();
              }}
            />
          ) : (
            <InputScreen
              field={step}
              value={step === 'calories' ? calories : protein}
              stepIndex={stepIndex}
              label="Dinner"
              time="19:30"
              emoji={emoji}
              onPickEmoji={(e) => {
                stopAuto();
                setEmoji(e);
              }}
              onCancel={() => {
                stopAuto();
                cancel();
              }}
            />
          )}
          {ghost.visible && (
            <div className="ghost-touch" data-pressed={ghost.pressed} style={{ left: ghost.x, top: ghost.y }} />
          )}
        </div>
      </Phone>
      <p className="relative mt-6 text-sm text-muted" aria-live="polite">
        {hint}
        <span className="sr-only">{announce}</span>
      </p>
    </div>
  );
}
