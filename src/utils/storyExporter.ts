import type { Story, ImportedCharacter } from '../types/story'
import type { Node, Edge } from 'reactflow'
import { STORY_PLAYER_CODE, STORY_PLAYER_STYLES } from './storyPlayer'

interface ExportOptions {
  story: Story
  nodes: Node[]
  edges: Edge[]
  variables: Record<string, any>
  characters: ImportedCharacter[]
  embedAssets?: boolean
}

export async function exportToHTML(options: ExportOptions): Promise<string> {
  const { story, nodes, edges, variables, characters, embedAssets = true } = options
  
  // Prepare story data
  const storyData = {
    id: story.id,
    name: story.name,
    description: story.description,
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type,
      data: node.data,
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    })),
    variables,
    characters: embedAssets ? await embedCharacterAssets(characters) : characters,
    createdAt: story.createdAt,
  }
  
  // Generate HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(story.name)}</title>
  <meta name="description" content="${escapeHtml(story.description || 'An interactive story')}">
  <meta name="generator" content="GenAI Galaxy Animate - Story Builder">
  <style>${STORY_PLAYER_STYLES}</style>
</head>
<body>
  <div id="app">
    <div id="top-bar"></div>
    <div id="story-player">
      <div class="node-content center">
        <div class="icon large">⏳</div>
        <div class="title">Loading story...</div>
      </div>
    </div>
  </div>
  
  <script>
    // Story data
    const STORY_DATA = ${JSON.stringify(storyData, null, 2)};
    
    // Story player engine
    ${STORY_PLAYER_CODE}
  </script>
</body>
</html>`
  
  return html
}

export function exportToJSON(options: ExportOptions): string {
  const { story, nodes, edges, variables, characters } = options
  
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    story: {
      ...story,
      nodes,
      edges,
      variables,
      characters,
    },
  }
  
  return JSON.stringify(exportData, null, 2)
}

async function embedCharacterAssets(characters: ImportedCharacter[]): Promise<ImportedCharacter[]> {
  // In a real implementation, this would convert character thumbnails to base64
  // For now, we'll just return the characters as-is
  return characters.map(char => ({
    ...char,
    // TODO: Convert thumbnail URL to base64 if needed
    thumbnail: char.thumbnail,
  }))
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, m => map[m])
}
