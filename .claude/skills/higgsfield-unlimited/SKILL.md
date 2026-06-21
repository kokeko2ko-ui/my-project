---
name: higgsfield-unlimited
description: |
  Higgsfield で画像を Unlimited モード（クレジット消費ゼロ）で生成するスキル。
  Claude in Chrome を使って Higgsfield Web UI のセッションを利用し、
  fnf.higgsfield.ai に直接リクエストを送ることでクレジットを消費せずに画像を生成する。

  以下のような場合に必ず使うこと：
  - 「Higgsfield で画像を作って」「Unlimitedで生成して」「クレジットを使わずに画像生成」
  - 「ただで画像を作って」「無制限で生成して」
  - Higgsfield の画像生成を頼まれたとき（Unlimited が有効なモデルを使う場合）
  - /unlimited コマンドに相当する操作

  必要なもの: Chrome に Higgsfield がログイン済みであること、Claude in Chrome 拡張が有効であること
---

# Higgsfield Unlimited 画像生成

Higgsfield Web UI のブラウザセッションを利用して、**クレジット消費ゼロ**で画像を生成する。

## 環境別フロー

| 環境 | 方法 |
|------|------|
| **claude.ai + Claude in Chrome** | STEP 1〜7（ブラウザ自動操作） |
| **Claude Code** | [Claude Code フロー](#claude-code-フロー) を参照 |

---

## なぜこの方法か

Higgsfield の Unlimited 機能は Web UI 専用で、MCP の `generate_image` ツールは
`use_unlim` パラメーターを削除してしまう。そのためブラウザの Clerk JWT トークンを使って
`fnf.higgsfield.ai` に直接リクエストすることでのみ Unlimited が有効になる。

## 実行手順

### STEP 1: Chrome タブを準備

```
mcp__Claude_in_Chrome__tabs_context_mcp (createIfEmpty: true)
```

タブ一覧を確認。`higgsfield.ai` タブがあればそれを使う。なければ新規タブに移動：
```
mcp__Claude_in_Chrome__navigate → https://higgsfield.ai/ai/image
```
ページ読み込み後、2〜3秒待つ。

### STEP 2: Clerk トークンを取得

`mcp__Claude_in_Chrome__javascript_tool` で以下を実行：

```javascript
(async () => {
  const clerk = window.Clerk || window.__clerk;
  if (!clerk?.session) return 'ERROR: Higgsfield にログインしてください';
  const token = await clerk.session.getToken();
  window._hfToken = token;
  return token ? 'TOKEN_OK' : 'TOKEN_FAIL';
})()
```

`TOKEN_OK` が返らない場合は「Higgsfield にログインしてください」と伝えて終了。

### STEP 3: アスペクト比と解像度を決定

ユーザーの要求から以下を選択：

| 用途 | aspect_ratio | width | height |
|------|-------------|-------|--------|
| 横長（デフォルト） | 16:9 | 1344 | 768 |
| 縦長（SNS/スマホ） | 9:16 | 768 | 1344 |
| 正方形 | 1:1 | 1024 | 1024 |
| 縦長（ポートレート） | 3:4 | 896 | 1200 |
| 横長（ワイド） | 4:3 | 1200 | 896 |

### STEP 4: Unlimited 生成リクエストを送信

**ポイント：`use_unlim: true` を `params` 内とトップレベルの両方に必ず入れること。**

```javascript
(async () => {
  const clerk = window.Clerk || window.__clerk;
  const token = await clerk.session.getToken();

  const resp = await fetch('https://fnf.higgsfield.ai/jobs/nano-banana-2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      params: {
        prompt: "【ここにプロンプト】",
        input_images: [],
        width: 1344,
        height: 768,
        batch_size: 1,
        aspect_ratio: "16:9",
        is_storyboard: false,
        is_zoom_control: false,
        use_unlim: true,
        resolution: "1k"
      },
      use_unlim: true,
      use_seedream_bonus: false
    })
  });

  const data = await resp.json();
  window._hfJobId = data?.job_sets?.[0]?.jobs?.[0]?.id;
  return `jobId: ${window._hfJobId}`;
})()
```

job ID が取得できたらSTEP 5へ。エラーの場合はレスポンスを確認して対処。

### STEP 5: 完了を待つ（ポーリング）

10〜15秒待ってから以下を実行（completed になるまで繰り返す）：

```javascript
(async () => {
  const clerk = window.Clerk || window.__clerk;
  const token = await clerk.session.getToken();
  const r = await fetch(`https://fnf.higgsfield.ai/jobs/${window._hfJobId}/status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const d = await r.json();
  return JSON.stringify({ status: d.status, id: d.id });
})()
```

`status: "completed"` になったら次へ。通常 10〜30秒。

### STEP 6: 画像を表示

MCP で結果を取得・表示（どちらか利用可能な方を使う）：

```
mcp__higgsfield__job_display (id: <jobId>)
または
mcp__229a082d-754f-4f7b-bdcf-c10443356f5a__job_display (id: <jobId>)
```

### STEP 7: クレジット消費を確認（任意）

```
mcp__229a082d-754f-4f7b-bdcf-c10443356f5a__balance
```

残高が変わっていないことを確認してユーザーに報告する。

---

## 完了メッセージのテンプレート

```
✅ Unlimited 生成完了！
🆓 クレジット消費: 0（残高: X credits → X credits 変化なし）
モデル: Nano Banana Pro（Unlimited）

