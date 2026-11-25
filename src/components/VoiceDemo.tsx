import { useEffect, useRef, useState } from 'react';
import { InputScreen, Phone } from './screens/ios';
import { BURRITO, glide, type VoicePhase } from './screens/Voice';

/*
  The entry screen's mic, played on a loop while it's on screen: a tap on the mic opens the voice bar, a sentence
  (shown in a bubble beside the phone, since the app never shows what it heard), a tap on the bar to stop, then the
  number glides to the estimate, and a tap on to protein, filled in too. Server-rendered as a still of the result,
  which is also what reduced motion gets.
*/

// Where the mic sits, in screen points: FloatingButtonMetrics, the same spot as the day list's plus.
const MIC = { x: 393 - 20 - 29, y: 852 - 54 - 29 };
const TAP = { x: 250, y: 560 };

// Timeline, in ms.
const LISTEN_AT = 760;
const STOP_AT = LISTEN_AT + BURRITO.length * 1000 + 450;
const LANDS_AT = STOP_AT + 1350;
const CONFIRM_AT = LANDS_AT + 2100;
const LOOP = CONFIRM_AT + 2700;
/** The still: the estimate just landed, with what was said still up. */
const STILL = LANDS_AT + 900;

const calorieGlide = glide('calories', 0, BURRITO.guess.calories);
const within = (t: number, a: number, b: number) => t >= a && t < b;

function frameAt(t: number, still: boolean) {
  const voice: VoicePhase = within(t, LISTEN_AT, STOP_AT) ? 'listening' : within(t, STOP_AT, LANDS_AT) ? 'estimating' : 'idle';
  const landed = t >= LANDS_AT;
  const onProtein = t >= CONFIRM_AT + 120;
  const heard = (t - LISTEN_AT) / 1000;

  // Three touches: the mic, the bar's stop square in the same spot, then the screen to confirm. Each fades out
  // where it was.
  const ghost = {
    ...(t < CONFIRM_AT - 520 ? MIC : TAP),
    shown: within(t, 250, LISTEN_AT) || within(t, STOP_AT - 520, STOP_AT + 160) || within(t, CONFIRM_AT - 520, CONFIRM_AT + 360),
    pressed: within(t, 600, 740) || within(t, STOP_AT - 150, STOP_AT) || within(t, CONFIRM_AT - 140, CONFIRM_AT),
  };

  return {
    voice,
    field: onProtein ? ('protein' as const) : ('calories' as const),
    value: onProtein ? BURRITO.guess.protein : landed ? calorieGlide.at((t - LANDS_AT) / 1000) : 0,
    estimate: landed ? BURRITO.guess.name : null,
    ghost,
    bubble: still || within(t, LISTEN_AT + BURRITO.words[0].at * 1000, STOP_AT + 120),
    heard: (at: number) => still || heard >= at,
  };
}

/** Everything a frame shows, so the loop only re-renders when something on screen has changed. */
function frameKey(t: number) {
  const f = frameAt(t, false);
  const words = BURRITO.words.filter((w) => f.heard(w.at)).length;
  return [f.voice, f.field, f.value, f.estimate, f.ghost.x, f.ghost.y, f.ghost.shown, f.ghost.pressed, f.bubble, words].join();
}

export default function VoiceDemo() {
  const [t, setT] = useState(STILL);
  const [animate, setAnimate] = useState(false);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setAnimate(true);
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!animate || !inView) return;
    // Starts from the top each time it comes into view, so the waveform's speech and the bubble's words, which
    // keep separate clocks, always set off together.
    let elapsed = 0;
    let last = performance.now();
    let raf = 0;
    let shown = frameKey(0);
    setT(0);
    const tick = (now: number) => {
      elapsed = (elapsed + Math.min(100, Math.max(0, now - last))) % LOOP;
      last = now;
      // Most frames look like the last one (the waveform draws itself), so this skips re-rendering for them.
      const key = frameKey(elapsed);
      if (key !== shown) {
        shown = key;
        setT(elapsed);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, inView]);

  const f = frameAt(t, !animate);

  return (
    <div ref={rootRef} className="relative flex w-full max-w-[440px] justify-end sm:justify-center">
      <p className="sr-only">
        {`Someone taps the mic and says “${BURRITO.said}”. Macro listens, works it out, and fills in ${BURRITO.guess.calories} calories and ${BURRITO.guess.protein} grams of protein, marked “Estimated · ${BURRITO.guess.name}”.`}
      </p>

      <div
        aria-hidden="true"
        className="said-bubble absolute top-[15%] left-0 z-10 max-w-[188px] rounded-[20px] rounded-br-[6px] bg-white px-4 py-3 text-[15px] leading-snug shadow-[0_12px_32px_-12px_rgb(0_0_0/0.3)] sm:top-[24%] sm:max-w-[200px]"
        data-shown={f.bubble}
      >
        {/* Unheard words keep their space, so the bubble never changes size. The quotes ride on the first and
            last words, so a closing one never hangs on its own. */}
        {BURRITO.words.map((w, i) => (
          <span key={`${w.text}-${i}`} className="said-word" data-heard={f.heard(w.at)}>
            {i === 0 && '“'}
            {w.text}
            {i < BURRITO.words.length - 1 ? ' ' : '”'}
          </span>
        ))}
      </div>

      <Phone className="relative [--s:0.5] sm:[--s:0.54]" time="12:41">
        <InputScreen
          field={f.field}
          value={f.value}
          stepIndex={f.field === 'protein' ? 1 : 0}
          label="Lunch"
          time="12:41"
          voice={f.voice}
          script={BURRITO}
          estimate={f.estimate}
        >
          {animate && (
            <div
              className="ghost-touch"
              data-pressed={f.ghost.pressed}
              style={{ left: f.ghost.x, top: f.ghost.y, opacity: f.ghost.shown ? 1 : 0 }}
            />
          )}
        </InputScreen>
      </Phone>
    </div>
  );
}
