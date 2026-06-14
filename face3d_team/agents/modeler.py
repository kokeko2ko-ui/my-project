"""③ Modeler: 写真→3Dメッシュ生成。

ここがチームの心臓部。生成手法は進化が速いので、実体は backends/ 側に置き、
このエージェントは「どのバックエンドを呼ぶか」だけを知る（差し替え可能）。
"""
from __future__ import annotations

from ..backends import get_model_backend
from ..types import Artifact, Job, Stage


class ModelerAgent:
    name = "Modeler"
    stage = Stage.MODELING

    def run(self, job: Job) -> Job:
        face = job.get(Stage.FACE_ANALYSIS)
        assert face and face.path

        out = job.workdir / "03_model" / "raw_mesh.glb"
        out.parent.mkdir(parents=True, exist_ok=True)

        backend = get_model_backend(job.backend)
        result = backend.image_to_3d(image_path=face.path, out_path=out)

        job.set(Artifact(stage=self.stage, path=result.path, meta=result.meta))
        return job
