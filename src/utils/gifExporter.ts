import GIF from 'gif.js'

export interface GifExportOptions {
  fps: number
  quality: number // 1-100
  width: number
  height: number
  repeat: number // 0 = loop forever, -1 = no repeat, N = repeat N times
  workers: number // Number of web workers to use
}

/**
 * Export animation frames as GIF
 * @param canvasFrames Array of canvas elements or data URLs
 * @param options Export options
 * @param onProgress Progress callback (0-1)
 * @returns Promise that resolves with GIF blob
 */
export async function exportToGif(
  canvasFrames: (HTMLCanvasElement | string)[],
  options: GifExportOptions,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const gif = new GIF({
      workers: options.workers || 2,
      quality: Math.floor((100 - options.quality) / 10), // gif.js uses 1-10, lower is better
      width: options.width,
      height: options.height,
      repeat: options.repeat,
      workerScript: new URL('gif.js/dist/gif.worker.js', import.meta.url).href,
    })

    const delay = 1000 / options.fps

    // Add frames
    canvasFrames.forEach((frame) => {
      if (typeof frame === 'string') {
        // If it's a data URL, create an image
        const img = new Image()
        img.src = frame
        gif.addFrame(img, { delay })
      } else {
        // If it's a canvas, add directly
        gif.addFrame(frame, { delay, copy: true })
      }
    })

    // Progress event
    if (onProgress) {
      gif.on('progress', (p) => {
        onProgress(p)
      })
    }

    // Finished event
    gif.on('finished', (blob) => {
      resolve(blob)
    })

    // Error event
    gif.on('error', (error) => {
      reject(error)
    })

    // Start rendering
    gif.render()
  })
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Convert frames from Zustand store to canvases for export
 */
export async function prepareFramesForExport(
  frames: Array<{ layers: Array<{ imageData: string; visible: boolean; opacity: number }> }>,
  width: number,
  height: number
): Promise<HTMLCanvasElement[]> {
  const canvases: HTMLCanvasElement[] = []

  for (const frame of frames) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) continue

    // Composite all visible layers
    for (const layer of frame.layers) {
      if (!layer.visible || !layer.imageData) continue

      // Load image asynchronously
      await new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = () => {
          ctx.globalAlpha = layer.opacity
          ctx.drawImage(img, 0, 0, width, height)
          resolve()
        }
        img.onerror = () => resolve() // Skip on error
        img.src = layer.imageData
      })
    }

    ctx.globalAlpha = 1
    canvases.push(canvas)
  }

  return canvases
}

/**
 * Export animation as PNG sequence (zip file)
 */
export async function exportToPngSequence(
  frames: Array<{ layers: Array<{ imageData: string; visible: boolean; opacity: number }> }>,
  width: number,
  height: number,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const canvases = await prepareFramesForExport(frames, width, height)
  
  // Since we can't create real zip files in browser without a library,
  // we'll download individual PNGs
  // For production, you'd want to use JSZip library
  
  // For now, create a simple text file with instructions
  let progressCount = 0
  const totalFrames = canvases.length
  
  for (let i = 0; i < canvases.length; i++) {
    const canvas = canvases[i]
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png')
    })
    
    const filename = `frame_${String(i + 1).padStart(4, '0')}.png`
    downloadBlob(blob, filename)
    
    progressCount++
    if (onProgress) {
      onProgress(progressCount / totalFrames)
    }
    
    // Small delay between downloads to avoid browser blocking
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Return empty blob to satisfy return type
  return new Blob(['PNG sequence exported'])
}

/**
 * Export animation as sprite sheet
 */
export async function exportToSpriteSheet(
  frames: Array<{ layers: Array<{ imageData: string; visible: boolean; opacity: number }> }>,
  width: number,
  height: number,
  columns: number,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const canvases = await prepareFramesForExport(frames, width, height)
  
  if (canvases.length === 0) {
    throw new Error('No frames to export')
  }
  
  const rows = Math.ceil(canvases.length / columns)
  const spriteWidth = width * columns
  const spriteHeight = height * rows
  
  // Create sprite sheet canvas
  const spriteCanvas = document.createElement('canvas')
  spriteCanvas.width = spriteWidth
  spriteCanvas.height = spriteHeight
  const ctx = spriteCanvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }
  
  // Draw each frame on the sprite sheet
  for (let i = 0; i < canvases.length; i++) {
    const col = i % columns
    const row = Math.floor(i / columns)
    const x = col * width
    const y = row * height
    
    ctx.drawImage(canvases[i], x, y, width, height)
    
    if (onProgress) {
      onProgress((i + 1) / canvases.length)
    }
  }
  
  // Convert to blob
  return new Promise((resolve) => {
    spriteCanvas.toBlob((blob) => {
      resolve(blob!)
    }, 'image/png')
  })
}

/**
 * Export animation as MP4 video using MediaRecorder API
 */
export async function exportToMp4(
  frames: Array<{ layers: Array<{ imageData: string; visible: boolean; opacity: number; duration?: number }> }>,
  width: number,
  height: number,
  fps: number,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const canvases = await prepareFramesForExport(frames, width, height)
  
  if (canvases.length === 0) {
    throw new Error('No frames to export')
  }
  
  // Create a temporary canvas for playback
  const playbackCanvas = document.createElement('canvas')
  playbackCanvas.width = width
  playbackCanvas.height = height
  const ctx = playbackCanvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }
  
  // Check if MediaRecorder is supported
  const stream = playbackCanvas.captureStream(fps)
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm')
    ? 'video/webm'
    : 'video/mp4'
  
  const chunks: Blob[] = []
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 5000000, // 5 Mbps
  })
  
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data)
    }
  }
  
  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType })
      resolve(blob)
    }
    
    recorder.onerror = () => {
      reject(new Error('Recording failed'))
    }
    
    recorder.start()
    
    // Play through frames
    let currentFrame = 0
    const frameDuration = 1000 / fps
    
    const interval = setInterval(() => {
      if (currentFrame < canvases.length) {
        ctx.clearRect(0, 0, width, height)
        ctx.drawImage(canvases[currentFrame], 0, 0)
        
        if (onProgress) {
          onProgress((currentFrame + 1) / canvases.length)
        }
        
        currentFrame++
      } else {
        // Finished all frames
        clearInterval(interval)
        
        // Stop recording after a small delay to ensure last frame is captured
        setTimeout(() => {
          recorder.stop()
        }, 100)
      }
    }, frameDuration)
  })
}
