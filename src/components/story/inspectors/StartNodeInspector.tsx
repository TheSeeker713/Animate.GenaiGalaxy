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
