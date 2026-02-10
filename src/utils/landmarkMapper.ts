/**
 * Landmark Mapper
 * Maps MediaPipe facial landmarks to character morphs and bone rotations
 */

import KalmanFilter from 'kalman-filter'
import type { FaceLandmarks } from './faceTracker'
import { LANDMARK_INDICES } from './faceTracker'
import type { Character, CharacterTemplate } from '@/types/character'

export interface MappingResult {
  morphUpdates: Record<string, number>
  boneRotations: Record<string, { x: number; y: number; z: number }>
  headPosition: { x: number; y: number }
}

export interface LandmarkMapperConfig {
  smoothing?: boolean
  sensitivity?: number
  headRotationScale?: number
  morphScale?: number
}

/**
 * Kalman filter for smoothing landmark data
 */
class LandmarkSmoother {
  private filters: Map<string, any> = new Map()

  getFilter(key: string) {
    if (!this.filters.has(key)) {
      // Simple 1D Kalman filter for each value
      const filter = new KalmanFilter({
        observation: 1,
        dynamic: 1
      })
      this.filters.set(key, filter)
    }
    return this.filters.get(key)
  }

  smooth(key: string, value: number): number {
    const filter = this.getFilter(key)
    const result = filter.filter({ observation: [value] })
    return result.mean[0]
  }

  reset() {
    this.filters.clear()
  }
}

class LandmarkMapperService {
  private static instance: LandmarkMapperService
  private smoother = new LandmarkSmoother()
  private config: Required<LandmarkMapperConfig>

  constructor() {
    this.config = {
      smoothing: true,
      sensitivity: 1.0,
      headRotationScale: 1.0,
      morphScale: 1.0
    }
  }

  static getInstance(): LandmarkMapperService {
    if (!LandmarkMapperService.instance) {
      LandmarkMapperService.instance = new LandmarkMapperService()
    }
    return LandmarkMapperService.instance
  }

  /**
   * Update mapper configuration
   */
  setConfig(config: Partial<LandmarkMapperConfig>) {
    this.config = { ...this.config, ...config }
  }

  /**
   * Map facial landmarks to character updates
   */
  mapToCharacter(
    landmarks: FaceLandmarks,
    character: Character,
    template?: CharacterTemplate
  ): MappingResult | null {
    if (!landmarks.faceDetected || !landmarks.landmarks.length) {
      return null
    }

    const morphUpdates: Record<string, number> = {}
    const boneRotations: Record<string, { x: number; y: number; z: number }> = {}

    // Map blendshapes to morphs if template provided
    if (landmarks.blendshapes && template?.morphTargets) {
      this.mapBlendshapesToMorphs(landmarks.blendshapes, template, morphUpdates)
    }

    // Calculate head rotation from landmarks
    const headRotation = this.calculateHeadRotation(landmarks.landmarks)
    if (headRotation && character.skeleton?.rootBoneId) {
      boneRotations[character.skeleton.rootBoneId] = headRotation
    }

    // Calculate head position (for slight translation)
    const headPosition = this.calculateHeadPosition(landmarks.landmarks)

    // Apply smoothing if enabled
    if (this.config.smoothing) {
      this.applySmoothingToMorphs(morphUpdates)
    }

    return {
      morphUpdates,
      boneRotations,
      headPosition
    }
  }

  /**
   * Map Media Pipe blendshapes to character morph targets
   */
  private mapBlendshapesToMorphs(
    blendshapes: Array<{ categoryName: string; score: number }>,
    template: CharacterTemplate,
    morphUpdates: Record<string, number>
  ): void {
    // Common blendshape mappings
    const mappings: Record<string, string[]> = {
      // Eye blendshapes
      'eyeBlinkLeft': ['eye-left-blink', 'left-eye-closed', 'blink-left'],
      'eyeBlinkRight': ['eye-right-blink', 'right-eye-closed', 'blink-right'],
      'eyeWideLeft': ['eye-left-wide', 'left-eye-open'],
      'eyeWideRight': ['eye-right-wide', 'right-eye-open'],
      
      // Eyebrow blendshapes
      'browDownLeft': ['eyebrow-left-down', 'left-brow-down'],
      'browDownRight': ['eyebrow-right-down', 'right-brow-down'],
      'browInnerUp': ['eyebrow-raise', 'brows-up', 'surprise'],
      'browOuterUpLeft': ['eyebrow-left-up', 'left-brow-up'],
      'browOuterUpRight': ['eyebrow-right-up', 'right-brow-up'],
      
      // Mouth blendshapes
      'mouthSmileLeft': ['smile', 'mouth-smile-left', 'happy'],
      'mouthSmileRight': ['smile', 'mouth-smile-right', 'happy'],
      'mouthOpen': ['mouth-open', 'mouth-height', 'jaw-open'],
      'mouthClose': ['mouth-closed'],
      'mouthPucker': ['mouth-pucker', 'mouth-round'],
      'mouthFunnel': ['mouth-funnel', 'mouth-o'],
      'mouthLeft': ['mouth-left'],
      'mouthRight': ['mouth-right'],
      'jawOpen': ['jaw-open', 'mouth-open'],
      
      // Cheek blendshapes
      'cheekPuff': ['cheek-puff', 'puffy-cheeks'],
      'cheekSquintLeft': ['cheek-left-squint'],
      'cheekSquintRight': ['cheek-right-squint']
    }

    // Get available morph targets from template
    const availableMorphs = new Map(
      template.morphTargets?.map((m) => [m.id.toLowerCase(), m.id]) || []
    )

    // Apply blendshape values to matching morphs
    for (const blendshape of blendshapes) {
      const categoryName = blendshape.categoryName
      const score = blendshape.score * this.config.morphScale

      // Find matching morph targets
      const possibleMorphIds = mappings[categoryName] || [categoryName]
      
      for (const morphId of possibleMorphIds) {
        const normalizedId = morphId.toLowerCase()
        if (availableMorphs.has(normalizedId)) {
          const actualMorphId = availableMorphs.get(normalizedId)!
          
          // Blend scores for morphs that map to multiple blendshapes
          if (morphUpdates[actualMorphId] !== undefined) {
            morphUpdates[actualMorphId] = Math.max(morphUpdates[actualMorphId], score)
          } else {
            morphUpdates[actualMorphId] = score
          }
        }
      }
    }
  }

