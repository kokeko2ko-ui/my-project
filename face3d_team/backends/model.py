"""写真→3D 生成バックエンド。

選択肢（2026時点）:
- "higgsfield" : higgsfield の generate_3d（このMCP環境で利用可能）
- "hunyuan3d"  : Tencent Hunyuan3D-2（ローカル/自前GPU、商用品質）
- "triposr"    : TripoSR（軽量・高速、単画像）
- "tripo"/"meshy": 各社API

新しい手法が出たら BACKENDS に1つ関数を足すだけで Modeler から使える。
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Protocol


@dataclass
class ModelResult:
    path: Path
    meta: dict[str, Any] = field(default_factory=dict)


class ModelBackend(Protocol):
    name: str
    def image_to_3d(self, image_path: Path, out_path: Path) -> ModelResult: ...


class HiggsfieldBackend:
    """higgsfield MCP の generate_3d を呼ぶ実装の入り口。

    実運用では MCP ツール mcp__higgsfield__generate_3d を呼び、返ってきた
    アセットをダウンロードして out_path に保存する。ここでは契約のみ定義。
    """
    name = "higgsfield"

    def image_to_3d(self, image_path: Path, out_path: Path) -> ModelResult:
        # TODO: generate_3d(image=...) -> ジョブ -> ダウンロード -> out_path
        out_path.write_bytes(b"glTF\x00\x00\x00\x00")  # placeholder(非空スタブ)
        return ModelResult(path=out_path, meta={"engine": self.name, "src": str(image_path)})


class TripoSRBackend:
    """ローカルの TripoSR を CPU/GPU で実行するバックエンド。

    重みやリポジトリは同梱しない。環境変数で TripoSR の run.py を指す:
        TRIPOSR_RUN   : TripoSR の run.py へのパス（必須）
        TRIPOSR_PY    : 使う python（既定: sys.executable）
        TRIPOSR_DEVICE: "cpu" or "cuda"（既定: cpu）

    内蔵GPUのみのPCでは device=cpu で動く（1枚あたり数分かかる）。
    セットアップは face3d_team/LOCAL_TRIPOSR.md を参照。
    """
    name = "triposr"

    def image_to_3d(self, image_path: Path, out_path: Path) -> ModelResult:
        import os
        import subprocess
        import sys

        run_py = os.environ.get("TRIPOSR_RUN")
        if not run_py or not Path(run_py).exists():
            raise RuntimeError(
                "TRIPOSR_RUN が未設定です。TripoSR の run.py を指してください "
                "(face3d_team/LOCAL_TRIPOSR.md 参照)。"
            )
        python = os.environ.get("TRIPOSR_PY", sys.executable)
        device = os.environ.get("TRIPOSR_DEVICE", "cpu")

        out_dir = out_path.parent / "triposr"
        out_dir.mkdir(parents=True, exist_ok=True)

        cmd = [
            python, run_py, str(image_path),
            "--output-dir", str(out_dir),
            "--device", device,
            "--model-save-format", "obj",
            "--no-remove-bg",   # 背景は FaceAnalyst で除去済み想定
        ]
        subprocess.run(cmd, check=True)

        # TripoSR は <out_dir>/0/mesh.obj を生成する。GLB へ変換して out_path に。
        produced = next(out_dir.glob("**/mesh.*"), None)
        if produced is None:
            raise RuntimeError(f"TripoSR の出力メッシュが見つかりません: {out_dir}")
        try:
            import trimesh
            trimesh.load(produced).export(out_path)
        except Exception:
            out_path = produced  # 変換できなければ生成物をそのまま使う
        return ModelResult(path=out_path, meta={"engine": self.name, "device": device})


_BACKENDS: dict[str, type] = {
    "higgsfield": HiggsfieldBackend,
    "triposr": TripoSRBackend,
}


def get_model_backend(name: str) -> ModelBackend:
    try:
        return _BACKENDS[name]()
    except KeyError:
        raise ValueError(
            f"未知のバックエンド: {name}. 利用可能: {list(_BACKENDS)}"
        ) from None
