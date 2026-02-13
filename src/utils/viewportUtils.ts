// Viewport and Performance utilities for Story Canvas

import type { Node, Edge } from 'reactflow'

/**
 * Calculate viewport bounds for node filtering
 */
export function calculateViewportBounds(
  viewport: { x: number; y: number; zoom: number },
  containerWidth: number,
  containerHeight: number,
  bufferMultiplier = 2
) {
  const { x, y, zoom } = viewport
  
  const minX = -x / zoom - (containerWidth * bufferMultiplier) / zoom
  const maxX = -x / zoom + (containerWidth * (1 + bufferMultiplier)) / zoom
  const minY = -y / zoom - (containerHeight * bufferMultiplier) / zoom
  const maxY = -y / zoom + (containerHeight * (1 + bufferMultiplier)) / zoom
  
  return { minX, maxX, minY, maxY }
}

/**
 * Filter nodes within viewport bounds
 */
export function filterNodesInViewport(
  nodes: Node[],
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
): Node[] {
  return nodes.filter((node) => {
    const nodeX = node.position.x
    const nodeY = node.position.y
    
    return (
      nodeX >= bounds.minX &&
      nodeX <= bounds.maxX &&
      nodeY >= bounds.minY &&
      nodeY <= bounds.maxY
    )
  })
}

/**
 * Filter edges connected to visible nodes
 */
export function filterEdgesForVisibleNodes(
  edges: Edge[],
  visibleNodeIds: Set<string>
): Edge[] {
  return edges.filter(
    (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
  )
}

/**
 * Calculate performance metrics for graph
 */
export function calculateGraphMetrics(nodes: Node[], edges: Edge[]) {
  const metrics = {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    nodesByType: {} as Record<string, number>,
    averageConnectionsPerNode: 0,
    isolatedNodes: 0,
  }
  
  // Count nodes by type
  nodes.forEach((node) => {
    const type = node.type || 'unknown'
    metrics.nodesByType[type] = (metrics.nodesByType[type] || 0) + 1
  })
  
  // Calculate connection metrics
  const nodeConnections = new Map<string, number>()
  edges.forEach((edge) => {
    nodeConnections.set(edge.source, (nodeConnections.get(edge.source) || 0) + 1)
    nodeConnections.set(edge.target, (nodeConnections.get(edge.target) || 0) + 1)
  })
  
  // Count isolated nodes
  metrics.isolatedNodes = nodes.filter((node) => !nodeConnections.has(node.id)).length
  
  // Calculate average connections
  if (nodes.length > 0) {
    const totalConnections = Array.from(nodeConnections.values()).reduce((a, b) => a + b, 0)
    metrics.averageConnectionsPerNode = totalConnections / nodes.length
  }
  
  return metrics
}

/**
 * Get performance recommendations based on graph size
 */
export function getPerformanceRecommendations(nodeCount: number, edgeCount: number) {
  const recommendations: string[] = []
  
  if (nodeCount > 5000) {
    recommendations.push('⚠️ Critical: Graph exceeds maximum recommended size (5000 nodes)')
    recommendations.push('Consider splitting into multiple stories or chapters')
  } else if (nodeCount > 1000) {
    recommendations.push('⚠️ Warning: Large graph detected - Performance may be impacted')
    recommendations.push('Viewport virtualization is enabled automatically')
  } else if (nodeCount > 500) {
    recommendations.push('ℹ️ Medium-sized graph - Consider using chapters for organization')
  }
  
  if (edgeCount > nodeCount * 3) {
    recommendations.push('ℹ️ High edge density detected - Consider simplifying connections')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ Graph size is optimal for performance')
  }
  
  return recommendations
}

/**
 * Estimate memory usage for graph
 */
export function estimateGraphMemory(nodeCount: number, edgeCount: number): string {
  // Rough estimates based on average object sizes
  const bytesPerNode = 500 // Approximate size including data
  const bytesPerEdge = 200
  
  const totalBytes = (nodeCount * bytesPerNode) + (edgeCount * bytesPerEdge)
  
  if (totalBytes < 1024) {
    return `${totalBytes} B`
  } else if (totalBytes < 1024 * 1024) {
    return `${(totalBytes / 1024).toFixed(1)} KB`
  } else {
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
  }
}

/**
 * Debounce function for viewport updates
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(later, wait)
  }
}

/**
 * Check if node is within circular viewport (for radial layouts)
 */
export function isNodeInCircularViewport(
  nodeX: number,
  nodeY: number,
  centerX: number,
  centerY: number,
  radius: number
): boolean {
  const dx = nodeX - centerX
  const dy = nodeY - centerY
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  return distance <= radius
}

/**
 * Spatial index for fast node lookup (simple grid-based)
 */
export class SpatialIndex {
  private grid: Map<string, Node[]>
  private cellSize: number
  
  constructor(cellSize = 1000) {
    this.grid = new Map()
    this.cellSize = cellSize
  }
  
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize)
    const cellY = Math.floor(y / this.cellSize)
    return `${cellX},${cellY}`
  }
  
  insert(node: Node): void {
    const key = this.getCellKey(node.position.x, node.position.y)
    if (!this.grid.has(key)) {
      this.grid.set(key, [])
    }
    this.grid.get(key)!.push(node)
  }
  
  query(bounds: { minX: number; maxX: number; minY: number; maxY: number }): Node[] {
    const results: Node[] = []
    const visited = new Set<string>()
    
    // Check all cells that intersect with bounds
    const minCellX = Math.floor(bounds.minX / this.cellSize)
    const maxCellX = Math.floor(bounds.maxX / this.cellSize)
    const minCellY = Math.floor(bounds.minY / this.cellSize)
    const maxCellY = Math.floor(bounds.maxY / this.cellSize)
    
    for (let x = minCellX; x <= maxCellX; x++) {
      for (let y = minCellY; y <= maxCellY; y++) {
        const key = `${x},${y}`
        const nodes = this.grid.get(key)
        
        if (nodes) {
          nodes.forEach((node) => {
            if (!visited.has(node.id)) {
              visited.add(node.id)
              
              // Final bounds check
              if (
                node.position.x >= bounds.minX &&
                node.position.x <= bounds.maxX &&
                node.position.y >= bounds.minY &&
                node.position.y <= bounds.maxY
              ) {
                results.push(node)
              }
            }
          })
        }
      }
    }
    
    return results
  }
  
  clear(): void {
    this.grid.clear()
  }
}
