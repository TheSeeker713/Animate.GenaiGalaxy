import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAnimationStore } from '../store/useAnimationStore'
import { useProjectStore } from '../store/projectStore'
import Toolbar from '../components/raster/Toolbar'
import Canvas from '../components/raster/Canvas'
import Timeline from '../components/raster/Timeline'
import LayersPanel from '../components/raster/LayersPanel'
import ExportModal from '../components/raster/ExportModal'
import WebcamPuppet from '../components/WebcamPuppet'

export default function RasterStudio() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { darkMode, toggleDarkMode, puppetMode, loadFromStorage, saveToStorage, frames } = useAnimationStore()
  const { getProjectById, setCurrentProject } = useProjectStore()
  const [showExportModal, setShowExportModal] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  // Auto-save to localStorage when frames change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToStorage()
    }, 1000)
    return () => clearTimeout(timer)
  }, [frames, saveToStorage])

  // Load project on mount
  useEffect(() => {
    if (projectId) {
      const project = getProjectById(projectId)
      if (project) {
        setCurrentProject(project)
      } else {
        // Project not found, redirect to dashboard
        navigate('/')
      }
    }
  }, [projectId, getProjectById, setCurrentProject, navigate])

  // Apply dark mode class to document
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
        setTool, togglePlay, setCurrentFrame, currentFrameIndex, frames, 
        togglePuppetMode, toggleOnionSkin, undo, redo, zoom, setZoom, resetView
      } = useAnimationStore.getState()
      
      // Prevent shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      switch (e.key.toLowerCase()) {
        case 'b':
          setTool('brush')
          break
        case 'e':
          if (!e.ctrlKey && !e.metaKey) {
            setTool('eraser')
          }
          break
        case 's':
          if (!e.ctrlKey && !e.metaKey) {
            setTool('select')
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
        case 'l':
          if (!e.ctrlKey && !e.metaKey) {
            setTool('line')
          }
          break
        case 'f':
          if (!e.ctrlKey && !e.metaKey) {
            setTool('fill')
          }
          break
        case 'i':
          if (!e.ctrlKey && !e.metaKey) {
            setTool('eyedropper')
          }
          break
        case 't':
          if (!e.ctrlKey && !e.metaKey) {
            setTool('text')
          }
          break
        case 'v':
          if (!e.ctrlKey && !e.metaKey) {
            setTool('transform')
          }
          break
        case 'p':
          if (!e.ctrlKey && !e.metaKey) {
            togglePuppetMode()
          }
          break
        case 'o':
          if (!e.ctrlKey && !e.metaKey) {
            toggleOnionSkin()
          }
          break
        case 'd':
          if (!e.ctrlKey && !e.metaKey) {
            toggleDarkMode()
          }
          break
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'q':
          if (currentFrameIndex > 0) {
            setCurrentFrame(currentFrameIndex - 1)
          }
          break
        case 'w':
          if (currentFrameIndex < frames.length - 1) {
            setCurrentFrame(currentFrameIndex + 1)
          }
          break
        case '`':
          e.preventDefault()
          handleBackToDashboard()
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
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
          }
          break
        case 'y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            redo()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleBackToDashboard = () => {
    navigate('/')
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex flex-col h-screen bg-black text-white">
        {/* Header with Toolbar */}
        <header 
          className="border-b border-gray-800"
          style={{
            background: 'linear-gradient(180deg, #1A1A1A 0%, #0A0A0A 100%)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
          }}
        >
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToDashboard}
                className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
                style={{
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
                }}
                title="Back to Dashboard (`)"
              >
                ← 
              </button>
              <h1 className="text-xl font-bold">Raster Animation Studio</h1>
              <button
                onClick={() => setShowExportModal(true)}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition flex items-center gap-2"
                style={{
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
                title="Export Animation (Ctrl+E)"
              >
                📥 Export
              </button>
            </div>
            <Toolbar />
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden bg-gray-900">
          {/* Canvas Area */}
          <main className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
            <div 
              className="relative rounded-lg overflow-hidden"
              style={{
                boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
              }}
            >
              <Canvas />
            </div>
            {puppetMode && <WebcamPuppet />}
            
            {/* Zoom Controls */}
            <ZoomControls />
          </main>

          {/* Layers Panel */}
          <LayersPanel />
        </div>

        {/* Timeline at Bottom */}
        <footer 
          className="border-t border-gray-800"
          style={{
            background: 'linear-gradient(180deg, #0A0A0A 0%, #000000 100%)',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
          }}
        >
          <Timeline />
        </footer>

        {/* Export Modal */}
        <ExportModal 
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
        />
      </div>
    </div>
  )
}

// Zoom Controls Component
function ZoomControls() {
  const { zoom, setZoom, resetView } = useAnimationStore()

  return (
    <div 
      className="absolute bottom-4 left-4 text-white rounded shadow-lg z-10 flex items-center gap-2 px-3 py-2"
      style={{
        background: 'linear-gradient(180deg, #2A2A2A 0%, #1A1A1A 100%)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
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
