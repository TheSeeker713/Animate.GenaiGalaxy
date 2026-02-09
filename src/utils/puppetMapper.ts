import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

/**
 * Maps MediaPipe face landmarks to drawing transformations
 */
export interface PuppetTransform {
  rotation: number // Head tilt in radians
  scale: number // Mouth openness affects size
  x: number // Head position
  y: number // Head position
  mouthOpen: number // 0-1, how open the mouth is
  eyebrowRaise: number // 0-1, eyebrow position
}

/**
 * Calculate head tilt from eye landmarks
 */
export function calculateHeadTilt(landmarks: NormalizedLandmark[]): number {
  // Left eye: index 33, Right eye: index 263
  const leftEye = landmarks[33]
  const rightEye = landmarks[263]

  if (!leftEye || !rightEye) return 0

  const dx = rightEye.x - leftEye.x
  const dy = rightEye.y - leftEye.y
  const angle = Math.atan2(dy, dx)

  return angle
}

/**
 * Calculate mouth openness ratio
 */
export function calculateMouthOpenness(landmarks: NormalizedLandmark[]): number {
  // Upper lip: index 13, Lower lip: index 14
  const upperLip = landmarks[13]
  const lowerLip = landmarks[14]

  if (!upperLip || !lowerLip) return 0

  const distance = Math.abs(lowerLip.y - upperLip.y)
  
  // Normalize to 0-1 range (typical mouth open distance is around 0.05-0.1)
  return Math.min(distance * 10, 1)
}

/**
 * Calculate eyebrow raise amount
 */
export function calculateEyebrowRaise(landmarks: NormalizedLandmark[]): number {
  // Left eyebrow: index 70, Left eye: index 33
  const leftEyebrow = landmarks[70]
  const leftEye = landmarks[33]

  if (!leftEyebrow || !leftEye) return 0

  const distance = leftEye.y - leftEyebrow.y
  
  // Normalize to 0-1 range
  return Math.min(Math.max(distance * 5, 0), 1)
}

/**
 * Get head center position
 */
export function getHeadPosition(landmarks: NormalizedLandmark[]): { x: number; y: number } {
  // Nose tip: index 1
  const nose = landmarks[1]

  if (!nose) return { x: 0.5, y: 0.5 }

  return { x: nose.x, y: nose.y }
}

/**
 * Map face landmarks to complete puppet transform
 */
export function mapFaceToPuppet(landmarks: NormalizedLandmark[]): PuppetTransform {
  const rotation = calculateHeadTilt(landmarks)
  const mouthOpen = calculateMouthOpenness(landmarks)
  const eyebrowRaise = calculateEyebrowRaise(landmarks)
  const position = getHeadPosition(landmarks)

  // Use mouth openness to affect brush scale
  const scale = 1 + mouthOpen * 0.5 // 1.0 to 1.5x size

  return {
    rotation,
    scale,
    x: position.x,
    y: position.y,
    mouthOpen,
    eyebrowRaise,
  }
}
