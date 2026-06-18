"""
Pexels 写真・動画 検索＆ダウンロードスクリプト
使い方:
    export PEXELS_API_KEY="あなたのAPIキー"
    python3 pexels_download.py "japanese breakfast" --type photo --count 5
    python3 pexels_download.py "tokyo night" --type video --count 3

APIキーの取得: https://www.pexels.com/api/ （無料・登録のみ）
"""

import argparse
import os
import sys
import urllib.request
import urllib.parse
import json

API_BASE = "https://api.pexels.com"

# Cloudflare が Python標準のUser-Agentをブロック(error 1010)するため、
# ブラウザ風のUser-Agentを付与する
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)


def get_api_key():
    key = os.environ.get("PEXELS_API_KEY")
    if not key:
        print("エラー: 環境変数 PEXELS_API_KEY が設定されていません。")
        print('  export PEXELS_API_KEY="あなたのAPIキー"')
        print("  APIキーの取得: https://www.pexels.com/api/")
        sys.exit(1)
    return key


def api_get(path, params, api_key):
    """Pexels API に GET リクエストを送る"""
    url = f"{API_BASE}{path}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(
        url, headers={"Authorization": api_key, "User-Agent": USER_AGENT}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"APIエラー ({e.code}): {e.read().decode('utf-8', 'ignore')}")
        sys.exit(1)


def download_file(url, filepath):
    """URLからファイルをダウンロード"""
    print(f"  ダウンロード中: {filepath}")
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req) as resp, open(filepath, "wb") as f:
        f.write(resp.read())


def search_photos(query, count, api_key, out_dir):
    data = api_get(
        "/v1/search",
        {"query": query, "per_page": count, "orientation": "landscape"},
        api_key,
    )
    photos = data.get("photos", [])
    if not photos:
        print("写真が見つかりませんでした。")
        return
    print(f"{len(photos)} 件の写真が見つかりました。")
    for i, photo in enumerate(photos, 1):
        src = photo["src"]["original"]
        ext = os.path.splitext(urllib.parse.urlparse(src).path)[1] or ".jpg"
        filepath = os.path.join(out_dir, f"photo_{i:02d}{ext}")
        download_file(src, filepath)
        print(f"    撮影者: {photo.get('photographer', '不明')}")


def search_videos(query, count, api_key, out_dir):
    data = api_get(
        "/videos/search",
        {"query": query, "per_page": count},
        api_key,
    )
    videos = data.get("videos", [])
    if not videos:
        print("動画が見つかりませんでした。")
        return
    print(f"{len(videos)} 件の動画が見つかりました。")
    for i, video in enumerate(videos, 1):
        # 最高画質のファイルを選択
        files = sorted(
            video.get("video_files", []),
            key=lambda f: (f.get("width") or 0) * (f.get("height") or 0),
            reverse=True,
        )
        if not files:
            continue
        src = files[0]["link"]
        filepath = os.path.join(out_dir, f"video_{i:02d}.mp4")
        download_file(src, filepath)
        print(f"    制作者: {video.get('user', {}).get('name', '不明')}")


def main():
    parser = argparse.ArgumentParser(description="Pexels 写真・動画ダウンローダー")
    parser.add_argument("query", help="検索キーワード（英語推奨）")
    parser.add_argument(
        "--type",
        choices=["photo", "video"],
        default="photo",
        help="取得するメディアの種類 (デフォルト: photo)",
    )
    parser.add_argument(
        "--count", type=int, default=5, help="取得件数 (デフォルト: 5)"
    )
    parser.add_argument(
        "--out", default="pexels_downloads", help="保存先ディレクトリ"
    )
    args = parser.parse_args()

    api_key = get_api_key()
    os.makedirs(args.out, exist_ok=True)

    print(f'「{args.query}」を Pexels で検索しています... (type={args.type})')
    if args.type == "photo":
        search_photos(args.query, args.count, api_key, args.out)
    else:
        search_videos(args.query, args.count, api_key, args.out)

    print(f"\n完了！ 保存先: {os.path.abspath(args.out)}")
    print("※ Pexels の素材は無料で利用できますが、可能な限りクレジット表記を推奨します。")


if __name__ == "__main__":
    main()
