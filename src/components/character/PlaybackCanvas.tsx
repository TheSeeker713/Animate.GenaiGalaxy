/**
 * PlaybackCanvas - Pixi.js + Spine WebGL Rendering
 * High-performance 60 FPS playback layer for exported characters
 */

import { useEffect, useRef, useState } from 'react'
import { Application } from 'pixi.js'
import type { Character } from '@/types/character'
import { characterToSpineJSON } from '@/utils/spineExporter'

interface PlaybackCanvasProps {
  character: Character
  width?: number
  height?: number
  autoPlay?: boolean
  animation?: string
  className?: string
}

export default function PlaybackCanvas({
  character,
  width = 800,
  height = 600,
  autoPlay = true,
  animation = 'idle',
  className = ''
}: PlaybackCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<Application | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fps, setFps] = useState(0)

  useEffect(() => {
    if (!canvasRef.current) return

    let mounted = true
    let fpsInterval: ReturnType<typeof setInterval>

    const initPixi = async () => {
      try {
        // Create Pixi app
        const app = new Application()
        await app.init({
          canvas: canvasRef.current!,
          width,
          height,
          backgroundColor: 0x1a1a2e,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true
        })

        if (!mounted) {
          app.destroy()
          return
        }

        appRef.current = app

        // Convert character to Spine JSON
        const spineData = characterToSpineJSON(character)
        console.log('Spine JSON:', spineData)

        // For now, show a placeholder since we need actual Spine asset loading
        // In production, this would load the actual Spine atlas and skeleton
        const placeholder = await createPlaceholderSprite(app, character)
        app.stage.addChild(placeholder)

        // FPS counter
        fpsInterval = setInterval(() => {
          setFps(Math.round(app.ticker.FPS))
        }, 1000)

        setIsLoading(false)
      } catch (err) {
        console.error('Pixi init error:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize Pixi')
          setIsLoading(false)
        }
      }
    }

    initPixi()

    return () => {
      mounted = false
      clearInterval(fpsInterval)
      
      if (appRef.current) {
        appRef.current.destroy(true, {
          children: true
        })
        appRef.current = null
      }
    }
  }, [character, width, height])

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <canvas ref={canvasRef} />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--studio-bg)]/90">
          <div className="text-center">
            <div className="text-2xl mb-2">🎬</div>
            <div className="text-sm text-[var(--studio-text-dim)]">Initializing Pixi.js...</div>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/20">
          <div className="text-center px-4">
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-sm text-red-400">{error}</div>
          </div>
        </div>
      )}

      {/* FPS Counter */}
      {!isLoading && !error && (
        <div className="absolute top-2 right-2 studio-overlay text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[var(--studio-text-dim)]">FPS:</span>
            <span className={fps >= 55 ? 'text-[var(--studio-accent)]' : 'text-yellow-400'}>
              {fps}
            </span>
          </div>
        </div>
      )}

      {/* Playback Controls */}
      {!isLoading && !error && (
        <div className="absolute bottom-2 left-2 right-2 studio-overlay">
          <div className="flex items-center gap-2">
            <button
              className="tool-button text-xs px-2 py-1"
              title="Play/Pause"
            >
              {autoPlay ? '⏸️' : '▶️'}
            </button>
            <div className="flex-1 text-xs text-[var(--studio-text-dim)]">
              Animation: <span className="text-[var(--studio-text)]">{animation}</span>
            </div>
            <div className="text-xs text-[var(--studio-text-dim)]">
              WebGL Playback
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Create a placeholder sprite until we have proper Spine asset loading
 * This shows the character layers as Pixi sprites
 */
async function createPlaceholderSprite(app: Application, character: Character): Promise<any> {
  const container = new (await import('pixi.js')).Container()
  
  // Center container
  container.x = app.screen.width / 2
  container.y = app.screen.height / 2
  container.pivot.set(0.5, 0.5)

  // Add text placeholder
  const style = new (await import('pixi.js')).TextStyle({
    fontFamily: 'Space Grotesk, sans-serif',
    fontSize: 24,
    fill: 0x38e1c0,
    align: 'center'
  })

  const text = new (await import('pixi.js')).Text({
    text: `${character.name}\n\nSpine Playback Ready\n\n(Requires Spine assets)`,
    style
  })
  
  text.anchor.set(0.5)
  container.addChild(text)

  // Add breathing animation
  app.ticker.add((ticker) => {
    const time = ticker.lastTime / 1000
    container.y = app.screen.height / 2 + Math.sin(time * 2) * 5
  })

  return container
}
