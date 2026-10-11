import type { ReactNode } from 'react';
import { fmt } from './ios';

/* ────────────────────────────────────────────────────────────
   A stand-in for a typical food-database tracker, for the
   comparison section. Deliberately generic: greyscale, no
   brand, just the screens most of them share. Laid out at iOS
   point sizes like the Macro screens, and drawn from a step
   plus how far through it we are (p, 0–1).
   ──────────────────────────────────────────────────────────── */

type FoodKey = 'beef' | 'onion' | 'tomatoes' | 'spaghetti';

interface Food {
  name: string;
  query: string;
  /** Per 100 g */
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Search results as [name, kcal per 100 g]. The one that gets picked sits at PICK_INDEX. */
  results: [string, number][];
}

const PICK_INDEX = 4;

const FOODS: Record<FoodKey, Food> = {
  beef: {
    name: 'Beef mince, 5% fat',
    query: 'beef mince',
    kcal: 137,
    protein: 21.7,
    carbs: 0,
    fat: 5,
    results: [
      ['Beef mince, 20% fat', 254],
      ['Beef mince, 12% fat', 198],
      ['Lean beef mince', 153],
      ['Beef mince, cooked', 262],
      ['Beef mince, 5% fat', 137],
      ['Steak mince', 176],
      ['Beef mince, extra lean', 124],
      ['Minced beef, frozen', 226],
      ['Beef mince, 15% fat', 221],
      ['Organic beef mince', 205],
    ],
  },
  onion: {
    name: 'Onion, raw',
    query: 'onion',
    kcal: 40,
    protein: 1.1,
    carbs: 7.9,
    fat: 0.2,
    results: [
      ['Onion, raw', 40],
      ['Onion, fried', 164],
      ['Red onion', 42],
      ['Spring onion', 25],
      ['Onion, boiled', 17],
      ['Onion rings', 289],
      ['Pickled onions', 24],
      ['Onion bhaji', 230],
      ['Shallots', 20],
      ['Onion, dried', 341],
    ],
  },
  tomatoes: {
    name: 'Chopped tomatoes, tinned',
    query: 'chopped tomatoes',
    kcal: 21,
    protein: 1.1,
    carbs: 3.8,
    fat: 0.1,
    results: [
      ['Chopped tomatoes with herbs', 24],
      ['Chopped tomatoes with garlic', 26],
      ['Finely chopped tomatoes', 22],
      ['Italian chopped tomatoes', 23],
      ['Chopped tomatoes, tinned', 21],
      ['Chopped tomatoes in juice', 20],
      ['Chopped tomatoes, organic', 21],
      ['Chopped tomatoes, carton', 22],
      ['Chopped tomatoes with chilli', 25],
      ['Chopped tomatoes, value', 19],
    ],
  },
  spaghetti: {
    name: 'Spaghetti, dry',
    query: 'spaghetti',
    kcal: 357,
    protein: 12,
    carbs: 72,
    fat: 1.5,
    results: [
      ['Spaghetti, cooked', 158],
      ['Wholewheat spaghetti', 348],
      ['Spaghetti hoops', 58],
      ['Fresh spaghetti', 286],
      ['Spaghetti, dry', 357],
      ['Spaghetti bolognese', 135],
      ['Gluten-free spaghetti', 359],
      ['Spaghetti, tinned', 64],
      ['Spaghettini, dry', 356],
      ['Spaghetti, egg', 362],
    ],
  },
};

const ONION_SIZES: [string, number][] = [
  ['Small', 70],
  ['Medium', 110],
  ['Large', 150],
  ['Extra large', 225],
];
const ONION_PICK = 1;

const RECIPE: { food: FoodKey; grams: number; amount: string }[] = [
  { food: 'beef', grams: 500, amount: '500 g' },
  { food: 'onion', grams: 110, amount: '1 medium' },
  { food: 'tomatoes', grams: 400, amount: '400 g' },
  { food: 'spaghetti', grams: 300, amount: '300 g' },
];

const per = (food: FoodKey, grams: number, key: 'kcal' | 'protein' | 'carbs' | 'fat') => (FOODS[food][key] * grams) / 100;
const RECIPE_KCAL = RECIPE.reduce((t, r) => t + Math.round(per(r.food, r.grams, 'kcal')), 0);
const RECIPE_PROTEIN = RECIPE.reduce((t, r) => t + per(r.food, r.grams, 'protein'), 0);
const SERVINGS = 4;

