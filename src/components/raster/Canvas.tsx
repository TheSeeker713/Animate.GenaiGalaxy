import { useRef, useEffect, useState } from 'react'
import { Stage, Layer, Line, Rect, Ellipse, Image, Transformer } from 'react-konva'
import { useAnimationStore } from '../../store/useAnimationStore'
import type { LineData, ShapeData } from '../../types'
import Konva from 'konva'

export default function Canvas() {
  const stageRef = useRef<Konva.Stage>(null)
  const layerRef = useRef<Konva.Layer>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  
  const [lines, setLines] = useState<LineData[]>([])
  const [shapes, setShapes] = useState<ShapeData[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [onionSkinImage, setOnionSkinImage] = useState<HTMLImageElement | null>(null)
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null)
  const [tempShape, setTempShape] = useState<{ start: { x: number; y: number } } | null>(null)

  const {
    currentTool,
    brushSize,
    brushColor,
    fillColor,
    puppetMode,
    onionSkinEnabled,
    currentFrameIndex,
    currentLayerIndex,
    frames,
    faceLandmarks,
    selection,
    zoom,
    panX,
    panY,
    pushHistory,
    saveFrameDrawing,
    setSelection,
    setZoom,
    setPan,
  } = useAnimationStore()

  const currentFrame = frames[currentFrameIndex]
  const currentLayer = currentFrame?.layers[currentLayerIndex]
  const previousFrame = currentFrameIndex > 0 ? frames[currentFrameIndex - 1] : null

  // Load frame drawing when frame/layer changes
  useEffect(() => {
    if (currentLayer) {
      const frameLines = currentLayer.lines || []
      const frameShapes = currentLayer.shapes || []
      setLines(frameLines)
      setShapes(frameShapes)
    }
  }, [currentFrameIndex, currentLayerIndex, currentLayer])

  // Save frame drawing before switching frames or when drawing changes
  useEffect(() => {
    if (!isDrawing && (lines.length > 0 || shapes.length > 0)) {
      const timer = setTimeout(() => {
        const stage = stageRef.current
        if (stage) {
          const dataUrl = stage.toDataURL()
          saveFrameDrawing(currentFrameIndex, currentLayerIndex, lines, shapes, dataUrl)
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [lines, shapes, currentFrameIndex, currentLayerIndex, saveFrameDrawing, isDrawing])

  // Load onion skin image from previous frame
  useEffect(() => {
    if (onionSkinEnabled && previousFrame && previousFrame.layers[currentLayerIndex]) {
      const prevImageData = previousFrame.layers[currentLayerIndex].imageData
      if (prevImageData) {
        const img = new window.Image()
        img.onload = () => setOnionSkinImage(img)
        img.src = prevImageData
      } else {
        setOnionSkinImage(null)
      }
    } else {
      setOnionSkinImage(null)
    }
  }, [onionSkinEnabled, previousFrame, currentLayerIndex])

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

  const getPointerPosition = () => {
    const stage = stageRef.current
    if (!stage) return null
    
    const pos = stage.getPointerPosition()
    if (!pos) return null

    // Adjust for zoom and pan
    return {
      x: (pos.x - panX) / zoom,
      y: (pos.y - panY) / zoom,
    }
  }

const handleMouseDown = () => {
    if (puppetMode) return
    
    const pos = getPointerPosition()
    if (!pos) return

    setIsDrawing(true)

    switch (currentTool) {
      case 'brush':
      case 'eraser':
        setLines([
          ...lines,
          {
            tool: currentTool,
            points: [pos.x, pos.y],
            color: brushColor,
            size: brushSize,
          },
        ])
        break

      case 'rectangle':
      case 'ellipse':
      case 'line':
        setTempShape({ start: pos })
        break

      case 'select':
        // TODO: Implement selection
        break

      case 'eyedropper':
        // TODO: Implement eyedropper
        break

      case 'fill':
        // TODO: Implement fill tool
        break
    }
  }

  const handleMouseMove = () => {
    if (!isDrawing) return

    const pos = getPointerPosition()
    if (!pos) return

    switch (currentTool) {
      case 'brush':
      case 'eraser':
        const lastLine = lines[lines.length - 1]
        if (!lastLine) return
        lastLine.points = lastLine.points.concat([pos.x, pos.y])
        setLines([...lines.slice(0, -1), lastLine])
        break

      case 'rectangle':
      case 'ellipse':
      case 'line':
        // Preview handled in render
        break
    }
  }

  const handleMouseUp = () => {
    if (!isDrawing) return

    const pos = getPointerPosition()
    if (!pos) return

    setIsDrawing(false)

    // Finalize shape tools
    if ((currentTool === 'rectangle' || currentTool === 'ellipse' || currentTool === 'line') && tempShape) {
      const start = tempShape.start
      const newShape: ShapeData = {
        id: crypto.randomUUID(),
        type: currentTool,
        x: Math.min(start.x, pos.x),
        y: Math.min(start.y, pos.y),
        width: Math.abs(pos.x - start.x),
        height: Math.abs(pos.y - start.y),
        x2: currentTool === 'line' ? pos.x : undefined,
        y2: currentTool === 'line' ? pos.y : undefined,
        color: brushColor,
        strokeWidth: brushSize,
        fill: fillColor !== 'transparent' ? fillColor : undefined,
      }

      if (currentTool === 'line') {
        newShape.x = start.x
        newShape.y = start.y
      }

      setShapes([...shapes, newShape])
      setTempShape(null)
    }

    // Save to history
    const stage = stageRef.current
    if (stage) {
      const dataUrl = stage.toDataURL()
      pushHistory(dataUrl)
    }
  }

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    
    const stage = stageRef.current
    if (!stage) return

    const oldScale = zoom
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    // Zoom in/out
    const scaleBy = 1.1
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy

    // Keep zoom between 0.1x and 10x
    const clampedScale = Math.max(0.1, Math.min(10, newScale))

    // Adjust pan to zoom toward cursor
    const mousePointTo = {
      x: (pointer.x - panX) / oldScale,
      y: (pointer.y - panY) / oldScale,
    }

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    }

    setZoom(clampedScale)
    setPan(newPos.x, newPos.y)
  }

  // Render temp shape preview
  const renderTempShape = () => {
    if (!tempShape || !isDrawing) return null

    const pos = getPointerPosition()
    if (!pos) return null

    const start = tempShape.start

    switch (currentTool) {
      case 'rectangle':
        return (
          <Rect
            x={Math.min(start.x, pos.x)}
            y={Math.min(start.y, pos.y)}
            width={Math.abs(pos.x - start.x)}
            height={Math.abs(pos.y - start.y)}
            stroke={brushColor}
            strokeWidth={brushSize}
            fill={fillColor !== 'transparent' ? fillColor : undefined}
            dash={[5, 5]}
          />
        )
      case 'ellipse':
        return (
          <Ellipse
            x={start.x + (pos.x - start.x) / 2}
            y={start.y + (pos.y - start.y) / 2}
            radiusX={Math.abs(pos.x - start.x) / 2}
            radiusY={Math.abs(pos.y - start.y) / 2}
            stroke={brushColor}
            strokeWidth={brushSize}
            fill={fillColor !== 'transparent' ? fillColor : undefined}
            dash={[5, 5]}
          />
        )
      case 'line':
        return (
          <Line
            points={[start.x, start.y, pos.x, pos.y]}
            stroke={brushColor}
            strokeWidth={brushSize}
            dash={[5, 5]}
          />
        )
    }
  }

  return (
    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
      {/* Tool Info Overlay */}
      <div className="absolute top-4 left-4 bg-gray-900/80 text-white px-3 py-2 rounded shadow-lg z-10 text-sm">
        <div>Tool: <strong className="capitalize">{currentTool}</strong></div>
        <div>Zoom: <strong>{Math.round(zoom * 100)}%</strong></div>
        <div>Layer: <strong>{currentLayerIndex + 1}</strong></div>
      </div>

      {/* Puppet mode indicator */}
      {puppetMode && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-10">
          🎭 Puppet Mode Active
          {faceLandmarks && (
            <span className="ml-2 text-sm">
              ({faceLandmarks.length} landmarks)
            </span>
          )}
        </div>
      )}

      {/* Onion skin indicator */}
      {onionSkinEnabled && currentFrameIndex > 0 && (
        <div className="absolute top-16 right-4 bg-purple-500 text-white px-4 py-2 rounded-lg shadow-lg z-10">
          👻 Onion Skin
        </div>
      )}

      <div className="w-full h-full relative overflow-hidden">
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          scaleX={zoom}
          scaleY={zoom}
          x={panX}
          y={panY}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          onWheel={handleWheel}
          draggable={currentTool === 'select'}
          className="cursor-crosshair"
        >
          <Layer ref={layerRef}>
            {/* Onion skin - previous frame */}
            {onionSkinEnabled && onionSkinImage && (
              <Image
                image={onionSkinImage}
                width={stageSize.width / zoom}
                height={stageSize.height / zoom}
                opacity={0.3}
              />
            )}

            {/* Current drawing lines */}
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

            {/* Shapes */}
            {shapes.map((shape) => {
              if (shape.type === 'rectangle') {
                return (
                  <Rect
                    key={shape.id}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    stroke={shape.color}
                    strokeWidth={shape.strokeWidth}
                    fill={shape.fill}
                  />
                )
              } else if (shape.type === 'ellipse') {
                return (
                  <Ellipse
                    key={shape.id}
                    x={shape.x + (shape.width || 0) / 2}
                    y={shape.y + (shape.height || 0) / 2}
                    radiusX={(shape.width || 0) / 2}
                    radiusY={(shape.height || 0) / 2}
                    stroke={shape.color}
                    strokeWidth={shape.strokeWidth}
                    fill={shape.fill}
                  />
                )
              } else if (shape.type === 'line') {
                return (
                  <Line
                    key={shape.id}
                    points={[shape.x, shape.y, shape.x2 || shape.x, shape.y2 || shape.y]}
                    stroke={shape.color}
                    strokeWidth={shape.strokeWidth}
                  />
                )
              }
            })}

            {/* Temp shape preview */}
            {renderTempShape()}

            {/* Selection box */}
            {selection && (
              <Rect
                x={selection.x}
                y={selection.y}
                width={selection.width}
                height={selection.height}
                stroke="blue"
                strokeWidth={2 / zoom}
                dash={[5 / zoom, 5 / zoom]}
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
