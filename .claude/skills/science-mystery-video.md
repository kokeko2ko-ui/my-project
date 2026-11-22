---
name: science-mystery-video
description: >
  科学・宇宙ミステリーの解説動画（実写/NASA画像＋落ち着いた男性ナレーション＋明朝体テロップ＋「問い」のカード）を、
  企画→台本→出典→音声→絵コンテ→静止画確認→書き出し→サムネまで作るスキル。
  「科学ミステリー」「宇宙の謎の動画」「science-mystery-video」「企画番号◯◯の動画」などと言ったら使う。
  （感動系は kandou-master、手描きアニメ解説は anime-explainer-video）
---

# 科学ミステリー動画 制作スキル

作業場所：`science_mystery/`（以下の相対パスはここから）。最初に `science_mystery/docs/引き継ぎ.md` を読む。
元ネタの分析：`docs/参考動画の分析.md`。企画：`prompts/企画リスト.md`。台本の書き方：`prompts/台本プロンプト.md`。

## 依頼の受け方
「企画番号01の20秒（または1分・10分）動画を作って。出典を調べ、ナレーションと映像を同期して」の形でよい。
長さの指定がなければ、まず約1分で作って見せる（10分は書き出しに約40分かかる）。

## 流れ
```bash
cd science_mystery && npm install          # 初回のみ（remotion）。ffmpeg と playwright は環境にある
export EP=episodes/<英数字の名前>
# 1) 台本：prompts/台本プロンプト.md で $EP/input/script.txt と sources.md を作る（事実は公的資料で確認）
#    読み用 $EP/input/script_reading.txt（文の数は同じ。数字・英字だけ読みに直す）
# 2) 画像：NASA から
python3 tools/fetch_nasa.py search europa ice
python3 tools/fetch_nasa.py get $EP PIA19048 PIA17737 ...   # $EP/assets/ と credits.json（出典）
# 3) 声とタイミング（声は $EP/voice.json。既定 Toshi・Eleven v4）
python3 tools/tts.py && node tools/make_timings.js
# 4) 絵コンテ $EP/storyboard.json を書く（下の書き方）→ 静止画を全部見る
node tools/render.js stills
# 5) 書き出し（run_in_background で）→ out/video.mp4。軽い版は ffmpeg で 720p に
node tools/render.js final
# 6) サムネ
node tools/thumb.js $EP/thumb.json         # → $EP/out/thumb.png と thumb_small.png（スマホ表示の確認）
```

## 絵コンテ（storyboard.json）
```json
{"audio": {"bgm": "bgm_space.mp3", "bgmVolume": 0.32, "se": true},
 "cuts": [
  {"s": 0, "type": "title", "img": "PIA19048.jpg", "text": "氷の下の海に、\n生命はいるのか", "accent": "生命", "credit": "画像: NASA/…"},
  {"s": 2, "type": "image", "img": "PIA17737.jpg", "move": "right", "zoom": 1.5, "focus": [0.5, 0.5], "credit": "…"},
  {"s": 4, "type": "question", "img": "PIA23873.jpg", "label": "問い 1", "text": "なぜ、見えない海が\nあると言えるのか？", "accent": "見えない海"}
 ]}
```
- `s`＝そのカットが始まる文の番号（timings.json の i）。次のカットの `s` まで続く。
- `type`：`image`（画像をゆっくり動かす）／`title`（冒頭の大きな題）／`question`（暗い背景＋星＋大きな明朝の問い。重い効果音。その文のテロップは出さない）。
- `move`：in / out / left / right / up / down。`zoom`：余白や文字のある画像は 1.3〜1.7 で切り落とす。`focus`：寄る中心（0〜1）。
- 想像図には credit に「（想像図）」を付ける。credit は `assets/credits.json` の secondary_creator から。

## 守ること
- **断定しない**：生命・宇宙人・陰謀などは「証拠はまだない」「〜という説」。NASA が言っていないことを NASA の名前で言わない。
- 数字は出典どおり。丸めるときは小さい側へ（「2倍以上」→「より多い」）。
- 画像：images.nasa.gov を優先。作成者が個人名だけ（NASA/JPL がない）の画像は使わない。ESA・他国機関の画像は条件を確認。NASA のロゴは使わない。
- 説明欄に画像の出典と「想像図を含む」を書く（`title.md`）。
- 台本を直したら timings → 絵コンテの `s` → 静止画、を全部やり直す。
- BGM・効果音・声は ElevenLabs 生成。公開してよいかは契約プランの規約を確認（未確認）。

## 落とし穴
- `render.js` は `/opt/pw-browsers/chromium_headless_shell`（リンク）を使う。
- サムネの HTML は `setContent` だとローカルの画像・フォントを読めない → ファイルに書いて `goto` する（対応済み）。
- テロップの改行は `src/Video.tsx` の `wrap`（「、」で2行、無理なら3行）。「・」では切らない。
- Gemini（動画分析）は無料枠の上限で止まることがある。モデル名は時々変わる（今回 gemini-3.8-flash で成功）。
