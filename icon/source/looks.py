"""The four icon looks. Each returns the icon as a linear RGB array, without the bezel (export.py adds that
to the rounded previews only).

The cutlery is lit from the top left and seen by a camera straight above; reflections come from a simple photo
studio (softboxes, walls and a dark band below eye level) so curved metal and glass have something to show."""
import numpy as np
from scipy import ndimage

import shapes
from render import PX, X, Y, dot, inflate, lin, mix, normals, norm3, object_fields, sample, shift_blur, smoothstep

LIGHT = norm3((-0.42, -0.85, 0.8))
VIEW = np.array([0, 0, 1], dtype=np.float32)
CAM = 1900.0     # camera distance in icon units: flat faces see a slightly different bit of the studio
_V = np.stack([512 - X, 512 - Y, np.full_like(X, CAM)], -1)
_V /= np.linalg.norm(_V, axis=-1, keepdims=True)
CUT = None


def cutlery():
    """Coverage, signed distance and inflated height of the fork and knife (computed once, shared by every look)."""
    f, k = shapes.polygons()
    a, d = object_fields(f + k)
    return {'a': a, 'd': d, 'hi': inflate(a)}


def get_cut():
    global CUT
    if CUT is None:
        CUT = cutlery()
    return CUT


def capped(h, cap, k=1.0):
    """Softly limit heights so wide parts (the fork head, the blade) stay flat instead of ballooning."""
    return (k * cap * np.tanh(h / cap)).astype(np.float32)


# ---------------------------------------------------------------- backgrounds

def dark_tile(top='#28282c', bottom='#0b0b0d'):
    img = mix(lin(top), lin(bottom), smoothstep(-0.1, 1.05, Y / 1024))
    r = np.sqrt(((X - 512) / 760) ** 2 + ((Y + 40) / 560) ** 2)
    return img + lin('#ffffff') * (0.03 * np.clip(1 - r, 0, 1) ** 2)[..., None]


def light_tile(top='#ffffff', bottom='#e3e4e9'):
    return mix(lin(top), lin(bottom), smoothstep(0.0, 1.0, Y / 1024))


def green_fill(img, surface=618.0, top='#3ad26c', bottom='#0b6e31', line=0.85, glow=0.16):
    """The app's drag-to-fill, as a glowing green level across the bottom of the tile. surface is its top edge (y)."""
    inside = smoothstep(surface - 0.7, surface + 0.7, Y)
    depth = np.clip((Y - surface) / (1024 - surface), 0, 1)
    out = mix(img, mix(lin(top), lin(bottom), depth ** 0.7), inside)
    ln = np.exp(-((Y - surface - 1.0) / 2.4) ** 2)
    above = np.exp(-np.clip(surface - Y, 0, None) / 46) * (Y < surface)
    out = out + lin('#c8ffd9') * (line * ln)[..., None]
    return out + lin('#34c759') * (glow * above)[..., None]


def drop_shadow(bg, a, strength=1.0, far=(20, 24, 0.6), near=(6, 5, 0.35), contact=None):
    sh = shift_blur(a, 0, far[0], far[1]) * far[2] + shift_blur(a, 0, near[0], near[1]) * near[2]
    if contact:
        sh = sh + shift_blur(a, 0, contact[0], contact[1]) * contact[2]
    return bg * (1 - np.clip(sh * strength, 0, 0.92))[..., None]


def occlusion(h, a, radius=14.0, k=0.06):
    """Darkening in the creases (where the surroundings stand taller than the point)."""
    hb = ndimage.gaussian_filter(h, radius / PX)
    ab = ndimage.gaussian_filter(a, radius / PX)
    rise = np.clip(hb / np.maximum(ab, 1e-3) - h, 0, None)
    return np.clip(rise * k, 0, 1) * a


# ---------------------------------------------------------------- materials

def glass_body(bg, n, h, *, refr=26.0, frost=6.0, milk=0.86, edge_clear=0.7, col='#f6f8f7', thick=9.0):
    """Frosted glass: the background, blurred and bent by the surface, under a milky layer that is
    whiter where the glass is thicker and clearer at the thin edges."""
    slope = 1 - n[..., 2]
    frosted = np.stack([ndimage.gaussian_filter(bg[..., c], frost / PX) for c in range(3)], -1)
    seen = sample(frosted, n[..., 0] * refr, n[..., 1] * refr)
    k = milk * (1 - edge_clear * np.clip(slope * 1.5, 0, 1)) * (1 - np.exp(-h / thick))
    return mix(seen, lin(col), k)


