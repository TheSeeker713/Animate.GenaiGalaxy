import { useState, useEffect } from 'react'
import { useStoryStore } from '../../store/storyStore'

export default function StoryMetadataPanel() {
  const currentStory = useStoryStore((state) => state.currentStory)
  const updateStoryMetadata = useStoryStore((state) => state.updateStoryMetadata)

  const [formData, setFormData] = useState({
    title: currentStory?.name || '',
    genre: currentStory?.genre || '',
    status: currentStory?.status || 'draft' as 'draft' | 'in-progress' | 'review' | 'complete',
    tags: currentStory?.tags || [],
    outline: currentStory?.outline || '',
    notes: currentStory?.notes || '',
  })

  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (currentStory) {
      setFormData({
        title: currentStory.name || '',
        genre: currentStory.genre || '',
        status: currentStory.status || 'draft',
        tags: currentStory.tags || [],
        outline: currentStory.outline || '',
        notes: currentStory.notes || '',
      })
    }
  }, [currentStory])

  const handleSave = () => {
    updateStoryMetadata(formData)
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      const newTags = [...formData.tags, tag]
      setFormData({ ...formData, tags: newTags })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const statusOptions = [
    { value: 'draft', label: '📝 Draft', color: 'text-slate-400' },
    { value: 'in-progress', label: '🚧 In Progress', color: 'text-yellow-400' },
    { value: 'review', label: '👁️ Review', color: 'text-blue-400' },
    { value: 'complete', label: '✅ Complete', color: 'text-green-400' },
    { value: 'published', label: '🌐 Published', color: 'text-purple-400' },
  ]

  const genreOptions = [
    'Fantasy', 'Sci-Fi', 'Mystery', 'Thriller', 'Romance', 
    'Horror', 'Adventure', 'Drama', 'Comedy', 'Historical',
    'Western', 'Crime', 'Action', 'Superhero', 'Other'
  ]

  return (
    <div className="h-full flex flex-col bg-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">📋 Story Info</h2>
        <button
          onClick={handleSave}
          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
        >
          Save Changes
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Story Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            placeholder="My Epic Story"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'in-progress' | 'review' | 'complete' })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Genre */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Genre
          </label>
          <select
            value={formData.genre}
            onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Select genre...</option>
            {genreOptions.map(genre => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="Add tag (press Enter)"
            />
            <button
              onClick={addTag}
              className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-blue-500/20 text-blue-300 text-sm rounded flex items-center gap-2 border border-blue-500/30"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-blue-400 hover:text-blue-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Outline */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Story Outline
          </label>
          <textarea
            value={formData.outline}
            onChange={(e) => setFormData({ ...formData, outline: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
            placeholder="Brief overview of your story, major plot points, acts..."
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Development Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
            placeholder="Internal notes, reminders, ideas..."
          />
        </div>

        {/* Analytics */}
        {currentStory && (
          <div className="pt-4 border-t border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-3">📊 Statistics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Total Words</div>
                <div className="text-xl font-bold text-white">
                  {currentStory.wordCount?.toLocaleString() || 0}
                </div>
              </div>
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Est. Playtime</div>
                <div className="text-xl font-bold text-white">
                  {currentStory.estimatedPlaytime ? `${Math.round(currentStory.estimatedPlaytime)}m` : '0m'}
                </div>
              </div>
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Total Nodes</div>
                <div className="text-xl font-bold text-white">
                  {currentStory.nodes.length}
                </div>
              </div>
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Chapters</div>
                <div className="text-xl font-bold text-white">
                  {currentStory.chapters.length}
                </div>
              </div>
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Characters</div>
                <div className="text-xl font-bold text-white">
                  {currentStory.characters.length}
                </div>
              </div>
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Locations</div>
                <div className="text-xl font-bold text-white">
                  {currentStory.locations.length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Last Updated */}
        {currentStory?.updatedAt && (
          <div className="text-xs text-slate-500 text-center pt-2">
            Last updated: {new Date(currentStory.updatedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}
