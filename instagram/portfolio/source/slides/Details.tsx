import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { InputScreen, Phone } from '../../../../src/components/screens/ios';
import { Header } from '../kit';

/*
  The entry screen, annotated. Each note's leader line is drawn to the element it describes, measured from the
  rendered phone, so the lines land on the real thing at whatever size the phone is drawn.
*/

const SCALE = 1.22;
const PHONE = { left: 52, top: 300 };
const COLUMN = { x: 640, width: 364 };

const NOTES: { el: string; at: 'top' | 'mid' | 'low'; key: string; text: string }[] = [
  { el: '.ios-segments', at: 'mid', key: 'Progress', text: 'One 3 pt bar for each step.' },
  { el: '.ios-entry', at: 'mid', key: 'Header', text: 'Meal and time weigh the same. Change the time and the meal follows.' },
  { el: '.ios-fill', at: 'top', key: 'Fill', text: 'The meal’s colour at 14%, under a 1 pt line of the full colour.' },
  { el: '.ios-caption', at: 'mid', key: 'Caption', text: '13 pt semibold, 1.6 tracking, in the meal’s colour.' },
  { el: '.ios-number', at: 'mid', key: 'Number', text: '128 pt ultralight, −6 tracking, tabular figures, so the digits hold still as they count.' },
  { el: '.left-third', at: 'low', key: 'Gestures', text: 'Tap the left third to go back. Swipe in from the edge to cancel.' },
];

interface Placed {
  // Where the line starts (on the element) and where its note sits.
  x0: number;
  y0: number;
  y: number;
}

export default function Details() {
  const root = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState<Placed[] | null>(null);

  useLayoutEffect(() => {
    if (placed || !root.current) return;
    const base = root.current.getBoundingClientRect();
    const notes = [...root.current.querySelectorAll<HTMLElement>('.detail-note')];
    let floor = 300;
    const result = NOTES.map((n, i) => {
      const r = root.current!.querySelector(n.el)!.getBoundingClientRect();
      const y0 = (n.at === 'top' ? r.top : n.at === 'low' ? r.top + r.height * 0.8 : r.top + r.height / 2) - base.top;
      // The line starts at the element's right-hand end; the fill spans the screen and the third is a zone, so their
      // lines start inside them.
      const x0 =
        n.el === '.ios-fill' ? r.left + r.width * 0.72 - base.left : n.el === '.left-third' ? r.left + r.width * 0.5 - base.left : r.right - base.left + 12;
      const h = notes[i].offsetHeight;
      // Centre each note on its element, then push down past the one above.
      const y = Math.max(floor, y0 - h / 2);
      floor = y + h + 34;
      return { x0, y0, y };
    });
    setPlaced(result);
  });

  return (
    <div className="slide bg-white" ref={root}>
      <Header topic="Details" n={6} />
      <div className="top">
        <h2 className="title">Measured to the point.</h2>
      </div>

      <div className="phone-at" style={{ left: PHONE.left, top: PHONE.top }}>
        <Phone time="12:41" style={{ '--s': SCALE } as CSSProperties}>
          <InputScreen field="calories" value={520} stepIndex={0} stepCount={3} label="Lunch" time="12:41" mic={false}>
            <div className="left-third" />
          </InputScreen>
        </Phone>
      </div>

      {NOTES.map((n, i) => {
        const p = placed?.[i];
        const lineY = p ? p.y + 20 : 0;
        return (
          <div key={n.key}>
            {p && (
              <svg className="leader" width="1080" height="1440" viewBox="0 0 1080 1440">
                <path
                  d={`M${p.x0} ${p.y0} L${COLUMN.x - 56} ${p.y0} L${COLUMN.x - 22} ${lineY} L${COLUMN.x - 8} ${lineY}`}
                  fill="none"
                  stroke="#0a0a0a"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <circle cx={p.x0} cy={p.y0} r="7" fill="#0a0a0a" stroke="#fff" strokeWidth="3" />
              </svg>
            )}
            <div
              className="note detail-note"
              style={{ left: COLUMN.x, width: COLUMN.width, top: p?.y ?? 0, visibility: p ? 'visible' : 'hidden' }}
            >
              <span className="k">{n.key}</span>
              {n.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}
