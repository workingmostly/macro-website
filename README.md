# macro-website

Marketing site for **Macro**, the radically simple calorie and protein tracker for iPhone.

Built with [Astro](https://astro.build) and Tailwind CSS v4. The site is static HTML. The JavaScript is a handful of React islands (the interactive phone in the hero, the How it works cards, the side-by-side comparison, and the voice demo and working controls in Features) and a few small scripts for the nav, the FAQ and scroll reveals. Fonts (Inter and Inter Tight) are self-hosted, so nothing calls a third party.

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
- `withEmptySlots()`: the empty Breakfast, Lunch and Dinner "Add" slots from `MealTimeline.swift`

Voice logging, on iPhones with Apple Intelligence, works as the app's `VoiceHoldButton` does: hold the plus on Today and it opens into a blue bar along the bottom that listens while held, then logs the meal and says what it added; or tap the mic on the entry screen (where the plus sits) and the same bar opens, a tap on it finishes, and the number glides to the estimate. The site can't listen, so `screens/Voice.tsx` plays back made-up sentences (`BURRITO`, `ICE_CREAM`) through a port of the app's `VoiceWaveform` and `WaveformFeed`, driven by a script of syllables instead of a microphone. `glide()` is the app's `autoSlide`, through the same drag gearing (`screens/scales.ts`).

`HeroDemo.tsx` runs the real input flow (calories → protein → emoji → Today). It plays itself while nobody's touching it: the two drags first, then the plus held to log a pudding by voice. It hands over control on the first drag, tap or key press. On a touch screen a finger has to rest for a moment (`HOLD_MS`) before it grabs the slider, so a swipe over the phone still scrolls the page. The mic and the plus both work, slide-up-to-cancel included, with what's being "said" shown word by word under the phone.

`VoiceDemo.tsx` plays the entry screen's mic on a loop in the Features section, with what was said in a bubble beside the phone (the app itself never shows a transcript).

`FeatureDemos.tsx` holds the working controls in the Features section: the carbs and fat split slider and the stats card that opens and shuts, the emoji chips, the goal calculator's Lose / Maintain / Gain, and the tracking switches (turning Calories off takes Macros with it, as in the app). `screens/Summary.tsx` is the Summary tab, with its Calories / Protein switch and the ghost bars for the days left. They're drawn as iOS 26 draws its controls, over real checkboxes, radios and range inputs, so keyboards and screen readers get the native behaviour.

`HowItWorksDemo.tsx` plays the three How it works cards in turn while they're on screen: a drag for calories, a drag for protein, then the meal landing in Today with carbs and fat estimated. Like the comparison, it shows each card finished with reduced motion or no JavaScript.

`CompareDemo.tsx` plays the same meal in a typical tracker and in Macro, one step per beat on both phones. The typical tracker's screens live in `screens/Typical.tsx`: deliberately generic and greyscale, standing for food-database trackers in general rather than any one app. The steps and captions are the `TYPICAL_STEPS` and `MACRO_STEPS` arrays. It pauses off screen, has a pause button, and with reduced motion (or no JavaScript) it shows both phones finished.

## Instagram carousel

`instagram/` holds the launch carousel as five editable SVGs (1080 × 1350), MP4 versions of the two step-count slides, and PNG previews in `instagram/previews/`. Drag the SVGs into Figma to edit; the caption and alt text are in `instagram/README.md`. The folder sits outside `public/`, so it never ships with the site.

## Deploying

`npm run build` produces a plain static site in `dist/`, so it can go on Vercel, Netlify, Cloudflare Pages or GitHub Pages with no adapter. Once there's a domain, set `site` in `astro.config.mjs` so Open Graph tags get absolute URLs.
