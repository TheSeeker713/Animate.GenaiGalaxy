import { useCharacterStore } from '@/store/characterStore'
import type { MorphTarget } from '@/types/character'

export default function MorphPanel() {
  const {
    currentCharacter,
    baseTemplate,
    selectedMorphCategory,
    setSelectedMorphCategory,
    updateMorphState,
    updateCharacter
  } = useCharacterStore()

  if (!currentCharacter || !baseTemplate) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">Morphs</h2>
        <p className="text-gray-400 text-sm">Load a character to access morphs</p>
      </div>
    )
  }

  const morphTargets = baseTemplate.morphTargets ?? [] // Use nullish coalescing
  
  // Group morphs by category
  const morphsByCategory = morphTargets.reduce((acc, morph) => {
    if (!acc[morph.category]) {
      acc[morph.category] = []
    }
    acc[morph.category].push(morph)
    return acc
  }, {} as Record<string, MorphTarget[]>)

  const categories = Object.keys(morphsByCategory)
  
  if (categories.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">Morphs</h2>
        <p className="text-gray-400 text-sm">No morphs available for this template</p>
      </div>
    )
  }

  // Use first category if none selected
  const activeCategory = selectedMorphCategory || (categories[0] as 'body' | 'face' | 'style')

  const activeMorphs = morphsByCategory[activeCategory] || []

  const handleMorphChange = (morphId: string, value: number) => {
    updateMorphState(morphId, value)
  }

  const resetMorph = (morphId: string, defaultValue: number) => {
    updateMorphState(morphId, defaultValue)
  }

  const randomizeCategory = () => {
    // Batch update all morphs at once for better performance
    const newMorphState = { ...currentCharacter.morphState }
    activeMorphs.forEach(morph => {
      const range = morph.maxValue - morph.minValue
      const randomValue = morph.minValue + Math.random() * range
      newMorphState[morph.id] = randomValue
    })
    
    updateCharacter({
      ...currentCharacter,
      morphState: newMorphState
    })
  }

  const resetCategory = () => {
    // Batch update all morphs at once
    const newMorphState = { ...currentCharacter.morphState }
    activeMorphs.forEach(morph => {
      newMorphState[morph.id] = morph.defaultValue
    })
    
    updateCharacter({
      ...currentCharacter,
      morphState: newMorphState
    })
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Morphs</h2>
        <div className="flex gap-1">
          <button
            onClick={randomizeCategory}
            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs font-semibold transition"
            title="Randomize all morphs in this category"
          >
            🎲
          </button>
          <button
            onClick={resetCategory}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-semibold transition"
            title="Reset all morphs in this category"
          >
            ↺
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 border-b border-gray-700">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedMorphCategory(category as any)}
            className={`px-3 py-2 text-sm font-medium capitalize transition ${
              category === activeCategory
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {category}
            <span className="ml-1 text-xs text-gray-500">
              ({morphsByCategory[category].length})
            </span>
          </button>
        ))}
      </div>

      {/* Morph sliders */}
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {activeMorphs.length === 0 ? (
          <p className="text-gray-400 text-sm">No morphs in this category</p>
        ) : (
          activeMorphs.map((morph) => {
            const currentValue = currentCharacter.morphState[morph.id] ?? morph.defaultValue
            const percentage = ((currentValue - morph.minValue) / (morph.maxValue - morph.minValue)) * 100

            return (
              <div key={morph.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    {morph.name}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono">
                      {currentValue.toFixed(2)}
                    </span>
                    <button
                      onClick={() => resetMorph(morph.id, morph.defaultValue)}
                      className="text-xs text-gray-500 hover:text-gray-300"
                      title="Reset to default"
                    >
                      ↺
                    </button>
                  </div>
                </div>

                {morph.description && (
                  <p className="text-xs text-gray-500">{morph.description}</p>
                )}

                <div className="relative">
                  <input
                    type="range"
                    min={morph.minValue}
                    max={morph.maxValue}
                    step={morph.step || 0.01}
                    value={currentValue}
                    onChange={(e) => handleMorphChange(morph.id, parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${percentage}%, #374151 ${percentage}%, #374151 100%)`
                    }}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">{morph.minValue}</span>
                    <span className="text-xs text-gray-500">{morph.maxValue}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Quick presets */}
      {activeMorphs.length > 0 && (
        <div className="pt-4 border-t border-gray-700">
          <label className="text-sm font-medium mb-2 block">Quick Presets</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const newMorphState = { ...currentCharacter.morphState }
                activeMorphs.forEach(m => { newMorphState[m.id] = m.minValue })
                updateCharacter({ ...currentCharacter, morphState: newMorphState })
              }}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
            >
              Minimum
            </button>
            <button
              onClick={() => {
                const newMorphState = { ...currentCharacter.morphState }
                activeMorphs.forEach(m => { newMorphState[m.id] = m.maxValue })
                updateCharacter({ ...currentCharacter, morphState: newMorphState })
              }}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
            >
              Maximum
            </button>
            <button
              onClick={resetCategory}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition col-span-2"
            >
              Reset All
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
