# ローカルで TripoSR を CPU 実行する手順（NVIDIA GPU 不要）

Intel 内蔵GPUのノートPC（例: Core i7 / 32GB RAM）でも、TripoSR は **CPUモード**で動きます。
GPUが無いぶん遅く、**画像1枚あたり数分〜十数分**かかりますが、待てるなら完全無料・ローカル完結です。

このリポジトリの `--backend triposr` から呼び出せます。生成後の
「修復 → 顔レリーフ → スライス」はそのまま使えます。

---

## 1. 必要なもの
- Python 3.10 か 3.11
- メモリ 8GB 以上（32GBあれば余裕）
- ネット接続（初回にモデル重みを自動DL、約1.5GB）

## 2. TripoSR を取得

```bash
git clone https://github.com/VAST-AI-Research/TripoSR.git
cd TripoSR
python -m venv .venv
# Windows: .venv\Scripts\activate   /  Mac/Linux: source .venv/bin/activate
pip install --upgrade pip

# CPU版 PyTorch を入れる（NVIDIAが無いPCはこれでOK）
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```

## 3. 単体で動作確認

```bash
# 背景除去済みの顔PNGを渡す（このプロジェクトの FaceAnalyst 出力など）
python run.py path/to/face.png --output-dir out_tsr --device cpu --model-save-format obj
# => out_tsr/0/mesh.obj が生成される（CPUなので数分待つ）
```

## 4. このプロジェクトから使う

`face3d_team` 側で環境変数を設定して `--backend triposr` を指定します。

```bash
# TripoSR の run.py を指す
export TRIPOSR_RUN=/path/to/TripoSR/run.py
export TRIPOSR_PY=/path/to/TripoSR/.venv/bin/python   # TripoSRの仮想環境のpython
export TRIPOSR_DEVICE=cpu

python -m face3d_team.run --photo face.png --backend triposr --dry-run
```

これで「写真 → TripoSR(CPU) → 水密STL → 顔レリーフ」まで自動で流れます。

---

## CPU実行を少しでも速く・安定させるコツ
- 入力画像は **512×512 程度**に。大きすぎると遅くメモリも食う。
- 他の重いアプリを閉じる（メモリ確保）。
- `--mc-resolution` を下げると速くなる（既定256 → 128 で粗いが高速）。
  例: `--mc-resolution 128`
- 顔だけ作るなら背景は事前に除去（このプロジェクトの FaceAnalyst / rembg）。

## もっと速く/きれいにしたくなったら
- **Google Colab の無料GPU(T4)** で TripoSR や Stable Fast 3D を回すと数秒〜数十秒。
  PCにGPUが無くてもブラウザだけでクラウドGPUを使え、出力GLBをDLしてこの後段に流せます。
- 将来 NVIDIA GPU を積んだPCにすれば `TRIPOSR_DEVICE=cuda` に変えるだけで高速化します。
