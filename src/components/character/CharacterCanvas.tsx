import { useRef, useState, useEffect } from 'react'
import { Stage, Layer, Circle, Line, Group, Text, Rect, Image as KonvaImage } from 'react-konva'
import { useCharacterStore } from '@/store/characterStore'
import type { CharacterLayer, Bone } from '@/types/character'
import { loadImage } from '@/utils/imageLoader'
import Konva from 'konva'

interface CharacterCanvasProps {
  width: number
  height: number
}

export default function CharacterCanvas({ width, height }: CharacterCanvasProps) {
  const {
    currentCharacter,
    showSkeleton,
    showGrid,
    selectedTool
  } = useCharacterStore()
  
  const stageRef = useRef<Konva.Stage>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: width / 2, y: height / 2 })
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map())
  
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
          >
            {hasImage ? (
              // Render actual image
              <>
                <KonvaImage
                  image={image}
                  width={imgWidth}
                  height={imgHeight}
                  offsetX={imgWidth / 2}
                  offsetY={imgHeight / 2}
                />
                {/* Layer name label */}
                <Text
                  text={layer.name}
                  fontSize={12}
                  fill="white"
                  align="center"
                  width={imgWidth}
                  offsetX={imgWidth / 2}
                  offsetY={-imgHeight / 2 - 20}
                  shadowColor="black"
                  shadowBlur={4}
                  shadowOffset={{ x: 0, y: 0 }}
                  shadowOpacity={0.8}
                />
              </>
            ) : (
              // Fallback placeholder
              <>
                <Rect
                  width={100}
                  height={100}
                  fill="#4A5568"
                  stroke="#718096"
                  strokeWidth={2}
                  cornerRadius={5}
                  offsetX={50}
                  offsetY={50}
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
                />
                <Text
                  text={layer.name}
                  fontSize={10}
                  fill="#9CA3AF"
                  align="center"
                  width={100}
                  offsetX={50}
                  offsetY={-60}
                />
              </>
            )}
          </Group>
        )
      })
  }
  
  // Render skeleton bones
  const renderSkeleton = () => {
    if (!showSkeleton || !currentCharacter) return null
    
    const bones = currentCharacter.skeleton.bones
    
    return (
      <Group>
        {bones.map((bone: Bone) => {
          // Find parent bone for connection line
          const parent = bones.find((b: Bone) => b.id === bone.parentId)
          
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
                  stroke="#60A5FA"
                  strokeWidth={3}
                  lineCap="round"
                  opacity={0.7}
                />
              )}
              
              {/* Bone joint */}
              <Circle
                x={bone.position.x}
                y={bone.position.y}
                radius={8}
                fill="#3B82F6"
                stroke="#1E40AF"
                strokeWidth={2}
                shadowColor="black"
                shadowBlur={5}
                shadowOffset={{ x: 2, y: 2 }}
                shadowOpacity={0.3}
              />
              
              {/* Bone name label */}
              <Text
                x={bone.position.x + 12}
                y={bone.position.y - 8}
                text={bone.name}
                fontSize={10}
                fill="#93C5FD"
                fontStyle="bold"
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
        draggable={selectedTool === 'select'}
        onDragEnd={handleDragEnd}
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
}
