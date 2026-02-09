// Vector Studio Types

export type VectorTool = 'select' | 'pen' | 'rectangle' | 'ellipse' | 'polygon' | 'star' | 'text' | 'eyedropper'

export interface Point {
  x: number
  y: number
}

export interface BezierPoint extends Point {
  handleIn?: Point
  handleOut?: Point
}

export interface VectorPath {
  id: string
  type: 'path' | 'rectangle' | 'ellipse' | 'polygon' | 'star' | 'text'
  points: BezierPoint[]
  closed: boolean
  fill: string
  stroke: string
  strokeWidth: number
  opacity: number
  visible: boolean
  name: string
  // Transform properties
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
  // Shape-specific properties
  width?: number
  height?: number
  radius?: number
  sides?: number // for polygon/star
  innerRadius?: number // for star
  text?: string
  fontSize?: number
  fontFamily?: string
}

export interface Keyframe {
  time: number // Frame number
  properties: Partial<VectorPath>
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier'
}

export interface VectorLayer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  opacity: number
  paths: VectorPath[]
  keyframes: Keyframe[]
}

export interface VectorFrame {
  id: string
  layers: VectorLayer[]
  timestamp: number
  duration: number // Frame duration in ms
}

export interface VectorState {
  currentTool: VectorTool
  selectedPathIds: string[]
  strokeColor: string
  fillColor: string
  strokeWidth: number
  currentFrameIndex: number
  currentLayerIndex: number
  fps: number
  isPlaying: boolean
  darkMode: boolean
  frames: VectorFrame[]
  zoom: number
  panX: number
  panY: number
  snapToGrid: boolean
  gridSize: number
  showGrid: boolean
  colorPalette: string[]
}
