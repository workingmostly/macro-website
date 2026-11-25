import { useId, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { SAMPLE_DAY, StatsCard, fmt } from './screens/ios';

/*
  The working controls in the Features section. Each is a small island that hydrates as it scrolls into view, and
  renders its default state on the server, so without JavaScript it's still the right picture. The maths and the
  wording are the app's own (MacroMath, GoalMath, the Goals & Tracking screen).
*/

/* ── Controls ───────────────────────────────────────────────── */

export function Switch({
  label,
  detail,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  detail?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 py-2 pr-3 pl-4 text-[16px] has-disabled:cursor-default">
      <span className={disabled ? 'text-ink/35' : undefined}>
        {label}
        {detail && <span className={`ml-1 text-[13px] ${disabled ? '' : 'text-muted'}`}>{detail}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="ios-switch" aria-hidden="true" />
    </label>
  );
}

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  className = '',
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const name = useId();
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`ios-seg ${className}`}
      style={{ '--n': String(options.length), '--i': String(index) } as CSSProperties}
    >
      <span className="ios-seg-thumb" aria-hidden="true" />
      {options.map((o) => (
        <label key={o.value}>
          <input
            type="radio"
            name={name}
            value={o.value}
            className="sr-only"
            checked={o.value === value}
            onChange={() => onChange(o.value)}
          />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

/* ── Carbs and fat, worked out for you ──────────────────────── */

const DAY = SAMPLE_DAY.reduce((t, m) => ({ calories: t.calories + m.calories, protein: t.protein + m.protein }), {
  calories: 0,
  protein: 0,
});

/** The sample day's stats card, which opens and shuts like the app's, to show carbs and fat worked out. */
export function MacroSplitDemo() {
  const [open, setOpen] = useState(true);

  return (
    <div className="w-full max-w-[380px]">
      <div className="ios-scope rounded-[24px] shadow-[0_24px_60px_-28px_rgb(0_0_0/0.35)]">
        <StatsCard calories={DAY.calories} protein={DAY.protein} expanded={open} onToggle={() => setOpen((v) => !v)} />
      </div>
      <p className="mt-5 text-center font-mono text-[13px] text-ink/45">kcal = 4 × protein + 4 × carbs + 9 × fat</p>
    </div>
  );
}

/* ── Emoji, not ingredients ─────────────────────────────────── */

const FOODS = [
  { emoji: '🍣', name: 'Sushi' },
  { emoji: '🥗', name: 'Salad' },
  { emoji: '🍗', name: 'Chicken' },
  { emoji: '🍕', name: 'Pizza' },
  { emoji: '🥪', name: 'Sandwich' },
];

export function EmojiDemo() {
  const [picked, setPicked] = useState('🍗');
  const [touched, setTouched] = useState(false);

  return (
    <div className="flex flex-col items-center">
      {/* Only pops once someone's picked one, not as the page loads. */}
      <span key={picked} className={`text-[64px] leading-none ${touched ? 'emoji-pop' : ''}`} aria-hidden="true">
        {picked}
      </span>
      <div className="mt-6 flex gap-2" role="group" aria-label="Tag the meal with a food">
        {FOODS.map((f) => (
          <button
            key={f.emoji}
            type="button"
            className="emoji-chip"
            aria-pressed={f.emoji === picked}
            aria-label={f.name}
            onClick={() => {
              setTouched(true);
              setPicked(f.emoji);
            }}
          >
            {f.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Goals in a minute ──────────────────────────────────────── */

type Direction = 'lose' | 'maintain' | 'gain';

const DIRECTIONS = [
  { value: 'lose', label: 'Lose' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'gain', label: 'Gain' },
] as const;

// One sample person through the calculator: 42, 175 cm, 66 kg, body fat not given, moderately active, at the
// default 0.5 kg a week.
const PERSON = { male: true, age: 42, heightCm: 175, weightKg: 66, activity: 1.55, ratePerWeekKg: 0.5 };

/** GoalMath.calculate, with the protein level the calculator picks for each goal (high to lose, else balanced). */
function goalsFor(direction: Direction) {
  const { male, age, heightCm, weightKg, activity, ratePerWeekKg } = PERSON;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (male ? 5 : -161);
  const tdee = bmr * activity;
  const sign = direction === 'lose' ? -1 : direction === 'gain' ? 1 : 0;
  const delta = (sign * ratePerWeekKg * 7700) / 7;
  const floor = Math.max(male ? 1500 : 1200, bmr * 1.05);
  const calories = Math.round(Math.max(floor, tdee + delta) / 10) * 10;
  const perLb = direction === 'lose' ? 1.1 : 0.9;
  const protein = Math.round((weightKg * 2.20462 * perLb) / 5) * 5;
  return { calories, protein };
}

const GOAL_LINES: Record<Direction, string> = {
  lose: 'On track to lose 0.5 kg a week.',
  maintain: 'Enough to hold your weight where it is.',
  gain: 'On track to gain 0.5 kg a week.',
};

export function GoalsDemo() {
  const [direction, setDirection] = useState<Direction>('lose');
  const goals = goalsFor(direction);

  return (
    <div className="ios-scope w-full max-w-[300px]">
      <Segmented label="Your goal" options={DIRECTIONS} value={direction} onChange={setDirection} />
      <div className="mt-4 flex rounded-[16px] bg-white py-3" aria-live="polite">
        <Result title="Calories" value={fmt(goals.calories)} />
        <span className="w-[0.5px] self-stretch bg-[rgb(60_60_67/0.29)]" aria-hidden="true" />
        <Result title="Protein" value={`${goals.protein} g`} />
      </div>
      <p className="mt-3 text-center text-[13px] text-muted">{GOAL_LINES[direction]}</p>
    </div>
  );
}

function Result({ title, value }: { title: string; value: ReactNode }) {
  return (
    <div className="flex-1 px-4">
      <p className="text-[13px] text-muted">{title}</p>
      <p className="mt-0.5 text-[22px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}

/* ── Track as much as you like ──────────────────────────────── */

export function TrackingDemo() {
  const [calories, setCalories] = useState(true);
  const [macros, setMacros] = useState(true);
  const [fibre, setFibre] = useState(false);
  const [emojis, setEmojis] = useState(true);

  return (
    <div className="ios-scope w-full max-w-[320px]">
      <div className="divide-y-[0.5px] divide-black/10 overflow-hidden rounded-[14px] bg-white">
        <Switch
          label="Calories"
          checked={calories}
          onChange={(on) => {
            // Carbs and fat come from calories, so macros go off with them, as in the app.
            setCalories(on);
            if (!on) setMacros(false);
          }}
        />
        <Switch label="Macros" detail="(Protein, carbs and fat)" checked={macros} disabled={!calories} onChange={setMacros} />
        <Switch label="Fibre" checked={fibre} onChange={setFibre} />
        <Switch label="Food emojis" checked={emojis} onChange={setEmojis} />
      </div>
    </div>
  );
}
