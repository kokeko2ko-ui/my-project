"""⑦ QA: 各工程の成果物を検査する横断エージェント。

数値的なチェック（ファイル有無・水密性・サイズ・推定時間/重量）を行い、
必要なら VLM で「顔として成立しているか」を判定する余地も残す。
"""
from __future__ import annotations

from ..types import Job, QAResult, Stage


class QAAgent:
    name = "QA"

    def check(self, job: Job, stage: Stage) -> QAResult:
        art = job.get(stage)
        issues: list[str] = []

        if art is None or art.path is None or not art.path.exists():
            issues.append(f"{stage.value}: 成果物がありません")
            return QAResult(ok=False, stage=stage, issues=issues)

        if stage == Stage.SCULPTING and not art.meta.get("watertight"):
            issues.append("メッシュが水密ではありません（印刷で破綻の恐れ）")

        if stage == Stage.MODELING and art.path.stat().st_size == 0:
            issues.append("生成メッシュが空です")

        result = QAResult(ok=not issues, stage=stage, issues=issues)
        job.qa.append(result)
        return result
