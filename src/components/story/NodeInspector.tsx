import { useStoryStore } from '../../store/storyStore'
import StartNodeInspector from './inspectors/StartNodeInspector'
import DialogueNodeInspector from './inspectors/DialogueNodeInspector'
import ChoiceNodeInspector from './inspectors/ChoiceNodeInspector'
import BranchNodeInspector from './inspectors/BranchNodeInspector'
import VariableNodeInspector from './inspectors/VariableNodeInspector'
import EndNodeInspector from './inspectors/EndNodeInspector'

export default function NodeInspector() {
  const { nodes, selectedNodeId } = useStoryStore()
  
  const selectedNode = nodes.find((node) => node.id === selectedNodeId)

  if (!selectedNode) {
    return (
      <div className="w-80 bg-slate-800 border-l border-slate-700 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold text-white mb-2">Node Inspector</h2>
        <p className="text-sm text-slate-400">
          Select a node to edit its properties.
        </p>
        <div className="mt-6 p-4 bg-slate-700/50 rounded-lg text-center">
          <div className="text-4xl mb-2">👆</div>
          <div className="text-xs text-slate-400">
            Click any node on the canvas to start editing
          </div>
        </div>
      </div>
    )
  }

  const renderInspector = () => {
    switch (selectedNode.type) {
      case 'start':
        return <StartNodeInspector node={selectedNode} />
      case 'dialogue':
        return <DialogueNodeInspector node={selectedNode} />
      case 'choice':
        return <ChoiceNodeInspector node={selectedNode} />
      case 'branch':
        return <BranchNodeInspector node={selectedNode} />
      case 'variable':
        return <VariableNodeInspector node={selectedNode} />
      case 'end':
        return <EndNodeInspector node={selectedNode} />
      default:
        return (
          <div className="text-sm text-slate-400">
            Unknown node type: {selectedNode.type}
          </div>
        )
    }
  }

  return (
    <div className="w-80 bg-slate-800 border-l border-slate-700 p-4 overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white mb-1">Node Inspector</h2>
        <div className="text-xs text-slate-400 capitalize">
          {selectedNode.type} Node
        </div>
      </div>
      
      {renderInspector()}
    </div>
  )
}
