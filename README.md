# macro-website

Marketing site for **Macro**, the radically simple calorie and protein tracker for iPhone.

Built with [Astro](https://astro.build) and Tailwind CSS v4. The site is static HTML. The only JavaScript is the interactive phone in the hero (a React island) and a small scroll-reveal script. Fonts (Inter and Inter Tight) are self-hosted, so nothing calls a third party.

## Running it

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # outputs static files to dist/
npm run preview   # serves dist/
```

## Things to change

- **TestFlight / App Store link, contact email:** `src/config.ts`. Every "Join the beta" button reads from here.
- **Copy:** each section is its own file in `src/components/sections/`, in page order in `src/pages/index.astro`.

## How the phone mockups work

The iPhone screens in `src/components/screens/` are HTML recreations of the app, laid out at real iOS point sizes (393 × 852) and scaled down as a whole with the `--s` CSS variable. Measurements can be lifted straight from the SwiftUI code. They mirror the app's own logic where it matters:

- `calorieAccent()`: the green → yellow → orange → red ramp from `CalorieColor.swift`
- `DragScale`: the non-linear drag gearing from `DragScale.swift`
- `macroSplit()`: the 60/40 carbs/fat estimate from `MacroMath.swift`

`HeroDemo.tsx` runs the real input flow (calories → protein → emoji → Today). It plays itself while nobody's touching it, and hands over control on the first drag, tap or key press.

## Instagram carousel

`insta/` holds a 5-slide 4:5 carousel (1080 × 1350) built from the same components and styles as the site, as both `macro-<n>.png` (ready to post) and `macro-<n>.svg` (drag into Figma for editable layers: real text in Inter / Inter Tight, shapes with corner radii, gradients and drop shadows).

To edit a slide in code, change `insta/Slide.astro` and preview it at `localhost:4321/insta/1` to `/insta/5` while `npm run dev` is running; those pages are dev-only and never deployed. Then, with the dev server still running:

```bash
npm run insta
```

That re-renders the PNGs and SVGs using your installed Chrome or Edge. The SVG conversion lives in `insta/svg-export.js`.

## Deploying

`npm run build` produces a plain static site in `dist/`, so it can go on Vercel, Netlify, Cloudflare Pages or GitHub Pages with no adapter. Once there's a domain, set `site` in `astro.config.mjs` so Open Graph tags get absolute URLs.
