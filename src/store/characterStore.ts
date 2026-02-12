import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { debounce } from 'lodash-es'
import { nanoid } from 'nanoid'
import { compress, decompress } from 'lz-string'
import type { Character, CharacterTemplate } from '@/types/character'
import { eventBus, safeEmit } from '../utils/eventBus'
import { saveToIndexedDB } from '../utils/storageManager'
import { sanitizeText, validateNumber } from '../utils/validators'

const MAX_HISTORY = 20
const AUTO_SAVE_DELAY = 300 // 300ms debounce

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
  
  // Undo/Redo state (compressed history)
  history: string[]
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

const generateId = () => `char-${Date.now()}-${nanoid(8)}`

// Helper function to add compressed history
function addToHistory(character: Character, draft: any) {
  // Compress character data to save memory
  const compressed = compress(JSON.stringify(character))
  
  // Remove any history after current index
  draft.history = draft.history.slice(0, draft.historyIndex + 1)
  
  // Add compressed state
  draft.history.push(compressed)
  
  // Limit history size
  if (draft.history.length > MAX_HISTORY) {
    draft.history.shift()
  } else {
    draft.historyIndex++
  }
}

// Centralized mutation wrapper for batching history/autosave
function mutateCharacter(
  draft: any, 
  updater: (char: Character) => void
) {
  if (!draft.currentCharacter) return
  
  updater(draft.currentCharacter)
  addToHistory(draft.currentCharacter, draft)
}

