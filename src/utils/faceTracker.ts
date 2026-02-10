/**
 * Face Tracking Utility
 * Wrapper around MediaPipe Face Landmarker for real-time facial tracking
 */

import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision'

export interface FaceLandmarks {
  landmarks: Array<{ x: number; y: number; z: number }>
  blendshapes?: Array<{ categoryName: string; score: number }>
  faceDetected: boolean
  timestamp: number
}

export interface FaceTrackerConfig {
  runningMode?: 'IMAGE' | 'VIDEO'
  numFaces?: number
  minDetectionConfidence?: number
  minTrackingConfidence?: number
  outputFaceBlendshapes?: boolean
}

class FaceTrackerService {
  private static instance: FaceTrackerService
  private faceLandmarker: FaceLandmarker | null = null
  private isInitialized = false
  private isInitializing = false
  private lastVideoTime = -1

  static getInstance(): FaceTrackerService {
    if (!FaceTrackerService.instance) {
      FaceTrackerService.instance = new FaceTrackerService()
    }
    return FaceTrackerService.instance
  }

  /**
   * Initialize MediaPipe Face Landmarker
   */
  async initialize(config: FaceTrackerConfig = {}): Promise<void> {
    if (this.isInitialized) return
    if (this.isInitializing) {
      // Wait for existing initialization
      return new Promise((resolve) => {
        const checkInit = setInterval(() => {
          if (this.isInitialized) {
            clearInterval(checkInit)
            resolve()
          }
        }, 100)
      })
    }

    this.isInitializing = true

    try {
      console.log('[FaceTracker] Loading MediaPipe Face Landmarker...')
      
      // Load the MediaPipe vision tasks
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )

      // Create Face Landmarker
      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: config.runningMode || 'VIDEO',
        numFaces: config.numFaces || 1,
        minFaceDetectionConfidence: config.minDetectionConfidence || 0.5,
        minFacePresenceConfidence: config.minTrackingConfidence || 0.5,
        minTrackingConfidence: config.minTrackingConfidence || 0.5,
        outputFaceBlendshapes: config.outputFaceBlendshapes !== false,
        outputFacialTransformationMatrixes: false
      })

      this.isInitialized = true
      this.isInitializing = false
      console.log('[FaceTracker] Initialized successfully')
    } catch (error) {
      this.isInitializing = false
      console.error('[FaceTracker] Initialization failed:', error)
      throw new Error(`Failed to initialize Face Landmarker: ${error}`)
    }
  }

  /**
   * Process a video frame and detect facial landmarks
   */
  async detectLandmarks(
    video: HTMLVideoElement,
    timestamp?: number
  ): Promise<FaceLandmarks | null> {
    if (!this.isInitialized || !this.faceLandmarker) {
      console.warn('[FaceTracker] Not initialized')
      return null
    }

    try {
      const now = timestamp !== undefined ? timestamp : performance.now()

      // Skip if same frame
      if (video.currentTime === this.lastVideoTime) {
        return null
      }
      this.lastVideoTime = video.currentTime

      // Detect landmarks
      const results: FaceLandmarkerResult = this.faceLandmarker.detectForVideo(video, now)

      // No face detected
      if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
        return {
          landmarks: [],
          blendshapes: [],
          faceDetected: false,
          timestamp: now
        }
      }

      // Extract first face landmarks (468 points)
      const landmarks = results.faceLandmarks[0].map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z || 0
      }))

      // Extract blendshapes if available
      const blendshapes = results.faceBlendshapes?.[0]?.categories?.map((cat) => ({
        categoryName: cat.categoryName || '',
        score: cat.score || 0
      }))

      return {
        landmarks,
        blendshapes,
        faceDetected: true,
        timestamp: now
      }
    } catch (error) {
      console.error('[FaceTracker] Detection failed:', error)
      return null
    }
  }

  /**
   * Process a static image and detect facial landmarks
   */
  async detectLandmarksFromImage(
    image: HTMLImageElement | ImageData
  ): Promise<FaceLandmarks | null> {
    if (!this.isInitialized || !this.faceLandmarker) {
      console.warn('[FaceTracker] Not initialized')
      return null
    }

    try {
      const results = this.faceLandmarker.detect(image)

      if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
        return {
          landmarks: [],
          blendshapes: [],
          faceDetected: false,
          timestamp: performance.now()
        }
      }

      const landmarks = results.faceLandmarks[0].map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z || 0
      }))

      const blendshapes = results.faceBlendshapes?.[0]?.categories?.map((cat) => ({
        categoryName: cat.categoryName || '',
        score: cat.score || 0
      }))

      return {
        landmarks,
        blendshapes,
        faceDetected: true,
        timestamp: performance.now()
      }
    } catch (error) {
      console.error('[FaceTracker] Image detection failed:', error)
      return null
    }
  }

  /**
   * Reset the tracker (clears video time tracking)
   */
  reset(): void {
    this.lastVideoTime = -1
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.faceLandmarker) {
      this.faceLandmarker.close()
      this.faceLandmarker = null
    }
    this.isInitialized = false
    this.isInitializing = false
    this.lastVideoTime = -1
    console.log('[FaceTracker] Disposed')
  }

  /**
   * Check if tracker is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.faceLandmarker !== null
  }
}

// Export singleton instance
export const faceTracker = FaceTrackerService.getInstance()

// Export landmark index helpers for easy access
export const LANDMARK_INDICES = {
  // Face oval
  FACE_OVAL: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
  
  // Eyes
  LEFT_EYE: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  RIGHT_EYE: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
  
  // Eyebrows
  LEFT_EYEBROW: [46, 53, 52, 65, 55, 70, 63, 105, 66, 107],
  RIGHT_EYEBROW: [285, 295, 282, 283, 276, 300, 293, 334, 296, 336],
  
  // Mouth
  LIPS_UPPER: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291],
  LIPS_LOWER: [146, 91, 181, 84, 17, 314, 405, 321, 375, 291],
  MOUTH_INNER: [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308],
  
  // Nose
  NOSE_TIP: [1, 2],
  NOSE_BRIDGE: [6, 197, 195, 5],
  
  // Additional key points
  CHIN: [152],
  FOREHEAD: [10]
}
