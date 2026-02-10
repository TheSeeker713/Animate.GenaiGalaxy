import { useState } from 'react'
import { useAnimationStore } from '../../store/useAnimationStore'
import type { Layer } from '../../types'

export default function LayersPanel() {
  const {
    frames,
    currentFrameIndex,
    currentLayerIndex,
    setCurrentLayer,
    addLayer,
    deleteLayer,
    updateLayer,
    reorderLayer,
    mergeLayerDown,
  } = useAnimationStore()

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [expandedEffects, setExpandedEffects] = useState<string | null>(null)

  const currentFrame = frames[currentFrameIndex]
  if (!currentFrame) return null

  const layers = currentFrame.layers

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      reorderLayer(currentFrameIndex, draggedIndex, dragOverIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleDragEnd()
  }

  // Double click to rename
  const handleDoubleClick = (layer: Layer) => {
    setEditingLayerId(layer.id)
    setEditingName(layer.name)
  }

  const handleNameSubmit = (layerId: string) => {
    if (editingName.trim()) {
      updateLayer(currentFrameIndex, layerId, { name: editingName })
    }
    setEditingLayerId(null)
  }

  return (
    <div className="w-72 studio-panel--soft border-l border-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-100">Layers</h3>
          <button
            onClick={() => addLayer(currentFrameIndex)}
            className="studio-button-secondary text-sm"
            title="Add Layer"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {[...layers].reverse().map((layer, reverseIndex) => {
          const actualIndex = layers.length - 1 - reverseIndex
          const isActive = actualIndex === currentLayerIndex
          const isDragging = draggedIndex === actualIndex
          const isDragOver = dragOverIndex === actualIndex
          const isEditing = editingLayerId === layer.id
          const showEffects = expandedEffects === layer.id

          return (
            <div
              key={layer.id}
              draggable
              onDragStart={(e) => handleDragStart(e, actualIndex)}
              onDragOver={(e) => handleDragOver(e, actualIndex)}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              onClick={() => setCurrentLayer(actualIndex)}
              onDoubleClick={() => handleDoubleClick(layer)}
              className={`p-2 rounded-xl cursor-move transition ${
                isDragging ? 'opacity-50' : ''
              } ${isDragOver ? 'border-t-2 border-emerald-400' : ''} ${
                isActive
                  ? 'bg-emerald-500/20 text-white border border-emerald-400/40'
                  : 'bg-slate-900/60 text-slate-100 border border-slate-800 hover:bg-slate-900'
              }`}
            >
              {/* Layer Header */}
              <div className="flex items-center justify-between mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleNameSubmit(layer.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNameSubmit(layer.id)
                      if (e.key === 'Escape') setEditingLayerId(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="text-sm font-medium px-2 rounded flex-1 text-slate-900 bg-white"
                  />
                ) : (
                  <span className="text-sm font-medium" title="Double-click to rename">
                    {layer.name}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  {/* Visibility Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      updateLayer(currentFrameIndex, layer.id, {
                        visible: !layer.visible,
                      })
                    }}
                    className={`text-xs px-1 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                    title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                  >
                    {layer.visible ? '👁️' : '🚫'}
                  </button>
                  
                  {/* Merge Down Button */}
                  {actualIndex > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        mergeLayerDown(currentFrameIndex, actualIndex)
                      }}
                      className={`text-xs px-1 ${
                        isActive ? 'text-white' : 'text-slate-400'
                      } hover:text-emerald-300`}
                      title="Merge Layer Down"
                    >
                      ⬇️
                    </button>
                  )}
                  
                  {/* Delete Button */}
                  {layers.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteLayer(currentFrameIndex, layer.id)
                      }}
                      className={`text-xs px-1 ${
                        isActive ? 'text-white' : 'text-slate-400'
                      } hover:text-red-400`}
                      title="Delete Layer"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              {/* Opacity Slider */}
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-slate-400">Opacity:</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={layer.opacity * 100}
                  onChange={(e) => {
                    e.stopPropagation()
                    updateLayer(currentFrameIndex, layer.id, {
                      opacity: Number(e.target.value) / 100,
                    })
                  }}
                  className="flex-1 studio-slider"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-xs w-8 text-slate-200">
                  {Math.round(layer.opacity * 100)}%
                </span>
              </div>

              {/* Blend Mode */}
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-slate-400">Blend:</label>
                <select
                  value={layer.blendMode || 'normal'}
                  onChange={(e) => {
                    e.stopPropagation()
                    updateLayer(currentFrameIndex, layer.id, {
                      blendMode: e.target.value as any,
                    })
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`flex-1 text-xs rounded px-2 studio-input ${
                    isActive ? 'border-emerald-400/60' : ''
                  }`}
                >
                  <option value="normal">Normal</option>
                  <option value="multiply">Multiply</option>
                  <option value="screen">Screen</option>
                  <option value="overlay">Overlay</option>
                  <option value="darken">Darken</option>
                  <option value="lighten">Lighten</option>
                </select>
              </div>

              {/* Effects Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedEffects(showEffects ? null : layer.id)
                }}
                className={`text-xs w-full text-left px-2 py-1 rounded studio-button-secondary ${
                  isActive ? 'border-emerald-400/60' : ''
                }`}
              >
                {showEffects ? '▼' : '▶'} Effects
              </button>

              {/* Effects Controls */}
              {showEffects && (
                <div className="mt-2 space-y-2 text-xs" onClick={(e) => e.stopPropagation()}>
                  {/* Blur */}
                  <div className="flex items-center gap-2">
                    <label className="w-16 text-slate-400">Blur:</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={layer.effects?.blur || 0}
                      onChange={(e) => {
                        updateLayer(currentFrameIndex, layer.id, {
                          effects: {
                            ...layer.effects,
                            blur: Number(e.target.value),
                          },
                        })
                      }}
                      className="flex-1 studio-slider"
                    />
                    <span className="w-6 text-slate-200">{layer.effects?.blur || 0}</span>
                  </div>

                  {/* Brightness */}
                  <div className="flex items-center gap-2">
                    <label className="w-16 text-slate-400">Bright:</label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={layer.effects?.brightness || 0}
                      onChange={(e) => {
                        updateLayer(currentFrameIndex, layer.id, {
                          effects: {
                            ...layer.effects,
                            brightness: Number(e.target.value),
                          },
                        })
                      }}
                      className="flex-1 studio-slider"
                    />
                    <span className="w-8 text-slate-200">{layer.effects?.brightness || 0}</span>
                  </div>

                  {/* Contrast */}
                  <div className="flex items-center gap-2">
                    <label className="w-16 text-slate-400">Contrast:</label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={layer.effects?.contrast || 0}
                      onChange={(e) => {
                        updateLayer(currentFrameIndex, layer.id, {
                          effects: {
                            ...layer.effects,
                            contrast: Number(e.target.value),
                          },
                        })
                      }}
                      className="flex-1 studio-slider"
                    />
                    <span className="w-8 text-slate-200">{layer.effects?.contrast || 0}</span>
                  </div>
                </div>
              )}

              {/* Layer Thumbnail Preview */}
              {layer.imageData && (
                <div className="mt-2 border border-slate-700 rounded overflow-hidden">
                  <img
                    src={layer.imageData}
                    alt={layer.name}
                    className="w-full h-12 object-cover pointer-events-none"
                    style={{
                      filter: `blur(${(layer.effects?.blur || 0) / 4}px) brightness(${100 + (layer.effects?.brightness || 0)}%) contrast(${100 + (layer.effects?.contrast || 0)}%)`,
                      mixBlendMode: layer.blendMode || 'normal',
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Layer Info */}
      <div className="p-2 border-t border-slate-800 text-xs text-slate-400">
        {layers.length} / 10 layers
      </div>
    </div>
  )
}
