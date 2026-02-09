import { useAnimationStore } from '../../store/useAnimationStore'

export default function LayersPanel() {
  const {
    frames,
    currentFrameIndex,
    currentLayerIndex,
    setCurrentLayer,
    addLayer,
    deleteLayer,
    updateLayer,
  } = useAnimationStore()

  const currentFrame = frames[currentFrameIndex]
  if (!currentFrame) return null

  const layers = currentFrame.layers

  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 border-l border-gray-300 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Layers</h3>
          <button
            onClick={() => addLayer(currentFrameIndex)}
            className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
            title="Add Layer"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {[...layers].reverse().map((layer, reverseIndex) => {
          const actualIndex = layers.length - 1 - reverseIndex
          const isActive = actualIndex === currentLayerIndex

          return (
            <div
              key={layer.id}
              onClick={() => setCurrentLayer(actualIndex)}
              className={`p-2 rounded cursor-pointer transition ${
                isActive
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              {/* Layer Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{layer.name}</span>
                <div className="flex items-center gap-1">
                  {/* Visibility Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      updateLayer(currentFrameIndex, layer.id, {
                        visible: !layer.visible,
                      })
                    }}
                    className={`text-xs px-1 ${
                      isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                    }`}
                    title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                  >
                    {layer.visible ? '👁️' : '🚫'}
                  </button>
                  
                  {/* Delete Button */}
                  {layers.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteLayer(currentFrameIndex, layer.id)
                      }}
                      className={`text-xs px-1 ${
                        isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                      } hover:text-red-500`}
                      title="Delete Layer"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              {/* Opacity Slider */}
              <div className="flex items-center gap-2">
                <label className="text-xs">Opacity:</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={layer.opacity * 100}
                  onChange={(e) => {
                    e.stopPropagation()
                    updateLayer(currentFrameIndex, layer.id, {
                      opacity: Number(e.target.value) / 100,
                    })
                  }}
                  className="flex-1"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-xs w-8">
                  {Math.round(layer.opacity * 100)}%
                </span>
              </div>

              {/* Layer Thumbnail Preview */}
              {layer.imageData && (
                <div className="mt-2 border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
                  <img
                    src={layer.imageData}
                    alt={layer.name}
                    className="w-full h-12 object-cover"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Layer Info */}
      <div className="p-2 border-t border-gray-300 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
        {layers.length} / 10 layers
      </div>
    </div>
  )
}
