import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

export type Tool = 'brush' | 'eraser' | 'select' | 'rectangle' | 'ellipse' | 'line' | 'fill' | 'eyedropper' | 'text' | 'transform'

export type InputDeviceType = 'pen' | 'touch' | 'mouse'

export interface LineData {
  tool: 'brush' | 'eraser'
  points: number[] // [x1, y1, x2, y2, ...] flat array of coordinates
  color: string
  size: number // base stroke width
  pressures?: number[] // [p1, p2, ...] parallel array of pressure values (0.0-1.0)
  deviceType?: InputDeviceType // device used to create the stroke
}

export interface ShapeData {
  id: string
  type: 'rectangle' | 'ellipse' | 'line' | 'text'
  x: number
  y: number
  width?: number
  height?: number
  x2?: number // for line
  y2?: number // for line
  color: string
  strokeWidth: number
  fill?: string
  // Text-specific properties
  text?: string
  fontSize?: number
  fontFamily?: string
  fontStyle?: 'normal' | 'bold' | 'italic' | 'bold italic'
  align?: 'left' | 'center' | 'right'
  rotation?: number
  scaleX?: number
  scaleY?: number
}

export interface Selection {
  x: number
  y: number
  width: number
  height: number
  imageData?: string
  // Transform state
  rotation?: number
  scaleX?: number
  scaleY?: number
}

export interface Layer {
  id: string
  name: string
  visible: boolean
  opacity: number
  imageData: string // dataURL
  lines: LineData[] // Vector drawing data
  shapes: ShapeData[] // Shape primitives
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten'
  effects?: {
    blur?: number // 0-20
    brightness?: number // -100 to 100
    contrast?: number // -100 to 100
  }
}

export interface Frame {
  id: string
  layers: Layer[]
  timestamp: number
  duration?: number // Duration in frames (1 = single frame, 2 = hold for 2 frames, etc.)
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

export interface HistorySnapshot {
  frames: Frame[]
  currentFrameIndex: number
  currentLayerIndex: number
}

export interface DrawingState {
  currentTool: Tool
  brushSize: number
  brushColor: string
  fillColor: string
  textSize: number
  textFont: string
  canvasColor: string
  documentWidth: number
  documentHeight: number
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
  history: HistorySnapshot[]
  historyIndex: number
  selection: Selection | null
  zoom: number
  panX: number
  panY: number
  colorPalette: string[]
}
