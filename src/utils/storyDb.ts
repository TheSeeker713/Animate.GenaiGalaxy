// Story Builder - Dexie Database Schema
// IndexedDB database for scalable storage with advanced querying

import Dexie, { type Table } from 'dexie'
import type {
  Story,
  StoryNode,
  StoryConnection,
  StoryCharacter,
  StoryLocation,
  StoryItem,
  Chapter,
} from '../types/story'

// Extended types for database storage (includes storyId for indexing)
export interface DBStoryNode extends StoryNode {
  storyId: string
  chapterId?: string
}

export interface DBStoryConnection extends StoryConnection {
  storyId: string
}

export interface DBStoryCharacter extends StoryCharacter {
  storyId: string
}

export interface DBStoryLocation extends StoryLocation {
  storyId: string
}

export interface DBStoryItem extends StoryItem {
  storyId: string
}

export interface DBChapter extends Chapter {
  storyId: string
}

// Separate table for large text content (lazy loading)
export interface TextContent {
  nodeId: string
  storyId: string
  content: string  // JSON stringified TiptapJSON
  length: number   // Character count
}

// Database class
export class StoryDatabase extends Dexie {
  // Tables
  stories!: Table<Story, string>
  nodes!: Table<DBStoryNode, string>
  edges!: Table<DBStoryConnection, string>
  characters!: Table<DBStoryCharacter, string>
  locations!: Table<DBStoryLocation, string>
  items!: Table<DBStoryItem, string>
  chapters!: Table<DBChapter, string>
  textContent!: Table<TextContent, string>

  constructor() {
    super('StoryBuilderDB')
    
    // Version 2: Enhanced schema with asset databases
    this.version(2).stores({
      // Stories: Main metadata (searchable by tags)
      stories: 'id, name, updatedAt, status, *tags',
      
      // Nodes: Indexed by story and chapter for filtering
      nodes: 'id, storyId, type, chapterId, [storyId+type], [storyId+chapterId]',
      
      // Edges: Indexed by story, source, and target
      edges: 'id, storyId, source, target',
      
      // Asset databases: Indexed by story and name for lookups
      characters: 'id, storyId, name, [storyId+name]',
      locations: 'id, storyId, name, [storyId+name]',
      items: 'id, storyId, name, [storyId+name]',
      
      // Chapters: Indexed by story and order
      chapters: 'id, storyId, order, [storyId+order]',
      
      // Text content: Separate for large text (lazy loading)
      textContent: 'nodeId, storyId, length',
    })
    
    // Version 1: Legacy schema (for migration)
    this.version(1).stores({
      stories: 'id, name, updatedAt',
      nodes: 'id, storyId, type',
      edges: 'id, storyId',
    })
  }
}

// Singleton instance
export const db = new StoryDatabase()

// Helper functions for common queries

/**
 * Load story with all related data
 */
export async function loadFullStory(storyId: string): Promise<Story | null> {
  const story = await db.stories.get(storyId)
  if (!story) return null
  
  // Load all nodes for this story
  const nodes = await db.nodes.where('storyId').equals(storyId).toArray()
  
  // Load all edges
  const edges = await db.edges.where('storyId').equals(storyId).toArray()
  
  // Load asset databases
  const characters = await db.characters.where('storyId').equals(storyId).toArray()
  const locations = await db.locations.where('storyId').equals(storyId).toArray()
  const items = await db.items.where('storyId').equals(storyId).toArray()
  const chapters = await db.chapters.where('storyId').equals(storyId).toArray()
  
  // Remove storyId from nested objects
  return {
    ...story,
    nodes: nodes.map(({ storyId, chapterId, ...node }) => node as StoryNode),
    connections: edges.map(({ storyId, ...edge }) => edge as StoryConnection),
    characters: characters.map(({ storyId, ...char }) => char as StoryCharacter),
    locations: locations.map(({ storyId, ...loc }) => loc as StoryLocation),
    items: items.map(({ storyId, ...item }) => item as StoryItem),
    chapters: chapters.map(({ storyId, ...chapter }) => chapter as Chapter),
  }
}

/**
 * Save story with all related data
 */
