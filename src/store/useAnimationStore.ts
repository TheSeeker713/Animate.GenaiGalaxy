import { create } from 'zustand'
import type { DrawingState, Frame, Layer, LineData, ShapeData, Selection } from '../types'

interface AnimationStore extends DrawingState {
  // Drawing actions
  setTool: (tool: DrawingState['currentTool']) => void
  setBrushSize: (size: number) => void
  setBrushColor: (color: string) => void
  setFillColor: (color: string) => void
  
  // Frame actions
  setCurrentFrame: (index: number) => void
  addFrame: () => void
  deleteFrame: (index: number) => void
  duplicateFrame: (index: number) => void
  reorderFrame: (fromIndex: number, toIndex: number) => void
  updateFrame: (index: number, frame: Frame) => void
  updateFrameDuration: (index: number, duration: number) => void
  saveFrameDrawing: (frameIndex: number, layerIndex: number, lines: LineData[], shapes: ShapeData[], dataUrl: string) => void
  clearCurrentFrame: () => void
  
  // Playback actions
  setFps: (fps: number) => void
  togglePlay: () => void
  setPlaying: (playing: boolean) => void
  
  // Mode toggles
  togglePuppetMode: () => void
  toggleDarkMode: () => void
  toggleOnionSkin: () => void
  
  // History actions
  undo: () => void
  redo: () => void
  pushHistory: () => void
  
  // Storage actions
  saveToStorage: () => void
  loadFromStorage: () => void
  
  // Layer actions
  setCurrentLayer: (index: number) => void
  addLayer: (frameIndex: number) => void
  deleteLayer: (frameIndex: number, layerId: string) => void
  updateLayer: (frameIndex: number, layerId: string, updates: Partial<Layer>) => void
  
  // Selection actions
  setSelection: (selection: Selection | null) => void
  clearSelection: () => void
  
  // Zoom/Pan actions
  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void
  resetView: () => void
  
  // Color palette
  addColorToPalette: (color: string) => void
  
  // Face landmarks
  setFaceLandmarks: (landmarks: DrawingState['faceLandmarks']) => void
}

const createDefaultLayer = (): Layer => ({
  id: crypto.randomUUID(),
  name: 'Layer 1',
  visible: true,
  opacity: 1,
  imageData: '',
  lines: [],
  shapes: [],
})

const createDefaultFrame = (): Frame => ({
  id: crypto.randomUUID(),
  layers: [createDefaultLayer()],
  timestamp: Date.now(),
})