/** Calories already logged today, so the diary at the end adds up (matches Macro's sample breakfast and lunch). */
const EARLIER_TODAY = 410 + 620;
const GOAL = 2200;

export type TypicalStep = { caption: string } & (
  | { kind: 'start' | 'servings' | 'log' }
  | { kind: 'search' | 'pick' | 'size'; food: FoodKey }
  | { kind: 'amount'; food: FoodKey; grams: number }
);

/** One homemade spag bol for four. Each step is one screen's worth of tapping, the way Macro's are. */
export const TYPICAL_STEPS: TypicalStep[] = [
  { kind: 'start', caption: 'Tap “Create recipe”' },
  { kind: 'search', food: 'beef', caption: 'Search “beef mince”' },
  { kind: 'pick', food: 'beef', caption: 'Pick the right match' },
  { kind: 'amount', food: 'beef', grams: 500, caption: 'Enter 500 g' },
  { kind: 'search', food: 'onion', caption: 'Search “onion”' },
  { kind: 'size', food: 'onion', caption: 'Choose a size' },
  { kind: 'search', food: 'tomatoes', caption: 'Search “chopped tomatoes”' },
  { kind: 'pick', food: 'tomatoes', caption: 'Pick the closest match' },
  { kind: 'amount', food: 'tomatoes', grams: 400, caption: 'Enter 400 g' },
  { kind: 'search', food: 'spaghetti', caption: 'Search “spaghetti”' },
  { kind: 'pick', food: 'spaghetti', caption: 'Dry or cooked? Pick one' },
  { kind: 'amount', food: 'spaghetti', grams: 300, caption: 'Enter 300 g' },
  { kind: 'servings', caption: `Set servings to ${SERVINGS}` },
  { kind: 'log', caption: 'Log 1 serving' },
];

export type TypicalFrame = TypicalStep | 'done';

/** Steps that share a key stay on the same screen; a new key pushes a new screen on. */
export function screenKey(step: TypicalFrame): string {
  if (step === 'done') return 'diary';
  switch (step.kind) {
    case 'start':
      return 'start';
    case 'search':
    case 'pick':
      return `search-${step.food}`;
    case 'amount':
    case 'size':
      return `food-${step.food}`;
    default:
      return 'recipe';
  }
}

/* ── Helpers ──────────────────────────────────────────────── */

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const within = (p: number, a: number, b: number) => p >= a && p < b;
const on = (v: boolean) => (v ? true : undefined);

/** Types `text` between p = start and p = end. Returns what's typed so far and the key being pressed. */
function typeOut(text: string, p: number, start: number, end: number) {
  const gap = (end - start) / text.length;
  const n = p < start ? 0 : Math.min(text.length, Math.floor((p - start) / gap) + 1);
  const pressed = n > 0 && p - (start + (n - 1) * gap) < Math.min(gap * 0.7, 0.05) ? text[n - 1] : null;
  return { typed: text.slice(0, n), pressed };
}

function Touch({ x, y, show, pressed }: { x: number; y: number; show: boolean; pressed: boolean }) {
  return <div className="ghost-touch" data-pressed={pressed} style={{ left: x, top: y, opacity: show ? 1 : 0 }} />;
}

/* ── Glyphs ───────────────────────────────────────────────── */

