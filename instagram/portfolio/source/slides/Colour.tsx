import type { CSSProperties } from 'react';
import { InputScreen, Phone, calorieAccent } from '../../../../src/components/screens/ios';
import { Header } from '../kit';

/*
  CalorieColor.swift: the calorie fill is green to 750 kcal, then eases through yellow (1,050) and orange (1,400)
  to red (1,800 and up). Three phones along the ramp, each pinned to where it sits on it.
*/

const PHONES = [420, 1150, 1800];
const SCALE = 0.68;
const PHONE_W = 417 * SCALE;
const GAP = (928 - 3 * PHONE_W) / 2;
const STOPS = [0, 750, 1050, 1400, 1800];
const RAMP_MAX = 2000;

export default function Colour() {
  const ramp = Array.from({ length: 41 }, (_, i) => `${calorieAccent((i / 40) * RAMP_MAX)} ${(i / 40) * 100}%`).join(', ');

  return (
    <div className="slide bg-light">
      <Header topic="Colour" n={5} />
      <div className="top">
        <h2 className="title">Big meals look big.</h2>
        <p className="sub">
          The calorie fill warms from green through yellow and orange to red as the number climbs, so the size of a
          meal reads before the number does.
        </p>
      </div>

      {PHONES.map((v, i) => (
        <div key={v} className="phone-at" style={{ left: 76 + i * (PHONE_W + GAP), top: 468 }}>
          <Phone time="12:41" style={{ '--s': SCALE } as CSSProperties}>
            <InputScreen field="calories" value={v} stepIndex={0} stepCount={3} label="Dinner" time="7:30" mic={false} />
          </Phone>
        </div>
      ))}

      <div className="ramp" style={{ left: 76, top: 1124, width: 928 }}>
        <div className="ramp-bar" style={{ background: `linear-gradient(90deg, ${ramp})` }} />
        {STOPS.map((v) => (
          <span key={v} className="ramp-stop mono" style={{ left: `${(v / RAMP_MAX) * 100}%` }}>
            {v.toLocaleString('en-GB')}
            {v === 1800 ? ' kcal' : ''}
          </span>
        ))}
        {PHONES.map((v) => (
          <span key={v} className="ramp-pin" style={{ left: `${(v / RAMP_MAX) * 100}%`, background: calorieAccent(v) }} />
        ))}
      </div>

      <div className="protein-row">
        <span className="protein-swatch" />
        <p>
          <b>Protein is always blue.</b> Its fill works the same way, filling the screen at 80 g.
        </p>
      </div>
    </div>
  );
}
