import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import type { VariableNodeData } from '../../../types/story'

export default memo(({ data, selected }: NodeProps<VariableNodeData>) => {
  return (
    <div
      className={`px-4 py-3 rounded-xl border-2 shadow-lg transition-all ${
        selected
          ? 'border-cyan-400 shadow-cyan-500/50'
          : 'border-cyan-600 shadow-cyan-900/30'
      } bg-gradient-to-br from-cyan-500 to-cyan-600`}
      style={{ minWidth: 180 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">⚙️</span>
        <div className="text-white font-bold text-xs">VARIABLE</div>
      </div>
      
      <div className="bg-white/10 rounded px-2 py-1.5 space-y-1">
        <div className="text-xs text-white/70">Key:</div>
        <div className="text-sm text-white font-mono">
          {data.key || 'variable'}
        </div>
        
        <div className="text-xs text-white/70 mt-2">Operation:</div>
        <div className="text-sm text-white font-semibold capitalize">
          {data.operation || 'set'}
        </div>
        
        <div className="text-xs text-white/70 mt-2">Value:</div>
        <div className="text-sm text-white font-mono">
          {String(data.value ?? 0)}
        </div>
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-cyan-300 !w-3 !h-3 !border-2 !border-white"
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-cyan-300 !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  )
})
