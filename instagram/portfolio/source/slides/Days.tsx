import type { CSSProperties } from 'react';
import { Phone, TodayScreen, type MealGroup } from '../../../../src/components/screens/ios';
import { Header, Touch, easeInOut, easeOut, em, prog, within, type Finger } from '../kit';
import { BREAKFAST } from './Swipe';

/*
  DayPager: swipe right for the day before. The page follows the finger, then settles. Each page's title fades only
  while it slides toward the settings button on the right (DayPageTitle.opacity): going back, the outgoing title
  fades as it moves under the button and the older one arrives opaque; going forward, the newer title fades in from
  that side. A double-tap on the title jumps straight back to today.
*/

const W = 393;
const DAYS: { title: string; meals: MealGroup[] }[] = [
  {
    title: '24 Nov',
    meals: [
      { id: 'b3', label: 'Breakfast', time: '8:20 AM', emojis: [em('🥐'), em('☕')], calories: 450, protein: 12 },
      { id: 'l3', label: 'Lunch', time: '12:30 PM', emojis: [em('🌯')], calories: 690, protein: 41 },
      { id: 'd3', label: 'Dinner', time: '7:45 PM', emojis: [em('🍣')], calories: 610, protein: 38 },
    ],
  },
  {
    title: 'Yesterday',
    meals: [
      { id: 'b2', label: 'Breakfast', time: '7:40 AM', emojis: [em('🍳')], calories: 380, protein: 24 },
      { id: 'l2', label: 'Lunch', time: '1:10 PM', emojis: [em('🍜')], calories: 640, protein: 30 },
      { id: 's2', label: 'Snack', time: '4:00 PM', emojis: [em('🍌')], calories: 110, protein: 1 },
      { id: 'd2', label: 'Dinner', time: '7:30 PM', emojis: [em('🍝')], calories: 820, protein: 42 },
    ],
  },
  {
    title: 'Today',
    meals: [BREAKFAST, { id: 'l1', label: 'Lunch', time: '12:41 PM', emojis: [em('🥗')], calories: 520, protein: 38 }],
  },
];

// Two swipes back, a rest on each day, then a double-tap on the title and the jump home.
const SWIPES = [
  { down: 0.6, from: 0.7, release: 1.45, y: 470 },
  { down: 2.75, from: 2.85, release: 3.6, y: 520 },
];
const DRAG = 236; // points the finger travels before letting go; the page settles the rest of the way
const SETTLE = 0.38;
const TAPS = [5.0, 5.24];
const JUMP = 5.4;
const JUMP_LENGTH = 0.62;
export const DAYS_LENGTH = 8.6;
const TITLE = { x: 74, y: 74 };

/** Where the pager is, in pages back from today (0 = today), and the swipe's from/to for the titles. */
function pager(t: number) {
  let back = 0;
  for (const s of SWIPES) {
    if (t < s.from) break;
    const dragged = easeInOut(prog(t, s.from, s.release)) * (DRAG / W);
    const settled = easeOut(prog(t, s.release, s.release + SETTLE));
    back += dragged + (1 - DRAG / W) * settled;
    if (t < s.release + SETTLE) break;
  }
  back = Math.min(back, SWIPES.length);
  // The double-tap jump: straight from the oldest day back to today.
  const jump = easeInOut(prog(t, JUMP, JUMP + JUMP_LENGTH));
  return { back, jump };
}

function finger(t: number): Finger | null {
  for (const s of SWIPES) {
    if (t >= s.down - 0.35 && t <= s.release + 0.3) {
      const x = 108 + easeInOut(prog(t, s.from, s.release)) * DRAG;
      return { x, y: s.y, shown: within(t, s.down - 0.35, s.release + 0.3, 0.2), press: within(t, s.down - 0.05, s.release + 0.04, 0.07) };
    }
  }
  // The double-tap: one touch on the title, pressing twice.
  if (t < TAPS[0] - 0.45 || t > TAPS[1] + 0.4) return null;
  return {
    x: TITLE.x,
    y: TITLE.y,
    shown: within(t, TAPS[0] - 0.45, TAPS[1] + 0.4, 0.2),
    press: Math.max(within(t, TAPS[0] - 0.08, TAPS[0] + 0.05, 0.04), within(t, TAPS[1] - 0.08, TAPS[1] + 0.05, 0.04)),
  };
}

export default function Days({ t }: { t: number }) {
  const { back, jump } = pager(t);
  // Page i (0 = 24 Nov, 2 = today) sits at x = (i - (2 - back)) * W while swiping; during the jump the oldest page
  // slides out to the left as today comes in from the right, as UIPageViewController does when told to jump.
  const pages = DAYS.map((d, i) => {
    let x: number;
    let titleOpacity = 1;
    if (jump > 0) {
      if (i === 0) x = -jump * W;
      else if (i === 2) x = (1 - jump) * W;
      else x = W * 3; // yesterday stays out of the way
      if (i === 2) titleOpacity = jump; // the newer title fades in from the button's side
    } else {
      x = (i - (2 - back)) * W;
      // Between pages: the page nearer today is `from` when going back; it fades as it slides right, under the button.
      const between = back % 1;
      if (between > 0.001) {
        const newer = 2 - Math.floor(back);
        if (i === newer) titleOpacity = 1 - between;
      }
    }
    return { ...d, x, titleOpacity };
  });

  const f = finger(t);
  return (
    <div className="slide bg-light">
      <Header topic="Days" n={8} />
      <div className="top">
        <h2 className="title">Swipe back through the week.</h2>
        <p className="sub">
          Each title fades only as it slides under the settings button, so the two never collide. Double-tap the title
          to come back to today.
        </p>
      </div>
      <div className="glow" style={{ '--glow': '#34c759', top: 900, opacity: 0.5 } as CSSProperties} />
      <div className="phone-at" style={{ left: (1080 - 459) / 2, top: 468 }}>
        <Phone className="pager-phone" time="12:41" style={{ '--s': 1.1 } as CSSProperties}>
          {pages.map((p) => (
            <div
              key={p.title}
              className="day-page"
              style={{ transform: `translateX(${p.x.toFixed(2)}px)`, '--title-o': p.titleOpacity } as CSSProperties}
            >
              <TodayScreen meals={p.meals} title={p.title} />
            </div>
          ))}
          {/* The chrome that stays put while the days slide under it: the cog, the tab bar and the plus. */}
          <div className="day-chrome">
            <TodayScreen meals={[]} title="" />
          </div>
          {f && <Touch f={f} />}
        </Phone>
      </div>
    </div>
  );
}
