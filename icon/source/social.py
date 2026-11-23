"""Full-square PNGs of a look for social media: no rounded corners, the background runs right to the edges.
Profile pictures that get cropped to a circle keep the whole fork and knife.

From the repo root: python3 icon/source/social.py macros black
(the round is macros, ideas or looks; then the look's name)
"""
import os
import sys

from render import save

SIZES = (1080, 2048)   # Instagram's square, and a large one to scale down for anything else
OUT = 'icon/social'


def render(round_name, look):
    if round_name == 'macros':
        import macros
        return macros.MACROS[look][3]()
    if round_name == 'ideas':
        import ideas
        return ideas.IDEAS[look][3]()
    import looks
    return looks.LOOKS[look][0]()


if __name__ == '__main__':
    img = render(sys.argv[1], sys.argv[2])
    os.makedirs(OUT, exist_ok=True)
    for size in SIZES:
        path = os.path.join(OUT, f'macro-icon-{size}.png')
        save(img, path, size=size)
        print('wrote', path)