export async function saveFullStory(story: Story): Promise<void> {
  await db.transaction('rw', [
    db.stories,
    db.nodes,
    db.edges,
    db.characters,
    db.locations,
    db.items,
    db.chapters,
  ], async () => {
    // Save story metadata
    await db.stories.put(story)
    
    // Clear existing data for this story
    await db.nodes.where('storyId').equals(story.id).delete()
    await db.edges.where('storyId').equals(story.id).delete()
    await db.characters.where('storyId').equals(story.id).delete()
    await db.locations.where('storyId').equals(story.id).delete()
    await db.items.where('storyId').equals(story.id).delete()
    await db.chapters.where('storyId').equals(story.id).delete()
    
    // Save nodes with storyId
    if (story.nodes.length > 0) {
      const dbNodes: DBStoryNode[] = story.nodes.map((node) => ({
        ...node,
        storyId: story.id,
        chapterId: findNodeChapter(node.id, story.chapters),
      }))
      await db.nodes.bulkAdd(dbNodes)
    }
    
    // Save edges with storyId
    if (story.connections.length > 0) {
      const dbEdges: DBStoryConnection[] = story.connections.map((edge) => ({
        ...edge,
        storyId: story.id,
      }))
      await db.edges.bulkAdd(dbEdges)
    }
    
    // Save characters
    if (story.characters.length > 0) {
      const dbCharacters: DBStoryCharacter[] = story.characters.map((char) => ({
        ...char,
        storyId: story.id,
      }))
      await db.characters.bulkAdd(dbCharacters)
    }
    
    // Save locations
    if (story.locations.length > 0) {
      const dbLocations: DBStoryLocation[] = story.locations.map((loc) => ({
        ...loc,
        storyId: story.id,
      }))
      await db.locations.bulkAdd(dbLocations)
    }
    
    // Save items
    if (story.items.length > 0) {
      const dbItems: DBStoryItem[] = story.items.map((item) => ({
        ...item,
        storyId: story.id,
      }))
      await db.items.bulkAdd(dbItems)
    }
    
    // Save chapters
    if (story.chapters.length > 0) {
      const dbChapters: DBChapter[] = story.chapters.map((chapter) => ({
        ...chapter,
        storyId: story.id,
      }))
      await db.chapters.bulkAdd(dbChapters)
    }
  })
}

/**
 * Load nodes in a specific viewport (for infinite canvas)
 */
export async function loadNodesInViewport(
  storyId: string,
  viewport: { minX: number; maxX: number; minY: number; maxY: number }
): Promise<StoryNode[]> {
  const allNodes = await db.nodes.where('storyId').equals(storyId).toArray()
  
  // Filter by viewport bounds
  const visibleNodes = allNodes.filter((node) => {
    return (
      node.position.x >= viewport.minX &&
      node.position.x <= viewport.maxX &&
      node.position.y >= viewport.minY &&
      node.position.y <= viewport.maxY
    )
  })
  
  return visibleNodes.map(({ storyId, chapterId, ...node }) => node as StoryNode)
}

/**
 * Load text content for a node (lazy loading)
 */
export async function loadNodeTextContent(nodeId: string): Promise<string | null> {
  const content = await db.textContent.get(nodeId)
  return content?.content || null
}

/**
 * Save text content for a node
 */
export async function saveNodeTextContent(
  nodeId: string,
  storyId: string,
  content: string,
  length: number
): Promise<void> {
  await db.textContent.put({ nodeId, storyId, content, length })
}

/**
 * Delete story and all related data
 */
export async function deleteStory(storyId: string): Promise<void> {
  await db.transaction('rw', [
    db.stories,
    db.nodes,
    db.edges,
    db.characters,
    db.locations,
    db.items,
    db.chapters,
    db.textContent,
  ], async () => {
    await db.stories.delete(storyId)
    await db.nodes.where('storyId').equals(storyId).delete()
    await db.edges.where('storyId').equals(storyId).delete()
    await db.characters.where('storyId').equals(storyId).delete()
    await db.locations.where('storyId').equals(storyId).delete()
    await db.items.where('storyId').equals(storyId).delete()
    await db.chapters.where('storyId').equals(storyId).delete()
    await db.textContent.where('storyId').equals(storyId).delete()
  })
}

/**
 * Get all stories (metadata only)
 */
export async function getAllStories(): Promise<Story[]> {
  return await db.stories.toArray()
}

/**
 * Search stories by tags
 */
export async function searchStoriesByTag(tag: string): Promise<Story[]> {
  return await db.stories.where('tags').equals(tag).toArray()
}

/**
 * Helper: Find which chapter a node belongs to
 */
function findNodeChapter(nodeId: string, chapters: Chapter[]): string | undefined {
  const chapter = chapters.find((ch) => ch.nodeIds.includes(nodeId))
  return chapter?.id
}
