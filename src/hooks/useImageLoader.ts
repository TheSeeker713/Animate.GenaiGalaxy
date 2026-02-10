import { useState, useEffect } from 'react'
import { loadImage, loadImages } from '@/utils/imageLoader'

interface UseImageLoaderResult {
  image: HTMLImageElement | null
  loading: boolean
  error: Error | null
}

/**
 * Hook to load a single image with loading state
 */
export function useImageLoader(url: string | null): UseImageLoaderResult {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!url) {
      setImage(null)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    loadImage(url)
      .then((result) => {
        if (result.loaded && result.image) {
          setImage(result.image)
          setError(null)
        } else {
          setImage(null)
          setError(result.error || new Error('Failed to load image'))
        }
      })
      .catch((err) => {
        setImage(null)
        setError(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [url])

  return { image, loading, error }
}

interface UseImagesLoaderResult {
  images: (HTMLImageElement | null)[]
  loading: boolean
  error: Error | null
  allLoaded: boolean
}

/**
 * Hook to load multiple images with loading state
 */
export function useImagesLoader(urls: string[]): UseImagesLoaderResult {
  const [images, setImages] = useState<(HTMLImageElement | null)[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [allLoaded, setAllLoaded] = useState(false)

  useEffect(() => {
    if (urls.length === 0) {
      setImages([])
      setLoading(false)
      setError(null)
      setAllLoaded(true)
      return
    }

    setLoading(true)
    setError(null)
    setAllLoaded(false)

    loadImages(urls)
      .then((results) => {
        const loadedImages = results.map(r => r.image)
        setImages(loadedImages)
        
        const hasError = results.some(r => !r.loaded)
        if (hasError) {
          const firstError = results.find(r => r.error)
          setError(firstError?.error || new Error('Some images failed to load'))
        }
        
        const allSuccess = results.every(r => r.loaded && r.image)
        setAllLoaded(allSuccess)
      })
      .catch((err) => {
        setImages([])
        setError(err)
        setAllLoaded(false)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [urls.join(',')])

  return { images, loading, error, allLoaded }
}
