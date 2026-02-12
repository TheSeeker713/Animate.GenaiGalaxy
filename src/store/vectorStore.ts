import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { nanoid } from 'nanoid'
import type { VectorState, VectorFrame, VectorLayer, VectorPath, Keyframe } from '../types/vector'
import { eventBus, safeEmit } from '../utils/eventBus'
import { validateNumber, clamp, enforceLimit } from '../utils/validators'

// Limits to prevent performance issues
const MAX_FRAMES = 300
const MAX_LAYERS_PER_FRAME = 20
const MAX_PATHS_PER_LAYER = 50
const MAX_SELECTED_PATHS = 50
const MAX_COLORS_IN_PALETTE = 20

interface VectorStore extends VectorState {
  // Tool actions
  setTool: (tool: VectorState['currentTool']) => void
  setStrokeColor: (color: string) => void
  setFillColor: (color: string) => void
  setStrokeWidth: (width: number) => void
  
  // Selection actions
  selectPath: (pathId: string, addToSelection?: boolean) => void
  clearSelection: () => void
  
  // Frame actions
  setCurrentFrame: (index: number) => void
  addFrame: () => void
  deleteFrame: (index: number) => void
  duplicateFrame: (index: number) => void
  
  // Layer actions
  setCurrentLayer: (index: number) => void
  addLayer: (frameIndex: number) => void
  deleteLayer: (frameIndex: number, layerId: string) => void
  updateLayer: (frameIndex: number, layerId: string, updates: Partial<VectorLayer>) => void
  
  // Path actions
  addPath: (frameIndex: number, layerIndex: number, path: VectorPath) => void
  updatePath: (frameIndex: number, layerIndex: number, pathId: string, updates: Partial<VectorPath>) => void
  deletePath: (frameIndex: number, layerIndex: number, pathId: string) => void
  
  // Keyframe actions
  addKeyframe: (frameIndex: number, layerIndex: number, keyframe: Keyframe) => void
  deleteKeyframe: (frameIndex: number, layerIndex: number, time: number) => void
  
  // Playback actions
  setFps: (fps: number) => void
  togglePlay: () => void
  setPlaying: (playing: boolean) => void
  
  // View actions
  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void
  resetView: () => void
  toggleGrid: () => void
  setGridSize: (size: number) => void
  
  // Mode toggles
  toggleDarkMode: () => void
  toggleSnapToGrid: () => void
  
  // Color palette
  addColorToPalette: (color: string) => void
}

const createDefaultLayer = (): VectorLayer => ({
  id: nanoid(),
  name: 'Layer 1',
  visible: true,
  locked: false,
  opacity: 1,
  paths: [],
  keyframes: [],
})

const createDefaultFrame = (): VectorFrame => ({
  id: nanoid(),
  layers: [createDefaultLayer()],
  timestamp: Date.now(),
  duration: 1000 / 24, // 24fps default
})

