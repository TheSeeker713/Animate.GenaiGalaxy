import type { Node } from 'reactflow'
import type { VariableNodeData } from '../../../types/story'
import { useStoryStore } from '../../../store/storyStore'

interface VariableNodeInspectorProps {
  node: Node<VariableNodeData>
}

export default function VariableNodeInspector({ node }: VariableNodeInspectorProps) {
  const updateNodeData = useStoryStore((state) => state.updateNodeData)

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(node.id, { key: e.target.value })
  }

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Try to parse as number, otherwise keep as string
    let value: any = e.target.value
    if (!isNaN(Number(value)) && value !== '') {
      value = Number(value)
    } else if (value === 'true') {
      value = true
    } else if (value === 'false') {
      value = false
    }
    updateNodeData(node.id, { value })
  }

  const handleOperationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(node.id, { 
      operation: e.target.value as 'set' | 'add' | 'subtract' | 'toggle' 
    })
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
      {/* Variable Name */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Variable Name
        </label>
        <input
          type="text"
          value={node.data.key || ''}
          onChange={handleKeyChange}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-cyan-500"
          placeholder="myVariable"
        />
        <p className="mt-1 text-xs text-slate-400">
          Use camelCase, no spaces
        </p>
      </div>

      {/* Operation */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Operation
        </label>
        <select
          value={node.data.operation || 'set'}
          onChange={handleOperationChange}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="set">Set (=)</option>
          <option value="add">Add (+=)</option>
          <option value="subtract">Subtract (-=)</option>
          <option value="toggle">Toggle (boolean)</option>
        </select>
      </div>

      {/* Value */}
      {node.data.operation !== 'toggle' && (
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Value
          </label>
          <input
            type="text"
            value={String(node.data.value ?? '')}
            onChange={handleValueChange}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-cyan-500"
            placeholder="0"
          />
          <p className="mt-1 text-xs text-slate-400">
            Number, text, or true/false
          </p>
        </div>
      )}

      {/* Preview */}
      <div className="p-3 bg-slate-700/50 rounded-lg">
        <div className="text-xs text-slate-400 mb-1">Result:</div>
        <code className="text-sm text-cyan-400 font-mono">
          {node.data.key || 'variable'} 
          {node.data.operation === 'set' && ' = '}
          {node.data.operation === 'add' && ' += '}
          {node.data.operation === 'subtract' && ' -= '}
          {node.data.operation === 'toggle' && ' = !'}
          {node.data.operation !== 'toggle' && String(node.data.value ?? 0)}
          {node.data.operation === 'toggle' && (node.data.key || 'variable')}
        </code>
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
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 resize-none"
          placeholder="Notes about this variable..."
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
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
          placeholder="e.g., tracking, score"
        />
      </div>

      <div className="pt-4 border-t border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-2">⚙️ Examples</h3>
        <ul className="space-y-1 text-xs text-slate-400">
          <li>• <code className="font-mono">score</code> = 0 (initialize)</li>
          <li>• <code className="font-mono">score</code> += 10 (increase)</li>
          <li>• <code className="font-mono">hasKey</code> = true (flag)</li>
        </ul>
      </div>
    </div>
  )
}
