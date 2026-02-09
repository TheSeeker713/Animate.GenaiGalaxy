import { useState } from 'react'
import { useAnimationStore } from '../../store/useAnimationStore'

export default function Toolbar() {
  const {
    currentTool,
    brushSize,
    brushColor,
    fillColor,
    puppetMode,
    onionSkinEnabled,
    colorPalette,
    setTool,
    setBrushSize,
    setBrushColor,
    setFillColor,
    togglePuppetMode,
    toggleOnionSkin,
    clearCurrentFrame,
    addColorToPalette,
  } = useAnimationStore()

  const [showColorPalette, setShowColorPalette] = useState(false)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Drawing Tools */}
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
        <button
          onClick={() => setTool('select')}
          className={`px-3 py-2 rounded transition ${
            currentTool === 'select'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title="Select (S)"
        >
          ⬚
        </button>
      </div>

      {/* Shape Tools */}
      <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
        <button
          onClick={() => setTool('rectangle')}
          className={`px-3 py-2 rounded transition ${
            currentTool === 'rectangle'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title="Rectangle (R)"
        >
          ▭
        </button>
        <button
          onClick={() => setTool('ellipse')}
          className={`px-3 py-2 rounded transition ${
            currentTool === 'ellipse'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title="Ellipse (C)"
        >
          ⬭
        </button>
        <button
          onClick={() => setTool('line')}
          className={`px-3 py-2 rounded transition ${
            currentTool === 'line'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title="Line (L)"
        >
          ╱
        </button>
      </div>

      {/* Fill and Eyedropper */}
      <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
        <button
          onClick={() => setTool('fill')}
          className={`px-3 py-2 rounded transition ${
            currentTool === 'fill'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title="Fill Tool (F)"
        >
          🪣
        </button>
        <button
          onClick={() => setTool('eyedropper')}
          className={`px-3 py-2 rounded transition ${
            currentTool === 'eyedropper'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title="Eyedropper (I)"
        >
          💉
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
      </div>

      {/* Color Picker with Palette */}
      <div className="flex items-center gap-2 border-r border-gray-300 dark:border-gray-600 pr-2 relative">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={brushColor}
              onChange={(e) => {
                setBrushColor(e.target.value)
                addColorToPalette(e.target.value)
              }}
              className="w-10 h-6 rounded cursor-pointer"
              title="Stroke Color"
            />
            <input
              type="color"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              className="w-10 h-6 rounded cursor-pointer"
              title="Fill Color"
            />
          </div>
          <button
            onClick={() => setShowColorPalette(!showColorPalette)}
            className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Palette ▾
          </button>
        </div>

        {/* Color Palette Dropdown */}
        {showColorPalette && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg p-2 z-10">
            <div className="grid grid-cols-5 gap-1">
              {colorPalette.map((color, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setBrushColor(color)
                    setShowColorPalette(false)
                  }}
                  className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:scale-110 transition"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
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
        title="Toggle Onion Skin (O)"
      >
        👻
      </button>

      {/* Clear Frame */}
      <button
        onClick={() => {
          if (confirm('Clear all drawing on current frame?')) {
            clearCurrentFrame()
          }
        }}
        className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-red-500 hover:text-white rounded transition"
        title="Clear Current Frame"
      >
        🗑️ Clear
      </button>
    </div>
  )
}

