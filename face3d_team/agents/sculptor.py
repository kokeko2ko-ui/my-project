"""④ Sculptor: 印刷可能化（水密化・底面カット・台座/壁掛け穴・サイズ調整）。

生成メッシュはそのままだと穴あき・非マニフォールド・スケール不定なことが多い。
ここで「確実に印刷できる形」に整える。trimesh / pymeshlab を想定。
"""
from __future__ import annotations

from ..types import Artifact, Job, Stage


class SculptorAgent:
    name = "Sculptor"
    stage = Stage.SCULPTING

    def run(self, job: Job) -> Job:
        raw = job.get(Stage.MODELING)
        assert raw and raw.path

        out = job.workdir / "04_sculpt" / "printable.stl"
        out.parent.mkdir(parents=True, exist_ok=True)

        from ..sculpt import make_printable

        meta = make_printable(raw.path, out, target_height_mm=job.target_height_mm)
        job.set(Artifact(stage=self.stage, path=out, meta=meta))
        return job
