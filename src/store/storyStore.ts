import { create } from 'zustand'
import type { 
  Story, 
  StoryNode, 
  StoryConnection, 
  NodeData, 
  NodeType,
  ImportedCharacter 
} from '../types/story'
import type { Node, Edge } from 'reactflow'

interface StoryStore {
  // Core state
  currentStory: Story | null
  nodes: Node[]
  edges: Edge[]
  variables: Record<string, any>
  
  // UI state
  selectedNodeId: string | null
  inspectorOpen: boolean
  previewMode: boolean
  previewStartNodeId: string | null
  
  // Character integration
  importedCharacters: ImportedCharacter[]
  
  // Playback state (for preview)
  currentNodeId: string | null
  playbackHistory: string[]
  playbackVariables: Record<string, any>
  
  // Undo/Redo
  history: Array<{ nodes: Node[]; edges: Edge[] }>
  historyIndex: number
  maxHistory: number
  
  // Actions - Node Management
  addNode: (type: NodeType, position: { x: number; y: number }) => void
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void
  deleteNode: (nodeId: string) => void
  setNodes: (nodes: Node[]) => void
  
  // Actions - Connection Management
  addEdge: (edge: Edge) => void
  deleteEdge: (edgeId: string) => void
  setEdges: (edges: Edge[]) => void
  
  // Actions - Selection
  setSelectedNodeId: (nodeId: string | null) => void
  toggleInspector: () => void
  
  // Actions - Character Integration
  importCharacter: (character: ImportedCharacter) => void
  
  // Actions - Preview
  startPreview: (startNodeId?: string) => void
  exitPreview: () => void
  navigateToNode: (nodeId: string) => void
  makeChoice: (choiceId: string, targetNodeId: string) => void
  goBack: () => void
  
  // Actions - Project Management
  newStory: (name: string) => void
  saveStory: () => void
  loadStory: (storyId: string) => void
  
  // Actions - Undo/Redo
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  addToHistory: () => void
}

const createDefaultNodeData = (type: NodeType): NodeData => {
  switch (type) {
    case 'start':
      return { type: 'start', label: 'Story Start' }
    case 'dialogue':
      return { 
        type: 'dialogue', 
        characterName: 'Character', 
        text: 'Enter dialogue text...' 
      }
    case 'choice':
      return { 
        type: 'choice', 
        prompt: 'Choose your path', 
        choices: [
          { id: 'choice1', text: 'Option 1' },
          { id: 'choice2', text: 'Option 2' }
        ]
      }
    case 'branch':
      return { type: 'branch', condition: 'variable === value' }
    case 'variable':
      return { type: 'variable', key: 'myVariable', value: 0, operation: 'set' }
    case 'end':
      return { type: 'end', label: 'The End', endType: 'neutral' }
  }
}

