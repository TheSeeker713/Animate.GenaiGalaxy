type Props = {
  open: boolean
  onClose: () => void
}

export default function StoryShortcutsModal({ open, onClose }: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-shortcuts-title"
    >
      <div className="bg-slate-800 border border-slate-600 rounded-xl max-w-md w-full p-6 shadow-xl">
        <h2 id="story-shortcuts-title" className="text-lg font-bold text-white mb-4">
          Story Builder shortcuts
        </h2>
        <ul className="text-sm text-slate-300 space-y-2 mb-6">
          <li>
            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Ctrl+Z</kbd> Undo
          </li>
          <li>
            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Ctrl+Y</kbd> or{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Ctrl+Shift+Z</kbd> Redo
          </li>
          <li>
            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Ctrl+S</kbd> Save
          </li>
          <li>
            <strong className="text-slate-200">Canvas:</strong> drag background to pan, scroll or
            pinch to zoom. The graph is unbounded (infinite canvas).
          </li>
          <li>
            <strong className="text-slate-200">Import:</strong> paste an image (e.g. screenshot from
            Raster/Vector) when not typing in a field — it is added to the media library.
          </li>
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium"
        >
          Close
        </button>
      </div>
    </div>
  )
}
