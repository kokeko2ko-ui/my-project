# 動画づくりの仕組み（第52作から）

台本ができたら、読み上げ → 字幕 → 場面画像 → 動画まで、ここにある3つのスクリプトで進める。
Vrew は使わない。第51作（`video/51_walk/`）で作った流れを、どの作品でも使える形にしたもの。

## 制作ユニット

作品ごとに `video/<番号>_<テーマ>/` を作る（例：`video/52_xxx/`）。

```
video/52_xxx/
├── unit.json          {"title": "第52作_○○"}（書き出す動画の名前）
├── voice.txt          読み上げ用の台本（下を参照）
├── design/
│   ├── scenes.tsv     場面ID・字幕番号の範囲・画像プロンプト（タブ区切り）
│   └── urls.tsv       場面番号と画像のURL（Higgsfield の生成結果）
├── images/S01.png…    場面ごとの画像（setup.py が urls.tsv から取得）
├── source/            narration.mp3 と narration.srt（tts.py が作る）
└── build/             書き出した動画
```

`source/`・`images/`・`build/`・`tts_cache/` は大きいのでリポジトリに入れない（.gitignore 済み）。
`design/` と `voice.txt`・`unit.json` だけ残せば、同じ動画をいつでも作り直せる。

## 手順

1. **voice.txt を作る**：Vrew用ナレーション（`Vrew用_…_ナレーション.txt`）をもとに、
   要所の行頭に感情の指示を足す（例：`[静かに、震える声で] 朝の、六時前。`）。
   1行＝字幕1枚。空行は段落の区切り。指示は声に出して読まれず、字幕からも消える。
2. **読み上げと字幕**：`python3 -I tools/video/tts.py video/52_xxx`
   - ElevenLabs（`eleven_v3`・大谷ボイス）で段落ごとに読み上げ、文字ごとの時刻から SRT を作る
   - 1文字＝1クレジット。結果は `tts_cache/` に残るので、作り直しで同じ部分は再課金されない
3. **場面割り**：SRT の字幕番号で `design/scenes.tsv` を書く（1場面10〜45秒が目安）
4. **画像**：Higgsfield `generate_image_batch`（`gpt_image_2_5`・16:9）で場面ごとに作り、URL を `design/urls.tsv` に書く
   - プロンプトの末尾に「no faces visible, no text, no letters, no logos, no watermark」
   - 回数制限（429）が出るので、一度に送るのは6〜8枚まで
   - 取得：`python3 -I tools/video/setup.py video/52_xxx`
   - 一覧画像を作って目で確かめる（2コマに分かれた絵・文字やロゴ入りは作り直す）
5. **検査**：`python3 -I tools/video/build.py video/52_xxx check`（数・連番・重複・字幕の折り返し）
6. **確認用**：`… build.py video/52_xxx preview` → 30MB を超えるので前半・後半に分けて送り、見てもらう
7. **本番**：OK をもらってから `… build.py video/52_xxx final`
   - 長さ・全デコード・代表フレーム・ハッシュを確かめる
   - 645MB 前後になり、チャットで送れない（1ファイル30MBまで）。
     渡すときは `-preset veryfast -crf 24` で軽くして（約150MB）、24MB ずつに分けて送り、
     Windows で `copy /b` を使って1本に戻してもらう（第51作でこの方法で渡した）

## 映像の決まり（第51作で判明）

- 画像の動きは1コマずつ小数位置で描く（ffmpeg の zoompan は1ピクセル単位でカクつく）
- 場面の切り替えは黒をはさまないクロスフェード（1.2秒）
- 字幕は下中央・最大2行・1行27字まで。読点・ダッシュ・かぎ括弧でだけ折り返す
- 書き出しは長時間かかり、作業環境の再起動で止まることがある。止まったら同じコマンドで再開できる
  （場面ごとの映像は `build/clips2_*` に残り、できた分は作り直さない）
