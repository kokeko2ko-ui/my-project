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

        # TODO(trimesh/pymeshlab):
        #   1. 読み込み・重複頂点マージ・法線修正
        #   2. fill_holes で水密化、非マニフォールド除去
        #   3. target_height_mm にスケール
        #   4. 背面を平面でカット（壁掛け/省フィラメント）or 半身レリーフ化
        #   5. 必要なら台座・吊り穴を追加
        #   6. STL でエクスポート
        try:
            import trimesh  # noqa: F401
            # 実装はここに。今はダミーとして空ファイルを置く。
        except ImportError:
            pass
        out.write_bytes(b"solid placeholder\nendsolid\n")  # placeholder(非空スタブ)

        job.set(Artifact(stage=self.stage, path=out,
                         meta={"watertight": True, "height_mm": job.target_height_mm}))
        return job
