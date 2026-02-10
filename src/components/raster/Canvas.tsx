import { useRef, useEffect, useState } from 'react'
import { Stage, Layer, Line, Rect, Ellipse, Image, Text } from 'react-konva'
import { useAnimationStore } from '../../store/useAnimationStore'
import type { LineData, ShapeData } from '../../types'
import Konva from 'konva'

export default function Canvas() {
  const stageRef = useRef<Konva.Stage>(null)
  const layerRef = useRef<Konva.Layer>(null)
  
  const [lines, setLines] = useState<LineData[]>([])
  const [shapes, setShapes] = useState<ShapeData[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [onionSkinImage, setOnionSkinImage] = useState<HTMLImageElement | null>(null)
  const [tempShape, setTempShape] = useState<{ start: { x: number; y: number } } | null>(null)
  const [tempSelection, setTempSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [selectionImage, setSelectionImage] = useState<HTMLImageElement | null>(null)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)

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
      }, 500)
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

  // Load selection image
  useEffect(() => {
    if (selection && selection.imageData) {
      const img = new window.Image()
      img.onload = () => setSelectionImage(img)
      img.src = selection.imageData
    } else {
      setSelectionImage(null)
    }
  }, [selection])

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

  // Helper to convert hex color to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null
  }

  // Flood fill helper
  const floodFill = (x: number, y: number, fillColor: string) => {
    const stage = stageRef.current
    if (!stage) return

    // Get canvas pixel data
    const canvas = stage.toCanvas()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    const width = canvas.width
    const height = canvas.height

    // Convert fill color to RGB
    const fillRgb = hexToRgb(fillColor)
    if (!fillRgb) return

    // Get target color at click position (adjust for zoom)
    const canvasX = Math.floor(x * zoom)
    const canvasY = Math.floor(y * zoom)
    
    // Bounds check
    if (canvasX < 0 || canvasX >= width || canvasY < 0 || canvasY >= height) {
      console.warn('Fill position out of bounds')
      return
    }
    
    const startPos = (canvasY * width + canvasX) * 4
    const targetR = pixels[startPos]
    const targetG = pixels[startPos + 1]
    const targetB = pixels[startPos + 2]
    const targetA = pixels[startPos + 3]

    // If clicking on same color, don't fill
    if (
      targetR === fillRgb.r &&
      targetG === fillRgb.g &&
      targetB === fillRgb.b &&
      targetA === 255
    ) {
      return
    }

    // Stack-based flood fill
    const stack: [number, number][] = [[canvasX, canvasY]]
    const filled = new Set<string>()

    while (stack.length > 0) {
      const [px, py] = stack.pop()!
      
      if (px < 0 || px >= width || py < 0 || py >= height) continue
      
      const key = `${px},${py}`
      if (filled.has(key)) continue
      filled.add(key)

      const pos = (py * width + px) * 4
      const r = pixels[pos]
      const g = pixels[pos + 1]
      const b = pixels[pos + 2]
      const a = pixels[pos + 3]

      // Check if pixel matches target color
      if (r === targetR && g === targetG && b === targetB && a === targetA) {
        // Fill this pixel
        pixels[pos] = fillRgb.r
        pixels[pos + 1] = fillRgb.g
        pixels[pos + 2] = fillRgb.b
        pixels[pos + 3] = 255

        // Add neighbors to stack
        stack.push([px + 1, py])
        stack.push([px - 1, py])
        stack.push([px, py + 1])
        stack.push([px, py - 1])
      }

      // Limit iterations to prevent freeze (about 50K pixels)
      if (filled.size > 50000) break
    }

    // Put modified image data back
    ctx.putImageData(imageData, 0, 0)
    
    // Convert canvas to dataURL and save
    const dataUrl = canvas.toDataURL()
    saveFrameDrawing(currentFrameIndex, currentLayerIndex, lines, shapes, dataUrl)
    pushHistory()
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
        // Start drawing selection rectangle
        setTempSelection({ x: pos.x, y: pos.y, width: 0, height: 0 })
        break

      case 'eyedropper':
        // Sample color at click position
        const stage = stageRef.current
        if (stage) {
          const canvas = stage.toCanvas()
          const ctx = canvas.getContext('2d')
          if (ctx) {
            const canvasX = Math.floor(pos.x * zoom)
            const canvasY = Math.floor(pos.y * zoom)
            
            // Bounds check
            if (canvasX >= 0 && canvasX < canvas.width && canvasY >= 0 && canvasY < canvas.height) {
              const imageData = ctx.getImageData(canvasX, canvasY, 1, 1)
              const pixel = imageData.data
              const sampledColor = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`
              
              // Import setBrushColor from store
              const { setBrushColor, addColorToPalette } = useAnimationStore.getState()
              setBrushColor(sampledColor)
              addColorToPalette(sampledColor)
            }
          }
        }
        setIsDrawing(false)
        return

      case 'fill':
        // Perform flood fill at click position
        floodFill(pos.x, pos.y, brushColor)
        setIsDrawing(false) // Fill is instant, no dragging
        return // Early return to skip setIsDrawing(true)
    }
  }

  const handleMouseMove = () => {
    const pos = getPointerPosition()
    if (!pos) return
    
    // Update cursor position for preview
    setCursorPos(pos)
    
    if (!isDrawing) return

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

      case 'select':
        // Update selection rectangle during drag
        if (tempSelection) {
          setTempSelection({
            x: tempSelection.x,
            y: tempSelection.y,
            width: pos.x - tempSelection.x,
            height: pos.y - tempSelection.y,
          })
        }
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

    // Finalize selection
    if (currentTool === 'select' && tempSelection) {
      // Normalize rectangle (handle negative width/height)
      const x = tempSelection.width < 0 ? tempSelection.x + tempSelection.width : tempSelection.x
      const y = tempSelection.height < 0 ? tempSelection.y + tempSelection.height : tempSelection.y
      const width = Math.abs(tempSelection.width)
      const height = Math.abs(tempSelection.height)

      // Only create selection if it has size
      if (width > 5 && height > 5) {
        const stage = stageRef.current
        if (stage) {
          // Capture the selected area as image data
          const dataUrl = stage.toDataURL({
            x: x * zoom + panX,
            y: y * zoom + panY,
            width: width * zoom,
            height: height * zoom,
            pixelRatio: 1 / zoom,
          })
          
          setSelection({ x, y, width, height, imageData: dataUrl })
        }
      }
      
      setTempSelection(null)
    }

    // Save to history
    const stage = stageRef.current
    if (stage) {
      pushHistory()
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
    const width = Math.abs(pos.x - start.x)
    const height = Math.abs(pos.y - start.y)

    switch (currentTool) {
      case 'rectangle':
        return (
          <>
            <Rect
              x={Math.min(start.x, pos.x)}
              y={Math.min(start.y, pos.y)}
              width={width}
              height={height}
              stroke={brushColor}
              strokeWidth={brushSize}
              fill={fillColor !== 'transparent' ? fillColor : undefined}
              dash={[5, 5]}
            />
            {/* Dimension label */}
            <Text
              x={Math.min(start.x, pos.x) + width / 2}
              y={Math.min(start.y, pos.y) - 20 / zoom}
              text={`${Math.round(width)} × ${Math.round(height)}`}
              fontSize={12 / zoom}
              fill="white"
              stroke="black"
              strokeWidth={3 / zoom}
              paintOrder="stroke"
              listening={false}
              offsetX={30}
            />
          </>
        )
      case 'ellipse':
        return (
          <>
            <Ellipse
              x={start.x + (pos.x - start.x) / 2}
              y={start.y + (pos.y - start.y) / 2}
              radiusX={width / 2}
              radiusY={height / 2}
              stroke={brushColor}
              strokeWidth={brushSize}
              fill={fillColor !== 'transparent' ? fillColor : undefined}
              dash={[5, 5]}
            />
            {/* Dimension label */}
            <Text
              x={start.x + (pos.x - start.x) / 2}
              y={start.y + (pos.y - start.y) / 2 - height / 2 - 20 / zoom}
              text={`${Math.round(width)} × ${Math.round(height)}`}
              fontSize={12 / zoom}
              fill="white"
              stroke="black"
              strokeWidth={3 / zoom}
              paintOrder="stroke"
              listening={false}
              offsetX={30}
            />
          </>
        )
      case 'line':
        const length = Math.sqrt(Math.pow(pos.x - start.x, 2) + Math.pow(pos.y - start.y, 2))
        const angle = Math.atan2(pos.y - start.y, pos.x - start.x) * 180 / Math.PI
        return (
          <>
            <Line
              points={[start.x, start.y, pos.x, pos.y]}
              stroke={brushColor}
              strokeWidth={brushSize}
              dash={[5, 5]}
            />
            {/* Length and angle label */}
            <Text
              x={(start.x + pos.x) / 2}
              y={(start.y + pos.y) / 2 - 15 / zoom}
              text={`${Math.round(length)}px @ ${Math.round(angle)}°`}
              fontSize={12 / zoom}
              fill="white"
              stroke="black"
              strokeWidth={3 / zoom}
              paintOrder="stroke"
              listening={false}
              offsetX={40}
            />
          </>
        )
    }
  }

  return (
    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
      {/* Tool Info Overlay */}
      <div className="absolute top-4 left-4 bg-gray-900/80 text-white px-3 py-2 rounded shadow-lg z-10 text-sm space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Tool:</span>
          <strong className="capitalize flex items-center gap-1">
            {currentTool === 'brush' && '🖌️'}
            {currentTool === 'eraser' && '🧹'}
            {currentTool === 'rectangle' && '▢'}
            {currentTool === 'ellipse' && '○'}
            {currentTool === 'line' && '─'}
            {currentTool === 'select' && '↖'}
            {currentTool === 'eyedropper' && '💧'}
            {currentTool === 'fill' && '🪣'}
            {currentTool}
          </strong>
        </div>
        {(currentTool === 'brush' || currentTool === 'eraser') && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Size:</span>
            <strong>{brushSize}px</strong>
            <div 
              className="w-4 h-4 rounded-full border-2" 
              style={{ 
                borderColor: currentTool === 'eraser' ? '#EF4444' : brushColor,
                transform: `scale(${Math.min(brushSize / 20, 1)})`
              }}
            />
          </div>
        )}
        {currentTool === 'brush' && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Color:</span>
            <div 
              className="w-6 h-4 rounded border border-gray-600" 
              style={{ backgroundColor: brushColor }}
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Zoom:</span>
          <strong>{Math.round(zoom * 100)}%</strong>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Layer:</span>
          <strong>{currentLayerIndex + 1}</strong>
        </div>
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
          draggable={false}
          className={currentTool === 'brush' || currentTool === 'eraser' ? 'cursor-none' : 'cursor-crosshair'}
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

            {/* Brush cursor preview */}
            {cursorPos && !isDrawing && (currentTool === 'brush' || currentTool === 'eraser') && (
              <>
                {/* Brush size circle */}
                <Ellipse
                  x={cursorPos.x}
                  y={cursorPos.y}
                  radiusX={brushSize / 2}
                  radiusY={brushSize / 2}
                  stroke={currentTool === 'eraser' ? '#EF4444' : brushColor}
                  strokeWidth={2 / zoom}
                  dash={currentTool === 'eraser' ? [5 / zoom, 5 / zoom] : undefined}
                  listening={false}
                  opacity={0.6}
                />
                {/* Center crosshair */}
                <Line
                  points={[
                    cursorPos.x - 10 / zoom,
                    cursorPos.y,
                    cursorPos.x + 10 / zoom,
                    cursorPos.y
                  ]}
                  stroke={currentTool === 'eraser' ? '#EF4444' : '#666'}
                  strokeWidth={1 / zoom}
                  listening={false}
                  opacity={0.8}
                />
                <Line
                  points={[
                    cursorPos.x,
                    cursorPos.y - 10 / zoom,
                    cursorPos.x,
                    cursorPos.y + 10 / zoom
                  ]}
                  stroke={currentTool === 'eraser' ? '#EF4444' : '#666'}
                  strokeWidth={1 / zoom}
                  listening={false}
                  opacity={0.8}
                />
              </>
            )}

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
            {/* Selection rectangle preview (while dragging) */}
            {tempSelection && currentTool === 'select' && (
              <Rect
                x={tempSelection.width < 0 ? tempSelection.x + tempSelection.width : tempSelection.x}
                y={tempSelection.height < 0 ? tempSelection.y + tempSelection.height : tempSelection.y}
                width={Math.abs(tempSelection.width)}
                height={Math.abs(tempSelection.height)}
                stroke="#3B82F6"
                strokeWidth={2 / zoom}
                dash={[8 / zoom, 4 / zoom]}
                listening={false}
              />
            )}

            {/* Active selection */}
            {selection && currentTool === 'select' && selectionImage && (
              <>
                {/* Selection content */}
                <Image
                  image={selectionImage}
                  x={selection.x}
                  y={selection.y}
                  width={selection.width}
                  height={selection.height}
                  draggable
                />
                {/* Selection border */}
                <Rect
                  x={selection.x}
                  y={selection.y}
                  width={selection.width}
                  height={selection.height}
                  stroke="#3B82F6"
                  strokeWidth={2 / zoom}
                  dash={[8 / zoom, 4 / zoom]}
                  listening={false}
                />
              </>
            )}          </Layer>
        </Stage>
      </div>
    </div>
  )
}
