#!/bin/bash
# Google Vids 自動生成 セットアップスクリプト

echo "=== Google Vids 自動生成 セットアップ ==="

# Python確認
python3 --version || { echo "Python3が必要です"; exit 1; }

# Playwright インストール
pip3 install playwright

# Chromiumブラウザをインストール
python3 -m playwright install chromium

echo ""
echo "=== セットアップ完了 ==="
echo "以下のコマンドで実行してください："
echo "  python3 google_vids_generate.py"
