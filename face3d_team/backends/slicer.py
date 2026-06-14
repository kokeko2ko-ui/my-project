"""スライサ・バックエンド（Bambu Studio / OrcaSlicer CLI）。"""
from __future__ import annotations

import os
import shutil
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Protocol


@dataclass
class SliceResult:
    path: Path
    meta: dict[str, Any] = field(default_factory=dict)


class SlicerBackend(Protocol):
    def slice(self, mesh_path: Path, out_path: Path, *,
              printer: str, supports: bool, brim: bool) -> SliceResult: ...


class CliSlicerBackend:
    """bambu-studio / orca-slicer の CLI を叩く実装の入り口。"""

    def __init__(self) -> None:
        # 環境変数 SLICER_CLI で実行ファイルを指定可能。
        self.cli = os.environ.get("SLICER_CLI") or shutil.which("bambu-studio") \
            or shutil.which("orca-slicer")

    def slice(self, mesh_path: Path, out_path: Path, *,
              printer: str, supports: bool, brim: bool) -> SliceResult:
        if not self.cli:
            # CLI が無い環境では空ファイルを置いてスキップ（dry設計）。
            out_path.write_bytes(b"")
            return SliceResult(path=out_path, meta={"sliced": False, "reason": "no slicer CLI"})

        cmd = [self.cli, str(mesh_path), "--export-3mf", str(out_path),
               "--printer", printer]
        if supports:
            cmd += ["--support", "1"]
        if brim:
            cmd += ["--brim", "1"]
        # 注意: 実際のフラグはスライサのバージョンで異なるため要調整。
        subprocess.run(cmd, check=True)
        return SliceResult(path=out_path, meta={"sliced": True, "printer": printer})


def get_slicer_backend() -> SlicerBackend:
    return CliSlicerBackend()
