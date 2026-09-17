"""
data/<video_id>.json（メタ情報 + 字幕）を Claude で構造化レシピに変換し、
recipes/<video_id>.json に保存する。

使い方:
  python make_recipes.py            # 未変換の動画だけ処理
  python make_recipes.py --force    # 変換済みも作り直す

環境変数:
  ANTHROPIC_API_KEY  必須
"""

import argparse
import sys
from datetime import datetime, timezone

import anthropic
from pydantic import BaseModel, Field

from common import DATA_DIR, RECIPES_DIR, format_duration, load_json, save_json

MODEL = "claude-opus-5"


class Ingredient(BaseModel):
    name: str = Field(description="材料名")
    amount: str = Field(description="分量（例: 200g, 大さじ1, 1/2個）。不明なら「適量」")
    note: str = Field(default="", description="下処理や代用品などの補足。なければ空文字")


class Step(BaseModel):
    order: int = Field(description="1 から始まる手順番号")
    text: str = Field(description="手順の説明。1手順1動作で簡潔に")
    point: str = Field(default="", description="この手順での失敗しないポイント。なければ空文字")
    timestamp: str = Field(default="", description="動画内の該当時間 mm:ss。不明なら空文字")


class Recipe(BaseModel):
    is_recipe: bool = Field(description="この動画が料理の作り方を紹介する動画なら true")
    not_recipe_reason: str = Field(default="", description="is_recipe が false の理由。true なら空文字")
    dish_name: str = Field(description="料理名（短く、検索しやすい名前）")
    summary: str = Field(description="どんな料理か 1〜2 文で")
    servings: str = Field(description="何人前か（例: 2人分）。不明なら推定して「（推定）」を付ける")
    prep_time_min: int = Field(description="下ごしらえの目安時間（分）")
    cook_time_min: int = Field(description="調理の目安時間（分）")
    total_time_min: int = Field(description="合計の目安時間（分）")
    calories_per_serving: int = Field(description="1人前のおおよそのカロリー（kcal）。材料から推定する")
    calories_note: str = Field(description="カロリーの根拠や注意（例: 主要材料からの推定値）")
    ingredients: list[Ingredient]
    steps: list[Step]
    tips: list[str] = Field(description="全体を通したコツ・アレンジ・保存方法など 3〜6 個")
    tags: list[str] = Field(description="ジャンル・主材料・シーンなどのタグ（例: 和食, 鶏肉, 時短）")


SYSTEM_PROMPT = """あなたは家庭料理のレシピ編集者です。
YouTube 料理動画のタイトル・概要欄・字幕（文字起こし）から、家庭で再現しやすいレシピを日本語で書き起こします。

守ること:
- 動画で実際に語られている材料・分量・手順を最優先で使う。
- 分量や時間が動画で明示されていない場合は、料理の常識から推定し、その値には「（推定）」と付ける。
- 手順は「1手順1動作」で、番号順に並べる。火加減・時間・見た目の目安を残す。
- 字幕には音声認識の誤りが含まれることがある。文脈から明らかに料理用語の聞き間違いなら正しい語に直す。
- 料理と無関係な動画（雑談・商品紹介のみ等）なら is_recipe を false にし、理由を書く。その場合も他の項目は空や 0 で埋めてよい。
- カロリーは主要材料から 1人前を概算し、根拠を calories_note に書く。
- 出力は日本語。"""


def build_user_prompt(video: dict) -> str:
    parts = [
        f"タイトル: {video.get('title', '')}",
        f"チャンネル: {video.get('channel', '')}",
        f"動画の長さ: {format_duration(video.get('duration_sec'))}",
        f"URL: {video.get('url', '')}",
    ]
    if video.get("chapters"):
        chapters = "\n".join(
            f"  - {format_duration(c.get('start_sec'))} {c.get('title', '')}"
            for c in video["chapters"]
        )
        parts.append(f"チャプター:\n{chapters}")
    parts.append(f"概要欄:\n{video.get('description', '') or '（なし）'}")
    transcript = video.get("transcript") or ""
    parts.append(
        f"字幕（[mm:ss] は動画内の時間）:\n{transcript or '（字幕なし。概要欄とタイトルから作成してください）'}"
    )
    parts.append("上記からレシピを作成してください。")
    return "\n\n".join(parts)


def make_recipe(client: anthropic.Anthropic, video: dict) -> Recipe:
    response = client.messages.parse(
        model=MODEL,
        max_tokens=16000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": build_user_prompt(video)}],
        output_format=Recipe,
    )
    if response.stop_reason == "refusal":
        detail = response.stop_details.explanation if response.stop_details else ""
        raise RuntimeError(f"Claude がリクエストを拒否しました: {detail}")
    if response.parsed_output is None:
        raise RuntimeError(f"構造化出力を取得できませんでした (stop_reason={response.stop_reason})")
    return response.parsed_output


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="変換済みも作り直す")
    args = parser.parse_args()

    data_files = sorted(DATA_DIR.glob("*.json")) if DATA_DIR.exists() else []
    if not data_files:
        print("data/ に動画データがありません。先に fetch_videos.py を実行してください。")
        return 0

    try:
        client = anthropic.Anthropic()
    except anthropic.AnthropicError as e:
        raise SystemExit(f"Anthropic クライアントを初期化できません（ANTHROPIC_API_KEY を確認）: {e}")
    errors = 0
    for path in data_files:
        out_path = RECIPES_DIR / path.name
        if out_path.exists() and not args.force:
            print(f"変換済み: {path.stem}")
            continue
        video = load_json(path)
        print(f"レシピ化中: {path.stem} - {video.get('title', '')[:40]}")
        try:
            recipe = make_recipe(client, video)
        except anthropic.RateLimitError as e:
            print(f"  レート制限: {e.message}", file=sys.stderr)
            errors += 1
            continue
        except anthropic.APIStatusError as e:
            print(f"  API エラー ({e.status_code}): {e.message}", file=sys.stderr)
            errors += 1
            continue
        except anthropic.APIConnectionError as e:
            print(f"  接続エラー: {e}", file=sys.stderr)
            errors += 1
            continue
        except RuntimeError as e:
            print(f"  {e}", file=sys.stderr)
            errors += 1
            continue

        record = recipe.model_dump()
        record["source"] = {
            "video_id": video.get("id", path.stem),
            "url": video.get("url", ""),
            "title": video.get("title", ""),
            "channel": video.get("channel", ""),
            "duration": format_duration(video.get("duration_sec")),
            "duration_sec": video.get("duration_sec"),
            "upload_date": video.get("upload_date", ""),
            "thumbnail": video.get("thumbnail", ""),
            "has_transcript": bool(video.get("transcript")),
        }
        record["generated_at"] = datetime.now(timezone.utc).isoformat()
        record["model"] = MODEL
        save_json(out_path, record)
        mark = "✓" if recipe.is_recipe else "－(料理動画ではない)"
        print(f"  {mark} {recipe.dish_name}")

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
