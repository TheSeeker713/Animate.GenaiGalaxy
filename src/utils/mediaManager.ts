// Media Management Utilities
// Handles file uploads, compression, validation, and thumbnail generation

import imageCompression from 'browser-image-compression'
import { nanoid } from 'nanoid'
import type { MediaAsset } from '../types/story'

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB
const MAX_IMAGE_WIDTH = 1920
const MAX_IMAGE_HEIGHT = 1080
const THUMBNAIL_SIZE = 100
const TARGET_COMPRESSION_SIZE = 500 * 1024  // 500KB per image

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm']

/**
 * Upload and process a media file
 */
export async function uploadMedia(file: File): Promise<MediaAsset> {
  // Validate file
  validateFile(file)
  
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)
  
  if (!isImage && !isVideo) {
    throw new Error('Unsupported file type. Please upload an image (JPG, PNG, WebP, GIF) or video (MP4, WebM).')
  }
  
  let processedBlob: Blob
  let thumbnail: string | undefined
  
  if (isImage) {
    // Compress image
    processedBlob = await compressImage(file)
    
    // Generate thumbnail
    thumbnail = await generateThumbnail(processedBlob, THUMBNAIL_SIZE)
  } else {
    // Videos: use as-is (don't compress, too expensive)
    processedBlob = file
    
    // Generate video thumbnail (first frame)
    thumbnail = await generateVideoThumbnail(file)
  }
  
  // Create blob URL for storage
  const url = URL.createObjectURL(processedBlob)
  
  return {
    id: nanoid(),
    type: isImage ? 'image' : 'video',
    url,
    thumbnail,
    filename: file.name,
    size: processedBlob.size,
    uploadedAt: new Date().toISOString(),
  }
}

/**
 * Validate file size and type
 */
function validateFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit. Please choose a smaller file.`)
  }
  
  const allAllowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]
  if (!allAllowedTypes.includes(file.type)) {
    throw new Error('Unsupported file type.')
  }
}

/**
 * Compress image to reduce file size
 */
export async function compressImage(file: File | Blob): Promise<Blob> {
  try {
    const compressed = await imageCompression(file as File, {
      maxSizeMB: TARGET_COMPRESSION_SIZE / 1024 / 1024,
      maxWidthOrHeight: Math.max(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT),
      useWebWorker: true,
      fileType: 'image/webp',  // Convert to WebP for better compression
    })
    
    return compressed
  } catch (error) {
    console.error('Image compression failed:', error)
    // Return original if compression fails
    return file as Blob
  }
}

/**
 * Generate thumbnail from image
 */
export async function generateThumbnail(
  file: File | Blob,
  size: number = THUMBNAIL_SIZE
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      // Create canvas for thumbnail
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }
      
      // Calculate dimensions (maintain aspect ratio)
      let width = img.width
      let height = img.height
      
      if (width > height) {
        if (width > size) {
          height = (height * size) / width
          width = size
        }
      } else {
        if (height > size) {
          width = (width * size) / height
          height = size
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and export
      ctx.drawImage(img, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
      
      URL.revokeObjectURL(url)
      resolve(dataUrl)
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for thumbnail'))
    }
    
    img.src = url
  })
}

/**
 * Generate thumbnail from video (first frame)
 */
export async function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    
    video.onloadeddata = () => {
      // Seek to 1 second (or start if shorter)
      video.currentTime = Math.min(1, video.duration)
    }
    
    video.onseeked = () => {
      // Create canvas and capture frame
      const canvas = document.createElement('canvas')
      canvas.width = THUMBNAIL_SIZE
      canvas.height = (video.videoHeight / video.videoWidth) * THUMBNAIL_SIZE
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
      
      URL.revokeObjectURL(url)
      resolve(dataUrl)
    }
    
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load video for thumbnail'))
    }
    
    video.src = url
    video.load()
  })
}

/**
 * Delete media and cleanup blob URL
 */
export function deleteMedia(media: MediaAsset): void {
  // Revoke blob URL to free memory
  if (media.url.startsWith('blob:')) {
    URL.revokeObjectURL(media.url)
  }
  
  // Note: Actual deletion from IndexedDB should be handled by the store
}

/**
 * Convert blob URL to data URL (for export)
 */
export async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
  const response = await fetch(blobUrl)
  const blob = await response.blob()
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Estimate storage size for media library
 */
export function calculateMediaLibrarySize(mediaAssets: MediaAsset[]): number {
  return mediaAssets.reduce((total, asset) => total + asset.size, 0)
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * Check if storage quota is available
 */
export async function checkStorageQuota(): Promise<{
  available: boolean
  usage: number
  quota: number
  percentUsed: number
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate()
    const usage = estimate.usage || 0
    const quota = estimate.quota || 0
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0
    
    return {
      available: percentUsed < 95,  // Block at 95% usage
      usage,
      quota,
      percentUsed,
    }
  }
  
  // Fallback: assume 50MB available for IndexedDB
  return {
    available: true,
    usage: 0,
    quota: 50 * 1024 * 1024,
    percentUsed: 0,
  }
}

/**
 * Warn user about storage usage
 */
export function shouldWarnAboutStorage(percentUsed: number): boolean {
  return percentUsed >= 80
}
