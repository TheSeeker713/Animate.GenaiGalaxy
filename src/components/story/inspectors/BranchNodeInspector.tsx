import type { Node } from 'reactflow'
import type { BranchNodeData } from '../../../types/story'
import { useStoryStore } from '../../../store/storyStore'

interface BranchNodeInspectorProps {
  node: Node<BranchNodeData>
}

export default function BranchNodeInspector({ node }: BranchNodeInspectorProps) {
  const updateNodeData = useStoryStore((state) => state.updateNodeData)

  const handleConditionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(node.id, { condition: e.target.value })
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(node.id, { description: e.target.value })
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
      {/* Condition */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Condition
        </label>
        <input
          type="text"
          value={node.data.condition || ''}
          onChange={handleConditionChange}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-orange-500"
          placeholder="score > 10"
        />
        <p className="mt-1 text-xs text-slate-400">
          JavaScript-style condition
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Description (Optional)
        </label>
        <input
          type="text"
          value={node.data.description || ''}
          onChange={handleDescriptionChange}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
          placeholder="Check if player has enough points"
        />
        <p className="mt-1 text-xs text-slate-400">
          Human-readable explanation
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
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500 resize-none"
          placeholder="Notes about this branch logic..."
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
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
          placeholder="e.g., conditional, logic"
        />
      </div>

      {/* Output Ports Info */}
      <div className="p-3 bg-slate-700/50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <span className="text-xs text-slate-300 font-medium">TRUE</span>
          <span className="text-xs text-slate-400">→ Top output port</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <span className="text-xs text-slate-300 font-medium">FALSE</span>
          <span className="text-xs text-slate-400">→ Bottom output port</span>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-2">🌿 Examples</h3>
        <div className="space-y-1 text-xs text-slate-400 font-mono">
          <div>score {'>'} 10</div>
          <div>hasKey === true</div>
          <div>health {'<'}= 0</div>
          <div>level {'>'} 5 && coins {'>'} 100</div>
        </div>
      </div>
    </div>
  )
}
