"""v0.46 Encyclopédie: turns the renders into the files the app loads (public/encyclopedie/<id>.webp, 720 x 400, and
<id>-mini.webp, 160 x 160, for lists).

- Blender scenes (scenes.py, transparent PNG): laid on white, like the coach renders.
- Coach renders (renders.mjs): three instants side by side, or one close-up for a still.
- The thumbnail is a square around the subject (the key moment for a technique).

Usage: python3 scripts/encyclopedie/webp.py <scenes png dir> <renders png dir> [public/encyclopedie]
"""
import re
import sys
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[2]
W, H, MINI = 720, 400, 160
WHITE = (255, 255, 255)


def on_white(im):
    if im.mode != 'RGBA':
        return im.convert('RGB')
    bg = Image.new('RGBA', im.size, (*WHITE, 255))
    bg.alpha_composite(im)
    return bg.convert('RGB')


def subject_box(im):
    """bounds of what is not background (white) in an RGB picture"""
    diff = ImageChops.difference(im, Image.new('RGB', im.size, WHITE)).convert('L').point(lambda v: 255 if v > 10 else 0)
    return diff.getbbox() or (0, 0, *im.size)


def square_around(im, box, pad=1.08):
    x0, y0, x1, y1 = box
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    side = max(x1 - x0, y1 - y0) * pad
    crop = (int(cx - side / 2), int(cy - side / 2), int(cx + side / 2), int(cy + side / 2))
    out = Image.new('RGB', (crop[2] - crop[0], crop[3] - crop[1]), WHITE)
    src = (max(0, crop[0]), max(0, crop[1]), min(im.width, crop[2]), min(im.height, crop[3]))
    out.paste(im.crop(src), (src[0] - crop[0], src[1] - crop[1]))
    return out.resize((MINI, MINI), Image.LANCZOS)


def frame_subject(im, aspect=W / H, pad=1.25):
    """a close-up: the subject's bounds widened to the picture's ratio (used for stills, framed loosely by the Lab)"""
    x0, y0, x1, y1 = subject_box(im)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    hh = max(y1 - y0, (x1 - x0) / aspect) * pad
    ww = hh * aspect
    box = (int(cx - ww / 2), int(cy - hh / 2), int(cx + ww / 2), int(cy + hh / 2))
    out = Image.new('RGB', (box[2] - box[0], box[3] - box[1]), WHITE)
    src = (max(0, box[0]), max(0, box[1]), min(im.width, box[2]), min(im.height, box[3]))
    out.paste(im.crop(src), (src[0] - box[0], src[1] - box[1]))
    return out


def save(im, mini, dst, name):
    im.resize((W, H), Image.LANCZOS).save(dst / f'{name}.webp', 'WEBP', quality=82, method=6)
    mini.save(dst / f'{name}-mini.webp', 'WEBP', quality=82, method=6)


def main():
    scenes_dir, renders_dir = Path(sys.argv[1]), Path(sys.argv[2])
    dst = Path(sys.argv[3]) if len(sys.argv) > 3 else ROOT / 'public/encyclopedie'
    dst.mkdir(parents=True, exist_ok=True)
    src = (ROOT / 'src/domain/encyclopedia/images.ts').read_text()
    done = 0
    for img_id, scene in re.findall(r"\{ id: '([\w-]+)', scene: '([\w-]+)'", src):
        p = scenes_dir / f'{scene}.png'
        if not p.exists():
            print('MANQUE scène', scene)
            continue
        im = on_white(Image.open(p))
        save(im, square_around(im, subject_box(im)), dst, img_id)
        done += 1
    for img_id in re.findall(r"\{ id: '([\w-]+)', tech: '", src):
        still = renders_dir / f'{img_id}.png'
        frames = [renders_dir / f'{img_id}-{i}.png' for i in range(3)]
        if still.exists():
            im = frame_subject(on_white(Image.open(still)))
            save(im, square_around(im, subject_box(im)), dst, img_id)
        elif all(f.exists() for f in frames):
            ims = [on_white(Image.open(f)) for f in frames]
            strip = Image.new('RGB', (sum(i.width for i in ims), max(i.height for i in ims)), WHITE)
            x = 0
            for i in ims:
                strip.paste(i, (x, 0))
                x += i.width
            save(strip, square_around(ims[2], subject_box(ims[2])), dst, img_id)
        else:
            print('MANQUE rendu', img_id)
            continue
        done += 1
    print('fichiers', done)


if __name__ == '__main__':
    main()
