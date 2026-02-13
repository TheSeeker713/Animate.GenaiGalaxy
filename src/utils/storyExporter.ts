import type { Story, ImportedCharacter, MediaAsset } from '../types/story'
import type { Node, Edge } from 'reactflow'
import { STORY_PLAYER_CODE, STORY_PLAYER_STYLES } from './storyPlayer'
import { tiptapToHTML, tiptapToMarkdown, tiptapToPlainText } from './tiptapConverter'

interface ExportOptions {
  story: Story
  nodes: Node[]
  edges: Edge[]
  variables: Record<string, any>
  characters: ImportedCharacter[]
  embedAssets?: boolean
}

interface EnhancedExportOptions {
  story: Story
  nodes: Node[]
  edges: Edge[]
  variables: Record<string, any>
  embedAssets?: boolean
}

export async function exportToHTML(options: EnhancedExportOptions): Promise<string> {
  const { story, nodes, edges, variables, embedAssets = true } = options
  
  // Process nodes with rich content
  const processedNodes = await Promise.all(nodes.map(async (node) => {
    const processedData = { ...node.data }
    
    // Convert TiptapJSON to HTML for all text content
    if (processedData.richText) {
      processedData.textHTML = tiptapToHTML(processedData.richText)
    }
    
    // Process choice nodes
    if (node.type === 'choice' && processedData.choices) {
      processedData.choices = processedData.choices.map((choice: any) => ({
        ...choice,
        textHTML: choice.richText ? tiptapToHTML(choice.richText) : choice.text || '',
      }))
    }
    
    // Embed media assets if needed
    if (embedAssets) {
      if (processedData.backgroundImage) {
        processedData.backgroundImage = await embedMediaAsset(processedData.backgroundImage)
      }
      if (processedData.foregroundMedia) {
        processedData.foregroundMedia = await embedMediaAsset(processedData.foregroundMedia)
      }
    }
    
    // Resolve character data
    if (processedData.characterId && story.characters) {
      const character = story.characters.find(c => c.id === processedData.characterId)
      if (character) {
        processedData.character = {
          name: character.name,
          thumbnail: embedAssets && character.thumbnail 
            ? await embedMediaAsset(character.thumbnail) 
            : character.thumbnail,
          color: character.color,
        }
      }
    }
    
    // Resolve location data
    if (processedData.locationId && story.locations) {
      const location = story.locations.find(l => l.id === processedData.locationId)
      if (location) {
        processedData.location = {
          name: location.name,
          backgroundImage: embedAssets && location.backgroundImage
            ? await embedMediaAsset(location.backgroundImage)
            : location.backgroundImage,
        }
      }
    }
    
    return {
      id: node.id,
      type: node.type,
      data: processedData,
    }
  }))
  
  // Prepare story data with all assets
  const storyData = {
    id: story.id,
    name: story.name,
    description: story.description,
    nodes: processedNodes,
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    })),
    variables,
    characters: story.characters || [],
    locations: story.locations || [],
    items: story.items || [],
    chapters: story.chapters || [],
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
  <meta name="author" content="${escapeHtml(story.createdAt)}">
  ${story.tags ? `<meta name="keywords" content="${escapeHtml(story.tags.join(', '))}">` : ''}
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

export function exportToJSON(options: EnhancedExportOptions): string {
  const { story, nodes, edges, variables } = options
  
  const exportData = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    story: {
      ...story,
      nodes,
      edges,
      variables,
    },
  }
  
  return JSON.stringify(exportData, null, 2)
}