export const useVectorStore = create<VectorStore>()(
  persist(
    immer((set, get) => ({
  // Initial state
  currentTool: 'select',
  selectedPathIds: [],
  strokeColor: '#000000',
  fillColor: 'transparent',
  strokeWidth: 2,
  currentFrameIndex: 0,
  currentLayerIndex: 0,
  fps: 24,
  isPlaying: false,
  darkMode: true,
  frames: [createDefaultFrame()],
  zoom: 1,
  panX: 0,
  panY: 0,
  snapToGrid: false,
  gridSize: 20,
  showGrid: true,
  colorPalette: [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  ],
  
  // Tool actions
  setTool: (tool) => {
    // Prevent tool switches during playback
    if (get().isPlaying) {
      console.warn('Cannot switch tools during playback')
      return
    }
    set((draft) => { draft.currentTool = tool })
  },
  
  setStrokeColor: (color) => set((draft) => { draft.strokeColor = color }),
  setFillColor: (color) => set((draft) => { draft.fillColor = color }),
  setStrokeWidth: (width) => {
    const validated = validateNumber(width, 1)
    set((draft) => { draft.strokeWidth = validated })
  },
  
  // Selection actions
  selectPath: (pathId, addToSelection = false) => {
    set((draft) => {
      if (addToSelection) {
        if (draft.selectedPathIds.includes(pathId)) {
          draft.selectedPathIds = draft.selectedPathIds.filter(id => id !== pathId)
        } else {
          // Enforce selection limit
          if (draft.selectedPathIds.length < MAX_SELECTED_PATHS) {
            draft.selectedPathIds.push(pathId)
          } else {
            console.warn(`Selection limit reached (${MAX_SELECTED_PATHS})`)
          }
        }
      } else {
        draft.selectedPathIds = [pathId]
      }
    })
  },
  
  clearSelection: () => set((draft) => { draft.selectedPathIds = [] }),
  
  // Frame actions
  setCurrentFrame: (index) => {
    const state = get()
    const validIndex = clamp(index, 0, state.frames.length - 1)
    set((draft) => { draft.currentFrameIndex = validIndex })
  },

  addFrame: () => {
    const state = get()
    
    // Enforce frame limit
    if (state.frames.length >= MAX_FRAMES) {
      console.error(`Frame limit reached (${MAX_FRAMES})`)
      alert(`Maximum ${MAX_FRAMES} frames allowed.`)
      return
    }
    
    const newFrame = createDefaultFrame()
    set((draft) => {
      draft.frames.push(newFrame)
      draft.currentFrameIndex = draft.frames.length - 1
    })
  },

  deleteFrame: (index) => {
    const state = get()
    if (state.frames.length <= 1) {
      console.warn('Cannot delete the only frame')
      return
    }
    
    set((draft) => {
      draft.frames.splice(index, 1)
      draft.currentFrameIndex = Math.min(draft.currentFrameIndex, draft.frames.length - 1)
    })
  },

  duplicateFrame: (index) => {
    const state = get()
    
    // Enforce frame limit
    if (state.frames.length >= MAX_FRAMES) {
      console.error(`Frame limit reached (${MAX_FRAMES})`)
      alert(`Maximum ${MAX_FRAMES} frames allowed.`)
      return
    }
    
    const frameToDuplicate = state.frames[index]
    if (!frameToDuplicate) return
    
    const duplicatedFrame: VectorFrame = {
      id: nanoid(),
      layers: frameToDuplicate.layers.map(layer => ({
        ...layer,
        id: nanoid(),
        paths: layer.paths.map(path => ({...path, id: nanoid()}))
      })),
      timestamp: Date.now(),
      duration: frameToDuplicate.duration
    }
    
    set((draft) => {
      draft.frames.splice(index + 1, 0, duplicatedFrame)
      draft.currentFrameIndex = index + 1
    })
  },
  
  // Layer actions
  setCurrentLayer: (index) => {
    const state = get()
    const frame = state.frames[state.currentFrameIndex]
    if (frame) {
      const validIndex = clamp(index, 0, frame.layers.length - 1)
      set((draft) => { draft.currentLayerIndex = validIndex })
    }
  },

  addLayer: (frameIndex) => {
    const state = get()
    const frame = state.frames[frameIndex]
    if (!frame) return
    
    // Enforce layer limit
    if (frame.layers.length >= MAX_LAYERS_PER_FRAME) {
      console.error(`Layer limit reached (${MAX_LAYERS_PER_FRAME})`)
      alert(`Maximum ${MAX_LAYERS_PER_FRAME} layers per frame allowed.`)
      return
    }

    const newLayer: VectorLayer = {
      id: nanoid(),
      name: `Layer ${frame.layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1,
      paths: [],
      keyframes: [],
    }

    set((draft) => {
      draft.frames[frameIndex].layers.push(newLayer)
    })
  },

  deleteLayer: (frameIndex, layerId) => {
    const state = get()
    const frame = state.frames[frameIndex]
    if (!frame || frame.layers.length <= 1) {
      console.warn('Cannot delete the only layer')
      return
    }

    set((draft) => {
      draft.frames[frameIndex].layers = draft.frames[frameIndex].layers.filter(
        l => l.id !== layerId
      )
    })
  },

  updateLayer: (frameIndex, layerId, updates) => {
    // Validate opacity if provided
    if (updates.opacity !== undefined) {
      updates.opacity = clamp(validateNumber(updates.opacity, 1), 0, 1)
    }
    
    set((draft) => {
      const layer = draft.frames[frameIndex]?.layers.find(l => l.id === layerId)
      if (layer) {
        Object.assign(layer, updates)
      }
    })
  },
  
  // Path actions
  addPath: (frameIndex, layerIndex, path) => {
    const state = get()
    const layer = state.frames[frameIndex]?.layers[layerIndex]
    if (!layer) return
    
    // Enforce path limit
    if (layer.paths.length >= MAX_PATHS_PER_LAYER) {
      console.error(`Path limit reached (${MAX_PATHS_PER_LAYER})`)
      alert(`Maximum ${MAX_PATHS_PER_LAYER} paths per layer allowed.`)
      return
    }
    
    // Ensure unique ID
    path.id = path.id || nanoid()
    
    set((draft) => {
      draft.frames[frameIndex].layers[layerIndex].paths.push(path)
    })
  },

  updatePath: (frameIndex, layerIndex, pathId, updates) => {
    set((draft) => {
      const path = draft.frames[frameIndex]?.layers[layerIndex]?.paths.find(
        p => p.id === pathId
      )
      if (path) {
        Object.assign(path, updates)
      }
    })
  },

  deletePath: (frameIndex, layerIndex, pathId) => {
    set((draft) => {
      const layer = draft.frames[frameIndex]?.layers[layerIndex]
      if (layer) {
        layer.paths = layer.paths.filter(p => p.id !== pathId)
      }
      draft.selectedPathIds = draft.selectedPathIds.filter(id => id !== pathId)
    })
  },
  
  // Keyframe actions
  addKeyframe: (frameIndex, layerIndex, keyframe) => {
    set((draft) => {
      const layer = draft.frames[frameIndex]?.layers[layerIndex]
      if (layer) {
        layer.keyframes.push(keyframe)
        layer.keyframes.sort((a, b) => a.time - b.time)
      }
    })
  },

  deleteKeyframe: (frameIndex, layerIndex, time) => {
    set((draft) => {
      const layer = draft.frames[frameIndex]?.layers[layerIndex]
      if (layer) {
        layer.keyframes = layer.keyframes.filter(k => k.time !== time)
      }
    })
  },

  // Playback actions
  setFps: (fps) => set((draft) => { 
    draft.fps = clamp(validateNumber(fps, 24), 1, 120)
  }),
  
  togglePlay: () => set((draft) => { 
    draft.isPlaying = !draft.isPlaying
  }),
  
  setPlaying: (playing) => set((draft) => { 
    draft.isPlaying = playing
  }),

  // View actions
  setZoom: (zoom) => set((draft) => { 
    const validZoom = validateNumber(zoom, 1)
    draft.zoom = clamp(validZoom, 0.1, 10)
  }),
  
  setPan: (x, y) => set((draft) => { 
    draft.panX = validateNumber(x, 0)
    draft.panY = validateNumber(y, 0)
  }),
  
  resetView: () => set((draft) => { 
    draft.zoom = 1
    draft.panX = 0
    draft.panY = 0
  }),
  
  toggleGrid: () => set((draft) => { 
    draft.showGrid = !draft.showGrid
  }),
  
  setGridSize: (size) => set((draft) => { 
    draft.gridSize = clamp(validateNumber(size, 20), 5, 100)
  }),

  // Mode toggles
  toggleDarkMode: () => set((draft) => { 
    draft.darkMode = !draft.darkMode
  }),
  
  toggleSnapToGrid: () => set((draft) => { 
    draft.snapToGrid = !draft.snapToGrid
  }),

  // Color palette
  addColorToPalette: (color) => {
    const state = get()
    if (state.colorPalette.includes(color)) return
    
    set((draft) => {
      draft.colorPalette.push(color)
      draft.colorPalette = enforceLimit(
        draft.colorPalette,
        MAX_COLORS_IN_PALETTE,
        'color palette'
      )
    })
  },
})),
  {
    name: 'genai-galaxy-vector',
    version: 1,
  }
)
)

// Subscribe to cross-store events
eventBus.on('projectDeleted', () => {
  useVectorStore.setState({
    currentTool: 'select',
    selectedPathIds: [],
    currentFrameIndex: 0,
    currentLayerIndex: 0,
    isPlaying: false,
    frames: [createDefaultFrame()],
    zoom: 1,
    panX: 0,
    panY: 0,
  })
  safeEmit('storeReset', 'vector')
})
