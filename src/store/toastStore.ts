import { create } from 'zustand'
import { nanoid } from 'nanoid'

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastState {
  toasts: ToastItem[]
  push: (message: string, variant?: ToastVariant, durationMs?: number) => string
  dismiss: (id: string) => void
}

const DEFAULT_DURATION = 5200

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, variant = 'info', durationMs = DEFAULT_DURATION) => {
    const id = nanoid()
    set((s) => ({
      toasts: [...s.toasts, { id, message, variant }],
    }))
    if (durationMs > 0) {
      window.setTimeout(() => get().dismiss(id), durationMs)
    }
    return id
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Use outside React / inside stores */
export function showToast(message: string, variant: ToastVariant = 'info'): void {
  useToastStore.getState().push(message, variant)
}
