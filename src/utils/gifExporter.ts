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