  /**
   * Calculate head rotation (pitch, yaw, roll) from landmarks
   */
  private calculateHeadRotation(
    landmarks: Array<{ x: number; y: number; z: number }>
  ): { x: number; y: number; z: number } {
    // Use key facial landmarks for rotation estimation
    const noseTip = landmarks[1] // Nose tip
    const leftEye = landmarks[33] // Left eye inner corner
    const rightEye = landmarks[263] // Right eye inner corner
    const chin = landmarks[152] // Chin
    const forehead = landmarks[10] // Forehead

    if (!noseTip || !leftEye || !rightEye || !chin || !forehead) {
      return { x: 0, y: 0, z: 0 }
    }

    // Calculate yaw (left/right rotation) from eye positions
    const eyeCenterX = (leftEye.x + rightEye.x) / 2
    const yaw = (noseTip.x - eyeCenterX) * 180 * this.config.headRotationScale

    // Calculate pitch (up/down rotation) from nose-to-chin distance
    const faceHeight = Math.abs(forehead.y - chin.y)
    const noseToForehead = Math.abs(noseTip.y - forehead.y)
    const pitch = ((noseToForehead / faceHeight) - 0.5) * 90 * this.config.headRotationScale

    // Calculate roll (tilt) from eye alignment
    const eyeDeltaY = rightEye.y - leftEye.y
    const eyeDeltaX = rightEye.x - leftEye.x
    const roll = Math.atan2(eyeDeltaY, eyeDeltaX) * (180 / Math.PI) * this.config.headRotationScale

    return { x: pitch, y: yaw, z: roll }
  }

  /**
   * Calculate head position (for slight translation)
   */
  private calculateHeadPosition(
    landmarks: Array<{ x: number; y: number; z: number }>
  ): { x: number; y: number } {
    // Use nose tip as reference point
    const noseTip = landmarks[1]
    
    if (!noseTip) {
      return { x: 0.5, y: 0.5 }
    }

    // Normalize to -1 to 1 range, then scale
    const x = (noseTip.x - 0.5) * 2 * this.config.sensitivity
    const y = (noseTip.y - 0.5) * 2 * this.config.sensitivity

    return { x, y }
  }

  /**
   * Apply Kalman smoothing to morph values
   */
  private applySmoothingToMorphs(morphUpdates: Record<string, number>): void {
    for (const [morphId, value] of Object.entries(morphUpdates)) {
      morphUpdates[morphId] = this.smoother.smooth(morphId, value)
    }
  }

  /**
   * Reset smoothing filters
   */
  reset(): void {
    this.smoother.reset()
  }

  /**
   * Get landmark indices for visualization
   */
  getLandmarkIndices() {
    return LANDMARK_INDICES
  }
}

// Export singleton instance
export const landmarkMapper = LandmarkMapperService.getInstance()

/**
 * Helper function to apply mapping result to character
 */
export function applyMappingToCharacter(
  character: Character,
  mapping: MappingResult
): Character {
  // Update morphs
  const updatedMorphState = { ...character.morphState }
  for (const [morphId, value] of Object.entries(mapping.morphUpdates)) {
    updatedMorphState[morphId] = value
  }

  // Update bone rotations
  const updatedBones = character.skeleton.bones.map((bone) => {
    const rotation = mapping.boneRotations[bone.id]
    if (rotation) {
      return {
        ...bone,
        rotation: rotation.z // Assuming 2D rotation for now
      }
    }
    return bone
  })

  // Update skeleton with new bone rotations
  const updatedSkeleton = {
    ...character.skeleton,
    bones: updatedBones
  }

  return {
    ...character,
    morphState: updatedMorphState,
    skeleton: updatedSkeleton
  }
}
