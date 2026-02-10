import { useState } from 'react'
import type { Character } from '@/types/character'
import Konva from 'konva'

interface ExportModalProps {
  character: Character
  stageRef: React.RefObject<Konva.Stage>
  onClose: () => void
}

export default function ExportModal({ character, stageRef, onClose }: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<'png' | 'gif' | 'json'>('png')
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  const exportAsPNG = () => {
    const stage = stageRef.current
    if (!stage) return

    setIsExporting(true)
    setExportProgress(50)

    setTimeout(() => {
      try {
        const dataURL = stage.toDataURL({ pixelRatio: 2 })
        const link = document.createElement('a')
        link.download = `${character.name|| 'character'}.png`
        link.href = dataURL
        link.click()
        
        setExportProgress(100)
        setTimeout(() => {
          setIsExporting(false)
          onClose()
        }, 500)
      } catch (error) {
        console.error('Export failed:', error)
        setIsExporting(false)
        alert('Export failed. Please try again.')
      }
    }, 100)
  }

  const exportAsJSON = () => {
    setIsExporting(true)
    setExportProgress(50)

    setTimeout(() => {
      try {
        const exportData = {
          version: '1.0',
          character: {
            ...character,
            // Remove image data URLs to reduce file size
            layers: character.layers.map(layer => ({
              ...layer,
              imageData: layer.imageData ? '[removed]' : ''
            }))
          },
          exportedAt: new Date().toISOString()
        }

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = `${character.name || 'character'}.json`
        link.href = url
        link.click()
        URL.revokeObjectURL(url)

        setExportProgress(100)
        setTimeout(() => {
          setIsExporting(false)
          onClose()
        }, 500)
      } catch (error) {
        console.error('Export failed:', error)
        setIsExporting(false)
        alert('Export failed. Please try again.')
      }
    }, 100)
  }

  const exportAsSpineJSON = () => {
    setIsExporting(true)
    setExportProgress(25)

    setTimeout(() => {
      try {
        // Basic Spine JSON export structure
        const spineData = {
          skeleton: {
            hash: character.id,
            spine: '4.0',
            x: 0,
            y: 0,
            width: 1024,
            height: 1024
          },
          bones: character.skeleton.bones.map(bone => ({
            name: bone.name,
            parent: bone.parentId || undefined,
            x: bone.position.x,
            y: bone.position.y,
            rotation: bone.rotation,
            length: bone.length
          })),
          slots: character.layers.map((layer) => ({
            name: layer.name,
            bone: character.skeleton.rootBoneId,
            attachment: layer.name
          })),
          skins: {
            default: character.layers.reduce((acc, layer) => {
              acc[layer.name] = {
                [layer.name]: {
                  x: layer.position.x,
                  y: layer.position.y,
                  rotation: layer.rotation,
                  width: 100,
                  height: 100
                }
              }
              return acc
            }, {} as any)
          },
          animations: {}
        }

        setExportProgress(75)

        const blob = new Blob([JSON.stringify(spineData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = `${character.name || 'character'}-spine.json`
        link.href = url
        link.click()
        URL.revokeObjectURL(url)

        setExportProgress(100)
        setTimeout(() => {
          setIsExporting(false)
         onClose()
        }, 500)
      } catch (error) {
        console.error('Export failed:', error)
        setIsExporting(false)
        alert('Export failed. Please try again.')
      }
    }, 100)
  }

  const handleExport = () => {
    switch (exportFormat) {
      case 'png':
        exportAsPNG()
        break
      case 'gif':
        alert('GIF export coming soon!')
        break
      case 'json':
        exportAsSpineJSON()
        break
    }
  }

  const handleProjectExport = () => {
    exportAsJSON()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full border border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold">Export Character</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export format selection */}
          <div>
            <label className="block text-sm font-medium mb-3">Export Format</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setExportFormat('png')}
                className={`p-4 rounded-lg border-2 transition ${
                  exportFormat === 'png'
                    ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="text-3xl mb-2">🖼️</div>
                <div className="font-semibold">PNG Image</div>
                <div className="text-xs text-gray-400 mt-1">High quality export</div>
              </button>

              <button
                onClick={() => setExportFormat('gif')}
                className={`p-4 rounded-lg border-2 transition ${
                  exportFormat === 'gif'
                    ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                disabled
              >
                <div className="text-3xl mb-2">🎞️</div>
                <div className="font-semibold">GIF Animation</div>
                <div className="text-xs text-gray-400 mt-1">Coming soon</div>
              </button>

              <button
                onClick={() => setExportFormat('json')}
                className={`p-4 rounded-lg border-2 transition ${
                  exportFormat === 'json'
                    ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="text-3xl mb-2">🎮</div>
                <div className="font-semibold">Spine JSON</div>
                <div className="text-xs text-gray-400 mt-1">For game engines</div>
              </button>
            </div>
          </div>

          {/* Format-specific options */}
          {exportFormat === 'png' && (
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">PNG Options</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• 2x pixel ratio (high DPI)</li>
                <li>• Transparent background</li>
                <li>• Current zoom and position</li>
              </ul>
            </div>
          )}

          {exportFormat === 'json' && (
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Spine JSON Options</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Compatible with Spine 4.0+</li>
                <li>• Includes bones and slots</li>
                <li>• Includes layer transforms</li>
                <li>• No animations (yet)</li>
              </ul>
            </div>
          )}

          {/* Export progress */}
          {isExporting && (
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Exporting...</span>
                <span>{exportProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-t border-gray-700">
          <button
            onClick={handleProjectExport}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-semibold transition"
            disabled={isExporting}
          >
            💾 Export Project File
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-semibold transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
