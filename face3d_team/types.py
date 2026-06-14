"""パイプラインを流れる共有データ構造。

各エージェントは Job を受け取り、自分の成果物を埋めて返す。
段階ごとに成果物（artifact）を残すことで、QA とリトライがやりやすくなる。
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any


class Stage(str, Enum):
    INTAKE = "intake"
    FACE_ANALYSIS = "face_analysis"
    MODELING = "modeling"
    SCULPTING = "sculpting"
    SLICING = "slicing"
    PRINTING = "printing"


@dataclass
class Artifact:
    """ある工程の成果物（ファイル + メタ情報）。"""
    stage: Stage
    path: Path | None = None
    meta: dict[str, Any] = field(default_factory=dict)


@dataclass
class QAResult:
    ok: bool
    stage: Stage
    issues: list[str] = field(default_factory=list)
    score: float | None = None


@dataclass
class Job:
    """1枚の写真から1つの印刷物を作るまでの全状態。"""
    photo: Path
    workdir: Path
    # 設定
    backend: str = "higgsfield"          # Modeler のエンジン
    target_height_mm: float = 80.0       # 出力サイズ（顔の高さ）
    dry_run: bool = True                 # True なら印刷は投入しない
    require_human_approval: bool = True
    # 成果物
    artifacts: dict[Stage, Artifact] = field(default_factory=dict)
    qa: list[QAResult] = field(default_factory=list)

    def set(self, art: Artifact) -> None:
        self.artifacts[art.stage] = art

    def get(self, stage: Stage) -> Artifact | None:
        return self.artifacts.get(stage)