export const useStoryStore = create<StoryStore>((set, get) => ({
  // Initial state
  currentStory: null,
  nodes: [],
  edges: [],
  variables: {},
  selectedNodeId: null,
  inspectorOpen: true,
  previewMode: false,
  previewStartNodeId: null,
  importedCharacters: [],
  currentNodeId: null,
  playbackHistory: [],
  playbackVariables: {},
  history: [],
  historyIndex: -1,
  maxHistory: 50,
  
  // Node Management
  addNode: (type, position) => {
    const id = `${type}-${Date.now()}`
    const newNode: Node = {
      id,
      type,
      position,
      data: createDefaultNodeData(type),
    }
    
    set((state) => {
      const nodes = [...state.nodes, newNode]
      return { nodes, selectedNodeId: id }
    })
    
    get().addToHistory()
  },
  
  updateNodeData: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    }))
    
    get().addToHistory()
  },
  
  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }))
    
    get().addToHistory()
  },
  
  setNodes: (nodes) => {
    set({ nodes })
  },
  
  // Connection Management
  addEdge: (edge) => {
    set((state) => ({
      edges: [...state.edges, edge],
    }))
    
    get().addToHistory()
  },
  
  deleteEdge: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
    }))
    
    get().addToHistory()
  },
  
  setEdges: (edges) => {
    set({ edges })
  },
  
  // Selection
  setSelectedNodeId: (nodeId) => {
    set({ selectedNodeId: nodeId })
  },
  
  toggleInspector: () => {
    set((state) => ({ inspectorOpen: !state.inspectorOpen }))
  },
  
  // Character Integration
  importCharacter: (character) => {
    set((state) => ({
      importedCharacters: [...state.importedCharacters, character],
    }))
  },
  
  // Preview
  startPreview: (startNodeId) => {
    const { nodes } = get()
    const startNode = startNodeId 
      ? nodes.find((n) => n.id === startNodeId)
      : nodes.find((n) => n.type === 'start')
    
    if (startNode) {
      set({
        previewMode: true,
        currentNodeId: startNode.id,
        playbackHistory: [startNode.id],
        playbackVariables: { ...get().variables },
      })
    }
  },
  
  exitPreview: () => {
    set({
      previewMode: false,
      currentNodeId: null,
      playbackHistory: [],
      playbackVariables: {},
    })
  },
  
  navigateToNode: (nodeId) => {
    set((state) => ({
      currentNodeId: nodeId,
      playbackHistory: [...state.playbackHistory, nodeId],
    }))
  },
  
  makeChoice: (_choiceId, targetNodeId) => {
    get().navigateToNode(targetNodeId)
  },
  
  goBack: () => {
    set((state) => {
      if (state.playbackHistory.length <= 1) return state
      
      const newHistory = state.playbackHistory.slice(0, -1)
      const previousNodeId = newHistory[newHistory.length - 1]
      
      return {
        playbackHistory: newHistory,
        currentNodeId: previousNodeId,
      }
    })
  },
  
  // Project Management
  newStory: (name) => {
    const story: Story = {
      id: `story-${Date.now()}`,
      name,
      description: '',
      nodes: [],
      connections: [],
      variables: {},
      importedCharacters: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    // Add default start node
    const startNode: Node = {
      id: 'start-1',
      type: 'start',
      position: { x: 250, y: 100 },
      data: { type: 'start', label: 'Story Start' },
    }
    
    set({
      currentStory: story,
      nodes: [startNode],
      edges: [],
      variables: {},
      importedCharacters: [],
      selectedNodeId: null,
      history: [],
      historyIndex: -1,
    })
  },
  
  saveStory: () => {
    const { currentStory, nodes, edges, variables, importedCharacters } = get()
    
    if (!currentStory) return
    
    const updatedStory: Story = {
      ...currentStory,
      nodes: nodes as StoryNode[],
      connections: edges as StoryConnection[],
      variables,
      importedCharacters,
      updatedAt: new Date().toISOString(),
    }
    
    // Save to localStorage
    const storageKey = `story-${currentStory.id}`
    localStorage.setItem(storageKey, JSON.stringify(updatedStory))
    
    set({ currentStory: updatedStory })
  },
  
  loadStory: (storyId) => {
    const storageKey = `story-${storyId}`
    const saved = localStorage.getItem(storageKey)
    
    if (saved) {
      const story: Story = JSON.parse(saved)
      set({
        currentStory: story,
        nodes: story.nodes as Node[],
        edges: story.connections as Edge[],
        variables: story.variables,
        importedCharacters: story.importedCharacters,
        history: [],
        historyIndex: -1,
      })
    }
  },
  
  // Undo/Redo
  addToHistory: () => {
    const { nodes, edges, history, historyIndex, maxHistory } = get()
    
    // Remove any history after current index
    const newHistory = history.slice(0, historyIndex + 1)
    
    // Add current state
    newHistory.push({ nodes: [...nodes], edges: [...edges] })
    
    // Limit history size
    if (newHistory.length > maxHistory) {
      newHistory.shift()
    }
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    })
  },
  
  undo: () => {
    const { history, historyIndex } = get()
    
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1]
      set({
        nodes: [...previousState.nodes],
        edges: [...previousState.edges],
        historyIndex: historyIndex - 1,
      })
    }
  },
  
  redo: () => {
    const { history, historyIndex } = get()
    
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      set({
        nodes: [...nextState.nodes],
        edges: [...nextState.edges],
        historyIndex: historyIndex + 1,
      })
    }
  },
  
  canUndo: () => {
    const { historyIndex } = get()
    return historyIndex > 0
  },
  
  canRedo: () => {
    const { history, historyIndex } = get()
    return historyIndex < history.length - 1
  },
}))
