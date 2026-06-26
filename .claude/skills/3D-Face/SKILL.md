---
name: 3D-Face
description: Convert a head/face 3D mesh (GLB/OBJ/PLY/STL) into a round coin-style depth-map relief and export a watertight, print-ready STL for Bambu A1 Mini. Use when the user wants to turn a face scan/model into a printable relief coin or medallion.
---

# 3D-Face

Turns a face/head mesh into a **round coin relief** (depth-map relief on a flat
disk) and outputs a **watertight, bed-aligned STL ready to slice for Bambu A1 Mini**.

## When to use
- The user has a 3D face/head mesh (e.g. a photo-to-3D GLB) and wants a printable
  relief coin / medallion / plaque.
- The user references "this last method" of producing the face coin.

## How it works
The face front is sampled into a smooth **depth map** (nose/cheeks/forehead keep
their real height — it is NOT flattened to an outline), compressed to the target
relief depth, placed on a round disk base, then repaired and aligned flat on the bed.

## Steps
1. Identify the input mesh path (ask the user if not provided; default to the most
   recent `*.glb` head model in the project).
2. Run the bundled script:
   ```bash
   python .claude/skills/3D-Face/scripts/make_coin.py <INPUT_MESH> --out 3D-Face.stl
   ```
3. Read the printed report and confirm `watertight=True` and `fits_Bambu_Mini=True`.
   If not watertight, inspect before printing.
4. (Optional) Render a quick multi-angle preview to verify the relief depth
   (front + a grazing side view so the nose/cheek height is visible) before delivering.
5. Deliver `3D-Face.stl` to the user.

## Defaults (tuned values from the working result)
| Param | Default | Meaning |
|---|---|---|
| `--diam` | 92 | coin diameter (mm) |
| `--total` | 22.7 | total thickness (mm) |
| `--protrusion` | 17.7 | relief depth above the base (mm) |
| `--face-frac` | 0.81 | face size as fraction of diameter (rim margin) |
| `--N` | 360 | height-map grid resolution |

- Base thickness = `total - protrusion` (default 5 mm).
- Increase `--face-frac` toward ~0.95 for a bigger face / thinner rim.
- For a square plaque instead of a coin, the same depth map can be placed on a
  square footprint (see `scripts/make_coin.py` — swap the `disk` mask for a full grid).

## Requirements
`trimesh`, `numpy`, `scipy` (Python 3). Install with `pip install trimesh numpy scipy`.

## Bambu A1 Mini slicing notes
- Orientation: as exported (face up, flat base on bed) → **no supports needed**.
- Layer height 0.12 mm for detail, 0.2 mm for speed; 10–15% infill is plenty.
- Build volume 180×180×180 mm — the default 92 mm coin fits with wide margin.
