import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reportError } from './reportError'
import { useToastStore } from '../store/toastStore'

describe('reportError', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('pushes error toast with userMessage when provided', () => {
    reportError(new Error('x'), {
      userMessage: 'Custom message',
      silent: false,
    })
    const { toasts } = useToastStore.getState()
    expect(toasts.some((t) => t.message === 'Custom message')).toBe(true)
  })

  it('respects silent flag', () => {
    reportError(new Error('hidden'), { silent: true })
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })
})
