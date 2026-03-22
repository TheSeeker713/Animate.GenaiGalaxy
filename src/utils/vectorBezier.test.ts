import { describe, it, expect } from 'vitest'
import {
  flattenPathToKonvaBezier,
  pathHasBezierHandles,
  polylineToBezierPoints,
} from './vectorBezier'
import type { VectorPath } from '../types/vector'

describe('vectorBezier', () => {
  it('detects handles', () => {
    expect(pathHasBezierHandles([{ x: 0, y: 0 }])).toBe(false)
    expect(pathHasBezierHandles([{ x: 0, y: 0, handleOut: { x: 1, y: 0 } }])).toBe(true)
  })

  it('polylineToBezierPoints gives end handles for open path', () => {
    const pts = polylineToBezierPoints(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
      false
    )
    expect(pts[0].handleOut).toBeDefined()
    expect(pts[1].handleIn).toBeDefined()
  })

  it('flattenPathToKonvaBezier produces coords', () => {
    const path: VectorPath = {
      id: '1',
      type: 'path',
      points: [
        { x: 0, y: 0, handleOut: { x: 2, y: 0 } },
        { x: 10, y: 0, handleIn: { x: -2, y: 0 } },
      ],
      closed: false,
      fill: 'transparent',
      stroke: '#000',
      strokeWidth: 1,
      opacity: 1,
      visible: true,
      name: 'p',
      x: 5,
      y: 5,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    }
    const flat = flattenPathToKonvaBezier(path)
    expect(flat.length).toBeGreaterThanOrEqual(8)
    expect(flat[0]).toBe(5)
    expect(flat[1]).toBe(5)
  })
})
