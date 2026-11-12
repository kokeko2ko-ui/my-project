"""パソコンで書き出す前の準備（Windows / Mac / Linux 共通）。

    python tools/video/setup.py video/<番号>_<テーマ>

- design/urls.tsv の画像を images/ に取得する（既にあるものは飛ばす）
- 字幕用フォント（Noto Sans JP Bold）を ../fonts/ に取得する
- source/ に MP3 と SRT が置かれているか確認する
"""
import os
import urllib.request

import sys

UNIT = os.path.abspath(sys.argv[1])
HERE = os.path.join(UNIT, 'design')
FONT_URL = 'https://fonts.gstatic.com/s/notosansjp/v57/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFPYk75s.ttf'


def get(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return False
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as r, open(path, 'wb') as f:
        f.write(r.read())
    return True


os.makedirs(os.path.join(UNIT, 'images'), exist_ok=True)
n = 0
for line in open(os.path.join(HERE, 'urls.tsv'), encoding='utf-8'):
    num, url = line.strip().split('\t')
    n += get(url, os.path.join(UNIT, 'images', f'S{int(num):02d}.png'))
print('画像：新しく取得', n, '枚／合計', len(os.listdir(os.path.join(UNIT, 'images'))), '枚')

fonts = os.path.join(UNIT, '..', 'fonts')
os.makedirs(fonts, exist_ok=True)
get(FONT_URL, os.path.join(fonts, 'NotoSansJP-Bold.ttf'))
print('フォント：OK')

src = os.path.join(UNIT, 'source')
os.makedirs(src, exist_ok=True)
for name in ('narration.mp3', 'narration.srt'):  # tools/video/tts.py が作る
    print(name, 'あり' if os.path.exists(os.path.join(src, name)) else 'なし ← source フォルダに置いてください')
