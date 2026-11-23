"""A second round of ideas built on the Fill look: other colours and stories for the liquid, other compositions,
and other materials. Each idea renders its pieces one at a time over the tile, so pieces can overlap (glass bends
what's under it) and each can have its own level and colour.

Run: python3 icon/source/ideas.py OUT_DIR [idea ...]
"""
import math
import os
import sys
import time

import numpy as np
from scipy import ndimage

import shapes
from looks import LIGHT, VIEW, capped, dark_tile, drop_shadow, glass_body, glass_light, light_tile, occlusion
from render import (PX, X, Y, dot, inflate, lin, mix, normals, norm3, object_fields, save, smoothstep, tile_rim)


def C(c):
    """A colour as linear RGB: hex string, or an array that's already linear."""
    return lin(c) if isinstance(c, str) else np.asarray(c, dtype=np.float32)


def ramp(*stops):
    """Gradient over depth (0 at the liquid's surface, 1 at the bottom): ramp((0, '#hex'), (0.4, '#hex'), ...)."""
    def f(depth):
        out = np.zeros(depth.shape + (3,), dtype=np.float32) + C(stops[0][1])
        for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
            k = np.clip((depth - t0) / max(t1 - t0, 1e-6), 0, 1)
            seg = mix(C(c0), C(c1), k)
            out = np.where((depth >= t0)[..., None], seg, out)
        return out
    return f


# ---------------------------------------------------------------- pieces and compositions

def piece_polys(which):
    """The fork or knife as polygons, its handle axis on x = 0 (y as drawn)."""
    q = dict(shapes.P)
    path = shapes.fork(q)[0] if which == 'fork' else shapes.knife(q)[0]
    return path.polygons()


def place(polys, x=512.0, y=0.0, angle=0.0, scale=1.0, cx=512.0, cy=512.0):
    """Put a piece's axis at x (and shift it by y), then rotate (degrees, clockwise) and scale about (cx, cy)."""
    a = math.radians(angle)
    ca, sa = math.cos(a), math.sin(a)
    out = []
    for poly in polys:
        pts = []
        for px, py in poly:
            dx, dy = (px + x - cx) * scale, (py + y - cy) * scale
            pts.append((cx + dx * ca - dy * sa, cy + dx * sa + dy * ca))
        out.append(pts)
    return out


def centred(pieces, cx=512.0, cy=512.0):
    """Shift a composition so its bounding box is centred on (cx, cy)."""
    pts = [pt for _, polys in pieces for poly in polys for pt in poly]
    x0, x1 = min(p[0] for p in pts), max(p[0] for p in pts)
    y0, y1 = min(p[1] for p in pts), max(p[1] for p in pts)
    dx, dy = cx - (x0 + x1) / 2, cy - (y0 + y1) / 2
    return [(k, [[(x + dx, y + dy) for x, y in poly] for poly in polys]) for k, polys in pieces]


def pair_positions():
    """Where the standard layout puts the fork and knife axes."""
    _, fx, _, kx, _ = shapes.layout()
    return fx, kx


_FIELDS = {}


def fields(key, polys):
    """Coverage, distance and inflated height for one piece (cached by key)."""
    if key not in _FIELDS:
        a, d = object_fields(polys)
        _FIELDS[key] = {'a': a, 'd': d, 'hi': inflate(a), 'bottom': max(p[1] for poly in polys for p in poly)}
    return _FIELDS[key]


def composition(name):
    """Pieces back to front as (key, polygons)."""
    fx, kx = pair_positions()
    fork, knife = piece_polys('fork'), piece_polys('knife')
    if name == 'pair':
        return [('pair-fork', place(fork, fx)), ('pair-knife', place(knife, kx))]
    if name == 'tilted':
        return centred([('tilt-fork', place(fork, fx, angle=16, scale=0.95)),
                        ('tilt-knife', place(knife, kx, angle=16, scale=0.95))], cx=506, cy=516)
    if name == 'crossed':
        return centred([('cross-fork', place(fork, 512, angle=-38, scale=1.0)),
                        ('cross-knife', place(knife, 530, angle=38, scale=1.0))], cy=516)
    if name == 'solo':
        return [('solo-fork', place(fork, 512, y=-6, scale=1.08, cy=500))]
    raise KeyError(name)


