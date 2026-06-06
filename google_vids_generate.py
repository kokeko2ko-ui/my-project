"""
Google Vids 自動動画生成スクリプト
使い方: python3 google_vids_generate.py
"""

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
import time
import sys

GOOGLE_EMAIL = "kokeko2ko@gmail.com"
PROMPT = (
    "Top-down flat lay of a beautiful Japanese breakfast on a wooden table: "
    "fluffy tamagoyaki, steamed rice in a ceramic bowl, miso soup with steam rising, "
    "grilled salmon, pickled vegetables, green tea. "
    "Soft warm morning sunlight, cinematic slow camera drift."
)


def generate_video():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # headless=False でブラウザ表示
        context = browser.new_context()
        page = context.new_page()

        print("Google Vids を開いています...")
        page.goto("https://vids.google.com")
        page.wait_for_load_state("networkidle")

        # ログインが必要な場合
        if "accounts.google.com" in page.url:
            print("Googleアカウントにログインしてください（ブラウザで操作）")
            print(f"メール: {GOOGLE_EMAIL}")
            # メールアドレスを自動入力
            try:
                page.fill('input[type="email"]', GOOGLE_EMAIL)
                page.click('button:has-text("次へ"), #identifierNext')
                print("パスワードを入力してください（ブラウザで操作）...")
                # ログイン完了まで待機（最大60秒）
                page.wait_for_url("**/vids.google.com/**", timeout=60000)
            except PlaywrightTimeout:
                print("ログインがタイムアウトしました。手動でログインしてください。")
                input("ログイン完了後、Enterキーを押してください...")

        print("ログイン完了！AI動画生成を開始します...")
        time.sleep(2)

        # 「新しい動画」ボタンをクリック
        try:
            new_btn = page.locator('button:has-text("新しい動画"), button:has-text("New video"), [aria-label*="新しい"]').first
            new_btn.click(timeout=10000)
            time.sleep(1)
        except PlaywrightTimeout:
            print("「新しい動画」ボタンが見つかりません。手動で操作してください。")

        # AI生成オプションを選択
        try:
            ai_btn = page.locator('button:has-text("AI"), *:has-text("Generate with AI"), *:has-text("AIで生成")').first
            ai_btn.click(timeout=10000)
            time.sleep(1)
        except PlaywrightTimeout:
            print("AI生成ボタンが見つかりません。")

        # プロンプトを入力
        try:
            textarea = page.locator('textarea, input[type="text"]').first
            textarea.fill(PROMPT)
            print(f"プロンプト入力完了: {PROMPT[:50]}...")
        except Exception:
            print("テキストエリアが見つかりません。")

        # 生成ボタンをクリック
        try:
            gen_btn = page.locator('button:has-text("生成"), button:has-text("Generate")').first
            gen_btn.click(timeout=10000)
            print("生成中...（数分かかる場合があります）")
        except PlaywrightTimeout:
            print("生成ボタンが見つかりません。")

        print("\nブラウザで生成が完了したら、動画をダウンロードしてください。")
        input("終了するには Enter キーを押してください...")
        browser.close()


if __name__ == "__main__":
    generate_video()