![生成画像](minUrl)
```

---

## Unlimited 対応モデル

現在確認済みのモデル（URL パス）：

| モデル URL | 説明 |
|-----------|------|
| `nano-banana-2` | Nano Banana Pro / 高速・高品質 ✅ |
| `seedream-v4-5` | Seedream 4.5 / 4K 精密 |
| `seedream-v5-lite` | Seedream 5 Lite / 推論・編集 |
| `nano-banana` | Nano Banana / リアル・安定 |

---

## Claude Code フロー

Claude Code 環境では Chrome MCP が使えないため、ユーザーが手動でトークンを取得する。

### CC-STEP 1: ユーザーにトークン取得を依頼

以下をユーザーに伝える：

```
ブラウザで https://higgsfield.ai を開き、
DevTools（F12）→ Console に以下を貼り付けて実行してください：

(async () => {
  const clerk = window.Clerk || window.__clerk;
  if (!clerk?.session) return 'ERROR: ログインしてください';
  const token = await clerk.session.getToken();
  console.log(token);
  return token;
})()

表示されたトークン（eyJ... で始まる長い文字列）をコピーして渡してください。
```

### CC-STEP 2: アスペクト比と解像度を決定

STEP 3 と同じテーブルを参照。

### CC-STEP 3: curl でリクエスト送信

```bash
curl -s -X POST https://fnf.higgsfield.ai/jobs/nano-banana-2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "params": {
      "prompt": "【プロンプト】",
      "input_images": [],
      "width": 1344,
      "height": 768,
      "batch_size": 1,
      "aspect_ratio": "16:9",
      "is_storyboard": false,
      "is_zoom_control": false,
      "use_unlim": true,
      "resolution": "1k"
    },
    "use_unlim": true,
    "use_seedream_bonus": false
  }'
```

レスポンスから job ID を取得：
```bash
# レスポンス例
# {"job_sets":[{"jobs":[{"id":"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"}]}]}
```

### CC-STEP 4: ポーリング

10〜15秒待ってから実行（`completed` になるまで繰り返す）：

```bash
curl -s https://fnf.higgsfield.ai/jobs/<JOB_ID>/status \
  -H "Authorization: Bearer <TOKEN>" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status'), d.get('id'))"
```

### CC-STEP 5: 画像 URL を表示

```bash
curl -s https://fnf.higgsfield.ai/jobs/<JOB_ID>/status \
  -H "Authorization: Bearer <TOKEN>" \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
jobs = d.get('job_sets', [{}])[0].get('jobs', [{}])
for j in jobs:
    print(j.get('result_url') or j.get('output_url') or json.dumps(j))
"
```

取得した URL をチャットに表示してユーザーに伝える。

### CC トラブルシューティング

| 問題 | 対処 |
|------|------|
| `401 Unauthorized` | トークンが期限切れ。CC-STEP 1 からやり直し |
| `detail: "not enough credits"` | Unlimited が有効でない。Web UI で Unlimited トグルを確認 |
| `result_url` が null | まだ生成中。10秒待って再ポーリング |
| curl が使えない | `python3 -c "import urllib.request, json; ..."` で代替 |

---

## トラブルシューティング

| 問題 | 対処 |
|------|------|
| `TOKEN_FAIL` / `TOKEN_OK` が返らない | Higgsfield にブラウザでログインし直す |
| `Invalid or expired token` | `clerk.session.getToken()` を再実行 |
| Chrome 拡張が未接続 | Chrome の拡張機能パネルから Claude in Chrome を確認 |
| `detail: "not enough credits"` が出る | Unlimited が有効でない（Web UI で確認） |
| ジョブが失敗 | プロンプトを英語にする、または shorter にする |
