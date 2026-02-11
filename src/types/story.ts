// Story Builder Type Definitions

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
}

export interface DialogueNodeData {
  type: 'dialogue'
  characterId?: string
  characterName: string
  text: string
  expression?: string
  animation?: string
  backgroundImage?: string
  soundEffect?: string
}

export interface ChoiceNodeData {
  type: 'choice'
  prompt: string
  choices: Array<{
    id: string
    text: string
    condition?: string
    setVariable?: { key: string; value: any }
  }>
}

export interface BranchNodeData {
  type: 'branch'
  condition: string
  description?: string
}

export interface VariableNodeData {
  type: 'variable'
  key: string
  value: any
  operation: 'set' | 'add' | 'subtract' | 'toggle'
}

export interface EndNodeData {
  type: 'end'
  label: string
  endType: 'victory' | 'defeat' | 'neutral'
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
  nodes: StoryNode[]
  connections: StoryConnection[]
  variables: Record<string, any>
  importedCharacters: ImportedCharacter[]
  createdAt: string
  updatedAt: string
}
