import type { TiptapJSON } from '../types/story'

/**
 * Converts TiptapJSON to HTML string for rendering and export
 */
export function tiptapToHTML(json: TiptapJSON | null | undefined): string {
  if (!json) return ''
  
  return renderNode(json)
}

function renderNode(node: any): string {
  if (node.type === 'text') {
    let text = escapeHtml(node.text || '')
    
    // Apply marks
    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case 'bold':
            text = `<strong>${text}</strong>`
            break
          case 'italic':
            text = `<em>${text}</em>`
            break
          case 'underline':
            text = `<u>${text}</u>`
            break
          case 'strike':
            text = `<s>${text}</s>`
            break
          case 'code':
            text = `<code>${text}</code>`
            break
          case 'textStyle':
            if (mark.attrs?.color) {
              text = `<span style="color: ${mark.attrs.color}">${text}</span>`
            }
            break
        }
      }
    }
    
    return text
  }
  
  // Render content children
  const content = node.content ? node.content.map(renderNode).join('') : ''
  
  switch (node.type) {
    case 'doc':
      return content
    
    case 'paragraph':
      return `<p>${content || '<br>'}</p>`
    
    case 'heading':
      const level = node.attrs?.level || 1
      return `<h${level}>${content}</h${level}>`
    
    case 'bulletList':
      return `<ul>${content}</ul>`
    
    case 'orderedList':
      return `<ol>${content}</ol>`
    
    case 'listItem':
      return `<li>${content}</li>`
    
    case 'blockquote':
      return `<blockquote>${content}</blockquote>`
    
    case 'codeBlock':
      return `<pre><code>${content}</code></pre>`
    
    case 'hardBreak':
      return '<br>'
    
    case 'horizontalRule':
      return '<hr>'
    
    default:
      return content
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

/**
 * Converts TiptapJSON to plain text (strips all formatting)
 */
export function tiptapToPlainText(json: TiptapJSON | null | undefined): string {
  if (!json) return ''
  
  return extractText(json)
}

function extractText(node: any): string {
  if (node.type === 'text') {
    return node.text || ''
  }
  
  if (node.content) {
    return node.content.map(extractText).join(node.type === 'paragraph' ? '\n' : '')
  }
  
  return ''
}

/**
 * Converts TiptapJSON to Markdown
 */
export function tiptapToMarkdown(json: TiptapJSON | null | undefined): string {
  if (!json) return ''
  
  return renderNodeAsMarkdown(json)
}

function renderNodeAsMarkdown(node: any): string {
  if (node.type === 'text') {
    let text = node.text || ''
    
    // Apply marks
    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case 'bold':
            text = `**${text}**`
            break
          case 'italic':
            text = `*${text}*`
            break
          case 'underline':
            text = `<u>${text}</u>` // Markdown doesn't have underline, use HTML
            break
          case 'strike':
            text = `~~${text}~~`
            break
          case 'code':
            text = `\`${text}\``
            break
        }
      }
    }
    
    return text
  }
  
  // Render content children
  const content = node.content ? node.content.map(renderNodeAsMarkdown).join('') : ''
  
  switch (node.type) {
    case 'doc':
      return content
    
    case 'paragraph':
      return `${content}\n\n`
    
    case 'heading':
      const level = node.attrs?.level || 1
      return `${'#'.repeat(level)} ${content}\n\n`
    
    case 'bulletList':
      return content
    
    case 'orderedList':
      return content
    
    case 'listItem':
      return `- ${content}\n`
    
    case 'blockquote':
      return `> ${content}\n\n`
    
    case 'codeBlock':
      return `\`\`\`\n${content}\n\`\`\`\n\n`
    
    case 'hardBreak':
      return '  \n'
    
    case 'horizontalRule':
      return '---\n\n'
    
    default:
      return content
  }
}
