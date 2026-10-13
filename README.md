# macro-website

Marketing site for **Macro**, the radically simple calorie and protein tracker for iPhone.

Built with [Astro](https://astro.build) and Tailwind CSS v4. The site is static HTML. The only JavaScript is two React islands (the interactive phone in the hero and the side-by-side comparison) and a small scroll-reveal script. Fonts (Inter and Inter Tight) are self-hosted, so nothing calls a third party.

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

`HeroDemo.tsx` runs the real input flow (calories → protein → emoji → Today). It plays itself while nobody's touching it, and hands over control on the first drag, tap or key press. On a touch screen a finger has to rest for a moment (`HOLD_MS`) before it grabs the slider, so a swipe over the phone still scrolls the page.

`CompareDemo.tsx` plays the same meal in a typical tracker and in Macro, one step per beat on both phones. The typical tracker's screens live in `screens/Typical.tsx`: deliberately generic and greyscale, standing for food-database trackers in general rather than any one app. The steps and captions are the `TYPICAL_STEPS` and `MACRO_STEPS` arrays. It pauses off screen, has a pause button, and with reduced motion (or no JavaScript) it shows both phones finished.

## Instagram carousel

`instagram/` holds the launch carousel as eight editable SVGs (1080 × 1350). Drag them into Figma to edit; the caption and alt text are in `instagram/README.md`. The folder sits outside `public/`, so it never ships with the site.

## Deploying

`npm run build` produces a plain static site in `dist/`, so it can go on Vercel, Netlify, Cloudflare Pages or GitHub Pages with no adapter. Once there's a domain, set `site` in `astro.config.mjs` so Open Graph tags get absolute URLs.
