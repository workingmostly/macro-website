import type { CSSProperties } from 'react';
import {
  EMOJI_PALETTE,
  InputScreen,
  Phone,
  SCALES,
  TodayScreen,
  calorieAccent,
  type MealGroup,
} from '../../../../src/components/screens/ios';
import { Header, Touch, easeInOut, easeOut, em, prog, tapAt, within, type Finger } from '../kit';

/*
  Swipe to log: swipe up for calories, tap, swipe up for protein, tap past the guessed emoji, and the sheet drops
  away to show the meal on the day. The numbers come from the finger's travel through the app's own drag gearing
  (DragScale), so the count speeds up and slows down exactly as it does under a thumb.
*/

export const BREAKFAST: MealGroup = {
  id: 'breakfast',
  label: 'Breakfast',
  time: '8:05 AM',
  emojis: [em('🥣'), em('☕')],
  calories: 410,
  protein: 32,
};
const LUNCH: MealGroup = { id: 'lunch', label: 'Lunch', time: '12:41 PM', emojis: [em('🥗')], calories: 520, protein: 38 };

// Timeline, in seconds.
const CAL = { down: 0.55, from: 0.7, to: 2.85, up: 3.0, x: 262, y: 712, value: 520 };
const TO_PROTEIN = 3.6;
const PRO = { down: 4.1, from: 4.25, to: 5.45, up: 5.6, x: 250, y: 690, value: 38 };
const TO_EMOJI = 6.2;
const SAVE = 7.35;
const REOPEN = 9.4;
export const SWIPE_LENGTH = 10;

function drag(field: 'calories' | 'protein', t: number, d: typeof CAL) {
  const k = easeInOut(prog(t, d.from, d.to));
  const travel = SCALES[field].position(d.value) * k;
  const step = field === 'calories' ? 10 : 1;
  return { travel, value: Math.round(SCALES[field].value(travel) / step) * step };
}

function dragFinger(t: number, d: typeof CAL, travel: number): Finger | null {
  if (t < d.down - 0.35 || t > d.up + 0.35) return null;
  return {
    x: d.x,
    y: d.y - travel,
    shown: within(t, d.down - 0.35, d.up + 0.35, 0.22),
    press: within(t, d.down - 0.05, d.up + 0.05, 0.08),
  };
}

/** What's on the phone at `t`, shared with the cover, which shows a frame of it. */
export function swipeScreen(t: number) {
  const cal = drag('calories', t, CAL);
  const pro = drag('protein', t, PRO);
  const step = t < TO_PROTEIN ? 0 : t < TO_EMOJI ? 1 : 2;
  const field = step === 0 ? ('calories' as const) : step === 1 ? ('protein' as const) : ('emoji' as const);
  const value = step === 0 ? cal.value : step === 1 ? pro.value : 0;
  const accent = field === 'calories' ? calorieAccent(value) : field === 'protein' ? '#007aff' : '#8a8a8e';

  const finger =
    dragFinger(t, CAL, cal.travel) ??
    tapAt(t, TO_PROTEIN, 272, 520) ??
    dragFinger(t, PRO, pro.travel) ??
    tapAt(t, TO_EMOJI, 280, 470) ??
    tapAt(t, SAVE, 270, 430);

  // The sheet drops away on save, and comes back up as the app reopens on a new meal.
  const down = easeInOut(prog(t, SAVE + 0.05, SAVE + 0.5)) * (1 - easeInOut(prog(t, REOPEN, REOPEN + 0.5)));
  const fresh = t >= REOPEN; // the sheet comes back as a new, empty entry
  const rowIn = easeOut(prog(t, SAVE + 0.3, SAVE + 0.95));

  return {
    field: fresh ? ('calories' as const) : field,
    value: fresh ? 0 : value,
    step: fresh ? 0 : step,
    accent: fresh ? calorieAccent(0) : accent,
    finger,
    down,
    // Before the save the day sits hidden under the sheet; from then on it keeps the lunch, even as the sheet
    // comes back up over it, so the loop never shows the row vanishing.
    logged: t >= SAVE,
    rowIn,
  };
}

export function SwipePhone({ t, scale, still = false, trail = false }: { t: number; scale: number; still?: boolean; trail?: boolean }) {
  const s = swipeScreen(t);
  return (
    <Phone
      className="row-in own-palette"
      time="12:41"
      style={
        {
          '--s': scale,
          '--row-o': s.rowIn,
          '--row-y': `${18 * (1 - s.rowIn)}px`,
          '--row-s': 0.96 + 0.04 * s.rowIn,
        } as CSSProperties
      }
    >
      <TodayScreen meals={s.logged ? [BREAKFAST, LUNCH] : [BREAKFAST]} newId="lunch" />
      <div className="sheet" style={{ transform: `translateY(${s.down * 100}%)` }}>
        <InputScreen
          field={s.field}
          value={s.value}
          stepIndex={s.step}
          stepCount={3}
          label="Lunch"
          time="12:41"
          emoji={em('🥗')}
          palette={[]}
          mic={false}
        >
          {s.field === 'emoji' && (
            <div className="ios-palette mine">
              {EMOJI_PALETTE.map((e, i) => (
                <button key={i} type="button" aria-pressed={e === '🥗'}>
                  {em(e)}
                </button>
              ))}
            </div>
          )}
        </InputScreen>
      </div>
      {trail && s.finger && <div className="swipe-trail" style={{ left: s.finger.x, top: s.finger.y }} />}
      {!still && s.finger && <Touch f={s.finger} />}
    </Phone>
  );
}

export default function Swipe({ t }: { t: number }) {
  const s = swipeScreen(t);
  return (
    <div className="slide bg-light">
      <Header topic="Swipe to log" n={3} />
      <div className="top">
        <h2 className="title">Swipe anywhere.</h2>
        <p className="sub">
          The whole screen is the slider. Swipe up for calories, tap, swipe up for protein. The emoji is a guess from
          what you usually log.
        </p>
      </div>
      <div className="glow" style={{ '--glow': s.accent, top: 760 } as CSSProperties} />
      <div className="phone-at" style={{ left: (1080 - 459) / 2, top: 468 }}>
        <SwipePhone t={t} scale={1.1} />
      </div>
    </div>
  );
}
