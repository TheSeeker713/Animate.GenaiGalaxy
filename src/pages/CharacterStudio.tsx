import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCharacterStore } from '@/store/characterStore'
import TemplateGallery from '@/components/character/TemplateGallery'
import CharacterCanvas from '@/components/character/CharacterCanvas'
import PlaybackCanvas from '@/components/character/PlaybackCanvas'
import MorphPanel from '@/components/character/MorphPanel'
import ExportModal from '@/components/character/ExportModal'
import WebcamPanel from '@/components/character/WebcamPanel'
import type { CharacterTemplate, CharacterLayer } from '@/types/character'
import Konva from 'konva'

export default function CharacterStudio() {
  const { characterId } = useParams()
  const navigate = useNavigate()
  const {
    currentCharacter,
    baseTemplate,
    isLoading,
    loadTemplate,
    saveCharacter,
    updateCharacter,
    selectedTool,
    showSkeleton,
    showGrid,
    selectedLayerId,
    lastSaved,
    isSaving,
    isPlaybackMode,
    setSelectedTool,
    setSelectedLayer,
    toggleSkeleton,
    toggleGrid,
    togglePlaybackMode,
    undo,
    redo,
    canUndo,
    canRedo
  } = useCharacterStore()
  
  const [showTemplateGallery, setShowTemplateGallery] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [rightPanelTab, setRightPanelTab] = useState<'properties' | 'morphs'>('properties')
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const canvasStageRef = useRef<Konva.Stage>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  
  useEffect(() => {
    if (characterId === 'new') {
      // Show template gallery for new character
      setShowTemplateGallery(true)
    } else if (characterId) {
      // Load existing character from localStorage
      const saved = localStorage.getItem(`character-${characterId}`)
      if (saved) {
        const character = JSON.parse(saved)
        useCharacterStore.setState({ currentCharacter: character })
      }
    }
  }, [characterId])
  
  // Update canvas size on window resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasContainerRef.current) {
        const { width, height } = canvasContainerRef.current.getBoundingClientRect()
        setCanvasSize({ width, height })
      }
    }
    
    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])
  
  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if target is an input element
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }
      
      if (e.ctrlKey || e.metaKey) {
        if (e.shiftKey && e.key === 'Z') {
          // Ctrl+Shift+Z or Cmd+Shift+Z = Redo
          e.preventDefault()
          if (canRedo()) redo()
        } else if (e.key === 'z' || e.key === 'Z') {
          // Ctrl+Z or Cmd+Z = Undo
          e.preventDefault()
          if (canUndo()) undo()
        } else if (e.key === 'y' || e.key === 'Y') {
          // Ctrl+Y or Cmd+Y = Redo
          e.preventDefault()
          if (canRedo()) redo()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, canUndo, canRedo])
  
  const handleSave = async () => {
    await saveCharacter()
  }
  
  const handleTemplateSelect = async (template: CharacterTemplate) => {
    await loadTemplate(template)
    setShowTemplateGallery(false)
  }
  
  const handleExport = () => {
    setShowExportModal(true)
  }
  
  const handleTestLive = () => {
    // TODO: Implement test live mode
    alert('Test Live feature coming soon!')
  }
  
  if (!currentCharacter && !showTemplateGallery) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Character Loaded</h2>
          <button
            onClick={() => setShowTemplateGallery(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
          >
            Choose Template
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">
            Character Studio
            {currentCharacter && ` | ${currentCharacter.name}`}
          </h1>
          {currentCharacter && (
            <div className="ml-4 flex items-center gap-2 text-sm">
              {isSaving ? (
                <span className="text-yellow-400 animate-pulse flex items-center gap-1">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : lastSaved ? (
                <span className="text-green-400 flex items-center gap-1">
                  ✓ Saved {new Date(lastSaved).toLocaleTimeString()}
                </span>
              ) : (
                <span className="text-gray-400">Not saved</span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => undo()}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canUndo()}
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button
            onClick={() => redo()}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canRedo()}
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-semibold"
            disabled={!currentCharacter}
          >
            💾 Save
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold"
            disabled={!currentCharacter}
          >
            📤 Export
          </button>
          <button
            onClick={handleTestLive}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-semibold"
            disabled={!currentCharacter}
          >
            🎭 Test Live
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Layers & Face Tracking */}
        <aside className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto flex flex-col">
          {/* Layers Section */}
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-bold mb-4">Layers</h2>
            
            {!currentCharacter || currentCharacter.layers.length === 0 ? (
              <p className="text-gray-400 text-sm">No layers yet</p>
            ) : (
              <div className="space-y-2">
                {currentCharacter.layers.map((layer: CharacterLayer) => (
                  <div
                    key={layer.id}
                    className={`p-2 rounded cursor-pointer transition ${
                      selectedLayerId === layer.id 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    onClick={() => setSelectedLayer(layer.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${selectedLayerId === layer.id ? 'font-bold' : ''}`}>
                        {selectedLayerId === layer.id && '▶ '}
                        {layer.name}
                      </span>
                      <input
                        type="checkbox"
                        checked={layer.visible}
                        onChange={(e) => {
                          e.stopPropagation()
                          updateCharacter({
                            ...currentCharacter,
                            layers: currentCharacter.layers.map((l: CharacterLayer) =>
                              l.id === layer.id ? { ...l, visible: e.target.checked } : l
                            )
                          })
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Face Tracking Section */}
          <div className="flex-1 p-4 overflow-y-auto">
            <WebcamPanel />
          </div>
        </aside>
        
        {/* Center - Canvas */}
        <main className="flex-1 bg-gray-900 relative overflow-hidden" ref={canvasContainerRef}>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4"></div>
                <p>Loading character...</p>
              </div>
            </div>
          ) : isPlaybackMode && currentCharacter ? (
            <PlaybackCanvas 
              character={currentCharacter}
              width={canvasSize.width}
              height={canvasSize.height}
              autoPlay={true}
              animation="idle"
            />
          ) : (
            <CharacterCanvas ref={canvasStageRef} width={canvasSize.width} height={canvasSize.height} />
          )}
          
          {/* Canvas toolbar */}
          {currentCharacter && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-gray-800 p-2 rounded-lg border border-gray-700">
              {/* Mode Toggle */}
              <button
                onClick={togglePlaybackMode}
                className={`px-3 py-2 rounded font-bold ${isPlaybackMode ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                title={isPlaybackMode ? 'Switch to Edit Mode' : 'Switch to Playback Mode'}
              >
                {isPlaybackMode ? '🎬' : '✏️'}
              </button>
              
              <div className="w-px bg-gray-600 mx-2"></div>
              
              {!isPlaybackMode && (
                <>
                  <button
                    onClick={() => setSelectedTool('select')}
                    className={`px-3 py-2 rounded ${selectedTool === 'select' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    title="Select"
                  >
                    🖱️
                  </button>
                  <button
                    onClick={() => setSelectedTool('bone')}
                    className={`px-3 py-2 rounded ${selectedTool === 'bone' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    title="Bone Tool"
                  >
                    🦴
                  </button>
                  <button
                    onClick={() => setSelectedTool('morph')}
                    className={`px-3 py-2 rounded ${selectedTool === 'morph' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    title="Morph Tool"
                  >
                    ⚙️
                  </button>
                  
                  <div className="w-px bg-gray-600 mx-2"></div>
                  
                  <button
                    onClick={toggleSkeleton}
                    className={`px-3 py-2 rounded ${showSkeleton ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    title="Show Skeleton"
                  >
                    🦴
                  </button>
                  <button
                    onClick={toggleGrid}
                    className={`px-3 py-2 rounded ${showGrid ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    title="Show Grid"
                  >
                    #
                  </button>
                </>
              )}
            </div>
          )}
        </main>
        
        {/* Right Panel - Properties/Morph */}
        <aside className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto flex flex-col">
          {/* Tab Header */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setRightPanelTab('properties')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
                rightPanelTab === 'properties'
                  ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-750'
              }`}
            >
              Properties
            </button>
            <button
              onClick={() => setRightPanelTab('morphs')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
                rightPanelTab === 'morphs'
                  ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-750'
              }`}
            >
              Morphs
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {rightPanelTab === 'properties' ? (
              <div className="p-4">
                {!currentCharacter ? (
                  <p className="text-gray-400 text-sm">No character loaded</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Character Name</label>
                      <input
                        type="text"
                        value={currentCharacter.name}
                        onChange={(e) => {
                          updateCharacter({ ...currentCharacter, name: e.target.value })
                        }}
                        className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                
                {selectedLayerId && (() => {
                  const selectedLayer = currentCharacter.layers.find(l => l.id === selectedLayerId)
                  if (!selectedLayer) return null
                  
                  return (
                    <div className="pt-4 border-t border-gray-700">
                      <h3 className="font-bold mb-3 text-blue-400">Selected Layer</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-400">Layer Name</label>
                          <input
                            type="text"
                            value={selectedLayer.name}
                            onChange={(e) => {
                              updateCharacter({
                                ...currentCharacter,
                                layers: currentCharacter.layers.map((l: CharacterLayer) =>
                                  l.id === selectedLayerId ? { ...l, name: e.target.value } : l
                                )
                              })
                            }}
                            className="w-full px-2 py-1 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium mb-1 text-gray-400">X Position</label>
                            <input
                              type="number"
                              value={Math.round(selectedLayer.position.x)}
                              onChange={(e) => {
                                updateCharacter({
                                  ...currentCharacter,
                                  layers: currentCharacter.layers.map((l: CharacterLayer) =>
                                    l.id === selectedLayerId 
                                      ? { ...l, position: { ...l.position, x: parseFloat(e.target.value) || 0 } } 
                                      : l
                                  )
                                })
                              }}
                              className="w-full px-2 py-1 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1 text-gray-400">Y Position</label>
                            <input
                              type="number"
                              value={Math.round(selectedLayer.position.y)}
                              onChange={(e) => {
                                updateCharacter({
                                  ...currentCharacter,
                                  layers: currentCharacter.layers.map((l: CharacterLayer) =>
                                    l.id === selectedLayerId 
                                      ? { ...l, position: { ...l.position, y: parseFloat(e.target.value) || 0 } } 
                                      : l
                                  )
                                })
                              }}
                              className="w-full px-2 py-1 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-400">Opacity: {Math.round(selectedLayer.opacity * 100)}%</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={selectedLayer.opacity}
                            onChange={(e) => {
                              updateCharacter({
                                ...currentCharacter,
                                layers: currentCharacter.layers.map((l: CharacterLayer) =>
                                  l.id === selectedLayerId ? { ...l, opacity: parseFloat(e.target.value) } : l
                                )
                              })
                            }}
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-400">Rotation: {Math.round(selectedLayer.rotation)}°</label>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            step="1"
                            value={selectedLayer.rotation}
                            onChange={(e) => {
                              updateCharacter({
                                ...currentCharacter,
                                layers: currentCharacter.layers.map((l: CharacterLayer) =>
                                  l.id === selectedLayerId ? { ...l, rotation: parseFloat(e.target.value) } : l
                                )
                              })
                            }}
                            className="w-full"
                          />
                        </div>
                        
                        <button
                          onClick={() => setSelectedLayer(null)}
                          className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
                        >
                          Deselect Layer
                        </button>
                      </div>
                    </div>
                  )
                })()}
                
                    <div>
                      <label className="block text-sm font-medium mb-1">Template</label>
                      <input
                        type="text"
                        value={baseTemplate?.name || 'None'}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-gray-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <MorphPanel />
            )}
          </div>
        </aside>
      </div>
      
      {/* Template Gallery Modal */}
      {showTemplateGallery && (
        <TemplateGallery
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplateGallery(false)}
        />
      )}
      {/* Export Modal */}
      {showExportModal && currentCharacter && (
        <ExportModal
          character={currentCharacter}
          stageRef={canvasStageRef}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  )
}