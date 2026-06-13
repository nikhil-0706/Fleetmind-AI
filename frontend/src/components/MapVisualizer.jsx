import { useEffect, useRef, useState } from 'react'
import { mockMap } from '../services/mockData'

export default function MapVisualizer({ nodes, edges, activeTrucks = [], highlightPath = [] }) {
  const canvasRef = useRef(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [tooltip, setTooltip] = useState(null)

  const mapData = { nodes: nodes || mockMap.nodes, edges: edges || mockMap.edges }

  const nodeMap = Object.fromEntries(mapData.nodes.map((n) => [n.node_id, n]))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    ctx.clearRect(0, 0, W, H)

    // Background grid
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 1
    for (let x = 0; x < W; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
    }
    for (let y = 0; y < H; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    }

    // Scale nodes to canvas
    const allX = mapData.nodes.map((n) => n.x)
    const allY = mapData.nodes.map((n) => n.y)
    const minX = Math.min(...allX), maxX = Math.max(...allX)
    const minY = Math.min(...allY), maxY = Math.max(...allY)
    const pad = 60

    const scaleX = (x) => pad + ((x - minX) / (maxX - minX || 1)) * (W - pad * 2)
    const scaleY = (y) => pad + ((y - minY) / (maxY - minY || 1)) * (H - pad * 2)

    // Draw edges
    mapData.edges.forEach((edge) => {
      const from = nodeMap[edge.from_node]
      const to = nodeMap[edge.to_node]
      if (!from || !to) return

      const isHighlighted = highlightPath.includes(edge.edge_id)
      ctx.beginPath()
      ctx.moveTo(scaleX(from.x), scaleY(from.y))
      ctx.lineTo(scaleX(to.x), scaleY(to.y))
      ctx.strokeStyle = isHighlighted ? '#3b82f6' : '#334155'
      ctx.lineWidth = isHighlighted ? 3 : 1.5
      ctx.stroke()

      // Distance label
      const midX = (scaleX(from.x) + scaleX(to.x)) / 2
      const midY = (scaleY(from.y) + scaleY(to.y)) / 2
      ctx.fillStyle = '#475569'
      ctx.font = '10px monospace'
      ctx.fillText(`${edge.distance_km}km`, midX, midY)
    })

    // Draw nodes
    mapData.nodes.forEach((node) => {
      const x = scaleX(node.x)
      const y = scaleY(node.y)
      const isHovered = hoveredNode === node.node_id

      // Glow
      if (node.is_warehouse || isHovered) {
        ctx.beginPath()
        ctx.arc(x, y, 18, 0, Math.PI * 2)
        ctx.fillStyle = node.is_warehouse ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)'
        ctx.fill()
      }

      // Node circle
      ctx.beginPath()
      ctx.arc(x, y, 10, 0, Math.PI * 2)
      ctx.fillStyle = node.is_warehouse ? '#f59e0b' : '#3b82f6'
      ctx.fill()
      ctx.strokeStyle = isHovered ? '#ffffff' : '#0f172a'
      ctx.lineWidth = 2
      ctx.stroke()

      // Label
      ctx.fillStyle = '#cbd5e1'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(node.label || node.node_id, x, y + 24)
    })

    // Draw active trucks
    activeTrucks.forEach((truck) => {
      if (!truck.current_edge_id) return
      const edge = mapData.edges.find((e) => e.edge_id === truck.current_edge_id)
      if (!edge) return
      const from = nodeMap[edge.from_node]
      const to = nodeMap[edge.to_node]
      if (!from || !to) return
      const pct = truck.progress_km / edge.distance_km
      const tx = scaleX(from.x) + (scaleX(to.x) - scaleX(from.x)) * pct
      const ty = scaleY(from.y) + (scaleY(to.y) - scaleY(from.y)) * pct

      ctx.beginPath()
      ctx.arc(tx, ty, 8, 0, Math.PI * 2)
      ctx.fillStyle = '#10b981'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = '#fff'
      ctx.font = 'bold 8px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('🚛', tx, ty + 3)
    })
  }, [mapData, hoveredNode, activeTrucks, highlightPath])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={700}
        height={400}
        className="w-full rounded-lg bg-dark-950"
      />
      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 bg-dark-900/90 px-2 py-1 rounded text-xs text-dark-300">
          <div className="w-3 h-3 rounded-full bg-amber-500" /> Warehouse Node
        </div>
        <div className="flex items-center gap-2 bg-dark-900/90 px-2 py-1 rounded text-xs text-dark-300">
          <div className="w-3 h-3 rounded-full bg-blue-500" /> Regular Node
        </div>
        <div className="flex items-center gap-2 bg-dark-900/90 px-2 py-1 rounded text-xs text-dark-300">
          <div className="w-3 h-3 rounded-full bg-emerald-500" /> Truck
        </div>
      </div>
    </div>
  )
}