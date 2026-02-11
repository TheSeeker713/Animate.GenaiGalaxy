import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import type { EndNodeData } from '../../../types/story'

export default memo(({ data, selected }: NodeProps<EndNodeData>) => {
  const endTypeColors = {
    victory: 'from-green-500 to-emerald-600 border-green-600',
    defeat: 'from-red-500 to-rose-600 border-red-600',
    neutral: 'from-gray-500 to-slate-600 border-gray-600',
  }
  
  const endTypeIcons = {
    victory: '🏆',
    defeat: '💀',
    neutral: '🏁',
  }
  
  const colorClass = endTypeColors[data.endType || 'neutral']
  const icon = endTypeIcons[data.endType || 'neutral']
  
  return (
    <div
      className={`px-6 py-4 rounded-2xl border-2 shadow-lg transition-all ${
        selected
          ? 'border-red-400 shadow-red-500/50'
          : colorClass
      } bg-gradient-to-br ${colorClass.split('border-')[0]}`}
      style={{ minWidth: 180 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <div className="text-white font-bold text-sm">END</div>
      </div>
      <div className="text-white/90 text-xs font-medium">
        {data.label || 'The End'}
      </div>
      {data.endType && (
        <div className="mt-1 text-xs text-white/60 capitalize">
          {data.endType}
        </div>
      )}
      
      {/* Input handle only */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-red-300 !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  )
})
