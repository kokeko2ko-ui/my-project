#!/usr/bin/env python3
"""作ったあとの自動確認。使い方: python3 tools/verify.py episodes/<回の名前>
PASS / WARN / FAIL を出す。FAIL があると終了コード1。"""
import json, os, re, subprocess, sys

ep = sys.argv[1] if len(sys.argv) > 1 else 'episodes/apple_jobs'
res = []
def add(level, msg): res.append((level, msg))
def exists(*p): return os.path.exists(os.path.join(ep, *p))
def load(*p): return json.load(open(os.path.join(ep, *p), encoding='utf-8'))

KNOWN = {'title','talk','duo','list','compare','bars','news','keyword','coins','grid','imac','outro','ingredients','step','pan','quiz','food','chat','wok'}
REQUIRED = {'title':['line1','line2'],'talk':['who','bubble'],'duo':['left','right'],'list':['title','items'],'compare':['left','right'],
            'bars':['values','caption'],'news':['headline'],'keyword':['term','meaning'],'coins':['src','to','note'],'grid':['cells'],'imac':[],
            'outro':['text','next'],'ingredients':['items'],'step':['n','text'],'pan':['label'],'quiz':['q','choices','answer'],'food':[],'chat':[]}

# --- ファイル
for f in ['input/script.txt', 'timings.json', 'storyboard.json', 'narration.mp3', 'envelope.json']:
    if not exists(f): add('FAIL', f'ファイルがありません: {f}')
if not exists('input/script_reading.txt'): add('WARN', '読み用の台本（input/script_reading.txt）がありません。読み間違いの危険があります')
if any(l == 'FAIL' for l, _ in res):
    for l, m in res: print(l, m)
    sys.exit(1)

tm = load('timings.json'); sb = load('storyboard.json')
sents = tm['sentences']; cuts = sb['cuts']

# --- 台本（読み用と字幕用）
def split(x):
    out, cur = [], ''
    for i, ch in enumerate(x):
        if ch == '\n':
            if cur.strip(): out.append(cur.strip())
            cur = ''; continue
        cur += ch
        nx = x[i + 1] if i + 1 < len(x) else ''
        if ch in '。！？' and nx not in '」』）': out.append(cur.strip()); cur = ''
    if cur.strip(): out.append(cur.strip())
    return out
spk_names = list(load('voices.json')['speakers']) if exists('voices.json') else []
def strip_spk(x):
    if not spk_names: return x
    pat = re.compile('^(' + '|'.join(map(re.escape, spk_names)) + r')[：:]\s*')
    return '\n'.join(pat.sub('', l.strip()) for l in x.splitlines() if l.strip())
disp = split(strip_spk(open(os.path.join(ep, 'input/script.txt'), encoding='utf-8').read().strip()))
if len(disp) != len(sents): add('FAIL', f'字幕用の文の数({len(disp)})と音声の文の数({len(sents)})が違います')
else: add('PASS', f'文の数が一致（{len(sents)}文）')
if exists('input/script_reading.txt'):
    rd = strip_spk(open(os.path.join(ep, 'input/script_reading.txt'), encoding='utf-8').read())
    if len(split(rd.strip())) != len(disp): add('FAIL', '読み用の台本と字幕用の台本の文の数が違います')
    bad = [rd[max(0, m.start() - 3):m.end() + 3].replace('\n', ' ') for m in re.finditer(r'[0-9０-９〇一二三四五六七八九十百千万]+', rd)]
    if bad: add('WARN', f'読み用の台本に数字・漢数字が残っています。読み間違えやすいか確認（四角・一方などは普通は大丈夫）: {bad[:10]}')
    else: add('PASS', '読み用の台本に数字・漢数字は残っていません')
long_s = [s['i'] for s in sents if len(s['text']) > 70]
if long_s: add('WARN', f'字幕が長い文（70字超）: 文{long_s[:8]}')
gaps = [sents[i]['start'] - sents[i-1]['end'] for i in range(1, len(sents))]
if gaps and max(gaps) > 1.5: add('WARN', f'文のあいだに長い無音があります（最大{max(gaps):.1f}秒）')

# --- 絵コンテ
last = -1; ok = True
for i, c in enumerate(cuts):
    if c['type'] not in KNOWN: add('FAIL', f'カット{i}: 知らない型 {c["type"]}'); ok = False
    for k in REQUIRED.get(c['type'], []):
        if k not in c: add('FAIL', f'カット{i}({c["type"]}): 必要な項目 {k} がありません'); ok = False
    if not (0 <= c['s'] < len(sents)): add('FAIL', f'カット{i}: 文の番号 {c["s"]} が範囲外'); ok = False
    elif c['s'] <= last and i > 0: add('FAIL', f'カット{i}: 文の番号が前より小さい/同じ'); ok = False
    last = c['s']