export const useAnimationStore = create<AnimationStore>((set) => ({
  // Initial state
  currentTool: 'brush',
  brushSize: 5,
  brushColor: '#000000',
  fillColor: 'transparent',
  currentFrameIndex: 0,
  currentLayerIndex: 0,
  fps: 24,
  isPlaying: false,
  puppetMode: false,
  darkMode: true,
  onionSkinEnabled: false,
  frames: [createDefaultFrame()],
  rigs: [],
  faceLandmarks: null,
  history: [],
  historyIndex: -1,
  selection: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  colorPalette: [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  ],
  
  // Drawing actions
  setTool: (tool) => set({ currentTool: tool }),
  setBrushSize: (size) => set({ brushSize: size }),
  setBrushColor: (color) => set({ brushColor: color }),
  setFillColor: (color) => set({ fillColor: color }),
  
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
    const newFrame: Frame = {
      id: crypto.randomUUID(),
      layers: frameToDuplicate.layers.map(layer => ({
        ...layer,
        id: crypto.randomUUID(),
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
  
  reorderFrame: (fromIndex, toIndex) => set((state) => {
    if (fromIndex === toIndex) return state
    const newFrames = [...state.frames]
    const [movedFrame] = newFrames.splice(fromIndex, 1)
    newFrames.splice(toIndex, 0, movedFrame)
    
    // Update current frame index to follow the moved frame if it was selected
    let newCurrentIndex = state.currentFrameIndex
    if (state.currentFrameIndex === fromIndex) {
      newCurrentIndex = toIndex
    } else if (fromIndex < state.currentFrameIndex && toIndex >= state.currentFrameIndex) {
      newCurrentIndex = state.currentFrameIndex - 1
    } else if (fromIndex > state.currentFrameIndex && toIndex <= state.currentFrameIndex) {
      newCurrentIndex = state.currentFrameIndex + 1
    }
    
    return {
      frames: newFrames,
      currentFrameIndex: newCurrentIndex,
    }
  }),
  
  updateFrameDuration: (index, duration) => set((state) => {
    const newFrames = [...state.frames]
    if (newFrames[index]) {
      newFrames[index] = {
        ...newFrames[index],
        duration: Math.max(1, duration),
      }
    }
    return { frames: newFrames }
  }),
  
  updateFrame: (index, frame) => set((state) => {
    const newFrames = [...state.frames]
    newFrames[index] = frame
    return { frames: newFrames }
  }),
  
  saveFrameDrawing: (frameIndex, layerIndex, lines, shapes, dataUrl) => set((state) => {
    const newFrames = [...state.frames]
    const frame = newFrames[frameIndex]
    if (!frame) return state
    
    const newLayers = [...frame.layers]
    if (newLayers[layerIndex]) {
      newLayers[layerIndex] = {
        ...newLayers[layerIndex],
        lines: lines,
        shapes: shapes,
        imageData: dataUrl,
      }
    }
    
    newFrames[frameIndex] = {
      ...frame,
      layers: newLayers,
    }
    
    return { frames: newFrames }
  }),
  
  clearCurrentFrame: () => set((state) => {
    const newFrames = [...state.frames]
    const frame = newFrames[state.currentFrameIndex]
    if (!frame) return state
    
    newFrames[state.currentFrameIndex] = {
      ...frame,
      layers: frame.layers.map(layer => ({
        ...layer,
        lines: [],
        shapes: [],
        imageData: '',
      })),
    }
    
    return { frames: newFrames }
  }),
  
  // Playback actions
  setFps: (fps) => set({ fps }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaying: (playing) => set({ isPlaying: playing }),
  
  // Mode toggles
  togglePuppetMode: () => set((state) => ({ puppetMode: !state.puppetMode })),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  toggleOnionSkin: () => set((state) => ({ onionSkinEnabled: !state.onionSkinEnabled })),
  
  // History actions
  undo: () => set((state) => {
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1
      const historicalState = state.history[newIndex]
      return {
        historyIndex: newIndex,
        frames: JSON.parse(JSON.stringify(historicalState.frames)),
        currentFrameIndex: historicalState.currentFrameIndex,
        currentLayerIndex: historicalState.currentLayerIndex,
      }
    }
    return state
  }),
  
  redo: () => set((state) => {
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1
      const historicalState = state.history[newIndex]
      return {
        historyIndex: newIndex,
        frames: JSON.parse(JSON.stringify(historicalState.frames)),
        currentFrameIndex: historicalState.currentFrameIndex,
        currentLayerIndex: historicalState.currentLayerIndex,
      }
    }
    return state
  }),
  
  pushHistory: () => set((state) => {
    // Remove any history after current index (branching)
    const newHistory = state.history.slice(0, state.historyIndex + 1)
    
    // Deep clone current state
    const snapshot = {
      frames: JSON.parse(JSON.stringify(state.frames)),
      currentFrameIndex: state.currentFrameIndex,
      currentLayerIndex: state.currentLayerIndex,
    }
    
    newHistory.push(snapshot)
    
    // Keep max 50 history items
    if (newHistory.length > 50) {
      newHistory.shift()
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    }
    
    return {
      history: newHistory,
      historyIndex: newHistory.length - 1,
    }
  }),
  
  // Layer actions
  setCurrentLayer: (index) => set({ currentLayerIndex: index }),
  
  addLayer: (frameIndex) => set((state) => {
    const frame = state.frames[frameIndex]
    if (frame.layers.length >= 10) return state // Increased to 10 layers
    
    const newLayer: Layer = {
      id: crypto.randomUUID(),
      name: `Layer ${frame.layers.length + 1}`,
      visible: true,
      opacity: 1,
      imageData: '',
      lines: [],
      shapes: [],
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
  
  // Selection actions
  setSelection: (selection) => set({ selection }),
  clearSelection: () => set({ selection: null }),
  
  // Zoom/Pan actions
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  resetView: () => set({ zoom: 1, panX: 0, panY: 0 }),
  
  // Color palette
  addColorToPalette: (color) => set((state) => {
    if (state.colorPalette.includes(color)) return state
    return {
      colorPalette: [...state.colorPalette, color].slice(0, 20), // Max 20 colors
    }
  }),
  
  // Face landmarks
  setFaceLandmarks: (landmarks) => set({ faceLandmarks: landmarks }),
  
  // Storage actions
  saveToStorage: () => {
    const state = useAnimationStore.getState()
    try {
      const dataToSave = {
        frames: state.frames,
        currentFrameIndex: state.currentFrameIndex,
        currentLayerIndex: state.currentLayerIndex,
        fps: state.fps,
        onionSkinEnabled: state.onionSkinEnabled,
        darkMode: state.darkMode,
        brushSize: state.brushSize,
        brushColor: state.brushColor,
        fillColor: state.fillColor,
        colorPalette: state.colorPalette,
        zoom: state.zoom,
        panX: state.panX,
        panY: state.panY,
      }
      localStorage.setItem('animate-project', JSON.stringify(dataToSave))
      console.log('Project saved to localStorage')
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
      // If quota exceeded, try clearing old data
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        localStorage.removeItem('animate-project')
        console.warn('Storage quota exceeded, cleared old data')
      }
    }
  },
  
  loadFromStorage: () => set((state) => {
    try {
      const stored = localStorage.getItem('animate-project')
      if (stored) {
        const data = JSON.parse(stored)
        console.log('Project loaded from localStorage')
        return {
          frames: data.frames || state.frames,
          currentFrameIndex: data.currentFrameIndex ?? state.currentFrameIndex,
          currentLayerIndex: data.currentLayerIndex ?? state.currentLayerIndex,
          fps: data.fps ?? state.fps,
          onionSkinEnabled: data.onionSkinEnabled ?? state.onionSkinEnabled,
          darkMode: data.darkMode ?? state.darkMode,
          brushSize: data.brushSize ?? state.brushSize,
          brushColor: data.brushColor ?? state.brushColor,
          fillColor: data.fillColor ?? state.fillColor,
          colorPalette: data.colorPalette || state.colorPalette,
          zoom: data.zoom ?? state.zoom,
          panX: data.panX ?? state.panX,
          panY: data.panY ?? state.panY,
        }
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
    }
    return state
  }),
}))
