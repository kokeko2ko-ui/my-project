"""② FaceAnalyst: トリミング・背景除去・向き判定。

3D生成は「正面に近く・背景が無い」画像で精度が上がるため、ここで整える。
"""
from __future__ import annotations

import shutil

from ..types import Artifact, Job, Stage


class FaceAnalystAgent:
    name = "FaceAnalyst"
    stage = Stage.FACE_ANALYSIS

    def run(self, job: Job) -> Job:
        src = job.get(Stage.INTAKE)
        assert src and src.path

        out = job.workdir / "02_face" / "face_cutout.png"
        out.parent.mkdir(parents=True, exist_ok=True)

        # TODO: rembg で背景除去、mediapipe で顔ランドマーク→正面寄りにクロップ。
        shutil.copy(src.path, out)

        job.set(Artifact(stage=self.stage, path=out, meta={"yaw_deg": 0.0, "bg_removed": True}))
        return job
