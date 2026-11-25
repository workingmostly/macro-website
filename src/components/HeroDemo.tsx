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
  type PlusBar,
} from './screens/ios';
import { BURRITO, ICE_CREAM, Transcript, glide, type Guess, type Script, type VoicePhase } from './screens/Voice';

type Step = 'calories' | 'protein' | 'emoji' | 'today';

/** A mouse covers less ground than a thumb on a real phone, so the web demo gears up a little. */
const GAIN = 1.6;
/** Same as the app: a drag shorter than this still counts as a tap. */
const TAP_SLOP = 6;
/** Left 32% of the screen goes back, like Instagram Stories. */
const BACK_ZONE = 0.32;
/**
 * On touch the same vertical swipe has to scroll the page, so a finger only grabs the slider once it has
 * rested this long. A swipe that sets off straight away is left to the browser.
 */
const HOLD_MS = 300;
/** CSS pixels a resting finger can wander before it counts as a swipe. */
const HOLD_SLOP = 10;
/** A touch this soon after the page moved is catching a fling, not reaching for the demo. */
const SCROLL_SETTLE_MS = 150;

/** VoiceHoldButton: a press on the plus this long is a hold (talk), shorter is a tap (open the entry screen). */
const PLUS_HOLD_MS = 200;
/** Sliding a held plus up this many points arms a cancel. */
const CANCEL_SLIDE = 70;
/** Nobody's really talking to the demo, so a tap-started listen stops this long after the made-up sentence. */
const LISTEN_TAIL_MS = 1200;
/** How long the pretend estimate takes. */
const ESTIMATE_MS = 1300;
/** How long the bar shows what the plus logged. */
const CONFIRM_MS = 2200;
/** Where the plus sits, in screen points. */
const PLUS = { x: 393 - 20 - 29, y: 852 - 54 - 29 };

const SEED: MealGroup[] = [
  { id: 'b', label: 'Breakfast', time: '8:05 AM', emojis: ['🥣', '☕'], calories: 410, protein: 32 },
  { id: 'l', label: 'Lunch', time: '1:10 PM', emojis: ['🥪', '🍎'], calories: 620, protein: 41 },
];

interface Ghost {
  x: number;
  y: number;
  visible: boolean;
  pressed: boolean;
}

interface Drag {
  pointerId: number;
  touch: boolean;
  /** Touch only: the finger has rested for HOLD_MS and owns the slider. */
  held: boolean;
  x0: number;
  y0: number;
  /** Null until a held touch first moves; it anchors there, after autoplay has let go. */
  pos0: number | null;
  scale: number;
  left: number;
  width: number;
  moved: boolean;
}

/** A finger on the plus. */
interface PlusPress {
  pointerId: number;
  y0: number;
  scale: number;
  /** Held long enough to be a hold rather than a tap. */
  held: boolean;
  armed: boolean;
  heldAt: number;
  timer: number;
}

class Cancelled extends Error {}

const snapCalories = (v: number) => Math.max(0, Math.round(v / 10) * 10);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** What the plus logs: into the Dinner group at this time of the evening, as one more entry. */
function addToDinner(meals: MealGroup[], guess: Guess, id: string): MealGroup[] {
  const dinner = meals.find((m) => m.label === 'Dinner');
  if (dinner) {
    return meals.map((m) =>
      m === dinner
        ? {
            ...m,
            emojis: [...m.emojis, guess.emoji],
            calories: m.calories + guess.calories,
            protein: m.protein + guess.protein,
          }
        : m,
    );
  }
  return [...meals, { id, label: 'Dinner', time: '7:31 PM', emojis: [guess.emoji], calories: guess.calories, protein: guess.protein }];
}

