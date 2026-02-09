import { useVectorStore } from '../../store/vectorStore'

export default function PropertiesPanel() {
  const {
    frames,
    currentFrameIndex,
    currentLayerIndex,
    selectedPathIds,
    updatePath,
    deletePath,
  } = useVectorStore()

  const currentFrame = frames[currentFrameIndex]
  const currentLayer = currentFrame?.layers[currentLayerIndex]
  const paths = currentLayer?.paths || []
  
  const selectedPaths = paths.filter(p => selectedPathIds.includes(p.id))

  if (selectedPaths.length === 0) {
    return (
      <div className="w-64 bg-gray-100 dark:bg-gray-800 border-l border-gray-300 dark:border-gray-700 flex flex-col">
        <div className="p-3 border-b border-gray-300 dark:border-gray-700">
          <h3 className="font-semibold">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm p-4 text-center">
          Select an object to view properties
        </div>
      </div>
    )
  }

  // For multiple selection, show common properties
  const selectedPath = selectedPaths[0]

  const handleUpdate = (updates: any) => {
    selectedPathIds.forEach(pathId => {
      updatePath(currentFrameIndex, currentLayerIndex, pathId, updates)
    })
  }

  const handleDelete = () => {
    if (confirm(`Delete ${selectedPaths.length} object(s)?`)) {
      selectedPathIds.forEach(pathId => {
        deletePath(currentFrameIndex, currentLayerIndex, pathId)
      })
    }
  }

  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 border-l border-gray-300 dark:border-gray-700 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-3 border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Properties</h3>
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 text-sm"
            title="Delete Selected"
          >
            🗑️
          </button>
        </div>
        {selectedPaths.length > 1 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {selectedPaths.length} objects selected
          </div>
        )}
      </div>

      {/* Properties */}
      <div className="p-3 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={selectedPath.name}
            onChange={(e) => handleUpdate({ name: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
          />
        </div>

        {/* Position */}
        <div>
          <label className="block text-sm font-medium mb-1">Position</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">X</label>
              <input
                type="number"
                value={Math.round(selectedPath.x)}
                onChange={(e) => handleUpdate({ x: Number(e.target.value) })}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">Y</label>
              <input
                type="number"
                value={Math.round(selectedPath.y)}
                onChange={(e) => handleUpdate({ y: Number(e.target.value) })}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        {(selectedPath.width !== undefined || selectedPath.height !== undefined) && (
          <div>
            <label className="block text-sm font-medium mb-1">Size</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Width</label>
                <input
                  type="number"
                  value={Math.round(selectedPath.width || 0)}
                  onChange={(e) => handleUpdate({ width: Number(e.target.value) })}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Height</label>
                <input
                  type="number"
                  value={Math.round(selectedPath.height || 0)}
                  onChange={(e) => handleUpdate({ height: Number(e.target.value) })}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Rotation */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Rotation: {Math.round(selectedPath.rotation)}°
          </label>
          <input
            type="range"
            min="-180"
            max="180"
            value={selectedPath.rotation}
            onChange={(e) => handleUpdate({ rotation: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Scale */}
        <div>
          <label className="block text-sm font-medium mb-1">Scale</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">X</label>
              <input
                type="number"
                step="0.1"
                value={selectedPath.scaleX}
                onChange={(e) => handleUpdate({ scaleX: Number(e.target.value) })}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">Y</label>
              <input
                type="number"
                step="0.1"
                value={selectedPath.scaleY}
                onChange={(e) => handleUpdate({ scaleY: Number(e.target.value) })}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Stroke */}
        <div>
          <label className="block text-sm font-medium mb-1">Stroke</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={selectedPath.stroke}
              onChange={(e) => handleUpdate({ stroke: e.target.value })}
              className="w-12 h-8 rounded cursor-pointer"
            />
            <input
              type="number"
              min="0"
              max="50"
              value={selectedPath.strokeWidth}
              onChange={(e) => handleUpdate({ strokeWidth: Number(e.target.value) })}
              className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
              placeholder="Width"
            />
          </div>
        </div>

        {/* Fill */}
        <div>
          <label className="block text-sm font-medium mb-1">Fill</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={selectedPath.fill === 'transparent' ? '#ffffff' : selectedPath.fill}
              onChange={(e) => handleUpdate({ fill: e.target.value })}
              className="w-12 h-8 rounded cursor-pointer"
            />
            <button
              onClick={() => handleUpdate({ fill: 'transparent' })}
              className="flex-1 px-2 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              No Fill
            </button>
          </div>
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Opacity: {Math.round(selectedPath.opacity * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={selectedPath.opacity * 100}
            onChange={(e) => handleUpdate({ opacity: Number(e.target.value) / 100 })}
            className="w-full"
          />
        </div>

        {/* Shape-specific properties */}
        {(selectedPath.type === 'polygon' || selectedPath.type === 'star') && (
          <div>
            <label className="block text-sm font-medium mb-1">
              {selectedPath.type === 'polygon' ? 'Sides' : 'Points'}
            </label>
            <input
              type="number"
              min="3"
              max="20"
              value={selectedPath.sides || 6}
              onChange={(e) => handleUpdate({ sides: Number(e.target.value) })}
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
            />
          </div>
        )}

        {selectedPath.type === 'text' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Text</label>
              <textarea
                value={selectedPath.text || ''}
                onChange={(e) => handleUpdate({ text: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Font Size</label>
              <input
                type="number"
                min="8"
                max="200"
                value={selectedPath.fontSize || 24}
                onChange={(e) => handleUpdate({ fontSize: Number(e.target.value) })}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
              />
            </div>
          </>
        )}

        {/* Visibility */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Visible</label>
          <input
            type="checkbox"
            checked={selectedPath.visible}
            onChange={(e) => handleUpdate({ visible: e.target.checked })}
            className="w-4 h-4"
          />
        </div>
      </div>
    </div>
  )
}
