#!/usr/bin/env python3
"""NASA の画像ライブラリ（images.nasa.gov）から画像を取ってくる。
使い方:
  python3 tools/fetch_nasa.py search "europa ice"          # 候補を表示（nasa_id・題名・撮影/作成元）
  python3 tools/fetch_nasa.py get $EP PIA19048 PIA17737 ... # $EP/assets/<nasa_id>.jpg に保存し、$EP/assets/credits.json に出典を追記
NASA の画像は原則として著作権の対象外だが、NASA のロゴ・人物の写真・他機関の画像（ESA など）は条件がある。
credits.json の center / secondary_creator / description を見て、説明欄に出典を書くこと。"""
import json, os, sys, urllib.parse, urllib.request

API = 'https://images-api.nasa.gov'
def get(url):
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'science-mystery-tool'}), timeout=60))

def search(q, n=12):
    d = get(f'{API}/search?media_type=image&q={urllib.parse.quote(q)}')
    for it in d['collection']['items'][:n]:
        m = it['data'][0]
        print(f"{m['nasa_id']:<28} {m['title'][:60]:<60} {m.get('center','')} {m.get('date_created','')[:10]}")

def fetch(ep, ids):
    out = os.path.join(ep, 'assets'); os.makedirs(out, exist_ok=True)
    cf = os.path.join(out, 'credits.json')
    credits = json.load(open(cf)) if os.path.exists(cf) else {}
    for nid in ids:
        files = [x['href'] for x in get(f'{API}/asset/{urllib.parse.quote(nid)}')['collection']['items']]
        jpgs = [f for f in files if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        pick = next((f for k in ('~large', '~orig', '~medium') for f in jpgs if k in f), jpgs[0] if jpgs else None)
        if not pick: print('画像なし', nid); continue
        pick = pick.replace('http://', 'https://').replace(' ', '%20')
        ext = os.path.splitext(pick)[1].lower().replace('.jpeg', '.jpg')
        dst = os.path.join(out, nid + ext)
        open(dst, 'wb').write(urllib.request.urlopen(pick, timeout=120).read())
        m = get(f'{API}/search?nasa_id={urllib.parse.quote(nid)}')['collection']['items'][0]['data'][0]
        credits[nid] = {'file': os.path.basename(dst), 'title': m.get('title'), 'center': m.get('center'),
                        'secondary_creator': m.get('secondary_creator'), 'date': m.get('date_created', '')[:10],
                        'url': f'https://images.nasa.gov/details/{nid}', 'description': (m.get('description') or '')[:600]}
        print('保存', dst, os.path.getsize(dst) // 1024, 'KB')
    json.dump(credits, open(cf, 'w'), ensure_ascii=False, indent=1)

if __name__ == '__main__':
    if len(sys.argv) >= 3 and sys.argv[1] == 'search': search(' '.join(sys.argv[2:]))
    elif len(sys.argv) >= 4 and sys.argv[1] == 'get': fetch(sys.argv[2], sys.argv[3:])
    else: print(__doc__)
