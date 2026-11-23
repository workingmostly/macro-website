"""Round three: the green and blue pair (calories in the fork, protein in the knife) tried ten ways.

Run: python3 icon/source/macros.py OUT_DIR [name ...]
"""
import os
import sys
import time

from ideas import BLUE, draw, filled_glass, neon, tinted_glass
from looks import dark_tile, light_tile
from render import X, Y, lin, mix, save, smoothstep, tile_rim

BLACK = ('#29292d', '#0a0a0c')
NAVY = ('#22305a', '#080d1c')

# the fork's and the knife's settings for the filled glass; protein sits a little lower than calories
GREEN_AT, BLUE_AT = 560.0, 650.0


def pair(fork=None, knife=None):
    """Per-piece settings: the fork keeps the default green, the knife gets blue."""
    return [{'surface': GREEN_AT, **(fork or {})}, {'surface': BLUE_AT, **BLUE, **(knife or {})}]


def split_tile(left='#2fc35d', right='#147af5', mid=548.0, width=760.0, slant=0.35, shade=0.30):
    """Green behind the fork blending into blue behind the knife along a slight diagonal, a little darker toward
    the bottom. The blend is wide, so it reads as one gradient rather than two halves."""
    u = X + slant * (Y - 512)
    img = mix(lin(left), lin(right), smoothstep(mid - width / 2, mid + width / 2, u))
    img = img * (1.06 - shade * smoothstep(0, 1024, Y))[..., None]
    r = ((X - 512) / 760) ** 2 + ((Y + 40) / 560) ** 2
    return img + lin('#ffffff') * (0.07 * (1 - smoothstep(0, 1, r)))[..., None]


SMOKED = dict(glass_col='#0d0f12', milk=1.0, thick=3.0, edge_clear=0.35, glow=0.12, rim=1.3, stripe=0.6, core=0.18)

MACROS = {
    # name: (group, title, description, render)
    'black': ('Same idea, other settings', 'On black',
              'Round two\'s version: green calories in the fork, blue protein in the knife, on black.',
              lambda: draw(dark_tile(*BLACK), 'pair', filled_glass, per_piece=pair())),
    'midnight': ('Same idea, other settings', 'Midnight',
                 'The same pair on deep navy. The blue glow belongs there, and the green stands out more.',
                 lambda: draw(dark_tile(*NAVY), 'pair', filled_glass, per_piece=pair())),
    'smoked': ('Same idea, other settings', 'Smoked glass',
               'Black glass on a white tile, for a light icon that matches the website.',
               lambda: draw(light_tile('#ffffff', '#e4e6ea'), 'pair', filled_glass,
                            per_piece=pair(SMOKED, SMOKED))),
    'even': ('Same idea, other settings', 'Even',
             'Both filled to the same level. Calmer, and symmetrical.',
             lambda: draw(dark_tile(*BLACK), 'pair', filled_glass,
                          per_piece=pair(dict(surface=606), dict(surface=606)))),
    'full': ('Same idea, other settings', 'Fuller',
             'Calories up into the fork\'s head, protein up the blade. More colour, less white.',
             lambda: draw(dark_tile(*BLACK), 'pair', filled_glass, glow=0.2,
                          per_piece=pair(dict(surface=400), dict(surface=470)))),
    'crossed': ('Other forms', 'Crossed',
                'The pair crossed, the blue knife resting on the green fork.',
                lambda: draw(dark_tile(*BLACK), 'crossed', filled_glass,
                             per_piece=pair(dict(surface=640), dict(surface=680)))),
    'tilted': ('Other forms', 'Tilted',
               'Leaning into the corner, with both levels staying flat.',
               lambda: draw(dark_tile(*BLACK), 'tilted', filled_glass,
                            per_piece=pair(dict(surface=610), dict(surface=690)))),
    'neon': ('Other forms', 'Neon',
             'Two tubes: a green fork and a blue knife.',
             lambda: draw(dark_tile('#1f1f23', '#09090b'), 'pair', neon,
                          per_piece=[dict(), dict(col='#3d8cff', hot='#eef5ff')])),
    'glass': ('Other forms', 'Cast glass',
              'A green glass fork and a blue glass knife, each lit from inside.',
              lambda: draw(dark_tile(*BLACK), 'pair', tinted_glass,
                           per_piece=[dict(), dict(tint='#4f9dff', deep='#03173a')])),
    'frost': ('Other forms', 'Frost on green and blue',
              'White frosted cutlery on a tile that fades from green behind the fork to blue behind the knife.',
              lambda: draw(split_tile(), 'pair', filled_glass, surface=2000, glow=0, milk=0.95, refr=34, frost=10,
                           edge_clear=0.75, rim=1.0)),
}

BEZEL = dict(width=8, strength=0.5)
LIGHT_BEZEL = dict(width=9, strength=0.35)
LIGHT = {'smoked'}


if __name__ == '__main__':
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    for name in sys.argv[2:] or list(MACROS):
        t0 = time.time()
        img = MACROS[name][3]()
        save(img, os.path.join(out, f'{name}.png'))
        save(tile_rim(img, **(LIGHT_BEZEL if name in LIGHT else BEZEL)), os.path.join(out, f'{name}-rounded.png'),
             mask=True)
        print(f'{name}: {time.time() - t0:.0f}s', flush=True)
