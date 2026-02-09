import { useState } from 'react'
import { useVectorStore } from '../../store/vectorStore'

export default function VectorToolbar() {
  const {
    currentTool,
    strokeColor,
    fillColor,
    strokeWidth,
    colorPalette,
    showGrid,
    snapToGrid,
    setTool,
    setStrokeColor,
    setFillColor,
    setStrokeWidth,
    toggleGrid,
    toggleSnapToGrid,
    addColorToPalette,
  } = useVectorStore()

  const [showColorPalette, setShowColorPalette] = useState(false)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Selection & Drawing Tools */}
      <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
        <button
          onClick={() => setTool('select')}
          className={`px-3 py-2 rounded transition ${
            currentTool === 'select'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title="Select Tool (V)"
        >
          ➤
        </button>
        <button
          onClick={() => setTool('pen')}
          className={`px-3 py-2 rounded transition ${
            currentTool === 'pen'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title="Pen Tool (P)"
        >
          🖊️
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
          title="Rectangle Tool (R)"
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
          title="Ellipse Tool (C)"
        >
          ⬭
        </button>
        <button
          onClick={() => setTool('polygon')}
          className={`px-3 py-2 rounded transition ${
            currentTool === 'polygon'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title="Polygon Tool (G)"
        >
          ⬡
        </button>
        <button
          onClick={() => setTool('star')}
          className={`px-3 py-2 rounded transition ${
            currentTool === 'star'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title="Star Tool (S)"
        >
          ⭐
        </button>
        <button
          onClick={() => setTool('text')}
          className={`px-3 py-2 rounded transition ${
            currentTool === 'text'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title="Text Tool (T)"
        >
          T
        </button>
      </div>

      {/* Eyedropper */}
      <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
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

      {/* Stroke Width */}
      <div className="flex items-center gap-2 border-r border-gray-300 dark:border-gray-600 pr-2">
        <label className="text-sm">Width:</label>
        <input
          type="range"
          min="0"
          max="20"
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className="w-24"
        />
        <span className="text-sm w-8">{strokeWidth}</span>
      </div>

      {/* Color Picker with Palette */}
      <div className="flex items-center gap-2 border-r border-gray-300 dark:border-gray-600 pr-2 relative">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <div className="text-xs text-gray-600 dark:text-gray-400">Stroke:</div>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => {
                setStrokeColor(e.target.value)
                addColorToPalette(e.target.value)
              }}
              className="w-10 h-6 rounded cursor-pointer"
              title="Stroke Color"
            />
            <div className="text-xs text-gray-600 dark:text-gray-400">Fill:</div>
            <input
              type="color"
              value={fillColor === 'transparent' ? '#ffffff' : fillColor}
              onChange={(e) => {
                setFillColor(e.target.value)
                addColorToPalette(e.target.value)
              }}
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
                    setStrokeColor(color)
                    setShowColorPalette(false)
                  }}
                  className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:scale-110 transition"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setFillColor('transparent')}
                className="w-full text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                No Fill
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grid Controls */}
      <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
        <button
          onClick={toggleGrid}
          className={`px-3 py-2 rounded transition text-sm ${
            showGrid
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title="Toggle Grid"
        >
          #️⃣
        </button>
        <button
          onClick={toggleSnapToGrid}
          className={`px-3 py-2 rounded transition text-sm ${
            snapToGrid
              ? 'bg-purple-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title="Snap to Grid"
        >
          🧲
        </button>
      </div>
    </div>
  )
}
