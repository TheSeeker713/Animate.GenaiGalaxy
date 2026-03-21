import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
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
  // Setup global error handler
  if (typeof window !== 'undefined') {
    window.onerror = (message, source, lineno, colno, error) => {
      console.error('Global error:', { message, source, lineno, colno, error })
      return false // Let default handler run
    }
    
    window.onunhandledrejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason)
    }
  }
  
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/raster" element={<RasterOnboarding />} />
            <Route 
              path="/raster/:projectId" 
              element={
                <ProjectRoute type="raster">
                  <RasterStudio />
                </ProjectRoute>
              } 
            />
            <Route 
              path="/vector/:projectId" 
              element={
                <ProjectRoute type="vector">
                  <VectorStudio />
                </ProjectRoute>
              } 
            />
            <Route 
              path="/character/:characterId" 
              element={
                <ErrorBoundary>
                  <CharacterStudio />
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/story/:id" 
              element={
                <ErrorBoundary>
                  <StoryBuilder />
                </ErrorBoundary>
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

