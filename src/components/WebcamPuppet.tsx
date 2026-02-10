import { useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { useAnimationStore } from '../store/useAnimationStore'

export default function WebcamPuppet() {
  const webcamRef = useRef<Webcam>(null)
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null)
  const animationFrameRef = useRef<number>()
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { setFaceLandmarks } = useAnimationStore()

  // Initialize MediaPipe FaceLandmarker
  useEffect(() => {
    const initFaceLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )

        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
        })

        faceLandmarkerRef.current = faceLandmarker
        setIsInitialized(true)
      } catch (err) {
        console.error('Failed to initialize FaceLandmarker:', err)
        setError('Failed to load face tracking model')
      }
    }

    initFaceLandmarker()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Process video frames
  useEffect(() => {
    if (!isInitialized || !faceLandmarkerRef.current) return

    let lastVideoTime = -1

    const detectFace = () => {
      const video = webcamRef.current?.video
      if (!video || video.readyState !== 4) {
        animationFrameRef.current = requestAnimationFrame(detectFace)
        return
      }

      const currentTime = video.currentTime
      
      // Throttle to ~30 FPS
      if (currentTime === lastVideoTime) {
        animationFrameRef.current = requestAnimationFrame(detectFace)
        return
      }
      
      lastVideoTime = currentTime

      try {
        const results = faceLandmarkerRef.current!.detectForVideo(video, Date.now())
        
        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          setFaceLandmarks(results.faceLandmarks[0])
          
          // Draw debug overlay
          if (showDebug && canvasRef.current) {
            drawFaceLandmarks(results.faceLandmarks[0])
          }
        } else {
          setFaceLandmarks(null)
        }
      } catch (err) {
        console.error('Face detection error:', err)
      }

      animationFrameRef.current = requestAnimationFrame(detectFace)
    }

    animationFrameRef.current = requestAnimationFrame(detectFace)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isInitialized, showDebug, setFaceLandmarks])

  const drawFaceLandmarks = (landmarks: any[]) => {
    const canvas = canvasRef.current
    const video = webcamRef.current?.video
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#00ff00'
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 1

    // Draw landmark points
    landmarks.forEach((landmark) => {
      const x = landmark.x * canvas.width
      const y = landmark.y * canvas.height
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Draw key features (eyes, mouth)
    const drawLine = (start: number, end: number) => {
      const startLm = landmarks[start]
      const endLm = landmarks[end]
      ctx.beginPath()
      ctx.moveTo(startLm.x * canvas.width, startLm.y * canvas.height)
      ctx.lineTo(endLm.x * canvas.width, endLm.y * canvas.height)
      ctx.stroke()
    }

    // Left eye
    for (let i = 33; i < 42; i++) {
      drawLine(i, i + 1)
    }
    drawLine(42, 33)

    // Right eye
    for (let i = 263; i < 272; i++) {
      drawLine(i, i + 1)
    }
    drawLine(272, 263)
  }

  if (error) {
    return (
      <div className="absolute top-20 right-4 p-4 rounded-xl shadow-lg max-w-xs border border-red-500/40" style={{ background: 'var(--studio-surface)' }}>
        <h3 className="font-bold mb-2 text-red-400">Error</h3>
        <p className="text-sm text-[var(--studio-text-dim)]">{error}</p>
      </div>
    )
  }

  return (
    <div className="absolute top-20 right-4 rounded-xl shadow-2xl overflow-hidden border-2 border-[var(--studio-accent)]" style={{ background: 'var(--studio-bg)' }}>
      <div className="relative">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: 'user',
            width: 320,
            height: 240,
          }}
          className="block"
        />
        {showDebug && (
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />
        )}
      </div>
      
      <div className="flex items-center justify-between p-2" style={{ background: 'var(--studio-surface)' }}>
        <span className="text-xs text-[var(--studio-accent)]">
          {isInitialized ? '● Live' : '⏳ Loading...'}
        </span>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-xs px-2 py-1 rounded-md text-[var(--studio-text-dim)] hover:text-[var(--studio-text)] transition-colors"
          style={{ background: 'var(--studio-bg)' }}
        >
          {showDebug ? 'Hide' : 'Show'} Debug
        </button>
      </div>
    </div>
  )
}