export function exportToMarkdown(options: EnhancedExportOptions): string {
  const { story, nodes, edges } = options
  
  let markdown = `# ${story.name}\n\n`
  
  if (story.description) {
    markdown += `${story.description}\n\n`
  }
  
  if (story.tags && story.tags.length > 0) {
    markdown += `**Tags:** ${story.tags.join(', ')}\n\n`
  }
  
  if (story.genre) {
    markdown += `**Genre:** ${story.genre}\n\n`
  }
  
  markdown += `---\n\n`
  
  // Group nodes by chapter
  const nodesByChapter = new Map<string, Node[]>()
  const unassignedNodes: Node[] = []
  
  if (story.chapters && story.chapters.length > 0) {
    // Initialize chapters
    story.chapters.forEach(chapter => {
      nodesByChapter.set(chapter.id, [])
    })
    
    // Assign nodes to chapters
    nodes.forEach(node => {
      const chapter = story.chapters?.find(c => c.nodeIds.includes(node.id))
      if (chapter) {
        nodesByChapter.get(chapter.id)?.push(node)
      } else {
        unassignedNodes.push(node)
      }
    })
    
    // Export chapters in order
    const sortedChapters = [...story.chapters].sort((a, b) => a.order - b.order)
    
    sortedChapters.forEach(chapter => {
      markdown += `## ${chapter.name}\n\n`
      if (chapter.description) {
        markdown += `${chapter.description}\n\n`
      }
      
      const chapterNodes = nodesByChapter.get(chapter.id) || []
      chapterNodes.forEach(node => {
        markdown += formatNodeAsMarkdown(node, story, edges)
      })
    })
    
    if (unassignedNodes.length > 0) {
      markdown += `## Unassigned Nodes\n\n`
      unassignedNodes.forEach(node => {
        markdown += formatNodeAsMarkdown(node, story, edges)
      })
    }
  } else {
    // No chapters, export all nodes
    nodes.forEach(node => {
      markdown += formatNodeAsMarkdown(node, story, edges)
    })
  }
  
  return markdown
}

function formatNodeAsMarkdown(node: Node, story: Story, _edges: Edge[]): string {
  const nodeType = node.type || 'unknown'
  let md = `### ${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}: ${node.data.label || node.id}\n\n`
  
  // Get character name
  let characterName = node.data.characterName
  if (node.data.characterId && story.characters) {
    const character = story.characters.find(c => c.id === node.data.characterId)
    if (character) {
      characterName = character.name
    }
  }
  
  switch (node.type) {
    case 'dialogue':
      if (characterName) {
        md += `**${characterName}:** `
      }
      if (node.data.richText) {
        md += tiptapToMarkdown(node.data.richText)
      } else if (node.data.text) {
        md += `${node.data.text}\n\n`
      }
      break
    
    case 'choice':
      if (node.data.richText) {
        md += tiptapToMarkdown(node.data.richText)
      } else if (node.data.prompt) {
        md += `${node.data.prompt}\n\n`
      }
      
      if (node.data.choices) {
        node.data.choices.forEach((choice: any, index: number) => {
          const choiceText = choice.richText 
            ? tiptapToPlainText(choice.richText)
            : choice.text || `Choice ${index + 1}`
          md += `${index + 1}. ${choiceText}\n`
        })
      }
      md += '\n'
      break
    
    case 'branch':
      md += `**Condition:** \`${node.data.condition}\`\n\n`
      if (node.data.description) {
        md += `${node.data.description}\n\n`
      }
      break
    
    case 'variable':
      md += `**Operation:** \`${node.data.key} ${node.data.operation} ${node.data.value}\`\n\n`
      break
    
    case 'end':
      md += `**Ending Type:** ${node.data.endType || 'neutral'}\n\n`
      break
  }
  
  // Add notes and tags
  if (node.data.notes) {
    md += `*Notes: ${node.data.notes}*\n\n`
  }
  
  if (node.data.tags && node.data.tags.length > 0) {
    md += `*Tags: ${node.data.tags.join(', ')}*\n\n`
  }
  
  md += '---\n\n'
  
  return md
}

async function embedMediaAsset(asset: MediaAsset | null | undefined): Promise<MediaAsset | null> {
  if (!asset || !asset.url) return null
  
  try {
    // If already base64, return as-is
    if (asset.url.startsWith('data:')) {
      return asset
    }
    
    // Fetch and convert to base64
    const response = await fetch(asset.url)
    const blob = await response.blob()
    
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve({
          ...asset,
          url: reader.result as string,
          thumbnail: asset.thumbnail?.startsWith('data:') 
            ? asset.thumbnail 
            : reader.result as string,
        })
      }
      reader.onerror = () => {
        console.error('Failed to embed media asset:', asset.filename)
        resolve(asset) // Return original on error
      }
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Failed to embed media asset:', error)
    return asset // Return original on error
  }
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

// Legacy export function for backward compatibility
export async function exportToHTMLLegacy(options: ExportOptions): Promise<string> {
  return exportToHTML({
    story: options.story,
    nodes: options.nodes,
    edges: options.edges,
    variables: options.variables,
    embedAssets: options.embedAssets,
  })
}
