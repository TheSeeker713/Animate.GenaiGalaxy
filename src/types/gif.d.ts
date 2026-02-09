// Type declarations for gif.js
declare module 'gif.js' {
  export interface GifOptions {
    workers?: number
    quality?: number
    width?: number
    height?: number
    repeat?: number
    workerScript?: string
    background?: string
    transparent?: string | null
    dither?: boolean | string
    debug?: boolean
  }

  export interface GifFrame {
    delay?: number
    copy?: boolean
    dispose?: number
  }

  export default class GIF {
    constructor(options: GifOptions)
    addFrame(
      image: HTMLCanvasElement | HTMLImageElement | CanvasRenderingContext2D | ImageData,
      options?: GifFrame
    ): void
    on(event: 'finished', callback: (blob: Blob) => void): void
    on(event: 'progress', callback: (progress: number) => void): void
    on(event: 'error', callback: (error: Error) => void): void
    on(event: 'start' | 'abort', callback: () => void): void
    render(): void
    abort(): void
  }
}
