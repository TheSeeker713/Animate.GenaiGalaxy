import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

export type Tool = 'brush' | 'eraser' | 'puppet'

export interface Layer {
  id: string
  name: string
  visible: boolean
  opacity: number
  imageData: string // dataURL
}

export interface Frame {
  id: string
  layers: Layer[]
  timestamp: number
}

export interface Joint {
  id: string
  name: string
  x: number
  y: number
  parentId: string | null
  rotation: number
}

export interface Rig {
  name: string
  joints: Joint[]
}

export interface DrawingState {
  currentTool: Tool
  brushSize: number
  brushColor: string
  currentFrameIndex: number
  fps: number
  isPlaying: boolean
  puppetMode: boolean
  darkMode: boolean
  onionSkinEnabled: boolean
  frames: Frame[]
  rigs: Rig[]
  faceLandmarks: NormalizedLandmark[] | null
  history: string[] // dataURL snapshots for undo/redo
  historyIndex: number
}
