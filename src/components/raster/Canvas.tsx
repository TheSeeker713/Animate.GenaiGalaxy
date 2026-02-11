import { useRef, useEffect, useState, useCallback } from 'react'
import { Stage, Layer, Line, Rect, Ellipse, Image, Text, Group } from 'react-konva'
import { useAnimationStore } from '../../store/useAnimationStore'
import type { LineData, ShapeData, Layer as RasterLayer } from '../../types'
import Konva from 'konva'

export default function Canvas() {
  const stageRef = useRef<Konva.Stage>(null)
  const layerRef = useRef<Konva.Layer>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
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
  const [layerImages, setLayerImages] = useState<Record<string, HTMLImageElement>>({})
  const hasAutoFitRef = useRef(false)

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
    documentWidth,
    documentHeight,
    puppetMode,
    onionSkinEnabled,
    currentFrameIndex,
    currentLayerIndex,
    frames,
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

  // Load layer imageData as HTMLImageElements for rendering
  useEffect(() => {
    if (!currentFrame) return
    const newImages: Record<string, HTMLImageElement> = {}
    let pending = 0
    let cancelled = false
    currentFrame.layers.forEach((layer) => {
      if (layer.imageData) {
        pending++
        const img = new window.Image()
        img.onload = () => {
          if (cancelled) return
          newImages[layer.id] = img
          pending--
          if (pending === 0) setLayerImages({ ...newImages })
        }
        img.onerror = () => {
          pending--
          if (pending === 0 && !cancelled) setLayerImages({ ...newImages })
        }
        img.src = layer.imageData
      }
    })
    if (pending === 0) setLayerImages({})
    return () => { cancelled = true }
  }, [currentFrame])

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
    const el = containerRef.current
    if (!el) return

    const updateSize = () => {
      const rect = el.getBoundingClientRect()
      const width = Math.floor(rect.width)
      const height = Math.floor(rect.height)
      if (width > 0 && height > 0) {
        setStageSize({ width, height })
        setIsCanvasReady(true)
      }
    }

    // Measure after layout
    updateSize()
    const t1 = requestAnimationFrame(updateSize)
    const t2 = setTimeout(updateSize, 100)

    const ro = new ResizeObserver(updateSize)
    ro.observe(el)

    return () => {
      cancelAnimationFrame(t1)
      clearTimeout(t2)
      ro.disconnect()
    }
  }, [])

  // Auto-fit artboard on first ready
  useEffect(() => {
    if (!isCanvasReady) return
    if (hasAutoFitRef.current) return
    if (documentWidth <= 0 || documentHeight <= 0) return
    if (stageSize.width <= 0 || stageSize.height <= 0) return

    const scaleX = stageSize.width / documentWidth
    const scaleY = stageSize.height / documentHeight
    const fitScale = Math.max(0.05, Math.min(5, Math.min(scaleX, scaleY) * 0.85))
    const offsetX = (stageSize.width - documentWidth * fitScale) / 2
    const offsetY = (stageSize.height - documentHeight * fitScale) / 2

    setZoom(fitScale)
    setPan(offsetX, offsetY)
    hasAutoFitRef.current = true
  }, [isCanvasReady, documentWidth, documentHeight, stageSize.width, stageSize.height, setZoom, setPan])

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

  // Flood fill helper — operates on an offscreen canvas at document dimensions
  const floodFill = (docX: number, docY: number, color: string) => {
    const fillRgb = hexToRgb(color)
    if (!fillRgb) return

    const w = documentWidth
    const h = documentHeight
    if (w <= 0 || h <= 0) return

    // Create an offscreen canvas at document dimensions
    const offscreen = document.createElement('canvas')
    offscreen.width = w
    offscreen.height = h
    const ctx = offscreen.getContext('2d')!

    // If the layer already has raster data, draw it first
    const drawExisting = (): Promise<void> => {
      const existingData = currentLayer?.imageData
      if (!existingData) return Promise.resolve()
      return new Promise((resolve) => {
        const img = new window.Image()
        img.onload = () => { ctx.drawImage(img, 0, 0, w, h); resolve() }
        img.onerror = () => resolve()
        img.src = existingData
      })
    }

    drawExisting().then(() => {
      // Also render vector lines/shapes onto the offscreen canvas for accurate target-color sampling
      const tempStage = new Konva.Stage({ container: document.createElement('div'), width: w, height: h })
      const tempLayer = new Konva.Layer()
      tempStage.add(tempLayer)
      // Draw current layer lines
      lines.forEach(line => {
        const kLine = new Konva.Line({
          points: line.points,
          stroke: line.color,
          strokeWidth: line.size,
          tension: 0.5,
          lineCap: 'round',
          lineJoin: 'round',
          globalCompositeOperation: line.tool === 'eraser' ? 'destination-out' : 'source-over',
        })
        tempLayer.add(kLine)
      })
      tempLayer.draw()
      const vecCanvas = tempStage.toCanvas({ pixelRatio: 1 })
      ctx.drawImage(vecCanvas, 0, 0)
      tempStage.destroy()

      // Now do the flood fill on the offscreen canvas
      const imageData = ctx.getImageData(0, 0, w, h)
      const pixels = imageData.data
      const px0 = Math.floor(docX)
      const py0 = Math.floor(docY)
      if (px0 < 0 || px0 >= w || py0 < 0 || py0 >= h) return

      const startIdx = (py0 * w + px0) * 4
      const tR = pixels[startIdx], tG = pixels[startIdx + 1], tB = pixels[startIdx + 2], tA = pixels[startIdx + 3]

      // Same-color check
      if (tR === fillRgb.r && tG === fillRgb.g && tB === fillRgb.b && tA === 255) return

      const match = (i: number) =>
        pixels[i] === tR && pixels[i + 1] === tG && pixels[i + 2] === tB && pixels[i + 3] === tA

      // Scanline fill — much faster than per-pixel stack
      const stack: [number, number][] = [[px0, py0]]
      const visited = new Uint8Array(w * h)

      while (stack.length > 0) {
        // eslint-disable-next-line prefer-const
        let [sx, sy] = stack.pop()!
        if (sy < 0 || sy >= h) continue

        // Walk left
        let left = sx
        while (left > 0 && match(((sy) * w + (left - 1)) * 4)) left--
        // Walk right
        let right = sx
        while (right < w - 1 && match(((sy) * w + (right + 1)) * 4)) right++

        // Fill the span and check rows above/below
        let prevAbove = false, prevBelow = false
        for (let cx = left; cx <= right; cx++) {
          const idx = (sy * w + cx) * 4
          if (!match(idx) && visited[sy * w + cx]) continue
          pixels[idx] = fillRgb.r
          pixels[idx + 1] = fillRgb.g
          pixels[idx + 2] = fillRgb.b
          pixels[idx + 3] = 255
          visited[sy * w + cx] = 1

          // Check above
          if (sy > 0) {
            const aboveIdx = ((sy - 1) * w + cx) * 4
            const aboveMatch = match(aboveIdx) && !visited[(sy - 1) * w + cx]
            if (aboveMatch && !prevAbove) stack.push([cx, sy - 1])
            prevAbove = aboveMatch
          }
          // Check below
          if (sy < h - 1) {
            const belowIdx = ((sy + 1) * w + cx) * 4
            const belowMatch = match(belowIdx) && !visited[(sy + 1) * w + cx]
            if (belowMatch && !prevBelow) stack.push([cx, sy + 1])
            prevBelow = belowMatch
          }
        }
      }

      ctx.putImageData(imageData, 0, 0)
      const dataUrl = offscreen.toDataURL()
      saveFrameDrawing(currentFrameIndex, currentLayerIndex, lines, shapes, dataUrl)
      pushHistory()
    })
  }

  const handleMouseDown = (_e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
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

  const handleMouseMove = (_e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
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

  const handleMouseUp = (_e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
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

  const resolveLayerComposite = (blendMode?: RasterLayer['blendMode']) => {
    switch (blendMode) {
      case 'multiply':
        return 'multiply'
      case 'screen':
        return 'screen'
      case 'overlay':
        return 'overlay'
      case 'darken':
        return 'darken'
      case 'lighten':
        return 'lighten'
      default:
        return 'source-over'
    }
  }

  const renderLayerLines = (layerLines: LineData[]) => (
    layerLines.map((line, i) => (
      <Line
        key={`${line.tool}-${i}`}
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
    ))
  )

  const renderLayerShapes = (layerShapes: ShapeData[]) => (
    layerShapes.map((shape) => {
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
    })
  )

  const renderRasterLayers = () => {
    if (!currentFrame) return null

    return currentFrame.layers.map((layer, layerIndex) => {
      if (!layer.visible) return null
      const layerLines = layerIndex === currentLayerIndex ? lines : (layer.lines || [])
      const layerShapes = layerIndex === currentLayerIndex ? shapes : (layer.shapes || [])

      const layerImg = layerImages[layer.id] || null

      return (
        <Group
          key={layer.id}
          opacity={layer.opacity}
          globalCompositeOperation={resolveLayerComposite(layer.blendMode)}
        >
          {/* Render rasterised content (from fill, imports, etc.) */}
          {layerImg && (
            <Image
              image={layerImg}
              x={0}
              y={0}
              width={documentWidth}
              height={documentHeight}
              listening={false}
            />
          )}
          {renderLayerLines(layerLines)}
          {renderLayerShapes(layerShapes)}
        </Group>
      )
    })
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#1a1a2e',
      }}
    >
      {/* Tool Info Overlay */}
      <div
        style={{ position: 'absolute', top: 16, left: 16, zIndex: 20 }}
        className="studio-overlay text-sm space-y-1"
      >
        <div>Tool: <strong className="capitalize">{currentTool}</strong></div>
        {(currentTool === 'brush' || currentTool === 'eraser') && (
          <div className="flex items-center gap-2">
            Size: <strong>{brushSize}px</strong>
            <div
              className="w-4 h-4 rounded-full border-2"
              style={{
                borderColor: currentTool === 'eraser' ? '#EF4444' : brushColor,
              }}
            />
          </div>
        )}
        {currentTool === 'brush' && (
          <div className="flex items-center gap-2">
            Color:
            <div
              className="w-6 h-4 rounded border border-gray-600"
              style={{ backgroundColor: brushColor }}
            />
          </div>
        )}
        <div>Zoom: <strong>{Math.round(zoom * 100)}%</strong></div>
        <div>Layer: <strong>{currentLayerIndex + 1}</strong></div>
        <div style={{ opacity: 0.5, fontSize: 10 }}>
          Doc: {documentWidth}&times;{documentHeight} &middot; Stage: {stageSize.width}&times;{stageSize.height}
        </div>
      </div>

      {/* Puppet mode indicator */}
      {puppetMode && (
        <div
          style={{ position: 'absolute', top: 16, right: 16, zIndex: 20 }}
          className="studio-pill studio-pill--success"
        >
          Puppet Mode Active
        </div>
      )}

      {/* Onion skin indicator */}
      {onionSkinEnabled && currentFrameIndex > 0 && (
        <div
          style={{ position: 'absolute', top: 64, right: 16, zIndex: 20 }}
          className="studio-pill studio-pill--info"
        >
          Onion Skin
        </div>
      )}

      {/* Konva Stage */}
      {isCanvasReady && stageSize.width > 0 && stageSize.height > 0 ? (
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
        >
          <Layer ref={layerRef}>
            {/* Artboard background */}
            <Rect
              x={0}
              y={0}
              width={documentWidth}
              height={documentHeight}
              fill={canvasColor === 'transparent' ? '#ffffff' : canvasColor}
              shadowColor="rgba(0,0,0,0.5)"
              shadowBlur={20 / zoom}
              shadowOffsetX={0}
              shadowOffsetY={4 / zoom}
              listening={false}
            />
            {/* Artboard border */}
            <Rect
              x={0}
              y={0}
              width={documentWidth}
              height={documentHeight}
              stroke="rgba(148, 163, 184, 0.5)"
              strokeWidth={1 / zoom}
              listening={false}
            />

            {/* Onion skin - previous frame */}
            {onionSkinEnabled && onionSkinImage && (
              <Image
                image={onionSkinImage}
                x={0}
                y={0}
                width={documentWidth}
                height={documentHeight}
                opacity={0.3}
              />
            )}

            {/* Raster layers */}
            {renderRasterLayers()}

            {/* Temp shape preview */}
            {renderTempShape()}

            {/* Shape cursor preview */}
            {renderShapeCursorPreview()}

            {/* Brush cursor preview */}
            {cursorPos &&
              !isDrawing &&
              (currentTool === 'brush' || currentTool === 'eraser') && (
                <>
                  <Ellipse
                    x={cursorPos.x}
                    y={cursorPos.y}
                    radiusX={brushSize / 2}
                    radiusY={brushSize / 2}
                    stroke={currentTool === 'eraser' ? '#EF4444' : brushColor}
                    strokeWidth={2 / zoom}
                    dash={
                      currentTool === 'eraser'
                        ? [5 / zoom, 5 / zoom]
                        : undefined
                    }
                    listening={false}
                    opacity={0.6}
                  />
                  <Line
                    points={[
                      cursorPos.x - 10 / zoom,
                      cursorPos.y,
                      cursorPos.x + 10 / zoom,
                      cursorPos.y,
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
                      cursorPos.y + 10 / zoom,
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
            {/* Selection rectangle preview */}
            {tempSelection && currentTool === 'select' && (
              <Rect
                x={
                  tempSelection.width < 0
                    ? tempSelection.x + tempSelection.width
                    : tempSelection.x
                }
                y={
                  tempSelection.height < 0
                    ? tempSelection.y + tempSelection.height
                    : tempSelection.y
                }
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
                <Image
                  image={selectionImage}
                  x={selection.x}
                  y={selection.y}
                  width={selection.width}
                  height={selection.height}
                  draggable
                />
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
            )}
          </Layer>
        </Stage>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#94a3b8',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>Loading canvas...</div>
          </div>
        </div>
      )}
    </div>
  )
}
