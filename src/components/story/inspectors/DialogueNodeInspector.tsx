import { useState, useCallback } from 'react'
import { debounce } from 'lodash-es'
import type { Node } from 'reactflow'
import type { DialogueNodeData } from '../../../types/story'
import { useStoryStore } from '../../../store/storyStore'

interface DialogueNodeInspectorProps {
  node: Node<DialogueNodeData>
}

export default function DialogueNodeInspector({ node }: DialogueNodeInspectorProps) {
  const { updateNodeData, importedCharacters } = useStoryStore()
  const [showCharacterPicker, setShowCharacterPicker] = useState(false)
  const [localText, setLocalText] = useState(node.data.text || '')

  // Debounced update for text changes (300ms)
  const debouncedUpdateText = useCallback(
    debounce((value: string) => {
      updateNodeData(node.id, { text: value })
    }, 300),
    [node.id]
  )

  const handleCharacterNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 50) // Limit to 50 chars
    updateNodeData(node.id, { characterName: value })
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, 500) // Limit to 500 chars
    setLocalText(value)
    debouncedUpdateText(value)
  }

  const handleExpressionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(node.id, { expression: e.target.value || undefined })
  }

  const handleAnimationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(node.id, { animation: e.target.value || undefined })
  }

  // Find selected character with null safety
  const selectedCharacter = node.data.characterId 
    ? importedCharacters.find((char) => char.id === node.data.characterId)
    : undefined
    
  const characterExpressions = selectedCharacter?.expressions ?? []
  const characterAnimations = selectedCharacter?.animations ?? []

  return (
    <div className="space-y-4">
      {/* Character Selection */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Character
        </label>
        {selectedCharacter ? (
          <div className="flex items-center gap-3 p-2 bg-slate-700 rounded-lg">
            <img
              src={selectedCharacter.thumbnail}
              alt={selectedCharacter.name}
              className="w-10 h-10 rounded object-cover"
            />
            <div className="flex-1">
              <div className="text-sm text-white font-medium">
                {selectedCharacter.name}
              </div>
              <button
                onClick={() => setShowCharacterPicker(true)}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Change
              </button>
            </div>
          </div>
        ) : (
          <div>
            <input
              type="text"
              value={node.data.characterName || ''}
              onChange={handleCharacterNameChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 mb-2"
              placeholder="Character Name"
            />
            <button
              onClick={() => setShowCharacterPicker(true)}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              Import from Character Studio →
            </button>
          </div>
        )}
      </div>

      {/* Dialogue Text */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Dialogue Text
          <span className="text-xs text-slate-400 ml-2">
            ({localText.length}/500)
          </span>
        </label>
        <textarea
          value={localText}
          onChange={handleTextChange}
          rows={5}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
          placeholder="Enter what the character says..."
          maxLength={500}
        />
        <p className="mt-1 text-xs text-slate-400">
          Use **bold** and *italic* for markdown formatting
        </p>
      </div>

      {/* Expression */}
      {selectedCharacter && characterExpressions.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Expression
          </label>
          <select
            value={node.data.expression || ''}
            onChange={handleExpressionChange}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Neutral</option>
            {characterExpressions.map((expr) => (
              <option key={expr} value={expr}>
                {expr}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Animation */}
      {selectedCharacter && characterAnimations.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Animation
          </label>
          <select
            value={node.data.animation || ''}
            onChange={handleAnimationChange}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">None</option>
            {characterAnimations.map((anim) => (
              <option key={anim} value={anim}>
                {anim}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Show warning if character not found */}
      {node.data.characterId && !selectedCharacter && (
        <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
          <p className="text-xs text-yellow-400">
            ⚠️ Character not found. It may have been deleted.
          </p>
        </div>
      )}

      {/* Character Picker Modal - Placeholder */}
      {showCharacterPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-4">
              Import Character
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Character import from Character Studio coming soon!
            </p>
            <button
              onClick={() => setShowCharacterPicker(false)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-2">💬 Tips</h3>
        <ul className="space-y-1 text-xs text-slate-400">
          <li>• Connect to Choice or next Dialogue</li>
          <li>• Use short, conversational text</li>
          <li>• Import characters for portraits</li>
        </ul>
      </div>
    </div>
  )
}
