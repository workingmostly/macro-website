# Instagram carousel

Five 4:5 slides (1080 × 1350), in posting order. They're plain SVGs styled like the site, so they open in Figma as editable layers. One meal runs through slides 1, 2 and 5: a homemade spag bol for four, logged as 500 kcal and 35 g of protein at 19:30.

| # | File | Says |
| - | ---- | ---- |
| 1 | `01-two-drags.svg` | Calories and protein in two drags. Two phones mid-drag. |
| 2 | `02-fourteen-steps-vs-two.svg` | 14 steps vs. 2. The same spag bol in a typical tracker and in Macro, with barcode scanning, food databases and food photos struck out. |
| 3 | `03-roughly-right.svg` | Roughly right every day beats perfectly right for a week. An example month: rough guesses that keep landing in the 10% band, against a perfect week followed by nothing. |
| 4 | `04-keep-count.svg` | Keep count without it taking over. Nothing to weigh, a bit over still counts, nudges not nagging, stays on your iPhone, beside the app's week chart. |
| 5 | `05-join-the-beta.svg` | Track your food without the faff. Free forever, no ads, no trackers, no account. Join the beta. The only slide with the app icon. |

`previews/` has a PNG of each slide as committed, for a quick look without opening Figma. They won't follow your Figma edits, so export fresh ones from there when you post.

## Editing in Figma

- Drag the files onto the canvas, or use File → Import. Each comes in as a 1080 × 1350 group with named layers (`headline`, `calories-phone`, `rough-days` and so on). Everything sits inside `slide-content`, which is clipped to the slide.
- Fonts are **Inter** and **Inter Tight**. Both are Google Fonts, so Figma already has them.
- Each line of text sits at its own position, so if you rewrite a headline you may need to move the line breaks by hand.
- The phones are groups, with the screen clipped by a mask, so you can move or scale one as a single piece.
- The app icon on slide 5 is embedded as an image.
- Export each slide as PNG at 1x (1080 × 1350).

Colours are the site's: ink `#0a0a0a`, muted `#6e6e73`, faint `#a1a1a6`, surface `#f2f2f7`, night `#0b0b0c`, green `#34c759`, blue `#007aff`, orange `#ff9500`, amber `#f2a144`, and the tints `#e3f7e8`, `#dbecff` and `#ffefd9`.

## Caption

> Calories and protein in two drags.
>
> Macro is a calorie and protein tracker for iPhone with nothing to scan, search, weigh or photograph. Drag to roughly how many calories, drag to roughly how much protein, and get on with your day.
>
> Roughly right every day beats perfectly right for a week. A bit over still counts, and Macro looks at your week rather than every bite, so the numbers needn't take over.
>
> Free forever. No ads, no trackers, no account. Your meals stay on your phone, and in your own iCloud if you sync.
>
> Join the beta: link in bio.
>
> If counting calories has been hard for you before, it's worth talking to your GP before you start.

## Alt text

1. Two iPhones showing Macro mid-meal: dinner dragged to 500 calories, then to 35 grams of protein. "Calories and protein in two drags."
2. "14 steps vs. 2." The same homemade spag bol for four takes 14 steps in a typical tracker (searching, picking matches, entering grams) and 2 drags in Macro. Barcode scanning, food databases and food photos are crossed out.
3. "Roughly right every day beats perfectly right for a week." An example month on a 2,200 calorie goal: rough guesses every day, 25 of them within 10% of the goal, against seven days logged to the calorie and then nothing. Both land in the band; only one is still going.
4. "Keep count without it taking over." Nothing to weigh, a bit over still counts, nudges not nagging, stays on your iPhone. Beside it, Macro's week chart: on track, 5 of 6 days this week hit both goals.
5. The Macro app icon. "Track your food without the faff." Free forever, no ads, no trackers, no account. Join the beta: public beta on TestFlight, link in bio.
