# Portfolio carousel

Nine slides about Macro for a personal design page rather than an ad: what the app is for, then the design details behind it. Slides are 1080 × 1440 (3:4, Instagram's portrait size). Six are stills (PNG) and three are videos (MP4: H.264, 30 fps, no sound). `previews/` has a still of each video.

| # | File | Shows |
| - | ---- | ----- |
| 1 | `01-cover.png` | The icon, the name, and what it is in a line: a calorie and protein tracker that takes two swipes, or one sentence. A phone caught mid-swipe at 520 kcal. |
| 2 | `02-why.png` | The purpose. A typical tracker's 14 steps for one homemade spag bol (the site's comparison) beside Macro's two. No barcodes, no database, no weighing; roughly right every day beats perfectly right for a week. |
| 3 | `03-swipe-to-log.mp4` | Swipe to log (10 s). Swipe up to 520 kcal, tap, swipe up to 38 g, tap past the guessed emoji, and the sheet drops away to show lunch on the day. The count follows the finger through the app's own drag gearing. |
| 4 | `04-the-drag.png` | The gearing as a ruler: each 10 kcal tick sits where the finger has to reach it, so the fine zone (150 to 600 kcal, 1.1 kcal a point) is spread out and the quick one (past 1,000, 4 a point) bunches up. Snapping and haptics. |
| 5 | `05-colour.png` | The calorie colour ramp: three screens at 420, 1,150 and 1,800 kcal, pinned on the ramp from green to red. Protein is always blue. |
| 6 | `06-details.png` | The entry screen annotated, each leader line drawn to the element it describes: progress bars, the header, the fill, the caption, the number, and the back and cancel gestures. |
| 7 | `07-voice.mp4` | Voice (10.7 s). Hold the plus, say "A chicken burrito and a Diet Coke", let go. Cards beside the phone show what the app keeps to itself: the words transcribed on the device, then Apple Intelligence's estimate. The bar confirms and lunch lands on the day. |
| 8 | `08-days.mp4` | Swiping between days (8.6 s): Today to Yesterday to 24 Nov, each title fading only as it slides under the settings button, then a double-tap on the title back to today. |
| 9 | `09-close.png` | The icon over the green and blue glow from the site's closing section, Available on TestFlight, usemacro.app, and three phones: the day in front, the calories and protein screens behind. |

Everything on the slides is taken from the app's code: the gearing (`DragScale` zones), the colour stops (`CalorieColor`), the type and fill (`InputView`), the voice bar's timings (`VoiceHoldButton`: a 0.2 s hold before it listens, then 2.2 s showing the result) and the title fade (`DayPageTitle`).

## Caption

> Macro, a calorie and protein tracker I designed and built for iPhone.
>
> Most food trackers want a search, the right match from a database and a weight for every ingredient. Macro asks for two rough numbers: swipe up for calories, swipe up for protein, done. Or hold the plus and say what you ate. It's transcribed on the phone, Apple Intelligence estimates it, and it's logged when you let go.
>
> A few of the details:
> · The swipe is geared. Between 150 and 600 kcal, where most meals land, each point of travel is 1.1 kcal; past 1,000 it's 4.
> · The fill warms from green to red as a meal grows, so a big one looks big before you read the number.
> · 128 pt ultralight numerals with tabular figures, so the digits hold still as they count.
> · Day titles fade only as they slide under the settings button.
>
> Built in SwiftUI. Available on TestFlight at usemacro.app.
>
> #uidesign #appdesign #iosdesign #swiftui #productdesign

## Alt text

1. The Macro app icon, a glass fork and knife with green and blue handles, above the word Macro and the line "A calorie and protein tracker that takes two swipes, or one sentence." An iPhone shows a finger swiping up the calories screen to 520 kcal over a pale green fill.
2. "A typical tracker takes 14 steps to log a meal. Macro takes two." A typical tracker's fourteen steps for one homemade spag bol, from "Tap Create recipe" to "Log 1 serving", beside Macro's two: swipe to 500 kcal, swipe to 35 g protein. "No barcodes, no food database, no weighing. Roughly right every day beats perfectly right for a week."
3. "Swipe anywhere." An iPhone logging lunch: a finger swipes up and the calories count to 520 as a green fill rises, a tap moves on to protein and a swipe fills blue to 38 g, a tap passes the guessed salad emoji, and the screen drops away to show lunch added to the day.
4. "Fine where meals land." A ruler of 10 kcal ticks spaced by how far a finger travels to reach them: spread out below 600 kcal, bunched up above 1,000, in zones of 0.7, 1.1, 2.2 and 4 kcal a point. Calories snap to 10 kcal with a light haptic tick on each.
5. "Big meals look big." Three calorie screens at 420, 1,150 and 1,800 kcal, tinted green, yellow and red, above the colour ramp from 0 to 1,800 kcal. "Protein is always blue."
6. "Measured to the point." The calories screen at 520 kcal with six notes: one 3 pt bar for each step; meal and time weigh the same; the fill is the meal's colour at 14% under a 1 pt line; the caption is 13 pt semibold; the number is 128 pt ultralight with tabular figures; tap the left third to go back, or swipe in from the edge to cancel.
7. "Or just say what you ate." A finger holds the plus on Today and it opens into a blue bar with a moving waveform. Beside the phone, the words "A chicken burrito and a Diet Coke" appear as they're transcribed on the device, then Apple Intelligence's estimate: chicken burrito, 690 kcal, 41 g protein. The bar confirms it and lunch is added to the day.
8. "Swipe back through the week." A finger swipes the day list from Today to Yesterday to 24 Nov, each title fading as it slides under the settings button, then double-taps the title to jump back to Today.
9. The Macro icon over a green and blue glow, "Macro", "Available on TestFlight" and usemacro.app, above three iPhones: the day's meals in front, the calories and protein screens behind.

## Re-rendering

The slides are React, drawn by `source/`: the phones are the website's own screen components and styles, imported from `src/`, so if the site's screens change, re-rendering brings the slides up to date. Every frame is a function of time, so the videos come out the same on every run.

```bash
npm install
node instagram/portfolio/source/render.mjs                 # all nine, about a minute
node instagram/portfolio/source/render.mjs voice days      # just these
node instagram/portfolio/source/render.mjs --posters       # stills only, quick
```

To watch a slide while editing, serve it and open `http://localhost:5199/?slide=voice&play` (or `&t=4.2` for one moment):

```bash
npx vite --config instagram/portfolio/source/vite.config.ts
```

| File | Holds |
| ---- | ----- |
| `source/slides/*.tsx` | One file per slide, its copy and its timeline. |
| `source/kit.tsx` | Shared pieces: the header, the finger, the voice bar and its waveform (a port of the site's, stepped frame by frame). |
| `source/slides.css` | The slides' type and layout, on top of the site's `global.css`. |
| `source/render.mjs` | Captures stills with Playwright and pipes video frames into ffmpeg. |
| `source/public/emoji` | Apple's emoji artwork (emoji-data v15.1.2, 64 px), so the phones look like an iPhone. |

Rendering needs ffmpeg and Playwright's Chromium (`npx playwright install chromium` if Playwright isn't set up). The type is Inter and Inter Tight, from the site's packages, with JetBrains Mono for the labels, which has to be installed on the machine that renders.
