---
name: anime-explainer-video
description: >
  「5歳でもわかる」手描き風アニメ解説動画を、テーマ決め→台本→音声→絵コンテ→動画→確認まで一気に作るスキル。
  ビジネス解説・料理（作り方・レシピ・雑学）・雑学クイズなど、ジャンルに合わせてプロンプトと台本と動画を切り替える。
  「解説アニメを作って」「アニメ動画を作って」「レシピ動画」「雑学動画」「5歳でもわかる」「narouze」などと言ったら必ず使うこと。
  （感動系ナレーション台本は別スキル kandou-master。こちらは絵が動くアニメ動画用）
---

# 解説アニメ動画 制作スキル（anime-explainer-video）

元ネタ：https://narouze.com/tokuten_line/77（3回の深掘りは `anime_explainer_apple/docs/narouze_tokuten77_分析.md`）
作業場所：`anime_explainer_apple/`（以下、相対パスはここから）

## いちばん大事な考え方
講座の3つのプロンプトは「**ジャンルごとに変わる部分**」と「**変わらない骨格**」でできている。
**ジャンル（タイトル）が変わったら、テーマ決め・台本・動画作成を、そのジャンルに合わせて必ず書き換える。**
変わる部分は `prompts/channels/<ジャンル>.md` に集めてある（視聴者・テーマ基準・構成・口調・数字の扱い・安全・読み方・シーン・配役・確認項目）。

| ジャンル | 設定ファイル | 数字の扱い | 主な安全 | 主役のシーン |
|---|---|---|---|---|
| ビジネス・金融史 | `business.md` | 丸めてよい | 投資の免責・不正・存命人物 | news / bars / compare / coins |
| 料理・レシピ・料理の雑学 | `cooking.md` | **正確に**（音声・字幕・絵で一致） | 食中毒・アレルギー・火・健康の断定 | ingredients / step / pan / quiz |
| 雑学・クイズ | `trivia.md` | 出典で確認できるものだけ | 俗説・断定・出典 | quiz / keyword / compare |
| 新ジャンル | `_template.md` をコピー | ジャンルで決める | ジャンルで決める | ジャンルで決める |

## 迷ったら、先に確認する（ユーザーの指示）
わからないこと・複数の意味に取れることは、**勝手に決めず、AskUserQuestion で短く確認する**（選択肢を2〜4個、おすすめを先頭に）。
- 確認する：ジャンルが決まらない／テーマの候補が複数ある／キャラ・声・絵柄の好み／「シンプルに」「変えて」など意味が広い指示／動画の長さ（まず短く試すか、フルか）／お金・外部への送信・公開が絡むこと／事実が確認できない内容を載せるか。
- 確認しない（既定で進めて、使った既定を一言伝える）：ファイル名・フォルダ名／書き出しの設定／一時的な作業手順／過去に決まった好み（Yukari・v4・シンプル版・分割生成）。
- 確認した答えは、ジャンルの設定ファイルや storyboard に反映して、次回から聞かなくてよいようにする。
- 絵コンテは必ずユーザーの OK をもらってから先へ進む（上の STEP 5）。

## 全体の流れ（固定）
```
STEP 0 ジャンルを決める（ユーザーの言葉から。なければ聞く）→ 設定ファイルを読む（なければ _template.md から作る）
STEP 1 テーマ決め   prompts/01_theme_prompt.md を設定ファイルで埋めて実行 → 番号つきタイトル案
STEP 2 台本         prompts/02_script_prompt.md を埋めて実行 → episodes/<名前>/input/script.txt
STEP 3 読み用の台本  設定ファイルの「読み方の変換表」で input/script_reading.txt を作る（文の数・順番は script.txt と同じ）
STEP 4 音声とタイミング  tts_chunked.py → make_timings.js → make_envelope.js
STEP 5 絵コンテ     storyboard.json を書く → 箇条書きでユーザーに見せて OK をもらう
STEP 6 静止画確認   render.js stills → 全カットを目で確認 → 直す
STEP 7 自動確認     verify.py
STEP 8 確認用動画   render.js preview（または final）→ 音・口・読みを確認
STEP 9 本番         render.js final → 軽い版（720p）も作る → ユーザーに渡す（SendUserFile。Drive は下記）
```
ユーザーが「テーマはこれ」と言えば STEP 1 は省く。「台本はこれ」と渡されたら STEP 3 から。

## STEP 別の手順

### STEP 0〜3：ジャンル・テーマ・台本
- 回のフォルダを作る：`episodes/<英数字の名前>/input/`。名前は料理名や題材のローマ字（例 `tamagoyaki`）。
- テーマの除外リストに、これまで作った回（`episodes/` の中身）を入れて、かぶりを避ける。
- 事実確認：Web検索が使えれば必ず調べる。人物・年号・数字（ビジネス）、分量・加熱（料理）、出典（雑学）。
- 台本は **字幕用（漢字まじり）** と **読み用（ひらがな化）** の2本。文の数が違うと `make_timings.js` がエラーで止まる。
- まず試すときは短く（約800〜2,000字）。長い台本は書き出しに時間がかかる（約6分の動画で約20分）。

