import { useState } from 'react'
import { useStoryStore } from '../../store/storyStore'
import type { StoryCharacter } from '../../types/story'
import { MediaUploader } from '../common/MediaUploader'

export default function CharacterDatabase() {
  const characters = useStoryStore((state) => state.characters)
  const addCharacter = useStoryStore((state) => state.addCharacter)
  const updateCharacter = useStoryStore((state) => state.updateCharacter)
  const deleteCharacter = useStoryStore((state) => state.deleteCharacter)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<StoryCharacter>>({
    name: '',
    bio: '',
    traits: [],
    relationships: {},
    color: '#3b82f6',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)

  const filteredCharacters = characters.filter((char) =>
    char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    char.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    char.traits.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleAdd = () => {
    setEditingId(null)
    setFormData({
      name: '',
      bio: '',
      traits: [],
      relationships: {},
      color: '#3b82f6',
    })
    setShowForm(true)
  }

  const handleEdit = (character: StoryCharacter) => {
    setEditingId(character.id)
    setFormData(character)
    setShowForm(true)
  }

  const handleSave = () => {
    if (!formData.name?.trim()) {
      alert('Character name is required')
      return
    }

    if (editingId) {
      updateCharacter(editingId, formData)
    } else {
      addCharacter(formData as Omit<StoryCharacter, 'id' | 'appearances'>)
    }

    setShowForm(false)
    setFormData({
      name: '',
      bio: '',
      traits: [],
      relationships: {},
      color: '#3b82f6',
    })
    setEditingId(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      name: '',
      bio: '',
      traits: [],
      relationships: {},
      color: '#3b82f6',
    })
  }

  const handleDelete = (id: string) => {
    const character = characters.find(c => c.id === id)
    if (!character) return

    const usageCount = character.appearances.length
    if (usageCount > 0) {
      const confirmed = confirm(
        `"${character.name}" is used in ${usageCount} node(s). Delete anyway?`
      )
      if (!confirmed) return
    }

    deleteCharacter(id)
  }

  const handleTraitInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const input = e.currentTarget
      const trait = input.value.trim()
      if (trait && !formData.traits?.includes(trait)) {
        setFormData({
          ...formData,
          traits: [...(formData.traits || []), trait],
        })
        input.value = ''
      }
    }
  }

  const removeTrait = (trait: string) => {
    setFormData({
      ...formData,
      traits: formData.traits?.filter(t => t !== trait) || [],
    })
  }

  const handleRelationshipInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const input = e.currentTarget
      const [name, description] = input.value.split(':').map(s => s.trim())
      if (name && description) {
        setFormData({
          ...formData,
          relationships: {
            ...formData.relationships,
            [name]: { type: 'custom', description },
          },
        })
        input.value = ''
      }
    }
  }

  const removeRelationship = (key: string) => {
    const { [key]: _, ...rest } = formData.relationships || {}
    setFormData({
      ...formData,
      relationships: rest,
    })
  }

  return (
    <div className="h-full flex flex-col bg-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">👥 Characters</h2>
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
          >
            + Add Character
          </button>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search characters..."
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Character List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredCharacters.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">👤</div>
            <p className="text-slate-400 text-sm">
              {searchQuery ? 'No characters found' : 'No characters yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAdd}
                className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
              >
                Create your first character
              </button>
            )}
          </div>
        ) : (
          filteredCharacters.map((character) => {
            const usageCount = character.appearances.length
            return (
              <div
                key={character.id}
                className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ backgroundColor: character.color }}
                  >
                    {character.thumbnail ? (
                      <img
                        src={character.thumbnail.url}
                        alt={character.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      character.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-white font-semibold truncate">
                        {character.name}
                      </h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(character)}
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-slate-600 rounded transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(character.id)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-slate-600 rounded transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {character.bio && (
                      <p className="text-slate-300 text-sm mb-2 line-clamp-2">
                        {character.bio}
                      </p>
                    )}

                    {character.traits.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {character.traits.slice(0, 4).map((trait, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-slate-600 text-slate-200 text-xs rounded"
                          >
                            {trait}
                          </span>
                        ))}
                        {character.traits.length > 4 && (
                          <span className="px-2 py-0.5 text-slate-400 text-xs">
                            +{character.traits.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>
                        📍 Used in {usageCount} node{usageCount !== 1 ? 's' : ''}
                      </span>
                      {character.relationships && Object.keys(character.relationships).length > 0 && (
                        <span>
                          🔗 {Object.keys(character.relationships).length} relationship{Object.keys(character.relationships).length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingId ? 'Edit Character' : 'New Character'}
              </h3>
              <button
                onClick={handleCancel}
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Character name"
                  autoFocus
                />
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Thumbnail (Optional)
                </label>
                <MediaUploader
                  current={formData.thumbnail}
                  onUpload={(media) => setFormData({ ...formData, thumbnail: media })}
                  onRemove={() => setFormData({ ...formData, thumbnail: undefined })}
                  compact={false}
                  accept="image/*"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color || '#3b82f6'}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 bg-slate-700 border border-slate-600 rounded cursor-pointer"
                  />
                  <span className="text-slate-300 text-sm">{formData.color || '#3b82f6'}</span>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Biography (Optional)
                </label>
                <textarea
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Background, personality, motivations..."
                />
              </div>

              {/* Traits */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Traits
                </label>
                <input
                  type="text"
                  onKeyDown={handleTraitInput}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Type trait and press Enter"
                />
                {formData.traits && formData.traits.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.traits.map((trait, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-slate-600 text-slate-200 text-sm rounded flex items-center gap-2"
                      >
                        {trait}
                        <button
                          onClick={() => removeTrait(trait)}
                          className="text-slate-400 hover:text-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Relationships */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Relationships (Optional)
                </label>
                <input
                  type="text"
                  onKeyDown={handleRelationshipInput}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="name: description (press Enter)"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Example: Alice: Sister, mentor
                </p>
                {formData.relationships && Object.keys(formData.relationships).length > 0 && (
                  <div className="space-y-2 mt-2">
                    {Object.entries(formData.relationships).map(([name, rel]) => (
                      <div
                        key={name}
                        className="flex items-center gap-2 p-2 bg-slate-700 rounded"
                      >
                        <div className="flex-1">
                          <div className="text-slate-200 text-sm font-medium">{name}</div>
                          <div className="text-slate-400 text-xs">{rel.description}</div>
                        </div>
                        <button
                          onClick={() => removeRelationship(name)}
                          className="text-slate-400 hover:text-white"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-700 flex items-center justify-end gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-slate-300 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
              >
                {editingId ? 'Save Changes' : 'Create Character'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
