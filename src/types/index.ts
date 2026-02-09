import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

export type Tool = 'brush' | 'eraser' | 'select' | 'rectangle' | 'ellipse' | 'line' | 'fill' | 'eyedropper'

export interface LineData {
  tool: 'brush' | 'eraser'
  points: number[]
  color: string
  size: number
}

export interface ShapeData {
  id: string
  type: 'rectangle' | 'ellipse' | 'line'
  x: number
  y: number
  width?: number
  height?: number
  x2?: number // for line
  y2?: number // for line
  color: string
  strokeWidth: number
  fill?: string
}

export interface Selection {
  x: number
  y: number
  width: number
  height: number
  imageData?: string
}

export interface Layer {
  id: string
  name: string
  visible: boolean
  opacity: number
  imageData: string // dataURL
  lines: LineData[] // Vector drawing data
  shapes: ShapeData[] // Shape primitives
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
  fillColor: string
  currentFrameIndex: number
  currentLayerIndex: number
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
  selection: Selection | null
  zoom: number
  panX: number
  panY: number
  colorPalette: string[]
}
