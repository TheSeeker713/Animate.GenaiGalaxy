import { useEffect, useRef, useState, memo } from 'react'
import { useAnimationStore } from '../../store/useAnimationStore'

function Timeline() {
  const {
    frames,
    currentFrameIndex,
    fps,
    isPlaying,
    setCurrentFrame,
    addFrame,
    deleteFrame,
    duplicateFrame,
    reorderFrame,
    updateFrameDuration,
    setFps,
    togglePlay,
  } = useAnimationStore()

  const animationFrameRef = useRef<number>()
  const lastFrameTimeRef = useRef<number>(0)
  const frameTickCountRef = useRef<number>(0)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Keep refs in sync for the playback loop (avoids stale closures & dep restarts)
  const currentFrameRef = useRef(currentFrameIndex)
  const framesRef = useRef(frames)
  useEffect(() => { currentFrameRef.current = currentFrameIndex }, [currentFrameIndex])
  useEffect(() => { framesRef.current = frames }, [frames])
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [editingDuration, setEditingDuration] = useState<number | null>(null)
  const [scrubbing, setScrubbing] = useState(false)

  // Playback loop — only restarts when isPlaying or fps change
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      return
    }

    const frameDuration = 1000 / fps
    lastFrameTimeRef.current = 0
    
    const animate = (currentTime: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = currentTime
      }

      const elapsed = currentTime - lastFrameTimeRef.current

      if (elapsed >= frameDuration) {
        const idx = currentFrameRef.current
        const currentFrame = framesRef.current[idx]
        const frameDurationTicks = currentFrame?.duration || 1
        
        frameTickCountRef.current += 1
        
        if (frameTickCountRef.current >= frameDurationTicks) {
          const nextFrame = (idx + 1) % framesRef.current.length
          setCurrentFrame(nextFrame)
          frameTickCountRef.current = 0
        }
        
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
  }, [isPlaying, fps, setCurrentFrame])

  // Reset tick count when manually changing frames (not during playback)
  useEffect(() => {
    if (!isPlaying) {
      frameTickCountRef.current = 0
    }
  }, [currentFrameIndex, isPlaying])

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      reorderFrame(draggedIndex, dragOverIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleDragEnd()
  }

  // Timeline scrubbing
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const frameWidth = rect.width / frames.length
    const clickedFrame = Math.floor(x / frameWidth)
    setCurrentFrame(Math.max(0, Math.min(frames.length - 1, clickedFrame)))
    setScrubbing(true)
  }

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubbing || !timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const frameWidth = rect.width / frames.length
    const clickedFrame = Math.floor(x / frameWidth)
    setCurrentFrame(Math.max(0, Math.min(frames.length - 1, clickedFrame)))
  }

  const handleTimelineMouseUp = () => {
    setScrubbing(false)
  }

  // Calculate total duration accounting for frame durations
  const getTotalDuration = () => {
    return frames.reduce((sum, frame) => sum + (frame.duration || 1), 0)
  }

  const getFrameStartTime = (index: number) => {
    let time = 0
    for (let i = 0; i < index; i++) {
      time += (frames[i].duration || 1)
    }
    return time
  }

  return (
    <div className="studio-panel--soft p-4">
      {/* Playback Controls */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={togglePlay}
          className="studio-button-primary"
          title="Play/Pause (Space)"
        >
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>

        <button
          onClick={() => setCurrentFrame(Math.max(0, currentFrameIndex - 1))}
          disabled={currentFrameIndex === 0}
          className="tool-button disabled:opacity-50"
          title="Previous Frame (Q)"
        >
          ⏮️
        </button>

        <span className="text-sm mono text-slate-200">
          {currentFrameIndex + 1} / {frames.length}
        </span>

        <button
          onClick={() => setCurrentFrame(Math.min(frames.length - 1, currentFrameIndex + 1))}
          disabled={currentFrameIndex === frames.length - 1}
          className="tool-button disabled:opacity-50"
          title="Next Frame (W)"
        >
          ⏭️
        </button>

        <div className="flex items-center gap-2 ml-4 border-l border-slate-700 pl-4">
          <label className="text-xs uppercase tracking-wide text-slate-400">FPS</label>
          <input
            type="range"
            min="12"
            max="60"
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
            className="w-32 studio-slider"
          />
          <span className="text-sm mono w-8 text-slate-200">{fps}</span>
        </div>

        {/* Frame Management */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => addFrame()}
            className="studio-button-secondary"
            title="Add Frame"
          >
            ➕ Add
          </button>
          <button
            onClick={() => duplicateFrame(currentFrameIndex)}
            className="studio-button-primary"
            title="Duplicate Frame"
          >
            📋 Duplicate
          </button>
          <button
            onClick={() => deleteFrame(currentFrameIndex)}
            disabled={frames.length <= 1}
            className="tool-button tool-button--danger disabled:opacity-50"
            title="Delete Frame"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Timeline Ruler */}
      <div className="mb-2 relative">
        <div className="text-xs text-slate-400 mb-1 flex justify-between">
          <span>Timeline (Total: {getTotalDuration()} frames @ {fps} FPS = {(getTotalDuration() / fps).toFixed(2)}s)</span>
          <span>Drag frames to reorder • Click timeline to scrub</span>
        </div>
        <div 
          ref={timelineRef}
          className="h-8 studio-timeline rounded relative cursor-pointer overflow-hidden"
          onMouseDown={handleTimelineMouseDown}
          onMouseMove={handleTimelineMouseMove}
          onMouseUp={handleTimelineMouseUp}
          onMouseLeave={handleTimelineMouseUp}
        >
          {/* Frame duration blocks */}
          {frames.map((frame, index) => {
            const startTime = getFrameStartTime(index)
            const duration = frame.duration || 1
            const totalDuration = getTotalDuration()
            const left = (startTime / totalDuration) * 100
            const width = (duration / totalDuration) * 100
            const isActive = index === currentFrameIndex
            
            return (
              <div
                key={frame.id}
                className={`absolute top-0 bottom-0 border-r border-slate-700 transition ${
                  isActive ? 'bg-emerald-400/80' : 'bg-slate-700'
                }`}
                style={{ left: `${left}%`, width: `${width}%` }}
                title={`Frame ${index + 1} (${duration} frame${duration > 1 ? 's' : ''})`}
              >
                <div className="text-xs text-slate-100 text-center leading-8 font-semibold">
                  {index + 1}
                </div>
              </div>
            )
          })}
          
          {/* Playhead marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-rose-400 pointer-events-none z-10"
            style={{ 
              left: `${(getFrameStartTime(currentFrameIndex) / getTotalDuration()) * 100}%` 
            }}
          >
            <div className="absolute -top-1 -left-2 w-4 h-4 bg-rose-400 rotate-45"></div>
          </div>
        </div>
      </div>

      {/* Frame Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {frames.map((frame, index) => {
          const thumbnail = frame.layers[0]?.imageData
          const isDragging = draggedIndex === index
          const isDragOver = dragOverIndex === index
          
          return (
            <div
              key={frame.id}
              className={`flex-shrink-0 ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'ml-8' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
            >
              <button
                onClick={() => setCurrentFrame(index)}
                className={`w-24 h-20 rounded border-2 transition overflow-hidden ${
                  index === currentFrameIndex
                    ? 'border-emerald-400 bg-emerald-400/10'
                    : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                }`}
              >
                {thumbnail ? (
                  <img 
                    src={thumbnail} 
                    alt={`Frame ${index + 1}`}
                    className="w-full h-full object-contain pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                    Frame {index + 1}
                  </div>
                )}
              </button>
              
              {/* Frame duration control */}
              <div className="mt-1 flex items-center justify-center gap-1">
                {editingDuration === index ? (
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={frame.duration || 1}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1
                      updateFrameDuration(index, val)
                    }}
                    onBlur={() => setEditingDuration(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingDuration(null)
                    }}
                    autoFocus
                    className="w-12 px-1 py-0.5 text-xs text-center border rounded studio-input"
                  />
                ) : (
                  <button
                    onClick={() => setEditingDuration(index)}
                    className="text-xs px-1.5 py-0.5 rounded studio-button-secondary"
                    title="Click to edit frame duration"
                  >
                    ×{frame.duration || 1}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default memo(Timeline)
