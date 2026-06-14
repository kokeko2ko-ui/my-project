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
    name = "triposr"

    def image_to_3d(self, image_path: Path, out_path: Path) -> ModelResult:
        # TODO: ローカル TripoSR 推論。GPU 推奨。
        out_path.write_bytes(b"")
        return ModelResult(path=out_path, meta={"engine": self.name})


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
