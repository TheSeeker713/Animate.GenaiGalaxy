import { useRef, useEffect, useState } from 'react'
import { Stage, Layer, Line } from 'react-konva'
import { useAnimationStore } from '../store/useAnimationStore'
import Konva from 'konva'

interface LineData {
  tool: 'brush' | 'eraser'
  points: number[]
  color: string
  size: number
}

export default function Canvas() {
  const stageRef = useRef<Konva.Stage>(null)
  const layerRef = useRef<Konva.Layer>(null)
  const [lines, setLines] = useState<LineData[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })

  const {
    currentTool,
    brushSize,
    brushColor,
    puppetMode,
    onionSkinEnabled,
    currentFrameIndex,
    faceLandmarks,
    pushHistory,
  } = useAnimationStore()

  // Resize canvas to fit container
  useEffect(() => {
    const updateSize = () => {
      const container = stageRef.current?.container()
      if (container) {
        const parent = container.parentElement
        if (parent) {
          setStageSize({
            width: parent.clientWidth,
            height: parent.clientHeight,
          })
        }
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Calculate puppet rotation from face landmarks (for future use)
  // const getPuppetRotation = (): number => {
  //   if (!puppetMode || !faceLandmarks || faceLandmarks.length === 0) {
  //     return 0
  //   }
  //   const leftEye = faceLandmarks[33]
  //   const rightEye = faceLandmarks[263]
  //   if (!leftEye || !rightEye) return 0
  //   const dx = rightEye.x - leftEye.x
  //   const dy = rightEye.y - leftEye.y
  //   const angle = Math.atan2(dy, dx)
  //   return angle
  // }

  const handleMouseDown = () => {
    if (puppetMode) return // Don't draw in puppet mode without recording
    
    setIsDrawing(true)
    const stage = stageRef.current
    if (!stage) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    // const rotation = getPuppetRotation() // TODO: Apply rotation to drawing
    
    setLines([
      ...lines,
      {
        tool: currentTool === 'puppet' ? 'brush' : currentTool,
        points: [pos.x, pos.y],
        color: brushColor,
        size: brushSize,
      },
    ])
  }

  const handleMouseMove = () => {
    if (!isDrawing) return

    const stage = stageRef.current
    if (!stage) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    const lastLine = lines[lines.length - 1]
    if (!lastLine) return

    // Add point to current line
    lastLine.points = lastLine.points.concat([pos.x, pos.y])

    // Replace last line with updated version
    setLines([...lines.slice(0, -1), lastLine])
  }

  const handleMouseUp = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    // Save to history for undo/redo
    const stage = stageRef.current
    if (stage) {
      const dataUrl = stage.toDataURL()
      pushHistory(dataUrl)
    }
  }

  return (
    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
      <div className="w-full h-full relative">
        {/* Puppet mode overlay indicator */}
        {puppetMode && (
          <div className="absolute top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-10">
            🎭 Puppet Mode Active
            {faceLandmarks && (
              <span className="ml-2 text-sm">
                ({faceLandmarks.length} landmarks detected)
              </span>
            )}
          </div>
        )}

        {/* Onion skin indicator */}
        {onionSkinEnabled && currentFrameIndex > 0 && (
          <div className="absolute top-4 right-4 bg-purple-500 text-white px-4 py-2 rounded-lg shadow-lg z-10">
            👻 Onion Skin
          </div>
        )}

        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          className="cursor-crosshair"
        >
          <Layer ref={layerRef}>
            {/* Onion skin - previous frame */}
            {onionSkinEnabled && currentFrameIndex > 0 && (
              <Line
                points={[]} // TODO: Load previous frame data
                stroke="rgba(255, 100, 100, 0.3)"
                strokeWidth={2}
              />
            )}

            {/* Current drawing */}
            {lines.map((line, i) => (
              <Line
                key={i}
                points={line.points}
                stroke={line.color}
                strokeWidth={line.size}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  line.tool === 'eraser' ? 'destination-out' : 'source-over'
                }
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
