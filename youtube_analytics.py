"""
YouTube Analytics 取得スクリプト
使い方:
  1. setup_youtube_analytics.sh を実行して依存関係をインストール
  2. Google Cloud Console で OAuth クライアント（デスクトップアプリ）を作成し、
     client_secret.json としてこのディレクトリに保存
  3. python3 youtube_analytics.py を実行
     初回はブラウザで表示される認証URLにアクセスし、認可コードを貼り付ける
     （token.json に認証情報がキャッシュされ、次回以降は再認証不要）
"""

import argparse
import datetime
import os
import sys
from urllib.parse import urlparse, parse_qs

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

SCOPES = [
    "https://www.googleapis.com/auth/yt-analytics.readonly",
    "https://www.googleapis.com/auth/youtube.readonly",
]
CLIENT_SECRET_FILE = "client_secret.json"
TOKEN_FILE = "token.json"


def get_credentials():
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CLIENT_SECRET_FILE):
                sys.exit(
                    f"{CLIENT_SECRET_FILE} が見つかりません。"
                    "Google Cloud Console で OAuth クライアント（デスクトップアプリ）を作成し、"
                    "ダウンロードしたJSONをこのファイル名で配置してください。"
                )
            flow = InstalledAppFlow.from_client_secrets_file(
                CLIENT_SECRET_FILE, SCOPES, redirect_uri="http://localhost"
            )
            auth_url, _ = flow.authorization_url(access_type="offline", prompt="consent")
            print("\n以下のURLをブラウザで開いて認可してください:")
            print(auth_url)
            print(
                "\n認可後、ブラウザは http://localhost/?code=... にリダイレクトされます"
                "（ページ自体は読み込めなくてOKです）。"
                "そのアドレスバーのURL全体、または code= の値をここに貼り付けてください:"
            )
            pasted = input("> ").strip()
            if pasted.startswith("http"):
                code = parse_qs(urlparse(pasted).query)["code"][0]
            else:
                code = pasted
            flow.fetch_token(code=code)
            creds = flow.credentials
        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())

    return creds


def get_channel_id(youtube):
    resp = youtube.channels().list(part="id", mine=True).execute()
    return resp["items"][0]["id"]


def fetch_analytics(youtube_analytics, channel_id, start_date, end_date):
    resp = (
        youtube_analytics.reports()
        .query(
            ids=f"channel=={channel_id}",
            startDate=start_date,
            endDate=end_date,
            metrics="views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,likes,comments,shares",
            dimensions="day",
            sort="day",
        )
        .execute()
    )
    return resp


def fetch_top_videos(youtube_analytics, channel_id, start_date, end_date, max_results=10):
    resp = (
        youtube_analytics.reports()
        .query(
            ids=f"channel=={channel_id}",
            startDate=start_date,
            endDate=end_date,
            metrics="views,estimatedMinutesWatched,averageViewDuration,likes,comments",
            dimensions="video",
            sort="-views",
            maxResults=max_results,
        )
        .execute()
    )
    return resp


def print_report(title, resp):
    print(f"\n=== {title} ===")
    headers = [h["name"] for h in resp.get("columnHeaders", [])]
    print(" | ".join(headers))
    for row in resp.get("rows", []):
        print(" | ".join(str(v) for v in row))


def main():
    parser = argparse.ArgumentParser(description="YouTube チャンネルのアナリティクスを取得")
    parser.add_argument("--days", type=int, default=28, help="直近何日分を取得するか（デフォルト28日）")
    args = parser.parse_args()

    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=args.days)

    creds = get_credentials()
    youtube = build("youtube", "v3", credentials=creds)
    youtube_analytics = build("youtubeAnalytics", "v2", credentials=creds)

    channel_id = get_channel_id(youtube)
    print(f"チャンネルID: {channel_id}")
    print(f"期間: {start_date} 〜 {end_date}")

    daily = fetch_analytics(youtube_analytics, channel_id, str(start_date), str(end_date))
    print_report("日別サマリー", daily)

    top_videos = fetch_top_videos(youtube_analytics, channel_id, str(start_date), str(end_date))
    print_report("動画別（再生数トップ10）", top_videos)


if __name__ == "__main__":
    main()
