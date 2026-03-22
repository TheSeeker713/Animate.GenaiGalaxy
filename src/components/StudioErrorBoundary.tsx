import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ErrorBoundary } from './ErrorBoundary'
import { AlertTriangle } from 'lucide-react'

type Props = {
  studioName: string
  children: ReactNode
}

export function StudioErrorBoundary({ studioName, children }: Props) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
          <div className="max-w-lg w-full rounded-2xl border border-red-500/40 bg-slate-900/95 p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-10 h-10 text-red-400 shrink-0" />
              <div>
                <h1 className="text-xl font-semibold">{studioName}</h1>
                <p className="text-slate-400 text-sm mt-1">
                  This workspace hit an unexpected error.
                </p>
              </div>
            </div>
            <p className="text-slate-300 text-sm mb-6">
              Try reloading the page. If it keeps happening, your project data is still
              stored locally unless you cleared site data.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-medium transition-colors"
              >
                Reload
              </button>
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-sm font-medium transition-colors"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}
