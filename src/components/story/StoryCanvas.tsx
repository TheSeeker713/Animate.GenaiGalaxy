import { useCallback, useRef, useEffect, useState, useMemo } from 'react'
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
  type Viewport,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { useStoryStore } from '../../store/storyStore'
import type { NodeType } from '../../types/story'
import PerformanceMonitor from './PerformanceMonitor'

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

  const [nodes, setNodesState, onNodesChange] = useNodesState(storeNodes)
  const [edges, setEdgesState, onEdgesChange] = useEdgesState(storeEdges)
  
  // Viewport virtualization state
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 })
  const [enableVirtualization, setEnableVirtualization] = useState(storeNodes.length > 100)
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  // Enable/disable virtualization based on node count
  useEffect(() => {
    setEnableVirtualization(storeNodes.length > 100)
  }, [storeNodes.length])

  // Filter nodes based on viewport (with buffer zone)
  const visibleNodes = useMemo(() => {
    if (!enableVirtualization) return nodes
    
    const { x, y, zoom } = viewport
    const width = reactFlowWrapper.current?.clientWidth || 1000
    const height = reactFlowWrapper.current?.clientHeight || 800
    
    // Calculate viewport bounds with 2x buffer to preload nearby nodes
    const buffer = 2
    const minX = -x / zoom - (width * buffer) / zoom
    const maxX = -x / zoom + (width * (1 + buffer)) / zoom
    const minY = -y / zoom - (height * buffer) / zoom
    const maxY = -y / zoom + (height * (1 + buffer)) / zoom
    
    return nodes.filter((node) => {
      const nodeX = node.position.x
      const nodeY = node.position.y
      
      return (
        nodeX >= minX &&
        nodeX <= maxX &&
        nodeY >= minY &&
        nodeY <= maxY
      )
    })
  }, [nodes, viewport, enableVirtualization])

  // Filter edges to only show those connected to visible nodes
  const visibleEdges = useMemo(() => {
    if (!enableVirtualization) return edges
    
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id))
    return edges.filter(
      (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    )
  }, [edges, visibleNodes, enableVirtualization])

  // Sync store nodes to React Flow when store changes (e.g., from inspector)
  useEffect(() => {
    setNodesState(storeNodes)
  }, [storeNodes, setNodesState])

  // Sync store edges to React Flow when store changes
  useEffect(() => {
    setEdgesState(storeEdges)
  }, [storeEdges, setEdgesState])

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

  // Viewport change handler for virtualization
  const onViewportChange = useCallback((newViewport: Viewport) => {
    setViewport(newViewport)
  }, [])

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
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      {/* Performance Monitor */}
      <PerformanceMonitor />
      
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onMove={(_, newViewport) => onViewportChange(newViewport)}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        // Performance optimizations
        panOnScroll
        selectionOnDrag
        panOnDrag={[1, 2]}
        selectNodesOnDrag={false}
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
      
      {/* Virtualization Indicator */}
      {enableVirtualization && (
        <div className="absolute bottom-20 left-4 px-3 py-1.5 bg-slate-800/90 border border-slate-600 rounded-lg text-xs text-slate-300 flex items-center gap-2 z-10">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span>
            Showing {visibleNodes.length} of {nodes.length} nodes
          </span>
        </div>
      )}
      
      {/* Performance Warning */}
      {nodes.length > 1000 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-yellow-500/90 border border-yellow-400 rounded-lg text-sm text-yellow-900 font-medium z-10">
          ⚠️ Large graph ({nodes.length} nodes) - Performance may vary
        </div>
      )}
    </div>
  )
}
