import { useAnimationStore } from '../../store/useAnimationStore'

export default function Toolbar() {
  const {
    currentTool,
    brushSize,
    brushColor,
    puppetMode,
    onionSkinEnabled,
    setTool,
    setBrushSize,
    setBrushColor,
    togglePuppetMode,
    toggleOnionSkin,
    clearCurrentFrame,
  } = useAnimationStore()

  return (
    <div className="flex items-center gap-2">
      {/* Tool Selection */}
      <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
        <button
          onClick={() => setTool('brush')}
          className={`px-3 py-2 rounded transition ${
            currentTool === 'brush'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title="Brush (B)"
        >
          🖌️
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={`px-3 py-2 rounded transition ${
            currentTool === 'eraser'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title="Eraser (E)"
        >
          🧹
        </button>
      </div>

      {/* Brush Settings */}
      <div className="flex items-center gap-2 border-r border-gray-300 dark:border-gray-600 pr-2">
        <label className="text-sm">Size:</label>
        <input
          type="range"
          min="1"
          max="50"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-24"
        />
        <span className="text-sm w-8">{brushSize}</span>
        
        <input
          type="color"
          value={brushColor}
          onChange={(e) => setBrushColor(e.target.value)}
          className="w-10 h-8 rounded cursor-pointer"
          title="Brush Color"
        />
      </div>

      {/* Puppet Mode Toggle */}
      <button
        onClick={togglePuppetMode}
        className={`px-3 py-2 rounded transition ${
          puppetMode
            ? 'bg-green-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
        title="Toggle Puppet Mode (P)"
      >
        🎭 Puppet
      </button>

      {/* Onion Skin Toggle */}
      <button
        onClick={toggleOnionSkin}
        className={`px-3 py-2 rounded transition ${
          onionSkinEnabled
            ? 'bg-purple-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
        title="Toggle Onion Skin"
      >
        👻
      </button>

      {/* Clear Frame */}
      <button
        onClick={clearCurrentFrame}
        className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-red-500 hover:text-white rounded transition"
        title="Clear Current Frame"
      >
        🗑️ Clear
      </button>
    </div>
  )
}
