"""
YouTube 動画のメタ情報と字幕を取得して data/<video_id>.json に保存する。

使い方:
  python fetch_videos.py                 # videos.txt の全 URL
  python fetch_videos.py URL [URL ...]   # 追加 URL も処理
  python fetch_videos.py --force         # 取得済みでも再取得

取得の流れ（上から順に試し、取れたものを使う）:
  メタ情報: yt-dlp（cookie があれば使う） → YouTube Data API v3（YOUTUBE_API_KEY）
  字幕    : yt-dlp の字幕/自動字幕        → youtube-transcript-api

環境変数（すべて任意）:
  YT_COOKIES        Netscape 形式 cookies.txt の中身。GitHub Actions など YouTube に
                    bot 判定される環境ではこれが最も確実
  YOUTUBE_API_KEY   YouTube Data API v3 のキー。cookie なしでもタイトル・概要欄・長さが取れる
"""

import argparse
import json
import os
import sys
import tempfile
from datetime import datetime, timezone

import requests
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import CouldNotRetrieveTranscript, NoTranscriptFound

from common import DATA_DIR, extract_video_id, read_video_urls, save_json

PREFERRED_LANGS = ["ja", "ja-JP", "en", "en-US"]
YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/videos"


def _cookie_file() -> str | None:
    cookies = os.environ.get("YT_COOKIES")
    if not cookies:
        return None
    tmp = tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8")
    tmp.write(cookies)
    tmp.close()
    return tmp.name


