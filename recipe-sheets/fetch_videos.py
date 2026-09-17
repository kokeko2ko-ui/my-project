"""
YouTube 動画のメタ情報と字幕を取得して data/<video_id>.json に保存する。

使い方:
  python fetch_videos.py                 # videos.txt の全 URL
  python fetch_videos.py URL [URL ...]   # 追加 URL も処理
  python fetch_videos.py --force         # 取得済みでも再取得

環境変数:
  YT_COOKIES  Netscape 形式の cookies.txt の中身（YouTube に bot 判定された時の回避用・任意）
"""

import argparse
import os
import sys
import tempfile
from datetime import datetime, timezone

import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    CouldNotRetrieveTranscript,
    NoTranscriptFound,
    TranscriptsDisabled,
)

from common import DATA_DIR, extract_video_id, read_video_urls, save_json

PREFERRED_LANGS = ["ja", "ja-JP", "en", "en-US"]


def _cookie_file() -> str | None:
    cookies = os.environ.get("YT_COOKIES")
    if not cookies:
        return None
    tmp = tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8")
    tmp.write(cookies)
    tmp.close()
    return tmp.name


def fetch_metadata(url: str, cookiefile: str | None) -> dict:
    opts = {"quiet": True, "no_warnings": True, "skip_download": True}
    if cookiefile:
        opts["cookiefile"] = cookiefile
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)
    return {
        "id": info.get("id"),
        "title": info.get("title") or "",
        "description": info.get("description") or "",
        "channel": info.get("channel") or info.get("uploader") or "",
        "duration_sec": info.get("duration"),
        "upload_date": info.get("upload_date") or "",
        "url": info.get("webpage_url") or url,
        "thumbnail": info.get("thumbnail") or "",
        "chapters": [
            {"title": c.get("title", ""), "start_sec": c.get("start_time")}
            for c in (info.get("chapters") or [])
        ],
    }


def fetch_transcript(video_id: str) -> tuple[str, str]:
    """(字幕テキスト, 言語コード) を返す。取得できなければ ("", "")。"""
    api = YouTubeTranscriptApi()
    try:
        transcript_list = api.list(video_id)
    except (TranscriptsDisabled, NoTranscriptFound, CouldNotRetrieveTranscript) as e:
        print(f"  字幕なし: {type(e).__name__}", file=sys.stderr)
        return "", ""

    transcript = None
    try:
        transcript = transcript_list.find_transcript(PREFERRED_LANGS)
    except NoTranscriptFound:
        # 希望言語がなければ、翻訳可能なものを日本語へ翻訳する
        for t in transcript_list:
            if t.is_translatable:
                try:
                    transcript = t.translate("ja")
                    break
                except Exception:  # noqa: BLE001 - 翻訳不可は次の候補へ
                    continue
        if transcript is None:
            transcript = next(iter(transcript_list), None)
    if transcript is None:
        return "", ""

    fetched = transcript.fetch()
    lines = []
    for snippet in fetched:
        start = int(snippet.start)
        lines.append(f"[{start // 60:02d}:{start % 60:02d}] {snippet.text.strip()}")
    return "\n".join(lines), fetched.language_code


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("urls", nargs="*", help="追加で処理する YouTube URL")
    parser.add_argument("--force", action="store_true", help="取得済みでも再取得する")
    args = parser.parse_args()

    urls = read_video_urls(args.urls)
    if not urls:
        print("処理する URL がありません（videos.txt を確認してください）")
        return 0

    cookiefile = _cookie_file()
    failures = 0
    for url in urls:
        video_id = extract_video_id(url)
        if not video_id:
            print(f"スキップ（YouTube URL として解釈できません）: {url}")
            continue
        out_path = DATA_DIR / f"{video_id}.json"
        if out_path.exists() and not args.force:
            print(f"取得済み: {video_id}")
            continue

        print(f"取得中: {video_id} ({url})")
        record: dict = {"id": video_id, "url": url, "errors": []}
        try:
            record.update(fetch_metadata(url, cookiefile))
        except Exception as e:  # noqa: BLE001 - 失敗理由を記録して次へ進む
            record["errors"].append(f"metadata: {type(e).__name__}: {e}")
            print(f"  メタ情報の取得に失敗: {e}", file=sys.stderr)

        try:
            transcript, lang = fetch_transcript(video_id)
            record["transcript"] = transcript
            record["transcript_lang"] = lang
        except Exception as e:  # noqa: BLE001
            record["transcript"] = ""
            record["transcript_lang"] = ""
            record["errors"].append(f"transcript: {type(e).__name__}: {e}")
            print(f"  字幕の取得に失敗: {e}", file=sys.stderr)

        record["fetched_at"] = datetime.now(timezone.utc).isoformat()
        if not record.get("title") and not record.get("transcript"):
            failures += 1
            print(f"  ✗ {video_id}: タイトルも字幕も取れませんでした（保存しません）")
            continue
        save_json(out_path, record)
        print(f"  ✓ 保存: {out_path.name} (字幕 {len(record.get('transcript') or '')} 文字)")

    if failures:
        print(f"\n{failures} 本の動画で取得に失敗しました。YT_COOKIES の設定を検討してください。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
