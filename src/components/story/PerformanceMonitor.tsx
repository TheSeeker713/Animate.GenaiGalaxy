import { useState, useEffect, useMemo } from 'react'
import { useStoryStore } from '../../store/storyStore'
import { calculateGraphMetrics, getPerformanceRecommendations, estimateGraphMemory } from '../../utils/viewportUtils'

export default function PerformanceMonitor() {
  const nodes = useStoryStore((state) => state.nodes)
  const edges = useStoryStore((state) => state.edges)
  const [showDetails, setShowDetails] = useState(false)
  const [fps, setFps] = useState(60)

  // Calculate metrics
  const metrics = useMemo(() => calculateGraphMetrics(nodes, edges), [nodes, edges])
  const recommendations = useMemo(
    () => getPerformanceRecommendations(nodes.length, edges.length),
    [nodes.length, edges.length]
  )
  const memoryEstimate = useMemo(
    () => estimateGraphMemory(nodes.length, edges.length),
    [nodes.length, edges.length]
  )

  // FPS monitoring
  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let animationId: number

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()

      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)))
        frameCount = 0
        lastTime = currentTime
      }

      animationId = requestAnimationFrame(measureFPS)
    }

    animationId = requestAnimationFrame(measureFPS)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])

  // Don't show for small graphs
  if (nodes.length < 100) return null

  const getPerformanceColor = () => {
    if (fps >= 50) return 'text-green-400'
    if (fps >= 30) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getPerformanceStatus = () => {
    if (fps >= 50) return '✅ Excellent'
    if (fps >= 30) return '⚠️ Fair'
    return '❌ Poor'
  }

  return (
    <div className="absolute top-4 right-4 z-10">
      {/* Compact View */}
      <div
        className="px-3 py-2 bg-slate-800/95 border border-slate-600 rounded-lg text-xs cursor-pointer hover:bg-slate-800 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-3">
          <span className="text-slate-300">Performance:</span>
          <span className={`font-bold ${getPerformanceColor()}`}>
            {fps} FPS
          </span>
          <span className="text-slate-400">
            {nodes.length} nodes
          </span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${showDetails ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Detailed View */}
      {showDetails && (
        <div className="mt-2 p-4 bg-slate-800/95 border border-slate-600 rounded-lg text-xs max-w-sm">
          {/* Status */}
          <div className="mb-3 pb-3 border-b border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400">Status:</span>
              <span className={`font-bold ${getPerformanceColor()}`}>
                {getPerformanceStatus()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Memory Est.:</span>
              <span className="text-white font-mono">{memoryEstimate}</span>
            </div>
          </div>

          {/* Metrics */}
          <div className="mb-3 pb-3 border-b border-slate-700">
            <div className="text-white font-semibold mb-2">Graph Metrics</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nodes:</span>
                <span className="text-white font-mono">{metrics.totalNodes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Edges:</span>
                <span className="text-white font-mono">{metrics.totalEdges}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Avg Connections:</span>
                <span className="text-white font-mono">
                  {metrics.averageConnectionsPerNode.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Isolated Nodes:</span>
                <span className="text-white font-mono">{metrics.isolatedNodes}</span>
              </div>
            </div>
          </div>

          {/* Node Types */}
          <div className="mb-3 pb-3 border-b border-slate-700">
            <div className="text-white font-semibold mb-2">Node Types</div>
            <div className="space-y-1">
              {Object.entries(metrics.nodesByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-slate-400 capitalize">{type}:</span>
                  <span className="text-white font-mono">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <div className="text-white font-semibold mb-2">Recommendations</div>
            <div className="space-y-1">
              {recommendations.map((rec, index) => (
                <div key={index} className="text-slate-300 leading-relaxed">
                  {rec}
                </div>
              ))}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setShowDetails(false)}
            className="mt-3 w-full px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}
