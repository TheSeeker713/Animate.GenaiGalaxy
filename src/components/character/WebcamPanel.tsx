/**
 * Webcam Panel Component
 * Handles webcam access, video display, and face tracking controls
 */

import { useState, useRef, useEffect } from 'react'
import { faceTracker } from '@/utils/faceTracker'
import type { FaceLandmarks } from '@/utils/faceTracker'
import { landmarkMapper } from '@/utils/landmarkMapper'
import { useCharacterStore } from '@/store/characterStore'

export default function WebcamPanel() {
  const { currentCharacter, baseTemplate, updateCharacter } = useCharacterStore()
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [fps, setFps] = useState(0)
  const [showLandmarks, setShowLandmarks] = useState(true)
  
  // Settings
  const [sensitivity, setSensitivity] = useState(1.0)
  const [smoothing, setSmoothing] = useState(true)
  
  // FPS calculation
  const fpsRef = useRef({ frames: 0, lastTime: performance.now() })

  /**
   * Request webcam access
   */
  const startWebcam = async () => {
    try {
      setError(null)
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsWebcamActive(true)
        
        // Initialize face tracker
        await faceTracker.initialize({
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: true
        })
      }
    } catch (err) {
      console.error('Webcam access failed:', err)
      setError('Failed to access webcam. Please check permissions.')
    }
  }

  /**
   * Stop webcam
   */
  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsWebcamActive(false)
    setIsTracking(false)
    setFaceDetected(false)
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  /**
   * Start face tracking loop
   */
  const startTracking = () => {
    if (!isWebcamActive || !videoRef.current || !currentCharacter) return
    
    setIsTracking(true)
    
    // Update mapper config
    landmarkMapper.setConfig({
      smoothing,
      sensitivity,
      headRotationScale: 1.0,
      morphScale: 1.0
    })
    
    trackingLoop()
  }

  /**
   * Stop face tracking
   */
  const stopTracking = () => {
    setIsTracking(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    landmarkMapper.reset()
  }

  /**
   * Main tracking loop
   */
  const trackingLoop = async () => {
    if (!isTracking || !videoRef.current || !currentCharacter) return

    const video = videoRef.current
    
    // Detect landmarks
    const landmarks = await faceTracker.detectLandmarks(video, performance.now())
    
    // Update FPS
    updateFPS()
    
    if (landmarks) {
      setFaceDetected(landmarks.faceDetected)
      
      // Map landmarks to character
      if (landmarks.faceDetected) {
        const mapping = landmarkMapper.mapToCharacter(landmarks, currentCharacter, baseTemplate || undefined)
        
        if (mapping) {
          // Apply morphs and bone rotations
          const updatedCharacter = {
            ...currentCharacter,
            morphState: {
              ...currentCharacter.morphState,
              ...mapping.morphUpdates
            },
            skeleton: {
              ...currentCharacter.skeleton,
              bones: currentCharacter.skeleton.bones.map(bone => {
                const rotation = mapping.boneRotations[bone.id]
                if (rotation) {
                  return { ...bone, rotation: rotation.z }
                }
                return bone
              })
            }
          }
          
          updateCharacter(updatedCharacter)
        }
        
        // Draw landmarks on canvas
        if (showLandmarks && canvasRef.current) {
          drawLandmarks(landmarks)
        }
      }
    } else {
      setFaceDetected(false)
    }
    
    // Continue loop
    animationFrameRef.current = requestAnimationFrame(trackingLoop)
  }

  /**
   * Draw facial landmarks on canvas overlay
   */
  const drawLandmarks = (landmarks: FaceLandmarks) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Match canvas size to video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw landmarks
    if (landmarks.landmarks.length > 0) {
      ctx.fillStyle = '#00ff00'
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 1
      
      // Draw points
      for (const point of landmarks.landmarks) {
        const x = point.x * canvas.width
        const y = point.y * canvas.height
        
        ctx.beginPath()
        ctx.arc(x, y, 1, 0, 2 * Math.PI)
        ctx.fill()
      }
      
      // Draw face oval
      const indices = landmarkMapper.getLandmarkIndices()
      ctx.beginPath()
      for (let i = 0; i < indices.FACE_OVAL.length; i++) {
        const idx = indices.FACE_OVAL[i]
        const point = landmarks.landmarks[idx]
        if (point) {
          const x = point.x * canvas.width
          const y = point.y * canvas.height
          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
      }
      ctx.closePath()
      ctx.stroke()
    }
  }

  /**
   * Update FPS counter
   */
  const updateFPS = () => {
    fpsRef.current.frames++
    const now = performance.now()
    const elapsed = now - fpsRef.current.lastTime
    
    if (elapsed >= 1000) {
      setFps(Math.round((fpsRef.current.frames * 1000) / elapsed))
      fpsRef.current.frames = 0
      fpsRef.current.lastTime = now
    }
  }

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopWebcam()
      faceTracker.dispose()
    }
  }, [])

  /**
   * Restart tracking when settings change
   */
  useEffect(() => {
    if (isTracking) {
      landmarkMapper.setConfig({
        smoothing,
        sensitivity,
        headRotationScale: 1.0,
        morphScale: 1.0
      })
    }
  }, [sensitivity, smoothing, isTracking])

  return (
    <div className="webcam-panel bg-gray-800 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Face Tracking</h3>
        <div className="flex items-center gap-2">
          {isTracking && (
            <span className="flex items-center gap-1 text-sm text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              {fps} FPS
            </span>
          )}
          {faceDetected && (
            <span className="text-sm text-blue-400">Face detected ✓</span>
          )}
        </div>
      </div>

      {/* Video Feed */}
      <div className="relative bg-black rounded overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        {showLandmarks && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        )}
        {!isWebcamActive && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📷</div>
              <p>Webcam not active</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="space-y-3">
        {/* Start/Stop Webcam */}
        <div className="flex gap-2">
          {!isWebcamActive ? (
            <button
              onClick={startWebcam}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold text-white"
            >
              📷 Enable Webcam
            </button>
          ) : (
            <button
              onClick={stopWebcam}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-semibold text-white"
            >
              ⏹️ Stop Webcam
            </button>
          )}
        </div>

        {/* Start/Stop Tracking */}
        {isWebcamActive && (
          <div className="flex gap-2">
            {!isTracking ? (
              <button
                onClick={startTracking}
                disabled={!currentCharacter}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-semibold text-white"
              >
                ▶️ Start Tracking
              </button>
            ) : (
              <button
                onClick={stopTracking}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded font-semibold text-white"
              >
                ⏸️ Pause Tracking
              </button>
            )}
          </div>
        )}

        {/* Settings */}
        <div className="border-t border-gray-700 pt-3 space-y-3">
          <h4 className="text-sm font-semibold text-gray-300">Settings</h4>
          
          {/* Sensitivity Slider */}
          <div>
            <label className="flex items-center justify-between text-sm text-gray-300 mb-1">
              <span>Sensitivity</span>
              <span className="text-blue-400">{sensitivity.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Smoothing Toggle */}
          <label className="flex items-center justify-between text-sm text-gray-300 cursor-pointer">
            <span>Smoothing (Kalman Filter)</span>
            <input
              type="checkbox"
              checked={smoothing}
              onChange={(e) => setSmoothing(e.target.checked)}
              className="w-4 h-4"
            />
          </label>

          {/* Show Landmarks Toggle */}
          <label className="flex items-center justify-between text-sm text-gray-300 cursor-pointer">
            <span>Show Landmarks</span>
            <input
              type="checkbox"
              checked={showLandmarks}
              onChange={(e) => setShowLandmarks(e.target.checked)}
              className="w-4 h-4"
            />
          </label>
        </div>
      </div>

      {/* Help Text */}
      {!currentCharacter && (
        <div className="text-xs text-gray-400 bg-gray-900 rounded p-2">
          ℹ️ Load a character template first to enable face tracking
        </div>
      )}
    </div>
  )
}
