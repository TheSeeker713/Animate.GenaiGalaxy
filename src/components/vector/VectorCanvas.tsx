import { useRef, useEffect, useState } from 'react'
import { Stage, Layer, Rect, Ellipse, Line, Star, RegularPolygon, Text } from 'react-konva'
import { useVectorStore } from '../../store/vectorStore'
import type { VectorPath } from '../../types/vector'
import Konva from 'konva'

export default function VectorCanvas() {
  const stageRef = useRef<Konva.Stage>(null)
  const layerRef = useRef<Konva.Layer>(null)
  
  const [stageSize, setStageSize] = useState({ width: 1000, height: 800 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [tempShape, setTempShape] = useState<{ start: { x: number; y: number } } | null>(null)

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
      // TODO: Implement pen tool with bezier curves
      return
    }

    if (['rectangle', 'ellipse', 'polygon', 'star', 'text'].includes(currentTool)) {
      setTempShape({ start: pos })
    }
  }

  const handleMouseMove = () => {
    if (!isDrawing || !tempShape) return
    // Shape preview is handled in render
  }

  const handleMouseUp = () => {
    if (!isDrawing) return

    const pos = getPointerPosition()
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

    switch (currentTool) {
      case 'rectangle':
        return <Rect x={x} y={y} width={width} height={height} {...shapeProps} />
      case 'ellipse':
        return (
          <Ellipse
            x={x + width / 2}
            y={y + height / 2}
            radiusX={width / 2}
            radiusY={height / 2}
            {...shapeProps}
          />
        )
      case 'polygon':
        return (
          <RegularPolygon
            x={x + width / 2}
            y={y + height / 2}
            sides={6}
            radius={Math.min(width, height) / 2}
            {...shapeProps}
          />
        )
      case 'star':
        return (
          <Star
            x={x + width / 2}
            y={y + height / 2}
            numPoints={5}
            outerRadius={Math.min(width, height) / 2}
            innerRadius={Math.min(width, height) / 4}
            {...shapeProps}
          />
        )
      case 'text':
        return (
          <Text
            x={x}
            y={y}
            text="Text"
            fontSize={24}
            fontFamily="Arial"
            {...shapeProps}
          />
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
        default:
          return null
      }
    })
  }

  return (
    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
      {/* Tool Info Overlay */}
      <div className="absolute top-4 left-4 bg-gray-900/80 text-white px-3 py-2 rounded shadow-lg z-10 text-sm">
        <div>Tool: <strong className="capitalize">{currentTool}</strong></div>
        <div>Zoom: <strong>{Math.round(zoom * 100)}%</strong></div>
        <div>Layer: <strong>{currentLayerIndex + 1}</strong></div>
        {selectedPathIds.length > 0 && (
          <div>Selected: <strong>{selectedPathIds.length}</strong></div>
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
          className="cursor-crosshair"
        >
          <Layer ref={layerRef}>
            {/* Grid */}
            {renderGrid()}

            {/* Paths */}
            {renderPaths()}

            {/* Temp shape preview */}
            {renderTempShape()}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
