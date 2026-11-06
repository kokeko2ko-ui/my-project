#!/usr/bin/env python3
"""伝票写真を読める JPEG に変換する。

iPhone の HEIC/HEIF、向き情報（EXIF）付きの写真、大きすぎる写真を
「正しい向き・長辺 2000px 以内の JPEG」にそろえる。

使い方:
  python3 -I convert_photo.py <入力> <出力.jpg>

<入力> は画像ファイル（.HEIC / .JPG / .PNG など）か、
Google Drive の download_file_content の結果を保存した JSON
（{"content": "<base64>", ...}）のどちらでもよい。

必要なもの: pip install pillow pillow-heif
"""
import base64
import io
import json
import sys

from PIL import Image, ImageOps

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError:
    pillow_heif = None

MAX_SIDE = 2000


def load_bytes(path):
    with open(path, 'rb') as f:
        data = f.read()
    if data[:1] == b'{':
        return base64.b64decode(json.loads(data)['content'])
    return data


def main(src, dst):
    data = load_bytes(src)
    is_heic = data[4:12] in (b'ftypheic', b'ftypheix', b'ftypmif1', b'ftyphevc', b'ftypmsf1')
    if is_heic and pillow_heif is None:
        sys.exit('HEIC 写真です。先に pip install pillow-heif を実行してください。')
    im = Image.open(io.BytesIO(data))
    im = ImageOps.exif_transpose(im)
    if im.mode != 'RGB':
        im = im.convert('RGB')
    im.thumbnail((MAX_SIDE, MAX_SIDE))
    im.save(dst, 'JPEG', quality=90)
    print(f'{dst} を作成（{im.width}x{im.height}、元は {"HEIC" if is_heic else im.format or "画像"}）')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
