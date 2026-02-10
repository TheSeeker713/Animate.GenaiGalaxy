import { useState, memo } from 'react'
import { useAnimationStore } from '../../store/useAnimationStore'

function Toolbar() {
  const {
    currentTool,
    brushSize,
    brushColor,
    fillColor,
    textSize,
    textFont,
    puppetMode,
    onionSkinEnabled,
    colorPalette,
    setTool,
    setBrushSize,
    setBrushColor,
    setFillColor,
    setTextSize,
    setTextFont,
    togglePuppetMode,
    toggleOnionSkin,
    clearCurrentFrame,
    addColorToPalette,
  } = useAnimationStore()

  const [showColorPalette, setShowColorPalette] = useState(false)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)

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
        <button
          onClick={() => setTool('transform')}
          className={`px-3 py-2 rounded transition ${
            currentTool === 'transform'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title="Transform (V)"
        >
          ⤢
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

      {/* Text Formatting (shown when text tool is active) */}
      {currentTool === 'text' && (
        <div className="flex items-center gap-2 border-l border-gray-300 dark:border-gray-600 pl-2">
          <label className="text-sm">Font:</label>
          <select
            value={textFont}
            onChange={(e) => setTextFont(e.target.value)}
            className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Comic Sans MS">Comic Sans MS</option>
            <option value="Impact">Impact</option>
          </select>
          <label className="text-sm">Size:</label>
          <input
            type="number"
            min="8"
            max="200"
            value={textSize}
            onChange={(e) => setTextSize(Number(e.target.value))}
            className="w-16 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
          />
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <button
        onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
        className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition ml-auto"
        title="Keyboard Shortcuts (H)"
      >
        ⌨️
      </button>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowShortcutsHelp(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
              <button onClick={() => setShowShortcutsHelp(false)} className="text-2xl hover:text-red-500">×</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold mb-2 text-blue-500">Drawing Tools</h3>
                <div className="space-y-1 text-sm">
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">B</kbd> Brush</div>
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">E</kbd> Eraser</div>
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">S</kbd> Select</div>
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">V</kbd> Transform</div>
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">R</kbd> Rectangle</div>
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">C</kbd> Circle</div>
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">L</kbd> Line</div>
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">T</kbd> Text</div>
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">F</kbd> Fill</div>
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">I</kbd> Eyedropper</div>
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-2 text-green-500">Playback & Animation</h3>
                <div className="space-y-1 text-sm">
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Space</kbd> Play/Pause</div>
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">←</kbd> Previous Frame</div>
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">→</kbd> Next Frame</div>
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">P</kbd> Toggle Puppet Mode</div>
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">O</kbd> Toggle Onion Skin</div>
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-2 text-purple-500">View Controls</h3>
                <div className="space-y-1 text-sm">
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl/Cmd</kbd> + <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">+</kbd> Zoom In</div>
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl/Cmd</kbd> + <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">-</kbd> Zoom Out</div>
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl/Cmd</kbd> + <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">0</kbd> Reset Zoom</div>
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-2 text-orange-500">Edit Commands</h3>
                <div className="space-y-1 text-sm">
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl/Cmd</kbd> + <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Z</kbd> Undo</div>
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl/Cmd</kbd> + <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Shift</kbd> + <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Z</kbd> Redo</div>
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl/Cmd</kbd> + <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Y</kbd> Redo</div>
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl/Cmd</kbd> + <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">D</kbd> Duplicate Frame</div>
                  <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl/Cmd</kbd> + <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">E</kbd> Export</div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">H</kbd> or <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">?</kbd> to toggle this help panel
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(Toolbar)

