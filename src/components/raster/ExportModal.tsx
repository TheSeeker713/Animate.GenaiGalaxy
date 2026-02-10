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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Export Animation</h2>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Export Settings */}
        {!isExporting ? (
          <div className="space-y-4">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Export Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ExportFormat)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              >
                <option value="gif">GIF Animation (Looping)</option>
                <option value="mp4">MP4/WebM Video</option>
                <option value="png-sequence">PNG Sequence (Individual Frames)</option>
                <option value="sprite-sheet">Sprite Sheet (Single Image)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {format === 'gif' && 'Animated GIF with transparency support'}
                {format === 'mp4' && 'Video format (WebM with fallback to MP4)'}
                {format === 'png-sequence' && 'Individual PNG files for each frame'}
                {format === 'sprite-sheet' && 'All frames in a single grid image'}
              </p>
            </div>

            {/* Dimensions */}
            <div>
              <label className="block text-sm font-medium mb-2">Dimensions</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  placeholder="Width"
                  min="1"
                  max="4096"
                />
                <span className="flex items-center">×</span>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  placeholder="Height"
                  min="1"
                  max="4096"
                />
              </div>
            </div>

            {/* FPS (not for sprite sheet) */}
            {format !== 'sprite-sheet' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Frame Rate: {exportFps} FPS
                </label>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={exportFps}
                  onChange={(e) => setExportFps(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Quality (GIF only) */}
            {format === 'gif' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Quality: {quality}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Higher quality = larger file size
                </p>
              </div>
            )}

            {/* Sprite Sheet Columns */}
            {format === 'sprite-sheet' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Columns: {spriteColumns}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={spriteColumns}
                  onChange={(e) => setSpriteColumns(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Rows: {Math.ceil(frames.length / spriteColumns)} | Total frames: {frames.length}
                </p>
              </div>
            )}

            {/* Frame Count */}
            {format !== 'sprite-sheet' && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total frames: <strong>{frames.length}</strong>
              </div>
            )}

            {/* Estimated File Size Info */}
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-2 rounded">
              {format === 'gif' && '💡 GIF works best for short animations with limited colors'}
              {format === 'mp4' && '💡 Video format is best for longer, complex animations'}
              {format === 'png-sequence' && '💡 Individual PNGs will download separately'}
              {format === 'sprite-sheet' && '💡 Single image containing all frames in a grid'}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                Export {getFormatLabel()}
              </button>
            </div>
          </div>
        ) : (
          /* Progress Bar */
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-lg font-semibold mb-2">
                Exporting {getFormatLabel()}... {progress}%
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
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
