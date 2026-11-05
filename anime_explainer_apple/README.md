# 解説アニメ動画：ジョブズとアップル復活

「5歳でもわかる」形式の手描き風解説アニメ（約6分25秒・1920×1080）の制作一式。

## 作り方（次の回も同じ手順）
1. `input/script.txt` に台本を置く
2. 音声を作る（ElevenLabs の with-timestamps）→ `input/tts_raw.json`
3. `node tools/make_timings.js` → `public/narration.mp3` と `timings.json`
4. `storyboard.json` を書く（カットごとに開始の文番号・型・中身）
5. `node tools/render.js stills` で各カットの静止画を確認
6. `node tools/render.js final` → `out/video.mp4`

キャラの見た目は `src/characters.ts`、シーン部品は `src/Scenes.tsx`。

## Google Drive への自動アップロード
`node tools/upload_drive.js out/video.mp4`（保存先：マイドライブの「解説アニメ」フォルダ）。
環境変数 `GDRIVE_CLIENT_ID` / `GDRIVE_CLIENT_SECRET` / `GDRIVE_REFRESH_TOKEN` が必要。