# ---------------------------------------------------------------- materials (each draws one piece over bg)

def filled_glass(bg, F, *, surface=612.0, liquid=None, glow_col='#2fd468', glow=0.24, glass_col='#f6f8f7', cap=24.0,
                 refr=26.0, frost=6.0, milk=0.94, edge_clear=0.7, rim=1.1, wall=6.0, ao=0.6, stripe=0.32, core=0.13,
                 core_col='#b6ffd0', wall_col='#9ff5be', men_col='#e4ffee', shadow=1.0, thick=9.0):
    """The Fill material for one piece: frosted glass with liquid inside up to a level."""
    a, d = F['a'], F['d']
    s = np.clip(-d, 0, None)
    h = capped(F['hi'], cap)
    n = normals(h, blur=0.8)
    liquid = liquid or ramp((0, '#4ee385'), (1, '#0d8a3d'))

    lvl = Y + n[..., 1] * 10
    below = smoothstep(surface - 0.8, surface + 0.8, lvl)
    inner = smoothstep(wall - 0.8, wall + 0.8, s)
    liq = below * inner

    if glow:
        spill = ndimage.gaussian_filter(a * smoothstep(surface - 2, surface + 2, Y), 34 / PX)
        bg = bg + C(glow_col) * (glow * spill)[..., None]

    upper = glass_body(bg, n, h, refr=refr, frost=frost, milk=milk, edge_clear=edge_clear, col=glass_col,
                       thick=thick)
    upper = upper * (1 - ao * occlusion(h, a))[..., None]
    depth = np.clip((Y - surface) / max(F['bottom'] - surface, 1.0), 0, 1)
    th = np.clip((s - wall) / 20, 0, 1)
    liquid_c = liquid(depth) * (0.62 + 0.48 * th)[..., None] + C(core_col) * (core * th ** 2.5)[..., None]
    wall_tint = below * (1 - inner)
    upper = mix(upper, upper * 0.55 + C(wall_col) * 0.45, wall_tint * 0.8)
    body = mix(upper, liquid_c, liq)
    men = np.exp(-((lvl - surface - 1.2) / 2.6) ** 2) * inner
    body = body + C(men_col) * (0.9 * men)[..., None]
    body = glass_light(body, n, rim=rim, stripe=stripe)
    return mix(drop_shadow(bg, a, shadow), body, a)


def tinted_glass(bg, F, *, tint='#34e070', deep='#021f0c', cap=24.0, refr=30.0, frost=4.0, rim=1.3, stripe=0.55,
                 ao=0.5, glow=0.22, core=0.9, see=0.35):
    """Coloured glass all the way through. Light travels along each rod, so it glows down the middle and goes
    dark green toward the edges, like a boiled sweet held up to a lamp."""
    a = F['a']
    h = capped(F['hi'], cap)
    n = normals(h, blur=0.8)
    if glow:
        bg = bg + C(tint) * (glow * ndimage.gaussian_filter(a, 30 / PX))[..., None]
    seen = glass_body(bg, n, h, refr=refr, frost=frost, milk=0.0, edge_clear=0.0)
    light = 1 - np.exp(-F['hi'] / 16)
    body = seen * see + mix(C(deep), C(tint), light ** 1.4) * (0.35 + core * light ** 2)[..., None]
    body = body * (1 - ao * occlusion(h, a))[..., None]
    body = glass_light(body, n, rim=rim, stripe=stripe, env_k=0.8)
    return mix(drop_shadow(bg, a), body, a)


