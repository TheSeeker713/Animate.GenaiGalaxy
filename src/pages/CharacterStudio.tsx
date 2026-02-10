import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCharacterStore } from '@/store/characterStore'
import TemplateGallery from '@/components/character/TemplateGallery'
import CharacterCanvas from '@/components/character/CharacterCanvas'
import type { CharacterTemplate, CharacterLayer } from '@/types/character'

export default function CharacterStudio() {
  const { characterId } = useParams()
  const navigate = useNavigate()
  const {
    currentCharacter,
    baseTemplate,
    isLoading,
    loadTemplate,
    saveCharacter,
    selectedTool,
    showSkeleton,
    showGrid,
    selectedLayerId,
    setSelectedTool,
    setSelectedLayer,
    toggleSkeleton,
    toggleGrid
  } = useCharacterStore()
  
  const [showTemplateGallery, setShowTemplateGallery] = useState(false)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
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
  
  const handleSave = async () => {
    await saveCharacter()
    // Show toast notification
    console.log('Character saved!')
  }
  
  const handleTemplateSelect = async (template: CharacterTemplate) => {
    await loadTemplate(template)
    setShowTemplateGallery(false)
  }
  
  const handleExport = () => {
    console.log('Export not yet implemented')
  }
  
  const handleTestLive = () => {
    console.log('Test live not yet implemented')
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
        </div>
        
        <div className="flex gap-2">
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
        {/* Left Panel - Layers */}
        <aside className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-4">
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
                          const updated = {
                            ...currentCharacter,
                            layers: currentCharacter.layers.map((l: CharacterLayer) =>
                              l.id === layer.id ? { ...l, visible: e.target.checked } : l
                            )
                          }
                          useCharacterStore.setState({ currentCharacter: updated })
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
          ) : (
            <CharacterCanvas width={canvasSize.width} height={canvasSize.height} />
          )}
          
          {/* Canvas toolbar */}
          {currentCharacter && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-gray-800 p-2 rounded-lg border border-gray-700">
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
                #️⃣
              </button>
            </div>
          )}
        </main>
        
        {/* Right Panel - Properties/Morph */}
        <aside className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-bold mb-4">Properties</h2>
            
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
                      const updated = { ...currentCharacter, name: e.target.value }
                      useCharacterStore.setState({ currentCharacter: updated })
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
                              const updated = {
                                ...currentCharacter,
                                layers: currentCharacter.layers.map((l: CharacterLayer) =>
                                  l.id === selectedLayerId ? { ...l, name: e.target.value } : l
                                )
                              }
                              useCharacterStore.setState({ currentCharacter: updated })
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
                                const updated = {
                                  ...currentCharacter,
                                  layers: currentCharacter.layers.map((l: CharacterLayer) =>
                                    l.id === selectedLayerId 
                                      ? { ...l, position: { ...l.position, x: parseFloat(e.target.value) || 0 } } 
                                      : l
                                  )
                                }
                                useCharacterStore.setState({ currentCharacter: updated })
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
                                const updated = {
                                  ...currentCharacter,
                                  layers: currentCharacter.layers.map((l: CharacterLayer) =>
                                    l.id === selectedLayerId 
                                      ? { ...l, position: { ...l.position, y: parseFloat(e.target.value) || 0 } } 
                                      : l
                                  )
                                }
                                useCharacterStore.setState({ currentCharacter: updated })
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
                              const updated = {
                                ...currentCharacter,
                                layers: currentCharacter.layers.map((l: CharacterLayer) =>
                                  l.id === selectedLayerId ? { ...l, opacity: parseFloat(e.target.value) } : l
                                )
                              }
                              useCharacterStore.setState({ currentCharacter: updated })
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
                              const updated = {
                                ...currentCharacter,
                                layers: currentCharacter.layers.map((l: CharacterLayer) =>
                                  l.id === selectedLayerId ? { ...l, rotation: parseFloat(e.target.value) } : l
                                )
                              }
                              useCharacterStore.setState({ currentCharacter: updated })
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
                
                <div className="pt-4 border-t border-gray-700">
                  <h3 className="font-bold mb-2">Morphs</h3>
                  <p className="text-sm text-gray-400">
                    Morph controls will appear here
                  </p>
                </div>
              </div>
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
    </div>
  )
}