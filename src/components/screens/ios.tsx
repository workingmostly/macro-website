import type { CSSProperties, ReactNode } from 'react';

/* ────────────────────────────────────────────────────────────
   Shared model + maths, mirroring the app's Support/ folder.
   ──────────────────────────────────────────────────────────── */

export type MealLabel = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
export type Field = 'calories' | 'protein' | 'emoji';

export interface MealGroup {
  id: string;
  label: MealLabel;
  time: string;
  emojis: string[];
  calories: number;
  protein: number;
}

/** The app's default goals. */
export const GOALS = { calories: 2200, protein: 160 };
/** Default split of the calories left after protein (MacroMath.defaultCarbsSplitPercent). */
export const CARBS_SPLIT = 0.6;

export const PROTEIN_BLUE = '#007aff';
export const FILL_MAX: Record<'calories' | 'protein', number> = { calories: 800, protein: 80 };

export const EMOJI_PALETTE = ['🍽️', '🍣', '🍗', '🥗', '🍕', '🍔', '🥪', '🍎'];

const nf = new Intl.NumberFormat('en-GB');
export const fmt = (n: number) => nf.format(Math.round(n));

/** CalorieColor.swift — green through 750, yellow at 1050, orange at 1400, red at 1800+. */
const STOPS: [number, [number, number, number]][] = [
  [0, [52, 199, 89]],
  [750, [52, 199, 89]],
  [1050, [255, 204, 0]],
  [1400, [255, 149, 0]],
  [1800, [255, 59, 48]],
];

export function calorieAccent(calories: number): string {
  const v = Math.max(0, calories);
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [lo, a] = STOPS[i];
    const [hi, b] = STOPS[i + 1];
    if (v <= hi) {
      const t = hi === lo ? 0 : (v - lo) / (hi - lo);
      const c = a.map((x, j) => Math.round(x + (b[j] - x) * t));
      return `rgb(${c[0]} ${c[1]} ${c[2]})`;
    }
  }
  const last = STOPS[STOPS.length - 1][1];
  return `rgb(${last[0]} ${last[1]} ${last[2]})`;
}

/** DragScale.swift — piecewise-linear "gearing" from drag distance to value. */
export class DragScale {
  constructor(private zones: { span: number; sensitivity: number }[]) {}

  position(value: number): number {
    let position = 0;
    let remaining = Math.max(0, value);
    for (const zone of this.zones) {
      if (remaining <= zone.span) return position + remaining / zone.sensitivity;
      position += zone.span / zone.sensitivity;
      remaining -= zone.span;
    }
    return position + remaining / this.zones[this.zones.length - 1].sensitivity;
  }

  value(position: number): number {
    let remaining = Math.max(0, position);
    let value = 0;
    for (const zone of this.zones) {
      const span = zone.span / zone.sensitivity;
      if (remaining <= span) return value + remaining * zone.sensitivity;
      remaining -= span;
      value += zone.span;
    }
    return value + remaining * this.zones[this.zones.length - 1].sensitivity;
  }
}

export const SCALES = {
  calories: new DragScale([
    { span: 150, sensitivity: 0.7 },
    { span: 450, sensitivity: 1.1 },
    { span: 400, sensitivity: 2.2 },
    { span: 3000, sensitivity: 4.0 },
  ]),
  protein: new DragScale([
    { span: 80, sensitivity: 0.12 },
    { span: 80, sensitivity: 0.32 },
  ]),
};

export function macroSplit(calories: number, protein: number) {
  const rest = Math.max(0, calories - 4 * protein);
  return {
    carbs: Math.round((rest * CARBS_SPLIT) / 4),
    fat: Math.round((rest * (1 - CARBS_SPLIT)) / 9),
  };
}

/* ────────────────────────────────────────────────────────────
   Glyphs (SF Symbol stand-ins)
   ──────────────────────────────────────────────────────────── */

export function ChevronDown({ size = 10, weight = 2.2 }: { size?: number; weight?: number }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 10 6" fill="none" aria-hidden="true">
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Pencil() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 17l1-4L14 3l3 3L7 16l-4 1z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function Gear() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <g fill="#000">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <rect key={a} x="10" y="1.2" width="4" height="5" rx="1.2" transform={`rotate(${a} 12 12)`} />
        ))}
        <circle cx="12" cy="12" r="7.6" />
      </g>
      <circle cx="12" cy="12" r="3" fill="#fff" />
    </svg>
  );
}

function Target() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function Wand() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 10.5L7.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M8.6 1v1.6M8.6 5.4V7M10.9 3.9h-1.6M7.5 3.9H5.9"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Plus() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <path d="M13 4v18M4 13h18" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   Device
   ──────────────────────────────────────────────────────────── */

