import { describe, it, expect } from 'vitest'
import { ProjectSchema, sanitizeText } from './validators'

describe('sanitizeText', () => {
  it('strips HTML and returns plain text', () => {
    expect(sanitizeText('<b>hi</b>')).not.toContain('<')
  })
})

describe('ProjectSchema', () => {
  it('accepts a valid project', () => {
    const now = new Date().toISOString()
    const p = {
      id: '1',
      name: 'Test',
      type: 'raster' as const,
      thumbnail: '',
      width: 100,
      height: 100,
      createdAt: now,
      modifiedAt: now,
    }
    expect(ProjectSchema.parse(p)).toMatchObject({ id: '1', name: 'Test' })
  })
})
