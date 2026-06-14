import { useEffect, useRef } from 'react'

export default function MapVisualizer({ nodes = [], edges = [], activeTrucks = [], loads = [] }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    ctx.clearRect(0, 0, w, h)

    if (!nodes.length || !edges.length) {
      ctx.fillStyle = '#999'
      ctx.font = '12px sans-serif'
      ctx.fillText('No map data available', w/2 - 60, h/2)
      return
    }

    // Find bounds
    const xs = nodes.map(n => n.x)
    const ys = nodes.map(n => n.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const pad = 40
    const scaleX = (x) => pad + ((x - minX) / (maxX - minX || 1)) * (w - pad * 2)
    const scaleY = (y) => pad + ((y - minY) / (maxY - minY || 1)) * (h - pad * 2)

    // Draw edges
    edges.forEach(edge => {
      const from = nodes.find(n => n.node_id === edge.from_node)
      const to = nodes.find(n => n.node_id === edge.to_node)
      if (!from || !to) return
      ctx.beginPath()
      ctx.moveTo(scaleX(from.x), scaleY(from.y))
      ctx.lineTo(scaleX(to.x), scaleY(to.y))
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 2
      ctx.stroke()
      const mx = (scaleX(from.x) + scaleX(to.x)) / 2
      const my = (scaleY(from.y) + scaleY(to.y)) / 2
      ctx.fillStyle = '#475569'
      ctx.font = '9px monospace'
      ctx.fillText(`${edge.distance_km}km`, mx, my)
    })

    // Draw nodes
    nodes.forEach(node => {
      const x = scaleX(node.x)
      const y = scaleY(node.y)
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, 2 * Math.PI)
      ctx.fillStyle = node.is_warehouse ? '#f59e0b' : '#3b82f6'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.fillStyle = '#1e293b'
      ctx.font = 'bold 10px sans-serif'
      ctx.fillText(node.node_id, x - 10, y - 10)
    })

    // Draw loads
    loads.forEach(load => {
      const pickupNode = nodes.find(n => n.node_id === load.pickup_node)
      if (!pickupNode) return
      const x = scaleX(pickupNode.x)
      const y = scaleY(pickupNode.y) - 12
      ctx.font = '18px sans-serif'
      ctx.fillStyle = '#8B5CF6'
      ctx.fillText('📦', x - 8, y - 4)
      ctx.font = '8px sans-serif'
      ctx.fillStyle = '#1e293b'
      ctx.fillText(load.load_id, x - 10, y - 2)
    })

    // Draw trucks
    activeTrucks.forEach(truck => {
      if (!truck.current_edge_id) return
      const edge = edges.find(e => e.edge_id === truck.current_edge_id)
      if (!edge) return
      const from = nodes.find(n => n.node_id === edge.from_node)
      const to = nodes.find(n => n.node_id === edge.to_node)
      if (!from || !to) return
      const pct = (truck.progress_km || 0) / edge.distance_km
      const tx = scaleX(from.x) + (scaleX(to.x) - scaleX(from.x)) * pct
      const ty = scaleY(from.y) + (scaleY(to.y) - scaleY(from.y)) * pct
      ctx.beginPath()
      ctx.arc(tx, ty, 7, 0, 2 * Math.PI)
      ctx.fillStyle = '#10b981'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 8px sans-serif'
      ctx.fillText(truck.truck_id, tx - 6, ty - 6)
    })
  }, [nodes, edges, activeTrucks, loads])

  return (
    <canvas
      ref={canvasRef}
      width={350}
      height={350}
      className="w-full max-w-[350px] h-auto rounded-lg border border-border bg-white mx-auto"
    />
  )
}