function Back() {
  return (
    <svg width="13" height="21" viewBox="0 0 13 21" fill="none" aria-hidden="true">
      <path d="M10.5 2L2.5 10.5l8 8.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Magnifier() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="6.8" cy="6.8" r="5.3" stroke="currentColor" strokeWidth="1.9" />
      <path d="M10.8 10.8l3.7 3.7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function AddCircle() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="12.5" stroke="#c7c7cc" strokeWidth="1.5" />
      <path d="M14 9v10M9 14h10" stroke="#8a8a8e" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function Disclosure() {
  return (
    <svg width="8" height="13" viewBox="0 0 8 13" fill="none" aria-hidden="true">
      <path d="M1.5 1.5l5 5-5 5" stroke="#c4c4c6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Check() {
  return (
    <svg width="16" height="13" viewBox="0 0 16 13" fill="none" aria-hidden="true">
      <path d="M1.5 7l4.5 4.5L14.5 1.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Shift() {
  return (
    <svg width="20" height="18" viewBox="0 0 20 18" fill="none" aria-hidden="true">
      <path d="M10 1.5L1.5 10H6v6.5h8V10h4.5L10 1.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function Delete() {
  return (
    <svg width="24" height="18" viewBox="0 0 24 18" fill="none" aria-hidden="true">
      <path d="M7.5 1.5h14v15h-14L1.5 9l6-7.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M11.5 5.5l6 7M17.5 5.5l-6 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* ── Chrome ───────────────────────────────────────────────── */

function Nav({ left, title, right, rightPressed }: { left?: ReactNode; title: string; right?: string; rightPressed?: boolean }) {
  return (
    <div className="tt-nav">
      <span className="tt-nav-left">{left ?? <Back />}</span>
      <span className="tt-nav-title">{title}</span>
      <span className="tt-nav-right" data-on={on(!!rightPressed)}>
        {right}
      </span>
    </div>
  );
}

const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

function Keyboard({ hidden, pressed }: { hidden: boolean; pressed: string | null }) {
  return (
    <div className="tt-kb" data-hidden={on(hidden)}>
      {KEY_ROWS.map((row, r) => (
        <div key={row} className="tt-kb-row" style={{ top: 8 + r * 54 }}>
          {r === 2 && (
            <span className="tt-key tt-key-mod" style={{ width: 42, marginRight: 8 }}>
              <Shift />
            </span>
          )}
          {[...row].map((k) => (
            <span key={k} className="tt-key" data-on={on(k === pressed)}>
              {k}
            </span>
          ))}
          {r === 2 && (
            <span className="tt-key tt-key-mod" style={{ width: 42, marginLeft: 8 }}>
              <Delete />
            </span>
          )}
        </div>
      ))}
      <div className="tt-kb-row" style={{ top: 170 }}>
        <span className="tt-key tt-key-mod tt-key-word" style={{ width: 88 }}>
          123
        </span>
        <span className="tt-key tt-key-word" data-on={on(pressed === ' ')} style={{ flex: 1 }}>
          space
        </span>
        <span className="tt-key tt-key-mod tt-key-word" data-on={on(pressed === 'search')} style={{ width: 88 }}>
          search
        </span>
      </div>
    </div>
  );
}

const PAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

function Keypad({ pressed }: { pressed: string | null }) {
  return (
    <div className="tt-kb tt-pad">
      {PAD_KEYS.map((k) => (
        <span key={k} className={k === '.' || k === 'del' ? 'tt-pad-key tt-pad-bare' : 'tt-pad-key'} data-on={on(k === pressed)}>
          {k === 'del' ? <Delete /> : k}
        </span>
      ))}
    </div>
  );
}

/* ── Screens ──────────────────────────────────────────────── */

function StartScreen({ p }: { p: number }) {
  const pressed = within(p, 0.55, 0.64);
  return (
    <div className="tt-screen">
      <Nav left="Cancel" title="Add to Dinner" />
      <div className="tt-search">
        <Magnifier />
        <span>Search foods</span>
      </div>
      <div className="tt-seg" style={{ top: 152 }}>
        {['All', 'Recipes', 'My foods'].map((label) => (
          <span key={label} data-on={on(label === 'Recipes')}>
            {label}
          </span>
        ))}
      </div>
      <div className="tt-empty" style={{ top: 214 }}>
        <b>No recipes yet</b>
        <span>Add each ingredient to build one.</span>
      </div>
      <div className="tt-btn" style={{ top: 290 }} data-on={on(pressed)}>
        Create recipe
      </div>
      <Touch x={196} y={315} show={within(p, 0.45, 0.72)} pressed={pressed} />
    </div>
  );
}

function SearchScreen({ food, p, typing }: { food: FoodKey; p: number; typing: boolean }) {
  const f = FOODS[food];
  const { typed, pressed } = typing ? typeOut(f.query, p, 0.06, 0.62) : { typed: f.query, pressed: null };
  const key = pressed ?? (typing && within(p, 0.72, 0.8) ? 'search' : null);

  // Picking: scroll past the lookalikes, then tap the right one.
  const scroll = typing ? 0 : 140 * ease(clamp((p - 0.1) / 0.32));
  const dragging = !typing && within(p, 0.08, 0.44);
  const tapping = !typing && within(p, 0.6, 0.68);
  const picked = !typing && p >= 0.6;

  return (
    <div className="tt-screen">
      <Nav title="Add ingredient" />
      <div className="tt-search">
        <Magnifier />
        {typed ? <b>{typed}</b> : <span>Search foods</span>}
        {typing && <i className="tt-caret" />}
      </div>
      <div className="tt-list">
        {typed.length >= 2 && (
          <div className="tt-results" style={{ transform: `translateY(${-scroll}px)` }}>
            {f.results.map(([name, kcal], i) => (
              <div key={name} className="tt-row" data-on={on(picked && i === PICK_INDEX)}>
                <div>
                  <div className="tt-row-name">{name}</div>
                  <div className="tt-row-sub">{kcal} kcal · 100 g</div>
                </div>
                <AddCircle />
              </div>
            ))}
          </div>
        )}
      </div>
      <Keyboard hidden={!typing} pressed={key} />
      {!typing && (
        <Touch
          x={dragging ? 300 : 200}
          y={dragging ? 500 - 140 * ease(clamp((p - 0.1) / 0.32)) : 152 + PICK_INDEX * 64 + 32 - 140}
          show={within(p, 0.06, 0.46) || within(p, 0.54, 0.76)}
          pressed={dragging || tapping}
        />
      )}
    </div>
  );
}

function FoodScreen({ food, p, grams }: { food: FoodKey; p: number; grams?: number }) {
  const f = FOODS[food];
  let amount = 0;
  let field: ReactNode = null;
  let keypad: ReactNode = null;
  let sizes: ReactNode = null;
  let touch: ReactNode = null;

  if (grams !== undefined) {
    const { typed, pressed } = typeOut(String(grams), p, 0.08, 0.5);
    amount = Number(typed || 0);
    field = (
      <span className="tt-field">
        {typed ? <b>{typed}</b> : <span className="tt-placeholder">0</span>}
        <i className="tt-caret" />
      </span>
    );
    keypad = <Keypad pressed={pressed} />;
  } else {
    const chosen = p >= 0.4;
    amount = chosen ? ONION_SIZES[ONION_PICK][1] : 0;
    sizes = (
      <>
        <div className="tt-label" style={{ top: 268 }}>
          Size
        </div>
        <div className="tt-group" style={{ top: 290 }}>
          {ONION_SIZES.map(([label, g], i) => (
            <div key={label} className="tt-cell" data-on={on(within(p, 0.34, 0.42) && i === ONION_PICK)}>
              <span>
                {label} <span className="tt-grey">· {g} g</span>
              </span>
              {chosen && i === ONION_PICK && (
                <span className="tt-check">
                  <Check />
                </span>
              )}
            </div>
          ))}
        </div>
      </>
    );
    touch = <Touch x={200} y={290 + 48 * ONION_PICK + 24} show={within(p, 0.28, 0.5)} pressed={within(p, 0.34, 0.42)} />;
  }

  const adding = within(p, 0.8, 0.87);
  const nutrients: [string, number, string][] = [
    ['kcal', Math.round(per(food, amount, 'kcal')), ''],
    ['Carbs', Math.round(per(food, amount, 'carbs')), ' g'],
    ['Fat', Math.round(per(food, amount, 'fat')), ' g'],
    ['Protein', Math.round(per(food, amount, 'protein')), ' g'],
  ];

  return (
    <div className="tt-screen" data-grouped>
      <Nav title="Add ingredient" right="Add" rightPressed={adding} />
      <div className="tt-food-head">
        <b>{f.name}</b>
        <span>{f.kcal} kcal · 100 g</span>
      </div>
      <div className="tt-group" style={{ top: 168 }}>
        <div className="tt-nutrition">
          {nutrients.map(([label, value, unit]) => (
            <div key={label}>
              <b>
                {fmt(value)}
                {unit}
              </b>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
      {grams !== undefined ? (
        <div className="tt-group" style={{ top: 264 }}>
          <div className="tt-cell">
            <span>Serving size</span>
            <span className="tt-grey">
              1 g <Disclosure />
            </span>
          </div>
          <div className="tt-cell">
            <span>Amount</span>
            {field}
          </div>
        </div>
      ) : (
        sizes
      )}
      {keypad}
      {touch}
      <Touch x={354} y={76} show={within(p, 0.74, 0.92)} pressed={adding} />
    </div>
  );
}

function RecipeScreen({ p, logging }: { p: number; logging: boolean }) {
  const presses = [0.16, 0.38, 0.6];
  const servings = logging ? SERVINGS : 1 + presses.filter((t) => p >= t + 0.03).length;
  const plus = !logging && presses.some((t) => within(p, t, t + 0.07));
  const log = logging && within(p, 0.4, 0.5);

  return (
    <div className="tt-screen" data-grouped>
      <Nav title="New recipe" right="Save" />
      <div className="tt-group" style={{ top: 106 }}>
        <div className="tt-cell">
          <span>
            <span className="tt-grey">Name</span>
            <span style={{ marginLeft: 16 }}>Spag bol</span>
          </span>
        </div>
      </div>
      <div className="tt-label" style={{ top: 174 }}>
        Ingredients
      </div>
      <div className="tt-group" style={{ top: 196 }}>
        {RECIPE.map((r) => (
          <div key={r.food} className="tt-cell" style={{ height: 56 }}>
            <div>
              <div className="tt-row-name">{FOODS[r.food].name}</div>
              <div className="tt-row-sub">{r.amount}</div>
            </div>
            <span className="tt-grey">{fmt(per(r.food, r.grams, 'kcal'))}</span>
          </div>
        ))}
      </div>
      <div className="tt-label" style={{ top: 440 }}>
        Servings
      </div>
      <div className="tt-group" style={{ top: 462 }}>
        <div className="tt-cell" style={{ height: 52 }}>
          <span>
            Makes <b className="tt-num">{servings}</b>
          </span>
          <span className="tt-stepper">
            <span>−</span>
            <span data-on={on(plus)}>+</span>
          </span>
        </div>
      </div>
      <div className="tt-footnote" style={{ top: 524 }}>
        Per serving: {fmt(RECIPE_KCAL / servings)} kcal · {Math.round(RECIPE_PROTEIN / servings)} g protein
      </div>
      <div className="tt-btn" style={{ top: 562 }} data-on={on(log)}>
        Log 1 serving
      </div>
      {logging ? (
        <Touch x={196} y={587} show={within(p, 0.3, 0.62)} pressed={log} />
      ) : (
        <Touch x={338} y={488} show={within(p, 0.1, 0.8)} pressed={plus} />
      )}
    </div>
  );
}

function DiaryScreen() {
  const serving = Math.round(RECIPE_KCAL / SERVINGS);
  const food = EARLIER_TODAY + serving;
  return (
    <div className="tt-screen" data-grouped>
      <div className="tt-large-title">Diary</div>
      <div className="tt-group" style={{ top: 150 }}>
        <div className="tt-remaining">
          <b>Calories remaining</b>
          <div>
            <span>
              <b>{fmt(GOAL)}</b>Goal
            </span>
            <i>−</i>
            <span>
              <b>{fmt(food)}</b>Food
            </span>
            <i>=</i>
            <span>
              <b>{fmt(GOAL - food)}</b>Remaining
            </span>
          </div>
        </div>
      </div>
      <div className="tt-section-head" style={{ top: 276 }}>
        <span>Dinner</span>
        <span>{fmt(serving)}</span>
      </div>
      <div className="tt-group" style={{ top: 306 }}>
        <div className="tt-cell tt-new" style={{ height: 60 }}>
          <div>
            <div className="tt-row-name">Spag bol</div>
            <div className="tt-row-sub">1 serving</div>
          </div>
          <span className="tt-grey">{fmt(serving)}</span>
        </div>
        <div className="tt-cell tt-tint">Add food</div>
      </div>
    </div>
  );
}

export function TypicalScreen({ step, p }: { step: TypicalFrame; p: number }) {
  if (step === 'done') return <DiaryScreen />;
  switch (step.kind) {
    case 'start':
      return <StartScreen p={p} />;
    case 'search':
    case 'pick':
      return <SearchScreen food={step.food} p={p} typing={step.kind === 'search'} />;
    case 'amount':
      return <FoodScreen food={step.food} p={p} grams={step.grams} />;
    case 'size':
      return <FoodScreen food={step.food} p={p} />;
    case 'servings':
    case 'log':
      return <RecipeScreen p={p} logging={step.kind === 'log'} />;
  }
}
