import { useState, memo } from 'react'
import { useAnimationStore } from '../../store/useAnimationStore'
import CanvasColorPicker from './CanvasColorPicker'
import { 
  Paintbrush, Eraser, MousePointer, Move, Square, Circle, Minus, 
  Type, Droplet, Pipette, Eye, EyeOff, Trash2, Keyboard 
} from 'lucide-react'

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

  const getToolButtonClass = (isActive: boolean) =>
    `tool-button ${isActive ? 'tool-button--active' : ''}`

  return (
    <div className="studio-toolbar flex items-center gap-2 flex-wrap">
      {/* Drawing Tools */}
      <div className="tool-group">
        <button
          onClick={() => setTool('brush')}
          className={getToolButtonClass(currentTool === 'brush')}
          title="Brush (B)"
        >
          <Paintbrush size={18} />
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={getToolButtonClass(currentTool === 'eraser')}
          title="Eraser (E)"
        >
          <Eraser size={18} />
        </button>
        <button
          onClick={() => setTool('select')}
          className={getToolButtonClass(currentTool === 'select')}
          title="Select (S)"
        >
          <MousePointer size={18} />
        </button>
        <button
          onClick={() => setTool('transform')}
          className={getToolButtonClass(currentTool === 'transform')}
          title="Transform (V)"
        >
          <Move size={18} />
        </button>
      </div>

      {/* Shape Tools */}
      <div className="tool-group">
        <button
          onClick={() => setTool('rectangle')}
          className={getToolButtonClass(currentTool === 'rectangle')}
          title="Rectangle (R)"
        >
          <Square size={18} />
        </button>
        <button
          onClick={() => setTool('ellipse')}
          className={getToolButtonClass(currentTool === 'ellipse')}
          title="Ellipse (C)"
        >
          <Circle size={18} />
        </button>
        <button
          onClick={() => setTool('line')}
          className={getToolButtonClass(currentTool === 'line')}
          title="Line (L)"
        >
          <Minus size={18} />
        </button>
        <button
          onClick={() => setTool('text')}
          className={getToolButtonClass(currentTool === 'text')}
          title="Text Tool (T)"
        >
          <Type size={18} />
        </button>
      </div>

      {/* Fill and Eyedropper */}
      <div className="tool-group">
        <button
          onClick={() => setTool('fill')}
          className={getToolButtonClass(currentTool === 'fill')}
          title="Fill Tool (F)"
        >
          <Droplet size={18} />
        </button>
        <button
          onClick={() => setTool('eyedropper')}
          className={getToolButtonClass(currentTool === 'eyedropper')}
          title="Eyedropper (I)"
        >
          <Pipette size={18} />
        </button>
      </div>

      {/* Brush Settings */}
      <div className="tool-group items-center">
        <label className="text-xs uppercase tracking-wide text-slate-400">Size</label>
        <input
          type="range"
          min="1"
          max="50"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="studio-slider w-24"
        />
        <span className="text-sm w-8 text-slate-200">{brushSize}</span>
      </div>

      {/* Color Picker with Palette */}
      <div className="tool-group items-center relative">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={brushColor}
              onChange={(e) => {
                setBrushColor(e.target.value)
                addColorToPalette(e.target.value)
              }}
              className="w-10 h-6 rounded cursor-pointer studio-swatch"
              title="Stroke Color"
            />
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={fillColor === 'transparent' ? '#ffffff' : fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="w-10 h-6 rounded cursor-pointer studio-swatch"
                title="Fill Color (click 'No fill' to clear)"
              />
              <button
                onClick={() => setFillColor(fillColor === 'transparent' ? '#ffffff' : 'transparent')}
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  background: fillColor === 'transparent' ? 'rgba(56,225,192,0.18)' : 'var(--studio-panel-2)',
                  border: '1px solid var(--studio-border)',
                  color: 'var(--studio-muted)',
                  fontSize: '10px',
                }}
                title={fillColor === 'transparent' ? 'Fill is off' : 'Toggle fill off'}
              >
                {fillColor === 'transparent' ? '∅' : '■'}
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowColorPalette(!showColorPalette)}
            className="text-xs studio-button-secondary"
          >
            Palette ▾
          </button>
        </div>

        {/* Color Palette Dropdown */}
        {showColorPalette && (
          <div className="absolute top-full left-0 mt-2 studio-popover p-2 z-10">
            <div className="grid grid-cols-5 gap-1">
              {colorPalette.map((color, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setBrushColor(color)
                    setShowColorPalette(false)
                  }}
                  className="w-8 h-8 rounded border-2 border-slate-700 hover:scale-110 transition"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Canvas Color Picker */}
      <CanvasColorPicker />

      {/* Puppet Mode Toggle */}
      <button
        onClick={togglePuppetMode}
        className={`tool-button ${puppetMode ? 'tool-button--active' : ''}`}
        title="Toggle Puppet Mode (P)"
      >
        🎭 Puppet
      </button>

      {/* Onion Skin Toggle */}
      <button
        onClick={toggleOnionSkin}
        className={`tool-button ${onionSkinEnabled ? 'tool-button--active' : ''}`}
        title="Toggle Onion Skin (O)"
      >
        {onionSkinEnabled ? <Eye size={18} /> : <EyeOff size={18} />}
        <span className="ml-1">Onion Skin</span>
      </button>

      {/* Clear Frame */}
      <button
        onClick={() => {
          if (confirm('Clear all drawing on current frame?')) {
            clearCurrentFrame()
          }
        }}
        className="tool-button tool-button--danger"
        title="Clear Current Frame"
      >
        <Trash2 size={18} />
        <span className="ml-1">Clear</span>
      </button>

      {/* Text Formatting (shown when text tool is active) */}
      {currentTool === 'text' && (
        <div className="tool-group items-center">
          <label className="text-xs uppercase tracking-wide text-slate-400">Font</label>
          <select
            value={textFont}
            onChange={(e) => setTextFont(e.target.value)}
            className="studio-input text-sm"
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Comic Sans MS">Comic Sans MS</option>
            <option value="Impact">Impact</option>
          </select>
          <label className="text-xs uppercase tracking-wide text-slate-400">Size</label>
          <input
            type="number"
            min="8"
            max="200"
            value={textSize}
            onChange={(e) => setTextSize(Number(e.target.value))}
            className="w-16 studio-input text-sm"
          />
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <button
        onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
        className="tool-button ml-auto"
        title="Keyboard Shortcuts (H)"
      >
        <Keyboard size={18} />
      </button>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsHelp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowShortcutsHelp(false)}>
          <div className="studio-popover rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
              <button onClick={() => setShowShortcutsHelp(false)} className="text-2xl hover:text-red-400">×</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold mb-2 text-emerald-300">Drawing Tools</h3>
                <div className="space-y-1 text-sm">
                  <div><kbd className="studio-kbd">B</kbd> Brush</div>
                  <div><kbd className="studio-kbd">E</kbd> Eraser</div>
                  <div><kbd className="studio-kbd">S</kbd> Select</div>
                  <div><kbd className="studio-kbd">V</kbd> Transform</div>
                  <div><kbd className="studio-kbd">R</kbd> Rectangle</div>
                  <div><kbd className="studio-kbd">C</kbd> Circle</div>
                  <div><kbd className="studio-kbd">L</kbd> Line</div>
                  <div><kbd className="studio-kbd">T</kbd> Text</div>
                  <div><kbd className="studio-kbd">F</kbd> Fill</div>
                  <div><kbd className="studio-kbd">I</kbd> Eyedropper</div>
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-2 text-amber-300">Playback & Animation</h3>
                <div className="space-y-1 text-sm">
                  <div><kbd className="studio-kbd">Space</kbd> Play/Pause</div>
                  <div><kbd className="studio-kbd">←</kbd> Previous Frame</div>
                  <div><kbd className="studio-kbd">→</kbd> Next Frame</div>
                  <div><kbd className="studio-kbd">P</kbd> Toggle Puppet Mode</div>
                  <div><kbd className="studio-kbd">O</kbd> Toggle Onion Skin</div>
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-2 text-sky-300">View Controls</h3>
                <div className="space-y-1 text-sm">
                  <div><kbd className="studio-kbd">Ctrl/Cmd</kbd> + <kbd className="studio-kbd">+</kbd> Zoom In</div>
                  <div><kbd className="studio-kbd">Ctrl/Cmd</kbd> + <kbd className="studio-kbd">-</kbd> Zoom Out</div>
                  <div><kbd className="studio-kbd">Ctrl/Cmd</kbd> + <kbd className="studio-kbd">0</kbd> Reset Zoom</div>
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-2 text-rose-300">Edit Commands</h3>
                <div className="space-y-1 text-sm">
                  <div><kbd className="studio-kbd">Ctrl/Cmd</kbd> + <kbd className="studio-kbd">Z</kbd> Undo</div>
                  <div><kbd className="studio-kbd">Ctrl/Cmd</kbd> + <kbd className="studio-kbd">Shift</kbd> + <kbd className="studio-kbd">Z</kbd> Redo</div>
                  <div><kbd className="studio-kbd">Ctrl/Cmd</kbd> + <kbd className="studio-kbd">Y</kbd> Redo</div>
                  <div><kbd className="studio-kbd">Ctrl/Cmd</kbd> + <kbd className="studio-kbd">D</kbd> Duplicate Frame</div>
                  <div><kbd className="studio-kbd">Ctrl/Cmd</kbd> + <kbd className="studio-kbd">E</kbd> Export</div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-400">
              Press <kbd className="studio-kbd">H</kbd> or <kbd className="studio-kbd">?</kbd> to toggle this help panel
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(Toolbar)

