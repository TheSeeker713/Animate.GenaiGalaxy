// Media Uploader Component
// Drag-and-drop file upload with preview

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadMedia, formatFileSize } from '../../utils/mediaManager'
import type { MediaAsset } from '../../types/story'

interface MediaUploaderProps {
  onUpload: (media: MediaAsset) => void
  accept?: string          // File types: 'image/*', 'video/*', etc.
  current?: MediaAsset     // Currently selected media
  onRemove?: () => void
  className?: string
  compact?: boolean        // Smaller UI for inline use
}

export function MediaUploader({
  onUpload,
  accept = 'image/*,video/*',
  current,
  onRemove,
  className = '',
  compact = false,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    const file = acceptedFiles[0]
    setUploading(true)
    setError(null)
    
    try {
      const media = await uploadMedia(file)
      onUpload(media)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.split(',').reduce((acc, type) => ({ ...acc, [type.trim()]: [] }), {}),
    multiple: false,
    disabled: uploading,
  })

  if (compact && current) {
    return (
      <div className={`relative inline-block ${className}`}>
        <img
          src={current.thumbnail || current.url}
          alt={current.filename}
          className="w-16 h-16 object-cover rounded border-2 border-gray-300"
        />
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center text-xs font-bold"
            title="Remove"
          >
            ×
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Current media preview */}
      {current && (
        <div className="mb-3 relative">
          {current.type === 'image' ? (
            <img
              src={current.url}
              alt={current.filename}
              className="w-full h-48 object-cover rounded border-2 border-gray-300"
            />
          ) : (
            <video
              src={current.url}
              controls
              className="w-full h-48 rounded border-2 border-gray-300"
            />
          )}
          
          <div className="absolute top-2 right-2 flex gap-2">
            {onRemove && (
              <button
                onClick={onRemove}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
              >
                Remove
              </button>
            )}
          </div>
          
          <div className="mt-1 text-xs text-gray-600">
            {current.filename} • {formatFileSize(current.size)}
          </div>
        </div>
      )}

      {/* Upload area */}
      {!current && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${uploading ? 'opacity-50 cursor-wait' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center gap-2">
            {/* Upload icon */}
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            
            {uploading ? (
              <p className="text-sm text-gray-600">Uploading...</p>
            ) : isDragActive ? (
              <p className="text-sm text-blue-600 font-medium">Drop file here</p>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  <span className="text-blue-600 font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  {accept.includes('image') && accept.includes('video')
                    ? 'Images (PNG, JPG, WebP, GIF) or Videos (MP4, WebM)'
                    : accept.includes('image')
                    ? 'Images only (PNG, JPG, WebP, GIF)'
                    : 'Videos only (MP4, WebM)'}
                </p>
                <p className="text-xs text-gray-500">Max 10MB</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Replace button (when media exists) */}
      {current && !uploading && (
        <button
          {...getRootProps()}
          className="mt-2 w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm text-gray-700"
        >
          <input {...getInputProps()} />
          Replace {current.type === 'image' ? 'Image' : 'Video'}
        </button>
      )}
    </div>
  )
}

// Quick upload button (no preview, just button)
interface QuickUploadButtonProps {
  onUpload: (media: MediaAsset) => void
  accept?: string
  label?: string
  className?: string
}

export function QuickUploadButton({
  onUpload,
  accept = 'image/*',
  label = 'Upload',
  className = '',
}: QuickUploadButtonProps) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    setUploading(true)
    
    try {
      const media = await uploadMedia(acceptedFiles[0])
      onUpload(media)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [onUpload])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: accept.split(',').reduce((acc, type) => ({ ...acc, [type.trim()]: [] }), {}),
    multiple: false,
    disabled: uploading,
  })

  return (
    <button
      {...getRootProps()}
      disabled={uploading}
      className={`px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-sm ${className}`}
    >
      <input {...getInputProps()} />
      {uploading ? 'Uploading...' : label}
    </button>
  )
}
