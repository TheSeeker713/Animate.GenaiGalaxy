import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import type { DialogueNodeData } from '../../../types/story'

export default memo(({ data, selected }: NodeProps<DialogueNodeData>) => {
  return (
    <div
      className={`px-4 py-3 rounded-xl border-2 shadow-lg transition-all ${
        selected
          ? 'border-blue-400 shadow-blue-500/50'
          : 'border-blue-600 shadow-blue-900/30'
      } bg-gradient-to-br from-blue-500 to-blue-600`}
      style={{ minWidth: 220, maxWidth: 280 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">💬</span>
        <div className="text-white font-bold text-xs">DIALOGUE</div>
      </div>
      
      <div className="bg-white/10 rounded-lg p-2 mb-2">
        <div className="text-white/80 text-xs font-semibold mb-1">
          {data.characterName || 'Character'}
        </div>
        <div className="text-white text-sm line-clamp-3">
          {data.text || 'Enter dialogue text...'}
        </div>
      </div>
      
      {data.expression && (
        <div className="text-xs text-white/60">
          Expression: {data.expression}
        </div>
      )}
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-blue-300 !w-3 !h-3 !border-2 !border-white"
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-blue-300 !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  )
})
