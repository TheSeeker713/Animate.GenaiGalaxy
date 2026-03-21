import { useRef, useEffect, useState } from 'react'
import { Stage, Layer, Rect, Ellipse, Line, Star, RegularPolygon, Text } from 'react-konva'
import { useVectorStore } from '../../store/vectorStore'
import type { VectorPath, BezierPoint } from '../../types/vector'
import Konva from 'konva'

export default function VectorCanvas() {
  const stageRef = useRef<Konva.Stage>(null)
  const layerRef = useRef<Konva.Layer>(null)
  
  const [stageSize, setStageSize] = useState({ width: 1000, height: 800 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [tempShape, setTempShape] = useState<{ start: { x: number; y: number } } | null>(null)
  const [penPoints, setPenPoints] = useState<{ x: number; y: number }[]>([])
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)

  const {
    currentTool,
    strokeColor,
    fillColor,
    strokeWidth,
    selectedPathIds,
    currentFrameIndex,
    currentLayerIndex,
    frames,
    zoom,
    panX,
    panY,
    showGrid,
    gridSize,
    snapToGrid,
    selectPath,
    clearSelection,
    addPath,
    updatePath,
    setPan,
  } = useVectorStore()

  const currentFrame = frames[currentFrameIndex]
  const currentLayer = currentFrame?.layers[currentLayerIndex]
  const paths = currentLayer?.paths || []

  // Resize canvas
  useEffect(() => {
    const updateSize = () => {
      const container = stageRef.current?.container()
      if (container?.parentElement) {
        setStageSize({
          width: container.parentElement.clientWidth,
          height: container.parentElement.clientHeight,
        })
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
    let x = (pos.x - panX) / zoom
    let y = (pos.y - panY) / zoom

    // Snap to grid if enabled
    if (snapToGrid) {
      x = Math.round(x / gridSize) * gridSize
      y = Math.round(y / gridSize) * gridSize
    }

    return { x, y }
  }

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = getPointerPosition()
    if (!pos) return

    // If clicking on stage background, clear selection
    if (e.target === e.target.getStage()) {
      clearSelection()
    }

    if (currentTool === 'select') {
      // Selection is handled by clicking on shapes
      return
    }

    setIsDrawing(true)

    if (currentTool === 'pen') {
      setPenPoints([pos])
      return
    }

    if (['rectangle', 'ellipse', 'polygon', 'star', 'text'].includes(currentTool)) {
      setTempShape({ start: pos })
    }
  }

  const handleMouseMove = () => {
    const pos = getPointerPosition()
    if (!pos) return
    
    // Update cursor position for preview
    setCursorPos(pos)

    if (currentTool === 'pen' && isDrawing) {
      setPenPoints((prev: { x: number; y: number }[]) => {
        if (prev.length === 0) return [pos]
        const last = prev[prev.length - 1]
        if (Math.hypot(pos.x - last.x, pos.y - last.y) < 1.5) return prev
        return [...prev, pos]
      })
      return
    }
    
    if (!isDrawing || !tempShape) return
    // Shape preview is handled in render
  }

  const handleMouseUp = () => {
    if (!isDrawing) return

    const pos = getPointerPosition()

    if (currentTool === 'pen' && penPoints.length > 0) {
      setIsDrawing(false)
      const pts =
        penPoints.length >= 2
          ? penPoints
          : penPoints.length === 1 && pos
            ? [penPoints[0], pos]
            : []
      setPenPoints([])
      if (pts.length < 2) return

      const xs = pts.map((p) => p.x)
      const ys = pts.map((p) => p.y)
      const minX = Math.min(...xs)
      const minY = Math.min(...ys)
      const maxX = Math.max(...xs)
      const maxY = Math.max(...ys)
      if (maxX - minX < 2 && maxY - minY < 2) return

      const rel: BezierPoint[] = pts.map((p) => ({ x: p.x - minX, y: p.y - minY }))
      const newPath: VectorPath = {
        id: crypto.randomUUID(),
        type: 'path',
        points: rel,
        closed: false,
        fill: 'transparent',
        stroke: strokeColor,
        strokeWidth,
        opacity: 1,
        visible: true,
        name: `Path ${paths.length + 1}`,
        x: minX,
        y: minY,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        width: maxX - minX,
        height: maxY - minY,
      }
      addPath(currentFrameIndex, currentLayerIndex, newPath)
      return
    }

    if (!pos) return

    setIsDrawing(false)

    if (tempShape && currentTool !== 'pen') {
      const start = tempShape.start
      const width = Math.abs(pos.x - start.x)
      const height = Math.abs(pos.y - start.y)

      // Don't create tiny shapes
      if (width < 5 || height < 5) {
        setTempShape(null)
        return
      }

      const newPath: VectorPath = {
        id: crypto.randomUUID(),
        type: currentTool as 'rectangle' | 'ellipse' | 'polygon' | 'star' | 'text',
        points: [],
        closed: true,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth,
        opacity: 1,
        visible: true,
        name: `${currentTool} ${paths.length + 1}`,
        x: Math.min(start.x, pos.x),
        y: Math.min(start.y, pos.y),
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        width,
        height,
      }

      if (currentTool === 'polygon') {
        newPath.sides = 6 // Default hexagon
      } else if (currentTool === 'star') {
        newPath.sides = 5 // Default 5-point star
        newPath.innerRadius = Math.min(width, height) / 4
      } else if (currentTool === 'text') {
        newPath.text = 'Text'
        newPath.fontSize = 24
        newPath.fontFamily = 'Arial'
      }

      addPath(currentFrameIndex, currentLayerIndex, newPath)
      setTempShape(null)
    }
  }

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    
    const stage = stageRef.current
    if (!stage) return

    const oldScale = zoom
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const scaleBy = 1.1
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy

    const mousePointTo = {
      x: (pointer.x - panX) / oldScale,
      y: (pointer.y - panY) / oldScale,
    }

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }

    useVectorStore.setState({ zoom: Math.max(0.1, Math.min(10, newScale)) })
    setPan(newPos.x, newPos.y)
  }

  const handleShapeClick = (pathId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    if (currentTool === 'select') {
      selectPath(pathId, e.evt.shiftKey)
    }
  }

  // Render grid
  const renderGrid = () => {
    if (!showGrid) return null

    const lines = []
    const width = stageSize.width / zoom
    const height = stageSize.height / zoom
    const offsetX = -panX / zoom
    const offsetY = -panY / zoom

    // Vertical lines
    for (let x = 0; x < width; x += gridSize) {
      lines.push(
        <Line
          key={`v${x}`}
          points={[x + offsetX, offsetY, x + offsetX, height + offsetY]}
          stroke="#ddd"
          strokeWidth={1 / zoom}
          opacity={0.3}
          listening={false}
        />
      )
    }

    // Horizontal lines
    for (let y = 0; y < height; y += gridSize) {
      lines.push(
        <Line
          key={`h${y}`}
          points={[offsetX, y + offsetY, width + offsetX, y + offsetY]}
          stroke="#ddd"
          strokeWidth={1 / zoom}
          opacity={0.3}
          listening={false}
        />
      )
    }

    return lines
  }

  // Render temp shape preview
  const renderTempShape = () => {
    if (!tempShape || !isDrawing) return null

    const pos = getPointerPosition()
    if (!pos) return null

    const start = tempShape.start
    const width = Math.abs(pos.x - start.x)
    const height = Math.abs(pos.y - start.y)
    const x = Math.min(start.x, pos.x)
    const y = Math.min(start.y, pos.y)

    const shapeProps = {
      stroke: strokeColor,
      strokeWidth,
      fill: fillColor,
      dash: [5, 5],
      listening: false,
    }

    const dimensionLabel = (
      <Text
        x={x + width / 2}
        y={y - 20 / zoom}
        text={`${Math.round(width)} × ${Math.round(height)}`}
        fontSize={12 / zoom}
        fill="white"
        stroke="black"
        strokeWidth={3 / zoom}
        paintOrder="stroke"
        listening={false}
        offsetX={30}
      />
    )

    switch (currentTool) {
      case 'rectangle':
        return (
          <>
            <Rect x={x} y={y} width={width} height={height} {...shapeProps} />
            {dimensionLabel}
          </>
        )
      case 'ellipse':
        return (
          <>
            <Ellipse
              x={x + width / 2}
              y={y + height / 2}
              radiusX={width / 2}
              radiusY={height / 2}
              {...shapeProps}
            />
            {dimensionLabel}
          </>
        )
      case 'polygon':
        return (
          <>
            <RegularPolygon
              x={x + width / 2}
              y={y + height / 2}
              sides={6}
              radius={Math.min(width, height) / 2}
              {...shapeProps}
            />
            <Text
              x={x + width / 2}
              y={y - 20 / zoom}
              text={`Hexagon: ${Math.round(Math.min(width, height))}px`}
              fontSize={12 / zoom}
              fill="white"
              stroke="black"
              strokeWidth={3 / zoom}
              paintOrder="stroke"
              listening={false}
              offsetX={50}
            />
          </>
        )
      case 'star':
        return (
          <>
            <Star
              x={x + width / 2}
              y={y + height / 2}
              numPoints={5}
              outerRadius={Math.min(width, height) / 2}
              innerRadius={Math.min(width, height) / 4}
              {...shapeProps}
            />
            <Text
              x={x + width / 2}
              y={y - 20 / zoom}
              text={`Star: ${Math.round(Math.min(width, height))}px`}
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
      case 'text':
        return (
          <>
            <Text
              x={x}
              y={y}
              text="Text"
              fontSize={24}
              fontFamily="Arial"
              {...shapeProps}
            />
            <Rect
              x={x - 5}
              y={y - 5}
              width={width + 10}
              height={height + 10}
              stroke={strokeColor}
              strokeWidth={1 / zoom}
              dash={[5 / zoom, 5 / zoom]}
              listening={false}
            />
          </>
        )
    }
  }

  // Render paths
  const renderPaths = () => {
    return paths.map((path) => {
      if (!path.visible) return null

      const isSelected = selectedPathIds.includes(path.id)
      const shapeProps = {
        id: path.id,
        x: path.x,
        y: path.y,
        rotation: path.rotation,
        scaleX: path.scaleX,
        scaleY: path.scaleY,
        stroke: path.stroke,
        strokeWidth: path.strokeWidth,
        fill: path.fill,
        opacity: path.opacity,
        onClick: (e: Konva.KonvaEventObject<MouseEvent>) => handleShapeClick(path.id, e),
        onTap: (e: Konva.KonvaEventObject<TouchEvent>) => handleShapeClick(path.id, e as any),
        draggable: currentTool === 'select' && isSelected,
        onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
          updatePath(currentFrameIndex, currentLayerIndex, path.id, {
            x: e.target.x(),
            y: e.target.y(),
          })
        },
      }

      switch (path.type) {
        case 'rectangle':
          return <Rect key={path.id} width={path.width} height={path.height} {...shapeProps} />
        case 'ellipse':
          return (
            <Ellipse
              key={path.id}
              radiusX={(path.width || 0) / 2}
              radiusY={(path.height || 0) / 2}
              offsetX={-(path.width || 0) / 2}
              offsetY={-(path.height || 0) / 2}
              {...shapeProps}
            />
          )
        case 'polygon':
          return (
            <RegularPolygon
              key={path.id}
              sides={path.sides || 6}
              radius={Math.min(path.width || 0, path.height || 0) / 2}
              {...shapeProps}
            />
          )
        case 'star':
          return (
            <Star
              key={path.id}
              numPoints={path.sides || 5}
              outerRadius={Math.min(path.width || 0, path.height || 0) / 2}
              innerRadius={path.innerRadius || Math.min(path.width || 0, path.height || 0) / 4}
              {...shapeProps}
            />
          )
        case 'text':
          return (
            <Text
              key={path.id}
              text={path.text || 'Text'}
              fontSize={path.fontSize || 24}
              fontFamily={path.fontFamily || 'Arial'}
              {...shapeProps}
            />
          )
        case 'path': {
          const pts = path.points
          if (!pts?.length) return null
          const flat = pts.flatMap((p) => [path.x + p.x, path.y + p.y])
          return (
            <Line
              key={path.id}
              points={flat}
              stroke={path.stroke}
              strokeWidth={path.strokeWidth}
              lineCap="round"
              lineJoin="round"
              opacity={path.opacity}
              onClick={(e) => handleShapeClick(path.id, e)}
              onTap={(e) =>
                handleShapeClick(path.id, e as unknown as Konva.KonvaEventObject<MouseEvent>)
              }
              listening
            />
          )
        }
        default:
          return null
      }
    })
  }

  return (
    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
      {/* Tool Info Overlay */}
      <div className="absolute top-4 left-4 bg-gray-900/80 text-white px-3 py-2 rounded shadow-lg z-10 text-sm space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Tool:</span>
          <strong className="capitalize flex items-center gap-1">
            {currentTool === 'select' && '↖'}
            {currentTool === 'pen' && '✏️'}
            {currentTool === 'rectangle' && '▢'}
            {currentTool === 'ellipse' && '○'}
            {currentTool === 'polygon' && '⬡'}
            {currentTool === 'star' && '⭐'}
            {currentTool === 'text' && '𝐓'}
            {currentTool}
          </strong>
        </div>
        {currentTool !== 'select' && currentTool !== 'text' && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Stroke:</span>
            <strong>{strokeWidth}px</strong>
            <div 
              className="w-4 h-4 rounded-full border-2" 
              style={{ 
                borderColor: strokeColor,
                transform: `scale(${Math.min(strokeWidth / 10, 1)})`
              }}
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Stroke:</span>
          <div 
            className="w-6 h-4 rounded border border-gray-600" 
            style={{ backgroundColor: strokeColor }}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Fill:</span>
          <div 
            className="w-6 h-4 rounded border border-gray-600" 
            style={{ backgroundColor: fillColor }}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Zoom:</span>
          <strong>{Math.round(zoom * 100)}%</strong>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Layer:</span>
          <strong>{currentLayerIndex + 1}</strong>
        </div>
        {selectedPathIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Selected:</span>
            <strong>{selectedPathIds.length}</strong>
          </div>
        )}
        {snapToGrid && (
          <div className="text-green-400 text-xs">📍 Snap to Grid</div>
        )}
      </div>

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
          onWheel={handleWheel}
          className={currentTool !== 'select' ? 'cursor-none' : 'cursor-default'}
        >
          <Layer ref={layerRef}>
            {/* Grid */}
            {renderGrid()}

            {/* Paths */}
            {renderPaths()}

            {/* Temp shape preview */}
            {renderTempShape()}

            {penPoints.length >= 2 && currentTool === 'pen' && (
              <Line
                points={penPoints.flatMap((p) => [p.x, p.y])}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                lineCap="round"
                lineJoin="round"
                listening={false}
                dash={[6 / zoom, 4 / zoom]}
              />
            )}

            {/* Cursor preview for drawing tools */}
            {cursorPos && !isDrawing && currentTool !== 'select' && (
              <>
                {/* Stroke width circle indicator */}
                <Ellipse
                  x={cursorPos.x}
                  y={cursorPos.y}
                  radiusX={strokeWidth / 2}
                  radiusY={strokeWidth / 2}
                  stroke={strokeColor}
                  strokeWidth={1 / zoom}
                  listening={false}
                  opacity={0.6}
                />
                {/* Center crosshair */}
                <Line
                  points={[
                    cursorPos.x - 8 / zoom,
                    cursorPos.y,
                    cursorPos.x + 8 / zoom,
                    cursorPos.y
                  ]}
                  stroke={strokeColor}
                  strokeWidth={1 / zoom}
                  listening={false}
                  opacity={0.8}
                />
                <Line
                  points={[
                    cursorPos.x,
                    cursorPos.y - 8 / zoom,
                    cursorPos.x,
                    cursorPos.y + 8 / zoom
                  ]}
                  stroke={strokeColor}
                  strokeWidth={1 / zoom}
                  listening={false}
                  opacity={0.8}
                />
                {/* Snap-to-grid indicator */}
                {snapToGrid && (
                  <Rect
                    x={cursorPos.x - 3 / zoom}
                    y={cursorPos.y - 3 / zoom}
                    width={6 / zoom}
                    height={6 / zoom}
                    fill={strokeColor}
                    listening={false}
                    opacity={0.4}
                  />
                )}
              </>
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