export function StatusBar({ time = '9:41' }: { time?: string }) {
  return (
    <div className="ios-status" aria-hidden="true">
      <div>
        <span className="ios-status-time">{time}</span>
      </div>
      <div>
        <svg width="19" height="12" viewBox="0 0 19 12">
          <rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" />
          <rect x="4.8" y="5" width="3.2" height="7" rx="0.7" />
          <rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" />
          <rect x="14.4" y="0" width="3.2" height="12" rx="0.7" />
        </svg>
        <svg width="17" height="12" viewBox="0 0 17 12">
          <path d="M8.5 3.2c2.3 0 4.4.9 5.9 2.4l1.1-1.1C13.7 2.7 11.2 1.5 8.5 1.5S3.3 2.7 1.5 4.5l1.1 1.1C4.1 4.1 6.2 3.2 8.5 3.2z" />
          <path d="M8.5 6.8c1.4 0 2.6.5 3.5 1.4l1.1-1.1c-1.3-1.2-2.9-2-4.6-2s-3.3.8-4.6 2L5 8.2c.9-.9 2.1-1.4 3.5-1.4z" />
          <circle cx="8.5" cy="10.5" r="1.5" />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" strokeOpacity="0.35" />
          <rect x="2" y="2" width="20" height="9" rx="2.2" />
          <path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" opacity="0.4" />
        </svg>
      </div>
    </div>
  );
}

interface PhoneProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  time?: string;
  /** Describes a static mockup to screen readers. */
  label?: string;
  /** Keeps the screen in the accessibility tree (the hero demo). */
  interactive?: boolean;
}

