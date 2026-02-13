// Story Builder Type Definitions

// Tiptap JSON format for rich text
export type TiptapJSON = {
  type: string
  content?: Array<{
    type: string
    [key: string]: any
  }>
  [key: string]: any
}

// Media Asset Type
export interface MediaAsset {
  id: string
  type: 'image' | 'video'
  url: string              // blob URL or data URL
  thumbnail?: string       // Small preview (max 100x100)
  filename: string
  size: number             // Bytes
  uploadedAt: string
  caption?: string
}

// Chapter/Act Organization
export interface Chapter {
  id: string
  name: string
  description?: string
  order: number            // For sorting
  color?: string           // Visual grouping on canvas
  nodeIds: string[]        // Nodes in this chapter
  collapsed?: boolean      // For canvas view
}

// Story Character Database
export interface StoryCharacter {
  id: string
  name: string
  bio: string
  traits: string[]         // ['brave', 'stubborn']
  relationships: Record<string, { type: string; description: string }>
  
  // Visual
  thumbnail?: MediaAsset
  color?: string           // Dialogue box color
  textColor?: string       // Text color for accessibility
  
  // Integration
  importedFromCharacterStudio?: string  // Character Studio ID if imported
  
  // Story tracking
  firstAppearance?: string // Node ID
  appearances: string[]    // All node IDs where character speaks
}

// Location Database
export interface StoryLocation {
  id: string
  name: string
  description: string
  
  // Visual
  backgroundImage?: MediaAsset
  ambience?: string        // Audio file ID (future)
  
  // Story tracking
  connectedLocations: string[]  // Other location IDs
  sceneCount: number       // How many nodes use this location
}

// Item/Object Database
export interface StoryItem {
  id: string
  name: string
  description: string
  category?: string        // 'weapon', 'key item', 'consumable'
  
  // Visual
  icon?: string            // Emoji or icon identifier
  
  // Game mechanics
  variableName?: string    // Track in story variables (e.g., 'has_key')
}

export type NodeType = 'start' | 'dialogue' | 'choice' | 'branch' | 'variable' | 'end'

export interface StoryNode {
  id: string
  type: NodeType
  position: { x: number; y: number }
  data: NodeData
}

export type NodeData = 
  | StartNodeData
  | DialogueNodeData
  | ChoiceNodeData
  | BranchNodeData
  | VariableNodeData
  | EndNodeData

export interface StartNodeData {
  type: 'start'
  label: string
  notes?: string          // Writer's notes
  tags?: string[]         // Organization tags
}

export interface DialogueNodeData {
  type: 'dialogue'
  
  // Legacy text support (for backward compatibility)
  text?: string
  characterName?: string
  
  // Rich text (new)
  richText?: TiptapJSON
  textHTML?: string       // Cached HTML for export
  wordCount?: number
  
  // Asset references
  characterId?: string    // From StoryCharacter database
  locationId?: string     // From StoryLocation database
  backgroundImage?: MediaAsset  // Override location default
  foregroundMedia?: MediaAsset
  
  // Character animation (if imported from Character Studio)
  expression?: string
  animation?: string
  
  // Organization
  notes?: string          // Writer's notes (not shown in preview)
  tags?: string[]         // Node-level tags
  
  // Audio (future)
  soundEffect?: string
}

export interface ChoiceNodeData {
  type: 'choice'
  
  // Legacy support
  prompt?: string
  
  // Rich text prompt (new)
  promptRichText?: TiptapJSON
  promptHTML?: string
  
  choices: Array<{
    id: string
    
    // Legacy support
    text?: string
    
    // Rich text (new)
    richText?: TiptapJSON
    textHTML?: string
    
    condition?: string
    setVariable?: { key: string; value: any }
    requiredItem?: string  // Item ID from database
  }>
  
  // Asset references
  locationId?: string
  backgroundImage?: MediaAsset
  
  // Organization
  notes?: string
  tags?: string[]
}

export interface BranchNodeData {
  type: 'branch'
  condition: string
  description?: string
  notes?: string
  tags?: string[]
}

export interface VariableNodeData {
  type: 'variable'
  key: string
  value: any
  operation: 'set' | 'add' | 'subtract' | 'toggle'
  notes?: string
  tags?: string[]
}

export interface EndNodeData {
  type: 'end'
  label: string
  endType: 'victory' | 'defeat' | 'neutral'
  notes?: string
  tags?: string[]
}

export interface StoryConnection {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
}

export interface ImportedCharacter {
  id: string
  name: string
  thumbnail: string
  expressions: string[]
  animations: string[]
}

export interface Story {
  id: string
  name: string
  description: string
  
  // Core story structure
  nodes: StoryNode[]
  connections: StoryConnection[]
  variables: Record<string, any>
  
  // Legacy imported characters (from Character Studio)
  importedCharacters: ImportedCharacter[]
  
  // Asset Databases (new)
  characters: StoryCharacter[]
  locations: StoryLocation[]
  items: StoryItem[]
  mediaLibrary: MediaAsset[]
  
  // Organization (new)
  tags: string[]
  genre?: string
  status: 'draft' | 'in-progress' | 'review' | 'complete'
  outline: string          // Story outline/synopsis
  notes: string            // Writer's notes
  chapters: Chapter[]
  
  // Analytics (computed)
  wordCount?: number
  estimatedPlaytime?: number  // minutes
  
  // Timestamps
  createdAt: string
  updatedAt: string
}
