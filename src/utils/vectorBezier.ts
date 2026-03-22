import type { BezierPoint, VectorPath } from '../types/vector'

export function pathHasBezierHandles(points: BezierPoint[]): boolean {
  return points.some((p) => p.handleIn || p.handleOut)
}

/** Konva Line with `bezier: true`: [M, C, C, ...] flat coords in artboard space */
export function flattenPathToKonvaBezier(path: VectorPath): number[] {
  const pts = path.points
  if (pts.length < 2) return pts.flatMap((p) => [path.x + p.x, path.y + p.y])

  const n = pts.length
  const segCount = path.closed ? n : n - 1
  const out: number[] = []

  for (let i = 0; i < segCount; i++) {
    const i0 = i % n
    const i1 = (i + 1) % n
    if (!path.closed && i1 === 0) break
    const A = pts[i0]
    const B = pts[i1]
    const ax = path.x + A.x
    const ay = path.y + A.y
    const bx = path.x + B.x
    const by = path.y + B.y
    const cp1x = ax + (A.handleOut?.x ?? 0)
    const cp1y = ay + (A.handleOut?.y ?? 0)
    const cp2x = bx + (B.handleIn?.x ?? 0)
    const cp2y = by + (B.handleIn?.y ?? 0)
    if (i === 0) out.push(ax, ay)
    out.push(cp1x, cp1y, cp2x, cp2y, bx, by)
  }
  return out
}

export function polylineToBezierPoints(
  pts: { x: number; y: number }[],
  closed: boolean
): BezierPoint[] {
  const n = pts.length
  if (n === 0) return []
  return pts.map((p, i) => {
    const toward = (from: { x: number; y: number }, to: { x: number; y: number }, t: number) => ({
      x: (to.x - from.x) * t,
      y: (to.y - from.y) * t,
    })
    if (!closed && n === 1) return { x: p.x, y: p.y }
    if (!closed && i === 0) {
      return { x: p.x, y: p.y, handleOut: toward(p, pts[1], 0.28) }
    }
    if (!closed && i === n - 1) {
      return { x: p.x, y: p.y, handleIn: toward(p, pts[n - 2], 0.28) }
    }
    const prev = pts[(i - 1 + n) % n]
    const next = pts[(i + 1) % n]
    return {
      x: p.x,
      y: p.y,
      handleIn: toward(p, prev, 0.28),
      handleOut: toward(p, next, 0.28),
    }
  })
}
