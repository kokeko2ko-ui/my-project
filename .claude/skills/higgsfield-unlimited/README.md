# Higgsfield Unlimited 環境

Higgsfield を **Unlimited モード（クレジット消費ゼロ）** で使うためのスキルとヘルパー一式。

## 構成

| ファイル | 役割 |
|---------|------|
| `SKILL.md` | スキル本体。「Unlimitedで生成して」等で自動的に参照される |
| `generate.py` | Claude Code 用ヘルパー。トークン＋プロンプトで生成〜URL取得を自動化 |

## 使い方（Claude Code）

1. ブラウザで https://higgsfield.ai を開き、Unlimited トグルを有効にしてログイン
2. DevTools(F12) → Console で以下を実行してトークンを取得:
   ```js
   (async () => (await (window.Clerk||window.__clerk).session.getToken()))()
   ```
3. 生成:
   ```bash
   python3 .claude/skills/higgsfield-unlimited/generate.py \
     --token "eyJ..." --prompt "a cat astronaut, cinematic" --ratio 16:9
   ```

## 対応モデル

`nano-banana-2`（既定）/ `seedream-v4-5` / `seedream-v5-lite` / `nano-banana`

## 注意

- トークンは短時間で失効するため、`401` が出たら再取得する
- `not enough credits` が出る場合は Web UI で Unlimited トグルがオンか確認する
- トークンは秘匿情報。コミットやログに残さないこと
