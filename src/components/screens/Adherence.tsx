import { useState } from 'react';
import { Segmented } from '../FeatureDemos';
import { ADHERENCE, GOALS, fmt } from './ios';

// Mon–Sat logged and Sunday is today, which isn't judged yet, matching GoalAdherence's Monday–Sunday week.
// Wednesday misses both goals; the other five land both, so it's 5 of 6.
const WEEK = [
  { day: 'Mon', calories: 2180, protein: 162 },
  { day: 'Tue', calories: 2050, protein: 171 },
  { day: 'Wed', calories: 2560, protein: 131 },
  { day: 'Thu', calories: 2240, protein: 166 },
  { day: 'Fri', calories: 2120, protein: 158 },
  { day: 'Sat', calories: 2310, protein: 176 },
  { day: 'Sun', calories: 0, protein: 0 },
];

// The default ±10% calorie window, and protein from 90% of its goal up.
const LOW = Math.round(GOALS.calories * 0.9);
const HIGH = Math.round(GOALS.calories * 1.1);
const PROTEIN_FLOOR = Math.round(GOALS.protein * 0.9);

const logged = WEEK.filter((d) => d.calories > 0);
const onTarget = (d: (typeof WEEK)[number]) =>
  d.calories >= LOW && d.calories <= HIGH && d.protein >= PROTEIN_FLOOR;
const hits = logged.filter(onTarget).length;
// GoalAdherence averages logged days only, in whole numbers.
const average = Math.trunc(logged.reduce((t, d) => t + d.calories, 0) / logged.length);
const delta = average - GOALS.calories;

const METRICS = [
  { value: 'calories', label: 'Calories' },
  { value: 'protein', label: 'Protein' },
] as const;
type Metric = (typeof METRICS)[number]['value'];

/**
 * The Adherence sheet from the app: the verdict, why, and the week's bars, with its Calories and Protein switch.
 * Like the app's chart, switching swaps the bars straight over rather than animating them.
 */
export function AdherenceCard({ className = '' }: { className?: string }) {
  const [metric, setMetric] = useState<Metric>('calories');
  const values = WEEK.map((d) => d[metric]);
  const goal = GOALS[metric];
  const bandLow = metric === 'calories' ? LOW : PROTEIN_FLOOR;
  const bandHigh = metric === 'calories' ? HIGH : Math.max(goal, ...values);
  const top = Math.max(goal, bandHigh, ...values) * 1.15;
  const ticks = metric === 'calories' ? [0, 1000, 2000] : [0, 50, 100, 150, 200];

  const W = 330;
  const H = 168;
  const left = 34;
  const bottom = 22;
  const y = (v: number) => H - bottom - ((H - bottom - 4) * v) / top;
  const slot = (W - left) / WEEK.length;
  const barW = slot * 0.6;

  return (
    <div className={`ios-scope rounded-[28px] bg-white p-5 shadow-[0_24px_60px_-28px_rgb(0_0_0/0.3)] ${className}`}>
      <div className="rounded-[16px] p-4" style={{ background: 'rgb(117 189 133 / 0.14)' }}>
        <span className="ios-badge" style={{ color: ADHERENCE.on, background: 'rgb(117 189 133 / 0.16)' }}>
          On track
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6.6" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="8" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="8" cy="8" r="1.1" fill="currentColor" />
          </svg>
        </span>
        <p className="mt-2 text-[14px] leading-snug text-muted">
          {hits} of {logged.length} days this week hit both goals
        </p>
        <p className="mt-2 text-[14px] leading-snug text-muted">
          On days you logged, you averaged {fmt(average)} kcal, {fmt(Math.abs(delta))} kcal{' '}
          {delta > 0 ? 'over' : 'under'} your {fmt(GOALS.calories)} kcal calorie goal.
        </p>
      </div>

      <p className="mt-5 text-[14px] font-semibold text-muted">This week</p>
      <Segmented label="Chart" options={METRICS} value={metric} onChange={setMetric} className="mt-2.5" />

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 block w-full"
        role="img"
        aria-label={
          metric === 'calories'
            ? `Calories each day this week against the ${fmt(LOW)} to ${fmt(HIGH)} window: Wednesday is over, the rest are in it.`
            : `Protein each day this week against the ${PROTEIN_FLOOR} gram floor: Wednesday is under, the rest clear it.`
        }
      >
        <rect x={left} y={y(bandHigh)} width={W - left} height={y(bandLow) - y(bandHigh)} fill="rgb(117 189 133 / 0.12)" />
        {ticks.map((v) => (
          <g key={v}>
            <line x1={left} x2={W} y1={y(v)} y2={y(v)} stroke="#e5e5ea" strokeWidth="1" />
            <text x={left - 6} y={y(v) + 3.5} textAnchor="end" fontSize="10" fill="#8a8a8e">
              {fmt(v)}
            </text>
          </g>
        ))}
        {WEEK.map((d, i) => {
          const value = d[metric];
          const x = left + i * slot + (slot - barW) / 2;
          const hit = metric === 'calories' ? value >= LOW && value <= HIGH : value >= PROTEIN_FLOOR;
          return (
            <g key={d.day}>
              {value > 0 && (
                <rect x={x} y={y(value)} width={barW} height={y(0) - y(value)} fill={hit ? ADHERENCE.on : ADHERENCE.off} />
              )}
              <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="#8a8a8e">
                {d.day}
              </text>
            </g>
          );
        })}
        <line x1={left} x2={W} y1={y(goal)} y2={y(goal)} stroke="#8a8a8e" strokeWidth="1" strokeDasharray="4 3" />
      </svg>
    </div>
  );
}
