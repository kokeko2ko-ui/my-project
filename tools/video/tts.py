"""ElevenLabs（eleven_v3・大谷ボイス）でナレーションを作り、MP3 と SRT を書き出す。

    python3 tools/video/tts.py video/<番号>_<テーマ>

入力：<制作ユニット>/voice.txt
  - 1行＝字幕1枚。空行は段落の区切り（長い台本はここで分けて読み上げ、段落の間に0.6秒の無音を入れる）
  - 行頭に [静かに、震える声で] のような感情の指示を書ける（声に出して読まれず、字幕からも消える）
出力：<制作ユニット>/source/narration.mp3 と narration.srt
  - 途中の結果は <制作ユニット>/tts_cache/ に残し、作り直しで同じ部分を再課金しない

認証：環境のネットワークシークレットが api.elevenlabs.io にキーを自動で付けるので、ここでは扱わない。
"""
import base64
import hashlib
import json
import os
import re
import subprocess
import sys

VOICE = 'O2ZUxxI6g8D1wlLKcxu1'   # 大谷ボイス
MODEL = 'eleven_v3'
CHUNK_CHARS = 1200               # 1回の読み上げに渡す最大文字数（段落の切れ目で区切る）
GAP = 0.6                        # 段落と段落のあいだに入れる無音（秒）
TAG = re.compile(r'\[[^\]]*\]')


def chunks(lines):
    """空行で区切った段落を、CHUNK_CHARS を超えない範囲でまとめる。"""
    paras, cur = [], []
    for ln in lines + ['']:
        if ln.strip():
            cur.append(ln.strip())
        elif cur:
            paras.append(cur)
            cur = []
    out, cur = [], []
    for p in paras:
        if cur and sum(len(x) for x in cur) + sum(len(x) for x in p) > CHUNK_CHARS:
            out.append(cur)
            cur = []
        cur = cur + p
    if cur:
        out.append(cur)
    return out


def speak(text, cache_dir):
    key = hashlib.sha256(f'{VOICE}|{MODEL}|{text}'.encode()).hexdigest()[:16]
    js, mp3 = os.path.join(cache_dir, key + '.json'), os.path.join(cache_dir, key + '.mp3')
    if not (os.path.exists(js) and os.path.exists(mp3)):
        body = json.dumps({'text': text, 'model_id': MODEL})
        r = subprocess.run(['curl', '-sS', '--fail-with-body', '-H', 'Content-Type: application/json', '-X', 'POST',
                            f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps'
                            '?output_format=mp3_44100_128', '-d', body], capture_output=True, text=True)
        if r.returncode != 0:
            raise SystemExit('ElevenLabs のエラー: ' + (r.stdout or r.stderr)[:500])
        d = json.loads(r.stdout)
        open(mp3, 'wb').write(base64.b64decode(d['audio_base64']))
        json.dump(d['alignment'], open(js, 'w', encoding='utf-8'), ensure_ascii=False)
        print('読み上げ', len(text), '文字', flush=True)
    return json.load(open(js, encoding='utf-8')), mp3


def duration(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
                         capture_output=True, text=True).stdout
    return float(out)


def srt_time(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'


def main(unit):
    lines = open(os.path.join(unit, 'voice.txt'), encoding='utf-8').read().split('\n')
    cache = os.path.join(unit, 'tts_cache')
    src = os.path.join(unit, 'source')
    os.makedirs(cache, exist_ok=True)
    os.makedirs(src, exist_ok=True)
    cues, parts, offset = [], [], 0.0
    for group in chunks(lines):
        text = '\n'.join(group)
        al, mp3 = speak(text, cache)
        starts, ends = al['character_start_times_seconds'], al['character_end_times_seconds']
        if ''.join(al['characters']) != text:
            raise SystemExit('読み上げ結果の文字が台本と一致しません（字幕の時刻を合わせられない）')
        pos = 0
        for ln in group:
            idx = [pos + i for i, c in enumerate(ln) if not c.isspace() and not any(
                m.start() <= i < m.end() for m in TAG.finditer(ln))]
            pos += len(ln) + 1
            shown = TAG.sub('', ln).strip()
            if idx and shown:
                cues.append([offset + starts[idx[0]], offset + ends[idx[-1]], shown])
        d = duration(mp3)
        parts.append(mp3)
        offset += d + GAP
    # 字幕どうしが重ならないよう、次の字幕の始まりで切る
    for a, b in zip(cues, cues[1:]):
        a[1] = min(max(a[1], a[0] + 0.3), b[0])
    # 段落の間に無音をはさんで1本の MP3 にする
    silence = os.path.join(cache, f'silence_{GAP}.mp3')
    if not os.path.exists(silence):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', str(GAP),
                        '-c:a', 'libmp3lame', '-b:a', '128k', silence], check=True)
    listing = os.path.join(cache, 'concat.txt')
    with open(listing, 'w', encoding='utf-8') as f:
        for i, p in enumerate(parts):
            if i:
                f.write(f"file '{os.path.abspath(silence)}'\n")
            f.write(f"file '{os.path.abspath(p)}'\n")
    out_mp3 = os.path.join(src, 'narration.mp3')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', listing,
                    '-c:a', 'libmp3lame', '-b:a', '192k', out_mp3], check=True)
    with open(os.path.join(src, 'narration.srt'), 'w', encoding='utf-8') as f:
        for n, (a, b, t) in enumerate(cues, 1):
            f.write(f'{n}\n{srt_time(a)} --> {srt_time(b)}\n{t}\n\n')
    print('MP3', round(duration(out_mp3), 2), '秒／字幕', len(cues), '行 →', src)


if __name__ == '__main__':
    main(sys.argv[1])