def glass_light(body, n, rim=1.0, spec_k=1.3, back_k=0.30, env_k=0.55, stripe=0.0):
    slope = 1 - n[..., 2]
    ndl = dot(n, LIGHT)
    body = body * (0.88 + 0.16 * np.clip(ndl, 0, 1))[..., None]
    body = body * (1.03 - 0.10 * smoothstep(150, 880, Y))[..., None]
    spec = np.clip(dot(n, norm3(LIGHT + VIEW)), 0, 1) ** 140
    lit_rim = slope ** 1.4 * np.clip(ndl, 0, 1) ** 0.8
    back_rim = slope ** 1.6 * np.clip(dot(n, norm3((0.5, 0.75, 0.45))), 0, 1)
    fres = 0.04 + 0.96 * slope ** 3
    env = studio(n, walls=0.25, floor=0.05, horizon=0.0, top=1.0)
    az, el = azel(n)
    strip = _box(az, el, -74, -40, -40, 70, 9) * stripe
    return body + lin('#ffffff') * (rim * lit_rim + spec_k * spec + back_k * back_rim + env_k * fres * env + strip)[..., None]


def _box(az, el, a0, a1, e0, e1, soft=6.0):
    """Soft-edged rectangle in (azimuth, elevation) degrees: a studio softbox."""
    return (smoothstep(a0 - soft, a0 + soft, az) * (1 - smoothstep(a1 - soft, a1 + soft, az)) *
            smoothstep(e0 - soft, e0 + soft, el) * (1 - smoothstep(e1 - soft, e1 + soft, el)))


def azel(n):
    """Azimuth / elevation (degrees) of the view ray reflected off the surface."""
    ndv = np.sum(n * _V, -1, keepdims=True)
    r = 2 * ndv * n - _V
    return np.degrees(np.arctan2(r[..., 0], r[..., 2])), np.degrees(np.arcsin(np.clip(-r[..., 1], -1, 1)))


def studio(n, key=1.7, fill_light=0.7, top=1.1, walls=0.32, floor=0.09, horizon=0.02, behind=0.10,
           key_box=(-80, -34, -12, 62), fill_box=(36, 74, -4, 46), hz=(-30, -12)):
    """Reflect the view off the surface into a simple photo studio: softboxes, walls, a dark band below eye level."""
    az, el = azel(n)
    e = walls * (0.62 + 0.62 * smoothstep(-14, 30, el)) + (top - walls) * smoothstep(22, 80, el)
    band = smoothstep(hz[0] - 4, hz[0] + 4, el) * (1 - smoothstep(hz[1] - 4, hz[1] + 4, el))
    e = e * (1 - band) + horizon * band
    e = np.where(el < hz[0], floor + (horizon - floor) * smoothstep(hz[0] - 30, hz[0], el), e)
    e = e * (1 - smoothstep(95, 120, np.abs(az))) + behind * smoothstep(95, 120, np.abs(az))
    e = e + key * _box(az, el, *key_box, 8)
    e = e + fill_light * _box(az, el, *fill_box, 8)
    return e


# ---------------------------------------------------------------- looks

def level(surface=600.0, cap=24.0, refr=34.0, frost=10.0, milk=0.94, edge_clear=0.75, rim=1.0, ao=0.6, stripe=0.3,
          fill_top='#3fd872', fill_bottom='#0a6b30'):
    """Level: frosted glass cutlery standing in a green fill that runs edge to edge. surface is its top edge (y)."""
    c = get_cut()
    a = c['a']
    bg = green_fill(dark_tile(), surface, fill_top, fill_bottom)
    h = capped(c['hi'], cap)
    n = normals(h, blur=0.8)
    body = glass_body(bg, n, h, refr=refr, frost=frost, milk=milk, edge_clear=edge_clear)
    body = body * (1 - ao * occlusion(h, a))[..., None]
    body = glass_light(body, n, rim=rim, stripe=stripe)
    down = np.clip(n[..., 1], 0, 1) * (1 - n[..., 2]) * (0.3 + 0.7 * smoothstep(surface - 120, surface + 40, Y))
    body = body + lin('#4dff8f') * (0.45 * down)[..., None]
    return mix(drop_shadow(bg, a), body, a)


