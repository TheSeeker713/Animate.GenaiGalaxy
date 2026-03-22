import { useReactFlow, useStore } from 'reactflow'

/**
 * Toolbar controls for the Story Builder infinite canvas (React Flow).
 * Must render inside ReactFlowProvider, as a sibling ancestor of ReactFlow.
 */
export default function StoryViewportControls() {
  const { fitView, zoomTo } = useReactFlow()
  const zoom = useStore((s) => s.transform[2])
  const zoomLabel = `${Math.round(zoom * 100)}%`

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span
        className="text-slate-500 hidden lg:inline max-w-[220px] truncate"
        title="Pan in any direction; scroll or pinch to zoom. No fixed page size."
      >
        Infinite canvas
      </span>
      <button
        type="button"
        onClick={() =>
          fitView({ padding: 0.2, duration: 320, maxZoom: 1.5 })
        }
        className="px-2.5 py-1 rounded-md bg-slate-700/80 hover:bg-slate-600 text-white text-xs font-medium transition-colors border border-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/40"
        title="Fit all nodes in view"
      >
        Fit graph
      </button>
      <button
        type="button"
        onClick={() => zoomTo(1, { duration: 240 })}
        className="px-2.5 py-1 rounded-md bg-slate-700/80 hover:bg-slate-600 text-white text-xs font-medium transition-colors border border-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/40"
        title="Reset zoom to 100%"
      >
        100%
      </button>
      <span className="text-xs text-slate-400 tabular-nums min-w-[3rem]">{zoomLabel}</span>
    </div>
  )
}
