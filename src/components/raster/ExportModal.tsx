import { useState } from 'react'
import { useAnimationStore } from '../../store/useAnimationStore'
import { 
  exportToGif, 
  exportToPngSequence, 
  exportToSpriteSheet, 
  exportToMp4,
  downloadBlob, 
  prepareFramesForExport 
} from '../../utils/gifExporter'

type ExportFormat = 'gif' | 'mp4' | 'png-sequence' | 'sprite-sheet'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { frames, fps } = useAnimationStore()
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [format, setFormat] = useState<ExportFormat>('gif')
  const [quality, setQuality] = useState(80)
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(600)
  const [exportFps, setExportFps] = useState(fps)
  const [spriteColumns, setSpriteColumns] = useState(4)

  if (!isOpen) return null

  const handleExport = async () => {
    try {
      setIsExporting(true)
      setProgress(0)

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')

      switch (format) {
        case 'gif': {
          // Prepare frames
          const canvases = await prepareFramesForExport(frames, width, height)

          if (canvases.length === 0) {
            alert('No frames to export!')
            setIsExporting(false)
            return
          }

          // Export to GIF
          const blob = await exportToGif(
            canvases,
            {
              fps: exportFps,
              quality,
              width,
              height,
              repeat: 0, // Loop forever
              workers: 2,
            },
            (p) => {
              setProgress(Math.round(p * 100))
            }
          )

          // Download
          downloadBlob(blob, `animation-${timestamp}.gif`)
          break
        }

        case 'mp4': {
          const blob = await exportToMp4(
            frames,
            width,
            height,
            exportFps,
            (p) => {
              setProgress(Math.round(p * 100))
            }
          )

          const extension = blob.type.includes('webm') ? 'webm' : 'mp4'
          downloadBlob(blob, `animation-${timestamp}.${extension}`)
          break
        }

        case 'png-sequence': {
          await exportToPngSequence(
            frames,
            width,
            height,
            (p) => {
              setProgress(Math.round(p * 100))
            }
          )
          // Individual PNGs are downloaded automatically
          break
        }

        case 'sprite-sheet': {
          const blob = await exportToSpriteSheet(
            frames,
            width,
            height,
            spriteColumns,
            (p) => {
              setProgress(Math.round(p * 100))
            }
          )

          downloadBlob(blob, `spritesheet-${timestamp}.png`)
          break
        }
      }

      setIsExporting(false)
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed: ' + (error as Error).message)
      setIsExporting(false)
    }
  }

  const getFormatLabel = () => {
    switch (format) {
      case 'gif': return 'GIF Animation'
      case 'mp4': return 'MP4 Video'
      case 'png-sequence': return 'PNG Sequence'
      case 'sprite-sheet': return 'Sprite Sheet'
      default: return 'Export'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="studio-panel" style={{ width: '100%', maxWidth: '28rem', padding: '1.5rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--studio-text)]">Export Animation</h2>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="text-[var(--studio-text-dim)] hover:text-[var(--studio-accent)] text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Export Settings */}
        {!isExporting ? (
          <div className="space-y-4">
            {/* Format Selection */}
            <div>
              <label className="block text-xs font-medium text-[var(--studio-text-dim)] mb-1">Export Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ExportFormat)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--studio-surface)] border border-[var(--studio-border)] text-[var(--studio-text)] focus:border-[var(--studio-accent)] focus:outline-none transition-colors"
              >
                <option value="gif">GIF Animation (Looping)</option>
                <option value="mp4">MP4/WebM Video</option>
                <option value="png-sequence">PNG Sequence (Individual Frames)</option>
                <option value="sprite-sheet">Sprite Sheet (Single Image)</option>
              </select>
              <p className="text-xs text-[var(--studio-text-dim)] mt-1">
                {format === 'gif' && 'Animated GIF with transparency support'}
                {format === 'mp4' && 'Video format (WebM with fallback to MP4)'}
                {format === 'png-sequence' && 'Individual PNG files for each frame'}
                {format === 'sprite-sheet' && 'All frames in a single grid image'}
              </p>
            </div>

            {/* Dimensions */}
            <div>
              <label className="block text-xs font-medium text-[var(--studio-text-dim)] mb-1">Dimensions</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="flex-1 px-3 py-2 rounded-lg text-sm bg-[var(--studio-surface)] border border-[var(--studio-border)] text-[var(--studio-text)] focus:border-[var(--studio-accent)] focus:outline-none"
                  placeholder="Width"
                  min="1"
                  max="4096"
                />
                <span className="text-[var(--studio-text-dim)] text-sm">×</span>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="flex-1 px-3 py-2 rounded-lg text-sm bg-[var(--studio-surface)] border border-[var(--studio-border)] text-[var(--studio-text)] focus:border-[var(--studio-accent)] focus:outline-none"
                  placeholder="Height"
                  min="1"
                  max="4096"
                />
              </div>
            </div>

            {/* FPS (not for sprite sheet) */}
            {format !== 'sprite-sheet' && (
              <div>
                <label className="block text-xs font-medium text-[var(--studio-text-dim)] mb-1">
                  Frame Rate: <span className="text-[var(--studio-accent)]">{exportFps} FPS</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={exportFps}
                  onChange={(e) => setExportFps(Number(e.target.value))}
                  className="w-full accent-[var(--studio-accent)]"
                />
              </div>
            )}

            {/* Quality (GIF only) */}
            {format === 'gif' && (
              <div>
                <label className="block text-xs font-medium text-[var(--studio-text-dim)] mb-1">
                  Quality: <span className="text-[var(--studio-accent)]">{quality}%</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-[var(--studio-accent)]"
                />
                <p className="text-xs text-[var(--studio-text-dim)] mt-1">
                  Higher quality = larger file size
                </p>
              </div>
            )}

            {/* Sprite Sheet Columns */}
            {format === 'sprite-sheet' && (
              <div>
                <label className="block text-xs font-medium text-[var(--studio-text-dim)] mb-1">
                  Columns: <span className="text-[var(--studio-accent)]">{spriteColumns}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={spriteColumns}
                  onChange={(e) => setSpriteColumns(Number(e.target.value))}
                  className="w-full accent-[var(--studio-accent)]"
                />
                <p className="text-xs text-[var(--studio-text-dim)] mt-1">
                  Rows: {Math.ceil(frames.length / spriteColumns)} | Total frames: {frames.length}
                </p>
              </div>
            )}

            {/* Frame Count */}
            {format !== 'sprite-sheet' && (
              <div className="text-sm text-[var(--studio-text-dim)]">
                Total frames: <strong className="text-[var(--studio-text)]">{frames.length}</strong>
              </div>
            )}

            {/* Info */}
            <div className="text-xs text-[var(--studio-text-dim)] bg-[var(--studio-surface)] p-2.5 rounded-lg border border-[var(--studio-border)]">
              {format === 'gif' && '💡 GIF works best for short animations with limited colors'}
              {format === 'mp4' && '💡 Video format is best for longer, complex animations'}
              {format === 'png-sequence' && '💡 Individual PNGs will download separately'}
              {format === 'sprite-sheet' && '💡 Single image containing all frames in a grid'}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg text-sm border border-[var(--studio-border)] text-[var(--studio-text-dim)] hover:bg-[var(--studio-surface)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-[var(--studio-bg)] transition-colors"
                style={{ background: 'var(--studio-accent)' }}
              >
                Export {getFormatLabel()}
              </button>
            </div>
          </div>
        ) : (
          /* Progress Bar */
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-base font-semibold mb-3 text-[var(--studio-text)]">
                Exporting {getFormatLabel()}... {progress}%
              </div>
              <div className="w-full bg-[var(--studio-surface)] rounded-full h-3 overflow-hidden border border-[var(--studio-border)]">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%`, background: 'var(--studio-accent)' }}
                />
              </div>
            </div>
            <p className="text-sm text-[var(--studio-text-dim)] text-center">
              {format === 'png-sequence' 
                ? 'Downloading individual PNG files...' 
                : `Please wait while we generate your ${getFormatLabel()}...`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