if ok: add('PASS', f'絵コンテの形式OK（{len(cuts)}カット）')
if cuts and cuts[0]['type'] not in ('title', 'food', 'chat'): add('WARN', '1カット目が title ではありません')
if cuts and cuts[-1]['type'] != 'outro' and not cuts[-1].get('cta'): add('WARN', '最後のカットが outro（または cta つき）ではありません')
for i in range(2, len(cuts)):
    if cuts[i]['type'] == cuts[i-1]['type'] == cuts[i-2]['type'] and cuts[i]['type'] != 'wok': add('WARN', f'同じ型が3回続いています: カット{i-2}〜{i}（{cuts[i]["type"]}）')
durs = []
for i, c in enumerate(cuts):
    st = 0 if i == 0 else sents[c['s']]['start']
    en = tm['duration'] if i == len(cuts) - 1 else sents[cuts[i+1]['s']]['start']
    durs.append(en - st)
if durs:
    short = [i for i, d in enumerate(durs) if d < 1.8]; longc = [i for i, d in enumerate(durs) if d > 14]
    if short: add('WARN', f'短すぎるカット（1.8秒未満）: {short[:8]}')
    if longc: add('WARN', f'長すぎるカット（14秒超）: {longc[:8]}')
    add('PASS', f'カットの長さ 平均{sum(durs)/len(durs):.1f}秒（最短{min(durs):.1f}・最長{max(durs):.1f}）')
if 'cast' not in sb: add('WARN', '絵コンテに cast（配役）がありません')

# --- 音声
def ff(args):
    return subprocess.run(args, capture_output=True, text=True)
d = ff(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0', os.path.join(ep,'narration.mp3')]).stdout.strip()
if d and abs(float(d) - tm['duration']) > 1.5: add('WARN', f'音声の長さ({float(d):.1f}s)とタイミングの長さ({tm["duration"]:.1f}s)がずれています')
v = ff(['ffmpeg','-hide_banner','-i',os.path.join(ep,'narration.mp3'),'-af','volumedetect','-vn','-f','null','-']).stderr
m = re.search(r'mean_volume: (-?[\d.]+) dB', v)
if m:
    mv = float(m.group(1))
    add('PASS' if mv > -32 else 'FAIL', f'音声の平均音量 {mv} dB' + ('' if mv > -32 else '（小さすぎます）'))

# --- 動画
vp = os.path.join(ep, 'out/video.mp4')
if os.path.exists(vp):
    info = ff(['ffprobe','-v','error','-show_entries','stream=codec_type,width,height,r_frame_rate,duration','-of','json',vp]).stdout
    st = json.loads(info)['streams']
    vs = [s for s in st if s['codec_type']=='video']; as_ = [s for s in st if s['codec_type']=='audio']
    if not vs or (vs[0]['width'], vs[0]['height']) != (1920, 1080): add('FAIL', '映像が 1920×1080 ではありません')
    else: add('PASS', '映像 1920×1080')
    if not as_: add('FAIL', '動画に音声がありません')
    else:
        vv = ff(['ffmpeg','-hide_banner','-i',vp,'-af','volumedetect','-vn','-f','null','-']).stderr
        mm = re.search(r'mean_volume: (-?[\d.]+) dB', vv)
        add('PASS' if mm and float(mm.group(1)) > -32 else 'FAIL', f'動画の音量 {mm.group(1) if mm else "?"} dB')
    dur = float(vs[0].get('duration', 0)) if vs else 0
    exp = tm['duration'] + 2
    add('PASS' if abs(dur - exp) < 1.5 else 'WARN', f'動画の長さ {dur:.1f}s（期待 {exp:.1f}s）')
else:
    add('WARN', '動画（out/video.mp4）はまだありません（書き出し前のチェックです）')

# --- 静止画
sd = os.path.join(ep, 'out/stills')
if os.path.isdir(sd):
    missing = [i for i in range(len(cuts)) if not os.path.exists(os.path.join(sd, f'cut{i:02d}.png'))]
    add('PASS' if not missing else 'WARN', '全カットの静止画あり' if not missing else f'静止画がないカット: {missing[:10]}')
else:
    add('WARN', '静止画がまだありません（node tools/render.js stills で作って、目で確認してください）')

icon = {'PASS': '✅', 'WARN': '⚠️ ', 'FAIL': '❌'}
for l, m in res: print(icon[l], m)
n = {k: sum(1 for l, _ in res if l == k) for k in icon}
print(f"\n結果: PASS {n['PASS']} / WARN {n['WARN']} / FAIL {n['FAIL']}")
sys.exit(1 if n['FAIL'] else 0)
