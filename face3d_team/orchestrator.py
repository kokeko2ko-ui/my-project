"""⑧ Orchestrator: 司令塔。

各エージェントを順に動かし、段ごとに QA をかけ、失敗時はリトライ。
印刷投入の前に（require_human_approval なら）人間の承認を求める。
"""
from __future__ import annotations

import logging

from .agents.face_analyst import FaceAnalystAgent
from .agents.intake import IntakeAgent
from .agents.modeler import ModelerAgent
from .agents.printops import PrintOpsAgent
from .agents.qa import QAAgent
from .agents.sculptor import SculptorAgent
from .agents.slicer import SlicerAgent
from .types import Job, Stage

log = logging.getLogger("face3d_team")


class Orchestrator:
    def __init__(self, max_retries: int = 2) -> None:
        self.max_retries = max_retries
        self.qa = QAAgent()
        # 実行順。順序を保証したいので tuple で固定。
        self.pipeline = (
            IntakeAgent(),
            FaceAnalystAgent(),
            ModelerAgent(),
            SculptorAgent(),
            SlicerAgent(),
            PrintOpsAgent(),
        )

    def run(self, job: Job) -> Job:
        for agent in self.pipeline:
            self._run_stage(agent, job)

            # 印刷投入の直前で人間の承認を挟む。
            if agent.stage == Stage.SLICING and job.require_human_approval and not job.dry_run:
                if not self._ask_approval(job):
                    log.info("ユーザーが印刷を中止しました。3MF は %s に保存済みです。",
                             job.get(Stage.SLICING).path)
                    job.dry_run = True
        return job

    def _run_stage(self, agent, job: Job) -> None:
        last_err: Exception | None = None
        for attempt in range(1, self.max_retries + 2):
            try:
                log.info("[%s] 開始 (試行 %d)", agent.name, attempt)
                agent.run(job)
                qa = self.qa.check(job, agent.stage)
                if qa.ok:
                    log.info("[%s] 完了 ✔", agent.name)
                    return
                log.warning("[%s] QA不合格: %s", agent.name, qa.issues)
            except Exception as e:  # noqa: BLE001
                last_err = e
                log.warning("[%s] 例外: %s", agent.name, e)
        raise RuntimeError(f"{agent.name} が {self.max_retries + 1} 回失敗しました: {last_err}")

    @staticmethod
    def _ask_approval(job: Job) -> bool:
        ans = input(f"A1 mini に印刷ジョブを送信しますか？ [{job.get(Stage.SLICING).path}] (y/N): ")
        return ans.strip().lower() in {"y", "yes"}
