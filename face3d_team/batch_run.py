"""フォルダ内の写真をまとめて3D化するバッチランナー。

夜間にスケジュール実行する想定。`--input` フォルダ内の未処理画像を順に
パイプラインへ流し、結果を `--output` に保存する。処理済みは記録して二度やらない。

例:
    python -m face3d_team.batch_run --input photos --output out --backend triposr
"""
from __future__ import annotations

import argparse
import json
import logging
import time
from pathlib import Path

from .orchestrator import Orchestrator
from .types import Job, Stage

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}
log = logging.getLogger("face3d_team.batch")


def _done_set(state_file: Path) -> set[str]:
    if state_file.exists():
        return set(json.loads(state_file.read_text()))
    return set()


def main() -> None:
    p = argparse.ArgumentParser(description="写真フォルダを一括3D化（夜間バッチ用）")
    p.add_argument("--input", required=True, type=Path, help="写真フォルダ")
    p.add_argument("--output", type=Path, default=Path("out"), help="出力フォルダ")
    p.add_argument("--backend", default="triposr", help="3D生成エンジン")
    p.add_argument("--height-mm", type=float, default=80.0)
    args = p.parse_args()

    logging.basicConfig(level=logging.INFO,
                        format="%(asctime)s %(levelname)s %(message)s")
    args.output.mkdir(parents=True, exist_ok=True)
    state_file = args.output / ".processed.json"
    done = _done_set(state_file)

    photos = sorted(
        f for f in args.input.iterdir()
        if f.suffix.lower() in IMAGE_EXTS and f.name not in done
    )
    if not photos:
        log.info("新しい写真はありません。終了します。")
        return

    log.info("対象 %d 件を処理します。", len(photos))
    orch = Orchestrator()
    ok = 0
    for f in photos:
        t0 = time.time()
        log.info("=== %s 開始 ===", f.name)
        try:
            job = Job(
                photo=f,
                workdir=args.output / f.stem,
                backend=args.backend,
                target_height_mm=args.height_mm,
                dry_run=True,             # バッチでは印刷投入しない
                require_human_approval=False,
            )
            job.workdir.mkdir(parents=True, exist_ok=True)
            orch.run(job)
            stl = job.get(Stage.SCULPTING)
            log.info("=== %s 完了 (%.0f秒) -> %s ===",
                     f.name, time.time() - t0, stl.path if stl else "?")
            done.add(f.name)
            ok += 1
        except Exception as e:  # noqa: BLE001
            log.error("=== %s 失敗: %s ===", f.name, e)
        finally:
            state_file.write_text(json.dumps(sorted(done), ensure_ascii=False))

    log.info("バッチ完了: 成功 %d / 全 %d 件", ok, len(photos))


if __name__ == "__main__":
    main()
