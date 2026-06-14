"""⑤ Slicer: A1 mini 用にスライスして 3MF / gcode を作る。

Bambu Studio / OrcaSlicer の CLI を呼ぶ想定。プロファイルで
「Bambu Lab A1 mini」「サポート on」「ブリム」などを指定する。
"""
from __future__ import annotations

from ..backends import get_slicer_backend
from ..types import Artifact, Job, Stage


class SlicerAgent:
    name = "Slicer"
    stage = Stage.SLICING

    def run(self, job: Job) -> Job:
        mesh = job.get(Stage.SCULPTING)
        assert mesh and mesh.path

        out = job.workdir / "05_slice" / "job.gcode.3mf"
        out.parent.mkdir(parents=True, exist_ok=True)

        slicer = get_slicer_backend()
        result = slicer.slice(
            mesh_path=mesh.path,
            out_path=out,
            printer="Bambu Lab A1 mini",
            supports=True,
            brim=True,
        )
        job.set(Artifact(stage=self.stage, path=result.path, meta=result.meta))
        return job
