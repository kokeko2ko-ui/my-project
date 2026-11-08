#!/usr/bin/env python3
"""BGM と効果音の素材を ElevenLabs で作り、音量をそろえて public/audio/ に置く。
使い方: python3 tools/make_audio.py [--force] [--bgm-seconds 180]
  ・すでにあるファイルは作り直さない（--force で作り直す）。
  ・効果音は最大音量を -3dB に、BGM は平均音量を -26dB にそろえる（動画側で音量を下げて混ぜる）。
素材のプロンプトは下の SE / BGM に書いてある。ジャンルが変わったら BGM のプロンプトを変える。"""
import json, os, re, subprocess, sys, urllib.request

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'audio')
os.makedirs(OUT, exist_ok=True)
FORCE = '--force' in sys.argv
BGM_SEC = int(sys.argv[sys.argv.index('--bgm-seconds') + 1]) if '--bgm-seconds' in sys.argv else 180

SE = {  # ファイル名: (英語プロンプト, 秒)
    'se_pop':     ('short cute cartoon pop sound, soft bubble pop, bright and clean, single hit', 0.7),
    'se_kira':    ('sparkle twinkle chime, cute glitter ding, bright magical sparkle, single hit', 1.2),
    'se_correct': ('quiz show correct answer chime, cheerful ding dong, bright bell, single hit', 1.4),
    'se_boing':   ('cute cartoon boing surprise reaction sound, short springy bounce, comedic', 0.9),
    'se_whoosh':  ('soft quick whoosh swipe transition, subtle, clean', 0.6),
    'se_sizzle':  ('frying pan sizzling, oil sizzle while cooking egg on low heat, close microphone, steady', 4.0),
}
BGM = {
    'bgm_cooking': ('light cheerful acoustic jazz, fingerstyle acoustic guitar with soft upright bass and brushed drums, '
                    'bouncy upbeat cooking show background music, warm, simple and not busy, steady tempo, instrumental, no vocals, '
                    'leaves plenty of room for a speaking voice', BGM_SEC),
}

def post(url, body):
    r = urllib.request.Request(url, data=json.dumps(body).encode(), headers={'xi-api-key': 'dummy', 'Content-Type': 'application/json'})
    last = None
    for _ in range(4):
        try: return urllib.request.urlopen(r, timeout=300).read()
        except Exception as e: last = e
    sys.exit(f'失敗: {last}')

def level(path, key):
    o = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.search(key + r': (-?[\d.]+) dB', o).group(1))

def normalize(raw, dst, target, key):
    cur = level(raw, key)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', f'volume={target - cur}dB,alimiter=limit=0.9', '-c:a', 'libmp3lame', '-b:a', '160k', dst], check=True)
    return cur

for name, (prompt, sec) in SE.items():
    dst = os.path.join(OUT, name + '.mp3')
    if os.path.exists(dst) and not FORCE: print('あり', name); continue
    raw = os.path.join(OUT, '_raw.mp3')
    open(raw, 'wb').write(post('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {'text': prompt, 'duration_seconds': sec, 'prompt_influence': 0.6}))
    cur = normalize(raw, dst, -3.0, 'max_volume'); print('作った', name, f'(元の最大 {cur} dB → -3 dB)')
for name, (prompt, sec) in BGM.items():
    dst = os.path.join(OUT, name + '.mp3')
    if os.path.exists(dst) and not FORCE: print('あり', name); continue
    raw = os.path.join(OUT, '_raw.mp3')
    open(raw, 'wb').write(post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128', {'prompt': prompt, 'music_length_ms': sec * 1000}))
    cur = normalize(raw, dst, -26.0, 'mean_volume'); print('作った', name, f'(元の平均 {cur} dB → -26 dB)')
if os.path.exists(os.path.join(OUT, '_raw.mp3')): os.remove(os.path.join(OUT, '_raw.mp3'))
