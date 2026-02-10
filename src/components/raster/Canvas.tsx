import { useRef, useEffect, useState, useCallback } from 'react'
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
  const [isCanvasReady, setIsCanvasReady] = useState(false)
  const [onionSkinImage, setOnionSkinImage] = useState<HTMLImageElement | null>(null)
  const [tempShape, setTempShape] = useState<{
    start: { x: number; y: number }
    end: { x: number; y: number }
  } | null>(null)
  const [tempSelection, setTempSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [selectionImage, setSelectionImage] = useState<HTMLImageElement | null>(null)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)
  const [shiftHeld, setShiftHeld] = useState(false)

  // Track Shift key for snapping
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'Shift') setShiftHeld(true) }
    const up = (e: KeyboardEvent) => { if (e.key === 'Shift') setShiftHeld(false) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  const {
    currentTool,
    brushSize,
    brushColor,
    fillColor,
    textSize,
    textFont,
    canvasColor,
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
      if(container) {
        const parent = container.parentElement
        if (parent) {
          const width = parent.clientWidth
          const height = parent.clientHeight
          if (width > 0 && height > 0) {
            setStageSize({ width, height })
            setIsCanvasReady(true)
          } else {
            console.warn('Canvas parent has invalid dimensions:', { width, height })
          }
        } else {
          console.warn('Canvas: no parent element found')
        }
      } else {
        console.warn('Canvas: no container found')
      }
    }

    // Initial size with slight delay to ensure DOM is ready
    const timer = setTimeout(updateSize, 0)
    updateSize()
    
    // Use ResizeObserver for better resize detection
    const container = stageRef.current?.container()
    let resizeObserver: ResizeObserver | null = null
    
    if (container && container.parentElement) {
      resizeObserver = new ResizeObserver(updateSize)
      resizeObserver.observe(container.parentElement)
    }
    
    window.addEventListener('resize', updateSize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateSize)
      resizeObserver?.disconnect()
    }
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

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (puppetMode) return
    
    const pos = getPointerPosition()
    if (!pos) {
      console.warn('Canvas: getPointerPosition returned null')
      return
    }

    switch (currentTool) {
      case 'brush':
      case 'eraser':
        setIsDrawing(true)
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
        setIsDrawing(true)
        setTempShape({ start: pos, end: pos })
        break

      case 'select':
        setIsDrawing(true)
        setTempSelection({ x: pos.x, y: pos.y, width: 0, height: 0 })
        break

      case 'eyedropper': {
        // Sample color at click position — instant, no drag
        const stage = stageRef.current
        if (stage) {
          const canvas = stage.toCanvas()
          const ctx = canvas.getContext('2d')
          if (ctx) {
            const canvasX = Math.floor(pos.x * zoom)
            const canvasY = Math.floor(pos.y * zoom)
            
            if (canvasX >= 0 && canvasX < canvas.width && canvasY >= 0 && canvasY < canvas.height) {
              const imageData = ctx.getImageData(canvasX, canvasY, 1, 1)
              const pixel = imageData.data
              const sampledColor = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`
              
              const { setBrushColor, addColorToPalette } = useAnimationStore.getState()
              setBrushColor(sampledColor)
              addColorToPalette(sampledColor)
            }
          }
        }
        return
      }

      case 'fill':
        // Flood fill — instant, no drag
        floodFill(pos.x, pos.y, brushColor)
        return

      case 'text': {
        // Prompt for text — instant, no drag
        const textInput = prompt('Enter text:')
        if (textInput && textInput.trim()) {
          const newTextShape: ShapeData = {
            id: crypto.randomUUID(),
            type: 'text',
            x: pos.x,
            y: pos.y,
            color: brushColor,
            strokeWidth: 0,
            text: textInput.trim(),
            fontSize: textSize,
            fontFamily: textFont,
            fontStyle: 'normal',
          }
          setShapes([...shapes, newTextShape])
        }
        return
      }

      case 'transform':
        if (selection) {
          setIsDrawing(true)
          setTempShape({ start: pos, end: pos })
        }
        break
    }
  }

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const pos = getPointerPosition()
    if (!pos) return
    
    // Update cursor position for preview
    setCursorPos(pos)
    
    if (!isDrawing) return

    switch (currentTool) {
      case 'brush':
      case 'eraser': {
        const lastLine = lines[lines.length - 1]
        if (!lastLine) return
        const updatedLine = { ...lastLine, points: [...lastLine.points, pos.x, pos.y] }
        setLines([...lines.slice(0, -1), updatedLine])
        break
      }

      case 'rectangle':
      case 'ellipse':
      case 'line': {
        const snapped = applySnapping(tempShape?.start ?? pos, pos, currentTool, shiftHeld)
        setTempShape((prev) => (prev ? { ...prev, end: snapped } : prev))
        break
      }

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

      case 'transform':
        // Move selection while dragging
        if (selection && tempShape) {
          const dx = pos.x - tempShape.start.x
          const dy = pos.y - tempShape.start.y
          setSelection({
            ...selection,
            x: selection.x + dx,
            y: selection.y + dy,
          })
          setTempShape({ start: pos, end: pos }) // Update start position for next move
        }
        break
    }
  }

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing) return

    const pos = getPointerPosition()
    if (!pos) return

    setIsDrawing(false)

    // Finalize shape tools
    if ((currentTool === 'rectangle' || currentTool === 'ellipse' || currentTool === 'line') && tempShape) {
      const start = tempShape.start
      const end = tempShape.end
      // Only create shape if it has meaningful size
      const dx = Math.abs(end.x - start.x)
      const dy = Math.abs(end.y - start.y)
      if (dx > 2 || dy > 2) {
        const newShape: ShapeData = {
          id: crypto.randomUUID(),
          type: currentTool,
          x: Math.min(start.x, end.x),
          y: Math.min(start.y, end.y),
          width: dx,
          height: dy,
          x2: currentTool === 'line' ? end.x : undefined,
          y2: currentTool === 'line' ? end.y : undefined,
          color: brushColor,
          strokeWidth: brushSize,
          fill: fillColor !== 'transparent' ? fillColor : undefined,
        }

        if (currentTool === 'line') {
          newShape.x = start.x
          newShape.y = start.y
        }

        setShapes([...shapes, newShape])
      }
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

    // Finalize transform
    if (currentTool === 'transform' && tempShape) {
      setTempShape(null)
    }

    // Save to history (single call)
    pushHistory()
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

  // Snapping helper: constrain endpoint based on Shift key
  const applySnapping = useCallback(
    (start: { x: number; y: number }, end: { x: number; y: number }, tool: string, shift: boolean): { x: number; y: number } => {
      if (!shift) return end
      const dx = end.x - start.x
      const dy = end.y - start.y
      if (tool === 'line') {
        // Snap to nearest 45° angle
        const dist = Math.sqrt(dx * dx + dy * dy)
        const rawAngle = Math.atan2(dy, dx)
        const snappedAngle = Math.round(rawAngle / (Math.PI / 4)) * (Math.PI / 4)
        return { x: start.x + dist * Math.cos(snappedAngle), y: start.y + dist * Math.sin(snappedAngle) }
      }
      if (tool === 'rectangle' || tool === 'ellipse') {
        // Force square / circle
        const side = Math.max(Math.abs(dx), Math.abs(dy))
        return { x: start.x + side * Math.sign(dx || 1), y: start.y + side * Math.sign(dy || 1) }
      }
      return end
    },
    []
  )

  // Render temp shape preview (both while drawing and as cursor preview)
  const renderTempShape = () => {
    if (!tempShape || !isDrawing) return null

    const start = tempShape.start
    const end = tempShape.end
    const w = Math.abs(end.x - start.x)
    const h = Math.abs(end.y - start.y)
    const snapLabel = shiftHeld ? ' ⌗' : ''

    switch (currentTool) {
      case 'rectangle':
        return (
          <>
            <Rect
              x={Math.min(start.x, end.x)}
              y={Math.min(start.y, end.y)}
              width={w}
              height={h}
              stroke={brushColor}
              strokeWidth={brushSize}
              fill={fillColor !== 'transparent' ? fillColor : undefined}
              dash={[5, 5]}
              opacity={0.85}
            />
            <Text
              x={Math.min(start.x, end.x) + w / 2}
              y={Math.min(start.y, end.y) - 20 / zoom}
              text={`${Math.round(w)} × ${Math.round(h)}${snapLabel}`}
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
              x={start.x + (end.x - start.x) / 2}
              y={start.y + (end.y - start.y) / 2}
              radiusX={w / 2}
              radiusY={h / 2}
              stroke={brushColor}
              strokeWidth={brushSize}
              fill={fillColor !== 'transparent' ? fillColor : undefined}
              dash={[5, 5]}
              opacity={0.85}
            />
            <Text
              x={start.x + (end.x - start.x) / 2}
              y={start.y + (end.y - start.y) / 2 - h / 2 - 20 / zoom}
              text={`${Math.round(w)} × ${Math.round(h)}${snapLabel}`}
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
      case 'line': {
        const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
        const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI
        return (
          <>
            <Line
              points={[start.x, start.y, end.x, end.y]}
              stroke={brushColor}
              strokeWidth={brushSize}
              dash={[5, 5]}
              opacity={0.85}
            />
            {/* Endpoint dots */}
            <Ellipse x={start.x} y={start.y} radiusX={4 / zoom} radiusY={4 / zoom} fill={brushColor} listening={false} />
            <Ellipse x={end.x} y={end.y} radiusX={4 / zoom} radiusY={4 / zoom} fill={brushColor} listening={false} />
            <Text
              x={(start.x + end.x) / 2}
              y={(start.y + end.y) / 2 - 15 / zoom}
              text={`${Math.round(length)}px @ ${Math.round(angle)}°${snapLabel}`}
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
      default:
        return null
    }
  }

  // Live cursor preview for shape tools (shows outline at cursor before mousedown)
  const renderShapeCursorPreview = () => {
    if (!cursorPos || isDrawing) return null
    if (currentTool !== 'rectangle' && currentTool !== 'ellipse' && currentTool !== 'line') return null

    // Show a small ghost indicator at the cursor
    switch (currentTool) {
      case 'rectangle':
        return (
          <Rect
            x={cursorPos.x - 12 / zoom}
            y={cursorPos.y - 12 / zoom}
            width={24 / zoom}
            height={24 / zoom}
            stroke={brushColor}
            strokeWidth={1.5 / zoom}
            dash={[3 / zoom, 3 / zoom]}
            listening={false}
            opacity={0.5}
          />
        )
      case 'ellipse':
        return (
          <Ellipse
            x={cursorPos.x}
            y={cursorPos.y}
            radiusX={12 / zoom}
            radiusY={12 / zoom}
            stroke={brushColor}
            strokeWidth={1.5 / zoom}
            dash={[3 / zoom, 3 / zoom]}
            listening={false}
            opacity={0.5}
          />
        )
      case 'line':
        return (
          <>
            <Line
              points={[
                cursorPos.x - 12 / zoom, cursorPos.y,
                cursorPos.x + 12 / zoom, cursorPos.y
              ]}
              stroke={brushColor}
              strokeWidth={1.5 / zoom}
              listening={false}
              opacity={0.5}
            />
            <Ellipse
              x={cursorPos.x}
              y={cursorPos.y}
              radiusX={3 / zoom}
              radiusY={3 / zoom}
              fill={brushColor}
              listening={false}
              opacity={0.5}
            />
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full h-full studio-canvas flex items-center justify-center relative">
      {!isCanvasReady && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-[var(--studio-bg)]/80">
          <div className="text-center">
            <div className="text-2xl mb-2">🎨</div>
            <div className="text-sm text-[var(--studio-text-dim)]">Initializing canvas...</div>
            <div className="text-xs text-[var(--studio-text-dim)] mt-1">Size: {stageSize.width}×{stageSize.height}</div>
          </div>
        </div>
      )}
      
      {/* Tool Info Overlay */}
      <div className="absolute top-4 left-4 studio-overlay z-10 text-sm space-y-1">
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
        <div className="absolute top-4 right-4 studio-pill studio-pill--success z-10">
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
        <div className="absolute top-16 right-4 studio-pill studio-pill--info z-10">
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
            {/* Canvas Background — fills entire visible area regardless of zoom */}
            <Rect
              x={-panX / zoom}
              y={-panY / zoom}
              width={stageSize.width / zoom}
              height={stageSize.height / zoom}
              fill={canvasColor}
              listening={false}
            />
            
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
              } else if (shape.type === 'text') {
                return (
                  <Text
                    key={shape.id}
                    x={shape.x}
                    y={shape.y}
                    text={shape.text || ''}
                    fontSize={shape.fontSize || 24}
                    fontFamily={shape.fontFamily || 'Arial'}
                    fontStyle={shape.fontStyle || 'normal'}
                    fill={shape.color}
                    align={shape.align || 'left'}
                    rotation={shape.rotation || 0}
                    scaleX={shape.scaleX || 1}
                    scaleY={shape.scaleY || 1}
                  />
                )
              }
              return null
            })}

            {/* Temp shape preview */}
            {renderTempShape()}

            {/* Shape cursor preview (before mousedown) */}
            {renderShapeCursorPreview()}

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
