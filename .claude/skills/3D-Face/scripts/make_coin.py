#!/usr/bin/env python3
"""3D-Face: convert a head/face mesh (GLB/OBJ/PLY/STL) into a round coin
depth-map relief, repaired and print-ready for Bambu A1 Mini.

Usage:
  python make_coin.py INPUT_MESH [--out 3D-Face.stl] [--diam 92] [--total 22.7]
                                 [--protrusion 17.7] [--face-frac 0.81] [--N 360]

Output: a watertight STL, base flat on the bed (z=0), face relief on top,
sized to fit Bambu Mini (180x180x180mm), no supports needed.
"""
import argparse, numpy as np, trimesh
from scipy import ndimage


def rasterize_maxz(v, f, N, L):
    """Z-buffer: highest surface z per grid cell over an L x L plane (centered)."""
    x0 = y0 = -L / 2
    d = L / N
    zb = np.full((N, N), -1e9)
    for t in v[f]:
        xs, ys, zs = t[:, 0], t[:, 1], t[:, 2]
        i0 = max(int(np.floor((xs.min() - x0) / d)), 0)
        i1 = min(int(np.ceil((xs.max() - x0) / d)), N - 1)
        j0 = max(int(np.floor((ys.min() - y0) / d)), 0)
        j1 = min(int(np.ceil((ys.max() - y0) / d)), N - 1)
        if i1 < i0 or j1 < j0:
            continue
        (x1, y1), (x2, y2), (x3, y3) = t[0, :2], t[1, :2], t[2, :2]
        den = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3)
        if abs(den) < 1e-12:
            continue
        ii = np.arange(i0, i1 + 1); jj = np.arange(j0, j1 + 1)
        PX, PY = np.meshgrid(x0 + (ii + 0.5) * d, y0 + (jj + 0.5) * d, indexing='ij')
        a = ((y2 - y3) * (PX - x3) + (x3 - x2) * (PY - y3)) / den
        b = ((y3 - y1) * (PX - x3) + (x1 - x3) * (PY - y3)) / den
        c = 1 - a - b
        m = (a >= -1e-6) & (b >= -1e-6) & (c >= -1e-6)
        if not m.any():
            continue
        z = a * zs[0] + b * zs[1] + c * zs[2]
        sub = zb[i0:i1 + 1, j0:j1 + 1]
        np.maximum(sub, np.where(m, z, -1e9), out=sub)
    return zb


def heightmap(mesh, protrusion, diam, face_frac, N):
    """Build a smooth depth-map of the face front, scaled to `protrusion` mm.
    Uses robust percentile range so stray points don't crush the contrast
    (that bug turns a relief into a flat outline-only "line drawing")."""
    m = mesh.copy()
    v = m.vertices.astype(np.float64); f = m.faces
    mn, mx = v.min(0), v.max(0)
    ex, ey, ez = mx - mn
    sxy = (diam * face_frac) / max(ex, ey)
    v[:, 0] = (v[:, 0] - (mn[0] + mx[0]) / 2) * sxy
    v[:, 1] = (v[:, 1] - (mn[1] + mx[1]) / 2) * sxy
    v[:, 2] = v[:, 2] - mn[2]                      # face = highest-z (max-z) surface
    zb = rasterize_maxz(v, f, N, diam)
    face = zb > -1e8
    vals = zb[face]
    lo, hi = np.percentile(vals, 1.5), np.percentile(vals, 99.5)
    relief = np.where(face, (np.clip(zb, lo, hi) - lo) / (hi - lo) * protrusion, 0.0)
    relief = ndimage.gaussian_filter(relief, sigma=0.7)   # de-noise, keep bumps
    return np.where(face, relief, 0.0)


def build(inp, out, diam, total, protrusion, face_frac, N):
    mesh = trimesh.load(inp, force='scene').to_geometry()
    relief = heightmap(mesh, protrusion, diam, face_frac, N)
    base = total - protrusion
    d = diam / N
    xs = -diam / 2 + (np.arange(N) + 0.5) * d
    X, Y = np.meshgrid(xs, xs, indexing='ij')
    disk = (X ** 2 + Y ** 2) <= (diam / 2) ** 2
    H = np.where(disk, relief, 0.0)
    top = np.stack([X, Y, H], -1).reshape(-1, 3)
    bot = np.stack([X, Y, np.full_like(H, -base)], -1).reshape(-1, 3)
    nv = N * N
    verts = np.vstack([top, bot])
    idx = lambda i, j: i * N + j
    inc = np.zeros((N - 1, N - 1), bool)
    faces = []
    for i in range(N - 1):
        for j in range(N - 1):
            if disk[i, j] and disk[i + 1, j] and disk[i + 1, j + 1] and disk[i, j + 1]:
                inc[i, j] = True
                a, b, c, e = idx(i, j), idx(i + 1, j), idx(i + 1, j + 1), idx(i, j + 1)
                faces += [[a, b, c], [a, c, e],
                          [a + nv, c + nv, b + nv], [a + nv, e + nv, c + nv]]
    for i in range(N - 1):
        for j in range(N - 1):
            if not inc[i, j]:
                continue
            if j == 0 or not inc[i, j - 1]:
                a, b = idx(i, j), idx(i + 1, j); faces += [[a, a + nv, b], [b, a + nv, b + nv]]
            if j == N - 2 or not inc[i, j + 1]:
                a, b = idx(i, j + 1), idx(i + 1, j + 1); faces += [[a, b, a + nv], [b, b + nv, a + nv]]
            if i == 0 or not inc[i - 1, j]:
                a, b = idx(i, j), idx(i, j + 1); faces += [[a, b, a + nv], [b, b + nv, a + nv]]
            if i == N - 2 or not inc[i + 1, j]:
                a, b = idx(i + 1, j), idx(i + 1, j + 1); faces += [[a, a + nv, b], [b, a + nv, b + nv]]
    sol = trimesh.Trimesh(vertices=verts, faces=np.array(faces), process=True)
    sol.remove_unreferenced_vertices()
    # print-readiness: repair + bed-align (bottom at z=0)
    trimesh.repair.fix_normals(sol); trimesh.repair.fix_winding(sol); trimesh.repair.fix_inversion(sol)
    sol.fill_holes()
    sol.apply_translation([-sol.bounds.mean(0)[0], -sol.bounds.mean(0)[1], -sol.bounds[0, 2]])
    sol.export(out)
    e = sol.extents
    fits = bool(np.all(e < np.array([180, 180, 180])))
    print(f"saved {out}")
    print(f"  size {e[0]:.1f}x{e[1]:.1f}x{e[2]:.1f}mm  watertight={sol.is_watertight} "
          f"faces={len(sol.faces)}  fits_Bambu_Mini={fits}")
    if not sol.is_watertight:
        print("  WARNING: mesh not watertight — inspect before printing")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("input")
    p.add_argument("--out", default="3D-Face.stl")
    p.add_argument("--diam", type=float, default=92.0)
    p.add_argument("--total", type=float, default=22.7)
    p.add_argument("--protrusion", type=float, default=17.7)
    p.add_argument("--face-frac", type=float, default=0.81)
    p.add_argument("--N", type=int, default=360)
    a = p.parse_args()
    build(a.input, a.out, a.diam, a.total, a.protrusion, a.face_frac, a.N)
