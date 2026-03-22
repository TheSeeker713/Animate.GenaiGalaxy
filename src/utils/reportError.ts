import { showToast } from '../store/toastStore'

export type ReportErrorOptions = {
  /** Shown in console */
  context?: string
  /** If set, this message is shown instead of a mapped message */
  userMessage?: string
  /** If true, no toast (console only) */
  silent?: boolean
}

function mapUnknownToUserMessage(error: unknown): string {
  if (error instanceof Error) {
    const m = error.message
    if (/quota|QuotaExceeded|storage.*full/i.test(m)) {
      return 'Storage is full. Free space in your browser or remove old projects.'
    }
    if (/IndexedDB|Dexie|database/i.test(m)) {
      return 'Could not access local data. Try another browser or disable private mode.'
    }
    if (/network|fetch|Failed to fetch/i.test(m)) {
      return 'Network error. Check your connection and try again.'
    }
    return m.length > 220 ? `${m.slice(0, 217)}…` : m
  }
  return String(error).slice(0, 220)
}

/**
 * Logs error to console; optionally shows a toast for user-facing failures.
 */
export function reportError(error: unknown, options?: ReportErrorOptions): void {
  const label = options?.context ? `[${options.context}]` : 'Error'
  if (error instanceof Error) {
    console.error(label, error)
  } else {
    console.error(label, error)
  }

  if (options?.silent) return

  const message =
    options?.userMessage ?? mapUnknownToUserMessage(error)
  showToast(message, 'error')
}
