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
  const { darkMode, toggleDarkMode, puppetMode, loadFromStorage, saveToStorage, frames, applyProjectSettings } = useAnimationStore()
  const { getProjectById, setCurrentProject } = useProjectStore()
  const [showExportModal, setShowExportModal] = useState(false)
  const storageKey = projectId ? `animate-project-${projectId}` : 'animate-project'

  // Load from localStorage on mount
  useEffect(() => {
    loadFromStorage(storageKey)
  }, [loadFromStorage, storageKey])

  // Auto-save to localStorage when frames change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToStorage(storageKey)
    }, 1000)
    return () => clearTimeout(timer)
  }, [frames, saveToStorage, storageKey])

  // Load project on mount
  useEffect(() => {
    if (projectId) {
      const project = getProjectById(projectId)
      if (project) {
        setCurrentProject(project)
        applyProjectSettings({
          width: project.width,
          height: project.height,
          fps: project.fps,
        })
      } else {
        // Project not found, redirect to dashboard
        navigate('/')
      }
    }
  }, [projectId, getProjectById, setCurrentProject, navigate, applyProjectSettings])

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
    <div className={`min-h-screen ${darkMode ? 'dark' : ''} raster-shell`}>
      <div className="flex flex-col h-screen">
        {/* Header with Toolbar */}
        <header className="studio-panel border-b border-slate-800">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToDashboard}
                className="tool-button"
                title="Back to Dashboard (`)"
              >
                ← 
              </button>
              <div>
                <h1 className="text-xl font-bold tracking-wide">Raster Animation Studio</h1>
                <p className="text-xs text-slate-400">Draw, animate, and export in one focused workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowExportModal(true)}
                className="studio-button-primary"
                title="Export Animation (Ctrl+E)"
              >
                📥 Export
              </button>
            </div>
          </div>
          <div className="px-4 pb-3">
            <Toolbar />
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas Area */}
          <main className="flex-1 relative overflow-hidden">
            <div className="w-full h-full studio-canvas">
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
        <footer className="border-t border-slate-800">
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
    <div className="absolute bottom-4 left-4 studio-panel--soft rounded-full z-10 flex items-center gap-2 px-3 py-2">
      <button
        onClick={() => setZoom(zoom / 1.2)}
        className="tool-button"
        title="Zoom Out (Ctrl+-)"
      >
        −
      </button>
      <button
        onClick={() => resetView()}
        className="tool-button text-sm"
        title="Reset Zoom (Ctrl+0)"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        onClick={() => setZoom(zoom * 1.2)}
        className="tool-button"
        title="Zoom In (Ctrl++)"
      >
        +
      </button>
    </div>
  )
}
