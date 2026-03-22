import { describe, it, expect } from 'vitest'
import type { VectorFrame } from '../types/vector'
import { exportVectorFrameToSVGString } from './vectorSvgExport'

describe('exportVectorFrameToSVGString', () => {
  it('emits valid SVG root and viewBox', () => {
    const frame: VectorFrame = {
      id: 'f1',
      timestamp: 0,
      duration: 100,
      layers: [
        {
          id: 'l1',
          name: 'L1',
          visible: true,
          locked: false,
          opacity: 1,
          paths: [],
          keyframes: [],
        },
      ],
    }
    const svg = exportVectorFrameToSVGString(frame, { width: 100, height: 50, title: 'T&st' })
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(svg).toContain('viewBox="0 0 100 50"')
    expect(svg).toContain('T&amp;st')
  })
})