def fill(surface=612.0, cap=24.0, refr=26.0, frost=6.0, milk=0.94, edge_clear=0.7, rim=1.1, wall=6.0,
         liq_top='#4ee385', liq_bottom='#0d8a3d', glow=0.24, tile_top='#29292d', tile_bottom='#0a0a0c',
         ao=0.6, stripe=0.32, core=0.13):
    """Fill: frosted glass cutlery on black, the handles filled with green like the app's drag-to-fill.
    surface is the y of the liquid's top; the liquid sits inside the glass, `wall` units in from its outside."""
    c = get_cut()
    a, d = c['a'], c['d']
    s = np.clip(-d, 0, None)
    bg = dark_tile(tile_top, tile_bottom)
    h = capped(c['hi'], cap)
    n = normals(h, blur=0.8)

    lvl = Y + n[..., 1] * 10
    below = smoothstep(surface - 0.8, surface + 0.8, lvl)
    inner = smoothstep(wall - 0.8, wall + 0.8, s)
    liq = below * inner

    spill = ndimage.gaussian_filter(a * smoothstep(surface - 2, surface + 2, Y), 34 / PX)
    bg = bg + lin('#2fd468') * (glow * spill)[..., None]

    upper = glass_body(bg, n, h, refr=refr, frost=frost, milk=milk, edge_clear=edge_clear)
    upper = upper * (1 - ao * occlusion(h, a))[..., None]
    depth = np.clip((Y - surface) / (shapes.P['end'] - surface), 0, 1)
    liquid = mix(lin(liq_top), lin(liq_bottom), depth ** 0.85)
    th = np.clip((s - wall) / 20, 0, 1)
    liquid = liquid * (0.62 + 0.48 * th)[..., None] + lin('#b6ffd0') * (core * th ** 2.5)[..., None]
    wall_tint = below * (1 - inner)
    upper = mix(upper, upper * 0.55 + lin('#9ff5be') * 0.45, wall_tint * 0.8)
    body = mix(upper, liquid, liq)
    men = np.exp(-((lvl - surface - 1.2) / 2.6) ** 2) * inner
    body = body + lin('#e4ffee') * (0.9 * men)[..., None]
    body = glass_light(body, n, rim=rim, stripe=stripe)
    return mix(drop_shadow(bg, a), body, a)


def steel(cap=40.0, k=1.0, tint='#e6ecf4', key=2.3, fill_light=0.95, walls=0.40, top=1.35, ao=0.55, sparkle=1.4):
    """Steel: polished silver cutlery on black."""
    c = get_cut()
    a = c['a']
    bg = dark_tile()
    h = capped(c['hi'], cap, k)
    n = normals(h, blur=0.8)
    e = studio(n, key=key, fill_light=fill_light, walls=walls, top=top, horizon=0.01, floor=0.07)
    spec = np.clip(dot(n, norm3(LIGHT + VIEW)), 0, 1) ** 320
    body = lin(tint) * e[..., None] + lin('#ffffff') * (sparkle * spec)[..., None]
    body = body * (1 - ao * occlusion(h, a))[..., None]
    return mix(drop_shadow(bg, a), body, a)


def ceramic(cap=40.0, k=1.0, base_col='#0b0b0d', refl=1.0, key=1.9, fill_light=0.8, shadow=1.0, ao=0.5, sparkle=1.0,
            tile_top='#ffffff', tile_bottom='#e2e3e8'):
    """Ceramic: glossy black ceramic cutlery on a white tile."""
    c = get_cut()
    a = c['a']
    bg = light_tile(tile_top, tile_bottom)
    h = capped(c['hi'], cap, k)
    n = normals(h, blur=0.8)
    nz = n[..., 2]
    fres = 0.05 + 0.95 * (1 - nz) ** 3
    e = studio(n, key=key, fill_light=fill_light, walls=0.55, floor=0.4, horizon=0.12, behind=0.35, top=1.25)
    body = lin(base_col) + lin('#ffffff') * (refl * fres * e)[..., None]
    az, el = azel(n)
    body = body + lin('#ffffff') * (0.65 * _box(az, el, -78, -36, -30, 64, 5) * (1 - nz) ** 0.35)[..., None]
    spec = np.clip(dot(n, norm3(LIGHT + VIEW)), 0, 1) ** 260
    body = body + lin('#ffffff') * (sparkle * spec)[..., None]
    body = body * (1 - ao * occlusion(h, a))[..., None]
    return mix(drop_shadow(bg, a, shadow, far=(26, 30, 0.42), near=(8, 7, 0.30), contact=(2, 1.6, 0.25)), body, a)


# name: (render function, bezel for the rounded preview)
LOOKS = {
    'fill': (fill, dict(width=8, strength=0.5)),
    'level': (level, dict(width=8, strength=0.5)),
    'steel': (steel, dict(width=8, strength=0.5)),
    'ceramic': (ceramic, dict(width=9, strength=0.35)),
}
