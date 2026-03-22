import type { VectorFrame, VectorPath } from '../types/vector'
import { flattenPathToKonvaBezier, pathHasBezierHandles } from './vectorBezier'

function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

function konvaBezierFlatToSvgD(flat: number[], closed: boolean): string {
  if (flat.length < 2) return ''
  let d = `M ${flat[0]} ${flat[1]}`
  for (let i = 2; i + 5 < flat.length; i += 6) {
    d += ` C ${flat[i]} ${flat[i + 1]} ${flat[i + 2]} ${flat[i + 3]} ${flat[i + 4]} ${flat[i + 5]}`
  }
  if (closed) d += ' Z'
  return d
}

function polylineToSvgD(
  pts: { x: number; y: number }[],
  closed: boolean,
  originX: number,
  originY: number
): string {
  if (pts.length === 0) return ''
  const first = pts[0]!
  let d = `M ${originX + first.x} ${originY + first.y}`
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i]!
    d += ` L ${originX + p.x} ${originY + p.y}`
  }
  if (closed) d += ' Z'
  return d
}

function transformAttr(path: VectorPath): string {
  const r = path.rotation || 0
  const sx = path.scaleX ?? 1
  const sy = path.scaleY ?? 1
  return `translate(${path.x} ${path.y}) rotate(${r}) scale(${sx} ${sy})`
}

function regularPolygonPoints(sides: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < sides; i++) {
    const a = (Math.PI * 2 * i) / sides - Math.PI / 2
    pts.push(`${r * Math.cos(a)},${r * Math.sin(a)}`)
  }
  return pts.join(' ')
}

function starPoints(numPoints: number, outer: number, inner: number): string {
  const pts: string[] = []
  for (let i = 0; i < 2 * numPoints; i++) {
    const rad = i % 2 === 0 ? outer : inner
    const a = (Math.PI * i) / numPoints - Math.PI / 2
    pts.push(`${rad * Math.cos(a)},${rad * Math.sin(a)}`)
  }
  return pts.join(' ')
}

function pathVectorToSvg(path: VectorPath): string {
  if (!path.visible) return ''
  const pts = path.points
  if (!pts?.length) return ''
  const bezier = pathHasBezierHandles(pts)
  const d = bezier
    ? konvaBezierFlatToSvgD(flattenPathToKonvaBezier(path), path.closed)
    : polylineToSvgD(pts, path.closed, path.x, path.y)
  if (!d) return ''
  const fill = path.closed ? escAttr(path.fill) : 'none'
  const stroke = escAttr(path.stroke)
  return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${path.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${path.opacity ?? 1}"/>`
}

function pathShapeToSvg(path: VectorPath): string {
  if (!path.visible) return ''
  const tr = transformAttr(path)
  const stroke = escAttr(path.stroke)
  const fill = escAttr(path.fill)
  const op = path.opacity ?? 1
  const sw = path.strokeWidth

  switch (path.type) {
    case 'rectangle':
      return `<g transform="${tr}"><rect x="0" y="0" width="${path.width ?? 0}" height="${path.height ?? 0}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${op}"/></g>`
    case 'ellipse': {
      const rx = (path.width || 0) / 2
      const ry = (path.height || 0) / 2
      return `<g transform="${tr}"><ellipse cx="0" cy="0" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${op}"/></g>`
    }
    case 'polygon': {
      const sides = path.sides || 6
      const r = Math.min(path.width || 0, path.height || 0) / 2
      const points = regularPolygonPoints(sides, r)
      return `<g transform="${tr}"><polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${op}"/></g>`
    }
    case 'star': {
      const n = path.sides || 5
      const outer = Math.min(path.width || 0, path.height || 0) / 2
      const inner = path.innerRadius ?? outer / 2
      const points = starPoints(n, outer, inner)
      return `<g transform="${tr}"><polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${op}"/></g>`
    }
    case 'text': {
      const fs = path.fontSize || 24
      const ff = escAttr(path.fontFamily || 'Arial')
      const tx = escAttr(path.text || '')
      return `<g transform="${tr}"><text x="0" y="${fs}" font-family="${ff}" font-size="${fs}" fill="${fill}" stroke="none" opacity="${op}">${tx}</text></g>`
    }
    case 'path':
      return pathVectorToSvg(path)
    default:
      return ''
  }
}

export type VectorSvgExportOptions = {
  width: number
  height: number
  title?: string
}

/** Single-frame SVG (all visible layers, bottom-to-top). Bézier pen paths use cubic segments from vectorBezier. */
export function exportVectorFrameToSVGString(
  frame: VectorFrame,
  options: VectorSvgExportOptions
): string {
  const { width, height, title } = options
  const titleEl = title ? `<title>${escAttr(title)}</title>` : ''
  const chunks: string[] = []

  for (const layer of frame.layers) {
    if (!layer.visible) continue
    chunks.push(`<g opacity="${layer.opacity ?? 1}">`)
    for (const p of layer.paths) {
      chunks.push(pathShapeToSvg(p))
    }
    chunks.push('</g>')
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${titleEl}
${chunks.join('\n')}
</svg>`
}
