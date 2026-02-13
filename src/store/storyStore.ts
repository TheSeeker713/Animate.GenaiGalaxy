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
  ImportedCharacter,
  StoryCharacter,
  StoryLocation,
  StoryItem,
  MediaAsset,
  Chapter,
} from '../types/story'
import type { Node, Edge } from 'reactflow'
import { eventBus, safeEmit } from '../utils/eventBus'
import { sanitizeText, validateCondition, enforceLimit } from '../utils/validators'
import { saveFullStory, loadFullStory } from '../utils/storyDb'
import { calculateStoryWordCount, calculateEstimatedPlaytime, findNodesUsingCharacter, findNodesUsingLocation } from '../types/storyAssets'

// Limits to prevent performance issues
const MAX_NODES = 5000  // Increased with viewport virtualization
const MAX_EDGES = 5000
const MAX_HISTORY = 20
const MAX_CHOICES = 8
const SOFT_WARNING_NODES = 1000  // Warn at 1000 nodes

interface StoryStore {
  // Core state
  currentStory: Story | null
  nodes: Node[]
  edges: Edge[]
  variables: Record<string, any>
  
  // Asset Databases (new)
  characters: StoryCharacter[]
  locations: StoryLocation[]
  items: StoryItem[]
  mediaLibrary: MediaAsset[]
  chapters: Chapter[]
  
  // Organization (new)
  tags: string[]
  
  // UI state
  selectedNodeId: string | null
  inspectorOpen: boolean
  previewMode: boolean
  previewStartNodeId: string | null
  
  // Character integration (legacy)
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
  
  // Actions - Character Integration (legacy)
  importCharacter: (character: ImportedCharacter) => void
  
  // Actions - Asset Management (new)
  addCharacter: (character: Omit<StoryCharacter, 'id' | 'appearances'>) => void
  updateCharacter: (id: string, updates: Partial<StoryCharacter>) => void
  deleteCharacter: (id: string) => void
  
  addLocation: (location: Omit<StoryLocation, 'id' | 'sceneCount'>) => void
  updateLocation: (id: string, updates: Partial<StoryLocation>) => void
  deleteLocation: (id: string) => void
  
  addItem: (item: Omit<StoryItem, 'id'>) => void
  updateItem: (id: string, updates: Partial<StoryItem>) => void
  deleteItem: (id: string) => void
  
  addMediaAsset: (asset: MediaAsset) => void
  deleteMediaAsset: (id: string) => void
  
  addChapter: (chapter: Omit<Chapter, 'id'>) => void
  updateChapter: (id: string, updates: Partial<Chapter>) => void
  deleteChapter: (id: string) => void
  assignNodeToChapter: (nodeId: string, chapterId: string) => void
  
  updateStoryMetadata: (updates: Partial<Pick<Story, 'name' | 'description' | 'tags' | 'genre' | 'status' | 'outline' | 'notes'>>) => void
  refreshAnalytics: () => void
  
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
  
  // Asset databases (new)
  characters: [],
  locations: [],
  items: [],
  mediaLibrary: [],
  chapters: [],
  tags: [],
  
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
    
    // Soft warning at 1000 nodes (no hard limit)
    if (state.nodes.length >= SOFT_WARNING_NODES && state.nodes.length < SOFT_WARNING_NODES + 10) {
      console.warn(`Large story: ${state.nodes.length} nodes. Performance may degrade.`)
    }
    
    // Hard limit at MAX_NODES
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
  
  // Character Integration (legacy)
  importCharacter: (character) => {
    set((draft) => {
      draft.importedCharacters.push(character)
    })
  },
  
  // Asset Management - Characters
  addCharacter: (character) => {
    set((draft) => {
      const newCharacter: StoryCharacter = {
        ...character,
        id: `char-${nanoid(8)}`,
        appearances: [],
      }
      draft.characters.push(newCharacter)
    })
  },
  
  updateCharacter: (id, updates) => {
    set((draft) => {
      const character = draft.characters.find(c => c.id === id)
      if (character) {
        Object.assign(character, updates)
        
        // Refresh appearances if needed
        if (updates.id || updates.name) {
          character.appearances = findNodesUsingCharacter(draft.nodes as StoryNode[], id)
        }
      }
    })
  },
  
  deleteCharacter: (id) => {
    const { nodes } = get()
    const usageCount = findNodesUsingCharacter(nodes as StoryNode[], id).length
    
    if (usageCount > 0) {
      if (!confirm(`This character is used in ${usageCount} node(s). Delete anyway? Nodes will need to be updated manually.`)) {
        return
      }
    }
    
    set((draft) => {
      draft.characters = draft.characters.filter(c => c.id !== id)
    })
  },
  
  // Asset Management - Locations
  addLocation: (location) => {
    set((draft) => {
      const newLocation: StoryLocation = {
        ...location,
        id: `loc-${nanoid(8)}`,
        sceneCount: 0,
      }
      draft.locations.push(newLocation)
    })
  },
  
  updateLocation: (id, updates) => {
    set((draft) => {
      const location = draft.locations.find(l => l.id === id)
      if (location) {
        Object.assign(location, updates)
        
        // Refresh scene count
        location.sceneCount = findNodesUsingLocation(draft.nodes as StoryNode[], id).length
      }
    })
  },
  
