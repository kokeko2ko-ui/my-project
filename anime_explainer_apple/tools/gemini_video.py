#!/usr/bin/env python3
"""Gemini に動画（YouTube の URL か、動画ファイル）を見て・聞いてもらい、分析結果を文字で返す。
使い方:
  python3 tools/gemini_video.py <YouTubeのURL か 動画ファイル> [--model 名前] [--prompt "聞きたいこと"] [--out 保存先.md]
  python3 tools/gemini_video.py --list-models          # 使えるモデルを一覧
キー: 環境の Network secrets に host `generativelanguage.googleapis.com` を登録しておく（プロキシが差し込む。ここではダミーでよい）。
注意: 参考動画は「構成・テンポ・画面の作り方」を取り出すために使う。台詞・口癖・見た目は真似しない。"""
import argparse, json, mimetypes, os, sys, time, urllib.request, urllib.error

BASE = 'https://generativelanguage.googleapis.com'
KEY = os.environ.get('GEMINI_API_KEY', 'proxy-injected')   # 本物はプロキシが差し替える

DEFAULT_PROMPT = """この動画を、最初から最後まで、画面と音声の両方を見て・聞いて、日本語で詳しく分析してください。
「雰囲気」を、アニメ動画で再現するための設計図にしたいのです。時刻（分:秒）つきで、次を教えてください。

1. 全体の構成（冒頭フック、掛け合い、手順、まとめ、終わり）と、各部分の長さ
2. 語り：話す速さ（1秒あたりの文字数の感覚）、口調、語尾、くだけ具合、間（ま）の取り方、笑いや脱線、声の抑揚・テンション
3. 掛け合い：登場人物の役割、誰がどんな時にどう反応するか（相づち・驚き・ツッコミ）
4. 画面：テロップ（文字）の出し方・色・大きさ・位置・動き、題名の帯、工程名、箇条書きパネル、画面の切り替えの速さ、カメラの寄り引き、料理（被写体）の見せ方
5. 音：BGM の雰囲気と入るタイミング、効果音（どんな時に何の音）
6. 視聴者を引きつける工夫（冒頭30秒、予告、数字の見せ方）
7. 事実として言っていること（分量・温度・時間・理由など）を一覧に。根拠が示されているか、断定か、も書く
8. 真似してはいけない部分（その人固有の口癖・決め台詞・見た目）と、一般化して使える部分を分ける

見えていない・聞き取れない部分は、推測せず「不明」と書いてください。"""

def req(method, path, body=None, headers=None, raw=False):
    h = {'x-goog-api-key': KEY}
    if body is not None and not raw: h['Content-Type'] = 'application/json'
    if headers: h.update(headers)
    data = json.dumps(body).encode() if (body is not None and not raw) else body
    r = urllib.request.Request(path if path.startswith('http') else BASE + path, data=data, method=method, headers=h)
    try:
        resp = urllib.request.urlopen(r, timeout=600)
    except urllib.error.HTTPError as e:
        sys.exit(f'エラー {e.code}: {e.read().decode(errors="replace")[:600]}')
    return resp

def list_models():
    d = json.load(req('GET', '/v1beta/models?pageSize=100'))
    for m in d.get('models', []):
        if 'generateContent' in m.get('supportedGenerationMethods', []):
            print(m['name'].replace('models/', ''), '|', m.get('displayName', ''))

def upload(path):
    mime = mimetypes.guess_type(path)[0] or 'video/mp4'
    size = os.path.getsize(path)
    start = req('POST', '/upload/v1beta/files', {'file': {'display_name': os.path.basename(path)}}, {
        'X-Goog-Upload-Protocol': 'resumable', 'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': str(size), 'X-Goog-Upload-Header-Content-Type': mime})
    url = start.headers.get('X-Goog-Upload-URL') or sys.exit('アップロード先が取れませんでした')
    f = json.load(req('POST', url, open(path, 'rb').read(), {'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize', 'Content-Length': str(size)}, raw=True))['file']
    for _ in range(120):   # 処理待ち
        st = json.load(req('GET', '/v1beta/' + f['name']))
        if st.get('state') == 'ACTIVE': return st['uri'], mime
        if st.get('state') == 'FAILED': sys.exit('動画の処理に失敗しました')
        time.sleep(5)
    sys.exit('動画の処理が終わりません')

def analyze(src, prompt, model):
    if src.startswith('http'): part = {'file_data': {'file_uri': src}}
    else:
        uri, mime = upload(src); part = {'file_data': {'mime_type': mime, 'file_uri': uri}}
    body = {'contents': [{'parts': [part, {'text': prompt}]}], 'generationConfig': {'temperature': 0.2}}
    d = json.load(req('POST', f'/v1beta/models/{model}:generateContent', body))
    c = d.get('candidates', [{}])[0]
    txt = ''.join(p.get('text', '') for p in c.get('content', {}).get('parts', []))
    if not txt: sys.exit('結果が空でした: ' + json.dumps(d, ensure_ascii=False)[:600])
    return txt

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('source', nargs='?'); ap.add_argument('--model', default=os.environ.get('GEMINI_MODEL', 'gemini-2.5-flash'))
    ap.add_argument('--prompt', default=DEFAULT_PROMPT); ap.add_argument('--out'); ap.add_argument('--list-models', action='store_true')
    a = ap.parse_args()
    if a.list_models: list_models(); sys.exit(0)
    if not a.source: ap.error('動画の URL かファイルを指定してください')
    out = analyze(a.source, a.prompt, a.model)
    if a.out:
        os.makedirs(os.path.dirname(a.out) or '.', exist_ok=True)
        open(a.out, 'w', encoding='utf-8').write(f'# Gemini による動画分析\n\n- 動画：{a.source}\n- モデル：{a.model}\n- 注意：モデルの出力。事実・数値は確認すること。\n\n' + out + '\n')
        print('保存しました:', a.out)
    print(out)
