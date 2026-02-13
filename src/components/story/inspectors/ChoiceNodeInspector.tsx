import { useCallback, useState } from 'react'
import { debounce } from 'lodash-es'
import { nanoid } from 'nanoid'
import type { Node } from 'reactflow'
import type { ChoiceNodeData } from '../../../types/story'
import { useStoryStore } from '../../../store/storyStore'

interface ChoiceNodeInspectorProps {
  node: Node<ChoiceNodeData>
}

const MAX_CHOICES = 8

export default function ChoiceNodeInspector({ node }: ChoiceNodeInspectorProps) {
  const updateNodeData = useStoryStore((state) => state.updateNodeData)
  const [localPrompt, setLocalPrompt] = useState(node.data.prompt || '')

  // Debounced update for prompt (300ms)
  const debouncedUpdatePrompt = useCallback(
    debounce((value: string) => {
      updateNodeData(node.id, { prompt: value })
    }, 300),
    [node.id]
  )

  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 100) // Limit to 100 chars
    setLocalPrompt(value)
    debouncedUpdatePrompt(value)
  }

  const handleChoiceTextChange = (choiceId: string, text: string) => {
    const trimmedText = text.slice(0, 80) // Limit choice text to 80 chars
    const updatedChoices = node.data.choices.map((choice) =>
      choice.id === choiceId ? { ...choice, text: trimmedText } : choice
    )
    updateNodeData(node.id, { choices: updatedChoices })
  }

  const addChoice = () => {
    if (node.data.choices.length >= MAX_CHOICES) {
      alert(`Maximum ${MAX_CHOICES} choices allowed`)
      return
    }
    
    const newChoice = {
      id: nanoid(8),
      text: 'New option',
    }
    updateNodeData(node.id, { 
      choices: [...node.data.choices, newChoice] 
    })
  }

  const removeChoice = (choiceId: string) => {
    if (node.data.choices.length <= 2) {
      alert('Must have at least 2 choices')
      return
    }
    const updatedChoices = node.data.choices.filter((c) => c.id !== choiceId)
    updateNodeData(node.id, { choices: updatedChoices })
  }
  
  // Show warning if less than 2 choices
  const hasMinimumChoices = node.data.choices.length >= 2

  return (
    <div className="space-y-4">
      {/* Prompt */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Prompt
          <span className="text-xs text-slate-400 ml-2">
            ({localPrompt.length}/100)
          </span>
        </label>
        <input
          type="text"
          value={localPrompt}
          onChange={handlePromptChange}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
          placeholder="Choose your path"
          maxLength={100}
        />
        <p className="mt-1 text-xs text-slate-400">
          Question or context for the choices
        </p>
      </div>
      
      {/* Warning if not enough choices */}
      {!hasMinimumChoices && (
        <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
          <p className="text-xs text-yellow-400">
            ⚠️ Choice nodes must have at least 2 choices
          </p>
        </div>
      )}

      {/* Choice Options */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-white">
            Choices ({node.data.choices.length}/{MAX_CHOICES})
          </label>
          <button
            onClick={addChoice}
            disabled={node.data.choices.length >= MAX_CHOICES}
            className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            + Add
          </button>
        </div>
        
        <div className="space-y-2">
          {node.data.choices.map((choice, index) => (
            <div key={choice.id} className="flex gap-2">
              <div className="flex-shrink-0 w-6 h-8 flex items-center justify-center text-xs text-slate-400 font-bold">
                {index + 1}.
              </div>
              <input
                type="text"
                value={choice.text || ''}
                onChange={(e) => handleChoiceTextChange(choice.id, e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder={`Option ${index + 1}`}
                maxLength={80}
                title={`${(choice.text || '').length}/80 characters`}
              />
              <button
                onClick={() => removeChoice(choice.id)}
                className="flex-shrink-0 px-2 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-xs"
                title="Remove choice"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        
        <p className="mt-2 text-xs text-slate-400">
          Connect each choice to a different node (drag from right side)
        </p>
      </div>

      <div className="pt-4 border-t border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-2">🔀 Tips</h3>
        <ul className="space-y-1 text-xs text-slate-400">
          <li>• 2-4 choices work best</li>
          <li>• Keep text short and clear</li>
          <li>• Each choice gets its own output port</li>
        </ul>
      </div>
    </div>
  )
}
