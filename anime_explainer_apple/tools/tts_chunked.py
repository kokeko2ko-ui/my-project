#!/usr/bin/env python3
"""読み用の台本を段落ごとに分けて ElevenLabs で音声にし、1本につなぐ。
出力: <回のフォルダ>/narration.mp3 と input/tts_raw.json（audio_base64 + 文字ごとの時刻）。
長い文を1回で頼むと失敗することがあるため、約450字ずつに分ける。前後の文を渡して声のつながりを保つ。"""
import base64, json, os, subprocess, sys, tempfile, time, urllib.request

VOICE = os.environ.get('VOICE_ID', '80H5qqdq3bIO8OjFE6ue')   # Yukari
MODEL = os.environ.get('TTS_MODEL', 'eleven_v4')
EP = os.environ.get('EP', 'episodes/apple_jobs')
os.chdir(EP)   # 回のフォルダの中で動かす
SRC = 'input/script_reading.txt'
MAXC = 450


# ---------------- 掛け合いモード（voices.json があるとき） ----------------
# 台本の各行が「話者：セリフ」。話者ごとの声で読み、速さをそろえ、1本につなぐ。
if os.path.exists('voices.json'):
    import re
    from concurrent.futures import ThreadPoolExecutor
    cfg = json.load(open('voices.json', encoding='utf-8'))
    spk = cfg['speakers']; ATEMPO = float(cfg.get('atempo', 1.0)); GAP = float(cfg.get('gap', 0.15)); MODEL_M = cfg.get('model', MODEL)
    pat = re.compile(r'^(' + '|'.join(map(re.escape, spk)) + r')[：:]\s*(.*)$')
    turns = []
    for line in open(SRC, encoding='utf-8').read().strip().splitlines():
        if not line.strip(): continue
        m = pat.match(line.strip())
        if m: turns.append({'speaker': m.group(1), 'text': m.group(2).strip()})
        elif turns: turns[-1]['text'] += line.strip()
        else: raise SystemExit(f'話者がわかりません: {line[:20]}')
    print('turns:', len(turns))

    def call_t(body, vid):
        req = urllib.request.Request(
            f'https://api.elevenlabs.io/v1/text-to-speech/{vid}/with-timestamps?output_format=mp3_44100_128',
            data=json.dumps(body).encode(), headers={'xi-api-key': 'dummy', 'Content-Type': 'application/json'})
        last = None
        for i in range(6):
            try: return json.load(urllib.request.urlopen(req, timeout=300))
            except Exception as e: last = e; time.sleep(3 * (i + 1))
        raise SystemExit(f'失敗: {last}')

    tmp = tempfile.mkdtemp()
    def work(i):
        t = turns[i]
        d = call_t({'text': t['text'], 'model_id': MODEL_M, 'language_code': 'ja'}, spk[t['speaker']]['voice_id'])
        mp3 = os.path.join(tmp, f't{i}.mp3'); wav = os.path.join(tmp, f't{i}.wav')
        open(mp3, 'wb').write(base64.b64decode(d['audio_base64']))
        # 速さをそろえて（音程は変えない）、音量を -22dB 付近にそろえる
        raw = os.path.join(tmp, f'r{i}.wav')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp3, '-ac', '1', '-ar', '44100', '-af', f'atempo={ATEMPO}', raw], check=True)
        vd = subprocess.run(['ffmpeg', '-hide_banner', '-i', raw, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
        mv = re.search(r'mean_volume: (-?[\d.]+) dB', vd); gain = max(-8, min(8, -22 - float(mv.group(1)))) if mv else 0
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', f'volume={gain}dB', wav], check=True)
        dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav]))
        al = d.get('alignment') or d.get('normalized_alignment')
        assert ''.join(al['characters']) == t['text'], f'turn {i}: 文字がずれています'
        return i, wav, dur, al
    with ThreadPoolExecutor(4) as ex: results = sorted(ex.map(work, range(len(turns))), key=lambda r: r[0])

    sil = os.path.join(tmp, 'sil.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', str(GAP), sil], check=True)
    chars, starts, ends, parts = [], [], [], []; offset = 0.0
    for i, wav, dur, al in results:
        chars += al['characters']
        starts += [x / ATEMPO + offset for x in al['character_start_times_seconds']]
        ends += [x / ATEMPO + offset for x in al['character_end_times_seconds']]
        chars.append('\n'); starts.append(offset + dur); ends.append(offset + dur)
        parts += [wav, sil]; offset += dur + GAP
        print(f'turn {i} {turns[i]["speaker"]}: {dur:.1f}s')
    lst = os.path.join(tmp, 'list.txt')
    open(lst, 'w').write(''.join(f"file '{w}'\n" for w in parts))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c:a', 'libmp3lame', '-b:a', '128k', 'narration.mp3'], check=True)
    json.dump({'audio_base64': base64.b64encode(open('narration.mp3', 'rb').read()).decode(),
               'alignment': {'characters': chars, 'character_start_times_seconds': starts, 'character_end_times_seconds': ends},
               'turns': [{'speaker': t['speaker']} for t in turns]}, open('input/tts_raw.json', 'w'))
    print('合計', round(offset, 1), '秒')
    sys.exit(0)

