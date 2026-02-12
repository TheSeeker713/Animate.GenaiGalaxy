import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { throttle } from 'lodash-es'
import { nanoid } from 'nanoid'
import type { 
  Story, 
  StoryNode, 
  StoryConnection, 
  NodeData, 
  NodeType,
  ImportedCharacter 
} from '../types/story'
import type { Node, Edge } from 'reactflow'
import { eventBus, safeEmit } from '../utils/eventBus'
import { sanitizeText, validateCondition, enforceLimit } from '../utils/validators'
import { saveToIndexedDB, loadFromIndexedDB } from '../utils/storageManager'

// Limits to prevent performance issues
const MAX_NODES = 500
const MAX_EDGES = 500
const MAX_HISTORY = 20
const MAX_CHOICES = 8

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

// Helper function for throttled history management
function addHistoryEntry(draft: any) {
  // Remove any history after current index
  draft.history = draft.history.slice(0, draft.historyIndex + 1)
  
  // Add current state (deep clone to avoid reference issues)
  draft.history.push({ 
    nodes: JSON.parse(JSON.stringify(draft.nodes)), 
    edges: JSON.parse(JSON.stringify(draft.edges)) 
  })
  
  // Limit history size
  if (draft.history.length > MAX_HISTORY) {
    draft.history.shift()
  } else {
    draft.historyIndex = draft.history.length - 1
  }
}

// Throttled version to reduce overhead (500ms)
const throttledAddToHistory = throttle(addHistoryEntry, 500, { 
  leading: false, 
  trailing: true 
})

