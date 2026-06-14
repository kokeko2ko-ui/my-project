"""CLI エントリポイント。

例:
    python -m face3d_team.run --photo face.jpg --backend higgsfield --dry-run
"""
from __future__ import annotations

import argparse
import logging
from pathlib import Path

from .orchestrator import Orchestrator
from .types import Job, Stage


def main() -> None:
    p = argparse.ArgumentParser(description="写真から立体の顔を作る AIチーム")
    p.add_argument("--photo", required=True, type=Path, help="入力する顔写真")
    p.add_argument("--backend", default="higgsfield", help="3D生成エンジン")
    p.add_argument("--height-mm", type=float, default=80.0, help="出力する顔の高さ(mm)")
    p.add_argument("--workdir", type=Path, default=Path("out"), help="作業ディレクトリ")
    p.add_argument("--dry-run", action="store_true", help="印刷ジョブを投入しない")
    p.add_argument("--no-approval", action="store_true", help="人間承認を省略")
    args = p.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(message)s")

    job = Job(
        photo=args.photo,
        workdir=args.workdir / args.photo.stem,
        backend=args.backend,
        target_height_mm=args.height_mm,
        dry_run=args.dry_run,
        require_human_approval=not args.no_approval,
    )
    job.workdir.mkdir(parents=True, exist_ok=True)

    Orchestrator().run(job)

    print("\n=== 成果物 ===")
    for stage in Stage:
        art = job.get(stage)
        print(f"  {stage.value:14s}: {art.path if art else '-'}")
    print("=== QA ===")
    for r in job.qa:
        mark = "OK" if r.ok else "NG"
        print(f"  [{mark}] {r.stage.value}: {r.issues or 'clean'}")


if __name__ == "__main__":
    main()
