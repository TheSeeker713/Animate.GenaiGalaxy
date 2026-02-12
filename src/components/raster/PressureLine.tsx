/**
 * PressureLine Component
 * Renders variable-width strokes based on pressure data
 * Uses Konva.Shape with custom rendering for smooth pressure-based width variation
 */

import { Shape } from 'react-konva'
import Konva from 'konva'
import { calculateStrokeWidth } from '../../utils/pressureInput'

interface PressureLineProps {
  points: number[] // [x1, y1, x2, y2, ...] flat array
  pressures: number[] // [p1, p2, ...] pressure values (0.0-1.0)
  color: string
  baseSize: number // base stroke width
  lineCap?: 'butt' | 'round' | 'square'
  lineJoin?: 'miter' | 'round' | 'bevel'
  globalCompositeOperation?: GlobalCompositeOperation // for eraser (e.g., 'destination-out')
  tension?: number // curve smoothness (0-1)
  minWidth?: number // minimum width multiplier (default 0.3)
  maxWidth?: number // maximum width multiplier (default 1.5)
}

/**
 * Calculate perpendicular offset vector for a point
 * Used to create the outline of variable-width stroke
 */
function getPerpendicular(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  width: number
): { x: number; y: number } {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const len = Math.sqrt(dx * dx + dy * dy)
  
  if (len === 0) return { x: 0, y: width / 2 }
  
  // Perpendicular vector (rotated 90 degrees)
  const perpX = -dy / len
  const perpY = dx / len
  
  return {
    x: perpX * width / 2,
    y: perpY * width / 2
  }
}

/**
 * Generate outline points for variable-width stroke
 * Returns left and right edge points to create a filled polygon
 */
function generateStrokeOutline(
  points: number[],
  pressures: number[],
  baseSize: number,
  minWidth: number,
  maxWidth: number
): { left: { x: number; y: number }[], right: { x: number; y: number }[] } {
  const left: { x: number; y: number }[] = []
  const right: { x: number; y: number }[] = []
  
  // Convert flat points array to coordinate pairs
  const coords: { x: number; y: number }[] = []
  for (let i = 0; i < points.length; i += 2) {
    coords.push({ x: points[i], y: points[i + 1] })
  }
  
  if (coords.length < 2) return { left, right }
  
  // Generate outline points
  for (let i = 0; i < coords.length; i++) {
    const pressure = pressures[i] ?? 0.5 // fallback to default
    const width = calculateStrokeWidth(baseSize, pressure, minWidth, maxWidth)
    
    // Calculate tangent direction
    let p1, p2
    if (i === 0) {
      // First point: use direction to next point
      p1 = coords[i]
      p2 = coords[i + 1]
    } else if (i === coords.length - 1) {
      // Last point: use direction from previous point
      p1 = coords[i - 1]
      p2 = coords[i]
    } else {
      // Middle points: average direction from neighbors
      p1 = coords[i - 1]
      p2 = coords[i + 1]
    }
    
    const perp = getPerpendicular(p1, p2, width)
    
    // Add offset points to left and right edges
    left.push({
      x: coords[i].x - perp.x,
      y: coords[i].y - perp.y
    })
    right.push({
      x: coords[i].x + perp.x,
      y: coords[i].y + perp.y
    })
  }
  
  return { left, right }
}

export default function PressureLine({
  points,
  pressures,
  color,
  baseSize,
  lineCap = 'round',
  lineJoin = 'round',
  globalCompositeOperation,
  minWidth = 0.3,
  maxWidth = 1.5,
}: PressureLineProps) {
  // Custom rendering function for Konva.Shape
  const sceneFunc = (context: Konva.Context, shape: Konva.Shape) => {
    if (points.length < 4 || pressures.length < 2) {
      // Not enough points to draw
      return
    }
    
    // Generate variable-width outline
    const { left, right } = generateStrokeOutline(
      points,
      pressures,
      baseSize,
      minWidth,
      maxWidth
    )
    
    if (left.length === 0 || right.length === 0) return
    
    context.beginPath()
    
    // Draw left edge
    context.moveTo(left[0].x, left[0].y)
    for (let i = 1; i < left.length; i++) {
      context.lineTo(left[i].x, left[i].y)
    }
    
    // Cap handling for end
    if (lineCap === 'round') {
      // Add semicircular cap at the end
      const lastLeft = left[left.length - 1]
      const lastRight = right[right.length - 1]
      const centerX = (lastLeft.x + lastRight.x) / 2
      const centerY = (lastLeft.y + lastRight.y) / 2
      const radius = Math.sqrt(
        Math.pow(lastLeft.x - centerX, 2) + Math.pow(lastLeft.y - centerY, 2)
      )
      
      // Arc from left edge to right edge
      context.arc(centerX, centerY, radius, 
        Math.atan2(lastLeft.y - centerY, lastLeft.x - centerX),
        Math.atan2(lastRight.y - centerY, lastRight.x - centerX)
      )
    }
    
    // Draw right edge (in reverse)
    for (let i = right.length - 1; i >= 0; i--) {
      context.lineTo(right[i].x, right[i].y)
    }
    
    // Cap handling for start
    if (lineCap === 'round') {
      // Add semicircular cap at the start
      const firstLeft = left[0]
      const firstRight = right[0]
      const centerX = (firstLeft.x + firstRight.x) / 2
      const centerY = (firstLeft.y + firstRight.y) / 2
      const radius = Math.sqrt(
        Math.pow(firstLeft.x - centerX, 2) + Math.pow(firstLeft.y - centerY, 2)
      )
      
      // Arc from right edge to left edge
      context.arc(centerX, centerY, radius,
        Math.atan2(firstRight.y - centerY, firstRight.x - centerX),
        Math.atan2(firstLeft.y - centerY, firstLeft.x - centerX)
      )
    }
    
    context.closePath()
    context.fillStrokeShape(shape)
  }
  
  return (
    <Shape
      sceneFunc={sceneFunc}
      fill={color}
      stroke={color}
      strokeWidth={0} // No additional stroke needed, we're drawing filled shape
      lineCap={lineCap}
      lineJoin={lineJoin}
      globalCompositeOperation={globalCompositeOperation}
      perfectDrawEnabled={false} // Optimization for better performance
      shadowForStrokeEnabled={false}
      hitStrokeWidth={baseSize * 2} // Make it easier to select
    />
  )
}
