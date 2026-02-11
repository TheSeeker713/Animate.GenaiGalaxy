import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import type { ChoiceNodeData } from '../../../types/story'

export default memo(({ data, selected }: NodeProps<ChoiceNodeData>) => {
  return (
    <div
      className={`px-4 py-3 rounded-xl border-2 shadow-lg transition-all ${
        selected
          ? 'border-purple-400 shadow-purple-500/50'
          : 'border-purple-600 shadow-purple-900/30'
      } bg-gradient-to-br from-purple-500 to-purple-600`}
      style={{ minWidth: 200 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🔀</span>
        <div className="text-white font-bold text-xs">CHOICE</div>
      </div>
      
      <div className="text-white/90 text-sm font-medium mb-2">
        {data.prompt || 'Choose your path'}
      </div>
      
      <div className="space-y-1">
        {data.choices?.map((choice, index) => (
          <div
            key={choice.id}
            className="bg-white/10 rounded px-2 py-1 text-xs text-white/80"
          >
            {index + 1}. {choice.text}
          </div>
        ))}
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-purple-300 !w-3 !h-3 !border-2 !border-white"
      />
      
      {/* Output handles - one for each choice */}
      {data.choices?.map((choice, index) => (
        <Handle
          key={choice.id}
          type="source"
          position={Position.Right}
          id={choice.id}
          className="!bg-purple-300 !w-3 !h-3 !border-2 !border-white"
          style={{ top: `${50 + (index - data.choices.length / 2 + 0.5) * 25}%` }}
        />
      ))}
    </div>
  )
})
