"""
YouTube Analytics 取得スクリプト
使い方:
  1. setup_youtube_analytics.sh を実行して依存関係をインストール
  2. Google Cloud Console で OAuth クライアント（デスクトップアプリ）を作成し、
     client_secret.json としてこのディレクトリに保存
  3. python3 youtube_analytics.py --auth-url を実行し、表示されたURLをブラウザで開いて認可する
  4. リダイレクト先（http://localhost/?code=...）のURL、またはcodeの値を
     python3 youtube_analytics.py --code "<貼り付けたURLまたはcode>" で渡す
     （token.json に認証情報がキャッシュされ、次回以降は再認証不要）
  5. 以降は python3 youtube_analytics.py を引数なしで実行するだけでよい
"""

import argparse
import datetime
import json
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
OAUTH_STATE_FILE = ".oauth_state.json"


def require_client_secret():
    if not os.path.exists(CLIENT_SECRET_FILE):
        sys.exit(
            f"{CLIENT_SECRET_FILE} が見つかりません。"
            "Google Cloud Console で OAuth クライアント（デスクトップアプリ）を作成し、"
            "ダウンロードしたJSONをこのファイル名で配置してください。"
        )


def build_flow(code_verifier=None):
    return InstalledAppFlow.from_client_secrets_file(
        CLIENT_SECRET_FILE, SCOPES, redirect_uri="http://localhost", code_verifier=code_verifier
    )


def print_auth_url():
    require_client_secret()
    flow = build_flow()
    auth_url, _ = flow.authorization_url(access_type="offline", prompt="consent")
    with open(OAUTH_STATE_FILE, "w") as f:
        json.dump({"code_verifier": flow.code_verifier}, f)
    print("以下のURLをブラウザで開いて認可してください:")
    print(auth_url)
    print(
        "\n認可後、ブラウザは http://localhost/?code=... にリダイレクトされます"
        "（ページ自体は読み込めなくてOKです）。"
        "そのアドレスバーのURL全体、または code= の値を"
        "`python3 youtube_analytics.py --code \"<貼り付け>\"` で渡してください。"
    )


def exchange_code(pasted):
    require_client_secret()
    if not os.path.exists(OAUTH_STATE_FILE):
        sys.exit("先に --auth-url を実行してください。")
    with open(OAUTH_STATE_FILE) as f:
        code_verifier = json.load(f)["code_verifier"]

    pasted = pasted.strip()
    if pasted.startswith("http"):
        code = parse_qs(urlparse(pasted).query)["code"][0]
    else:
        code = pasted

    flow = build_flow(code_verifier=code_verifier)
    flow.fetch_token(code=code)
    with open(TOKEN_FILE, "w") as f:
        f.write(flow.credentials.to_json())
    os.remove(OAUTH_STATE_FILE)
    print("認証に成功しました。token.json を保存しました。")


def get_credentials():
    if not os.path.exists(TOKEN_FILE):
        sys.exit(
            "token.json がありません。先に --auth-url と --code で認証を完了してください。"
        )
    creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if not creds.valid:
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(TOKEN_FILE, "w") as f:
                f.write(creds.to_json())
        else:
            sys.exit("認証情報が無効です。--auth-url からやり直してください。")
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
    parser.add_argument("--auth-url", action="store_true", help="認証用URLを表示する")
    parser.add_argument("--code", help="認可コード、またはリダイレクト先URL全体")
    args = parser.parse_args()

    if args.auth_url:
        print_auth_url()
        return
    if args.code:
        exchange_code(args.code)
        return

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
