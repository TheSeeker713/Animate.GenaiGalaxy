import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Stage, Layer, Circle, Line, Group, Text, Rect, Image as KonvaImage } from 'react-konva'
import { useCharacterStore } from '@/store/characterStore'
import type { CharacterLayer, Bone } from '@/types/character'
import { loadImage } from '@/utils/imageLoader'
import Konva from 'konva'

interface CharacterCanvasProps {
  width: number
  height: number
}

const CharacterCanvas = forwardRef<Konva.Stage, CharacterCanvasProps>(({ width, height }, ref) => {
  const {
    currentCharacter,
    showSkeleton,
    showGrid,
    selectedTool,
    selectedLayerId,
    selectedBoneId,
    setSelectedLayer,
    setSelectedBone,
    updateLayerTransform,
    updateBonePosition
  } = useCharacterStore()
  
  const stageRef = useRef<Konva.Stage>(null)
  
  // Forward ref to parent
  useImperativeHandle(ref, () => stageRef.current as Konva.Stage)
  
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: width / 2, y: height / 2 })
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map())
  const [isDraggingHandle, setIsDraggingHandle] = useState(false)
  const [transformStart, setTransformStart] = useState<{ x: number; y: number; width: number; height: number; rotation: number } | null>(null)
  const [hoveredBoneId, setHoveredBoneId] = useState<string | null>(null)
  
  // Handle zoom with mouse wheel
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    
    const stage = stageRef.current
    if (!stage) return
    
    const oldScale = scale
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    
    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale
    }
    
    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = Math.max(0.1, Math.min(5, oldScale + direction * 0.1))
    
    setScale(newScale)
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale
    })
  }
  
  // Handle pan with middle mouse or spacebar + drag
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setPosition({
      x: e.target.x(),
      y: e.target.y()
    })
  }
  
  // Reset view
  const resetView = () => {
    setScale(1)
    setPosition({ x: width / 2, y: height / 2 })
  }
  
  // Load images for character layers
  useEffect(() => {
    if (!currentCharacter) return
    
    const imageUrls = currentCharacter.layers
      .filter((layer: CharacterLayer) => layer.imageData)
      .map((layer: CharacterLayer) => layer.imageData)
    
    if (imageUrls.length === 0) return
    
    // Load all images
    Promise.all(
      imageUrls.map(url => loadImage(url))
    ).then(results => {
      const newLoadedImages = new Map<string, HTMLImageElement>()
      results.forEach((result, index) => {
        if (result.loaded && result.image) {
          newLoadedImages.set(imageUrls[index], result.image)
        }
      })
      setLoadedImages(newLoadedImages)
    })
  }, [currentCharacter])
  
  // Render grid
  const renderGrid = () => {
    if (!showGrid) return null
    
    const gridSize = 50
    const lines = []
    
    // Vertical lines
    for (let i = 0; i < width / gridSize; i++) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i * gridSize, 0, i * gridSize, height]}
          stroke="#333"
          strokeWidth={1}
          opacity={0.3}
        />
      )
    }
    
    // Horizontal lines
    for (let i = 0; i < height / gridSize; i++) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i * gridSize, width, i * gridSize]}
          stroke="#333"
          strokeWidth={1}
          opacity={0.3}
        />
      )
    }
    
    return lines
  }
  
  // Render character layers
  const renderLayers = () => {
    if (!currentCharacter) return null
    
    return currentCharacter.layers
      .filter((layer: CharacterLayer) => layer.visible)
      .sort((a: CharacterLayer, b: CharacterLayer) => a.zIndex - b.zIndex)
      .map((layer: CharacterLayer) => {
        const image = layer.imageData ? loadedImages.get(layer.imageData) : null
        const hasImage = !!image
        const isSelected = layer.id === selectedLayerId
        
        // Calculate dimensions
        const imgWidth = hasImage ? image.width : 100
        const imgHeight = hasImage ? image.height : 100
        
        return (
          <Group
            key={layer.id}
            x={layer.position.x}
            y={layer.position.y}
            scaleX={layer.scale.x}
            scaleY={layer.scale.y}
            rotation={layer.rotation}
            opacity={layer.opacity}
            draggable={selectedTool === 'select' && isSelected && !isDraggingHandle}
            onClick={() => {
              if (selectedTool === 'select') {
                setSelectedLayer(layer.id)
              }
            }}
            onDragEnd={(e) => {
              if (isSelected) {
                updateLayerTransform(layer.id, {
                  position: { x: e.target.x(), y: e.target.y() }
                })
              }
            }}
          >
            {hasImage ? (
              <>
                <KonvaImage
                  image={image}
                  width={imgWidth}
                  height={imgHeight}
                  offsetX={imgWidth / 2}
                  offsetY={imgHeight / 2}
                />
                {/* Selection border */}
                {isSelected && (
                  <Rect
                    width={imgWidth}
                    height={imgHeight}
                    offsetX={imgWidth / 2}
                    offsetY={imgHeight / 2}
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dash={[10, 5]}
                    shadowColor="#3B82F6"
                    shadowBlur={10}
                    listening={false}
                  />
                )}
                {/* Layer name label */}
                <Text
                  text={layer.name}
                  fontSize={12}
                  fill={isSelected ? "#60A5FA" : "white"}
                  align="center"
                  width={imgWidth}
                  offsetX={imgWidth / 2}
                  offsetY={-imgHeight / 2 - 20}
                  shadowColor="black"
                  shadowBlur={4}
                  shadowOffset={{ x: 0, y: 0 }}
                  shadowOpacity={0.8}
                  fontStyle={isSelected ? "bold" : "normal"}
                  listening={false}
                />
              </>
            ) : (
              // Fallback placeholder
              <>
                <Rect
                  width={100}
                  height={100}
                  fill="#4A5568"
                  stroke={isSelected ? "#3B82F6" : "#718096"}
                  strokeWidth={isSelected ? 3 : 2}
                  cornerRadius={5}
                  offsetX={50}
                  offsetY={50}
                  shadowColor={isSelected ? "#3B82F6" : "transparent"}
                  shadowBlur={isSelected ? 10 : 0}
                />
                {/* Loading indicator or layer name */}
                <Text
                  text={layer.imageData ? '⏳' : layer.name}
                  fontSize={layer.imageData ? 24 : 12}
                  fill="white"
                  align="center"
                  width={100}
                  offsetX={50}
                  offsetY={layer.imageData ? 38 : -60}
                  listening={false}
                />
                {/* Layer name label */}
                <Text
                  text={layer.name}
                  fontSize={10}
                  fill={isSelected ? "#60A5FA" : "#9CA3AF"}
                  align="center"
                  width={100}
                  offsetX={50}
                  offsetY={-60}
                  fontStyle={isSelected ? "bold" : "normal"}
                  listening={false}
                />
              </>
            )}
          </Group>
        )
      })
  }
  
  // Get selected layer bounds for transform handles
  const getSelectedLayerBounds = () => {
    if (!selectedLayerId || !currentCharacter) return null
    
    const layer = currentCharacter.layers.find((l: CharacterLayer) => l.id === selectedLayerId)
    if (!layer) return null
    
    const image = layer.imageData ? loadedImages.get(layer.imageData) : null
    const width = image ? image.width : 100
    const height = image ? image.height : 100
    
    return {
      layer,
      width,
      height,
      x: layer.position.x,
      y: layer.position.y,
      scaleX: layer.scale.x,
      scaleY: layer.scale.y,
      rotation: layer.rotation
    }
  }
  
  // Render transform handles for selected layer
  const renderTransformHandles = () => {
    if (selectedTool !== 'select' || !selectedLayerId) return null
    
    const bounds = getSelectedLayerBounds()
    if (!bounds) return null
    
    const { layer, width, height, x, y, scaleX, scaleY, rotation } = bounds
    const scaledWidth = width * scaleX
    const scaledHeight = height * scaleY
    
    const handleSize = 12 / scale // Scale handle size inversely to zoom
    const rotationHandleOffset = 40 / scale
    
    // Corner handles for resize
    const corners = [
      { x: -scaledWidth / 2, y: -scaledHeight / 2, cursor: 'nwse-resize', type: 'nw' },
      { x: scaledWidth / 2, y: -scaledHeight / 2, cursor: 'nesw-resize', type: 'ne' },
      { x: scaledWidth / 2, y: scaledHeight / 2, cursor: 'nwse-resize', type: 'se' },
      { x: -scaledWidth / 2, y: scaledHeight / 2, cursor: 'nesw-resize', type: 'sw' }
    ]
    
    // Edge handles for resize
    const edges = [
      { x: 0, y: -scaledHeight / 2, cursor: 'ns-resize', type: 'n' },
      { x: scaledWidth / 2, y: 0, cursor: 'ew-resize', type: 'e' },
      { x: 0, y: scaledHeight / 2, cursor: 'ns-resize', type: 's' },
      { x: -scaledWidth / 2, y: 0, cursor: 'ew-resize', type: 'w' }
    ]
    
    return (
      <Group x={x} y={y} rotation={rotation}>
        {/* Corner resize handles */}
        {corners.map((corner) => (
          <Circle
            key={corner.type}
            x={corner.x}
            y={corner.y}
            radius={handleSize}
            fill="white"
            stroke="#3B82F6"
            strokeWidth={2 / scale}
            shadowColor="black"
            shadowBlur={4 / scale}
            shadowOpacity={0.3}
            draggable
            onDragStart={() => {
              setIsDraggingHandle(true)
              setTransformStart({
                x: layer.position.x,
                y: layer.position.y,
                width: scaledWidth,
                height: scaledHeight,
                rotation: layer.rotation
              })
            }}
            onDragMove={(e) => {
              const node = e.target
              const newX = node.x()
              const newY = node.y()
              
              // Calculate new scale based on handle movement
              let newScaleX = scaleX
              let newScaleY = scaleY
              
              if (corner.type === 'nw') {
                newScaleX = (scaledWidth - 2 * newX) / width
                newScaleY = (scaledHeight - 2 * newY) / height
              } else if (corner.type === 'ne') {
                newScaleX = (2 * newX) / width
                newScaleY = (scaledHeight - 2 * newY) / height
              } else if (corner.type === 'se') {
                newScaleX = (2 * newX) / width
                newScaleY = (2 * newY) / height
              } else if (corner.type === 'sw') {
                newScaleX = (scaledWidth - 2 * newX) / width
                newScaleY = (2 * newY) / height
              }
              
              // Maintain minimum scale
              newScaleX = Math.max(0.1, newScaleX)
              newScaleY = Math.max(0.1, newScaleY)
              
              updateLayerTransform(layer.id, {
                scale: { x: newScaleX, y: newScaleY }
              })
            }}
            onDragEnd={() => {
              setIsDraggingHandle(false)
              setTransformStart(null)
            }}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container()
              if (container) container.style.cursor = corner.cursor
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container()
              if (container) container.style.cursor = 'default'
            }}
          />
        ))}
        
        {/* Edge resize handles */}
        {edges.map((edge) => (
          <Rect
            key={edge.type}
            x={edge.x - handleSize / 2}
            y={edge.y - handleSize / 2}
            width={handleSize}
            height={handleSize}
            fill="white"
            stroke="#3B82F6"
            strokeWidth={2 / scale}
            shadowColor="black"
            shadowBlur={4 / scale}
            shadowOpacity={0.3}
            draggable
            onDragStart={() => {
              setIsDraggingHandle(true)
              setTransformStart({
                x: layer.position.x,
                y: layer.position.y,
                width: scaledWidth,
                height: scaledHeight,
                rotation: layer.rotation
              })
            }}
            onDragMove={(e) => {
              const node = e.target
              const newX = node.x() + handleSize / 2
              const newY = node.y() + handleSize / 2
              
              let newScaleX = scaleX
              let newScaleY = scaleY
              
              if (edge.type === 'n') {
                newScaleY = (scaledHeight - 2 * newY) / height
              } else if (edge.type === 'e') {
                newScaleX = (2 * newX) / width
              } else if (edge.type === 's') {
                newScaleY = (2 * newY) / height
              } else if (edge.type === 'w') {
                newScaleX = (scaledWidth - 2 * newX) / width
              }
              
              newScaleX = Math.max(0.1, newScaleX)
              newScaleY = Math.max(0.1, newScaleY)
              
              updateLayerTransform(layer.id, {
                scale: { x: newScaleX, y: newScaleY }
              })
            }}
            onDragEnd={() => {
              setIsDraggingHandle(false)
              setTransformStart(null)
            }}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container()
              if (container) container.style.cursor = edge.cursor
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container()
              if (container) container.style.cursor = 'default'
            }}
          />
        ))}
        
        {/* Rotation handle */}
        <Group>
          <Line
            points={[0, -scaledHeight / 2, 0, -scaledHeight / 2 - rotationHandleOffset]}
            stroke="#3B82F6"
            strokeWidth={2 / scale}
            dash={[5 / scale, 5 / scale]}
          />
          <Circle
            x={0}
            y={-scaledHeight / 2 - rotationHandleOffset}
            radius={handleSize}
            fill="#3B82F6"
            stroke="white"
            strokeWidth={2 / scale}
            shadowColor="black"
            shadowBlur={4 / scale}
            shadowOpacity={0.3}
            draggable
            onDragStart={() => {
              setIsDraggingHandle(true)
              setTransformStart({
                x: layer.position.x,
                y: layer.position.y,
                width: scaledWidth,
                height: scaledHeight,
                rotation: layer.rotation
              })
            }}
            onDragMove={(e) => {
              const node = e.target
              const stage = node.getStage()
              if (!stage) return
              
              const pointerPos = stage.getPointerPosition()
              if (!pointerPos) return
              
              // Calculate angle from layer center to pointer
              const dx = pointerPos.x - (x * scale + position.x)
              const dy = pointerPos.y - (y * scale + position.y)
              const angle = Math.atan2(dy, dx) * 180 / Math.PI
              
              updateLayerTransform(layer.id, {
                rotation: angle + 90 // Offset by 90 to match visual orientation
              })
            }}
            onDragEnd={() => {
              setIsDraggingHandle(false)
              setTransformStart(null)
            }}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container()
              if (container) container.style.cursor = 'grab'
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container()
              if (container) container.style.cursor = 'default'
            }}
          />
        </Group>
      </Group>
    )
  }
  
  // Render skeleton bones
  const renderSkeleton = () => {
    if (!showSkeleton || !currentCharacter) return null
    
    const bones = currentCharacter.skeleton.bones
    const isBoneTool = selectedTool === 'bone'
    
    return (
      <Group>
        {bones.map((bone: Bone) => {
          // Find parent bone for connection line
          const parent = bones.find((b: Bone) => b.id === bone.parentId)
          const isSelected = bone.id === selectedBoneId
          const isHovered = bone.id === hoveredBoneId
          
          return (
            <Group key={bone.id}>
              {/* Connection line to parent */}
              {parent && (
                <Line
                  points={[
                    parent.position.x,
                    parent.position.y,
                    bone.position.x,
                    bone.position.y
                  ]}
                  stroke={isSelected ? "#3B82F6" : "#60A5FA"}
                  strokeWidth={isSelected ? 4 : 3}
                  lineCap="round"
                  opacity={isSelected ? 1 : 0.7}
                  listening={false}
                />
              )}
              
              {/* Bone joint */}
              <Circle
                x={bone.position.x}
                y={bone.position.y}
                radius={isHovered || isSelected ? 10 : 8}
                fill={isSelected ? "#60A5FA" : isHovered ? "#93C5FD" : "#3B82F6"}
                stroke={isSelected ? "#1E3A8A" : "#1E40AF"}
                strokeWidth={isSelected ? 3 : 2}
                shadowColor="black"
                shadowBlur={isHovered || isSelected ? 8 : 5}
                shadowOffset={{ x: 2, y: 2 }}
                shadowOpacity={0.3}
                draggable={isBoneTool}
                onClick={() => {
                  if (isBoneTool) {
                    setSelectedBone(bone.id)
                  }
                }}
                onDragMove={(e) => {
                  if (isBoneTool) {
                    const node = e.target
                    updateBonePosition(bone.id, {
                      x: node.x(),
                      y: node.y()
                    })
                  }
                }}
                onMouseEnter={(e) => {
                  if (isBoneTool) {
                    setHoveredBoneId(bone.id)
                    const container = e.target.getStage()?.container()
                    if (container) container.style.cursor = 'grab'
                  }
                }}
                onMouseLeave={(e) => {
                  setHoveredBoneId(null)
                  const container = e.target.getStage()?.container()
                  if (container) container.style.cursor = 'default'
                }}
              />
              
              {/* Bone name label */}
              <Text
                x={bone.position.x + 12}
                y={bone.position.y - 8}
                text={bone.name}
                fontSize={isSelected ? 11 : 10}
                fill={isSelected ? "#60A5FA" : "#93C5FD"}
                fontStyle={isSelected ? "bold" : "normal"}
                listening={false}
              />
            </Group>
          )
        })}
      </Group>
    )
  }
  
  if (!currentCharacter) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">📋</div>
          <p>No character loaded</p>
          <p className="text-sm mt-2">Select a template to begin</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="relative w-full h-full bg-gray-900">
      {/* Canvas Info Overlay */}
      <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-90 px-4 py-2 rounded-lg text-sm z-10 border border-gray-700">
        <div className="flex gap-4">
          <span className="text-gray-400">Zoom: <span className="text-white font-mono">{(scale * 100).toFixed(0)}%</span></span>
          <span className="text-gray-400">Tool: <span className="text-white">{selectedTool}</span></span>
          <span className="text-gray-400">Layers: <span className="text-white">{currentCharacter.layers.length}</span></span>
          <span className="text-gray-400">Images: <span className="text-white">{loadedImages.size}/{currentCharacter.layers.filter((l: CharacterLayer) => l.imageData).length}</span></span>
        </div>
      </div>
      
      {/* Reset View Button */}
      <button
        onClick={resetView}
        className="absolute top-4 right-4 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-semibold transition border border-gray-700 z-10"
        title="Reset View (Fit to Screen)"
      >
        🔄 Reset View
      </button>
      
      {/* Loading indicator */}
      {currentCharacter.layers.filter((l: CharacterLayer) => l.imageData).length > loadedImages.size && (
        <div className="absolute top-4 right-1/2 transform translate-x-1/2 bg-blue-600 bg-opacity-90 px-4 py-2 rounded-lg text-sm z-10 border border-blue-500 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Loading images... {loadedImages.size}/{currentCharacter.layers.filter((l: CharacterLayer) => l.imageData).length}</span>
        </div>
      )}
      
      {/* Konva Stage */}
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onWheel={handleWheel}
        draggable={selectedTool === 'select' && !selectedLayerId}
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          // Deselect when clicking on empty canvas
          if (e.target === e.target.getStage()) {
            setSelectedLayer(null)
          }
        }}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        className="cursor-move"
      >
        {/* Grid Layer (Background) */}
        <Layer listening={false}>
          {renderGrid()}
        </Layer>
        
        {/* Character Layers */}
        <Layer>
          {renderLayers()}
        </Layer>
        
        {/* Transform Handles Layer */}
        <Layer>
          {renderTransformHandles()}
        </Layer>
        
        {/* Skeleton Layer (Overlay) */}
        <Layer listening={false}>
          {renderSkeleton()}
        </Layer>
        
        {/* Center Point Indicator */}
        <Layer listening={false}>
          <Line
            points={[-20, 0, 20, 0]}
            stroke="#EF4444"
            strokeWidth={2}
            opacity={0.5}
          />
          <Line
            points={[0, -20, 0, 20]}
            stroke="#EF4444"
            strokeWidth={2}
            opacity={0.5}
          />
        </Layer>
      </Stage>
      
      {/* Controls Help */}
      <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-90 px-4 py-2 rounded-lg text-xs text-gray-400 z-10 border border-gray-700">
        <div className="flex flex-col gap-1">
          <span>🖱️ Scroll = Zoom</span>
          <span>🖱️ Drag = Pan (with Select tool)</span>
          <span>⌨️ Space + Drag = Pan (any tool)</span>
        </div>
      </div>
    </div>
  )
})

CharacterCanvas.displayName = 'CharacterCanvas'

export default CharacterCanvas
