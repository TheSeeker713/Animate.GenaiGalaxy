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
  
  // Morph panel state
  selectedMorphCategory: 'body' | 'face' | 'style' | null
  
  // Actions
  setCurrentCharacter: (character: Character | null) => void
  setBaseTemplate: (template: CharacterTemplate | null) => void
  loadTemplate: (template: CharacterTemplate) => Promise<void>
  createFromScratch: () => void
  saveCharacter: () => Promise<void>
  updateMorphState: (morphId: string, value: number) => void
  setSelectedTool: (tool: CharacterState['selectedTool']) => void
  toggleSkeleton: () => void
  toggleMorphHandles: () => void
  toggleGrid: () => void
  setSelectedMorphCategory: (category: CharacterState['selectedMorphCategory']) => void
}

const generateId = () => `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const useCharacterStore = create<CharacterState>((set, get) => ({
  currentCharacter: null,
  baseTemplate: null,
  isLoading: false,
  selectedTool: 'select',
  showSkeleton: true,
  showMorphHandles: false,
  showGrid: false,
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
    
    set({ currentCharacter: updatedCharacter })
    
    console.log('Character saved:', updatedCharacter.name)
  },
  
  updateMorphState: (morphId, value) => {
    const { currentCharacter } = get()
    if (!currentCharacter) return
    
    const updatedCharacter = {
      ...currentCharacter,
      morphState: {
        ...currentCharacter.morphState,
        [morphId]: value
      }
    }
    
    set({ currentCharacter: updatedCharacter })
  },
  
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  toggleSkeleton: () => set((state) => ({ showSkeleton: !state.showSkeleton })),
  toggleMorphHandles: () => set((state) => ({ showMorphHandles: !state.showMorphHandles })),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  setSelectedMorphCategory: (category) => set({ selectedMorphCategory: category })
}))
