import { useState } from 'react'
import { useAnimationStore } from '../../store/useAnimationStore'

const CANVAS_PRESETS = [
  { name: 'Off-White', color: '#FAF9F6' },
  { name: 'White', color: '#FFFFFF' },
  { name: 'Light Gray', color: '#F0F0F0' },
  { name: 'Warm', color: '#FFF8F0' },
  { name: 'Cool', color: '#F0F4F8' },
  { name: 'Dark', color: '#2A2A2A' },
  { name: 'Black', color: '#000000' },
  { name: 'Transparent', color: 'transparent' },
]

export default function CanvasColorPicker() {
  const { canvasColor, setCanvasColor } = useAnimationStore()
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded transition flex items-center gap-2 text-gray-300 text-sm"
        style={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)'
        }}
        title="Canvas Background Color"
      >
        <div 
          className="w-5 h-5 rounded border-2 border-gray-600"
          style={{ 
            backgroundColor: canvasColor === 'transparent' ? '#FAF9F6' : canvasColor,
            backgroundImage: canvasColor === 'transparent' 
              ? 'repeating-conic-gradient(#E0E0E0 0% 25%, #F5F5F5 0% 50%) 50% / 10px 10px'
              : 'none'
          }}
        />
        <span>Canvas</span>
      </button>

      {showPicker && (
        <>
          {/* Backdrop to close picker */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowPicker(false)}
          />
          
          <div 
            className="absolute top-full mt-2 left-0 bg-gray-900 rounded-lg shadow-2xl p-4 z-50 min-w-[320px]"
            style={{
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
              backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)'
            }}
          >
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Canvas Background</h3>
            
            {/* Preset Colors */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {CANVAS_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setCanvasColor(preset.color)
                    setShowPicker(false)
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-800 transition"
                  title={preset.name}
                  style={{
                    backgroundColor: canvasColor === preset.color ? 'rgba(255,255,255,0.1)' : 'transparent'
                  }}
                >
                  <div
                    className="w-12 h-12 rounded border-2 border-gray-700"
                    style={{
                      backgroundColor: preset.color === 'transparent' ? '#FAF9F6' : preset.color,
                      backgroundImage: preset.color === 'transparent'
                        ? 'repeating-conic-gradient(#E0E0E0 0% 25%, #F5F5F5 0% 50%) 50% / 10px 10px'
                        : 'none',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
                    }}
                  />
                  <span className="text-xs text-gray-400">{preset.name}</span>
                </button>
              ))}
            </div>

            {/* Custom Color Picker */}
            <div className="border-t border-gray-700 pt-3">
              <label className="text-xs text-gray-400 mb-2 block">Custom Color</label>
              <input
                type="color"
                value={canvasColor === 'transparent' ? '#FAF9F6' : canvasColor}
                onChange={(e) => setCanvasColor(e.target.value)}
                className="w-full h-10 rounded cursor-pointer bg-gray-800 border-2 border-gray-700"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
