"""Rendering helpers for the Macro icon: fields, heights, normals, the icon outline and output.

Everything works in linear light on a W x W grid (2x the 1024 icon), in icon units (the tile is 1024 across, y down),
and is written out as sRGB at 1024.
"""
import numpy as np
from PIL import Image
from scipy import ndimage

from geom import rasterise

W = 2048
PX = 1024 / W          # icon units per pixel
HI = 4096              # resolution of the mask the distance field is built from

# ---------------------------------------------------------------- colour

def hexc(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], dtype=np.float32)


def lin(c):
    c = hexc(c) if isinstance(c, str) else np.asarray(c, dtype=np.float32)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4).astype(np.float32)


def to_srgb(x):
    x = np.clip(x, 0, 1)
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * np.power(x, 1 / 2.4) - 0.055)


def mix(a, b, t):
    t = np.asarray(t, dtype=np.float32)
    if t.ndim == 2:
        t = t[..., None]
    return a * (1 - t) + b * t


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------- geometry

_Y, _X = np.mgrid[0:W, 0:W].astype(np.float32)
X = (_X + 0.5) * PX
Y = (_Y + 0.5) * PX
del _X, _Y


def squircle_sdf(n=5.0, half=512.0):
    """Approximate distance (icon units, negative inside) to the iOS icon outline, a superellipse."""
    u = np.abs(X - 512) / half
    v = np.abs(Y - 512) / half
    u = np.maximum(u, 1e-6)
    v = np.maximum(v, 1e-6)
    f = u ** n + v ** n - 1
    gx = n * u ** (n - 1) / half * np.sign(X - 512)
    gy = n * v ** (n - 1) / half * np.sign(Y - 512)
    g = np.sqrt(gx * gx + gy * gy) + 1e-9
    return f / g, gx / g, gy / g


def object_fields(polys):
    """Coverage (anti-aliased) and signed distance (icon units, negative inside) for a set of polygons."""
    m = rasterise(polys, HI, 1)
    inside = ndimage.distance_transform_edt(m)
    outside = ndimage.distance_transform_edt(~m)
    d = np.where(m, -(inside - 0.5), outside - 0.5) * (1024 / HI)
    f = HI // W
    d = d.reshape(W, f, W, f).mean(axis=(1, 3)).astype(np.float32)
    d = ndimage.gaussian_filter(d, 0.8)
    a = rasterise(polys, W, supersample=4).astype(np.float32)
    return a, d


def inflate(a):
    """Smooth 'inflated' heights (icon units): solve -laplace(u) = 1 inside the shape (u = 0 outside), then
    h = sqrt(2u). Any strip of half-width w gets a round cross-section of radius w, and the pieces blend smoothly
    where tines meet the head and the blade meets the handle."""
    import pyamg
    import scipy.sparse as sp
    inside = a > 0.5
    ys, xs = np.nonzero(inside)
    n = len(ys)
    idx = -np.ones(inside.shape, dtype=np.int64)
    idx[ys, xs] = np.arange(n)
    rows, cols, vals = [np.arange(n)], [np.arange(n)], [np.full(n, 4.0)]
    for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
        yy, xx = ys + dy, xs + dx
        ok = (yy >= 0) & (yy < W) & (xx >= 0) & (xx < W)
        j = np.full(n, -1)
        j[ok] = idx[yy[ok], xx[ok]]
        ok = j >= 0
        rows.append(np.arange(n)[ok])
        cols.append(j[ok])
        vals.append(np.full(ok.sum(), -1.0))
    A = sp.csr_matrix((np.concatenate(vals), (np.concatenate(rows), np.concatenate(cols))), shape=(n, n))
    ml = pyamg.smoothed_aggregation_solver(A)
    u = ml.solve(np.full(n, PX * PX), tol=1e-9, maxiter=200)
    U = np.zeros(inside.shape, dtype=np.float32)
    U[ys, xs] = u
    return np.sqrt(np.maximum(2 * U, 0)).astype(np.float32)


def normals(h, blur=1.2):
    """Unit surface normals (W, W, 3) of a height field, after a light blur in icon units."""
    hb = ndimage.gaussian_filter(h, blur / PX) if blur else h
    gy, gx = np.gradient(hb, PX)
    n = np.stack([-gx, -gy, np.ones_like(h)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return n


def shift_blur(a, dx, dy, sigma):
    """Offset (icon units) and blur (icon units) a mask, for shadows."""
    s = ndimage.shift(a, (dy / PX, dx / PX), order=1, mode='constant', cval=0)
    return ndimage.gaussian_filter(s, sigma / PX) if sigma > 0 else s


def sample(img, ox, oy):
    """Sample img (W, W, 3) at pixel offsets ox, oy (icon units) with bilinear filtering."""
    coords = [(Y / PX - 0.5 + oy / PX), (X / PX - 0.5 + ox / PX)]
    return np.stack([ndimage.map_coordinates(img[..., c], coords, order=1, mode='nearest') for c in range(3)], -1)


def norm3(v):
    v = np.asarray(v, dtype=np.float32)
    return v / np.linalg.norm(v)


def dot(n, v):
    return n[..., 0] * v[0] + n[..., 1] * v[1] + n[..., 2] * v[2]


# ---------------------------------------------------------------- tile rim

def tile_rim(img, width=7.0, strength=0.55, tint=(1, 1, 1), lights=((-0.62, -0.78), (0.7, 0.7)), weights=(1.0, 0.55)):
    """Liquid-glass style bright edge just inside the icon outline, strongest facing the lights."""
    sd, nx, ny = squircle_sdf()
    band = np.clip(1 + sd / width, 0, 1) ** 2.2 * (sd < 0.5)
    lit = np.zeros_like(sd)
    for (lx, ly), w in zip(lights, weights):
        lit += w * np.clip(nx * lx + ny * ly, 0, 1) ** 1.6
    k = (band * (0.18 + lit) * strength)[..., None]
    return img + k * np.asarray(tint, dtype=np.float32)


# ---------------------------------------------------------------- output

def save(img_lin, path, size=1024, mask=False):
    """Write sRGB PNG at size. mask=True cuts the squircle out with transparency (for previews)."""
    rgb = (to_srgb(img_lin) * 255 + 0.5).astype(np.uint8)
    im = Image.fromarray(rgb, 'RGB')
    if mask:
        sd, _, _ = squircle_sdf()
        a = np.clip(0.5 - sd / PX, 0, 1)
        im.putalpha(Image.fromarray((a * 255 + 0.5).astype(np.uint8), 'L'))
    im = im.resize((size, size), Image.LANCZOS)
    im.save(path, optimize=True)
    return im
