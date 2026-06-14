"""プリンタ・バックエンド（Bambu Lab A1 mini / bambulabs-api 経由）。"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Protocol


class PrinterBackend(Protocol):
    def submit(self, job_3mf: Path) -> dict[str, Any]: ...


class BambuLanBackend:
    """LANモード + アクセスコードで A1 mini に送る実装の入り口。

    必要な環境変数:
      BAMBU_IP           : プリンタの IP
      BAMBU_SERIAL       : シリアル番号
      BAMBU_ACCESS_CODE  : 設定画面のアクセスコード
    """

    def __init__(self) -> None:
        self.ip = os.environ.get("BAMBU_IP")
        self.serial = os.environ.get("BAMBU_SERIAL")
        self.access_code = os.environ.get("BAMBU_ACCESS_CODE")

    def submit(self, job_3mf: Path) -> dict[str, Any]:
        if not all([self.ip, self.serial, self.access_code]):
            raise RuntimeError("BAMBU_IP / BAMBU_SERIAL / BAMBU_ACCESS_CODE が未設定です")
        # TODO: bambulabs-api でアップロード→印刷開始、ステータス監視。
        #   from bambulabs_api import Printer
        #   p = Printer(self.ip, self.access_code, self.serial); p.connect(); ...
        return {"printer_ip": self.ip, "file": str(job_3mf), "status": "queued"}


def get_printer_backend() -> PrinterBackend:
    return BambuLanBackend()