text = open(SRC, encoding='utf-8').read().strip()
paras = text.split('\n\n')
chunks, cur = [], []
for p in paras:
    if cur and len('\n\n'.join(cur + [p])) > MAXC:
        chunks.append(cur); cur = []
    cur.append(p)
if cur: chunks.append(cur)
ctexts = ['\n\n'.join(c) + ('\n\n' if i < len(chunks) - 1 else '') for i, c in enumerate(chunks)]
assert ''.join(ctexts) == text, 'chunk join mismatch'
print('chunks:', [len(t) for t in ctexts])

def call(body):
    req = urllib.request.Request(
        f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128',
        data=json.dumps(body).encode(), headers={'xi-api-key': 'dummy', 'Content-Type': 'application/json'})
    last = None
    for i in range(6):
        try:
            return json.load(urllib.request.urlopen(req, timeout=300))
        except Exception as e:
            last = e; time.sleep(3 * (i + 1))
    raise SystemExit(f'失敗: {last}')

tmp = tempfile.mkdtemp()
chars, starts, ends, wavs = [], [], [], []
offset = 0.0
for i, t in enumerate(ctexts):
    body = {'text': t, 'model_id': MODEL, 'language_code': 'ja'}
    if i > 0: body['previous_text'] = ctexts[i - 1][-200:]
    if i < len(ctexts) - 1: body['next_text'] = ctexts[i + 1][:200]
    d = call(body)
    mp3 = os.path.join(tmp, f'c{i}.mp3'); wav = os.path.join(tmp, f'c{i}.wav')
    open(mp3, 'wb').write(base64.b64decode(d['audio_base64']))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp3, '-ac', '1', '-ar', '44100', wav], check=True)
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav]))
    al = d.get('alignment') or d.get('normalized_alignment')
    assert ''.join(al['characters']) == t, f'chunk {i}: 文字がずれています'
    chars += al['characters']
    starts += [x + offset for x in al['character_start_times_seconds']]
    ends += [x + offset for x in al['character_end_times_seconds']]
    wavs.append(wav); offset += dur
    print(f'chunk {i}: {dur:.1f}s')

lst = os.path.join(tmp, 'list.txt')
open(lst, 'w').write(''.join(f"file '{w}'\n" for w in wavs))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c:a', 'libmp3lame', '-b:a', '128k', 'narration.mp3'], check=True)
json.dump({'audio_base64': base64.b64encode(open('narration.mp3', 'rb').read()).decode(),
           'alignment': {'characters': chars, 'character_start_times_seconds': starts, 'character_end_times_seconds': ends}},
          open('input/tts_raw.json', 'w'))
print('合計', round(offset, 1), '秒')
