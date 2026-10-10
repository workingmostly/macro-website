import { GOALS, fmt } from './ios';

const GREEN = '#34c759';
const ORANGE = '#f2a144';

// Mon–Sat logged, Sunday is today (not judged yet), matching GoalAdherence's Monday–Sunday week.
const WEEK = [
  { day: 'Mon', kcal: 2180 },
  { day: 'Tue', kcal: 2050 },
  { day: 'Wed', kcal: 2560 },
  { day: 'Thu', kcal: 2240 },
  { day: 'Fri', kcal: 2120 },
  { day: 'Sat', kcal: 2310 },
  { day: 'Sun', kcal: 0 },
];

const TOLERANCE = 0.1;

/** The Adherence sheet from the app: verdict, explanation and the week's calorie bars. */
export function AdherenceCard({ className = '' }: { className?: string }) {
  const low = GOALS.calories * (1 - TOLERANCE);
  const high = GOALS.calories * (1 + TOLERANCE);
  const hits = WEEK.filter((d) => d.kcal >= low && d.kcal <= high).length;
  const judged = WEEK.filter((d) => d.kcal > 0).length;

  const W = 330;
  const H = 170;
  const left = 38;
  const bottom = 22;
  const max = 2800;
  const y = (v: number) => H - bottom - ((H - bottom - 6) * v) / max;
  const slot = (W - left) / WEEK.length;
  const barW = slot * 0.66;

  return (
    <div className={`ios-scope rounded-[28px] bg-white p-5 shadow-[0_24px_60px_-28px_rgb(0_0_0/0.3)] ${className}`}>
      <div className="rounded-[16px] p-4" style={{ background: 'rgb(52 199 89 / 0.12)' }}>
        <span
          className="ios-badge"
          style={{ color: GREEN, background: 'rgb(52 199 89 / 0.16)', height: 28, fontSize: 16 }}
        >
          On track
        </span>
        <p style={{ marginTop: 10, fontSize: 15, color: '#6e6e73' }}>
          {hits} of {judged} days this week hit both goals
        </p>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 block w-full" role="img" aria-label="Calories per day this week against the goal band">
        {[0, 1000, 2000].map((v) => (
          <g key={v}>
            <line x1={left} x2={W} y1={y(v)} y2={y(v)} stroke="#e5e5ea" strokeWidth="1" />
            <text x={left - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="#8a8a8e">
              {fmt(v)}
            </text>
          </g>
        ))}
        <rect x={left} y={y(high)} width={W - left} height={y(low) - y(high)} fill="rgb(52 199 89 / 0.12)" />
        {WEEK.map((d, i) => {
          const x = left + i * slot + (slot - barW) / 2;
          const hit = d.kcal >= low && d.kcal <= high;
          return (
            <g key={d.day}>
              {d.kcal > 0 && (
                <rect x={x} y={y(d.kcal)} width={barW} height={y(0) - y(d.kcal)} rx="3" fill={hit ? GREEN : ORANGE} opacity={hit ? 0.8 : 0.9} />
              )}
              <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="#8a8a8e">
                {d.day}
              </text>
            </g>
          );
        })}
        <line x1={left} x2={W} y1={y(GOALS.calories)} y2={y(GOALS.calories)} stroke="#5aa9ff" strokeWidth="1.2" strokeDasharray="4 3" />
      </svg>
    </div>
  );
}
