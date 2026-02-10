import { create } from 'zustand'
import type { Character, CharacterTemplate } from '@/types/character'

interface CharacterState {
  // Current character being edited
  currentCharacter: Character | null
  
  // Template being used
  baseTemplate: CharacterTemplate | null
  
  // UI state
  isLoading: boolean
  selectedTool: 'select' | 'bone' | 'morph' | 'paint' | 'test'
  showSkeleton: boolean
  showMorphHandles: boolean
  showGrid: boolean
  selectedLayerId: string | null
  selectedBoneId: string | null
  isPlaybackMode: boolean
  
  // Auto-save state
  lastSaved: Date | null
  isSaving: boolean
  autoSaveEnabled: boolean
  
  // Undo/Redo state
  history: Character[]
  historyIndex: number
  maxHistory: number
  
  // Morph panel state
  selectedMorphCategory: 'body' | 'face' | 'style' | null
  
  // Actions
  setCurrentCharacter: (character: Character | null) => void
  setBaseTemplate: (template: CharacterTemplate | null) => void
  loadTemplate: (template: CharacterTemplate) => Promise<void>
  createFromScratch: () => void
  saveCharacter: () => Promise<void>
  updateCharacter: (character: Character) => void
  updateMorphState: (morphId: string, value: number) => void
  setSelectedTool: (tool: CharacterState['selectedTool']) => void
  toggleSkeleton: () => void
  toggleMorphHandles: () => void
  toggleGrid: () => void
  togglePlaybackMode: () => void
  setSelectedMorphCategory: (category: CharacterState['selectedMorphCategory']) => void
  setSelectedLayer: (layerId: string | null) => void
  setSelectedBone: (boneId: string | null) => void
  updateBonePosition: (boneId: string, position: { x: number; y: number }) => void
  updateLayerTransform: (layerId: string, transform: Partial<{ position: { x: number; y: number }; scale: { x: number; y: number }; rotation: number }>) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

const generateId = () => `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Debounce timer for auto-save
let autoSaveTimer: number | null = null
const AUTO_SAVE_DELAY = 2000 // 2 seconds

// Helper function to add to history
function addToHistory(character: Character, get: any, set: any) {
  const { history, historyIndex, maxHistory } = get()
  
  // Remove any history after current index (when undoing then making new changes)
  const newHistory = history.slice(0, historyIndex + 1)
  
  // Add current state
  newHistory.push(JSON.parse(JSON.stringify(character)))
  
  // Limit history size
  if (newHistory.length > maxHistory) {
    newHistory.shift()
  } else {
    set({ historyIndex: historyIndex + 1 })
  }
  
  set({ history: newHistory })
}

// Helper function to trigger auto-save with debounce
function triggerAutoSave(saveFunction: () => Promise<void>) {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    saveFunction()
  }, AUTO_SAVE_DELAY)
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  currentCharacter: null,
  baseTemplate: null,
  isLoading: false,
  selectedTool: 'select',
  showSkeleton: true,
  showMorphHandles: false,
  selectedLayerId: null,
  selectedBoneId: null,
  showGrid: false,
  isPlaybackMode: false,
  lastSaved: null,
  isSaving: false,
  autoSaveEnabled: true,
  history: [],
  historyIndex: -1,
  maxHistory: 20,
  selectedMorphCategory: null,
  
  setCurrentCharacter: (character) => set({ currentCharacter: character }),
  
  setBaseTemplate: (template) => set({ baseTemplate: template }),
  
  loadTemplate: async (template) => {
    set({ isLoading: true })
    
    try {
      // Create character instance from template
      const character: Character = {
        id: generateId(),
        name: `${template.name} - My Character`,
        templateId: template.id,
        thumbnail: template.thumbnail,
        createdAt: new Date(),
        modifiedAt: new Date(),
        
        // Clone layers
        layers: template.layers.map(layer => ({
          id: generateId(),
          name: layer.name,
          type: layer.type,
          imageData: layer.imageData,
          visible: layer.visible,
          opacity: layer.opacity,
          position: { ...layer.position },
          scale: { ...layer.scale },
          rotation: layer.rotation,
          zIndex: layer.zIndex,
          mesh: layer.hasMesh && layer.meshId ? {
            vertices: [],
            triangles: [],
            uvs: [],
            weights: []
          } : undefined
        })),
        
        // Clone skeleton
        skeleton: {
          bones: template.skeleton.bones.map(bone => ({
            id: bone.id,
            name: bone.name,
            parentId: bone.parentId,
            position: { ...bone.position },
            rotation: bone.rotation,
            length: bone.length,
            scale: { x: 1, y: 1 },
            minAngle: bone.minAngle,
            maxAngle: bone.maxAngle,
            isIKTarget: bone.isIKTarget
          })),
          rootBoneId: template.skeleton.rootBoneId,
          ikChains: [...template.skeleton.ikChains],
          constraints: [...template.skeleton.constraints]
        },
        
        // Initialize morph state with defaults
        morphState: { ...template.defaultMorphState },
        
        // Empty recordings
        recordings: []
      }
      
      set({ 
        currentCharacter: character,
        baseTemplate: template,
        isLoading: false
      })
    } catch (error) {
      console.error('Failed to load template:', error)
      set({ isLoading: false })
    }
  },
  
  createFromScratch: () => {
    const character: Character = {
      id: generateId(),
      name: 'Untitled Character',
      templateId: null,
      thumbnail: '',
      createdAt: new Date(),
      modifiedAt: new Date(),
      layers: [],
      skeleton: {
        bones: [],
        rootBoneId: '',
        ikChains: [],
        constraints: []
      },
      morphState: {},
      recordings: []
    }
    
    set({ 
      currentCharacter: character,
      baseTemplate: null
    })
  },
  
  saveCharacter: async () => {
    const { currentCharacter } = get()
    if (!currentCharacter) return
    
    set({ isSaving: true })
    
    try {
      // Update modified date
      const updatedCharacter = {
        ...currentCharacter,
        modifiedAt: new Date()
      }
      
      // Save to localStorage (MVP)
      localStorage.setItem(
        `character-${currentCharacter.id}`,
        JSON.stringify(updatedCharacter)
      )
      
      set({ 
        currentCharacter: updatedCharacter,
        lastSaved: new Date(),
        isSaving: false
      })
      
      console.log('Character saved:', updatedCharacter.name)
    } catch (error) {
      console.error('Failed to save character:', error)
      set({ isSaving: false })
    }
  },
  
  updateCharacter: (character) => {
    const { autoSaveEnabled, saveCharacter } = get()
    
    // Add to history
    addToHistory(character, get, set)
    
    set({ currentCharacter: character })
    
    // Trigger auto-save with debounce
    if (autoSaveEnabled) {
      triggerAutoSave(saveCharacter)
    }
  },
  
  updateMorphState: (morphId, value) => {
    const { currentCharacter, autoSaveEnabled, saveCharacter } = get()
    if (!currentCharacter) return
    
    const updatedCharacter = {
      ...currentCharacter,
      morphState: {
        ...currentCharacter.morphState,
        [morphId]: value
      }
    }
    
    // Add to history
    addToHistory(updatedCharacter, get, set)
    
    set({ currentCharacter: updatedCharacter })
    
    // Trigger auto-save with debounce
    if (autoSaveEnabled) {
      triggerAutoSave(saveCharacter)
    }
  },
  
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  toggleSkeleton: () => set((state) => ({ showSkeleton: !state.showSkeleton })),
  toggleMorphHandles: () => set((state) => ({ showMorphHandles: !state.showMorphHandles })),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  togglePlaybackMode: () => set((state) => ({ isPlaybackMode: !state.isPlaybackMode })),
  setSelectedMorphCategory: (category) => set({ selectedMorphCategory: category }),
  
  setSelectedLayer: (layerId) => set({ selectedLayerId: layerId }),
  
  setSelectedBone: (boneId) => set({ selectedBoneId: boneId }),
  
  updateBonePosition: (boneId, position) => {
    const { currentCharacter, autoSaveEnabled, saveCharacter } = get()
    if (!currentCharacter) return
    
    const updatedCharacter = {
      ...currentCharacter,
      skeleton: {
        ...currentCharacter.skeleton,
        bones: currentCharacter.skeleton.bones.map(bone =>
          bone.id === boneId
            ? { ...bone, position }
            : bone
        )
      }
    }
    
    // Add to history
    addToHistory(updatedCharacter, get, set)
    
    set({ currentCharacter: updatedCharacter })
    
    // Trigger auto-save with debounce
    if (autoSaveEnabled) {
      triggerAutoSave(saveCharacter)
    }
  },
  
  updateLayerTransform: (layerId, transform) => {
    const { currentCharacter, autoSaveEnabled, saveCharacter } = get()
    if (!currentCharacter) return
    
    const updatedCharacter = {
      ...currentCharacter,
      layers: currentCharacter.layers.map(layer =>
        layer.id === layerId
          ? {
              ...layer,
              position: transform.position || layer.position,
              scale: transform.scale || layer.scale,
              rotation: transform.rotation !== undefined ? transform.rotation : layer.rotation
            }
          : layer
      )
    }
    
    // Add to history
    addToHistory(updatedCharacter, get, set)
    
    set({ currentCharacter: updatedCharacter })
    
    // Trigger auto-save with debounce
    if (autoSaveEnabled) {
      triggerAutoSave(saveCharacter)
    }
  },
  
  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      set({ 
        currentCharacter: JSON.parse(JSON.stringify(history[newIndex])),
        historyIndex: newIndex
      })
    }
  },
  
  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      set({ 
        currentCharacter: JSON.parse(JSON.stringify(history[newIndex])),
        historyIndex: newIndex
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
  }
}))
