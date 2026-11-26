import type { CSSProperties } from 'react';
import { Phone, TodayScreen, type MealGroup } from '../../../../src/components/screens/ios';
import { BURRITO } from '../../../../src/components/screens/Voice';
import {
  Header,
  Touch,
  VoiceBarFrame,
  Words,
  easeInOut,
  easeOut,
  em,
  lerp,
  prog,
  within,
  type BarTimes,
  type Finger,
} from '../kit';
import { BREAKFAST } from './Swipe';

/*
  Voice: hold the plus on Today and say the meal. The bar listens while it's held (the app's VoiceHoldButton), the
  speech is transcribed on the phone, Apple Intelligence estimates it, and letting go logs it without opening the
  entry screen. The cards beside the phone show what the app keeps to itself: the words it heard and the estimate
  they became. The timings are the app's: a 0.2s hold before it listens, 1.3s estimating, 2.2s showing the result.
*/

const PLUS = { x: 393 - 20 - 29, y: 852 - 54 - 29 };
const PRESS = 0.95;
const T: BarTimes = (() => {
  const open = PRESS + 0.2;
  const listen = open + 0.2;
  const estimate = listen + BURRITO.length + 0.35;
  const confirm = estimate + 1.3;
  return { open, listen, estimate, confirm, close: confirm + 2.2 };
})();
const FADE = T.close + 2.6; // everything eases back to the start, so the loop is seamless
export const VOICE_LENGTH = FADE + 0.6;

const guess = BURRITO.guess;
const LUNCH: MealGroup = { id: 'lunch', label: 'Lunch', time: '12:41 PM', emojis: [em(guess.emoji)], calories: guess.calories, protein: guess.protein };

function finger(t: number): Finger | null {
  if (t < 0.25 || t > T.estimate + 0.4) return null;
  const k = easeInOut(prog(t, 0.35, PRESS - 0.05));
  return {
    x: lerp(PLUS.x - 70, PLUS.x, k),
    y: lerp(PLUS.y - 190, PLUS.y, k),
    shown: within(t, 0.25, T.estimate + 0.4, 0.22),
    press: within(t, PRESS - 0.06, T.estimate + 0.04, 0.08),
  };
}

export default function Voice({ t }: { t: number }) {
  const reset = easeInOut(prog(t, FADE, FADE + 0.6)); // 1 at the very end: back to the opening frame
  const logged = t >= T.confirm;
  const open = easeOut(prog(t, T.open, T.open + 0.25)) * (1 - easeInOut(prog(t, T.close, T.close + 0.3)));
  const heard = t - T.listen;
  const held = t >= T.listen && t < T.estimate;
  const rowIn = easeOut(prog(t, T.confirm, T.confirm + 0.65));
  const cardsOut = 1 - reset;
  const card1 = easeOut(prog(t, T.listen - 0.1, T.listen + 0.3)) * cardsOut;
  const card2 = easeOut(prog(t, T.estimate, T.estimate + 0.35)) * cardsOut;
  const result = easeOut(prog(t, T.confirm, T.confirm + 0.3));

  return (
    <div className="slide bg-light">
      <Header topic="Voice" n={7} />
      <div className="top">
        <h2 className="title">Or just say what you ate.</h2>
        <p className="sub">
          Hold the plus and talk. Your words are transcribed on the iPhone, Apple Intelligence estimates the meal, and
          it's logged when you let go. Nothing you say is stored.
        </p>
      </div>

      <div className="glow" style={{ '--glow': '#007aff', left: 812, top: 1150, opacity: 0.55 + 0.45 * open } as CSSProperties} />

      <div className="card" style={{ left: 76, top: 592, width: 470, opacity: card1, transform: `translateY(${(1 - card1) * 16}px)` }}>
        <span className="k">
          <i style={{ background: held ? '#ff3b30' : '#c7c7cc' }} />
          Transcribed on device
        </span>
        <p className="said">
          <Words script={BURRITO} heard={heard} />
        </p>
      </div>

      <svg className="flow" width="40" height="92" viewBox="0 0 40 92" style={{ left: 120, top: 846, opacity: card2 }}>
        <path d="M20 4v76M10 70l10 12 10-12" fill="none" stroke="#a1a1a6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <div className="card" style={{ left: 76, top: 954, width: 470, opacity: card2, transform: `translateY(${(1 - card2) * 16}px)` }}>
        <span className="k">
          <i style={{ background: 'linear-gradient(135deg, #34c759, #007aff)' }} />
          Apple Intelligence
        </span>
        <div style={{ position: 'relative' }}>
          <p className="guess" style={{ opacity: 1 - result, position: 'absolute', color: 'var(--muted)', fontWeight: 500 }}>
            Estimating…
          </p>
          <div style={{ opacity: result }}>
            <p className="guess">
              {em(guess.emoji)} {guess.name}
            </p>
            <p className="nums">
              <b>{guess.calories}</b> kcal · <b>{guess.protein} g</b> protein
            </p>
          </div>
        </div>
      </div>

      <p className="note" style={{ left: 76, top: 1252, width: 470, opacity: card1 }}>
        <span className="k">In the app</span>
        No transcript, just a waveform that moves with your voice.
      </p>

      <div className="phone-at" style={{ left: 600, top: 506 }}>
        <Phone
          className="row-in voice-phone"
          time="12:41"
          style={
            {
              '--s': 1,
              '--chrome-o': 1 - open,
              '--row-o': rowIn,
              '--row-y': `${18 * (1 - rowIn)}px`,
              '--row-s': 0.96 + 0.04 * rowIn,
            } as CSSProperties
          }
        >
          {/* At the end the logged day dissolves back into the morning, so the loop starts where it began. */}
          {reset < 1 && (
            <div className="layer" style={{ opacity: 1 - reset }}>
              <TodayScreen meals={logged ? [BREAKFAST, LUNCH] : [BREAKFAST]} newId="lunch" pressing={t >= PRESS && t < T.open} />
            </div>
          )}
          {reset > 0 && (
            <div className="layer" style={{ opacity: reset }}>
              <TodayScreen meals={[BREAKFAST]} />
            </div>
          )}
          {held && (
            <span className="ios-voice-cancel" style={{ opacity: easeOut(prog(t, T.listen + 0.3, T.listen + 0.6)) }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M2 8l4-4 4 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Slide up to cancel
            </span>
          )}
          <VoiceBarFrame
            t={t}
            times={T}
            script={BURRITO}
            confirmation={{ emoji: guess.emoji, title: guess.name, detail: `${guess.calories} kcal · ${guess.protein}g` }}
          />
          {(() => {
            const f = finger(t);
            return f && <Touch f={f} />;
          })()}
        </Phone>
      </div>
    </div>
  );
}
