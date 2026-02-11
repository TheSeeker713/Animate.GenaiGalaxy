import { useStoryStore } from '../../store/storyStore'
import type { NodeType } from '../../types/story'

interface NodePaletteItem {
  type: NodeType
  icon: string
  label: string
  description: string
  color: string
}

const nodeTypes: NodePaletteItem[] = [
  {
    type: 'start',
    icon: '🚀',
    label: 'Start',
    description: 'Entry point of the story',
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    type: 'dialogue',
    icon: '💬',
    label: 'Dialogue',
    description: 'Character speaks',
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    type: 'choice',
    icon: '🔀',
    label: 'Choice',
    description: 'Player makes a decision',
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    type: 'branch',
    icon: '🌿',
    label: 'Branch',
    description: 'Conditional logic',
    color: 'bg-orange-500 hover:bg-orange-600',
  },
  {
    type: 'variable',
    icon: '⚙️',
    label: 'Variable',
    description: 'Store data',
    color: 'bg-cyan-500 hover:bg-cyan-600',
  },
  {
    type: 'end',
    icon: '🏁',
    label: 'End',
    description: 'Story conclusion',
    color: 'bg-red-500 hover:bg-red-600',
  },
]

export default function NodePalette() {
  const addNode = useStoryStore((state) => state.addNode)

  const handleAddNode = (type: NodeType) => {
    // Add node in center of viewport
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
    }
    addNode(type, position)
  }

  return (
    <div className="w-64 bg-slate-800 border-r border-slate-700 p-4 overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white mb-1">Node Palette</h2>
        <p className="text-sm text-slate-400">Click to add nodes</p>
      </div>

      <div className="space-y-2">
        {nodeTypes.map((nodeType) => (
          <button
            key={nodeType.type}
            onClick={() => handleAddNode(nodeType.type)}
            className={`w-full text-left p-3 rounded-lg transition-all border-2 border-transparent hover:border-white/20 ${nodeType.color}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{nodeType.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm mb-0.5">
                  {nodeType.label}
                </div>
                <div className="text-xs text-white/80 leading-tight">
                  {nodeType.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-700">
        <h3 className="text-sm font-bold text-white mb-2">Keyboard Shortcuts</h3>
        <div className="space-y-1 text-xs text-slate-400">
          <div className="flex justify-between">
            <span>Delete Node</span>
            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">
              Del
            </kbd>
          </div>
          <div className="flex justify-between">
            <span>Undo</span>
            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">
              Ctrl+Z
            </kbd>
          </div>
          <div className="flex justify-between">
            <span>Redo</span>
            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">
              Ctrl+Y
            </kbd>
          </div>
        </div>
      </div>
    </div>
  )
}
