import { useState } from 'react'
import { useAnimationStore } from '../../store/useAnimationStore'
import { exportToGif, downloadBlob, prepareFramesForExport } from '../../utils/gifExporter'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { frames, fps } = useAnimationStore()
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [quality, setQuality] = useState(80)
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(600)
  const [exportFps, setExportFps] = useState(fps)

  if (!isOpen) return null

  const handleExport = async () => {
    try {
      setIsExporting(true)
      setProgress(0)

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
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      downloadBlob(blob, `animation-${timestamp}.gif`)

      setIsExporting(false)
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed: ' + (error as Error).message)
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Export as GIF</h2>
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
                />
                <span className="flex items-center">×</span>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  placeholder="Height"
                />
              </div>
            </div>

            {/* FPS */}
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

            {/* Quality */}
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

            {/* Frame Count */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total frames: <strong>{frames.length}</strong>
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
                Export GIF
              </button>
            </div>
          </div>
        ) : (
          /* Progress Bar */
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-lg font-semibold mb-2">
                Exporting... {progress}%
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Please wait while we generate your GIF...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
