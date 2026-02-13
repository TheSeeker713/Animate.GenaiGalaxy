import { useCallback, useState } from 'react'
import { debounce } from 'lodash-es'
import { nanoid } from 'nanoid'
import type { Node } from 'reactflow'
import type { ChoiceNodeData, TiptapJSON } from '../../../types/story'
import { useStoryStore } from '../../../store/storyStore'
import { RichTextEditor } from '../../common/RichTextEditor'

interface ChoiceNodeInspectorProps {
  node: Node<ChoiceNodeData>
}

const MAX_CHOICES = 8

export default function ChoiceNodeInspector({ node }: ChoiceNodeInspectorProps) {
  const { updateNodeData, locations } = useStoryStore()
  const [notesExpanded, setNotesExpanded] = useState(false)
  const [editingChoiceId, setEditingChoiceId] = useState<string | null>(null)

  // Get initial prompt content - migrate from legacy text if needed
  const initialPromptRichText = node.data.promptRichText || (node.data.prompt ? convertLegacyText(node.data.prompt) : undefined)

  // Debounced update for prompt rich text (500ms)
  const debouncedUpdatePrompt = useCallback(
    debounce((json: TiptapJSON, html: string, text: string) => {
      updateNodeData(node.id, { 
        promptRichText: json,
        promptHTML: html,
        prompt: text, // Keep legacy field for backward compatibility
      })
    }, 500),
    [node.id]
  )

  const handlePromptChange = (json: TiptapJSON, html: string, text: string) => {
    debouncedUpdatePrompt(json, html, text)
  }

  const handleChoiceTextChange = (choiceId: string, json: TiptapJSON, html: string, text: string) => {
    const updatedChoices = node.data.choices.map((choice) =>
      choice.id === choiceId 
        ? { ...choice, richText: json, textHTML: html, text } 
        : choice
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
      richText: convertLegacyText('New option'),
      textHTML: '<p>New option</p>',
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
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(node.id, { notes: e.target.value })
  }
  
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
    updateNodeData(node.id, { tags })
  }
  
  // Show warning if less than 2 choices
  const hasMinimumChoices = node.data.choices.length >= 2

  return (
    <div className="space-y-4 max-h-full overflow-y-auto">
      {/* Prompt - Rich Text */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Prompt
        </label>
        <RichTextEditor
          content={initialPromptRichText}
          onChange={handlePromptChange}
          placeholder="Choose your path..."
          maxLength={2000}
          showWordCount
          compact
        />
        <p className="mt-1 text-xs text-slate-400">
          Question or context for the choices
        </p>
      </div>
      
      {/* Location Selection (Optional) */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Location (Optional)
        </label>
        <select
          value={node.data.locationId || ''}
          onChange={(e) => updateNodeData(node.id, { locationId: e.target.value || undefined })}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="">No Location</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
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
        
        <div className="space-y-3">
          {node.data.choices.map((choice, index) => {
            const choiceText = choice.richText || (choice.text ? convertLegacyText(choice.text) : undefined)
            const isEditing = editingChoiceId === choice.id
            
            return (
              <div key={choice.id} className="border border-slate-600 rounded-lg p-3 bg-slate-700/50">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-6 h-6 mt-1 flex items-center justify-center text-xs text-purple-400 font-bold bg-purple-900/30 rounded">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <RichTextEditor
                          content={choiceText}
                          onChange={(json, html, text) => handleChoiceTextChange(choice.id, json, html, text)}
                          placeholder={`Option ${index + 1}`}
                          maxLength={500}
                          showWordCount
                          compact
                        />
                        <button
                          onClick={() => setEditingChoiceId(null)}
                          className="text-xs text-cyan-400 hover:text-cyan-300"
                        >
                          Done Editing
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div 
                          className="text-sm text-white prose prose-sm prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: choice.textHTML || choice.text || '' }}
                        />
                        <button
                          onClick={() => setEditingChoiceId(choice.id)}
                          className="text-xs text-cyan-400 hover:text-cyan-300 mt-1"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeChoice(choice.id)}
                    className="flex-shrink-0 px-2 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded text-xs h-6"
                    title="Remove choice"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Condition */}
                {choice.condition && (
                  <div className="mt-2 text-xs text-slate-400 font-mono">
                    Condition: {choice.condition}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        <p className="mt-2 text-xs text-slate-400">
          Connect each choice to a different node (drag from right side)
        </p>
      </div>
      
      {/* Writer's Notes (Collapsible) */}
      <div>
        <button
          onClick={() => setNotesExpanded(!notesExpanded)}
          className="flex items-center justify-between w-full text-sm font-medium text-white mb-2 hover:text-cyan-400 transition-colors"
        >
          <span>Writer's Notes (Internal)</span>
          <span className="text-lg">{notesExpanded ? '−' : '+'}</span>
        </button>
        {notesExpanded && (
          <textarea
            value={node.data.notes || ''}
            onChange={handleNotesChange}
            rows={3}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
            placeholder="Internal notes for this choice point (not shown in preview)..."
          />
        )}
      </div>
      
      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          value={node.data.tags?.join(', ') || ''}
          onChange={handleTagsChange}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
          placeholder="e.g., decision-point, important, chapter2"
        />
      </div>

      <div className="pt-4 border-t border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-2">🔀 Tips</h3>
        <ul className="space-y-1 text-xs text-slate-400">
          <li>• Use rich text to emphasize key words in choices</li>
          <li>• 2-4 choices work best for clarity</li>
          <li>• Each choice gets its own output port</li>
        </ul>
      </div>
    </div>
  )
}

// Helper function to convert legacy plain text to TiptapJSON
function convertLegacyText(text: string): TiptapJSON {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: text,
          },
        ],
      },
    ],
  }
}
