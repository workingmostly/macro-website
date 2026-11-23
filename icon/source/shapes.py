"""The fork and knife, drawn from scratch (not SF Symbols). Icon units: 1024 tile, y down.

Both pieces share one handle: narrow at the neck, flaring gently to a round end, so they read as a set.
"""
from geom import Path

P = dict(
    top=160,         # tine tips and knife tip
    end=864,         # bottom of the handles
    neck=32.0,       # handle half-width at the neck
    flare=42.0,      # handle half-width at the round end
    tines=4,
    tine_r=22.0,     # tine half-width
    slot_r=11.5,     # half the gap between tines
    slot_y=336.0,    # centre of the round slot bottoms
    shoulder_y=380.0,
    fork_neck_y=500.0,
    shoulder_k=0.55, # how far the bell curve holds out before turning in
    blade=136.0,     # knife blade width (edge to spine)
    belly_y=440.0,   # widest point of the blade
    knife_neck_y=572.0,
    tip_r=22.0,
    gap=60.0,        # space between fork head and knife belly
    shift=-14.0,     # optical shift of the pair (negative = left)
)


def _handle(p, neck_y, q):
    """From the neck on the right side, down round the end and back up to the neck on the left."""
    neck, flare, end = q['neck'], q['flare'], q['end']
    span = end - flare - neck_y
    p.C(neck, neck_y + span * 0.36, flare, neck_y + span * 0.62, flare, end - flare)
    p.A(flare, 0, 1, -flare, end - flare)
    p.C(-flare, neck_y + span * 0.62, -neck, neck_y + span * 0.36, -neck, neck_y)


def fork(q):
    """Fork centred on x=0. Returns (path, half-width of the head)."""
    tr, sr = q['tine_r'], q['slot_r']
    pitch = 2 * tr + 2 * sr
    n = q['tines']
    centres = [(i - (n - 1) / 2) * pitch for i in range(n)]
    half = centres[-1] + tr
    tip_c = q['top'] + tr
    sy, shy, ny, neck = q['slot_y'], q['shoulder_y'], q['fork_neck_y'], q['neck']
    k = q['shoulder_k']
    bell = ny - shy

    p = Path()
    p.M(centres[0] - tr, tip_c)
    for i, c in enumerate(centres):
        p.A(tr, 0, 1, c + tr, tip_c)
        if i < n - 1:
            p.L(c + tr, sy)
            p.A(sr, 0, 0, centres[i + 1] - tr, sy)
            p.L(centres[i + 1] - tr, tip_c)
    p.L(half, shy)
    p.C(half, shy + bell * k, neck, ny - bell * (1 - k), neck, ny)
    _handle(p, ny, q)
    p.C(-neck, ny - bell * (1 - k), -half, shy + bell * k, -half, shy)
    p.Z()
    return p, half


def knife(q):
    """Knife whose handle is centred on x=0: straight spine on the right, curved edge on the left.
    Returns (path, distance from the handle axis to the blade's widest point)."""
    neck, top, tr = q['neck'], q['top'], q['tip_r']
    blade, by, ny = q['blade'], q['belly_y'], q['knife_neck_y']
    spine = neck
    left = spine - blade
    p = Path()
    p.M(spine - tr, top)
    p.C(spine - tr * 0.45, top, spine, top + tr * 0.55, spine, top + tr)
    p.L(spine, ny)
    _handle(p, ny, q)
    p.C(-neck, ny - (ny - by) * 0.55, left, by + (ny - by) * 0.45, left, by)
    p.C(left, by - (by - top) * 0.55, spine - tr - (spine - tr - left) * 0.5, top, spine - tr, top)
    p.Z()
    return p, -left


def layout(**over):
    """Place fork and knife so the pair is centred (with an optical shift). Returns (fork, fx, knife, kx, params)."""
    q = dict(P, **over)
    fp, fhalf = fork(q)
    kp, kleft = knife(q)
    width = 2 * fhalf + q['gap'] + kleft + q['flare']
    left = 512 - width / 2 + q['shift']
    fx = left + fhalf
    kx = fx + fhalf + q['gap'] + kleft
    return fp, fx, kp, kx, q


def polygons(**over):
    fp, fx, kp, kx, q = layout(**over)
    return fp.polygons(dx=fx), kp.polygons(dx=kx)


def svg_paths(**over):
    fp, fx, kp, kx, q = layout(**over)
    return fp.svg(dx=fx), kp.svg(dx=kx)
