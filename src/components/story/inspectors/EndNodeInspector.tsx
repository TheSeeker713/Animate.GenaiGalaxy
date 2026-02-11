import type { Node } from 'reactflow'
import type { EndNodeData } from '../../../types/story'
import { useStoryStore } from '../../../store/storyStore'

interface EndNodeInspectorProps {
  node: Node<EndNodeData>
}

export default function EndNodeInspector({ node }: EndNodeInspectorProps) {
  const updateNodeData = useStoryStore((state) => state.updateNodeData)

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(node.id, { label: e.target.value })
  }

  const handleEndTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(node.id, { 
      endType: e.target.value as 'victory' | 'defeat' | 'neutral' 
    })
  }

  const endTypeInfo = {
    victory: { icon: '🏆', color: 'text-green-400', desc: 'Positive outcome' },
    defeat: { icon: '💀', color: 'text-red-400', desc: 'Negative outcome' },
    neutral: { icon: '🏁', color: 'text-gray-400', desc: 'Standard ending' },
  }

  const info = endTypeInfo[node.data.endType || 'neutral']

  return (
    <div className="space-y-4">
      {/* Label */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Ending Label
        </label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={handleLabelChange}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
          placeholder="The End"
        />
        <p className="mt-1 text-xs text-slate-400">
          Shown to player at story conclusion
        </p>
      </div>

      {/* End Type */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Ending Type
        </label>
        <select
          value={node.data.endType || 'neutral'}
          onChange={handleEndTypeChange}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
        >
          <option value="victory">🏆 Victory</option>
          <option value="defeat">💀 Defeat</option>
          <option value="neutral">🏁 Neutral</option>
        </select>
      </div>

      {/* Preview */}
      <div className={`p-4 bg-slate-700/50 rounded-lg border-2 ${
        node.data.endType === 'victory' ? 'border-green-500/30' :
        node.data.endType === 'defeat' ? 'border-red-500/30' :
        'border-gray-500/30'
      }`}>
        <div className="text-center">
          <div className="text-4xl mb-2">{info.icon}</div>
          <div className="text-lg text-white font-bold mb-1">
            {node.data.label || 'The End'}
          </div>
          <div className={`text-xs ${info.color}`}>
            {info.desc}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-2">🏁 Tips</h3>
        <ul className="space-y-1 text-xs text-slate-400">
          <li>• End nodes stop story playback</li>
          <li>• Can have multiple endings</li>
          <li>• Choose type based on outcome</li>
        </ul>
      </div>
    </div>
  )
}
