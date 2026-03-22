import { lazy, Suspense, useEffect } from 'react'
import { reportError } from './utils/reportError'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { StudioErrorBoundary } from './components/StudioErrorBoundary'
import ToastContainer from './components/common/ToastContainer'
import { useProjectStore } from './store/projectStore'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const RasterStudio = lazy(() => import('./pages/RasterStudio'))
const RasterOnboarding = lazy(() => import('./pages/RasterOnboarding'))
const VectorStudio = lazy(() => import('./pages/VectorStudio'))
const CharacterStudio = lazy(() => import('./pages/CharacterStudio'))
const StoryBuilder = lazy(() => import('./pages/StoryBuilder'))

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200 text-sm">
      Loading…
    </div>
  )
}

// Route guard for project-based routes
function ProjectRoute({ children, type }: { children: React.ReactNode, type?: string }) {
  const { projectId } = useParams()
  const getProjectById = useProjectStore((state) => state.getProjectById)
  
  if (!projectId) {
    return <Navigate to="/" replace />
  }
  
  const result = getProjectById(projectId)
  if (!result.success) {
    console.error('Project not found:', projectId)
    return <Navigate to="/" replace />
  }
  
  // Validate project type if specified
  if (type && result.data?.type !== type) {
    console.error(`Invalid project type. Expected ${type}, got ${result.data?.type}`)
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

function App() {
  useEffect(() => {
    let lastToastAt = 0
    const throttleMs = 10_000

    const notify = (reason: unknown, context: string) => {
      const err =
        reason instanceof Error ? reason : new Error(String(reason))
      console.error(context, err)
      const now = Date.now()
      if (now - lastToastAt < throttleMs) return
      lastToastAt = now
      reportError(err, {
        context,
        silent: import.meta.env.DEV,
      })
    }

    const onWindowError: OnErrorEventHandler = (message, _source, _lineno, _colno, error) => {
      const err =
        error ?? new Error(typeof message === 'string' ? message : 'Unknown error')
      notify(err, 'global:onerror')
      return false
    }

    const onRejection = (event: PromiseRejectionEvent) => {
      notify(event.reason, 'global:unhandledrejection')
    }

    window.onerror = onWindowError
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.onerror = null
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastContainer />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/raster"
              element={
                <StudioErrorBoundary studioName="Raster onboarding">
                  <RasterOnboarding />
                </StudioErrorBoundary>
              }
            />
            <Route
              path="/raster/:projectId"
              element={
                <StudioErrorBoundary studioName="Raster Studio">
                  <ProjectRoute type="raster">
                    <RasterStudio />
                  </ProjectRoute>
                </StudioErrorBoundary>
              }
            />
            <Route
              path="/vector/:projectId"
              element={
                <StudioErrorBoundary studioName="Vector Studio">
                  <ProjectRoute type="vector">
                    <VectorStudio />
                  </ProjectRoute>
                </StudioErrorBoundary>
              }
            />
            <Route
              path="/character/:characterId"
              element={
                <StudioErrorBoundary studioName="Character Studio">
                  <CharacterStudio />
                </StudioErrorBoundary>
              }
            />
            <Route
              path="/story/:id"
              element={
                <StudioErrorBoundary studioName="Story Builder">
                  <StoryBuilder />
                </StudioErrorBoundary>
              }
            />
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App

