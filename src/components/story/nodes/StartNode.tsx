import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import type { StartNodeData } from '../../../types/story'

export default memo(({ data, selected }: NodeProps<StartNodeData>) => {
  return (
    <div
      className={`px-6 py-4 rounded-2xl border-2 shadow-lg transition-all ${
        selected
          ? 'border-green-400 shadow-green-500/50'
          : 'border-green-600 shadow-green-900/30'
      } bg-gradient-to-br from-green-500 to-green-600`}
      style={{ minWidth: 180 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🚀</span>
        <div className="text-white font-bold text-sm">START</div>
      </div>
      <div className="text-white/90 text-xs font-medium">
        {data.label || 'Story Start'}
      </div>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-green-300 !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  )
})
