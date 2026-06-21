#!/usr/bin/env python3
"""Higgsfield Unlimited 画像生成ヘルパー（Claude Code フロー用）

ブラウザの Clerk トークンを使って fnf.higgsfield.ai に直接リクエストし、
クレジット消費ゼロ（Unlimited）で画像を生成する。

使い方:
    python3 generate.py --token "eyJ..." --prompt "a cat astronaut" \
        [--ratio 16:9] [--model nano-banana-2] [--resolution 1k]

トークン取得方法:
    ブラウザで https://higgsfield.ai を開き、DevTools(F12) → Console で:
      (async () => (await (window.Clerk||window.__clerk).session.getToken()))()
    出力された eyJ... の文字列を --token に渡す。
"""
import argparse
import json
import sys
import time
import urllib.request
import urllib.error

BASE = "https://fnf.higgsfield.ai"

# 用途 -> (width, height)
RATIOS = {
    "16:9": (1344, 768),
    "9:16": (768, 1344),
    "1:1": (1024, 1024),
    "3:4": (896, 1200),
    "4:3": (1200, 896),
}


def _request(url, token, method="GET", payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        print(f"HTTP {e.code}: {body}", file=sys.stderr)
        if e.code == 401:
            print("→ トークンが期限切れです。再取得してください。", file=sys.stderr)
        sys.exit(1)


def submit(token, prompt, ratio, model, resolution):
    width, height = RATIOS[ratio]
    payload = {
        "params": {
            "prompt": prompt,
            "input_images": [],
            "width": width,
            "height": height,
            "batch_size": 1,
            "aspect_ratio": ratio,
            "is_storyboard": False,
            "is_zoom_control": False,
            "use_unlim": True,
            "resolution": resolution,
        },
        "use_unlim": True,
        "use_seedream_bonus": False,
    }
    data = _request(f"{BASE}/jobs/{model}", token, "POST", payload)
    try:
        return data["job_sets"][0]["jobs"][0]["id"]
    except (KeyError, IndexError):
        print("ジョブ ID を取得できませんでした:", json.dumps(data), file=sys.stderr)
        sys.exit(1)


def poll(token, job_id, max_wait=300):
    waited = 0
    while waited < max_wait:
        time.sleep(10)
        waited += 10
        data = _request(f"{BASE}/jobs/{job_id}/status", token)
        status = data.get("status")
        print(f"  [{waited}s] status={status}", file=sys.stderr)
        if status == "completed":
            return data
        if status in ("failed", "error"):
            print("ジョブ失敗:", json.dumps(data), file=sys.stderr)
            sys.exit(1)
    print("タイムアウトしました。", file=sys.stderr)
    sys.exit(1)


def extract_urls(data):
    urls = []
    for js in data.get("job_sets", []):
        for j in js.get("jobs", []):
            url = j.get("result_url") or j.get("output_url") or j.get("min_url")
            if url:
                urls.append(url)
    # フォールバック: トップレベルの jobs
    if not urls:
        for j in data.get("jobs", []):
            url = j.get("result_url") or j.get("output_url")
            if url:
                urls.append(url)
    return urls


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--token", required=True, help="Clerk JWT トークン (eyJ...)")
    p.add_argument("--prompt", required=True, help="画像生成プロンプト（英語推奨）")
    p.add_argument("--ratio", default="16:9", choices=RATIOS.keys())
    p.add_argument("--model", default="nano-banana-2",
                   help="nano-banana-2 / seedream-v4-5 / seedream-v5-lite / nano-banana")
    p.add_argument("--resolution", default="1k")
    args = p.parse_args()

    print(f"▶ 送信中… model={args.model} ratio={args.ratio}", file=sys.stderr)
    job_id = submit(args.token, args.prompt, args.ratio, args.model, args.resolution)
    print(f"  jobId={job_id}", file=sys.stderr)

    print("▶ 完了待ち（ポーリング）…", file=sys.stderr)
    data = poll(args.token, job_id)

    urls = extract_urls(data)
    print("\n✅ Unlimited 生成完了！ クレジット消費: 0")
    for u in urls:
        print(u)
    if not urls:
        print("URL を抽出できませんでした。生レスポンス:", file=sys.stderr)
        print(json.dumps(data, indent=2), file=sys.stderr)


if __name__ == "__main__":
    main()
