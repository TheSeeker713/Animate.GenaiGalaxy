// Story Asset Management Types and Utilities

import type {
  StoryNode,
  DialogueNodeData,
  ChoiceNodeData,
} from './story'

// Asset reference for tracking usage
export interface AssetReference {
  type: 'character' | 'location' | 'item' | 'media'
  id: string
  name: string
}

// Node asset usage tracking
export interface NodeAssetUsage {
  nodeId: string
  nodeType: string
  assets: AssetReference[]
}

/**
 * Extract all assets used in a node
 */
export function extractNodeAssets(node: StoryNode): AssetReference[] {
  const assets: AssetReference[] = []
  
  if (node.type === 'dialogue') {
    const data = node.data as DialogueNodeData
    
    if (data.characterId) {
      assets.push({
        type: 'character',
        id: data.characterId,
        name: data.characterName || 'Unknown',
      })
    }
    
    if (data.locationId) {
      assets.push({
        type: 'location',
        id: data.locationId,
        name: 'Location',
      })
    }
    
    if (data.backgroundImage) {
      assets.push({
        type: 'media',
        id: data.backgroundImage.id,
        name: data.backgroundImage.filename,
      })
    }
    
    if (data.foregroundMedia) {
      assets.push({
        type: 'media',
        id: data.foregroundMedia.id,
        name: data.foregroundMedia.filename,
      })
    }
  } else if (node.type === 'choice') {
    const data = node.data as ChoiceNodeData
    
    if (data.locationId) {
      assets.push({
        type: 'location',
        id: data.locationId,
        name: 'Location',
      })
    }
    
    if (data.backgroundImage) {
      assets.push({
        type: 'media',
        id: data.backgroundImage.id,
        name: data.backgroundImage.filename,
      })
    }
    
    // Check for required items in choices
    data.choices.forEach((choice) => {
      if (choice.requiredItem) {
        assets.push({
          type: 'item',
          id: choice.requiredItem,
          name: 'Required Item',
        })
      }
    })
  }
  
  return assets
}

/**
 * Find all nodes using a specific character
 */
export function findNodesUsingCharacter(
  nodes: StoryNode[],
  characterId: string
): string[] {
  return nodes
    .filter((node) => {
      if (node.type === 'dialogue') {
        return (node.data as DialogueNodeData).characterId === characterId
      }
      return false
    })
    .map((node) => node.id)
}

/**
 * Find all nodes using a specific location
 */
export function findNodesUsingLocation(
  nodes: StoryNode[],
  locationId: string
): string[] {
  return nodes
    .filter((node) => {
      if (node.type === 'dialogue') {
        return (node.data as DialogueNodeData).locationId === locationId
      }
      if (node.type === 'choice') {
        return (node.data as ChoiceNodeData).locationId === locationId
      }
      return false
    })
    .map((node) => node.id)
}

/**
 * Find all nodes using a specific item
 */
export function findNodesUsingItem(
  nodes: StoryNode[],
  itemId: string
): string[] {
  return nodes
    .filter((node) => {
      if (node.type === 'choice') {
        const data = node.data as ChoiceNodeData
        return data.choices.some((choice) => choice.requiredItem === itemId)
      }
      return false
    })
    .map((node) => node.id)
}

/**
 * Find all nodes using a specific media asset
 */
export function findNodesUsingMedia(
  nodes: StoryNode[],
  mediaId: string
): string[] {
  return nodes
    .filter((node) => {
      if (node.type === 'dialogue') {
        const data = node.data as DialogueNodeData
        return (
          data.backgroundImage?.id === mediaId ||
          data.foregroundMedia?.id === mediaId
        )
      }
      if (node.type === 'choice') {
        const data = node.data as ChoiceNodeData
        return data.backgroundImage?.id === mediaId
      }
      return false
    })
    .map((node) => node.id)
}

/**
 * Calculate total word count for all dialogue/choice nodes
 */
export function calculateStoryWordCount(nodes: StoryNode[]): number {
  let total = 0
  
  nodes.forEach((node) => {
    if (node.type === 'dialogue') {
      const data = node.data as DialogueNodeData
      total += data.wordCount || 0
    } else if (node.type === 'choice') {
      const data = node.data as ChoiceNodeData
      // Count prompt words
      if (data.promptHTML) {
        const text = stripHTML(data.promptHTML)
        total += text.split(/\s+/).filter(Boolean).length
      }
      // Count choice words
      data.choices.forEach((choice) => {
        if (choice.textHTML) {
          const text = stripHTML(choice.textHTML)
          total += text.split(/\s+/).filter(Boolean).length
        }
      })
    }
  })
  
  return total
}

/**
 * Estimate playtime based on word count (average reading speed: 200 words/min)
 */
export function calculateEstimatedPlaytime(wordCount: number): number {
  return Math.ceil(wordCount / 200)
}

/**
 * Strip HTML tags from string
 */
function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

// Re-export all story types for convenience
export type {
  StoryNode,
  StoryCharacter,
  StoryLocation,
  StoryItem,
  MediaAsset,
  DialogueNodeData,
  ChoiceNodeData,
} from './story'