export const useStoryStore = create<StoryStore>()(
  immer((set, get) => ({
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
    const state = get()
    
    // Prevent adding nodes during preview
    if (state.previewMode) {
      console.warn('Cannot add nodes during preview mode')
      return
    }
    
    // Enforce node limit
    if (state.nodes.length >= MAX_NODES) {
      console.error(`Node limit reached (${MAX_NODES})`)
      alert(`Maximum ${MAX_NODES} nodes allowed. Please delete some nodes first.`)
      return
    }
    
    // Enforce single start node
    if (type === 'start' && state.nodes.some(n => n.type === 'start')) {
      console.warn('Only one start node allowed')
      return
    }
    
    const nodeId = `node-${nanoid(8)}`
    const newNode: Node = {
      id: nodeId,
      type,
      position,
      data: createDefaultNodeData(type)
    }
    
    set((draft) => {
      draft.nodes.push(newNode)
      throttledAddToHistory(draft)
    })
  },
  
  updateNodeData: (nodeId, data) => {
    try {
      // Sanitize text inputs
      if ('text' in data && typeof data.text === 'string') {
        data.text = sanitizeText(data.text)
      }
      if ('prompt' in data && typeof data.prompt === 'string') {
        data.prompt = sanitizeText(data.prompt)
      }
      
      // Validate conditions
      if ('condition' in data && typeof data.condition === 'string') {
        const validated = validateCondition(data.condition)
        if (!validated.valid) {
          console.warn('Invalid condition:', validated.error)
          return
        }
      }
      
      // Enforce choice limits
      if ('choices' in data && Array.isArray(data.choices)) {
        data.choices = enforceLimit(data.choices, MAX_CHOICES)
      }
      
      set((draft) => {
        const node = draft.nodes.find(n => n.id === nodeId)
        if (node) {
          node.data = { ...node.data, ...data }
          throttledAddToHistory(draft)
        }
      })
    } catch (error) {
      console.error('Failed to update node data:', error)
    }
  },
  
  deleteNode: (nodeId) => {
    const state = get()
    
    // Prevent deleting during preview
    if (state.previewMode) {
      console.warn('Cannot delete nodes during preview mode')
      return
    }
    
    // Don't allow deleting the only start node
    const node = state.nodes.find(n => n.id === nodeId)
    if (node?.type === 'start' && state.nodes.filter(n => n.type === 'start').length === 1) {
      console.warn('Cannot delete the only start node')
      alert('Cannot delete the only start node. Create a new start node first.')
      return
    }
    
    set((draft) => {
      draft.nodes = draft.nodes.filter((node) => node.id !== nodeId)
      draft.edges = draft.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      )
      if (draft.selectedNodeId === nodeId) {
        draft.selectedNodeId = null
      }
      throttledAddToHistory(draft)
    })
  },
  
  setNodes: (nodes) => {
    set((draft) => {
      draft.nodes = enforceLimit(nodes, MAX_NODES)
    })
  },
  
  // Connection Management
  addEdge: (edge) => {
    const state = get()
    
    // Enforce edge limit
    if (state.edges.length >= MAX_EDGES) {
      console.error(`Edge limit reached (${MAX_EDGES})`)
      return
    }
    
    set((draft) => {
      draft.edges.push(edge)
      throttledAddToHistory(draft)
    })
  },
  
  deleteEdge: (edgeId) => {
    set((draft) => {
      draft.edges = draft.edges.filter((edge) => edge.id !== edgeId)
      throttledAddToHistory(draft)
    })
  },
  
  setEdges: (edges) => {
    set((draft) => {
      draft.edges = enforceLimit(edges, MAX_EDGES)
    })
  },
  
  // Selection
  setSelectedNodeId: (nodeId) => {
    set((draft) => {
      draft.selectedNodeId = nodeId
    })
  },
  
  toggleInspector: () => {
    set((draft) => {
      draft.inspectorOpen = !draft.inspectorOpen
    })
  },
  
  // Character Integration
  importCharacter: (character) => {
    set((draft) => {
      draft.importedCharacters.push(character)
    })
  },
  
  // Preview Management
  startPreview: (startNodeId) => {
    const { nodes, variables } = get()
    const startNode = startNodeId 
      ? nodes.find((n) => n.id === startNodeId)
      : nodes.find((n) => n.type === 'start')
    
    if (!startNode) {
      console.error('No start node found')
      alert('Cannot start preview: No start node found. Please add a start node.')
      return
    }
    
    set((draft) => {
      draft.previewMode = true
      draft.currentNodeId = startNode.id
      draft.playbackHistory = [startNode.id]
      draft.playbackVariables = { ...variables }
    })
    
    safeEmit('previewStarted', undefined)
  },
  
  exitPreview: () => {
    set((draft) => {
      draft.previewMode = false
      draft.currentNodeId = null
      draft.playbackHistory = []
      draft.playbackVariables = {}
    })
    
    safeEmit('previewEnded', undefined)
  },
  
  navigateToNode: (nodeId) => {
    if (!get().previewMode) {
      console.warn('navigateToNode called outside preview mode')
      return
    }
    
    set((draft) => {
      draft.currentNodeId = nodeId
      draft.playbackHistory.push(nodeId)
    })
  },
  
  makeChoice: (_choiceId, targetNodeId) => {
    if (!get().previewMode) return
    get().navigateToNode(targetNodeId)
  },
  
  goBack: () => {
    const state = get()
    if (!state.previewMode || state.playbackHistory.length <= 1) return
    
    // Remove current node from history
    const newHistory = [...state.playbackHistory]
    newHistory.pop()
    
    // Navigate to previous node
    const previousNodeId = newHistory[newHistory.length - 1]
    
    set((draft) => {
      draft.currentNodeId = previousNodeId
      draft.playbackHistory = newHistory
    })
  },
  
  // Project Management
  newStory: (name) => {
    const sanitizedName = sanitizeText(name) || 'Untitled Story'
    
    const story: Story = {
      id: `story-${nanoid()}`,
      name: sanitizedName,
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
      id: `start-${nanoid(8)}`,
      type: 'start',
      position: { x: 250, y: 100 },
      data: { type: 'start', label: 'Story Start' },
    }
    
    set((draft) => {
      draft.currentStory = story
      draft.nodes = [startNode]
      draft.edges = []
      draft.variables = {}
      draft.importedCharacters = []
      draft.selectedNodeId = null
      draft.history = []
      draft.historyIndex = -1
    })
  },
  
  saveStory: async () => {
    const { currentStory, nodes, edges, variables, importedCharacters } = get()
    
    if (!currentStory) {
      console.warn('No current story to save')
      return
    }
    
    try {
      const updatedStory: Story = {
        ...currentStory,
        nodes: nodes as StoryNode[],
        connections: edges as StoryConnection[],
        variables,
        importedCharacters,
        updatedAt: new Date().toISOString(),
      }
      
      // Save large data to IndexedDB instead of localStorage
      const storageKey = `story-${currentStory.id}`
      const result = await saveToIndexedDB(storageKey, updatedStory)
      
      if (!result.success) {
        console.error('Failed to save story:', result.error)
        // Fallback to localStorage
        localStorage.setItem(storageKey, JSON.stringify(updatedStory))
      }
      
      set((draft) => {
        draft.currentStory = updatedStory
      })
    } catch (error) {
      console.error('Failed to save story:', error)
    }
  },
  
  loadStory: async (storyId) => {
    try {
      const storageKey = `story-${storyId}`
      
      // Try IndexedDB first
      const result = await loadFromIndexedDB(storageKey)
      let story: Story | null = null
      
      if (result.success && result.data) {
        story = result.data as Story
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          story = JSON.parse(stored)
        }
      }
      
      if (!story) {
        console.error('Story not found:', storyId)
        return
      }
      
      set((draft) => {
        draft.currentStory = story
        draft.nodes = story.nodes || []
        draft.edges = [] // Edges need to be reconstructed from connections
        draft.variables = story.variables || {}
        draft.importedCharacters = story.importedCharacters || []
        draft.selectedNodeId = null
        draft.history = []
        draft.historyIndex = -1
      })
    } catch (error) {
      console.error('Failed to load story:', error)
    }
  },
  
  // Undo/Redo
  addToHistory: () => {
    const { nodes, edges, historyIndex } = get()
    
    set((draft) => {
      // Remove any history after current index
      draft.history = draft.history.slice(0, historyIndex + 1)
      
      // Add current state
      draft.history.push({ 
        nodes: JSON.parse(JSON.stringify(nodes)), 
        edges: JSON.parse(JSON.stringify(edges)) 
      })
      
      // Limit history size
      if (draft.history.length > MAX_HISTORY) {
        draft.history.shift()
      } else {
        draft.historyIndex = draft.history.length - 1
      }
    })
  },
  
  undo: () => {
    const { history, historyIndex } = get()
    
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1]
      set((draft) => {
        draft.nodes = [...previousState.nodes]
        draft.edges = [...previousState.edges]
        draft.historyIndex = historyIndex - 1
      })
    }
  },
  
  redo: () => {
    const { history, historyIndex } = get()
    
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      set((draft) => {
        draft.nodes = [...nextState.nodes]
        draft.edges = [...nextState.edges]
        draft.historyIndex = historyIndex + 1
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
})))

// Subscribe to cross-store events
eventBus.on('projectDeleted', () => {
  useStoryStore.setState({
    currentStory: null,
    nodes: [],
    edges: [],
    variables: {},
    importedCharacters: [],
    selectedNodeId: null,
    previewMode: false,
    currentNodeId: null,
    playbackHistory: [],
    playbackVariables: {},
    history: [],
    historyIndex: -1,
  })
  safeEmit('storeReset', 'story')
})
