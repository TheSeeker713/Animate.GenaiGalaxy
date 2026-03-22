import type { ChoiceNodeData, DialogueNodeData } from '../types/story'

/** Best image URL for compact graph node preview (thumbnail preferred). */
export function getDialogueCardImageUrl(data: DialogueNodeData): string | null {
  const fg = data.foregroundMedia
  if (fg?.type === 'image' && fg.url) return fg.thumbnail || fg.url
  const bg = data.backgroundImage
  if (bg?.url) return bg.thumbnail || bg.url
  return null
}

export function getChoiceCardImageUrl(data: ChoiceNodeData): string | null {
  const bg = data.backgroundImage
  if (bg?.url) return bg.thumbnail || bg.url
  return null
}