/** An iPhone at real point size (393 × 852), scaled by the `--s` custom property. */
export function Phone({ children, className = '', style, time, label, interactive = false }: PhoneProps) {
  const a11y = interactive ? {} : label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  return (
    <div className={`phone ${className}`} style={style} {...a11y}>
      <div className="phone-device">
        <div className="phone-screen" style={{ fill: 'currentColor' }}>
          {children}
          <StatusBar time={time} />
          <div className="phone-island" />
          <div className="phone-home" />
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Input screen
   ──────────────────────────────────────────────────────────── */

interface InputScreenProps {
  field: Field;
  value?: number;
  stepIndex?: number;
  stepCount?: number;
  label?: MealLabel;
  time?: string;
  emoji?: string;
  palette?: string[];
  onPickEmoji?: (emoji: string) => void;
  onCancel?: () => void;
  children?: ReactNode;
}

export function InputScreen({
  field,
  value = 0,
  stepIndex = 0,
  stepCount = 3,
  label = 'Lunch',
  time = '13:05',
  emoji = '🍽️',
  palette = EMOJI_PALETTE,
  onPickEmoji,
  onCancel,
  children,
}: InputScreenProps) {
  const isNumber = field !== 'emoji';
  const accent = field === 'calories' ? calorieAccent(value) : field === 'protein' ? PROTEIN_BLUE : '#8a8a8e';
  const fill = isNumber ? Math.min(1, Math.max(0, value / FILL_MAX[field])) : 0;

  return (
    <div className="ios-input" style={{ '--accent': accent } as CSSProperties}>
      {fill > 0 && <div className="ios-fill" style={{ height: `${fill * 100}%` }} />}

      <div className="ios-segments">
        {Array.from({ length: stepCount }, (_, i) => (
          <span key={i} data-on={i <= stepIndex} />
        ))}
      </div>

      <div className="ios-entry">
        Adding
        <b>
          {label} <ChevronDown />
        </b>
        at
        <b>
          {time} <ChevronDown />
        </b>
      </div>

      <div className="ios-readout">
        <div className="ios-caption" style={{ color: accent }}>
          {field === 'calories' ? 'CALORIES' : field === 'protein' ? 'PROTEIN' : 'FOOD'}
        </div>
        {isNumber ? (
          <>
            <div className="ios-number">{fmt(value)}</div>
            <div className="ios-unit">{field === 'calories' ? 'Kcal' : 'Grams'}</div>
          </>
        ) : (
          <div className="ios-emoji-big">{emoji}</div>
        )}
      </div>

      {field === 'emoji' && (
        <div className="ios-palette">
          {palette.map((e) => (
            <button
              key={e}
              type="button"
              aria-pressed={e === emoji}
              aria-label={`Tag with ${e}`}
              tabIndex={onPickEmoji ? 0 : -1}
              onPointerDown={(ev) => ev.stopPropagation()}
              onClick={() => onPickEmoji?.(e)}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      <div
        className="ios-cancel"
        role={onCancel ? 'button' : undefined}
        tabIndex={onCancel ? 0 : undefined}
        onPointerDown={onCancel ? (ev) => ev.stopPropagation() : undefined}
        onClick={onCancel}
      >
        Cancel
      </div>

      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Today screen
   ──────────────────────────────────────────────────────────── */

function totals(meals: MealGroup[]) {
  return meals.reduce((t, m) => ({ calories: t.calories + m.calories, protein: t.protein + m.protein }), {
    calories: 0,
    protein: 0,
  });
}

function MacroBar({ value, goal, color }: { value: number; goal: number; color: string }) {
  return (
    <div className="ios-bar">
      <span style={{ width: `${Math.min(100, (value / goal) * 100)}%`, background: color }} />
    </div>
  );
}

interface StatsCardProps {
  calories: number;
  protein: number;
  expanded?: boolean;
  className?: string;
}

export function StatsCard({ calories, protein, expanded = false, className = '' }: StatsCardProps) {
  const over = calories > GOALS.calories;
  const { carbs, fat } = macroSplit(calories, protein);
  const goalSplit = macroSplit(GOALS.calories, GOALS.protein);

  return (
    <div className={`ios-card ios-stats ${className}`}>
      <div className="ios-stats-row">
        <div className="ios-stat">
          <div className="ios-stat-label">Calories</div>
          <div className="ios-stat-value">
            {fmt(calories)} <small>/ {fmt(GOALS.calories)}</small>
          </div>
          <MacroBar value={calories} goal={GOALS.calories} color={over ? '#ff3b30' : '#34c759'} />
        </div>
        <div className="ios-stats-divider" />
        <div className="ios-stat">
          <div className="ios-stat-label">Protein</div>
          <div className="ios-stat-value">
            {fmt(protein)} <small>/ {GOALS.protein} g</small>
          </div>
          <MacroBar value={protein} goal={GOALS.protein} color={PROTEIN_BLUE} />
        </div>
        <div className="ios-chevron" style={{ transform: expanded ? 'rotate(180deg)' : undefined }}>
          <ChevronDown size={14} weight={2} />
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '0.5px solid rgb(60 60 67 / 0.2)', marginTop: 22, marginRight: 8 }}>
          {[
            { name: 'Carbs', value: carbs, goal: goalSplit.carbs, color: '#ff9500' },
            { name: 'Fat', value: fat, goal: goalSplit.fat, color: '#af52de' },
          ].map((m) => (
            <div className="ios-macro-row" key={m.name}>
              <div className="ios-macro-row-head">
                <span>{m.name}</span>
                <span className="ios-estimated">
                  <Wand /> Estimated
                </span>
                <span>
                  {m.value} / {m.goal} g
                </span>
              </div>
              <MacroBar value={m.value} goal={m.goal} color={m.color} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface TodayScreenProps {
  meals: MealGroup[];
  title?: string;
  onTrack?: boolean;
  expanded?: boolean;
  newId?: string | null;
  onAdd?: () => void;
}

export function TodayScreen({ meals, title = 'Today', onTrack = true, expanded = false, newId, onAdd }: TodayScreenProps) {
  const t = totals(meals);

  return (
    <div className="ios-today">
      <div className="ios-today-header">
        <div className="ios-large-title">{title}</div>
        {onTrack && (
          <span className="ios-badge" style={{ color: '#34c759', background: 'rgb(52 199 89 / 0.16)' }}>
            On track <Target />
          </span>
        )}
        <span className="ios-glass-btn">
          <Gear />
        </span>
      </div>

      <div className="ios-today-body">
        <StatsCard calories={t.calories} protein={t.protein} expanded={expanded} />

        <div className="ios-meals">
          {meals.map((m, i) => (
            <div key={m.id}>
              <div className="ios-meal-head">
                <span>
                  {m.label} - {m.time}
                </span>
                <span>{i === 0 ? 'Cals' : ''}</span>
                <span>{i === 0 ? 'Protein' : ''}</span>
                <span />
              </div>
              <div className={`ios-meal-row ${m.id === newId ? 'is-new' : ''}`} key={`${m.id}-${m.emojis.length}`}>
                <span className="emojis">
                  {m.emojis.map((e, j) => (
                    <span key={j}>{e}</span>
                  ))}
                </span>
                <span className="cals">{fmt(m.calories)}</span>
                <span className="protein">{m.protein}g</span>
                <span className="ios-chevron">{m.emojis.length > 1 ? <ChevronDown size={14} weight={2} /> : <Pencil />}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="ios-fab"
        role={onAdd ? 'button' : undefined}
        aria-label={onAdd ? 'Add a meal' : undefined}
        tabIndex={onAdd ? 0 : undefined}
        onPointerDown={onAdd ? (ev) => ev.stopPropagation() : undefined}
        onClick={onAdd}
        onKeyDown={
          onAdd
            ? (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                  ev.preventDefault();
                  onAdd();
                }
              }
            : undefined
        }
      >
        <Plus />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Sample data
   ──────────────────────────────────────────────────────────── */

export const SAMPLE_DAY: MealGroup[] = [
  { id: 'b', label: 'Breakfast', time: '8 AM', emojis: ['🥣', '☕'], calories: 410, protein: 32 },
  { id: 'l', label: 'Lunch', time: '1 PM', emojis: ['🥪', '🍎'], calories: 620, protein: 41 },
  { id: 's', label: 'Snack', time: '4 PM', emojis: ['🍫'], calories: 210, protein: 20 },
  { id: 'd', label: 'Dinner', time: '7 PM', emojis: ['🍗', '🍟'], calories: 780, protein: 58 },
];
