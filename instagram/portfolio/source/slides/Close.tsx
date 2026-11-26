import type { CSSProperties } from 'react';
import { InputScreen, Phone, TodayScreen, type MealGroup } from '../../../../src/components/screens/ios';
import { Header, em } from '../kit';
import { BREAKFAST } from './Swipe';

/*
  The close: the icon over the app's Macro+ glow, where to get it, and three phones: the day in front, the calories
  and protein swipes tucked behind either side.
*/

const DAY: MealGroup[] = [
  BREAKFAST,
  { id: 'l', label: 'Lunch', time: '12:41 PM', emojis: [em('🌯')], calories: 690, protein: 41 },
  { id: 'd', label: 'Dinner', time: '7:30 PM', emojis: [em('🍝')], calories: 620, protein: 38 },
];

export default function Close() {
  return (
    <div className="slide bg-night">
      <Header topic="Try it" n={9} dark />
      <div className="close-glow" />
      <img className="close-icon" src="/icon.png" alt="" />
      <h2 className="close-name">Macro</h2>
      <p className="close-pill">Available on TestFlight</p>
      <p className="close-url">usemacro.app</p>

      <div className="phone-at" style={{ left: 42, top: 1014, transform: 'rotate(-7deg)', transformOrigin: '100% 0' }}>
        <Phone time="12:41" style={{ '--s': 0.86 } as CSSProperties}>
          <InputScreen field="calories" value={690} stepIndex={0} stepCount={3} label="Lunch" time="12:41" mic={false} />
        </Phone>
      </div>
      <div className="phone-at" style={{ left: 1080 - 42 - 417 * 0.86, top: 1014, transform: 'rotate(7deg)', transformOrigin: '0 0' }}>
        <Phone time="12:41" style={{ '--s': 0.86 } as CSSProperties}>
          <InputScreen field="protein" value={41} stepIndex={1} stepCount={3} label="Lunch" time="12:41" mic={false} />
        </Phone>
      </div>
      <div className="phone-at" style={{ left: (1080 - 417) / 2, top: 930, zIndex: 4 }}>
        <Phone time="12:41" style={{ '--s': 1 } as CSSProperties}>
          <TodayScreen meals={DAY} />
        </Phone>
      </div>
    </div>
  );
}