def _iso8601_duration_to_sec(value: str) -> int | None:
    """YouTube Data API の PT1H2M3S 形式を秒に変換する。"""
    import re

    m = re.fullmatch(r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", value or "")
    if not m:
        return None
    d, h, mi, s = (int(x) if x else 0 for x in m.groups())
    return d * 86400 + h * 3600 + mi * 60 + s


# ---------------------------------------------------------------- メタ情報

def fetch_metadata_ytdlp(ydl: yt_dlp.YoutubeDL, url: str) -> tuple[dict, dict]:
    """(保存用メタ情報, yt-dlp の生 info) を返す。"""
    info = ydl.extract_info(url, download=False)
    meta = {
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
        "metadata_source": "yt-dlp",
    }
    return meta, info


def fetch_metadata_data_api(video_id: str, api_key: str) -> dict:
    """YouTube Data API v3 でメタ情報を取得する（公式 API なので bot 判定されない）。"""
    resp = requests.get(
        YOUTUBE_API_URL,
        params={"part": "snippet,contentDetails", "id": video_id, "key": api_key},
        timeout=30,
    )
    resp.raise_for_status()
    items = resp.json().get("items") or []
    if not items:
        raise ValueError("動画が見つかりません（非公開・削除済みの可能性）")
    snippet = items[0].get("snippet", {})
    details = items[0].get("contentDetails", {})
    thumbs = snippet.get("thumbnails") or {}
    thumb = (thumbs.get("maxres") or thumbs.get("high") or thumbs.get("default") or {}).get("url", "")
    return {
        "id": video_id,
        "title": snippet.get("title") or "",
        "description": snippet.get("description") or "",
        "channel": snippet.get("channelTitle") or "",
        "duration_sec": _iso8601_duration_to_sec(details.get("duration", "")),
        "upload_date": (snippet.get("publishedAt") or "")[:10].replace("-", ""),
        "url": f"https://www.youtube.com/watch?v={video_id}",
        "thumbnail": thumb,
        "chapters": [],
        "metadata_source": "youtube-data-api",
    }


# ---------------------------------------------------------------- 字幕

def _pick_caption_track(info: dict) -> tuple[dict | None, str, str]:
    """yt-dlp の info から json3 形式の字幕トラックを選ぶ。(track, lang, kind)"""
    for kind in ("subtitles", "automatic_captions"):
        tracks = info.get(kind) or {}
        candidates = PREFERRED_LANGS + [lang for lang in tracks if lang.startswith(("ja", "en"))]
        for lang in candidates:
            for track in tracks.get(lang) or []:
                if track.get("ext") == "json3" and track.get("url"):
                    return track, lang, kind
    return None, "", ""


def parse_json3(payload: bytes | str) -> list[tuple[float, str]]:
    """YouTube の json3 字幕を [(開始秒, テキスト), ...] に変換する。"""
    data = json.loads(payload)
    lines: list[tuple[float, str]] = []
    for ev in data.get("events") or []:
        segs = ev.get("segs") or []
        text = "".join(seg.get("utf8", "") for seg in segs).replace("\n", " ").strip()
        if text:
            lines.append((ev.get("tStartMs", 0) / 1000, text))
    return lines


def _format_lines(lines: list[tuple[float, str]]) -> str:
    return "\n".join(f"[{int(s) // 60:02d}:{int(s) % 60:02d}] {t}" for s, t in lines)


def fetch_transcript_ytdlp(ydl: yt_dlp.YoutubeDL, info: dict) -> tuple[str, str]:
    track, lang, kind = _pick_caption_track(info)
    if not track:
        return "", ""
    payload = ydl.urlopen(track["url"]).read()
    lines = parse_json3(payload)
    return _format_lines(lines), f"{lang} ({'auto' if kind == 'automatic_captions' else 'manual'})"


def fetch_transcript_api(video_id: str) -> tuple[str, str]:
    api = YouTubeTranscriptApi()
    transcript_list = api.list(video_id)
    try:
        transcript = transcript_list.find_transcript(PREFERRED_LANGS)
    except NoTranscriptFound:
        transcript = None
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
    lines = [(snippet.start, snippet.text.strip()) for snippet in fetched]
    return _format_lines(lines), fetched.language_code


# ---------------------------------------------------------------- main

def fetch_one(url: str, video_id: str, ydl: yt_dlp.YoutubeDL, api_key: str | None) -> dict:
    record: dict = {"id": video_id, "url": url, "errors": [], "transcript": "", "transcript_lang": ""}
    info: dict | None = None

    try:
        meta, info = fetch_metadata_ytdlp(ydl, url)
        record.update(meta)
    except Exception as e:  # noqa: BLE001 - 失敗理由を記録してフォールバックへ
        record["errors"].append(f"yt-dlp: {type(e).__name__}: {str(e)[:200]}")
        print(f"  yt-dlp でのメタ情報取得に失敗: {str(e)[:120]}", file=sys.stderr)
        if api_key:
            try:
                record.update(fetch_metadata_data_api(video_id, api_key))
                print("  YouTube Data API でメタ情報を取得しました")
            except Exception as e2:  # noqa: BLE001
                record["errors"].append(f"data-api: {type(e2).__name__}: {str(e2)[:200]}")
                print(f"  YouTube Data API でも失敗: {str(e2)[:120]}", file=sys.stderr)

    if info is not None:
        try:
            record["transcript"], record["transcript_lang"] = fetch_transcript_ytdlp(ydl, info)
        except Exception as e:  # noqa: BLE001
            record["errors"].append(f"yt-dlp-subs: {type(e).__name__}: {str(e)[:200]}")
    if not record["transcript"]:
        try:
            record["transcript"], record["transcript_lang"] = fetch_transcript_api(video_id)
        except (CouldNotRetrieveTranscript, Exception) as e:  # noqa: BLE001
            record["errors"].append(f"transcript-api: {type(e).__name__}")
            print(f"  字幕なし / 取得不可: {type(e).__name__}", file=sys.stderr)

    record["fetched_at"] = datetime.now(timezone.utc).isoformat()
    return record


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
    api_key = os.environ.get("YOUTUBE_API_KEY") or None
    print(f"cookie: {'あり' if cookiefile else 'なし'} / YouTube Data API: {'あり' if api_key else 'なし'}")

    ydl_opts: dict = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "writesubtitles": True,
        "writeautomaticsub": True,
        "subtitleslangs": PREFERRED_LANGS,
    }
    if cookiefile:
        ydl_opts["cookiefile"] = cookiefile

    failures = 0
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
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
            record = fetch_one(url, video_id, ydl, api_key)
            if not record.get("title") and not record.get("transcript"):
                failures += 1
                print(f"  ✗ {video_id}: タイトルも字幕も取れませんでした（保存しません）")
                continue
            save_json(out_path, record)
            print(
                f"  ✓ 保存: {out_path.name} "
                f"(メタ情報: {record.get('metadata_source', 'なし')}, "
                f"字幕: {record.get('transcript_lang') or 'なし'}, {len(record['transcript'])} 文字)"
            )

    if failures:
        print(
            f"\n{failures} 本の動画で取得に失敗しました。"
            "YT_COOKIES（cookie）または YOUTUBE_API_KEY の設定を検討してください（README 参照）。"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
