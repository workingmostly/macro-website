import type { CSSProperties } from 'react';
import { Header } from '../kit';
import { SwipePhone, swipeScreen } from './Swipe';

/* The cover: the icon, the name, what it is in a line, and a phone caught mid-swipe. */

const MID_SWIPE = 2.6; // a frame of the swipe slide: the finger most of the way up, 500-odd kcal

export default function Cover() {
  const s = swipeScreen(MID_SWIPE);
  return (
    <div className="slide bg-night">
      <Header topic="iOS app" n={1} dark />
      <div className="cover-glow" />
      <img className="cover-icon" src="/icon.png" alt="" />
      <h1 className="cover-name">Macro</h1>
      <p className="cover-line">A calorie and protein tracker that takes two swipes, or one sentence.</p>
      <p className="cover-credit">
        Designed and built
        <br />
        SwiftUI · Apple Intelligence
      </p>
      <div className="glow" style={{ '--glow': s.accent, left: 830, top: 1060, opacity: 0.9 } as CSSProperties} />
      <div className="phone-at" style={{ left: 556, top: 500 }}>
        <SwipePhone t={MID_SWIPE} scale={1.3} trail />
      </div>
    </div>
  );
}
