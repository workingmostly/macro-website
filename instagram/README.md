# Instagram carousel

Five 4:5 slides (1080 × 1350), in posting order. They're plain SVGs styled like the site, so they open in Figma as editable layers. Slides 3 and 4 also come as MP4s, ready to post as video slides.

| # | File | Says |
| - | ---- | ---- |
| 1 | `01-cover.svg` | Food tracking, without the fixation. Just two drags and you're done. Two phones mid-drag (500 kcal, then 35 g of protein) in green and blue glows, with Apple's food emoji around them at different depths: small blurred ones far back, sharp ones by the phones, two big soft ones close to the camera. |
| 2 | `02-roughly-right.svg` | Why it works. Roughly right every day beats perfectly right for a week. Two lines of handwriting: a loose green one that keeps going, and a neat grey one that stops at a full stop. Close enough, kept up. On a calm blue. |
| 3 | `03-fourteen-steps.svg` / `.mp4` | A typical tracker: 14 steps. One homemade spag bol for four. Laid out like the site's comparison cards: a progress bar with a segment per step, the current step's caption, and the phone. The still shows step 3 of 14; the video steps through all fourteen, one caption at a time (21 s). |
| 4 | `04-two-steps.svg` / `.mp4` | Macro: 2 steps. The same spag bol: drag to 500 kcal, drag to 35 g of protein, then we do the rest, with carbs and fat estimated on Today. The still shows it done; the video plays both drags, the glow turning from green to blue, and lands on Today (6 s). |
| 5 | `05-join-the-beta.svg` | Track your food without the faff. Free forever, no ads, no trackers, no account. Join the beta, link in bio, over the site's closing phones. The only slide with the app icon. |

`previews/` has a PNG of each slide as committed, for a quick look without opening Figma. They won't follow your Figma edits, so export fresh ones from there when you post.

## Editing in Figma

- Drag the files onto the canvas, or use File → Import. Each comes in as a 1080 × 1350 group with named layers (`headline`, `calories-phone`, `pizza`, `every-day`, `for-a-week` and so on). Everything sits inside `slide-content`, which is clipped to the slide.
- Fonts are **Inter** and **Inter Tight**. Both are Google Fonts, so Figma already has them.
- The food on the cover is Apple's emoji artwork (160 px, from the open-source emoji-data project, v15.1.2), embedded as images in three groups: `far`, `mid` and `near`. The blur on the far and near ones is baked into their images, so they look the same in Figma and in any export. Move, rotate or resize them like any image; to swap one, replace its image fill.
- Each line of text sits at its own position, so if you rewrite a headline you may need to move the line breaks by hand.
- The phones are groups, with the screen clipped by a mask, so you can move or scale one as a single piece.
- The two handwriting lines on slide 2 are single paths, so they stay editable as vectors.
- The app icon on slide 5 is embedded as an image, like the cover's emoji.
- Export each slide as PNG at 1x (1080 × 1350).

The MP4s are H.264, 1080 × 1350 at 30 fps with no sound. They don't change when you edit the SVGs in Figma, so if you change slide 3 or 4 there, the video needs remaking to match.

Colours are the site's: ink `#0a0a0a`, muted `#6e6e73`, faint `#a1a1a6`, surface `#f2f2f7`, night `#0b0b0c`, green `#34c759`, blue `#007aff`, dark blue `#0062cc`, orange `#ff9500`, and the tints `#dbecff` (slide 2, and the protein screens) and `#e3f7e8` (the calories screens).

## Caption

> Food tracking, without the fixation.
>
> Macro is a calorie and protein tracker for iPhone with nothing to scan, search, weigh or photograph. Drag to roughly how many calories, drag to roughly how much protein, and Macro does the rest, working out carbs and fat for you.
>
> Roughly right every day beats perfectly right for a week. A bit over still counts, and a big Saturday evens out across the week, so the numbers needn't take over.
>
> Free forever. No ads, no trackers, no account. Your meals stay on your phone, and in your own iCloud if you sync.
>
> Join the beta: link in bio.
>
> If counting calories has been hard for you before, it's worth talking to your GP before you start.

## Alt text

1. "Food tracking, without the fixation. Just two drags and you're done." Two iPhones mid-drag: dinner dragged to 500 calories on one, 35 grams of protein on the other. Food emoji float around them, some sharp and some out of focus: pizza, a croissant, a strawberry, a carrot, avocado, spaghetti, a cookie, a doughnut, salad, a banana, sushi, a burger and a taco.
2. "Roughly right every day beats perfectly right for a week." Two hand-drawn lines of loops, like joined-up handwriting. A loose green line, every loop a little different, keeps going past the edge; a neat grey line of seven identical loops stops with a full stop. "Close enough, kept up."
3. "14 steps." A typical tracker logging one homemade spag bol for four. A progress bar of fourteen segments, on step 3: "Pick the right match". The phone shows a long list of near-identical beef mince results.
4. "2 steps." The same spag bol in Macro: drag to 500 calories, drag to 35 grams of protein, done. "We do the rest." The phone shows the day with carbs and fat estimated.
5. The Macro app icon. "Track your food without the faff." Free forever, no ads, no trackers, no account. A "Join the beta" button, link in bio. Below, three iPhones: calories in front, protein and the day's meals tucked behind.
