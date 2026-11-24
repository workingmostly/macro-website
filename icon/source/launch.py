"""The app's launch screen glyph: the fork and knife as a flat shape, with the handles filled green (calories) and
blue (protein) to the same levels as the icon, in a light and a dark version at 1x, 2x and 3x.

Writes icon-{light,dark}@{1,2,3}x.png into an imageset folder, the names the app's LaunchIcon.imageset uses:
python3 icon/source/launch.py ../tally/Macro/Assets.xcassets/LaunchIcon.imageset
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

import shapes
from macros import BLUE_AT, GREEN_AT

HEIGHT_PT = 86          # the launch glyph's height in points (unchanged from the old one, so the layout stays put)
WALL = 7.0              # icon units of glyph colour kept around each fill, like the glass wall in the icon
SUPER = 8               # supersampling for clean edges

APPEARANCES = {
    # name: (glyph colour, calories green, protein blue): iOS system colours for each appearance
    'light': ('#000000', '#34c759', '#007aff'),
    'dark': ('#ffffff', '#30d158', '#0a84ff'),
}


def rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], dtype=np.float64)


def render(scale):
    """RGBA images for both appearances at a given screen scale."""
    fork, knife = shapes.polygons()
    pts = [p for poly in fork + knife for p in poly]
    x0, x1 = min(p[0] for p in pts), max(p[0] for p in pts)
    y0, y1 = min(p[1] for p in pts), max(p[1] for p in pts)
    k = HEIGHT_PT * scale / (y1 - y0)            # output pixels per icon unit
    pad = 1                                      # a transparent pixel all round, so nothing touches the edge
    w_px = int(np.ceil((x1 - x0) * k)) + 2 * pad
    h_px = HEIGHT_PT * scale + 2 * pad
    W, H = w_px * SUPER, h_px * SUPER
    kk = k * SUPER
    off = pad * SUPER

    def mask(polys):
        from PIL import ImageDraw
        im = Image.new('L', (W, H), 0)
        d = ImageDraw.Draw(im)
        for poly in polys:
            d.polygon([((x - x0) * kk + off, (y - y0) * kk + off) for x, y in poly], fill=255)
        return np.asarray(im) > 127

    rows = (np.arange(H)[:, None] + 0.5 - off) / kk + y0     # icon-unit y of each row
    out = {}
    pieces = [(mask(fork), GREEN_AT, 1), (mask(knife), BLUE_AT, 2)]
    for name, (glyph, green, blue) in APPEARANCES.items():
        colour = np.zeros((H, W, 3))
        alpha = np.zeros((H, W))
        for m, level, which in pieces:
            inside = ndimage.distance_transform_edt(m) / kk           # icon units from the edge
            fill = m & (inside >= WALL) & (rows >= level)
            colour[m] = rgb(glyph)
            colour[fill] = rgb(green if which == 1 else blue)
            alpha[m] = 1.0
        # box-filter down with premultiplied alpha
        pre = colour * alpha[..., None]
        pre = pre.reshape(h_px, SUPER, w_px, SUPER, 3).mean(axis=(1, 3))
        a = alpha.reshape(h_px, SUPER, w_px, SUPER).mean(axis=(1, 3))
        col = np.where(a[..., None] > 0, pre / np.maximum(a[..., None], 1e-9), 0)
        rgba = np.dstack([np.clip(col, 0, 255), a * 255]).round().astype(np.uint8)
        out[name] = Image.fromarray(rgba, 'RGBA')
    return out


if __name__ == '__main__':
    folder = sys.argv[1]
    for scale in (1, 2, 3):
        for name, im in render(scale).items():
            path = os.path.join(folder, f'icon-{name}@{scale}x.png')
            im.save(path, optimize=True)
            print('wrote', path, im.size)
