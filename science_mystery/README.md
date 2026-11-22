# science_mystery — 科学・宇宙ミステリー動画を作る仕組み

NASA の画像 × ElevenLabs のナレーション × Remotion で、「問いが連鎖する」科学ミステリー動画を作る。
使い方はスキル `/.claude/skills/science-mystery-video.md`、状況は `docs/引き継ぎ.md`。

```
tools/fetch_nasa.py   NASA画像の検索・取得（出典を credits.json に記録）
tools/tts.py          ElevenLabs で声（文字ごとの時刻つき）
tools/make_timings.js 文ごとの開始・終了時刻 → timings.json
tools/render.js       静止画確認 / 書き出し
tools/thumb.js        サムネ（上白・下赤の極太明朝）
tools/make_audio.py   BGM・効果音（ElevenLabs）
tools/get_fonts.js    フォントを同梱
src/Video.tsx         画像のゆっくりズーム・問いのカード・タイトル・テロップ・音
prompts/              企画リスト（20本）・台本プロンプト
episodes/<回>/        input/script.txt・script_reading.txt・voice.json・storyboard.json・sources.md・title.md・thumb.json・assets/
```
