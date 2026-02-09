import { create } from 'zustand'
import type { VectorState, VectorFrame, VectorLayer, VectorPath, Keyframe } from '../types/vector'

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
  id: crypto.randomUUID(),
  name: 'Layer 1',
  visible: true,
  locked: false,
  opacity: 1,
  paths: [],
  keyframes: [],
})

const createDefaultFrame = (): VectorFrame => ({
  id: crypto.randomUUID(),
  layers: [createDefaultLayer()],
  timestamp: Date.now(),
  duration: 1000 / 24, // 24fps default
})

export const useVectorStore = create<VectorStore>((set) => ({
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
  setTool: (tool) => set({ currentTool: tool }),
  setStrokeColor: (color) => set({ strokeColor: color }),
  setFillColor: (color) => set({ fillColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),

  // Selection actions
  selectPath: (pathId, addToSelection = false) => set((state) => {
    if (addToSelection) {
      return {
        selectedPathIds: state.selectedPathIds.includes(pathId)
          ? state.selectedPathIds.filter(id => id !== pathId)
          : [...state.selectedPathIds, pathId],
      }
    }
    return { selectedPathIds: [pathId] }
  }),

  clearSelection: () => set({ selectedPathIds: [] }),

  // Frame actions
  setCurrentFrame: (index) => set({ currentFrameIndex: index }),

  addFrame: () => set((state) => {
    const newFrame = createDefaultFrame()
    return {
      frames: [...state.frames, newFrame],
      currentFrameIndex: state.frames.length,
    }
  }),

  deleteFrame: (index) => set((state) => {
    if (state.frames.length <= 1) return state
    const newFrames = state.frames.filter((_, i) => i !== index)
    return {
      frames: newFrames,
      currentFrameIndex: Math.min(state.currentFrameIndex, newFrames.length - 1),
    }
  }),

  duplicateFrame: (index) => set((state) => {
    const frameToDuplicate = state.frames[index]
    const newFrame: VectorFrame = {
      id: crypto.randomUUID(),
      layers: frameToDuplicate.layers.map(layer => ({
        ...layer,
        id: crypto.randomUUID(),
        paths: layer.paths.map(path => ({
          ...path,
          id: crypto.randomUUID(),
        })),
      })),
      timestamp: Date.now(),
      duration: frameToDuplicate.duration,
    }
    const newFrames = [...state.frames]
    newFrames.splice(index + 1, 0, newFrame)
    return {
      frames: newFrames,
      currentFrameIndex: index + 1,
    }
  }),

  // Layer actions
  setCurrentLayer: (index) => set({ currentLayerIndex: index }),

  addLayer: (frameIndex) => set((state) => {
    const frame = state.frames[frameIndex]
    if (frame.layers.length >= 10) return state

    const newLayer: VectorLayer = {
      id: crypto.randomUUID(),
      name: `Layer ${frame.layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1,
      paths: [],
      keyframes: [],
    }

    const newFrames = [...state.frames]
    newFrames[frameIndex] = {
      ...frame,
      layers: [...frame.layers, newLayer],
    }

    return { frames: newFrames }
  }),

  deleteLayer: (frameIndex, layerId) => set((state) => {
    const frame = state.frames[frameIndex]
    if (frame.layers.length <= 1) return state

    const newFrames = [...state.frames]
    newFrames[frameIndex] = {
      ...frame,
      layers: frame.layers.filter(l => l.id !== layerId),
    }

    return { frames: newFrames }
  }),

  updateLayer: (frameIndex, layerId, updates) => set((state) => {
    const newFrames = [...state.frames]
    const frame = newFrames[frameIndex]

    newFrames[frameIndex] = {
      ...frame,
      layers: frame.layers.map(layer =>
        layer.id === layerId ? { ...layer, ...updates } : layer
      ),
    }

    return { frames: newFrames }
  }),

  // Path actions
  addPath: (frameIndex, layerIndex, path) => set((state) => {
    const newFrames = [...state.frames]
    const frame = newFrames[frameIndex]
    const layer = frame.layers[layerIndex]

    frame.layers[layerIndex] = {
      ...layer,
      paths: [...layer.paths, path],
    }

    return { frames: newFrames }
  }),

  updatePath: (frameIndex, layerIndex, pathId, updates) => set((state) => {
    const newFrames = [...state.frames]
    const frame = newFrames[frameIndex]
    const layer = frame.layers[layerIndex]

    frame.layers[layerIndex] = {
      ...layer,
      paths: layer.paths.map(path =>
        path.id === pathId ? { ...path, ...updates } : path
      ),
    }

    return { frames: newFrames }
  }),

  deletePath: (frameIndex, layerIndex, pathId) => set((state) => {
    const newFrames = [...state.frames]
    const frame = newFrames[frameIndex]
    const layer = frame.layers[layerIndex]

    frame.layers[layerIndex] = {
      ...layer,
      paths: layer.paths.filter(p => p.id !== pathId),
    }

    return { frames: newFrames, selectedPathIds: state.selectedPathIds.filter(id => id !== pathId) }
  }),

  // Keyframe actions
  addKeyframe: (frameIndex, layerIndex, keyframe) => set((state) => {
    const newFrames = [...state.frames]
    const frame = newFrames[frameIndex]
    const layer = frame.layers[layerIndex]

    frame.layers[layerIndex] = {
      ...layer,
      keyframes: [...layer.keyframes, keyframe].sort((a, b) => a.time - b.time),
    }

    return { frames: newFrames }
  }),

  deleteKeyframe: (frameIndex, layerIndex, time) => set((state) => {
    const newFrames = [...state.frames]
    const frame = newFrames[frameIndex]
    const layer = frame.layers[layerIndex]

    frame.layers[layerIndex] = {
      ...layer,
      keyframes: layer.keyframes.filter(k => k.time !== time),
    }

    return { frames: newFrames }
  }),

  // Playback actions
  setFps: (fps) => set({ fps }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaying: (playing) => set({ isPlaying: playing }),

  // View actions
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  resetView: () => set({ zoom: 1, panX: 0, panY: 0 }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  setGridSize: (size) => set({ gridSize: size }),

  // Mode toggles
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  // Color palette
  addColorToPalette: (color) => set((state) => {
    if (state.colorPalette.includes(color)) return state
    return {
      colorPalette: [...state.colorPalette, color].slice(0, 20),
    }
  }),
}))
