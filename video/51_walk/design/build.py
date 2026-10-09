"""第51作「32キロの、初出勤」の動画を組み立てる。

    python3 -I design/build.py check            素材の検査（数・連番・重複・字幕との対応）
    python3 -I design/build.py preview          確認用（960x540・軽い画質）を build/ に書き出す
    python3 -I design/build.py final            本番（1920x1080）を build/ に書き出す
    python3 -I design/build.py frames <mp4>     代表フレームを build/frames/ に書き出す

正本は source/ の MP3 と SRT。場面の区切りは design/scenes.tsv（字幕番号の範囲）で決め、
各場面の長さは実際の字幕時刻から計算する。
"""
import hashlib
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
UNIT = os.path.dirname(HERE)
SRC_MP3 = os.path.join(UNIT, 'source', '32キロの初出勤.mp3')
SRC_SRT = os.path.join(UNIT, 'source', '32キロの初出勤.srt')
FONTS = os.path.join(UNIT, '..', 'fonts')
FPS = 30
XF = 1.2  # クロスフェードの秒数（黒をはさまない）


def ts(s):
    h, m, r = s.split(':')
    sec, ms = r.split(',')
    return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000


def load_srt():
    blocks = open(SRC_SRT, encoding='utf-8-sig').read().strip().split('\n\n')
    cues = []
    for b in blocks:
        lines = b.split('\n')
        a, z = lines[1].split(' --> ')
        cues.append((int(lines[0]), ts(a), ts(z), ''.join(lines[2:])))
    return cues


def load_scenes():
    rows = []
    for line in open(os.path.join(HERE, 'scenes.tsv'), encoding='utf-8'):
        if line.startswith('#') or not line.strip():
            continue
        sid, a, z, _ = line.rstrip('\n').split('\t')
        rows.append((sid, int(a), int(z)))
    return rows


def duration(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                          '-of', 'csv=p=0', path], capture_output=True, text=True).stdout
    return float(out.strip())


def timeline():
    cues, scenes = load_srt(), load_scenes()
    total = duration(SRC_MP3)
    starts = [0.0] + [cues[a - 1][1] for _, a, _ in scenes[1:]]
    ends = starts[1:] + [total]
    return [(sid, s, e) for (sid, _, _), s, e in zip(scenes, starts, ends)], cues, total


# ── 字幕：自然な区切りで最大二行、下中央 ──
BREAKS = ['——', '。', '、', '」', '「', '…']


