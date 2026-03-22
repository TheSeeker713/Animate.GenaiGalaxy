import { nanoid } from 'nanoid'
import type { MediaAsset } from '../types/story'

/** Build a Story media-library entry from a raster/vector screenshot or file data URL. */
export function createMediaAssetFromDataUrl(dataUrl: string, filename: string): MediaAsset {
  return {
    id: nanoid(),
    type: 'image',
    url: dataUrl,
    thumbnail: dataUrl,
    filename: filename.replace(/[^\w.-]+/g, '_') || 'import.png',
    size: Math.round(dataUrl.length * 0.75),
    uploadedAt: new Date().toISOString(),
  }
}