def neon(bg, F, *, col='#33e070', hot='#f2fff5', tube=8.5, inset=6.0, glow=0.55, halo=0.22):
    """A glass tube bent along the outline, lit from inside."""
    d = F['d']
    t = d + inset                       # distance from the tube's centre line
    m = smoothstep(tube + 0.8, tube - 0.8, np.abs(t))
    hh = np.sqrt(np.clip(tube ** 2 - t ** 2, 0, None))
    n = normals(hh, blur=0.5)
    core = np.clip(1 - np.abs(t) / tube, 0, 1)
    out = bg + C(col) * (glow * ndimage.gaussian_filter(m, 14 / PX) + halo * ndimage.gaussian_filter(m, 60 / PX))[..., None]
    emit = mix(C(col), C(hot), core ** 2.2) * (0.75 + 0.45 * core)[..., None]
    spec = np.clip(dot(n, norm3(LIGHT + VIEW)), 0, 1) ** 60
    emit = emit + C('#ffffff') * (0.5 * spec)[..., None]
    return mix(out, emit, m)


def creases(h, a, sigma=6.0, k=0.9):
    """Darkening only where the surface is concave (valleys between tines, the neck), from its curvature."""
    lap = ndimage.gaussian_laplace(h, sigma / PX) / (PX * PX)
    return np.clip(lap * k, 0, 1) * a


def clay(bg, F, *, col='#fffdf8', cap=34.0, k=1.0, ao=0.6, shadow=0.55, sheen=0.10, bounce='#ffffff'):
    """Soft matte clay: wrapped light, soft creases, a faint satin sheen."""
    a = F['a']
    h = capped(F['hi'], cap, k)
    n = normals(h, blur=1.0)
    ndl = dot(n, LIGHT)
    wrap = np.clip((ndl + 0.6) / 1.6, 0, 1)
    body = C(col) * (0.52 + 0.52 * wrap)[..., None]
    rim = (1 - n[..., 2]) ** 2 * np.clip(-ndl + 0.2, 0, 1)
    body = body + C(bounce) * (0.10 * rim)[..., None]
    body = body + C('#ffffff') * (sheen * np.clip(dot(n, norm3(LIGHT + VIEW)), 0, 1) ** 14)[..., None]
    body = body * (1 - ao * creases(h, a))[..., None]
    return mix(drop_shadow(bg, a, shadow, far=(24, 30, 0.5), near=(7, 8, 0.4), contact=(2, 2, 0.3)), body, a)


# ---------------------------------------------------------------- tiles

def green_tile(top='#45dc78', bottom='#0b7a35'):
    img = mix(lin(top), lin(bottom), smoothstep(-0.1, 1.05, Y / 1024))
    r = np.sqrt(((X - 512) / 760) ** 2 + ((Y + 40) / 560) ** 2)
    return img + lin('#ffffff') * (0.06 * np.clip(1 - r, 0, 1) ** 2)[..., None]


def pastel_tile(top='#c6f2d4', bottom='#7fd79c'):
    return mix(lin(top), lin(bottom), smoothstep(0.0, 1.0, Y / 1024))


# ---------------------------------------------------------------- the ideas

BLUE = dict(liquid=ramp((0, '#58a8ff'), (1, '#0a52c9')), glow_col='#2d8cff', core_col='#cfe6ff', wall_col='#a9d1ff',
            men_col='#e6f2ff')
CALORIE_RAMP = ramp((0, '#ffb340'), (0.18, '#ffd60a'), (0.5, '#8fe05a'), (1, '#1f9e4a'))


def draw(bg, comp, material, per_piece=None, **kw):
    """Draw a composition's pieces back to front with one material; per_piece overrides by piece index."""
    for i, (key, polys) in enumerate(composition(comp)):
        F = fields(key, polys)
        args = dict(kw, **(per_piece[i] if per_piece else {}))
        bg = material(bg, F, **args)
    return bg


