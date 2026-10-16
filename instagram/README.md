# Instagram carousel

Six 4:5 slides (1080 × 1350), in posting order. They're plain SVGs styled like the site, so they open in Figma as editable layers. Slides 4 and 5 also come as MP4s, ready to post as video slides.

| # | File | Says |
| - | ---- | ---- |
| 1 | `01-cover.svg` | The fastest way to count calories. Two drags and you're done. Two phones mid-drag: 500 kcal, then 35 g of protein. |
| 2 | `02-keep-count.svg` | Keep count without it taking over. The headline is the picture: set big, with the word "count" kept small in a green pill. With room for real life. |
| 3 | `03-roughly-right.svg` | Roughly right every day beats perfectly right for a week. Two lines of handwriting: a loose one that keeps going, and a neat one that stops at a full stop. Close enough, kept up. |
| 4 | `04-fourteen-steps.svg` / `.mp4` | A typical tracker: 14 steps. A homemade spag bol for four, logged ingredient by ingredient. The video plays the site's typical tracker through every step (21 s). |
| 5 | `05-two-steps.svg` / `.mp4` | Macro: 2 steps. The same spag bol, dragged to 500 kcal and 35 g of protein, then we do the rest: carbs and fat, estimated. The video plays both drags and lands on Today with carbs and fat filled in (6 s). |
| 6 | `06-join-the-beta.svg` | Track your food without the faff. Free forever, no ads, no trackers, no account. Join the beta, link in bio, over the site's closing phones. The only slide with the app icon. |

`previews/` has a PNG of each slide as committed, for a quick look without opening Figma. They won't follow your Figma edits, so export fresh ones from there when you post.

## Editing in Figma

- Drag the files onto the canvas, or use File → Import. Each comes in as a 1080 × 1350 group with named layers (`headline`, `calories-phone`, `every-day`, `for-a-week` and so on). Everything sits inside `slide-content`, which is clipped to the slide.
- Fonts are **Inter** and **Inter Tight**. Both are Google Fonts, so Figma already has them.
- Each line of text sits at its own position, so if you rewrite a headline you may need to move the line breaks by hand.
- The phones are groups, with the screen clipped by a mask, so you can move or scale one as a single piece.
- The two handwriting lines on slide 3 are single paths, so they stay editable as vectors.
- The app icon on slide 6 is embedded as an image.
- Export each slide as PNG at 1x (1080 × 1350).

The MP4s are H.264, 1080 × 1350 at 30 fps with no sound. They don't change when you edit the SVGs in Figma, so if you change slide 4 or 5 there, the video needs remaking to match.

Colours are the site's: ink `#0a0a0a`, muted `#6e6e73`, faint `#a1a1a6`, surface `#f2f2f7`, night `#0b0b0c`, green `#34c759`, dark green `#248a3d`, blue `#007aff`, orange `#ff9500`, and the tints `#e3f7e8`, `#dbecff` and `#ffefd9`.

## Caption

> The fastest way to count calories.
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

1. "The fastest way to count calories. Two drags and you're done." Two iPhones mid-drag: dinner dragged to 500 calories on one, 35 grams of protein on the other.
2. "Keep count without it taking over." in big black type, with the word "count" small, in a green pill. Underneath: "With room for real life."
3. "Roughly right every day beats perfectly right for a week." Two hand-drawn lines of loops, like joined-up handwriting. A loose green line, every loop a little different, keeps going past the edge; a neat grey line of seven identical loops stops with a full stop. "Close enough, kept up."
4. "14 steps." A typical tracker logging one homemade spag bol for four: create a recipe, then search, pick a match and enter grams for each ingredient, set servings, and log. The phone shows a long list of near-identical beef mince results.
5. "2 steps." The same spag bol in Macro: drag to 500 calories, drag to 35 grams of protein, and we do the rest: carbs and fat, estimated. The phone shows the day with dinner logged and carbs and fat filled in.
6. The Macro app icon. "Track your food without the faff." Free forever, no ads, no trackers, no account. A "Join the beta" button, link in bio. Below, three iPhones: calories in front, protein and the day's meals tucked behind.
