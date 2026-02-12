/**
 * Pressure-Sensitive Input Utilities
 * Handles stylus/pen pressure from Wacom tablets, Apple Pencil, and other devices
 */

import type { InputDeviceType } from '../types'

/**
 * Extract pressure value from PointerEvent
 * Falls back to 0.5 for mice (constant pressure)
 */
export function extractPressure(event: PointerEvent): number {
  // PointerEvent.pressure is 0.0 to 1.0
  // 0.5 is default for devices without pressure support (mice)
  const pressure = event.pressure ?? 0.5
  
  // Clamp to valid range (some browsers may report out-of-range values)
  return Math.max(0, Math.min(1, pressure))
}

/**
 * Detect input device type from PointerEvent
 */
export function detectDeviceType(event: PointerEvent): InputDeviceType {
  // Use PointerEvent.pointerType which is part of W3C standard
  // 'pen' = stylus/tablet, 'touch' = finger, 'mouse' = mouse
  switch (event.pointerType) {
    case 'pen':
      return 'pen'
    case 'touch':
      return 'touch'
    case 'mouse':
    default:
      return 'mouse'
  }
}

/**
 * Check if the current event has meaningful pressure data
 * Returns false for mice which report constant 0.5
 */
export function hasPressureSupport(event: PointerEvent): boolean {
  const deviceType = detectDeviceType(event)
  
  // Pens/styluses support pressure
  if (deviceType === 'pen') {
    return true
  }
  
  // Touch devices may support pressure (Apple Pencil on iPad)
  // Check if pressure varies from the default 0.5
  if (deviceType === 'touch') {
    const pressure = extractPressure(event)
    // If pressure is not exactly 0.5, device likely supports it
    return pressure !== 0.5
  }
  
  // Mice don't support pressure
  return false
}

/**
 * Apply a pressure curve for sensitivity adjustment
 * @param pressure Raw pressure value (0.0-1.0)
 * @param sensitivity Multiplier for pressure response (0.5 = soft, 1.0 = linear, 2.0 = hard)
 * @param curve Curve type: 'linear', 'ease-in', 'ease-out', 'ease-in-out'
 */
export function applyPressureCurve(
  pressure: number,
  sensitivity: number = 1.0,
  curve: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' = 'linear'
): number {
  // Apply sensitivity multiplier (clamp to prevent extreme values)
  let adjusted = pressure * Math.max(0.1, Math.min(3.0, sensitivity))
  
  // Apply curve transformation
  switch (curve) {
    case 'ease-in':
      // Quadratic ease-in: slow start, fast end
      adjusted = adjusted * adjusted
      break
    case 'ease-out':
      // Quadratic ease-out: fast start, slow end
      adjusted = 1 - (1 - adjusted) * (1 - adjusted)
      break
    case 'ease-in-out':
      // Smooth acceleration and deceleration
      adjusted = adjusted < 0.5
        ? 2 * adjusted * adjusted
        : 1 - Math.pow(-2 * adjusted + 2, 2) / 2
      break
    case 'linear':
    default:
      // No curve, just direct mapping
      break
  }
  
  // Ensure final value is in valid range
  return Math.max(0, Math.min(1, adjusted))
}

/**
 * Calculate stroke width at a point based on pressure
 * @param baseSze Base stroke width (from UI slider)
 * @param pressure Current pressure value (0.0-1.0)
 * @param minWidth Minimum width (percentage of base, default 0.3 = 30%)
 * @param maxWidth Maximum width (percentage of base, default 1.5 = 150%)
 */
export function calculateStrokeWidth(
  baseSize: number,
  pressure: number,
  minWidth: number = 0.3,
  maxWidth: number = 1.5
): number {
  // Interpolate between min and max based on pressure
  const multiplier = minWidth + (maxWidth - minWidth) * pressure
  return baseSize * multiplier
}

/**
 * Normalize pressure array to ensure consistent range
 * Useful when loading old data or handling edge cases
 */
export function normalizePressures(pressures: number[]): number[] {
  if (pressures.length === 0) return []
  
  // Find actual range
  const min = Math.min(...pressures)
  const max = Math.max(...pressures)
  
  // If all pressures are the same, return as-is
  if (min === max) return pressures
  
  // Normalize to 0-1 range
  const range = max - min
  return pressures.map(p => (p - min) / range)
}

/**
 * Smooth pressure values to reduce jitter
 * Uses simple moving average
 */
export function smoothPressures(
  pressures: number[],
  windowSize: number = 3
): number[] {
  if (pressures.length < windowSize) return pressures
  
  const smoothed: number[] = []
  const halfWindow = Math.floor(windowSize / 2)
  
  for (let i = 0; i < pressures.length; i++) {
    const start = Math.max(0, i - halfWindow)
    const end = Math.min(pressures.length, i + halfWindow + 1)
    const window = pressures.slice(start, end)
    const average = window.reduce((sum, p) => sum + p, 0) / window.length
    smoothed.push(average)
  }
  
  return smoothed
}

/**
 * Get user-friendly device name for UI display
 */
export function getDeviceName(deviceType: InputDeviceType): string {
  switch (deviceType) {
    case 'pen':
      return 'Stylus/Pen'
    case 'touch':
      return 'Touch'
    case 'mouse':
      return 'Mouse'
  }
}

/**
 * Get icon for device type (emoji/unicode symbol)
 */
export function getDeviceIcon(deviceType: InputDeviceType): string {
  switch (deviceType) {
    case 'pen':
      return '🖊️'
    case 'touch':
      return '👆'
    case 'mouse':
      return '🖱️'
  }
}
