# App icon

Four takes on Macro's fork and knife, redrawn from scratch and rendered as real materials. **Fill** is the recommended one. None of them is live yet: the site still uses the old icon (see [Putting one live](#putting-one-live)).

| Look | Master | What it is |
| ---- | ------ | ---------- |
| Fill (recommended) | `fill.png` | Frosted glass cutlery on black. The handles are filled with green up to a level, like dragging to your numbers in the app, and the green light spills onto the tile. Keeps today's black and white. |
| Level | `level.png` | The same glass cutlery standing in a green fill that runs across the bottom of the tile. The loudest on a home screen. |
| Steel | `steel.png` | Polished silver on black, lit like a product shot. The closest to the current icon, with no colour added. |
| Ceramic | `ceramic.png` | Glossy black ceramic on a white tile with soft shadows. Matches the site's white pages. |

- `NAME.png` is the 1024 × 1024 master: a full-bleed square with no transparency and no rounded corners. That's what Xcode's AppIcon (single size) and App Store Connect want; iOS cuts the shape itself.
- `NAME-rounded.png` is the same art cut to the iOS icon shape, with a thin glass bezel, on transparency. Use it wherever iOS isn't doing the masking: the website, social posts, decks.
- `cutlery.svg` is the fork and knife as flat vector paths on a 1024 artboard, for Figma, Icon Composer or a favicon.

## Why the glyph is new

The old fork and knife closely matches Apple's SF Symbol `fork.knife`, and Apple's guidelines don't allow SF Symbols, or glyphs confusingly similar to them, in app icons. The new pair is drawn from scratch: four round-tipped tines, a knife with a straight spine and no notch, and one handle shape shared by both (narrow at the neck, flaring to a round end) so they read as a set. It's also a little bolder than the old glyph, so it holds up at Settings and notification sizes.

## iOS 26 and Icon Composer

The masters work as they are. Fill and Level are glass looks, so on iOS 26 they can also be rebuilt in Icon Composer from a dark background, `cutlery.svg` as a white glass layer and, for Fill, the green handles as a layer of their own. iOS then renders the glass itself and makes the dark, clear and tinted versions. Steel and Ceramic depend on their baked-in materials, so they stay single images.

## Putting one live

The site reads four files from `public/`. Each comes from the chosen look:

| File | Size | From |
| ---- | ---- | ---- |
| `icon.png` | 160 × 160 | `NAME.png` (the site rounds the corners in CSS) |
| `apple-touch-icon.png` | 180 × 180 | `NAME.png` (iOS rounds the corners) |
| `favicon.png` | 64 × 64 | `NAME-rounded.png` |
| `icon-512.png` | 512 × 512 | `NAME-rounded.png` (also the Open Graph image) |

Slide 5 of the Instagram carousel embeds the icon as well, so it needs the same swap.

## Re-rendering

```bash
pip install numpy scipy pillow pyamg
python3 icon/source/export.py icon          # all four, about a minute
python3 icon/source/export.py icon fill     # just one
```

| File | Holds |
| ---- | ----- |
| `source/shapes.py` | The fork and knife. Every proportion is in `P` at the top. |
| `source/looks.py` | The four materials and their lighting. Each look's arguments are its knobs: where the green level sits, how frosted the glass is, how bright the lights are. |
| `source/render.py` | The shared machinery: distance fields, the height map, normals, the icon outline and PNG output. |
| `source/geom.py` | A small path type that writes SVG and rasterises. |
| `source/export.py` | Writes everything in this folder. |

How it works: the paths are rasterised, then inflated. The renderer solves a Poisson equation inside the outline and takes the square root, which gives every strip a round cross-section and blends the joints where tines meet the head. Normals from that height map are lit from the top left and reflected into a simple photo studio (softboxes, walls and a dark band below eye level), which is what makes the steel read as steel. The glass bends and blurs whatever is behind it, and turns milkier where it's thicker.
