import { useState } from 'react'
import { useStoryStore } from '../../store/storyStore'
import { showToast } from '../../store/toastStore'
import {
  exportToHTML,
  exportToJSON,
  exportToMarkdown,
  exportToPlainTextOutline,
} from '../../utils/storyExporter'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { currentStory, nodes, edges, variables, importedCharacters } = useStoryStore()
  const [exportFormat, setExportFormat] = useState<'html' | 'json' | 'markdown' | 'txt'>('html')
  const [includeCharacters, setIncludeCharacters] = useState(true)
  const [embedAssets, setEmbedAssets] = useState(true)
  const [includeStudioLinks, setIncludeStudioLinks] = useState(true)
  const [exporting, setExporting] = useState(false)

  if (!isOpen || !currentStory) return null

  const handleExport = async () => {
    setExporting(true)
    
    try {
      if (exportFormat === 'html') {
        const html = await exportToHTML({
          story: currentStory,
          nodes,
          edges,
          variables,
          embedAssets,
        })
        
        // Download HTML file
        const blob = new Blob([html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${currentStory.name.replace(/\s+/g, '-')}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (exportFormat === 'json') {
        const json = exportToJSON({
          story: currentStory,
          nodes,
          edges,
          variables,
          includeStudioLinks,
        })
        
        // Download JSON file
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${currentStory.name.replace(/\s+/g, '-')}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (exportFormat === 'markdown') {
        const markdown = exportToMarkdown({
          story: currentStory,
          nodes,
          edges,
          variables,
        })
        
        // Download Markdown file
        const blob = new Blob([markdown], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${currentStory.name.replace(/\s+/g, '-')}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (exportFormat === 'txt') {
        const text = exportToPlainTextOutline({
          story: currentStory,
          nodes,
          edges,
          variables,
        })
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${currentStory.name.replace(/\s+/g, '-')}-outline.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
      
      showToast(
        `Story exported as ${exportFormat.toUpperCase()}.`,
        'success'
      )
      onClose()
    } catch (error) {
      console.error('Export error:', error)
      showToast('Export failed. Please try again.', 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl max-w-2xl w-full p-6 border-2 border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Export Story</h2>
            <p className="text-slate-400 text-sm mt-1">
              Download your story as a playable file
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Story Info */}
        <div className="bg-slate-900 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📖</span>
            <div>
              <h3 className="text-white font-bold">{currentStory.name}</h3>
              {currentStory.description && (
                <p className="text-sm text-slate-400">{currentStory.description}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            <div>
              <div className="text-2xl font-bold text-cyan-400">{nodes.length}</div>
              <div className="text-xs text-slate-400">Nodes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">{edges.length}</div>
              <div className="text-xs text-slate-400">Connections</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{importedCharacters.length}</div>
              <div className="text-xs text-slate-400">Characters</div>
            </div>
          </div>
        </div>

        {/* Export Format */}
        <div className="mb-6">
          <label className="block text-white font-medium mb-3">Export Format</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setExportFormat('html')}
              className={`p-4 rounded-lg border-2 transition-all ${
                exportFormat === 'html'
                  ? 'bg-blue-600/20 border-blue-500 text-white'
                  : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="text-2xl mb-2">🌐</div>
              <div className="font-bold">HTML5 Player</div>
              <div className="text-xs mt-1 opacity-80">
                Playable in browser
              </div>
            </button>
            <button
              onClick={() => setExportFormat('json')}
              className={`p-4 rounded-lg border-2 transition-all ${
                exportFormat === 'json'
                  ? 'bg-green-600/20 border-green-500 text-white'
                  : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="text-2xl mb-2">📄</div>
              <div className="font-bold">Project JSON</div>
              <div className="text-xs mt-1 opacity-80">
                Re-import later
              </div>
            </button>
            <button
              onClick={() => setExportFormat('markdown')}
              className={`p-4 rounded-lg border-2 transition-all ${
                exportFormat === 'markdown'
                  ? 'bg-purple-600/20 border-purple-500 text-white'
                  : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="text-2xl mb-2">📝</div>
              <div className="font-bold">Markdown</div>
              <div className="text-xs mt-1 opacity-80">
                Text document
              </div>
            </button>
            <button
              onClick={() => setExportFormat('txt')}
              className={`p-4 rounded-lg border-2 transition-all ${
                exportFormat === 'txt'
                  ? 'bg-amber-600/20 border-amber-500 text-white'
                  : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="font-bold">Plain outline</div>
              <div className="text-xs mt-1 opacity-80">
                .txt for notes / diff
              </div>
            </button>
          </div>
        </div>

        {/* Export Options (JSON) */}
        {exportFormat === 'json' && (
          <div className="mb-6 space-y-3">
            <label className="block text-white font-medium mb-3">Options</label>
            <label className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={includeStudioLinks}
                onChange={(e) => setIncludeStudioLinks(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <div className="flex-1">
                <div className="text-white font-medium">Include Character Studio links</div>
                <div className="text-xs text-slate-400">
                  Adds <code className="text-cyan-400">studioLinks</code> metadata when story characters were imported from Character Studio (
                  <code className="text-cyan-400">importedFromCharacterStudio</code>)
                </div>
              </div>
            </label>
          </div>
        )}

        {/* Export Options (HTML only) */}
        {exportFormat === 'html' && (
          <div className="mb-6 space-y-3">
            <label className="block text-white font-medium mb-3">Options</label>
            
            <label className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={includeCharacters}
                onChange={(e) => setIncludeCharacters(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <div className="flex-1">
                <div className="text-white font-medium">Include Characters</div>
                <div className="text-xs text-slate-400">
                  Embed character portraits and data
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={embedAssets}
                onChange={(e) => setEmbedAssets(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <div className="flex-1">
                <div className="text-white font-medium">Embed Assets (Base64)</div>
                <div className="text-xs text-slate-400">
                  Single file with all images embedded
                </div>
              </div>
            </label>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <div className="text-blue-400 text-xl flex-shrink-0">ℹ️</div>
            <div className="text-sm text-blue-200">
              {exportFormat === 'html' ? (
                <>
                  <strong>HTML5 Player:</strong> Creates a standalone webpage that plays your story.
                  Share it anywhere, no server required. Works offline!
                </>
              ) : exportFormat === 'json' ? (
                <>
                  <strong>Project JSON:</strong> Saves story graph, variables, and schema{' '}
                  <code className="text-cyan-300">genai-galaxy-story</code> v2.1. Optional Character Studio
                  cross-references for tooling.
                </>
              ) : exportFormat === 'markdown' ? (
                <>
                  <strong>Markdown:</strong> Human-readable script with chapters and dialogue.
                </>
              ) : (
                <>
                  <strong>Plain outline:</strong> Compact text list of nodes and variables.
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 px-4 py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Exporting...
              </>
            ) : (
              <>
                📦 Export {exportFormat.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
