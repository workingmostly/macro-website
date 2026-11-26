import type { CSSProperties } from 'react';
import { SCALES, calorieAccent } from '../../../../src/components/screens/ios';
import { Header } from '../kit';

/*
  The drag's gearing (DragScale.swift), drawn as a ruler you swipe up: every tick is 10 kcal, placed at the finger
  travel it takes to reach it. Where the ticks spread out, the swipe is fine; where they bunch up, it's quick.
*/

const BASE = 1338; // y of 0 kcal
const PX = 0.93; // canvas px per point of finger travel
const MAX = 1400;
const y = (kcal: number) => BASE - SCALES.calories.position(kcal) * PX;

const ZONES = [
  { from: 0, to: 150, rate: '0.7', what: 'Snacks, coffee' },
  { from: 150, to: 600, rate: '1.1', what: 'Most meals' },
  { from: 600, to: 1000, rate: '2.2', what: 'Big ones' },
  { from: 1000, to: MAX, rate: '4', what: 'Rarely' },
];

export default function Gearing() {
  const ticks = [];
  for (let v = 0; v <= MAX; v += 10) {
    const major = v % 100 === 0;
    const mid = v % 50 === 0;
    ticks.push(
      <span
        key={v}
        className="tick"
        style={{ top: y(v), width: major ? 64 : mid ? 44 : 26, background: calorieAccent(v), opacity: major ? 1 : 0.75 } as CSSProperties}
      />,
    );
    if (major && (v <= 600 || v % 200 === 0)) {
      ticks.push(
        <span key={`l${v}`} className="tick-label mono" style={{ top: y(v) }}>
          {v.toLocaleString('en-GB')}
        </span>,
      );
    }
  }

  return (
    <div className="slide bg-white">
      <Header topic="The drag" n={4} />
      <div className="top">
        <h2 className="title">Fine where meals land.</h2>
        <p className="sub">
          The swipe isn't linear. From 150 to 600 kcal, where most meals sit, each point of travel adds 1.1 kcal. Past
          1,000 it speeds up to 4.
        </p>
      </div>

      <div className="ruler">
        <span className="ruler-spine" style={{ top: y(MAX), height: BASE - y(MAX) }} />
        {ticks}
        {ZONES.map((z) => {
          const top = y(z.to);
          const height = y(z.from) - top;
          return (
            <div key={z.from} className="zone" style={{ top, height }}>
              <span className="zone-rate">
                <b>{z.rate}</b> kcal / pt
              </span>
              <span className="zone-what">{z.what}</span>
            </div>
          );
        })}
      </div>

      <p className="gear-foot">
        <span className="mono">Snapping and haptics</span>
        Calories snap to 10 kcal, with a light haptic tick on each one. Protein is finer still: 0.12 g a point.
      </p>
      <p className="gear-foot" style={{ top: 1118 }}>
        <span className="mono">Reading the ruler</span>
        Each tick is 10 kcal, set where your finger has to reach it. Spread out means fine control; bunched up means
        quick.
      </p>
    </div>
  );
}
