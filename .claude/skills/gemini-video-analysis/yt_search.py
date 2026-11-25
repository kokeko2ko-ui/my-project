#!/usr/bin/env python3
"""YouTube の検索結果ページから、動画の再生数・長さ・チャンネルの登録者数を集めて、
「登録者が少ないのに再生数が多い動画」を見つける。YouTube Data API のキーは要らない（公開ページを読むだけ）。
使い方:
  python3 yt_search.py "アニメ 料理 解説" "料理 コツ 科学" [--top 30] [--max-subs 100000] [--json out.json]
出力: 再生数が多い順の表（再生数 | 登録者 | 再生数÷登録者 | 長さ | 公開 | チャンネル | 題名 | URL）
注意: ページの作りが変わると動かなくなる。登録者数は「4.06万」などの概数。ボット確認で止まることがある。"""
import argparse, json, re, sys, urllib.parse, urllib.request

H = {'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'ja'}
def get(u): return urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=30).read().decode('utf8', 'ignore')
def idata(h):
    m = re.search(r'var ytInitialData = (\{.*?\});</script>', h, re.S)
    return json.loads(m.group(1)) if m else {}
def walk(o, key):
    if isinstance(o, dict):
        if key in o: yield o[key]
        for v in o.values(): yield from walk(v, key)
    elif isinstance(o, list):
        for v in o: yield from walk(v, key)
def subs(s):
    if not s: return None
    m = re.search(r'([\d.,]+)\s*(万|億)?', s.replace('チャンネル登録者数', '').replace('人', ''))
    if not m: return None
    n = float(m.group(1).replace(',', '')); u = m.group(2)
    return int(n * (10000 if u == '万' else 100000000 if u == '億' else 1))

ap = argparse.ArgumentParser()
ap.add_argument('queries', nargs='+'); ap.add_argument('--top', type=int, default=30)
ap.add_argument('--max-subs', type=int, help='この登録者数以下だけ表示'); ap.add_argument('--json')
a = ap.parse_args()
vids = {}
for q in a.queries:
    try: d = idata(get('https://www.youtube.com/results?search_query=' + urllib.parse.quote(q)))
    except Exception as e: print('検索に失敗:', q, e, file=sys.stderr); continue
    for v in walk(d, 'videoRenderer'):
        vc = v.get('viewCountText', {}).get('simpleText', '')
        cid = v.get('ownerText', {}).get('runs', [{}])[0].get('navigationEndpoint', {}).get('browseEndpoint', {}).get('browseId', '')
        vids[v['videoId']] = dict(id=v['videoId'], title=''.join(r['text'] for r in v['title']['runs']), channel=''.join(r['text'] for r in v.get('ownerText', {}).get('runs', [])),
            views=int(re.sub(r'[^\d]', '', vc) or 0), length=v.get('lengthText', {}).get('simpleText', ''), pub=v.get('publishedTimeText', {}).get('simpleText', ''), cid=cid)
ch = {}
for v in vids.values():
    cid = v['cid']
    if cid and cid not in ch:
        try:
            h = get('https://www.youtube.com/channel/' + cid + '?hl=ja')
            m = re.search(r'"subscriberCountText":\{"simpleText":"([^"]+)"', h) or re.search(r'チャンネル登録者数\s*([\d.,万億]+)\s*人', h) or re.search(r'"content":"([\d.,万]+人)"', h)
            ch[cid] = subs(m.group(1)) if m else None
        except Exception: ch[cid] = None
rows = []
for v in vids.values():
    s = ch.get(v['cid']); v['subs'] = s; v['ratio'] = round(v['views'] / s, 1) if s else None
    if a.max_subs and (s is None or s > a.max_subs): continue
    rows.append(v)
rows.sort(key=lambda v: -v['views'])
for v in rows[:a.top]:
    print(f"{v['views']:>10,} | {v['subs'] if v['subs'] is not None else '?':>9} | x{v['ratio'] if v['ratio'] is not None else '?':<7} | {v['length']:>7} | {v['pub']:<8} | {v['channel'][:16]} | {v['title'][:40]} | https://www.youtube.com/watch?v={v['id']}")
if a.json: json.dump(rows, open(a.json, 'w'), ensure_ascii=False, indent=1)
