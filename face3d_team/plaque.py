"""顔メッシュを「丸い平板に乗せた顔レリーフ」に加工する。

後頭部を平面でカットして前面の顔だけ残し、円形プレートに union する。
"""
from __future__ import annotations

from pathlib import Path

import trimesh


def make_face_plaque(
    src: Path,
    out: Path,
    *,
    front_axis: int = 2,
    front_sign: int = 1,
    plate_thickness_mm: float = 5.0,
    plate_margin_mm: float = 6.0,
) -> dict:
    """顔メッシュ(STL/GLB)→ 円形プレート付き顔レリーフ STL。

    front_axis/front_sign: 顔が向いている軸と向き（既定 +Z）。
    """
    scene = trimesh.load(src)
    m = scene.to_geometry() if isinstance(scene, trimesh.Scene) else scene

    # 顔側半分を残して背面を平面でカット（cap で平らな背面を作る）
    origin = m.centroid.copy()
    normal = [0, 0, 0]
    normal[front_axis] = front_sign
    fr = m.slice_plane(plane_origin=origin, plane_normal=normal, cap=True)

    # 修復して volume に
    fr.merge_vertices()
    fr.update_faces(fr.nondegenerate_faces())
    fr.update_faces(fr.unique_faces())
    trimesh.repair.fix_normals(fr)
    fr.fill_holes()

    # 背面を z=0 へ
    fr.apply_translation([0, 0, -fr.vertices[:, 2].min()])
    cx, cy = fr.centroid[0], fr.centroid[1]
    radius = max(fr.extents[0], fr.extents[1]) / 2 + plate_margin_mm

    disc = trimesh.creation.cylinder(radius=radius, height=plate_thickness_mm, sections=128)
    disc.apply_translation([cx, cy, -plate_thickness_mm / 2])

    try:
        combo = trimesh.boolean.union([fr, disc])
        method = "boolean"
        if not combo.is_volume:
            raise ValueError("union not volume")
    except Exception:
        # フォールバック: 重なった2ソリッドを結合（スライサ側でユニオン扱い）
        combo = trimesh.util.concatenate([fr, disc])
        method = "concatenate"

    out.parent.mkdir(parents=True, exist_ok=True)
    combo.export(out)
    return {
        "method": method,
        "watertight": bool(combo.is_watertight),
        "extents_mm": [round(float(x), 1) for x in combo.extents],
        "plate_diameter_mm": round(radius * 2, 1),
    }
