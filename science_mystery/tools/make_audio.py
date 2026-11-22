#!/usr/bin/env python3
"""（anime_explainer_apple/tools/make_audio.py を科学ミステリー用に変えたもの）\nBGM と効果音の素材を ElevenLabs で作り、音量をそろえて public/audio/ に置く。
使い方: python3 tools/make_audio.py [--force] [--bgm-seconds 180]
  ・すでにあるファイルは作り直さない（--force で作り直す）。
  ・効果音は最大音量を -3dB に、BGM は平均音量を -26dB にそろえる（動画側で音量を下げて混ぜる）。
素材のプロンプトは下の SE / BGM に書いてある。ジャンルが変わったら BGM のプロンプトを変える。"""
import json, os, re, subprocess, sys, urllib.request

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'audio')
os.makedirs(OUT, exist_ok=True)
FORCE = '--force' in sys.argv
BGM_SEC = int(sys.argv[sys.argv.index('--bgm-seconds') + 1]) if '--bgm-seconds' in sys.argv else 150

SE = {  # ファイル名: (英語プロンプト, 秒)
    'se_whoosh':  ('slow deep cinematic whoosh transition, airy, dark, subtle, no impact', 1.6),
    'se_boom':    ('deep cinematic low boom hit with long reverb tail, mysterious documentary sting, single hit', 3.0),
    'se_riser':   ('soft eerie ambient riser swelling up, mysterious tension build, documentary, no drums', 3.0),
}
BGM = {
    'bgm_space': ('slow mysterious ambient space documentary music, deep warm synth pads, distant soft piano notes, '
                  'gentle shimmering textures, sense of wonder and the unknown, calm, no drums, no beat, instrumental, no vocals, '
                  'leaves plenty of room for a narrator voice', BGM_SEC),
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
