"""Put a look live: write the site's four icon files from its master and rounded PNGs, and swap the icon on slide 5
of the Instagram carousel.

From the repo root: python3 icon/source/site.py icon/macros/black
"""
import base64
import io
import re
import sys

from PIL import Image

PUBLIC = 'public'
SLIDE = 'instagram/05-join-the-beta.svg'


def resized(im, size):
    """High-quality downscale; RGBA goes through premultiplied alpha so the cut-out edge doesn't fringe."""
    if im.mode == 'RGBA':
        return im.convert('RGBa').resize((size, size), Image.LANCZOS).convert('RGBA')
    return im.resize((size, size), Image.LANCZOS)


def main(stem):
    master = Image.open(f'{stem}.png').convert('RGB')             # full-bleed: corners rounded by CSS or iOS
    rounded = Image.open(f'{stem}-rounded.png').convert('RGBA')   # cut to the icon shape
    resized(master, 160).save(f'{PUBLIC}/icon.png', optimize=True)
    resized(master, 180).save(f'{PUBLIC}/apple-touch-icon.png', optimize=True)
    resized(rounded, 64).save(f'{PUBLIC}/favicon.png', optimize=True)
    resized(rounded, 512).save(f'{PUBLIC}/icon-512.png', optimize=True)

    buf = io.BytesIO()
    resized(rounded, 512).save(buf, 'PNG', optimize=True)
    data = base64.b64encode(buf.getvalue()).decode('ascii')
    svg = open(SLIDE).read()
    svg, n = re.subn(r'(<g id="app-icon"><image [^>]*?xlink:href="data:image/png;base64,)[A-Za-z0-9+/=]+',
                     lambda m: m.group(1) + data, svg, count=1)
    if n != 1:
        sys.exit(f'could not find the app icon on {SLIDE}')
    open(SLIDE, 'w').write(svg)
    print(f'wrote public/ icons and {SLIDE} from {stem}')


if __name__ == '__main__':
    main(sys.argv[1])