def wrap(text, width=27):
    """自然な区切り（読点・ダッシュ・かぎ括弧）でだけ折り返す。最大二行。"""
    if len(text) <= width:
        return [text]
    natural, other = [], []
    for i in range(4, len(text) - 3):
        left, right = text[:i], text[i:]
        if len(left) > width or len(right) > width or left.endswith('「') or right[0] in '、。」…' or right.startswith('——'):
            continue
        nat = any(left.endswith(b) for b in BREAKS if b != '「') or right.startswith('「')
        (natural if nat else other).append((abs(len(left) - len(right)), i))
    best = min(natural or other or [(0, len(text) // 2)])[1]
    return [text[:best], text[best:]]


def ass_time(t):
    cs = int(round(t * 100))
    h, cs = divmod(cs, 360000)
    m, cs = divmod(cs, 6000)
    s, cs = divmod(cs, 100)
    return f'{h}:{m:02d}:{s:02d}.{cs:02d}'


def write_ass(path, w, h):
    cues = load_srt()
    k = h / 1080
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {w}
PlayResY: {h}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Noto Sans JP,{round(56*k)},&H00FFFFFF,&H00FFFFFF,&H00101010,&H80000000,-1,0,0,0,100,100,{round(1*k)},0,1,{round(4*k)},{round(2*k)},2,{round(80*k)},{round(80*k)},{round(64*k)},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []
    for _, a, z, text in cues:
        lines.append(f'Dialogue: 0,{ass_time(a)},{ass_time(z)},Main,,0,0,0,,' + r'\N'.join(wrap(text)))
    with open(path, 'w', encoding='utf-8') as f:
        f.write(head + '\n'.join(lines) + '\n')


# ── 映像：穏やかなズーム／パン ──
MOVES = ['in', 'right', 'out', 'left', 'in', 'up', 'out', 'right', 'in', 'left', 'out', 'down']


def zoompan(move, frames, w, h):
    n = max(frames - 1, 1)
    p = f'(on/{n})'
    if move == 'in':
        z, x, y = f'1.0+0.08*{p}', 'iw/2-(iw/zoom/2)', 'ih/2-(ih/zoom/2)'
    elif move == 'out':
        z, x, y = f'1.08-0.08*{p}', 'iw/2-(iw/zoom/2)', 'ih/2-(ih/zoom/2)'
    elif move == 'right':
        z, x, y = '1.08', f'(iw-iw/zoom)*{p}', 'ih/2-(ih/zoom/2)'
    elif move == 'left':
        z, x, y = '1.08', f'(iw-iw/zoom)*(1-{p})', 'ih/2-(ih/zoom/2)'
    elif move == 'up':
        z, x, y = '1.08', 'iw/2-(iw/zoom/2)', f'(ih-ih/zoom)*(1-{p})'
    else:  # down
        z, x, y = '1.08', 'iw/2-(iw/zoom/2)', f'(ih-ih/zoom)*{p}'
    return (f"scale={w*2}:{h*2}:force_original_aspect_ratio=increase,crop={w*2}:{h*2},"
            f"zoompan=z='{z}':x='{x}':y='{y}':d={frames}:s={w}x{h}:fps={FPS},setsar=1,format=yuv420p")


def render(mode):
    w, h, crf, preset = (960, 540, 30, 'veryfast') if mode == 'preview' else (1920, 1080, 18, 'medium')
    tl, _, total = timeline()
    build = os.path.join(UNIT, 'build')
    clips = os.path.join(build, f'clips_{mode}')
    os.makedirs(clips, exist_ok=True)
    # 1) 場面ごとのクリップ（最後以外はクロスフェード分だけ長く）
    paths = []
    for i, (sid, s, e) in enumerate(tl):
        length = (e - s) + (XF if i < len(tl) - 1 else 0)
        frames = int(round(length * FPS))
        out = os.path.join(clips, f'{sid}.mp4')
        paths.append((out, frames / FPS))
        if os.path.exists(out) and abs(duration(out) - frames / FPS) < 0.05:
            continue
        img = os.path.join(UNIT, 'images', f'{sid}.png')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-loop', '1', '-framerate', str(FPS), '-i', img,
                        '-vf', zoompan(MOVES[i % len(MOVES)], frames, w, h), '-frames:v', str(frames),
                        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', out], check=True)
        print('clip', sid, round(length, 2))
    # 2) クロスフェードでつなぐ → 字幕 → 音声
    ass = os.path.join(build, f'subs_{mode}.ass')
    write_ass(ass, w, h)
    args = ['ffmpeg', '-v', 'error', '-y']
    for p, _ in paths:
        args += ['-i', p]
    args += ['-i', SRC_MP3]
    fc, prev, acc = [], '[0:v]', 0.0
    for i in range(1, len(paths)):
        acc += paths[i - 1][1] - (XF if i > 1 else 0)
        offset = acc - XF
        lab = f'[v{i}]'
        fc.append(f'{prev}[{i}:v]xfade=transition=fade:duration={XF}:offset={offset:.3f}{lab}')
        prev = lab
    esc = ass.replace(':', r'\:')
    fc.append(f"{prev}subtitles='{esc}':fontsdir='{FONTS}'[vout]")
    out = os.path.join(build, f'第51作_32キロの初出勤_{mode}.mp4')
    args += ['-filter_complex', ';'.join(fc), '-map', '[vout]', '-map', f'{len(paths)}:a',
             '-c:v', 'libx264', '-preset', preset, '-crf', str(crf), '-pix_fmt', 'yuv420p',
             '-c:a', 'aac', '-b:a', '192k', '-t', f'{total:.3f}', '-movflags', '+faststart', out]
    subprocess.run(args, check=True)
    print('written', out, round(duration(out), 2), 'audio', round(total, 2))


def check():
    tl, cues, total = timeline()
    ids = [sid for sid, _, _ in tl]
    expect = [f'S{i:02d}' for i in range(1, len(ids) + 1)]
    imgs = sorted(f[:-4] for f in os.listdir(os.path.join(UNIT, 'images')) if f.endswith('.png'))
    digests = {}
    for f in imgs:
        d = hashlib.sha256(open(os.path.join(UNIT, 'images', f + '.png'), 'rb').read()).hexdigest()
        digests.setdefault(d, []).append(f)
    print('場面数', len(ids), '／画像数', len(imgs), '／字幕', len(cues), '行／音声', round(total, 2), '秒')
    print('連番', 'OK' if ids == expect else f'NG {ids}')
    print('画像の過不足', sorted(set(ids) - set(imgs)) or 'なし', sorted(set(imgs) - set(ids)) or '')
    print('重複画像', [v for v in digests.values() if len(v) > 1] or 'なし')
    print('字幕の最後', round(cues[-1][2], 2), '秒（音声との差', round(total - cues[-1][2], 2), '秒）')
    long_ = [(n, t) for n, _, _, t in cues if any(len(x) > 27 for x in wrap(t)) or len(wrap(t)) > 2]
    print('二行に収まらない字幕', long_ or 'なし')
    print('最短の場面', min(round(e - s, 1) for _, s, e in tl), '秒／最長', max(round(e - s, 1) for _, s, e in tl), '秒')


def frames(mp4):
    tl, _, _ = timeline()
    d = os.path.join(UNIT, 'build', 'frames')
    os.makedirs(d, exist_ok=True)
    for sid, s, e in tl:
        t = (s + e) / 2
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.2f}', '-i', mp4, '-frames:v', '1',
                        os.path.join(d, f'{sid}.jpg')], check=True)
    print('frames ->', d)


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'check':
        check()
    elif cmd in ('preview', 'final'):
        render(cmd)
    elif cmd == 'frames':
        frames(sys.argv[2])
