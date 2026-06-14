# face3d-team — 写真から立体の顔を作る AIチーム（Bambu Lab A1 mini 向け）

写真を入力すると、複数のAIエージェントが連携して「印刷可能な顔の3Dモデル」を作り、
Bambu Lab A1 mini で印刷するところまでを目指すパイプラインのスケルトンです。

## なぜこの構成か（今/現在/未来に一番いい方法）

- **生成エンジンを差し替え可能にする**のが要。写真→3Dの技術は進化が速いので、
  `Modeler` エージェントの裏側だけ差し替えれば最新手法に追従できる設計にしています。
  - 現状の選択肢: higgsfield `generate_3d`（このAdobe/higgsfield環境で利用可）、
    Hunyuan3D-2、TripoSR、Tripo / Meshy などのAPI。
- 残りの工程（修復・スライス・印刷）は枯れた確実な手法（trimesh / Bambu Studio CLI / MQTT）。

## パイプライン

```
写真 → Intake → FaceAnalyst → Modeler → Sculptor → Slicer → PrintOps
                                  ↑______ QA が各段で検査 ______↑
        Orchestrator が全体を指揮（リトライ・人間承認ポイント）
```

| エージェント | 役割 | 実装ファイル |
|---|---|---|
| Intake | 写真受付・正規化・顔有無チェック | `agents/intake.py` |
| FaceAnalyst | トリミング・背景除去・向き判定 | `agents/face_analyst.py` |
| Modeler | 写真→3Dメッシュ生成（差し替え可能） | `agents/modeler.py` |
| Sculptor | 水密化・底面カット・台座/壁掛け穴 | `agents/sculptor.py` |
| Slicer | A1 mini 用にスライス→3MF/gcode | `agents/slicer.py` |
| PrintOps | A1 mini へ送信・監視 | `agents/printops.py` |
| QA | 各成果物の検証 | `agents/qa.py` |
| Orchestrator | 司令塔 | `orchestrator.py` |

## セットアップ

```bash
cd face3d_team
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # APIキーやプリンタ情報を記入
```

## 実行

```bash
python -m face3d_team.run --photo path/to/face.jpg --backend higgsfield
# 印刷まで自動でやらず、各段で成果物を確認したい場合:
python -m face3d_team.run --photo face.jpg --dry-run
```

## 現状

各エージェントは**インターフェースとダミー実装**が入った状態です。
`backends/` に実際の生成・スライス・印刷の実装を埋めていけば動くようになります。
まずは全体の流れと差し替えポイントを固めるためのスケルトンです。

## A1 mini 印刷の注意

- 顔のような上に向かって広がる形状はサポート/ブリムが必要。`Slicer` でプロファイル指定。
- ネットワーク経由送信は `bambulabs-api`（MQTT）。LANモード+アクセスコードが必要。
- 安全のため、デフォルトでは印刷ジョブの投入前に**人間の承認**を挟みます。
