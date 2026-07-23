#!/bin/bash
# YouTube Analytics 取得 セットアップスクリプト

echo "=== YouTube Analytics セットアップ ==="

python3 --version || { echo "Python3が必要です"; exit 1; }

pip3 install google-auth google-auth-oauthlib google-api-python-client

echo ""
echo "=== セットアップ完了 ==="
echo "次の手順を行ってください："
echo "1. https://console.cloud.google.com/ でプロジェクトを作成"
echo "2. 'YouTube Data API v3' と 'YouTube Analytics API' を有効化"
echo "3. 'APIとサービス > 認証情報' で OAuth クライアントID（アプリの種類: デスクトップアプリ）を作成"
echo "4. ダウンロードしたJSONを client_secret.json という名前でこのディレクトリに保存"
echo "5. python3 youtube_analytics.py を実行（初回は表示されるURLにアクセスし認可コードを貼り付け）"
