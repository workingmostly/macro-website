import { TYPICAL_STEPS } from '../../../../src/components/screens/Typical';
import { Header } from '../kit';

/*
  What it's for. The same homemade spag bol the site's comparison logs: fourteen steps in a typical
  food-database tracker, two in Macro. The lists are drawn at the same row height, so the difference is the length.
*/

export default function Purpose() {
  return (
    <div className="slide bg-light">
      <Header topic="Why" n={2} />
      <div className="top">
        <h2 className="title">A typical tracker takes 14 steps to log a meal. Macro takes two.</h2>
      </div>

      <div className="steps" style={{ left: 76, top: 478, width: 500 }}>
        <p className="caption steps-head">A typical tracker</p>
        {TYPICAL_STEPS.map((s, i) => (
          <div className="step" key={i}>
            <span className="mono">{String(i + 1).padStart(2, '0')}</span>
            {s.caption}
          </div>
        ))}
      </div>

      <div className="steps" style={{ left: 616, top: 478, width: 388 }}>
        <p className="caption steps-head" style={{ color: 'var(--ink)' }}>
          Macro
        </p>
        <div className="step" data-tone="green">
          <span className="mono">01</span>Swipe to 500 kcal
        </div>
        <div className="step" data-tone="blue">
          <span className="mono">02</span>Swipe to 35 g protein
        </div>
        <p className="steps-rest">Carbs and fat are worked out from what's left. Done.</p>
        <p className="purpose-body">
          No barcodes, no food database, no weighing.
          <br />
          <br />
          <b>Roughly right every day beats perfectly right for a week.</b>
        </p>
      </div>
    </div>
  );
}
