/**
 * Image Loading Utility with Caching
 * Handles preloading, caching, and error fallbacks for character layer images
 */

interface ImageCache {
  [url: string]: HTMLImageElement
}

interface ImageLoadResult {
  image: HTMLImageElement | null
  error?: Error
  loaded: boolean
}

class ImageLoaderService {
  private cache: ImageCache = {}
  private loadingPromises: Map<string, Promise<ImageLoadResult>> = new Map()

  /**
   * Load a single image with caching
   */
  async loadImage(url: string): Promise<ImageLoadResult> {
    // Return cached image if available
    if (this.cache[url]) {
      return {
        image: this.cache[url],
        loaded: true
      }
    }

    // Return existing promise if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!
    }

    // Create new loading promise
    const loadingPromise = new Promise<ImageLoadResult>((resolve) => {
      const img = new Image()
      
      img.onload = () => {
        this.cache[url] = img
        this.loadingPromises.delete(url)
        resolve({
          image: img,
          loaded: true
        })
      }

      img.onerror = (error) => {
        this.loadingPromises.delete(url)
        console.error(`Failed to load image: ${url}`, error)
        resolve({
          image: null,
          error: new Error(`Failed to load image: ${url}`),
          loaded: false
        })
      }

      img.src = url
    })

    this.loadingPromises.set(url, loadingPromise)
    return loadingPromise
  }

  /**
   * Load multiple images in parallel
   */
  async loadImages(urls: string[]): Promise<ImageLoadResult[]> {
    return Promise.all(urls.map(url => this.loadImage(url)))
  }

  /**
   * Preload images without waiting for completion
   */
  preloadImages(urls: string[]): void {
    urls.forEach(url => {
      if (!this.cache[url] && !this.loadingPromises.has(url)) {
        this.loadImage(url).catch(() => {
          // Silently fail for preload
        })
      }
    })
  }

  /**
   * Get cached image synchronously (returns null if not cached)
   */
  getCachedImage(url: string): HTMLImageElement | null {
    return this.cache[url] || null
  }

  /**
   * Check if image is cached
   */
  isCached(url: string): boolean {
    return !!this.cache[url]
  }

  /**
   * Check if image is currently loading
   */
  isLoading(url: string): boolean {
    return this.loadingPromises.has(url)
  }

  /**
   * Clear cache for specific URL or all
   */
  clearCache(url?: string): void {
    if (url) {
      delete this.cache[url]
    } else {
      this.cache = {}
    }
  }

  /**
   * Get cache size (number of cached images)
   */
  getCacheSize(): number {
    return Object.keys(this.cache).length
  }

  /**
   * Get all cached URLs
   */
  getCachedUrls(): string[] {
    return Object.keys(this.cache)
  }
}

// Export singleton instance
export const imageLoader = new ImageLoaderService()

// Export convenience functions
export const loadImage = (url: string) => imageLoader.loadImage(url)
export const loadImages = (urls: string[]) => imageLoader.loadImages(urls)
export const preloadImages = (urls: string[]) => imageLoader.preloadImages(urls)
export const getCachedImage = (url: string) => imageLoader.getCachedImage(url)
export const isCached = (url: string) => imageLoader.isCached(url)
export const isLoading = (url: string) => imageLoader.isLoading(url)
export const clearImageCache = (url?: string) => imageLoader.clearCache(url)
