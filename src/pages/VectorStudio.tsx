import { useEffect } from 'react'
import { useVectorStore } from '../store/vectorStore'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectStore } from '../store/projectStore'
import VectorToolbar from '../components/vector/VectorToolbar'
import VectorCanvas from '../components/vector/VectorCanvas'
import PropertiesPanel from '../components/vector/PropertiesPanel'

export default function VectorStudio() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { darkMode, toggleDarkMode } = useVectorStore()
  const { getProjectById, setCurrentProject } = useProjectStore()

  // Load project on mount
  useEffect(() => {
    if (projectId) {
      const result = getProjectById(projectId)
      if (result.success && result.data) {
        setCurrentProject(result.data)
      } else {
        navigate('/')
      }
    }
  }, [projectId, getProjectById, setCurrentProject, navigate])

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const {
        setTool,
        clearSelection,
        zoom,
        setZoom,
        resetView,
      } = useVectorStore.getState()

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          if (!e.ctrlKey && !e.metaKey) {
            setTool('select')
          }
          break
        case 'p':
          if (!e.ctrlKey && !e.metaKey) {
            setTool('pen')
          }
          break
        case 'r':
          if (!e.ctrlKey && !e.metaKey) {
            setTool('rectangle')
          }
          break
        case 'c':
          if (!e.ctrlKey && !e.metaKey) {
            setTool('ellipse')
          }
          break
        case 'g':
          if (!e.ctrlKey && !e.metaKey) {
            setTool('polygon')
          }
          break
        case 's':
          if (!e.ctrlKey && !e.metaKey) {
            setTool('star')
          }
          break
        case 't':
          if (!e.ctrlKey && !e.metaKey) {
            setTool('text')
          }
          break
        case 'i':
          if (!e.ctrlKey && !e.metaKey) {
            setTool('eyedropper')
          }
          break
        case 'd':
          if (!e.ctrlKey && !e.metaKey) {
            toggleDarkMode()
          }
          break
        case 'escape':
          clearSelection()
          break
        case '`':
          e.preventDefault()
          navigate('/')
          break
        case '=':
        case '+':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setZoom(zoom * 1.2)
          }
          break
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setZoom(zoom / 1.2)
          }
          break
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            resetView()
          }
          break
        case 'delete':
        case 'backspace':
          const { selectedPathIds, deletePath, currentFrameIndex, currentLayerIndex } = useVectorStore.getState()
          if (selectedPathIds.length > 0 && !(e.target instanceof HTMLInputElement)) {
            e.preventDefault()
            selectedPathIds.forEach((id: string) => {
              deletePath(currentFrameIndex, currentLayerIndex, id)
            })
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  const handleBackToDashboard = () => {
    navigate('/')
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        {/* Header with Toolbar */}
        <header className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToDashboard}
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                title="Back to Dashboard (`)"
              >
                ←
              </button>
              <h1 className="text-xl font-bold">Vector Studio</h1>
              <button
                onClick={toggleDarkMode}
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                title="Toggle Dark Mode (D)"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
            <VectorToolbar />
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas Area */}
          <main className="flex-1 relative overflow-hidden">
            <VectorCanvas />

            {/* Zoom Controls */}
            <ZoomControls />
          </main>

          {/* Properties Panel */}
          <PropertiesPanel />
        </div>
      </div>
    </div>
  )
}

// Zoom Controls Component
function ZoomControls() {
  const { zoom, setZoom, resetView } = useVectorStore()

  return (
    <div className="absolute bottom-4 left-4 bg-gray-900/80 text-white rounded shadow-lg z-10 flex items-center gap-2 px-3 py-2">
      <button
        onClick={() => setZoom(zoom / 1.2)}
        className="px-2 py-1 hover:bg-gray-700 rounded transition"
        title="Zoom Out (Ctrl+-)"
      >
        −
      </button>
      <button
        onClick={() => resetView()}
        className="px-2 py-1 hover:bg-gray-700 rounded transition text-sm"
        title="Reset Zoom (Ctrl+0)"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        onClick={() => setZoom(zoom * 1.2)}
        className="px-2 py-1 hover:bg-gray-700 rounded transition"
        title="Zoom In (Ctrl++)"
      >
        +
      </button>
    </div>
  )
}
