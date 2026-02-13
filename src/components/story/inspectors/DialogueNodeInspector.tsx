import { useState, useCallback } from 'react'
import { debounce } from 'lodash-es'
import type { Node } from 'reactflow'
import type { DialogueNodeData, TiptapJSON } from '../../../types/story'
import { useStoryStore } from '../../../store/storyStore'
import { RichTextEditor } from '../../common/RichTextEditor'
import { MediaLibrary } from '../../common/MediaLibrary'
import { MediaUploader } from '../../common/MediaUploader'

interface DialogueNodeInspectorProps {
  node: Node<DialogueNodeData>
}

export default function DialogueNodeInspector({ node }: DialogueNodeInspectorProps) {
  const { 
    updateNodeData, 
    importedCharacters,
    characters,
    locations,
    mediaLibrary,
    addMediaAsset,
    deleteMediaAsset,
  } = useStoryStore()
  
  const [showCharacterPicker, setShowCharacterPicker] = useState(false)
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [mediaLibraryMode, setMediaLibraryMode] = useState<'background' | 'foreground'>('background')
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [notesExpanded, setNotesExpanded] = useState(false)
  
  // Get initial content - migrate from legacy text if needed
  const initialRichText = node.data.richText || (node.data.text ? convertLegacyText(node.data.text) : undefined)
  
  // Debounced update for rich text (500ms)
  const debouncedUpdateRichText = useCallback(
    debounce((json: TiptapJSON, html: string, text: string) => {
      const wordCount = text.split(/\s+/).filter(Boolean).length
      updateNodeData(node.id, { 
        richText: json,
        textHTML: html,
        wordCount,
        text: text, // Keep legacy field for backward compatibility
      })
    }, 500),
    [node.id]
  )

  const handleRichTextChange = (json: TiptapJSON, html: string, text: string) => {
    debouncedUpdateRichText(json, html, text)
  }

  const handleCharacterSelect = (characterId: string) => {
    const character = characters.find(c => c.id === characterId)
    if (character) {
      updateNodeData(node.id, { 
        characterId,
        characterName: character.name, // For backward compatibility
      })
    }
  }
  
  const handleLocationSelect = (locationId: string) => {
    const location = locations.find(l => l.id === locationId)
    if (location) {
      updateNodeData(node.id, { 
        locationId,
        backgroundImage: location.backgroundImage, // Default to location background
      })
    }
    setShowLocationPicker(false)
  }
  
  const handleBackgroundImageSelect = (asset: any) => {
    updateNodeData(node.id, { backgroundImage: asset })
    setShowMediaLibrary(false)
  }
  
  const handleForegroundMediaSelect = (asset: any) => {
    updateNodeData(node.id, { foregroundMedia: asset })
    setShowMediaLibrary(false)
  }

  const handleExpressionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(node.id, { expression: e.target.value || undefined })
  }

  const handleAnimationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(node.id, { animation: e.target.value || undefined })
  }
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(node.id, { notes: e.target.value })
  }
  
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
    updateNodeData(node.id, { tags })
  }

  // Find selected character (from new database)
  const selectedCharacter = node.data.characterId 
    ? characters.find((char) => char.id === node.data.characterId)
    : undefined
  
  // Find selected character from legacy imported characters
  const legacyCharacter = node.data.characterId 
    ? importedCharacters.find((char) => char.id === node.data.characterId)
    : undefined
    
  const characterExpressions = legacyCharacter?.expressions ?? []
  const characterAnimations = legacyCharacter?.animations ?? []
  
  // Find selected location
  const selectedLocation = node.data.locationId
    ? locations.find((loc) => loc.id === node.data.locationId)
    : undefined

  return (
    <div className="space-y-4 max-h-full overflow-y-auto">
      {/* Character Selection */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Character
        </label>
        {selectedCharacter ? (
          <div className="flex items-center gap-3 p-2 bg-slate-700 rounded-lg">
            {selectedCharacter.thumbnail && (
              <img
                src={selectedCharacter.thumbnail.url}
                alt={selectedCharacter.name}
                className="w-10 h-10 rounded object-cover"
              />
            )}
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
        ) : legacyCharacter ? (
          <div className="flex items-center gap-3 p-2 bg-slate-700 rounded-lg">
            <img
              src={legacyCharacter.thumbnail}
              alt={legacyCharacter.name}
              className="w-10 h-10 rounded object-cover"
            />
            <div className="flex-1">
              <div className="text-sm text-white font-medium">
                {legacyCharacter.name} <span className="text-xs text-slate-400">(Legacy)</span>
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
          <button
            onClick={() => setShowCharacterPicker(true)}
            className="w-full px-3 py-2 border border-dashed border-slate-600 rounded-lg text-sm text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
          >
            + Select Character
          </button>
        )}
      </div>

      {/* Dialogue Text - Rich Text Editor */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Dialogue Text
        </label>
        <RichTextEditor
          content={initialRichText}
          onChange={handleRichTextChange}
          placeholder="Enter what the character says..."
          maxLength={10000}
          showWordCount
          compact
        />
      </div>
      
      {/* Location Selection */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Location (Optional)
        </label>
        {selectedLocation ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-slate-700 rounded-lg">
              {selectedLocation.backgroundImage && (
                <div className="w-12 h-12 rounded overflow-hidden">
                  <img
                    src={selectedLocation.backgroundImage.thumbnail || selectedLocation.backgroundImage.url}
                    alt={selectedLocation.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="text-sm text-white font-medium">{selectedLocation.name}</div>
                <button
                  onClick={() => setShowLocationPicker(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowLocationPicker(true)}
            className="w-full px-3 py-2 border border-dashed border-slate-600 rounded-lg text-sm text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
          >
            + Select Location
          </button>
        )}
      </div>

      {/* Background Image Override */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Background Image {node.data.locationId && '(Override)'}
        </label>
        {node.data.backgroundImage ? (
          <MediaUploader
            current={node.data.backgroundImage}
            onUpload={(asset) => {
              addMediaAsset(asset)
              handleBackgroundImageSelect(asset)
            }}
            onRemove={() => updateNodeData(node.id, { backgroundImage: undefined })}
            accept="image/*"
            compact
          />
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setMediaLibraryMode('background')
                setShowMediaLibrary(true)
              }}
              className="flex-1 px-3 py-2 border border-dashed border-slate-600 rounded-lg text-sm text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
            >
              Choose from Library
            </button>
            <MediaUploader
              onUpload={(asset) => {
                addMediaAsset(asset)
                handleBackgroundImageSelect(asset)
              }}
              accept="image/*"
              compact
            />
          </div>
        )}
      </div>

      {/* Expression */}
      {legacyCharacter && characterExpressions.length > 0 && (
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
      {legacyCharacter && characterAnimations.length > 0 && (
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
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
            placeholder="Internal notes for this scene (not shown in preview)..."
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
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          placeholder="e.g., intro, important, chapter1"
        />
      </div>

      {/* Character Picker Modal */}
      {showCharacterPicker && (
        <CharacterPickerModal
          characters={characters}
          onSelect={(id) => {
            handleCharacterSelect(id)
            setShowCharacterPicker(false)
          }}
          onClose={() => setShowCharacterPicker(false)}
        />
      )}
      
      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPickerModal
          locations={locations}
          onSelect={(id) => handleLocationSelect(id)}
          onClose={() => setShowLocationPicker(false)}
        />
      )}

      {/* Media Library Modal */}
      {showMediaLibrary && (
        <MediaLibrary
          assets={mediaLibrary}
          onSelect={mediaLibraryMode === 'background' ? handleBackgroundImageSelect : handleForegroundMediaSelect}
          onUpload={(asset) => {
            addMediaAsset(asset)
          }}
          onDelete={(id) => deleteMediaAsset(id)}
          onClose={() => setShowMediaLibrary(false)}
        />
      )}

      <div className="pt-4 border-t border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-2">💬 Tips</h3>
        <ul className="space-y-1 text-xs text-slate-400">
          <li>• Use rich text formatting for emphasis</li>
          <li>• Add characters and locations to your story databases first</li>
          <li>• Writer's notes help organize your scenes</li>
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

// Character Picker Modal Component
function CharacterPickerModal({
  characters,
  onSelect,
  onClose,
}: {
  characters: any[]
  onSelect: (id: string) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Select Character</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {characters.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              No characters yet. Create characters in the Assets panel.
            </p>
          ) : (
            characters.map((char) => (
              <button
                key={char.id}
                onClick={() => onSelect(char.id)}
                className="w-full flex items-center gap-3 p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left"
              >
                {char.thumbnail && (
                  <img
                    src={char.thumbnail.url}
                    alt={char.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">{char.name}</div>
                  {char.traits && char.traits.length > 0 && (
                    <div className="text-xs text-slate-400 mt-1">
                      {char.traits.slice(0, 3).join(', ')}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// Location Picker Modal Component
function LocationPickerModal({
  locations,
  onSelect,
  onClose,
}: {
  locations: any[]
  onSelect: (id: string) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Select Location</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {locations.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              No locations yet. Create locations in the Assets panel.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => onSelect(loc.id)}
                  className="flex flex-col bg-slate-700 hover:bg-slate-600 rounded-lg overflow-hidden transition-colors text-left"
                >
                  {loc.backgroundImage ? (
                    <div className="w-full h-32 bg-slate-900">
                      <img
                        src={loc.backgroundImage.thumbnail || loc.backgroundImage.url}
                        alt={loc.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-slate-900 flex items-center justify-center text-slate-600">
                      <span className="text-4xl">📍</span>
                    </div>
                  )}
                  <div className="p-3">
                    <div className="text-sm text-white font-medium">{loc.name}</div>
                    {loc.description && (
                      <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {loc.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
