import { useState } from 'react'
import { useStoryStore } from '../../store/storyStore'
import type { Chapter } from '../../types/story'

export default function ChapterPanel() {
  const chapters = useStoryStore((state) => state.chapters)
  const nodes = useStoryStore((state) => state.nodes)
  const addChapter = useStoryStore((state) => state.addChapter)
  const updateChapter = useStoryStore((state) => state.updateChapter)
  const deleteChapter = useStoryStore((state) => state.deleteChapter)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<Partial<Chapter>>({
    name: '',
    description: '',
    color: '#3b82f6',
  })

  // Sort chapters by order
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order)

  const handleAdd = () => {
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
    })
    setShowForm(true)
  }

  const handleEdit = (chapter: Chapter) => {
    setEditingId(chapter.id)
    setFormData(chapter)
    setShowForm(true)
  }

  const handleSave = () => {
    if (!formData.name?.trim()) {
      alert('Chapter name is required')
      return
    }

    if (editingId) {
      updateChapter(editingId, formData)
    } else {
      addChapter(formData as Omit<Chapter, 'id'>)
    }

    setShowForm(false)
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
    })
    setEditingId(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
    })
  }

  const handleDelete = (id: string) => {
    const chapter = chapters.find(c => c.id === id)
    if (!chapter) return

    const nodeCount = chapter.nodeIds.length
    if (nodeCount > 0) {
      const confirmed = confirm(
        `"${chapter.name}" contains ${nodeCount} node(s). Delete anyway? Nodes will be unassigned.`
      )
      if (!confirmed) return
    }

    deleteChapter(id)
  }

  const moveChapterUp = (chapter: Chapter) => {
    if (chapter.order === 0) return
    const newOrder = chapter.order - 1
    updateChapter(chapter.id, { order: newOrder })
    
    // Swap with the chapter above
    const chapterAbove = sortedChapters.find(c => c.order === newOrder)
    if (chapterAbove) {
      updateChapter(chapterAbove.id, { order: chapter.order })
    }
  }

  const moveChapterDown = (chapter: Chapter) => {
    if (chapter.order === sortedChapters.length - 1) return
    const newOrder = chapter.order + 1
    updateChapter(chapter.id, { order: newOrder })
    
    // Swap with the chapter below
    const chapterBelow = sortedChapters.find(c => c.order === newOrder)
    if (chapterBelow) {
      updateChapter(chapterBelow.id, { order: chapter.order })
    }
  }

  const toggleCollapsed = (chapter: Chapter) => {
    updateChapter(chapter.id, { collapsed: !chapter.collapsed })
  }

  const getUnassignedNodes = () => {
    const assignedNodeIds = new Set(chapters.flatMap(c => c.nodeIds))
    return nodes.filter(n => !assignedNodeIds.has(n.id))
  }

  const colorPresets = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', 
    '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'
  ]

  return (
    <div className="h-full flex flex-col bg-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">📚 Chapters</h2>
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
          >
            + Add Chapter
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Organize your story into acts, chapters, or scenes
        </p>
      </div>

      {/* Chapter List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sortedChapters.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">📖</div>
            <p className="text-slate-400 text-sm mb-4">
              No chapters yet
            </p>
            <button
              onClick={handleAdd}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Create your first chapter
            </button>
          </div>
        ) : (
          sortedChapters.map((chapter, index) => (
            <div
              key={chapter.id}
              className="bg-slate-700/50 rounded-lg border border-slate-600 overflow-hidden"
            >
              {/* Chapter Header */}
              <div className="p-3 flex items-center gap-3">
                {/* Color Badge */}
                <div
                  className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: chapter.color }}
                >
                  {index + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">
                    {chapter.name}
                  </h3>
                  {chapter.description && (
                    <p className="text-slate-400 text-xs truncate">
                      {chapter.description}
                    </p>
                  )}
                  <div className="text-xs text-slate-500 mt-1">
                    {chapter.nodeIds.length} node{chapter.nodeIds.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => moveChapterUp(chapter)}
                    disabled={chapter.order === 0}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move up"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveChapterDown(chapter)}
                    disabled={chapter.order === sortedChapters.length - 1}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => toggleCollapsed(chapter)}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title={chapter.collapsed ? 'Expand' : 'Collapse'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {chapter.collapsed ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      )}
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEdit(chapter)}
                    className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(chapter.id)}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Node List (if not collapsed) */}
              {!chapter.collapsed && chapter.nodeIds.length > 0 && (
                <div className="px-3 pb-3 space-y-1">
                  {chapter.nodeIds.map(nodeId => {
                    const node = nodes.find(n => n.id === nodeId)
                    if (!node) return null
                    return (
                      <div
                        key={nodeId}
                        className="flex items-center gap-2 p-2 bg-slate-800/50 rounded text-xs"
                      >
                        <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                        <span className="text-slate-300">
                          {node.data.label || node.data.characterName || node.type}
                        </span>
                        <span className="text-slate-500 ml-auto">
                          {node.type}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))
        )}

        {/* Unassigned Nodes */}
        {getUnassignedNodes().length > 0 && (
          <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600 border-dashed">
            <div className="text-sm font-medium text-slate-400 mb-2">
              📌 Unassigned Nodes ({getUnassignedNodes().length})
            </div>
            <div className="text-xs text-slate-500">
              {getUnassignedNodes().length} node{getUnassignedNodes().length !== 1 ? 's' : ''} not assigned to any chapter
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-lg">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingId ? 'Edit Chapter' : 'New Chapter'}
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
            <div className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Chapter Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Act 1: The Beginning"
                  autoFocus
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
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Brief description of this chapter..."
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  {colorPresets.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded transition-all ${
                        formData.color === color
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={formData.color || '#3b82f6'}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-8 h-8 bg-slate-700 border border-slate-600 rounded cursor-pointer"
                  />
                </div>
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
                {editingId ? 'Save Changes' : 'Create Chapter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
