# YouTube Analytics へのアクセス設定（1回やれば以後ずっと使える）

このセッション（コンテナ）は毎回作り直されるため、**認証情報だけは毎回渡す必要があります**。
ただし下記の「リフレッシュトークン」方式なら、**一度発行した文字列を毎回貼るだけ**で済みます。
アクセストークンのように1時間で切れることはありません。

---

## 方法A：リフレッシュトークン（推奨・初回のみ10分）

### 手順1　OAuthクライアントを作る（初回のみ）

1. https://console.cloud.google.com/ を開く
2. 上部のプロジェクト選択 →「新しいプロジェクト」→ 名前は何でもよい（例：`yt-analytics`）
3. 左メニュー「APIとサービス」→「ライブラリ」
   - `YouTube Data API v3` を検索して **有効にする**
   - `YouTube Analytics API` を検索して **有効にする**
4. 左メニュー「APIとサービス」→「OAuth同意画面」
   - User Type：**外部** →「作成」
   - アプリ名・サポートメール・デベロッパーメールを入力して保存（他は空でよい）
   - 「対象ユーザー」→「テストユーザー」に **自分のGmailアドレスを追加**
5. 左メニュー「APIとサービス」→「認証情報」
   - 「+ 認証情報を作成」→「OAuth クライアント ID」
   - アプリケーションの種類：**デスクトップアプリ**
   - 作成すると **クライアントID** と **クライアントシークレット** が表示される → 控える

### 手順2　リフレッシュトークンを取る（初回のみ）

1. https://developers.google.com/oauthplayground/ を開く
2. 右上の **歯車アイコン** をクリック
3. **「Use your own OAuth credentials」にチェック**
4. 手順1のクライアントID／クライアントシークレットを入力
5. 左のリストの一番下 **「Input your own scopes」** に以下を貼って Authorize
   ```
   https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/youtube.readonly
   ```
6. Googleアカウントでログイン（「このアプリは確認されていません」→「詳細」→「安全ではないページに移動」でOK。自分のアプリなので問題ない）
7. 「Exchange authorization code for tokens」をクリック
8. **Refresh token（`1//` で始まる文字列）** をコピーして保存する

### 手順3　毎回これを貼るだけ

次回以降、チャットに以下の3つを貼ってください（これだけで動きます）。

```
YT_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
YT_CLIENT_SECRET=GOCSPX-xxxxxxxx
YT_REFRESH_TOKEN=1//xxxxxxxx
```

実行：
```bash
YT_CLIENT_ID=... YT_CLIENT_SECRET=... YT_REFRESH_TOKEN=... python3 tools/yt_analyze.py
```

---

## 方法B：アクセストークン（お手軽・1時間で失効）

OAuth Playground の手順5まで同じで、`Access token`（`ya29.` で始まる）をコピーして貼る。
1時間で切れるので、その場かぎりの確認向け。

```bash
YT_ACCESS_TOKEN=ya29.xxxx python3 tools/yt_analyze.py
```

---

## 方法C：Studio の CSV をそのまま渡す（認証不要・実はこれが一番効く）

**インプレッション数とクリック率（CTR）は API では取得できません。** Studio の画面にしかありません。
このチャンネルのいまの課題は「台本の質」ではなく「パッケージ（タイトル・サムネ）」なので、
実はこのCSVがいちばん価値が高いデータです。

1. YouTube Studio →「アナリティクス」→「コンテンツ」タブ
2. 右上の **エクスポート（↓アイコン）** →「カンマ区切り値（.csv）」
3. ダウンロードされたZIPを解凍して、中の CSV をチャットに添付

実行（**CSVだけで完結します。APIキーもトークンも不要**）：
```bash
YT_STUDIO_CSV=/path/to/表データ.csv python3 tools/yt_analyze.py
```

CSV単体で出るもの：再生数・平均視聴時間・インプレッション数・**CTR**・高評価・型別サマリー
CSV単体では出ないもの：維持率カーブ（5%/10%/25%地点）・流入元の内訳・コメント数

→ 維持率と流入元まで見たい場合のみ、方法AまたはBを併用してください。
  併用すると1枚の表にCTRと維持率が並びます。

---

## 安全性について

- 要求しているスコープは **読み取り専用の2つだけ**（`yt-analytics.readonly` / `youtube.readonly`）です。
  動画の投稿・編集・削除・コメントはできません。
- 貼っていただいた文字列は **環境変数として実行時に渡すだけ** で、リポジトリには一切コミットしません。
  （コミット前に `grep` で混入チェックをしています）
- 取り消したくなったら https://myaccount.google.com/permissions からいつでも解除できます。