const confirmationFor = (guess: Guess) => ({
  emoji: guess.emoji,
  title: guess.name,
  detail: `${guess.calories} kcal · ${guess.protein}g`,
});

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
  const [touchUI, setTouchUI] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  // The entry screen's mic, opened into its bar: listening, then estimating.
  const [voice, setVoice] = useState<VoicePhase>('idle');
  // What the voice estimate took the meal to be, under the number until a value is changed by hand.
  const [estimate, setEstimate] = useState<string | null>(null);
  // The plus on Today, held open into its bar.
  const [plus, setPlus] = useState<PlusBar | null>(null);
  // What the made-up speaker is saying, shown word by word under the phone, and a key to replay it.
  const [heard, setHeard] = useState<{ script: Script; key: number } | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const runRef = useRef(0);
  const ghostRef = useRef(ghost);
  const dragRef = useRef<Drag | null>(null);
  const holdRef = useRef(0);
  const scrolledAtRef = useRef(-Infinity);
  const timersRef = useRef<number[]>([]);
  const glideRef = useRef<{ raf: number; field: 'calories' | 'protein'; target: number } | null>(null);
  const plusRef = useRef<PlusPress | null>(null);
  const heardKeyRef = useRef(0);

  const setGhost = useCallback((next: Partial<Ghost>) => {
    ghostRef.current = { ...ghostRef.current, ...next };
    setGhostState(ghostRef.current);
  }, []);

  /* ── Timers and the estimate's glide ──────────────────── */

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };
  const later = (ms: number, fn: () => void) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };

  const hear = useCallback((script: Script | null) => {
    setHeard(script ? { script, key: ++heardKeyRef.current } : null);
  }, []);

  /** Moves the number on screen to the estimate the way a finger would (InputView.autoSlide). */
  const startGlide = (field: 'calories' | 'protein', from: number, to: number) => {
    const set = field === 'calories' ? setCalories : setProtein;
    if (glideRef.current) cancelAnimationFrame(glideRef.current.raf);
    if (reducedMotion) {
      glideRef.current = null;
      set(to);
      return;
    }
    const g = glide(field, from, to);
    const t0 = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - t0) / 1000;
      set(g.at(elapsed));
      if (elapsed < g.duration && glideRef.current) glideRef.current.raf = requestAnimationFrame(tick);
      else glideRef.current = null;
    };
    glideRef.current = { raf: requestAnimationFrame(tick), field, target: to };
  };

  /** Any touch of the screen lands a glide that's still going, so a drag starts from (or a tap confirms) it. */
  const completeGlide = () => {
    const g = glideRef.current;
    if (!g) return;
    cancelAnimationFrame(g.raf);
    (g.field === 'calories' ? setCalories : setProtein)(g.target);
    glideRef.current = null;
  };

  useEffect(
    () => () => {
      clearTimers();
      if (glideRef.current) cancelAnimationFrame(glideRef.current.raf);
      if (plusRef.current) clearTimeout(plusRef.current.timer);
    },
    [],
  );

  /* ── Voice on the entry screen: tap the mic, tap the bar ─ */

  const stopVoice = () => {
    clearTimers();
    setVoice('idle');
    hear(null);
  };

  const finishListening = () => {
    clearTimers();
    setVoice('estimating');
    later(ESTIMATE_MS, () => {
      // VoiceEstimator's guess, applied as InputView.apply does: the number on screen glides to its estimate, the
      // rest just take theirs, and it stays on this step to be confirmed or nudged.
      const g = BURRITO.guess;
      setVoice('idle');
      hear(null);
      setProtein(g.protein);
      setEmoji(g.emoji);
      setEstimate(g.name);
      startGlide('calories', calories, g.calories);
    });
  };

  const onMic = () => {
    if (voice !== 'idle') return;
    stopAuto();
    completeGlide();
    clearTimers();
    setVoice('listening');
    hear(BURRITO);
    later(BURRITO.length * 1000 + LISTEN_TAIL_MS, finishListening);
  };

  /* ── Voice on Today: hold the plus ────────────────────── */

  const collapsePlus = () => {
    setPlus(null);
    hear(null);
  };

  /** Let go after talking: estimate, log it straight into the day, say what was added, fold back up. */
  const finishPlus = () => {
    clearTimers();
    setPlus({ mode: 'estimating', script: ICE_CREAM });
    const dinnerId = meals.find((m) => m.label === 'Dinner')?.id ?? 'voice';
    later(ESTIMATE_MS, () => {
      const g = ICE_CREAM.guess;
      setMeals((m) => addToDinner(m, g, 'voice'));
      setNewId(dinnerId);
      setPlus({ mode: 'confirmed', script: ICE_CREAM, confirmation: confirmationFor(g) });
      later(CONFIRM_MS, collapsePlus);
    });
  };

  const plusHandlers = {
    onPointerDown(e: PointerEvent<HTMLDivElement>) {
      e.stopPropagation();
      if (plus || !screenRef.current) return;
      stopAuto();
      clearTimers();
      e.currentTarget.setPointerCapture(e.pointerId);
      const press: PlusPress = {
        pointerId: e.pointerId,
        y0: e.clientY,
        scale: screenRef.current.getBoundingClientRect().width / 393,
        held: false,
        armed: false,
        heldAt: 0,
        timer: window.setTimeout(() => {
          press.held = true;
          press.heldAt = performance.now();
          setPlus({ mode: 'listening', script: ICE_CREAM, cancel: 'slide', stillWave: reducedMotion });
          hear(ICE_CREAM);
        }, PLUS_HOLD_MS),
      };
      plusRef.current = press;
      // The plus opens its bar the moment it's touched, rather than waiting to see whether it's a hold.
      setPlus({ mode: 'starting', script: ICE_CREAM });
    },
    onPointerMove(e: PointerEvent<HTMLDivElement>) {
      const press = plusRef.current;
      if (!press || press.pointerId !== e.pointerId || !press.held) return;
      const armed = (press.y0 - e.clientY) / press.scale > CANCEL_SLIDE;
      if (armed === press.armed) return;
      press.armed = armed;
      setPlus((bar) => (bar && bar.mode === 'listening' ? { ...bar, cancel: armed ? 'armed' : 'slide' } : bar));
    },
    onPointerUp(e: PointerEvent<HTMLDivElement>) {
      const press = plusRef.current;
      if (!press || press.pointerId !== e.pointerId) return;
      clearTimeout(press.timer);
      plusRef.current = null;
      // Let go before it counted as a hold: that was a tap, so the bar shuts and the entry screen opens.
      if (!press.held) {
        setPlus(null);
        startNew();
        return;
      }
      // Slid up and let go throws the take away; let go before a word was said just folds back up.
      const listened = (performance.now() - press.heldAt) / 1000;
      if (press.armed || listened < ICE_CREAM.words[0].at) return collapsePlus();
      finishPlus();
    },
    onPointerCancel(e: PointerEvent<HTMLDivElement>) {
      const press = plusRef.current;
      if (!press || press.pointerId !== e.pointerId) return;
      clearTimeout(press.timer);
      plusRef.current = null;
      collapsePlus();
    },
  };

  /* ── Flow ─────────────────────────────────────────────── */

  const commit = (c: number, p: number, e: string) => {
    const id = `d${Date.now()}`;
    const dinner = meals.find((m) => m.label === 'Dinner');
    setMeals(addToDinner(meals, { name: '', calories: c, protein: p, emoji: e }, id));
    setNewId(dinner ? dinner.id : id);
    setStep('today');
  };

  const advance = () => {
    completeGlide();
    if (step === 'calories') setStep('protein');
    else if (step === 'protein') setStep('emoji');
    else if (step === 'emoji') commit(calories, protein, emoji);
  };

  const back = () => {
    completeGlide();
    if (step === 'calories') cancel();
    else if (step === 'protein') setStep('calories');
    else if (step === 'emoji') setStep('protein');
  };

  const cancel = () => {
    if (voice !== 'idle') return stopVoice();
    setNewId(null);
    setStep('today');
  };

  const startNew = () => {
    stopVoice();
    completeGlide();
    setEstimate(null);
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
    setPlus(null);
    hear(null);
    setGhost({ visible: false, pressed: false });
  }, [auto, hear, setGhost]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAuto(false);
      setReducedMotion(true);
    }
    setTouchUI(window.matchMedia('(pointer: coarse)').matches);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const onScroll = () => {
      scrolledAtRef.current = performance.now();
    };
    // Stops the page scrolling under a finger that has grabbed the slider. It has to be in place, and not
    // passive, before the touch starts: iOS decides then whether the touch's moves can be cancelled.
    const onTouchMove = (e: TouchEvent) => {
      if ((dragRef.current?.held || plusRef.current) && e.cancelable) e.preventDefault();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      window.removeEventListener('scroll', onScroll);
      el.removeEventListener('touchmove', onTouchMove);
      clearTimeout(holdRef.current);
    };
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
        setEstimate(null);
        setMeals(SEED);
        setNewId(null);
        setPlus(null);
        hear(null);
        setGhost({ x: 255, y: 660, visible: false, pressed: false });
        await sleep(1000);

        // The headline act, two drags. Calories up to ~520 kcal...
        setGhost({ visible: true });
        await sleep(300);
        setGhost({ pressed: true });
        await sleep(HOLD_MS);
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

        // ...then protein up to 38 g.
        await moveTo(255, 660);
        setGhost({ pressed: true });
        await sleep(HOLD_MS);
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

        // Pick sushi, then confirm.
        await moveTo(107, 712, 520);
        await sleep(120);
        await tap();
        setEmoji('🍣');
        await sleep(450);
        await moveTo(270, 420, 480);
        await tap();
        setMeals([...SEED, { id: 'auto', label: 'Dinner', time: '7:30 PM', emojis: ['🍣'], calories: 520, protein: 38 }]);
        setNewId('auto');
        setStep('today');
        setGhost({ visible: false });
        await sleep(2400);

        // The encore: hold the plus and say the pudding. It's logged without opening the entry screen.
        setGhost({ x: 300, y: 610, visible: true });
        await moveTo(PLUS.x, PLUS.y, 520);
        setGhost({ pressed: true });
        setPlus({ mode: 'starting', script: ICE_CREAM });
        await sleep(PLUS_HOLD_MS);
        setPlus({ mode: 'listening', script: ICE_CREAM, cancel: 'slide' });
        hear(ICE_CREAM);
        await sleep(ICE_CREAM.length * 1000 + 300);
        setGhost({ pressed: false });
        setPlus({ mode: 'estimating', script: ICE_CREAM });
        await sleep(250);
        setGhost({ visible: false });
        await sleep(ESTIMATE_MS - 250);
        setMeals((m) => addToDinner(m, ICE_CREAM.guess, 'voice'));
        setNewId('auto');
        setPlus({ mode: 'confirmed', script: ICE_CREAM, confirmation: confirmationFor(ICE_CREAM.guess) });
        await sleep(CONFIRM_MS);
        setPlus(null);
        hear(null);
        await sleep(2600);
      }
    };

    play().catch((err) => {
      if (!(err instanceof Cancelled)) throw err;
    });
    return () => {
      runRef.current++;
    };
  }, [auto, inView, hear, setGhost]);

  /* ── Direct manipulation ──────────────────────────────── */

  const slider = step === 'calories' || step === 'protein';

  const endDrag = () => {
    clearTimeout(holdRef.current);
    dragRef.current = null;
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const touch = e.pointerType !== 'mouse';
    setTouchUI(touch);
    // A touch may only be passing through on its way down the page, so it leaves autoplay alone until it
    // turns out to be a tap or a hold.
    if (!touch) stopAuto();
    if (step === 'today' || !screenRef.current) return;
    if (touch && performance.now() - scrolledAtRef.current < SCROLL_SETTLE_MS) return;
    completeGlide();
    const rect = screenRef.current.getBoundingClientRect();
    dragRef.current = {
      pointerId: e.pointerId,
      touch,
      held: false,
      x0: e.clientX,
      y0: e.clientY,
      pos0: touch ? null : slider ? SCALES[step].position(step === 'calories' ? calories : protein) : 0,
      scale: rect.width / 393,
      left: rect.left,
      width: rect.width,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    // Nothing to grab while it listens, so a resting finger is left free to scroll the page.
    if (touch && slider && voice === 'idle') {
      const id = e.pointerId;
      clearTimeout(holdRef.current);
      holdRef.current = window.setTimeout(() => {
        const d = dragRef.current;
        if (!d || d.pointerId !== id) return;
        d.held = true;
        stopAuto();
      }, HOLD_MS);
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (d.touch && !d.held) {
      // Setting off before the hold is up makes it a swipe, and swipes belong to the page.
      if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > HOLD_SLOP) endDrag();
      return;
    }
    // The app ignores drags while it listens.
    if (voice !== 'idle') return;
    if (d.pos0 === null) {
      d.pos0 = slider ? SCALES[step].position(step === 'calories' ? calories : protein) : 0;
      d.x0 = e.clientX;
      d.y0 = e.clientY;
    }
    const dy = (d.y0 - e.clientY) / d.scale;
    const dx = (e.clientX - d.x0) / d.scale;
    if (!d.moved && Math.hypot(dx, dy) > TAP_SLOP) d.moved = true;
    if (!d.moved) return;
    // Changing a value by hand drops the estimate's name, as in the app.
    if (step === 'calories') setCalories(snapCalories(SCALES.calories.value(d.pos0 + dy * GAIN)));
    else if (step === 'protein') setProtein(Math.max(0, Math.round(SCALES.protein.value(d.pos0 + dy * GAIN))));
    if (slider) setEstimate(null);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    endDrag();
    if (d.moved || d.held) return;
    stopAuto();
    // Listening is finished from the bar; until it's done, a stray tap mustn't skip or cancel the step.
    if (voice !== 'idle') return;
    if ((e.clientX - d.left) / d.width < BACK_ZONE) back();
    else advance();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const big = e.shiftKey;
    let handled = true;
    if (voice !== 'idle') {
      if (e.key === 'Escape' || e.key === 'Backspace') stopVoice();
      else if ((e.key === 'Enter' || e.key === ' ') && voice === 'listening') finishListening();
      else handled = e.key === 'Enter' || e.key === ' ';
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      completeGlide();
      const dir = e.key === 'ArrowUp' ? 1 : -1;
      if (step === 'calories') setCalories((v) => Math.max(0, v + dir * (big ? 50 : 10)));
      else if (step === 'protein') setProtein((v) => Math.max(0, v + dir * (big ? 5 : 1)));
      else handled = false;
      if (handled) setEstimate(null);
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

  const talking = voice !== 'idle' || (plus && plus.mode !== 'confirmed');
  const glow = talking
    ? PROTEIN_BLUE
    : step === 'calories'
      ? calorieAccent(calories)
      : step === 'protein'
        ? PROTEIN_BLUE
        : step === 'today'
          ? '#34c759'
          : '#c7c7cc';

  // Under the phone: what's being said while it listens, otherwise how to have a go.
  const hint = heard ? (
    <Transcript key={heard.key} script={heard.script} all={reducedMotion} />
  ) : auto ? (
    touchUI ? (
      'Go on, have a go. Press and hold the screen, then drag.'
    ) : (
      'Go on, have a go. Drag the screen.'
    )
  ) : slider && estimate ? (
    'Filled in from what you said. Drag to adjust, or tap to confirm.'
  ) : slider ? (
    step === 'calories' ? (
      touchUI ? (
        'Press and hold, then drag. Or tap the mic. Tap to confirm.'
      ) : (
        'Drag up or down anywhere, or tap the mic. Tap to confirm.'
      )
    ) : touchUI ? (
      'Press and hold, then drag up or down. Tap to confirm.'
    ) : (
      'Drag up or down anywhere. Tap to confirm.'
    )
  ) : step === 'emoji' ? (
    'Pick a food, or just tap to skip.'
  ) : (
    'Tap + to add a meal, or hold it and say what you ate.'
  );

  const stepIndex = step === 'calories' ? 0 : step === 'protein' ? 1 : 2;
  const estimated = estimate ? `, estimated from “${estimate}”` : '';
  const announce =
    voice === 'listening' || plus?.mode === 'listening'
      ? 'Listening'
      : voice === 'estimating' || plus?.mode === 'estimating'
        ? 'Estimating'
        : plus?.mode === 'confirmed'
          ? `Added ${ICE_CREAM.guess.name}`
          : step === 'calories'
            ? `${calories} kilocalories${estimated}`
            : step === 'protein'
              ? `${protein} grams of protein${estimated}`
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
          className="absolute inset-0 cursor-grab touch-manipulation outline-none [-webkit-touch-callout:none] active:cursor-grabbing [&_.ios-fill]:will-change-transform"
          tabIndex={0}
          role="group"
          aria-roledescription="interactive demo"
          aria-label="Try Macro. Use the up and down arrow keys to change the value, Enter to confirm and Escape to go back."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
        >
          {step === 'today' ? (
            <TodayScreen
              meals={meals}
              newId={newId}
              bar={plus ? { ...plus, stillWave: reducedMotion } : null}
              plusHandlers={plusHandlers}
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
              voice={voice}
              script={BURRITO}
              onMic={onMic}
              onBar={finishListening}
              estimate={slider ? estimate : null}
              stillWave={reducedMotion}
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
      <p className="relative mt-6 min-h-[1.25rem] text-center text-sm text-balance text-muted" aria-live="polite">
        {hint}
        <span className="sr-only">{announce}</span>
      </p>
    </div>
  );
}