### STEP 4：音声とタイミング（コマンド）
```bash
export EP=episodes/<名前>
python3 tools/tts_chunked.py      # Eleven v4・Yukari・約450字ずつ分けて生成してつなぐ（→ narration.mp3, input/tts_raw.json）
node tools/make_timings.js        # → timings.json（文ごとの開始・終了秒。字幕は script.txt の文）
node tools/make_envelope.js       # → envelope.json（音の大きさ。口パク用）
```
- ElevenLabs は環境にキーが入っている（`api.elevenlabs.io` に proxy が差し込む。キーはダミーでよい）。
- モデルや声を変える：`TTS_MODEL=eleven_v3 VOICE_ID=<id> python3 tools/tts_chunked.py`。声の候補：Yukari `80H5qqdq3bIO8OjFE6ue`、Satomi `wcs09USXSN5Bl7FXohVZ`、Shizuka `WQz3clzUdMqvBf0jswZQ`、Sakura `RBnMinrYKeccY3vaUxlZ`。
- 502 が出たら再試行（スクリプトは自動で6回）。それでも長い文が通らなければ `MAXC` を小さくする。
- ユーザーのクローン声（Vrew など）は、ユーザーが指定したときだけ使う。

### STEP 5：絵コンテ（`episodes/<名前>/storyboard.json`）
```json
{ "style": "simple",
  "cast": {"mina": "chef_mina", "taro": "chef_ko", "jobs": "obaa"},
  "cuts": [ {"s": 0, "type": "title", "line1": "5歳でもわかる", "line2": "ふわふわ卵焼き"}, ... ] }
```
- `s`＝そのカットが始まる**文の番号**（`timings.json` の `i`）。番号は増えていくこと。
- 型と必須項目は `tools/verify.py` の `REQUIRED` と `src/Scenes.tsx`。型：title / talk / duo / list / compare / bars / news / keyword / coins / grid / imac / outro / ingredients / step / pan / quiz。
- ルール：1カット3〜6秒、先頭 title・最後 outro、同じ型を3回続けない、吹き出しは10文字前後に言い換える。
- 役名は mina（案内役）/ taro（たとえ話・助手）/ jobs（もう一人）で固定。見た目は `cast` で `src/characters.ts` の `CAST_LIB` のキーに差し替える（新キャラは `CAST_LIB` に足す）。
- **絵コンテは箇条書きにしてユーザーに見せ、OK をもらってから進める。**

### STEP 6〜9：確認と書き出し
```bash
node tools/render.js stills        # 全カットの静止画 → <回>/out/stills/
python3 tools/verify.py $EP        # 自動確認（FAIL は直す。WARN は読んで判断）
node tools/render.js preview       # 半分の大きさの確認用mp4
node tools/render.js final         # 本番 1920x1080（約20分／6分動画。バックグラウンドで）
```
- 静止画は6〜9枚ずつ1枚にまとめて見ると速い（ffmpeg の xstack）。**直したカットはもう一度撮って確認する。**
- 書き出しは `run_in_background` で。終わったら `ffprobe` と音量（`verify.py`）を確認してから渡す。
- 軽い版：`ffmpeg -i out/video.mp4 -vf scale=1280:720 -c:v libx264 -preset veryfast -crf 26 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart out/video_720p.mp4`
- 渡し方：`/mnt/user-data/outputs/` に **ASCII のファイル名**でコピーして SendUserFile。（日本語名は化けることがある）

## 作ったあとに必ず確認する（人の目と耳）
1. **自動**：`verify.py` が FAIL なし。
2. **目**：全カットの静止画。文字の隠れ・はみ出し・重なり・字幕にかかっていないか・絵が台本と合っているか。
3. **耳**：確認用動画で、読み間違い・変な間・音量。口の動きが速すぎないか。
4. **事実**：設定ファイルの「確認項目」。ビジネス＝人物・数字・免責／料理＝分量と加熱と安全／雑学＝出典と「諸説あります」。
5. **ユーザーの感想**を聞いて直す。直したら、直した部分だけ作り直して再確認。
「動画全体を最初から最後まで見た・聞いた」とは言わない。確認した範囲（何カット・どの時刻）を正直に伝える。

## 過去に分かった落とし穴（直し方つき）
- **音が入っていないと言われた**：ファイルの音量を `ffmpeg -af volumedetect` で測って示す。軽い版と音声だけの mp3 も送って切り分ける。端末側（消音スイッチ・プレビュー）が原因のことが多い。
- **日本語の読みが変**：漢数字・数字・難読語・「……」が原因。読み用の台本を直して、その文を含む段落だけ作り直す。モデルを v2→v4 に上げると改善した。
- **口の動きが速い**：音の大きさに連動（`envelope.json`）。変えたいときは `Character.tsx` の `mouthOpen`。
- **長い台本の音声が 502**：分割生成（`tts_chunked.py`）で解決。
- **ヘッドレスブラウザが外部フォントを取れない**：フォントは `public/fonts` に同梱済み。
- **ファイル名が化ける**：送るファイルは ASCII 名にする。
- **Drive に入れたい**：MCP の Drive ツールは大きなファイルを送れない。`request_credential`（host `www.googleapis.com`）で Playground のアクセストークン（約1時間）を保存してもらい、`node tools/upload_drive.js <ファイル>` を使う。トークンはチャットに貼らせない。
- 絵が「ふわふわ浮く」：シンプル版は足を短い線で描いている。足を消さない。

## 絵柄（シンプル版・標準）
太い黒線・丸い角・平塗り。頭が大きく体が小さい。目は小さな縦長の丸。特徴は1つ。シンプルにしたいという要望が出たので、影・靴・眉・歯・飾りは付けない（影つきにしたいときは絵コンテの `"style": "shaded"`）。
キャラの見た目の編集は `src/characters.ts` だけ。見本の画像：`node tools/render.js sheet2`。

## ほかのスキルとの関係
- 感動系のナレーション台本（顔出しなし・docx/Vrew納品）は `kandou-master`。このスキルは**絵が動くアニメ動画**用で、別チャンネルの想定。
- ジャンルの設定ファイルを増やしたら、この表と `prompts/README.md` を更新する。
