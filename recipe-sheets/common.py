"""パイプライン共通のパス定義とユーティリティ。"""

import json
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
VIDEOS_FILE = BASE_DIR / "videos.txt"
DATA_DIR = BASE_DIR / "data"        # 動画メタ情報 + 字幕（fetch_videos.py の出力）
RECIPES_DIR = BASE_DIR / "recipes"  # 構造化レシピ（make_recipes.py の出力）

_VIDEO_ID_RE = re.compile(
    r"(?:v=|youtu\.be/|/shorts/|/embed/|/live/)([A-Za-z0-9_-]{11})"
)


def extract_video_id(url: str) -> str | None:
    """YouTube の各種 URL 形式から 11 文字の動画 ID を取り出す。"""
    url = url.strip()
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", url):
        return url
    m = _VIDEO_ID_RE.search(url)
    return m.group(1) if m else None


def read_video_urls(extra: list[str] | None = None) -> list[str]:
    """videos.txt と追加引数から URL 一覧を返す（重複は除く、順序は維持）。"""
    urls: list[str] = []
    if VIDEOS_FILE.exists():
        for line in VIDEOS_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                urls.append(line)
    for u in extra or []:
        for token in u.replace(",", "\n").splitlines():
            token = token.strip()
            if token:
                urls.append(token)
    seen: set[str] = set()
    out: list[str] = []
    for u in urls:
        vid = extract_video_id(u) or u
        if vid not in seen:
            seen.add(vid)
            out.append(u)
    return out


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def format_duration(seconds: int | float | None) -> str:
    if not seconds:
        return ""
    seconds = int(seconds)
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"
