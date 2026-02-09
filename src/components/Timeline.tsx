import { useEffect, useRef } from 'react'
import { useAnimationStore } from '../store/useAnimationStore'

export default function Timeline() {
  const {
    frames,
    currentFrameIndex,
    fps,
    isPlaying,
    setCurrentFrame,
    addFrame,
    deleteFrame,
    duplicateFrame,
    setFps,
    togglePlay,
  } = useAnimationStore()

  const animationFrameRef = useRef<number>()
  const lastFrameTimeRef = useRef<number>(0)

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      return
    }

    const frameDuration = 1000 / fps
    
    const animate = (currentTime: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = currentTime
      }

      const elapsed = currentTime - lastFrameTimeRef.current

      if (elapsed >= frameDuration) {
        const nextFrame = (currentFrameIndex + 1) % frames.length
        setCurrentFrame(nextFrame)
        lastFrameTimeRef.current = currentTime
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, fps, currentFrameIndex, frames.length, setCurrentFrame])

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-4">
      {/* Playback Controls */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={togglePlay}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition"
          title="Play/Pause (Space)"
        >
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>

        <button
          onClick={() => setCurrentFrame(Math.max(0, currentFrameIndex - 1))}
          disabled={currentFrameIndex === 0}
          className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded disabled:opacity-50 transition"
          title="Previous Frame (Q)"
        >
          ⏮️
        </button>

        <span className="text-sm font-mono">
          {currentFrameIndex + 1} / {frames.length}
        </span>

        <button
          onClick={() => setCurrentFrame(Math.min(frames.length - 1, currentFrameIndex + 1))}
          disabled={currentFrameIndex === frames.length - 1}
          className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded disabled:opacity-50 transition"
          title="Next Frame (W)"
        >
          ⏭️
        </button>

        <div className="flex items-center gap-2 ml-4 border-l border-gray-300 dark:border-gray-600 pl-4">
          <label className="text-sm">FPS:</label>
          <input
            type="range"
            min="12"
            max="60"
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-sm font-mono w-8">{fps}</span>
        </div>

        {/* Frame Management */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => addFrame()}
            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition"
            title="Add Frame"
          >
            ➕ Add
          </button>
          <button
            onClick={() => duplicateFrame(currentFrameIndex)}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition"
            title="Duplicate Frame"
          >
            📋 Duplicate
          </button>
          <button
            onClick={() => deleteFrame(currentFrameIndex)}
            disabled={frames.length <= 1}
            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50 transition"
            title="Delete Frame"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Frame Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {frames.map((frame, index) => {
          const thumbnail = frame.layers[0]?.imageData
          
          return (
            <button
              key={frame.id}
              onClick={() => setCurrentFrame(index)}
              className={`flex-shrink-0 w-24 h-20 rounded border-2 transition overflow-hidden ${
                index === currentFrameIndex
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : 'border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 hover:border-gray-400'
              }`}
            >
              {thumbnail ? (
                <img 
                  src={thumbnail} 
                  alt={`Frame ${index + 1}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-600 dark:text-gray-400">
                  Frame {index + 1}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
