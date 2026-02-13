// Media Library Component
// Gallery view for browsing and selecting media assets

import { useState } from 'react'
import type { MediaAsset } from '../../types/story'
import { MediaUploader } from './MediaUploader'
import { formatFileSize } from '../../utils/mediaManager'

interface MediaLibraryProps {
  assets: MediaAsset[]
  onSelect: (asset: MediaAsset) => void
  onUpload: (asset: MediaAsset) => void
  onDelete?: (assetId: string) => void
  onClose: () => void
  selectedId?: string
}

export function MediaLibrary({
  assets,
  onSelect,
  onUpload,
  onDelete,
  onClose,
  selectedId,
}: MediaLibraryProps) {
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploader, setShowUploader] = useState(false)

  const filteredAssets = assets.filter((asset) => {
    // Type filter
    if (filter !== 'all' && asset.type !== filter) return false
    
    // Search filter
    if (searchQuery && !asset.filename.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    return true
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Media Library</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b flex gap-3 items-center flex-wrap">
          {/* Upload button */}
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            {showUploader ? 'Cancel Upload' : '+ Upload New'}
          </button>

          {/* Filter tabs */}
          <div className="flex gap-1 border rounded overflow-hidden">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm ${
                filter === 'all' ? 'bg-gray-200 font-medium' : 'bg-white hover:bg-gray-50'
              }`}
            >
              All ({assets.length})
            </button>
            <button
              onClick={() => setFilter('image')}
              className={`px-3 py-1.5 text-sm ${
                filter === 'image' ? 'bg-gray-200 font-medium' : 'bg-white hover:bg-gray-50'
              }`}
            >
              Images ({assets.filter(a => a.type === 'image').length})
            </button>
            <button
              onClick={() => setFilter('video')}
              className={`px-3 py-1.5 text-sm ${
                filter === 'video' ? 'bg-gray-200 font-medium' : 'bg-white hover:bg-gray-50'
              }`}
            >
              Videos ({assets.filter(a => a.type === 'video').length})
            </button>
          </div>

          {/* Search */}
          <input
            type="search"
            placeholder="Search by filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-1.5 border rounded text-sm"
          />
        </div>

        {/* Upload area */}
        {showUploader && (
          <div className="p-4 border-b bg-gray-50">
            <MediaUploader
              onUpload={(asset) => {
                onUpload(asset)
                setShowUploader(false)
              }}
              accept="image/*,video/*"
            />
          </div>
        )}

        {/* Gallery grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {assets.length === 0 ? (
                <>
                  <p className="text-lg mb-2">No media uploaded yet</p>
                  <p className="text-sm">Click "Upload New" to add images or videos</p>
                </>
              ) : (
                <p>No assets match your search</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {filteredAssets.map((asset) => (
                <MediaCard
                  key={asset.id}
                  asset={asset}
                  selected={asset.id === selectedId}
                  onSelect={() => onSelect(asset)}
                  onDelete={onDelete ? () => onDelete(asset.id) : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 text-sm text-gray-600">
          {filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'} •
          Total size: {formatFileSize(assets.reduce((sum, a) => sum + a.size, 0))}
        </div>
      </div>
    </div>
  )
}

// Media Card Component
interface MediaCardProps {
  asset: MediaAsset
  selected: boolean
  onSelect: () => void
  onDelete?: () => void
}

function MediaCard({ asset, selected, onSelect, onDelete }: MediaCardProps) {
  return (
    <div
      className={`
        relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-all
        ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-400'}
      `}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-gray-100">
        {asset.type === 'image' ? (
          <img
            src={asset.thumbnail || asset.url}
            alt={asset.filename}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="relative w-full h-full">
            <img
              src={asset.thumbnail}
              alt={asset.filename}
              className="w-full h-full object-cover"
            />
            {/* Video play icon overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Info overlay */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-white text-xs font-medium truncate">{asset.filename}</p>
        <p className="text-gray-300 text-xs">{formatFileSize(asset.size)}</p>
      </div>

      {/* Selected checkmark */}
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (confirm('Delete this media? This cannot be undone if it\'s used in nodes.')) {
              onDelete()
            }
          }}
          className="absolute top-2 left-2 w-6 h-6 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity flex items-center justify-center text-sm font-bold"
          title="Delete"
        >
          ×
        </button>
      )}
    </div>
  )
}
