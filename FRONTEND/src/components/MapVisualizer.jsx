import { useEffect, useRef } from 'react';

export default function MapVisualizer({ nodes = [], edges = [], activeTrucks = [], loads = [], warehouses = [], height = 400 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    if (!nodes.length) {
      ctx.fillStyle = '#999';
      ctx.font = '12px sans-serif';
      ctx.fillText('No map data available', w/2 - 60, h/2);
      return;
    }

    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const pad = 40;
    const scaleX = (x) => pad + ((x - minX) / (maxX - minX || 1)) * (w - pad * 2);
    const scaleY = (y) => pad + ((y - minY) / (maxY - minY || 1)) * (h - pad * 2);

    // Edges
    edges.forEach(edge => {
      const from = nodes.find(n => n.node_id === edge.from_node);
      const to = nodes.find(n => n.node_id === edge.to_node);
      if (!from || !to) return;
      ctx.beginPath();
      ctx.moveTo(scaleX(from.x), scaleY(from.y));
      ctx.lineTo(scaleX(to.x), scaleY(to.y));
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Nodes
    nodes.forEach(node => {
      const x = scaleX(node.x);
      const y = scaleY(node.y);
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = node.is_warehouse ? '#f59e0b' : '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(node.node_id, x - 12, y - 8);
    });

    // Warehouses (additional marker)
    warehouses.forEach(wh => {
      const node = nodes.find(n => n.node_id === wh.node_id);
      if (node) {
        const x = scaleX(node.x);
        const y = scaleY(node.y);
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, 2 * Math.PI);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Loads (pickup nodes)
    loads.forEach(load => {
      const node = nodes.find(n => n.node_id === load.pickup_node_id);
      if (node) {
        const x = scaleX(node.x);
        const y = scaleY(node.y) - 12;
        ctx.font = '18px sans-serif';
        ctx.fillStyle = '#8B5CF6';
        ctx.fillText('📦', x - 8, y - 4);
        ctx.font = '8px sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.fillText(load.load_id, x - 10, y - 2);
      }
    });

    // Trucks
    activeTrucks.forEach(truck => {
      if (!truck.current_edge_id) return;
      const edge = edges.find(e => e.edge_id === truck.current_edge_id);
      if (!edge) return;
      const from = nodes.find(n => n.node_id === edge.from_node);
      const to = nodes.find(n => n.node_id === edge.to_node);
      if (!from || !to) return;
      const pct = (truck.progress_km || 0) / edge.distance_km;
      const tx = scaleX(from.x) + (scaleX(to.x) - scaleX(from.x)) * pct;
      const ty = scaleY(from.y) + (scaleY(to.y) - scaleY(from.y)) * pct;
      ctx.beginPath();
      ctx.arc(tx, ty, 7, 0, 2 * Math.PI);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText(truck.truck_id, tx - 6, ty - 6);
    });
  }, [nodes, edges, activeTrucks, loads, warehouses]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={height}
      className="w-full h-auto rounded-lg border border-border bg-white"
    />
  );
}