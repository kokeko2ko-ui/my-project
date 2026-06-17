#!/bin/bash
# Pexels ダウンローダー セットアップスクリプト

echo "=== Pexels ダウンローダー セットアップ ==="

# Python確認
python3 --version || { echo "Python3が必要です"; exit 1; }

# 依存ライブラリは標準ライブラリのみ（追加インストール不要）
echo "依存ライブラリ: Python標準ライブラリのみ（追加インストール不要）"

echo ""
echo "=== セットアップ完了 ==="
echo "1. APIキーを取得: https://www.pexels.com/api/ （無料）"
echo "2. 環境変数を設定:"
echo '   export PEXELS_API_KEY="あなたのAPIキー"'
echo "3. 実行例:"
echo '   python3 pexels_download.py "japanese breakfast" --type photo --count 5'
echo '   python3 pexels_download.py "tokyo night" --type video --count 3'
