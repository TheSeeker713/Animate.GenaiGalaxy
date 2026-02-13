import { useState } from 'react'
import { useStoryStore } from '../../store/storyStore'
import type { StoryLocation } from '../../types/story'
import { MediaUploader } from '../common/MediaUploader'

export default function LocationDatabase() {
  const locations = useStoryStore((state) => state.locations)
  const addLocation = useStoryStore((state) => state.addLocation)
  const updateLocation = useStoryStore((state) => state.updateLocation)
  const deleteLocation = useStoryStore((state) => state.deleteLocation)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<StoryLocation>>({
    name: '',
    description: '',
    connectedLocations: [],
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)

  const filteredLocations = locations.filter((loc) =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAdd = () => {
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      connectedLocations: [],
    })
    setShowForm(true)
  }

  const handleEdit = (location: StoryLocation) => {
    setEditingId(location.id)
    setFormData(location)
    setShowForm(true)
  }

  const handleSave = () => {
    if (!formData.name?.trim()) {
      alert('Location name is required')
      return
    }

    if (editingId) {
      updateLocation(editingId, formData)
    } else {
      addLocation(formData as Omit<StoryLocation, 'id' | 'sceneCount'>)
    }

    setShowForm(false)
    setFormData({
      name: '',
      description: '',
      connectedLocations: [],
    })
    setEditingId(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      connectedLocations: [],
    })
  }

  const handleDelete = (id: string) => {
    const location = locations.find(l => l.id === id)
    if (!location) return

    const usageCount = location.sceneCount || 0
    if (usageCount > 0) {
      const confirmed = confirm(
        `"${location.name}" is used in ${usageCount} node(s). Delete anyway?`
      )
      if (!confirmed) return
    }

    deleteLocation(id)
  }

  const removeConnectedLocation = (index: number) => {
    setFormData({
      ...formData,
      connectedLocations: formData.connectedLocations?.filter((_, i) => i !== index) || [],
    })
  }

  return (
    <div className="h-full flex flex-col bg-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">🗺️ Locations</h2>
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
          >
            + Add Location
          </button>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search locations..."
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
        />
      </div>

      {/* Location List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredLocations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">📍</div>
            <p className="text-slate-400 text-sm">
              {searchQuery ? 'No locations found' : 'No locations yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAdd}
                className="mt-4 text-green-400 hover:text-green-300 text-sm"
              >
                Create your first location
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredLocations.map((location) => {
              const usageCount = location.sceneCount || 0
              return (
                <div
                  key={location.id}
                  className="bg-slate-700/50 rounded-lg overflow-hidden border border-slate-600 hover:border-slate-500 transition-colors"
                >
                  {/* Background Image */}
                  {location.backgroundImage && (
                    <div className="h-32 bg-slate-700 overflow-hidden">
                      <img
                        src={location.backgroundImage.url}
                        alt={location.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-white font-semibold flex-1">
                        {location.name}
                      </h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(location)}
                          className="p-1.5 text-green-400 hover:text-green-300 hover:bg-slate-600 rounded transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(location.id)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-slate-600 rounded transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {location.description && (
                      <p className="text-slate-300 text-sm mb-3 line-clamp-2">
                        {location.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>
                        📍 {usageCount} scene{usageCount !== 1 ? 's' : ''}
                      </span>
                      {location.connectedLocations && location.connectedLocations.length > 0 && (
                        <span>
                          🔗 {location.connectedLocations.length} connection{location.connectedLocations.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingId ? 'Edit Location' : 'New Location'}
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
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                  placeholder="Location name"
                  autoFocus
                />
              </div>

              {/* Background Image */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Background Image (Optional)
                </label>
                <MediaUploader
                  current={formData.backgroundImage}
                  onUpload={(media) => setFormData({ ...formData, backgroundImage: media })}
                  onRemove={() => setFormData({ ...formData, backgroundImage: undefined })}
                  compact={false}
                  accept="image/*"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-green-500 resize-none"
                  placeholder="Atmosphere, key features, story significance..."
                />
              </div>

              {/* Connected Locations */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Connected Locations (Optional)
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value && !formData.connectedLocations?.includes(e.target.value)) {
                      setFormData({
                        ...formData,
                        connectedLocations: [...(formData.connectedLocations || []), e.target.value],
                      })
                    }
                    e.target.value = ''
                  }}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                  value=""
                >
                  <option value="">Select location to connect...</option>
                  {locations
                    .filter(l => l.id !== editingId && !formData.connectedLocations?.includes(l.id))
                    .map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                </select>
                {formData.connectedLocations && formData.connectedLocations.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {formData.connectedLocations.map((locId, i) => {
                      const loc = locations.find(l => l.id === locId)
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2 bg-slate-700 rounded"
                        >
                          <span className="flex-1 text-slate-200 text-sm">
                            {loc?.name || locId}
                          </span>
                          <button
                            onClick={() => removeConnectedLocation(i)}
                            className="text-slate-400 hover:text-white"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )
                    })}
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
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
              >
                {editingId ? 'Save Changes' : 'Create Location'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
