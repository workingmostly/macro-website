# App icon

Macro's fork and knife, redrawn from scratch and rendered as real materials. Round one has four directions, of which Fill (glass cutlery with green-filled handles) went forward. Round two, in `ideas/`, has thirteen ideas built on Fill. Round three, in `macros/`, takes the favourite of those, green calories in the fork and blue protein in the knife, ten ways. The chosen icon is **`macros/black.png`** (On black), and the site's icons and slide 5 of the Instagram carousel now come from it (see [Putting one live](#putting-one-live)). For the app, drop `macros/black.png` into Xcode's AppIcon.

## Round three: green and blue

Calories in green and protein in blue, the same colours as the app. The first five keep the pair and change the setting; the other five change its form.

| Take | File | What it is |
| ---- | ---- | ---------- |
| **On black** (chosen) | `macros/black.png` | Round two's Two macros: the fork filled green, the knife filled blue a little lower, on black. |
| Midnight | `macros/midnight.png` | The same pair on deep navy. The blue glow belongs there, and the green stands out more. |
| Smoked glass | `macros/smoked.png` | Black glass on a white tile, for a light icon that matches the website. |
| Even | `macros/even.png` | Both filled to the same level. |
| Fuller | `macros/full.png` | Calories up into the fork's head, protein up the blade. |
| Crossed | `macros/crossed.png` | The pair crossed, the blue knife resting on the green fork. |
| Tilted | `macros/tilted.png` | Leaning into the corner, with both levels staying flat. |
| Neon | `macros/neon.png` | Two tubes: a green fork and a blue knife. |
| Cast glass | `macros/glass.png` | A green glass fork and a blue glass knife, each lit from inside. |
| Frost on green and blue | `macros/frost.png` | White frosted cutlery on a tile that fades from green to blue. |

## Round one

| Look | Master | What it is |
| ---- | ------ | ---------- |
| Fill (recommended) | `fill.png` | Frosted glass cutlery on black. The handles are filled with green up to a level, like dragging to your numbers in the app, and the green light spills onto the tile. Keeps today's black and white. |
| Level | `level.png` | The same glass cutlery standing in a green fill that runs across the bottom of the tile. The loudest on a home screen. |
| Steel | `steel.png` | Polished silver on black, lit like a product shot. The closest to the current icon, with no colour added. |
| Ceramic | `ceramic.png` | Glossy black ceramic on a white tile with soft shadows. Matches the site's white pages. |

- `NAME.png` is the 1024 × 1024 master: a full-bleed square with no transparency and no rounded corners. That's what Xcode's AppIcon (single size) and App Store Connect want; iOS cuts the shape itself.
- `NAME-rounded.png` is the same art cut to the iOS icon shape, with a thin glass bezel, on transparency. Use it wherever iOS isn't doing the masking: the website, social posts, decks.
- `cutlery.svg` is the fork and knife as flat vector paths on a 1024 artboard, for Figma, Icon Composer or a favicon.

## Round two: ideas built on Fill

Same cutlery and glass as Fill; each idea changes one thing. They're in `ideas/`, with a master and a rounded version each, like round one. The three marked are my favourites.

| Idea | File | What changes |
| ---- | ---- | ------------ |
| **Two macros** ★ | `ideas/macros.png` | Calories in the fork (green), protein in the knife (blue), each at its own level. The app's two drags in one icon. |
| Brimming | `ideas/brimming.png` | Filled right up into the tines and the blade. |
| Calorie ramp | `ideas/ramp.png` | The liquid runs through the app's calorie colours, green at the bottom to yellow at the top. |
| **Smoked glass** ★ | `ideas/smoked.png` | A light version: black glass on a white tile, with the green showing through. |
| **Midnight** ★ | `ideas/midnight.png` | Fill on deep navy instead of black. |
| Emerald | `ideas/emerald.png` | A deep green tile with the fill in bright mint. |
| Tilted | `ideas/tilted.png` | The pair leaning into the corner; the liquid stays level, so it sits at an angle in the handles. |
| Crossed | `ideas/crossed.png` | Fork and knife crossed, the knife resting on the fork. |
| Just the fork | `ideas/solo.png` | One big fork, the simplest shape at small sizes. |
| Green glass | `ideas/jelly.png` | Cutlery cast in green glass, lit from inside. |
| Neon | `ideas/neon.png` | One green glass tube bent around the fork and knife, like a diner sign. |
| Clay | `ideas/clay.png` | Soft matte white cutlery on mint. The softest at small sizes. |
| Frost on green | `ideas/mint.png` | White frosted glass on a bright green tile; the whole tile is the fill. |

## Why the glyph is new

The old fork and knife closely matches Apple's SF Symbol `fork.knife`, and Apple's guidelines don't allow SF Symbols, or glyphs confusingly similar to them, in app icons. The new pair is drawn from scratch: four round-tipped tines, a knife with a straight spine and no notch, and one handle shape shared by both (narrow at the neck, flaring to a round end) so they read as a set. It's also a little bolder than the old glyph, so it holds up at Settings and notification sizes.

## iOS 26 and Icon Composer

The masters work as they are. Fill and Level are glass looks, so on iOS 26 they can also be rebuilt in Icon Composer from a dark background, `cutlery.svg` as a white glass layer and, for Fill, the green handles as a layer of their own. iOS then renders the glass itself and makes the dark, clear and tinted versions. Steel and Ceramic depend on their baked-in materials, so they stay single images.

## Putting one live

One command swaps everything over to a look, given its path without `.png` (this is how On black went live):

```bash
python3 icon/source/site.py icon/macros/black
```

It writes the four icon files the site reads from `public/`, from the look's master and rounded PNGs:

| File | Size | From |
| ---- | ---- | ---- |
| `icon.png` | 160 × 160 | `NAME.png` (the site rounds the corners in CSS) |
| `apple-touch-icon.png` | 180 × 180 | `NAME.png` (iOS rounds the corners) |
| `favicon.png` | 64 × 64 | `NAME-rounded.png` |
| `icon-512.png` | 512 × 512 | `NAME-rounded.png` (also the Open Graph image) |

It also swaps the icon embedded in slide 5 of the Instagram carousel. Re-export that slide's PNG preview afterwards (from Figma, or any renderer with Inter and Inter Tight installed) so `instagram/previews/` stays in step.

## Re-rendering

```bash
pip install numpy scipy pillow pyamg
python3 icon/source/export.py icon          # round one, about a minute
python3 icon/source/export.py icon fill     # just one
python3 icon/source/ideas.py icon/ideas     # round two, about six minutes
python3 icon/source/ideas.py icon/ideas neon
python3 icon/source/macros.py icon/macros   # round three, about five minutes
python3 icon/source/macros.py icon/macros midnight
```

| File | Holds |
| ---- | ----- |
| `source/shapes.py` | The fork and knife. Every proportion is in `P` at the top. |
| `source/looks.py` | The four materials and their lighting. Each look's arguments are its knobs: where the green level sits, how frosted the glass is, how bright the lights are. |
| `source/ideas.py` | Round two. Draws pieces one at a time, so each can have its own level and colour, and they can be rotated or overlap (the top piece's glass bends what's under it). Also has the green glass, neon and clay materials. |
| `source/macros.py` | Round three. The green and blue pair on top of `ideas.py`; `GREEN_AT` and `BLUE_AT` set where the two levels sit. |
| `source/site.py` | Puts a look live: the four `public/` icons and the icon on Instagram slide 5. |
| `source/render.py` | The shared machinery: distance fields, the height map, normals, the icon outline and PNG output. |
| `source/geom.py` | A small path type that writes SVG and rasterises. |
| `source/export.py` | Writes everything in this folder. |

How it works: the paths are rasterised, then inflated. The renderer solves a Poisson equation inside the outline and takes the square root, which gives every strip a round cross-section and blends the joints where tines meet the head. Normals from that height map are lit from the top left and reflected into a simple photo studio (softboxes, walls and a dark band below eye level), which is what makes the steel read as steel. The glass bends and blurs whatever is behind it, and turns milkier where it's thicker.
