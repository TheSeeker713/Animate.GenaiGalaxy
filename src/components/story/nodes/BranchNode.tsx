import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import type { BranchNodeData } from '../../../types/story'

export default memo(({ data, selected }: NodeProps<BranchNodeData>) => {
  return (
    <div
      className={`px-4 py-3 rounded-xl border-2 shadow-lg transition-all ${
        selected
          ? 'border-orange-400 shadow-orange-500/50'
          : 'border-orange-600 shadow-orange-900/30'
      } bg-gradient-to-br from-orange-500 to-orange-600`}
      style={{ minWidth: 180 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🌿</span>
        <div className="text-white font-bold text-xs">BRANCH</div>
      </div>
      
      <div className="bg-white/10 rounded px-2 py-1 mb-2">
        <code className="text-xs text-white/90 font-mono">
          {data.condition || 'condition'}
        </code>
      </div>
      
      {data.description && (
        <div className="text-xs text-white/70">
          {data.description}
        </div>
      )}
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-orange-300 !w-3 !h-3 !border-2 !border-white"
      />
      
      {/* True output */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="!bg-green-400 !w-3 !h-3 !border-2 !border-white"
        style={{ top: '35%' }}
      />
      
      {/* False output */}
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        className="!bg-red-400 !w-3 !h-3 !border-2 !border-white"
        style={{ top: '65%' }}
      />
      
      {/* Labels */}
      <div className="absolute -right-12 top-[calc(35%-10px)] text-xs text-green-400 font-bold">
        TRUE
      </div>
      <div className="absolute -right-12 top-[calc(65%-10px)] text-xs text-red-400 font-bold">
        FALSE
      </div>
    </div>
  )
})
