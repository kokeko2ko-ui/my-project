#!/usr/bin/env python3
"""
YouTube チャンネル分析ツール（感動系チャンネル用・標準ライブラリのみ）

使い方（どちらか／両方）:
  # 1) 公開データのみ（タイトル・再生数・高評価・コメント数）: APIキーだけでOK
  YT_API_KEY=xxxx python3 tools/yt_analyze.py

  # 2) 非公開の分析データ（平均視聴時間・視聴率・30秒維持率・流入元・登録者増）:
  #    【推奨】リフレッシュトークン方式。一度発行すれば期限切れなしで使い回せる。
  YT_CLIENT_ID=xxx.apps.googleusercontent.com \
  YT_CLIENT_SECRET=GOCSPX-xxxx \
  YT_REFRESH_TOKEN=1//xxxx \
  python3 tools/yt_analyze.py

  #    【簡易】アクセストークン直指定。約1時間で失効するので毎回貼り直しが必要。
  YT_ACCESS_TOKEN=ya29.xxxx python3 tools/yt_analyze.py

  #    リフレッシュトークンの取り方は tools/yt_auth_setup.md を参照。

  # 3) Studio からエクスポートした CSV（インプレッション・クリック率）を突き合わせる
  YT_ACCESS_TOKEN=... YT_STUDIO_CSV=/path/to/export.csv python3 tools/yt_analyze.py

環境変数:
  YT_CHANNEL_ID   既定: UCTHT3Lm2X7bO-IphKqgvn3Q（人生いろいろ）
  YT_MAX          取得する動画数（既定 50）
  YT_OUT          出力 Markdown のパス（既定 /mnt/user-data/outputs/yt_report.md）

注意: アクセストークンは約1時間で失効します。読み取り専用スコープのみ使用。
      https://myaccount.google.com/permissions からいつでも取り消せます。
"""
import csv
import datetime as dt
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

API = "https://www.googleapis.com/youtube/v3"
ANALYTICS = "https://youtubeanalytics.googleapis.com/v2/reports"

CHANNEL_ID = os.environ.get("YT_CHANNEL_ID", "UCTHT3Lm2X7bO-IphKqgvn3Q")
API_KEY = os.environ.get("YT_API_KEY", "").strip()
TOKEN = os.environ.get("YT_ACCESS_TOKEN", "").strip()
CLIENT_ID = os.environ.get("YT_CLIENT_ID", "").strip()
CLIENT_SECRET = os.environ.get("YT_CLIENT_SECRET", "").strip()
REFRESH_TOKEN = os.environ.get("YT_REFRESH_TOKEN", "").strip()
STUDIO_CSV = os.environ.get("YT_STUDIO_CSV", "").strip()
MAX_VIDEOS = int(os.environ.get("YT_MAX", "50"))
OUT = os.environ.get("YT_OUT", "/mnt/user-data/outputs/yt_report.md")

# バズ基準（離婚届×レンジ）に照らした簡易タグ付け
TYPE_RULES = [
    ("夫婦×危機", ["離婚", "別居", "夫婦", "夫", "妻", "旦那", "嫁"]),
    ("親子", ["父", "母", "息子", "娘", "親"]),
    ("職業/他者", ["医", "看護", "介護", "保育", "教師", "先生", "職人", "師", "運転手", "店"]),
    ("死別/遺品", ["亡き", "遺", "最後", "葬", "死"]),
]


