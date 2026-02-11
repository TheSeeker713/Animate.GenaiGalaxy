import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ReactFlowProvider } from 'reactflow'
import { useStoryStore } from '../store/storyStore'
import StoryCanvas from '../components/story/StoryCanvas'
import NodePalette from '../components/story/NodePalette'
import NodeInspector from '../components/story/NodeInspector'
import StoryPreview from '../components/story/StoryPreview'
import ExportModal from '../components/story/ExportModal'

export default function StoryBuilder() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const {
    currentStory,
    previewMode,
    newStory,
    loadStory,
    saveStory,
    startPreview,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useStoryStore()

  useEffect(() => {
    if (id === 'new') {
      // Create new story
      const name = prompt('Enter story name:')
      if (name) {
        newStory(name)
      } else {
        navigate('/dashboard')
      }
    } else if (id) {
      // Load existing story
      loadStory(id)
    }
  }, [id, newStory, loadStory, navigate])

  // Auto-save every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentStory) {
        saveStory()
      }
    }, 2000)
    
    return () => clearInterval(interval)
  }, [currentStory, saveStory])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          if (canUndo()) undo()
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault()
          if (canRedo()) redo()
        } else if (e.key === 's') {
          e.preventDefault()
          saveStory()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, canUndo, canRedo, saveStory])

  const handleBackToDashboard = () => {
    if (confirm('Save and return to dashboard?')) {
      saveStory()
      navigate('/dashboard')
    }
  }

  if (!currentStory) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">📖</div>
          <div className="text-xl font-bold">Loading Story Builder...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Toolbar */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
          >
            <span>←</span>
            <span className="text-sm">Dashboard</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-2xl">📖</span>
            <h1 className="text-xl font-bold text-white">
              {currentStory.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <button
            onClick={undo}
            disabled={!canUndo()}
            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>

          <div className="w-px h-6 bg-slate-700 mx-2" />

          {/* Actions */}
          <button
            onClick={saveStory}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors text-sm font-medium"
          >
            💾 Save
          </button>
          
          <button
            onClick={() => startPreview()}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm font-medium"
          >
            ▶️ Preview
          </button>
          
          <button
            onClick={() => setExportModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors text-sm font-medium"
          >
            📦 Export
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Node Palette (Left Sidebar) */}
        <NodePalette />

        {/* Canvas Area */}
        <div className="flex-1 relative">
          <ReactFlowProvider>
            <StoryCanvas />
          </ReactFlowProvider>
        </div>

        {/* Node Inspector (Right Sidebar) */}
        <NodeInspector />
      </div>

      {/* Story Preview Overlay */}
      {previewMode && <StoryPreview />}

      {/* Export Modal */}
      <ExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} />
    </div>
  )
}
