import { useCallback, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { useStoryStore } from '../../store/storyStore'
import type { NodeType } from '../../types/story'

// Import custom node components
import StartNode from './nodes/StartNode'
import DialogueNode from './nodes/DialogueNode'
import ChoiceNode from './nodes/ChoiceNode'
import BranchNode from './nodes/BranchNode'
import VariableNode from './nodes/VariableNode'
import EndNode from './nodes/EndNode'

// Define node types for React Flow
const nodeTypes = {
  start: StartNode,
  dialogue: DialogueNode,
  choice: ChoiceNode,
  branch: BranchNode,
  variable: VariableNode,
  end: EndNode,
}

export default function StoryCanvas() {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    setNodes,
    setEdges,
    addEdge: addStoreEdge,
    setSelectedNodeId,
    deleteNode,
    deleteEdge,
  } = useStoryStore()

  const [nodes, _setNodesState, onNodesChange] = useNodesState(storeNodes)
  const [edges, setEdgesState, onEdgesChange] = useEdgesState(storeEdges)
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  // Sync React Flow state with Zustand store
  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes)
      // Get updated nodes from React Flow's internal state
      setNodes(nodes)
    },
    [onNodesChange, setNodes, nodes]
  )

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes)
      // Get updated edges from React Flow's internal state
      setEdges(edges)
    },
    [onEdgesChange, setEdges, edges]
  )

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const edge: Edge = {
        id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'smoothstep',
        animated: true,
      }
      
      const nextEdges = addEdge(edge, edges)
      setEdgesState(nextEdges)
      setEdges(nextEdges)
      addStoreEdge(edge)
    },
    [edges, setEdgesState, setEdges, addStoreEdge]
  )

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id)
    },
    [setSelectedNodeId]
  )

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [setSelectedNodeId])

  // Keyboard shortcuts
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Delete selected nodes
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedNodes = nodes.filter((node) => node.selected)
        const selectedEdges = edges.filter((edge) => edge.selected)
        
        selectedNodes.forEach((node) => deleteNode(node.id))
        selectedEdges.forEach((edge) => deleteEdge(edge.id))
      }
    },
    [nodes, edges, deleteNode, deleteEdge]
  )

  return (
    <div
      ref={reactFlowWrapper}
      style={{ width: '100%', height: '100%' }}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#334155" gap={20} size={1} />
        <Controls className="!bg-slate-800 !border-slate-700" />
        <MiniMap
          className="!bg-slate-800 !border-slate-700"
          nodeColor={(node) => {
            const colors: Record<NodeType, string> = {
              start: '#22c55e',
              dialogue: '#3b82f6',
              choice: '#a855f7',
              branch: '#f97316',
              variable: '#06b6d4',
              end: '#ef4444',
            }
            return colors[node.type as NodeType] || '#64748b'
          }}
        />
      </ReactFlow>
    </div>
  )
}