def refresh_access_token():
    """リフレッシュトークンから有効なアクセストークンを取り直す（期限切れの心配なし）"""
    body = urllib.parse.urlencode({
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": REFRESH_TOKEN,
        "grant_type": "refresh_token",
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=body,
                                 headers={"Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            tok = json.loads(r.read().decode("utf-8")).get("access_token", "")
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:300]
        raise RuntimeError(
            "リフレッシュトークンからアクセストークンを取得できませんでした。\n"
            "YT_CLIENT_ID / YT_CLIENT_SECRET / YT_REFRESH_TOKEN を確認してください。\n"
            f"Google の応答: {detail}"
        ) from None
    if not tok:
        raise RuntimeError("アクセストークンが返りませんでした")
    print("[auth] リフレッシュトークンからアクセストークンを再発行しました", file=sys.stderr)
    return tok


def _get(url, params, use_token=False):
    q = dict(params)
    headers = {"Accept": "application/json"}
    if use_token:
        if not TOKEN:
            raise RuntimeError("YT_ACCESS_TOKEN が必要です")
        headers["Authorization"] = f"Bearer {TOKEN}"
    elif API_KEY:
        q["key"] = API_KEY
    elif TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    else:
        raise RuntimeError(
            "YT_API_KEY / YT_ACCESS_TOKEN / (YT_CLIENT_ID+YT_CLIENT_SECRET+YT_REFRESH_TOKEN) "
            "のいずれか、または YT_STUDIO_CSV を設定してください。詳細: tools/yt_auth_setup.md")
    full = url + "?" + urllib.parse.urlencode(q, doseq=True)
    req = urllib.request.Request(full, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        raise RuntimeError(f"HTTP {e.code} {url}\n{body[:500]}") from None


def list_videos():
    ch = _get(f"{API}/channels", {"part": "contentDetails,snippet,statistics", "id": CHANNEL_ID})
    items = ch.get("items") or []
    if not items:
        raise RuntimeError("チャンネルが見つかりません: " + CHANNEL_ID)
    uploads = items[0]["contentDetails"]["relatedPlaylists"]["uploads"]
    ch_stats = items[0].get("statistics", {})
    ids, token = [], None
    while len(ids) < MAX_VIDEOS:
        p = {"part": "contentDetails", "playlistId": uploads, "maxResults": 50}
        if token:
            p["pageToken"] = token
        res = _get(f"{API}/playlistItems", p)
        ids += [i["contentDetails"]["videoId"] for i in res.get("items", [])]
        token = res.get("nextPageToken")
        if not token:
            break
    ids = ids[:MAX_VIDEOS]
    videos = []
    for i in range(0, len(ids), 50):
        res = _get(f"{API}/videos", {"part": "snippet,contentDetails,statistics", "id": ",".join(ids[i:i + 50])})
        for v in res.get("items", []):
            sn, st = v["snippet"], v.get("statistics", {})
            videos.append({
                "id": v["id"],
                "title": sn["title"],
                "published": sn["publishedAt"][:10],
                "duration": v["contentDetails"].get("duration", ""),
                "views": int(st.get("viewCount", 0)),
                "likes": int(st.get("likeCount", 0)),
                "comments": int(st.get("commentCount", 0)),
            })
    return ch_stats, videos


def analytics_for(video):
    """YouTube Analytics API（要トークン）: 平均視聴時間・視聴率・30秒/2分維持率・流入元"""
    today = dt.date.today().isoformat()
    base = {"ids": f"channel=={CHANNEL_ID}", "startDate": video["published"], "endDate": today,
            "filters": f"video=={video['id']}"}
    out = {}
    m = _get(ANALYTICS, {**base, "metrics": "views,estimatedMinutesWatched,averageViewDuration,"
                                              "averageViewPercentage,likes,comments,shares,subscribersGained"}, True)
    if m.get("rows"):
        cols = [c["name"] for c in m["columnHeaders"]]
        out.update(dict(zip(cols, m["rows"][0])))
    # 維持率カーブ（elapsedVideoTimeRatio 0.00〜1.00）
    r = _get(ANALYTICS, {**base, "metrics": "audienceWatchRatio", "dimensions": "elapsedVideoTimeRatio"}, True)
    curve = {float(row[0]): float(row[1]) for row in r.get("rows", [])}
    def at(ratio):
        if not curve:
            return None
        k = min(curve, key=lambda x: abs(x - ratio))
        return round(curve[k] * 100, 1)
    dur = out.get("averageViewDuration")
    # 30秒・2分が動画全体の何割かは尺に依存するので、代表点として 5%・10%・25%・50% を記録
    out["retain_5pct"] = at(0.05)
    out["retain_10pct"] = at(0.10)
    out["retain_25pct"] = at(0.25)
    out["retain_50pct"] = at(0.50)
    # 流入元
    t = _get(ANALYTICS, {**base, "metrics": "views", "dimensions": "insightTrafficSourceType", "sort": "-views"}, True)
    out["traffic"] = ", ".join(f"{row[0]}:{int(row[1])}" for row in t.get("rows", [])[:4])
    return out


# Studio CSV の列名ゆらぎ吸収（日本語/英語・表記ゆれ・年度による変更に耐える）
CSV_COLS = {
    "id":       ["コンテンツ", "動画", "Content", "Video"],
    "title":    ["動画のタイトル", "タイトル", "Video title", "Title"],
    "published":["動画の公開時刻", "公開日", "Video publish time", "Publish time"],
    "views":    ["視聴回数", "Views"],
    "impressions": ["インプレッション数", "Impressions"],
    "ctr":      ["インプレッションのクリック率 (%)", "インプレッションのクリック率（%）",
                 "Impressions click-through rate (%)"],
    "avg_dur":  ["平均視聴時間", "Average view duration"],
    "watch_hours": ["総再生時間（時間）", "総再生時間 (時間)", "Watch time (hours)"],
    "subs":     ["チャンネル登録者", "登録者", "Subscribers"],
    "likes":    ["高評価数", "高評価", "Likes"],
}


def _pick(row, keys):
    """列名のゆらぎを吸収して値を取り出す（完全一致→前方一致の順）"""
    for k in keys:
        if k in row and row[k] not in (None, ""):
            return row[k].strip()
    for k in keys:
        for actual in row:
            if actual and actual.strip().startswith(k):
                v = row[actual]
                if v not in (None, ""):
                    return v.strip()
    return ""


def _to_int(v):
    try:
        return int(float(str(v).replace(",", "").strip()))
    except (ValueError, AttributeError):
        return 0


def _dur_to_sec(v):
    """'0:04:12' や '4:12' を秒に。空なら ''"""
    v = (v or "").strip()
    if not v or ":" not in v:
        return ""
    parts = [int(x) for x in v.split(":") if x.isdigit()]
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    return ""


def load_studio_csv(path):
    """Studio「コンテンツ」エクスポートCSV（列名は日本語/英語どちらでも）"""
    rows = {}
    if not path or not os.path.exists(path):
        return rows
    with open(path, encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            keyid = _pick(r, CSV_COLS["id"])
            if not keyid or keyid in ("合計", "Total"):
                continue
            rows[keyid] = {
                "impressions": _pick(r, CSV_COLS["impressions"]),
                "ctr": _pick(r, CSV_COLS["ctr"]),
                "csv_title": _pick(r, CSV_COLS["title"]),
                "csv_published": _pick(r, CSV_COLS["published"])[:10],
                "csv_views": _to_int(_pick(r, CSV_COLS["views"])),
                "csv_avg_dur": _dur_to_sec(_pick(r, CSV_COLS["avg_dur"])),
                "csv_watch_hours": _pick(r, CSV_COLS["watch_hours"]),
                "csv_subs": _pick(r, CSV_COLS["subs"]),
                "csv_likes": _to_int(_pick(r, CSV_COLS["likes"])),
            }
    return rows


def videos_from_csv(studio):
    """APIキーもトークンも無いとき、CSV だけで動画一覧を組み立てる（認証不要モード）"""
    videos = []
    for vid, d in studio.items():
        videos.append({
            "id": vid,
            "title": d.get("csv_title") or vid,
            "published": d.get("csv_published", ""),
            "duration": "",
            "views": d.get("csv_views", 0),
            "likes": d.get("csv_likes", 0),
            "comments": 0,
            "averageViewDuration": d.get("csv_avg_dur", ""),
            "impressions": d.get("impressions", ""),
            "ctr": d.get("ctr", ""),
        })
    return videos


def tag_type(title):
    for name, kws in TYPE_RULES:
        if any(k in title for k in kws):
            return name
    return "その他"


def iso_dur_to_min(s):
    # PT17M36S -> 17.6
    import re
    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", s or "")
    if not m:
        return ""
    h, mi, se = (int(x) if x else 0 for x in m.groups())
    return round(h * 60 + mi + se / 60, 1)


def main():
    global TOKEN
    if not TOKEN and CLIENT_ID and CLIENT_SECRET and REFRESH_TOKEN:
        TOKEN = refresh_access_token()
    studio = load_studio_csv(STUDIO_CSV)
    csv_only = not TOKEN and not API_KEY and bool(studio)
    if csv_only:
        print(f"[info] 認証なしモード: Studio CSV の {len(studio)} 本だけで集計します",
              file=sys.stderr)
        ch_stats, videos = {}, videos_from_csv(studio)
    else:
        ch_stats, videos = list_videos()
    has_token = bool(TOKEN)
    if not has_token and not csv_only:
        print("[info] トークン未設定のため公開データのみ取得します"
              "（平均視聴時間・維持率・流入元は出ません）", file=sys.stderr)
    if csv_only:
        print("[info] 維持率カーブと流入元は Studio CSV に含まれないため出ません",
              file=sys.stderr)
    for v in videos:
        v["type"] = tag_type(v["title"])
        v["min"] = iso_dur_to_min(v["duration"]) if v.get("duration") else ""
        for k, val in studio.get(v["id"], {}).items():
            if not k.startswith("csv_"):
                v[k] = val
        if has_token:
            try:
                v.update(analytics_for(v))
            except Exception as e:  # noqa: BLE001
                v["analytics_error"] = str(e)[:120]
    videos.sort(key=lambda x: -x["views"])
    med = sorted(x["views"] for x in videos)[len(videos) // 2] if videos else 0

    lines = [f"# チャンネル分析レポート（{dt.date.today()}）", "",
             f"- チャンネル登録者: {ch_stats.get('subscriberCount', '?')} / 総再生: {ch_stats.get('viewCount', '?')} / 動画数: {ch_stats.get('videoCount', '?')}",
             f"- 対象: 直近 {len(videos)} 本 / 再生数の中央値: {med}", ""]
    head = "| # | 公開日 | 尺(分) | 型 | 再生 | 中央値比 | 高評価 | コメント |"
    sep = "|---|---|---|---|---|---|---|---|"
    if has_token:
        head += " 平均視聴(秒) | 視聴率% | 維持5% | 維持10% | 維持25% | 登録増 | 流入元 |"
        sep += "---|---|---|---|---|---|---|"
    if csv_only:
        head += " 平均視聴(秒) |"
        sep += "---|"
    if studio:
        head += " インプ | CTR% |"
        sep += "---|---|"
    head += " タイトル |"
    sep += "---|"
    lines += [head, sep]
    for i, v in enumerate(videos, 1):
        row = [str(i), v["published"], str(v["min"]), v["type"], str(v["views"]),
               f"{(v['views'] / med):.1f}x" if med else "-", str(v["likes"]), str(v["comments"])]
        if has_token:
            row += [str(v.get("averageViewDuration", "")), str(v.get("averageViewPercentage", "")),
                    str(v.get("retain_5pct", "")), str(v.get("retain_10pct", "")), str(v.get("retain_25pct", "")),
                    str(v.get("subscribersGained", "")), v.get("traffic", v.get("analytics_error", ""))]
        if csv_only:
            row += [str(v.get("averageViewDuration", ""))]
        if studio:
            row += [str(v.get("impressions", "")), str(v.get("ctr", ""))]
        row.append(v["title"].replace("|", "｜"))
        lines.append("| " + " | ".join(row) + " |")

    # 型別の平均
    lines += ["", "## 型別サマリー（バズ基準の検証）", "", "| 型 | 本数 | 平均再生 | 最大再生 |", "|---|---|---|---|"]
    by = {}
    for v in videos:
        by.setdefault(v["type"], []).append(v["views"])
    for k, vals in sorted(by.items(), key=lambda kv: -sum(kv[1]) / len(kv[1])):
        lines.append(f"| {k} | {len(vals)} | {sum(vals) // len(vals)} | {max(vals)} |")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print("\n".join(lines))
    print(f"\n[saved] {OUT}")


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as e:
        print("ERROR:", e, file=sys.stderr)
        sys.exit(1)
