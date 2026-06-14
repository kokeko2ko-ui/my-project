"""⑥ PrintOps: Bambu Lab A1 mini へジョブ送信・監視。

bambulabs-api（MQTT/LANモード）を想定。安全のため dry_run/承認をデフォルト有効に。
"""
from __future__ import annotations

from ..backends import get_printer_backend
from ..types import Artifact, Job, Stage


class PrintOpsAgent:
    name = "PrintOps"
    stage = Stage.PRINTING

    def run(self, job: Job) -> Job:
        sliced = job.get(Stage.SLICING)
        assert sliced and sliced.path

        if job.dry_run:
            job.set(Artifact(stage=self.stage, path=sliced.path,
                             meta={"submitted": False, "reason": "dry_run"}))
            return job

        printer = get_printer_backend()
        info = printer.submit(sliced.path)
        job.set(Artifact(stage=self.stage, path=sliced.path,
                         meta={"submitted": True, **info}))
        return job
