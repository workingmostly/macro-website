import { useState } from 'react';
import { Segmented } from '../FeatureDemos';
import { ADHERENCE, GOALS, PROTEIN_BLUE, fmt } from './ios';

/*
  The Summary tab (WeeklySummaryView), boiled down to its two main parts so the card sits level with its
  neighbour: how many days landed both goals, day by day, with the On track pill; and the week's chart, with a
  ghost of what the days still to come would need for the week to average out at the goal.

  A sample week, seen on Saturday: Monday to Friday are judged, Saturday is today with lunch logged so far, and
  Sunday is still to come. Wednesday went over on calories and under on protein; the rest landed both.
*/

const DAYS = [
  { day: 'Mon', calories: 2180, protein: 162 },
  { day: 'Tue', calories: 2050, protein: 171 },
  { day: 'Wed', calories: 2560, protein: 131 },
  { day: 'Thu', calories: 2240, protein: 166 },
  { day: 'Fri', calories: 2120, protein: 158 },
  { day: 'Sat', calories: 1240, protein: 74 },
  { day: 'Sun', calories: 0, protein: 0 },
];
const TODAY = 5;

// The default ±10% calorie window, and protein from 90% of its goal up.
const LOW = Math.round(GOALS.calories * 0.9);
const HIGH = Math.round(GOALS.calories * 1.1);
const FLOOR = Math.round(GOALS.protein * 0.9);

const judged = DAYS.slice(0, TODAY);
const caloriesHit = (d: (typeof DAYS)[number]) => d.calories >= LOW && d.calories <= HIGH;
const proteinHit = (d: (typeof DAYS)[number]) => d.protein >= FLOOR;
const hits = judged.filter((d) => caloriesHit(d) && proteinHit(d)).length;

/** What each day left would need for the week to average out at the goal (WeeklySummaryView.ghostTarget). */
const ghost = (metric: 'calories' | 'protein') => {
  const left = GOALS[metric] * DAYS.length - judged.reduce((t, d) => t + d[metric], 0);
  return Math.round(left / (DAYS.length - TODAY));
};

const METRICS = [
  { value: 'calories', label: 'Calories' },
  { value: 'protein', label: 'Protein' },
] as const;
type Metric = (typeof METRICS)[number]['value'];

export function SummaryCard({ className = '' }: { className?: string }) {
  const [metric, setMetric] = useState<Metric>('calories');

  return (
    <div className={`ios-scope w-full max-w-[380px] text-left ${className}`}>
      <div className="rounded-[22px] bg-white p-4 shadow-[0_10px_30px_-20px_rgb(0_0_0/0.3)]">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-baseline gap-1.5">
            <span className="font-rounded text-[34px] leading-none font-bold tabular-nums">{hits}</span>
            <span className="text-[18px] font-semibold text-muted">of {judged.length} days</span>
          </p>
          <span className="ios-badge" style={{ color: ADHERENCE.on, background: 'rgb(52 199 89 / 0.16)' }}>
            On track
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6.6" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="8" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="8" cy="8" r="1.1" fill="currentColor" />
            </svg>
          </span>
        </div>
        <ol className="mt-3 grid grid-cols-7" aria-label="Each day this week">
          {DAYS.map((d, i) => (
            <DayMarker key={d.day} index={i} day={d} />
          ))}
        </ol>
      </div>

      <div className="mt-2.5 rounded-[22px] bg-white p-4 shadow-[0_10px_30px_-20px_rgb(0_0_0/0.3)]">
        <Segmented label="Chart" options={METRICS} value={metric} onChange={setMetric} />
        <WeekChart metric={metric} />
      </div>
    </div>
  );
}

/** A green tick for a day that landed both goals, orange with the over/under mark for a miss, a quiet dot for the
    days still to come, and today ringed in blue. */
