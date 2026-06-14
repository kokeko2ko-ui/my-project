"""差し替え可能なバックエンド（生成エンジン・スライサ・プリンタ）。

Modeler の裏側をここで切り替えることで、写真→3Dの最新手法に追従する。
"""
from __future__ import annotations

from .model import ModelBackend, get_model_backend
from .printer import PrinterBackend, get_printer_backend
from .slicer import SlicerBackend, get_slicer_backend

__all__ = [
    "ModelBackend", "get_model_backend",
    "SlicerBackend", "get_slicer_backend",
    "PrinterBackend", "get_printer_backend",
]
