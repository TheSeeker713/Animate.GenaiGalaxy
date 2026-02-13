import { useState } from 'react'
import { useStoryStore } from '../../store/storyStore'
import type { StoryItem } from '../../types/story'

export default function ItemDatabase() {
  const items = useStoryStore((state) => state.items)
  const addItem = useStoryStore((state) => state.addItem)
  const updateItem = useStoryStore((state) => state.updateItem)
  const deleteItem = useStoryStore((state) => state.deleteItem)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<StoryItem>>({
    name: '',
    description: '',
    category: 'key-item',
    icon: '🔑',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)

  const categories = [
    { value: 'key-item', label: 'Key Item', icon: '🔑' },
    { value: 'consumable', label: 'Consumable', icon: '🧪' },
    { value: 'equipment', label: 'Equipment', icon: '⚔️' },
    { value: 'collectible', label: 'Collectible', icon: '💎' },
    { value: 'quest', label: 'Quest Item', icon: '📜' },
    { value: 'other', label: 'Other', icon: '📦' },
  ]

  const commonIcons = [
    '🔑', '🗝️', '💎', '⚔️', '🛡️', '🧪', '📜', '📖', '💰', '🪙',
    '🏆', '👑', '💍', '🔮', '🎁', '📦', '🧰', '🔧', '🔨', '🏹',
  ]

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAdd = () => {
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      category: 'key-item',
      icon: '🔑',
    })
    setShowForm(true)
  }

  const handleEdit = (item: StoryItem) => {
    setEditingId(item.id)
    setFormData(item)
    setShowForm(true)
  }

  const handleSave = () => {
    if (!formData.name?.trim()) {
      alert('Item name is required')
      return
    }

    if (editingId) {
      updateItem(editingId, formData)
    } else {
      addItem(formData as Omit<StoryItem, 'id'>)
    }

    setShowForm(false)
    setFormData({
      name: '',
      description: '',
      category: 'key-item',
      icon: '🔑',
    })
    setEditingId(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      category: 'key-item',
      icon: '🔑',
    })
  }

  const handleDelete = (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return

    const confirmed = confirm(
      `Delete "${item.name}"?${item.variableName ? ' This will not affect the story variable.' : ''}`
    )
    if (!confirmed) return

    deleteItem(id)
  }

  return (
    <div className="h-full flex flex-col bg-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">📦 Items</h2>
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors"
          >
            + Add Item
          </button>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search items..."
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">📦</div>
            <p className="text-slate-400 text-sm">
              {searchQuery ? 'No items found' : 'No items yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAdd}
                className="mt-4 text-purple-400 hover:text-purple-300 text-sm"
              >
                Create your first item
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredItems.map((item) => {
              const category = categories.find(c => c.value === item.category)
              return (
                <div
                  key={item.id}
                  className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-lg bg-slate-600 flex items-center justify-center text-2xl flex-shrink-0">
                      {item.icon || '📦'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-white font-semibold text-sm truncate">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1 text-purple-400 hover:text-purple-300 hover:bg-slate-600 rounded transition-colors"
                            title="Edit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-slate-600 rounded transition-colors"
                            title="Delete"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="mb-2">
                        <span className="inline-block px-2 py-0.5 bg-slate-600 text-slate-200 text-xs rounded">
                          {category?.label || item.category}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-slate-300 text-xs mb-2 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {item.variableName && (
                        <div className="text-xs text-slate-400">
                          <code className="font-mono">{item.variableName}</code>
                        </div>
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
          <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingId ? 'Edit Item' : 'New Item'}
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
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                  placeholder="Item name"
                  autoFocus
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Category
                </label>
                <select
                  value={formData.category || 'key-item'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-10 gap-2 mb-2">
                  {commonIcons.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors ${
                        formData.icon === icon
                          ? 'bg-purple-500 ring-2 ring-purple-400'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.icon || ''}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                  placeholder="Or type any emoji"
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
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="What does this item do?"
                />
              </div>

              {/* Variable Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Variable Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.variableName || ''}
                  onChange={(e) => setFormData({ ...formData, variableName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-purple-500"
                  placeholder="hasKey"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Link to a story variable to track ownership
                </p>
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
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors"
              >
                {editingId ? 'Save Changes' : 'Create Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
