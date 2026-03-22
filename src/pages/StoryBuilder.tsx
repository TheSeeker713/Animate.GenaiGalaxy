import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ReactFlowProvider } from 'reactflow'
import { useStoryStore } from '../store/storyStore'
import StoryCanvas from '../components/story/StoryCanvas'
import StoryShortcutsModal from '../components/story/StoryShortcutsModal'
import NodePalette from '../components/story/NodePalette'
import NodeInspector from '../components/story/NodeInspector'
import StoryPreview from '../components/story/StoryPreview'
import ExportModal from '../components/story/ExportModal'
import StoryAssistantPanel from '../components/story/StoryAssistantPanel'
import { showToast } from '../store/toastStore'
import { isLocalAiConfigured } from '../utils/localAiClient'
import { createMediaAssetFromDataUrl } from '../utils/storyAssetImport'

export default function StoryBuilder() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const {
    currentStory,
    previewMode,
    newStory,
    loadStory,
    saveStory,
    startPreview,
    addMediaAsset,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useStoryStore()

  const newStoryCancelled = useRef(false)

  useEffect(() => {
    if (id === 'new') {
      const existing = useStoryStore.getState().currentStory
      if (existing) {
        navigate(`/story/${existing.id}`, { replace: true })
        return
      }
      if (newStoryCancelled.current) {
        navigate('/dashboard', { replace: true })
        return
      }
      const name = prompt('Enter story name:')
      if (!name) {
        newStoryCancelled.current = true
        navigate('/dashboard', { replace: true })
        return
      }
      newStory(name)
      const created = useStoryStore.getState().currentStory
      if (created) {
        navigate(`/story/${created.id}`, { replace: true })
      }
      return
    }
    if (id) {
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

  // Cross-studio: paste image from clipboard (e.g. screenshot from Raster/Vector) into media library
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return
      const items = e.clipboardData?.items
      if (!items?.length) return
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (!file) continue
          e.preventDefault()
          const reader = new FileReader()
          reader.onload = () => {
            const dataUrl = reader.result as string
            addMediaAsset(createMediaAssetFromDataUrl(dataUrl, file.name || 'clipboard.png'))
            showToast('Image added to Story media library', 'success')
          }
          reader.readAsDataURL(file)
          return
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [addMediaAsset])

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

    const onHelp = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        const t = e.target as HTMLElement
        if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return
        e.preventDefault()
        setShortcutsOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keydown', onHelp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keydown', onHelp)
    }
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
            type="button"
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

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm"
            title="Keyboard shortcuts (?)"
          >
            ?
          </button>
          {isLocalAiConfigured() && (
            <button
              type="button"
              onClick={() => setAssistantOpen(true)}
              className="px-2.5 py-1.5 rounded-lg border border-cyan-700 text-cyan-200 hover:bg-slate-700 text-sm"
              title="Local story assistant (Ollama / OpenAI-compatible)"
            >
              Local AI
            </button>
          )}
          {/* Undo/Redo */}
          <button
            type="button"
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
            type="button"
            onClick={saveStory}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors text-sm font-medium"
          >
            💾 Save
          </button>
          
          <button
            type="button"
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
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Node Palette (Left Sidebar) */}
        <NodePalette />

        {/* Canvas Area */}
        <div className="flex-1 relative min-w-0">
          <ReactFlowProvider>
            <StoryCanvas />
          </ReactFlowProvider>
        </div>

        {/* Node Inspector (Right Sidebar) */}
        <NodeInspector />
      </div>

      {/* Story Preview Overlay */}
      {previewMode && <StoryPreview />}

      <StoryShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* Export Modal */}
      <ExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} />

      <StoryAssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </div>
  )
}
