# 料理動画 → レシピ集（Google スプレッドシート）

YouTube の料理動画を **GitHub Actions 上で** 自動取得し、Claude でレシピに整えて、
Google スプレッドシートに「一覧」シート + 料理ごとの 1 シートとして書き込むパイプラインです。

Claude Code のセッション環境からは YouTube にアクセスできないため、
インターネットに自由に出られる GitHub Actions のランナーで動かします。

```
videos.txt ──▶ fetch_videos.py ──▶ data/<id>.json ──▶ make_recipes.py ──▶ recipes/<id>.json ──▶ write_sheet.py ──▶ Google スプレッドシート
             (yt-dlp / 字幕取得)                      (Claude で構造化)                        (gspread)   └▶ レシピ集.xlsx
```

## 各シートに入る内容

| シート | 内容 |
|---|---|
| `一覧` | No / 料理名 / 人数 / 合計時間 / カロリー / タグ / チャンネル / 動画の長さ / 動画URL / レシピシートへのリンク / 備考 |
| `<料理名>` | 料理名・概要、人数・準備/調理/合計時間・カロリー（1人前・推定）、動画情報（タイトル・チャンネル・長さ・URL）、材料と分量、番号付きの手順（ポイント・動画内の時間つき）、コツ・ポイント |

料理以外の動画は `一覧` に「料理動画ではない」として載り、シートは作られません。

## 初回セットアップ（1回だけ）

### 1. Anthropic API キー
GitHub リポジトリの **Settings → Secrets and variables → Actions → New repository secret** で

| Secret 名 | 値 |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic Console で発行した API キー |

### 2. Google スプレッドシートへの書き込み権限（サービスアカウント）

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成（既存でも可）
2. **APIとサービス → ライブラリ** で **Google Sheets API** と **Google Drive API** を有効化
3. **IAMと管理 → サービスアカウント → 作成**（ロールは不要）
4. 作成したサービスアカウントの **キー → 鍵を追加 → JSON** をダウンロード
5. JSON ファイルの中身をそのまま Secret に登録

| Secret 名 | 値 |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | ダウンロードした JSON の中身（全文） |

6. 書き込み先を決めます（どちらか）
   - **A. 既存のスプレッドシートを使う**: そのシートを JSON 内の `client_email`（`xxx@xxx.iam.gserviceaccount.com`）に **編集者** として共有し、URL の `/d/` と `/edit` の間の ID を Secret `RECIPE_SPREADSHEET_ID` に登録
   - **B. 自動作成させる**: `RECIPE_SPREADSHEET_ID` を登録せず、**Variables** に `SHARE_WITH_EMAIL` = 自分の Gmail を登録。初回実行でスプレッドシートが作られ、そのメールに共有されます。実行ログに出る ID を次回から `RECIPE_SPREADSHEET_ID` に登録してください

`GOOGLE_SERVICE_ACCOUNT_JSON` を登録しない場合でも、Excel ファイル（`レシピ集.xlsx`）が
Actions のアーティファクトとして出力されるので、それを Google ドライブにアップロードして
スプレッドシートとして開くこともできます。

### 3. （任意）YouTube に bot 判定されたとき
GitHub Actions の IP からのアクセスが YouTube にブロックされることがあります。その場合は
ブラウザ拡張（「Get cookies.txt LOCALLY」など）で YouTube の cookie を Netscape 形式で書き出し、
中身を Secret `YT_COOKIES` に登録してください。

## 使い方

1. `recipe-sheets/videos.txt` に動画 URL を 1 行 1 本で追加して push
   → 自動でワークフローが走ります
2. または **Actions → 「料理動画 → レシピ集」 → Run workflow** で URL を直接入力して実行

処理済みの動画は `data/` と `recipes/` に JSON で保存され、リポジトリにコミットされます。
2 回目以降は新しく追加した動画だけが処理されます（作り直したいときは `force` にチェック）。

### 字幕が取れない動画・手動で情報を渡したい動画
`data/<動画ID>.json` を次の形で直接置いて push すれば、YouTube を経由せずにレシピ化できます。

```json
{
  "id": "KD6uiB3LOYQ",
  "url": "https://www.youtube.com/watch?v=KD6uiB3LOYQ",
  "title": "動画タイトル",
  "channel": "チャンネル名",
  "duration_sec": 600,
  "description": "概要欄のテキスト",
  "transcript": "字幕や文字起こしのテキスト"
}
```

## ローカルで動かす

```bash
cd recipe-sheets
pip install -r requirements.txt
export ANTHROPIC_API_KEY=...
python fetch_videos.py
python make_recipes.py
python write_sheet.py --xlsx レシピ集.xlsx           # Excel に出力
# または
export GOOGLE_SERVICE_ACCOUNT_JSON="$(cat service-account.json)"
export RECIPE_SPREADSHEET_ID=...
python write_sheet.py                                 # Google スプレッドシートに書き込み
```