export const useCharacterStore = create<CharacterState>()(
  immer((set, get) => ({
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
  maxHistory: MAX_HISTORY,
  selectedMorphCategory: null,
  
  setCurrentCharacter: (character) => set((draft) => { draft.currentCharacter = character }),
  
  setBaseTemplate: (template) => set((draft) => { draft.baseTemplate = template }),
  
  loadTemplate: async (template) => {
    set((draft) => { draft.isLoading = true })
    
    try {
      const sanitizedName = sanitizeText(`${template.name} - My Character`)
      
      // Create character instance from template
      const character: Character = {
        id: generateId(),
        name: sanitizedName,
        templateId: template.id,
        thumbnail: template.thumbnail,
        createdAt: new Date(),
        modifiedAt: new Date(),
        
        // Clone layers with validation
        layers: template.layers.map(layer => ({
          id: generateId(),
          name: sanitizeText(layer.name),
          type: layer.type,
          imageData: layer.imageData,
          visible: layer.visible,
          opacity: validateNumber(layer.opacity, 1),
          position: { 
            x: validateNumber(layer.position.x, 0),
            y: validateNumber(layer.position.y, 0)
          },
          scale: { 
            x: validateNumber(layer.scale.x, 1),
            y: validateNumber(layer.scale.y, 1)
          },
          rotation: validateNumber(layer.rotation, 0),
          zIndex: validateNumber(layer.zIndex, 0),
          mesh: layer.hasMesh && layer.meshId ? {
            vertices: [],
            triangles: [],
            uvs: [],
            weights: []
          } : undefined
        })),
        
        // Clone skeleton with validation
        skeleton: {
          bones: template.skeleton.bones.map(bone => ({
            id: bone.id,
            name: sanitizeText(bone.name),
            parentId: bone.parentId,
            position: { 
              x: validateNumber(bone.position.x, 0),
              y: validateNumber(bone.position.y, 0)
            },
            rotation: validateNumber(bone.rotation, 0),
            length: validateNumber(bone.length, 0),
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
      
      set((draft) => { 
        draft.currentCharacter = character
        draft.baseTemplate = template
        draft.isLoading = false
      })
    } catch (error) {
      console.error('Failed to load template:', error)
      set((draft) => { draft.isLoading = false })
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
        rootBoneId: null,
        ikChains: [],
        constraints: []
      },
      morphState: {},
      recordings: []
    }
    
    set((draft) => { 
      draft.currentCharacter = character
      draft.baseTemplate = null
    })
  },
  
  saveCharacter: async () => {
    const { currentCharacter } = get()
    if (!currentCharacter) return
    
    set((draft) => { draft.isSaving = true })
    
    try {
      const updatedCharacter = {
        ...currentCharacter,
        modifiedAt: new Date()
      }
      
      // Save large data to IndexedDB instead of localStorage
      const result = await saveToIndexedDB(
        `character-${currentCharacter.id}`,
        updatedCharacter
      )
      
      if (!result.success) {
        console.error('Failed to save to IndexedDB:', result.error)
        // Fallback to localStorage
        localStorage.setItem(
          `character-${currentCharacter.id}`,
          JSON.stringify(updatedCharacter)
        )
      }
      
      set((draft) => { 
        draft.currentCharacter = updatedCharacter
        draft.lastSaved = new Date()
        draft.isSaving = false
      })
      
      console.log('Character saved:', updatedCharacter.name)
    } catch (error) {
      console.error('Failed to save character:', error)
      set((draft) => { draft.isSaving = false })
    }
  },
  
  updateCharacter: (character) => {
    set((draft) => {
      addToHistory(character, draft)
      draft.currentCharacter = character
    })
    
    // Trigger auto-save with debounce
    if (get().autoSaveEnabled) {
      debouncedAutoSave()
    }
  },
  
  updateMorphState: (morphId, value) => {
    const { currentCharacter } = get()
    if (!currentCharacter) return
    
    // Validate morph value (typically 0-1 range)
    const validatedValue = validateNumber(value, 0)
    
    set((draft) => {
      mutateCharacter(draft, (char) => {
        char.morphState[morphId] = validatedValue
      })
    })
    
    // Trigger auto-save with debounce
    if (get().autoSaveEnabled) {
      debouncedAutoSave()
    }
  },
  
  setSelectedTool: (tool) => set((draft) => { draft.selectedTool = tool }),
  toggleSkeleton: () => set((draft) => { draft.showSkeleton = !draft.showSkeleton }),
  toggleMorphHandles: () => set((draft) => { draft.showMorphHandles = !draft.showMorphHandles }),
  toggleGrid: () => set((draft) => { draft.showGrid = !draft.showGrid }),
  togglePlaybackMode: () => set((draft) => { draft.isPlaybackMode = !draft.isPlaybackMode }),
  setSelectedMorphCategory: (category) => set((draft) => { draft.selectedMorphCategory = category }),
  
  setSelectedLayer: (layerId) => set((draft) => { draft.selectedLayerId = layerId }),
  
  setSelectedBone: (boneId) => set((draft) => { draft.selectedBoneId = boneId }),
  
  updateBonePosition: (boneId, position) => {
    const { currentCharacter } = get()
    if (!currentCharacter) return
    
    // Validate position
    const validatedPos = {
      x: validateNumber(position.x, 0),
      y: validateNumber(position.y, 0)
    }
    
    set((draft) => {
      mutateCharacter(draft, (char) => {
        const bone = char.skeleton.bones.find(b => b.id === boneId)
        if (bone) {
          bone.position = validatedPos
        }
      })
    })
    
    // Trigger auto-save with debounce
    if (get().autoSaveEnabled) {
      debouncedAutoSave()
    }
  },
  
  updateLayerTransform: (layerId, transform) => {
    const { currentCharacter } = get()
    if (!currentCharacter) return
    
    set((draft) => {
      mutateCharacter(draft, (char) => {
        const layer = char.layers.find(l => l.id === layerId)
        if (layer) {
          if (transform.position) {
            layer.position = {
              x: validateNumber(transform.position.x, layer.position.x),
              y: validateNumber(transform.position.y, layer.position.y)
            }
          }
          if (transform.scale) {
            layer.scale = {
              x: validateNumber(transform.scale.x, layer.scale.x),
              y: validateNumber(transform.scale.y, layer.scale.y)
            }
          }
          if (transform.rotation !== undefined) {
            layer.rotation = validateNumber(transform.rotation, layer.rotation)
          }
        }
      })
    })
    
    // Trigger auto-save with debounce
    if (get().autoSaveEnabled) {
      debouncedAutoSave()
    }
  },
  
  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const compressed = history[newIndex]
      const json = decompress(compressed)
      if (json) {
        const character = JSON.parse(json)
        set((draft) => { 
          draft.currentCharacter = character
          draft.historyIndex = newIndex
        })
      }
    }
  },
  
  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      const compressed = history[newIndex]
      const json = decompress(compressed)
      if (json) {
        const character = JSON.parse(json)
        set((draft) => { 
          draft.currentCharacter = character
          draft.historyIndex = newIndex
        })
      }
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
})))

// Debounced auto-save function
const debouncedAutoSave = debounce(
  () => {
    useCharacterStore.getState().saveCharacter()
  },
  AUTO_SAVE_DELAY,
  { leading: false, trailing: true }
)

// Subscribe to cross-store events
eventBus.on('projectDeleted', () => {
  useCharacterStore.setState({
    currentCharacter: null,
    baseTemplate: null,
    selectedLayerId: null,
    selectedBoneId: null,
    isPlaybackMode: false,
    history: [],
    historyIndex: -1,
  })
  safeEmit('storeReset', 'character')
})
