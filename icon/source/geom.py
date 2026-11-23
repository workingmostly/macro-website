"""Vector geometry for the Macro icon: a tiny path type that can both emit SVG and rasterise.

All coordinates are in icon units, where the tile is 1024 x 1024 and y runs down.
"""
import math

import numpy as np
from PIL import Image, ImageDraw


class Path:
    """A path made of M, L, C (cubic) and A (circular arc) commands, like SVG's."""

    def __init__(self):
        self.cmds = []

    def M(self, x, y):
        self.cmds.append(('M', (x, y)))
        return self

    def L(self, x, y):
        self.cmds.append(('L', (x, y)))
        return self

    def C(self, x1, y1, x2, y2, x, y):
        self.cmds.append(('C', (x1, y1, x2, y2, x, y)))
        return self

    def A(self, r, large, sweep, x, y):
        self.cmds.append(('A', (r, large, sweep, x, y)))
        return self

    def Z(self):
        self.cmds.append(('Z', ()))
        return self

    # ---- output ----

    def svg(self, dx=0.0, dy=0.0, nd=2):
        f = lambda v: f'{round(v, nd):g}'
        out = []
        for op, a in self.cmds:
            if op == 'M' or op == 'L':
                out.append(f'{op}{f(a[0] + dx)} {f(a[1] + dy)}')
            elif op == 'C':
                x1, y1, x2, y2, x, y = a
                out.append(f'C{f(x1 + dx)} {f(y1 + dy)} {f(x2 + dx)} {f(y2 + dy)} {f(x + dx)} {f(y + dy)}')
            elif op == 'A':
                r, large, sweep, x, y = a
                out.append(f'A{f(r)} {f(r)} 0 {int(large)} {int(sweep)} {f(x + dx)} {f(y + dy)}')
            else:
                out.append('Z')
        return ''.join(out)

    def polygons(self, dx=0.0, dy=0.0, step=0.5):
        """Flatten to polygons. `step` is the target segment length in icon units."""
        polys, cur = [], []
        px = py = sx = sy = 0.0
        for op, a in self.cmds:
            if op == 'M':
                if len(cur) > 2:
                    polys.append(cur)
                px, py = a
                sx, sy = px, py
                cur = [(px, py)]
            elif op == 'L':
                px, py = a
                cur.append((px, py))
            elif op == 'C':
                x1, y1, x2, y2, x, y = a
                length = (math.dist((px, py), (x1, y1)) + math.dist((x1, y1), (x2, y2)) + math.dist((x2, y2), (x, y)))
                n = max(8, int(length / step))
                for i in range(1, n + 1):
                    t = i / n
                    u = 1 - t
                    bx = u * u * u * px + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x
                    by = u * u * u * py + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y
                    cur.append((bx, by))
                px, py = x, y
            elif op == 'A':
                r, large, sweep, x, y = a
                cur.extend(_arc_points(px, py, r, large, sweep, x, y, step)[1:])
                px, py = x, y
            else:
                if len(cur) > 2:
                    polys.append(cur)
                cur = []
                px, py = sx, sy
        if len(cur) > 2:
            polys.append(cur)
        return [[(x + dx, y + dy) for x, y in p] for p in polys]


def _arc_points(x1, y1, r, large, sweep, x2, y2, step):
    """Endpoint-parameterised circular arc (SVG F.6.5), flattened."""
    mx, my = (x1 - x2) / 2, (y1 - y2) / 2
    d2 = mx * mx + my * my
    r = max(r, math.sqrt(d2))
    coef = math.sqrt(max(0.0, (r * r - d2) / d2)) if d2 > 0 else 0.0
    if large == sweep:
        coef = -coef
    cxp, cyp = coef * my, -coef * mx
    cx, cy = cxp + (x1 + x2) / 2, cyp + (y1 + y2) / 2
    a1 = math.atan2(y1 - cy, x1 - cx)
    a2 = math.atan2(y2 - cy, x2 - cx)
    da = a2 - a1
    if sweep and da < 0:
        da += 2 * math.pi
    if not sweep and da > 0:
        da -= 2 * math.pi
    n = max(8, int(abs(da) * r / step))
    return [(cx + r * math.cos(a1 + da * i / n), cy + r * math.sin(a1 + da * i / n)) for i in range(n + 1)]


def rasterise(polys, size, supersample=1):
    """Fill polygons (union) into a boolean mask of size x size, icon units scaled to fit."""
    n = size * supersample
    s = n / 1024.0
    img = Image.new('L', (n, n), 0)
    d = ImageDraw.Draw(img)
    for p in polys:
        d.polygon([(x * s - 0.5, y * s - 0.5) for x, y in p], fill=255)
    m = np.asarray(img) > 127
    if supersample > 1:
        m = m.reshape(size, supersample, size, supersample).mean(axis=(1, 3))
    return m
