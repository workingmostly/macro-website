"""Write every icon file. From the repo root: python3 icon/source/export.py icon [look ...]

For each look: NAME.png is the 1024 x 1024 full-bleed master (no transparency, no rounded corners: what Xcode and
App Store Connect want; iOS applies the mask). NAME-rounded.png is the same art cut to the icon shape with the glass
bezel, for previews, the website and social posts. cutlery.svg is the flat vector glyph.
"""
import os
import sys
import time

import looks
import shapes
from render import save, tile_rim


def write_svg(path):
    fork, knife = shapes.svg_paths()
    with open(path, 'w') as fh:
        fh.write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">\n'
                 f'  <path fill="#0a0a0a" d="{fork}"/>\n'
                 f'  <path fill="#0a0a0a" d="{knife}"/>\n'
                 '</svg>\n')


if __name__ == '__main__':
    out = sys.argv[1]
    names = sys.argv[2:] or list(looks.LOOKS)
    os.makedirs(out, exist_ok=True)
    write_svg(os.path.join(out, 'cutlery.svg'))
    for name in names:
        t0 = time.time()
        fn, bezel = looks.LOOKS[name]
        img = fn()
        save(img, os.path.join(out, f'{name}.png'))
        save(tile_rim(img, **bezel), os.path.join(out, f'{name}-rounded.png'), mask=True)
        print(f'{name}: {time.time() - t0:.0f}s')
