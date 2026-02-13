import type { Node } from 'reactflow'
import type { StartNodeData } from '../../../types/story'
import { useStoryStore } from '../../../store/storyStore'

interface StartNodeInspectorProps {
  node: Node<StartNodeData>
}

export default function StartNodeInspector({ node }: StartNodeInspectorProps) {
  const updateNodeData = useStoryStore((state) => state.updateNodeData)

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(node.id, { label: e.target.value })
  }
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(node.id, { notes: e.target.value })
  }
  
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
    updateNodeData(node.id, { tags })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Label
        </label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={handleLabelChange}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
          placeholder="Story Start"
        />
        <p className="mt-1 text-xs text-slate-400">
          The entry point of your story
        </p>
      </div>
      
      {/* Writer's Notes */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Notes (Internal)
        </label>
        <textarea
          value={node.data.notes || ''}
          onChange={handleNotesChange}
          rows={3}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-green-500 resize-none"
          placeholder="Internal notes about your story opening..."
        />
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
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
          placeholder="e.g., prologue, act1"
        />
      </div>

      <div className="pt-4 border-t border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-2">📌 Tips</h3>
        <ul className="space-y-1 text-xs text-slate-400">
          <li>• Only one Start node per story</li>
          <li>• Connect to a Dialogue or Choice node</li>
          <li>• This is where playback begins</li>
        </ul>
      </div>
    </div>
  )
}
