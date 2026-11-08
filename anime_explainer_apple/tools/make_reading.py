#!/usr/bin/env python3
"""字幕用の台本（input/script.txt）から、読み用の台本（input/script_reading.txt）を作る。
使い方: python3 tools/make_reading.py episodes/<回の名前> [--extra 回だけの追加変換.json]
変換表は tools/reading_map.json。回ごとに足したいものは <回>/reading_extra.json（{"pairs": [[元, 読み], ...]}）に書く。
文の数と順番は変えない（字幕と音声を文の番号でひもづけるため）。"""
import json, os, sys
ep = sys.argv[1] if len(sys.argv) > 1 else 'episodes/tamagoyaki_chef'
here = os.path.dirname(os.path.abspath(__file__))
pairs = json.load(open(os.path.join(here, 'reading_map.json'), encoding='utf-8'))['pairs']
extra = os.path.join(ep, 'reading_extra.json')
if os.path.exists(extra): pairs = json.load(open(extra, encoding='utf-8'))['pairs'] + pairs
t = open(os.path.join(ep, 'input/script.txt'), encoding='utf-8').read()
for a, b in pairs: t = t.replace(a, b)
open(os.path.join(ep, 'input/script_reading.txt'), 'w', encoding='utf-8').write(t)
print('書き出しました:', os.path.join(ep, 'input/script_reading.txt'))
