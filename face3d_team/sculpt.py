"""Sculptor の実処理。GLB/メッシュを印刷可能な STL に変換する。

image-to-3D の出力は穴あき・浮遊ゴミ・スケール不定なことが多いので、
ここで「確実に印刷できる水密メッシュ」に整える。trimesh 実装。
"""
from __future__ import annotations

from pathlib import Path

import trimesh


def make_printable(src: Path, out: Path, target_height_mm: float = 80.0) -> dict:
    """メッシュを読み込み、修復・最大ボディ抽出・mmスケール・水密化して STL 出力。

    返り値: 寸法や水密性などのメタ情報。
    """
    scene = trimesh.load(src)
    m = scene.to_geometry() if isinstance(scene, trimesh.Scene) else scene

    # 1) クリーンアップ
    m.merge_vertices()
    m.update_faces(m.nondegenerate_faces())
    m.update_faces(m.unique_faces())
    m.remove_infinite_values()
    trimesh.repair.fix_normals(m)
    trimesh.repair.fill_holes(m)

    # 2) 最大ボディだけ残す（浮遊ゴミ除去）
    bodies = m.split(only_watertight=False)
    if len(bodies) > 1:
        m = max(bodies, key=lambda b: len(b.faces))

    # 3) 高さ(Y)を target_height_mm にスケール
    m.apply_scale(target_height_mm / m.extents[1])

    # 4) 底面を原点へ（スライサで置きやすく）
    m.rezero()

    out.parent.mkdir(parents=True, exist_ok=True)
    m.export(out)

    return {
        "watertight": bool(m.is_watertight),
        "extents_mm": [round(float(x), 1) for x in m.extents],
        "volume_cm3": round(float(m.volume) / 1000, 1) if m.is_watertight else None,
        "faces": int(len(m.faces)),
    }