function DayMarker({ index, day }: { index: number; day: (typeof DAYS)[number] }) {
  const isToday = index === TODAY;
  const counts = index < TODAY;
  const hit = counts && caloriesHit(day) && proteinHit(day);
  const over = !caloriesHit(day) && day.calories > GOALS.calories;
  const label = `${day.day}${isToday ? ', today' : ''}: ${
    !counts ? (isToday ? 'not counted yet' : 'still to come') : hit ? 'hit both goals' : over ? 'missed, over' : 'missed, under'
  }`;

  return (
    <li className="flex flex-col items-center gap-[7px]" aria-label={label}>
      <span
        className="grid size-[38px] place-items-center rounded-full"
        style={isToday ? { boxShadow: `inset 0 0 0 2px ${PROTEIN_BLUE}` } : undefined}
        aria-hidden="true"
      >
        {!counts ? (
          <span className="size-2 rounded-full bg-[rgb(118_118_128/0.12)]" />
        ) : hit ? (
          <span className="grid size-[30px] place-items-center rounded-full text-white" style={{ background: ADHERENCE.on }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2.3 6.8l2.9 2.9 5.6-6.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : (
          <span className="grid size-[30px] place-items-center rounded-full text-white" style={{ background: ADHERENCE.off }}>
            <GoalLine over={over} />
          </span>
        )}
      </span>
      <span
        className={`text-[12px] ${isToday ? 'font-bold text-ios-blue' : 'font-medium text-muted'}`}
        aria-hidden="true"
      >
        {day.day[0]}
      </span>
    </li>
  );
}

/** GoalLineIcon: a dashed goal line with an arrow crossing it, up for over and down for under. */
function GoalLine({ over }: { over: boolean }) {
  const w = 11;
  const h = 13;
  const tip = over ? h * 0.08 : h * 0.92;
  const tail = over ? h * 0.88 : h * 0.12;
  const head = h * 0.3;
  const shaftEnd = over ? tip + head * 0.55 : tip - head * 0.55;
  const base = over ? tip + head : tip - head;
  return (
    <svg width={w * 1.15} height={h * 1.15} viewBox={`0 0 ${w} ${h}`} fill="none" aria-hidden="true">
      <path d={`M0.5 ${h * 0.64}H${w - 0.5}`} stroke="currentColor" strokeOpacity="0.42" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1.55 1.35" />
      <path d={`M${w / 2} ${tail}V${shaftEnd}`} stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      <path d={`M${w / 2} ${tip}L${w / 2 - 3.3} ${base}H${w / 2 + 3.3}Z`} fill="currentColor" />
    </svg>
  );
}

/** The week's bars against the goal's band, the days still to come drawn as ghosts with what they'd need. Like the
    app's chart, switching swaps the bars straight over rather than animating them. */
function WeekChart({ metric }: { metric: Metric }) {
  const goal = GOALS[metric];
  const tint = metric === 'calories' ? ADHERENCE.on : PROTEIN_BLUE;
  const values = DAYS.map((d) => d[metric]);
  const need = ghost(metric);
  const bandLow = metric === 'calories' ? LOW : FLOOR;
  const bandHigh = metric === 'calories' ? HIGH : Math.max(goal, ...values);
  const top = Math.max(goal, bandHigh, ...values, need) * 1.18;
  const ticks = metric === 'calories' ? [0, 1000, 2000, 3000] : [0, 50, 100, 150, 200];

  const W = 330;
  const H = 136;
  const left = 34;
  const bottom = 22;
  const y = (v: number) => H - bottom - ((H - bottom - 4) * v) / top;
  const slot = (W - left) / DAYS.length;
  const barW = slot * 0.55;
  const bar = (x: number, v: number, fill: string) => (
    <rect x={x} y={y(v)} width={barW} height={y(0) - y(v)} rx="5" fill={fill} />
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mt-3 block w-full"
      role="img"
      aria-label={
        metric === 'calories'
          ? `Calories each day against the ${fmt(LOW)} to ${fmt(HIGH)} window: Wednesday went over, the rest landed in it. Saturday and Sunday would need about ${fmt(need)} each for the week to average out at ${fmt(goal)}.`
          : `Protein each day against the ${FLOOR} gram floor: Wednesday fell short, the rest cleared it. Saturday and Sunday would need about ${need} grams each for the week to average out at ${goal}.`
      }
    >
      <rect x={left} y={y(bandHigh)} width={W - left} height={y(bandLow) - y(bandHigh)} fill={tint} fillOpacity="0.12" />
      {ticks.map((v) => (
        <g key={v}>
          <line x1={left} x2={W} y1={y(v)} y2={y(v)} stroke="#e5e5ea" strokeWidth="1" />
          <text x={left - 6} y={y(v) + 3.5} textAnchor="end" fontSize="10" fill="#8a8a8e">
            {fmt(v)}
          </text>
        </g>
      ))}
      {DAYS.map((d, i) => {
        const v = d[metric];
        const x = left + i * slot + (slot - barW) / 2;
        const remaining = i >= TODAY;
        const hit = metric === 'calories' ? caloriesHit(d) : proteinHit(d);
        return (
          <g key={d.day}>
            {remaining && (
              <>
                {bar(x, need, 'rgb(60 60 67 / 0.1)')}
                {/* Haloed, since it often lands on the dashed goal line. */}
                <text
                  x={x + barW / 2}
                  y={y(need) - 4}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill="#8a8a8e"
                  stroke="#fff"
                  strokeWidth="3"
                  paintOrder="stroke"
                >
                  {fmt(need)}
                </text>
              </>
            )}
            {(!remaining || v > 0) && bar(x, v, remaining ? 'rgb(60 60 67 / 0.3)' : hit ? tint : ADHERENCE.off)}
            <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="#8a8a8e">
              {d.day}
            </text>
          </g>
        );
      })}
      <line x1={left} x2={W} y1={y(goal)} y2={y(goal)} stroke="#8a8a8e" strokeWidth="1" strokeDasharray="4 3" />
    </svg>
  );
}