IDEAS = {
    # name: (group, title, description, render)
    'macros': ('Fill, retold', 'Two macros',
               "Calories in the fork, protein in the knife, each at its own level. The app's two drags in one icon.",
               lambda: draw(dark_tile('#29292d', '#0a0a0c'), 'pair', filled_glass,
                            per_piece=[dict(surface=560), dict(surface=650, **BLUE)])),
    'brimming': ('Fill, retold', 'Brimming',
                 'Filled right up into the tines and the blade, as if the day is nearly done.',
                 lambda: draw(dark_tile('#29292d', '#0a0a0c'), 'pair', filled_glass, surface=356, glow=0.18)),
    'ramp': ('Fill, retold', 'Calorie ramp',
             "The liquid runs through the app's calorie colours, from green at the bottom to yellow at the top.",
             lambda: draw(dark_tile('#29292d', '#0a0a0c'), 'pair', filled_glass, surface=470, liquid=CALORIE_RAMP,
                          glow_col='#a8e05a', glow=0.18, core_col='#fff3c4', wall_col='#ffe9a8', men_col='#fff6df')),
    'smoked': ('Fill, retold', 'Smoked glass',
               'A light version: black glass on a white tile, with the green showing through.',
               lambda: draw(light_tile('#ffffff', '#e4e6ea'), 'pair', filled_glass, glass_col='#0d0f12', milk=1.0,
                            thick=3.0, edge_clear=0.35, glow=0.12, rim=1.3, stripe=0.6, core=0.18)),
    'midnight': ('Fill, retold', 'Midnight',
                 'Fill on deep navy instead of black, so the tile has colour even before the green.',
                 lambda: draw(dark_tile('#22305a', '#080d1c'), 'pair', filled_glass)),
    'emerald': ('Fill, retold', 'Emerald',
                'All green: a deep green tile with the fill in bright mint.',
                lambda: draw(dark_tile('#124a2e', '#03170c'), 'pair', filled_glass, glow_col='#5dffa0',
                             liquid=ramp((0, '#8dffbe'), (1, '#1fbf63')), core_col='#e2fff0')),
    'tilted': ('New compositions', 'Tilted',
               'The pair leaning into the corner. The liquid stays level, so it sits at an angle in the handles.',
               lambda: draw(dark_tile('#29292d', '#0a0a0c'), 'tilted', filled_glass, surface=640)),
    'crossed': ('New compositions', 'Crossed',
                'Fork and knife crossed, the knife resting on the fork. The liquid stays level in both.',
                lambda: draw(dark_tile('#29292d', '#0a0a0c'), 'crossed', filled_glass, surface=660)),
    'solo': ('New compositions', 'Just the fork',
             'One big fork. The simplest shape, so it stays clear at the smallest sizes.',
             lambda: draw(dark_tile('#29292d', '#0a0a0c'), 'solo', filled_glass, surface=640)),
    'jelly': ('New materials', 'Green glass',
              'Cutlery cast in green glass, lit from inside so it glows down the middle.',
              lambda: draw(dark_tile('#29292d', '#0a0a0c'), 'pair', tinted_glass)),
    'neon': ('New materials', 'Neon',
             'A diner sign: one green glass tube bent around the fork and knife.',
             lambda: draw(dark_tile('#1f1f23', '#09090b'), 'pair', neon)),
    'clay': ('New materials', 'Clay',
             "Soft matte white cutlery on mint. Friendly rather than shiny, though it's the softest at small sizes.",
             lambda: draw(pastel_tile(), 'pair', clay)),
    'mint': ('New materials', 'Frost on green',
             'White frosted glass on a bright green tile. The whole tile is the fill.',
             lambda: draw(green_tile(), 'pair', filled_glass, surface=2000, glow=0, milk=0.95, refr=34, frost=10,
                          edge_clear=0.75, rim=1.0)),
}

BEZEL = dict(width=8, strength=0.5)
LIGHT_BEZEL = dict(width=9, strength=0.35)
LIGHT_IDEAS = {'smoked', 'clay'}


if __name__ == '__main__':
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    for name in sys.argv[2:] or list(IDEAS):
        t0 = time.time()
        img = IDEAS[name][3]()
        save(img, os.path.join(out, f'{name}.png'))
        save(tile_rim(img, **(LIGHT_BEZEL if name in LIGHT_IDEAS else BEZEL)), os.path.join(out, f'{name}-rounded.png'),
             mask=True)
        print(f'{name}: {time.time() - t0:.0f}s', flush=True)
