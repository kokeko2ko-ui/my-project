"""① Intake: 写真の受付・正規化・顔の有無チェック。"""
from __future__ import annotations

import shutil
from pathlib import Path

from ..types import Artifact, Job, Stage


class IntakeAgent:
    name = "Intake"
    stage = Stage.INTAKE

    def run(self, job: Job) -> Job:
        if not job.photo.exists():
            raise FileNotFoundError(f"写真が見つかりません: {job.photo}")

        normalized = job.workdir / "01_intake" / "input.png"
        normalized.parent.mkdir(parents=True, exist_ok=True)

        # TODO: 実装では EXIF回転補正・リサイズ・顔検出(OpenCV/mediapipe)を行う。
        #       顔が無い/小さすぎる場合はここで弾く。
        shutil.copy(job.photo, normalized.with_suffix(job.photo.suffix))
        out = normalized.with_suffix(job.photo.suffix)

        job.set(Artifact(stage=self.stage, path=out, meta={"faces_detected": 1}))
        return job