  deleteLocation: (id) => {
    const { nodes } = get()
    const usageCount = findNodesUsingLocation(nodes as StoryNode[], id).length
    
    if (usageCount > 0) {
      if (!confirm(`This location is used in ${usageCount} node(s). Delete anyway?`)) {
        return
      }
    }
    
    set((draft) => {
      draft.locations = draft.locations.filter(l => l.id !== id)
    })
  },
  
  // Asset Management - Items
  addItem: (item) => {
    set((draft) => {
      const newItem: StoryItem = {
        ...item,
        id: `item-${nanoid(8)}`,
      }
      draft.items.push(newItem)
    })
  },
  
  updateItem: (id, updates) => {
    set((draft) => {
      const item = draft.items.find(i => i.id === id)
      if (item) {
        Object.assign(item, updates)
      }
    })
  },
  
  deleteItem: (id) => {
    set((draft) => {
      draft.items = draft.items.filter(i => i.id !== id)
    })
  },
  
  // Asset Management - Media
  addMediaAsset: (asset) => {
    set((draft) => {
      draft.mediaLibrary.push(asset)
    })
  },
  
  deleteMediaAsset: (id) => {
    set((draft) => {
      draft.mediaLibrary = draft.mediaLibrary.filter(m => m.id !== id)
    })
  },
  
  // Asset Management - Chapters
  addChapter: (chapter) => {
    set((draft) => {
      const newChapter: Chapter = {
        ...chapter,
        id: `chapter-${nanoid(8)}`,
      }
      draft.chapters.push(newChapter)
    })
  },
  
  updateChapter: (id, updates) => {
    set((draft) => {
      const chapter = draft.chapters.find(c => c.id === id)
      if (chapter) {
        Object.assign(chapter, updates)
      }
    })
  },
  
  deleteChapter: (id) => {
    set((draft) => {
      draft.chapters = draft.chapters.filter(c => c.id !== id)
    })
  },
  
  assignNodeToChapter: (nodeId, chapterId) => {
    set((draft) => {
      // Remove node from all chapters
      draft.chapters.forEach(ch => {
        ch.nodeIds = ch.nodeIds.filter(id => id !== nodeId)
      })
      
      // Add to new chapter
      const chapter = draft.chapters.find(c => c.id === chapterId)
      if (chapter && !chapter.nodeIds.includes(nodeId)) {
        chapter.nodeIds.push(nodeId)
      }
    })
  },
  
  // Story Metadata
  updateStoryMetadata: (updates) => {
    set((draft) => {
      if (draft.currentStory) {
        Object.assign(draft.currentStory, updates)
        draft.currentStory.updatedAt = new Date().toISOString()
        
        // Update tags at root level
        if (updates.tags) {
          draft.tags = updates.tags
        }
      }
    })
  },
  
  // Analytics
  refreshAnalytics: () => {
    const { nodes } = get()
    const wordCount = calculateStoryWordCount(nodes as StoryNode[])
    const estimatedPlaytime = calculateEstimatedPlaytime(wordCount)
    
    set((draft) => {
      if (draft.currentStory) {
        draft.currentStory.wordCount = wordCount
        draft.currentStory.estimatedPlaytime = estimatedPlaytime
      }
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
      
      // New fields
      characters: [],
      locations: [],
      items: [],
      mediaLibrary: [],
      chapters: [],
      tags: [],
      genre: '',
      status: 'draft',
      outline: '',
      notes: '',
      
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
      draft.characters = []
      draft.locations = []
      draft.items = []
      draft.mediaLibrary = []
      draft.chapters = []
      draft.tags = []
      draft.selectedNodeId = null
      draft.history = []
      draft.historyIndex = -1
    })
  },
  
  saveStory: async () => {
    const { 
      currentStory, 
      nodes, 
      edges, 
      variables, 
      importedCharacters,
      characters,
      locations,
      items,
      mediaLibrary,
      chapters,
      tags,
    } = get()
    
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
        characters,
        locations,
        items,
        mediaLibrary,
        chapters,
        tags,
        updatedAt: new Date().toISOString(),
      }
      
      // Save to Dexie (IndexedDB)
      await saveFullStory(updatedStory)
      
      set((draft) => {
        draft.currentStory = updatedStory
      })
      
      console.log('Story saved successfully')
    } catch (error) {
      console.error('Failed to save story:', error)
      alert('Failed to save story. Please try again.')
    }
  },
  
  loadStory: async (storyId) => {
    try {
      const story = await loadFullStory(storyId)
      
      if (!story) {
        console.error('Story not found:', storyId)
        alert('Story not found')
        return
      }
      
      set((draft) => {
        draft.currentStory = story
        draft.nodes = story.nodes || []
        draft.edges = story.connections as Edge[] || []
        draft.variables = story.variables || {}
        draft.importedCharacters = story.importedCharacters || []
        draft.characters = story.characters || []
        draft.locations = story.locations || []
        draft.items = story.items || []
        draft.mediaLibrary = story.mediaLibrary || []
        draft.chapters = story.chapters || []
        draft.tags = story.tags || []
        draft.selectedNodeId = null
        draft.history = []
        draft.historyIndex = -1
      })
      
      console.log('Story loaded successfully:', story.name)
    } catch (error) {
      console.error('Failed to load story:', error)
      alert('Failed to load story. Please try again.')
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
    characters: [],
    locations: [],
    items: [],
    mediaLibrary: [],
    chapters: [],
    tags: [],
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
