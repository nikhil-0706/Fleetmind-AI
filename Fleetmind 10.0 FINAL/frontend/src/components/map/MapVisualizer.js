import React, { useRef, useEffect, useState, useCallback } from 'react';

const MapVisualizer = ({
  nodes = [],
  edges = [],
  trucks = [],
  warehouses = [],
  loads = [],
  role = 'admin',
  height = 400,
  className = '',
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const [transform, setTransform] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panStartOffset, setPanStartOffset] = useState({ x: 0, y: 0 });

  const getBounds = useCallback(() => {
    if (nodes.length === 0) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of nodes) {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    }
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    return { minX, maxX, minY, maxY, rangeX, rangeY };
  }, [nodes]);

  const toPixel = useCallback((x, y, width, height, bounds, scale, offsetX, offsetY) => {
    const padding = 40;
    const { minX, maxX, minY, maxY, rangeX, rangeY } = bounds;
    const availW = width - padding * 2;
    const availH = height - padding * 2;
    const baseScale = Math.min(availW / rangeX, availH / rangeY);
    const finalScale = baseScale * scale;
    const offsetXAdj = offsetX + padding + (availW - baseScale * rangeX) / 2;
    const offsetYAdj = offsetY + padding + (availH - baseScale * rangeY) / 2;
    return {
      px: offsetXAdj + (x - minX) * finalScale,
      py: offsetYAdj + (y - minY) * finalScale,
      scale: finalScale,
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.min(8, Math.max(0.2, prev.scale + delta)),
    }));
  }, []);

  const handleMouseDown = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    setIsPanning(true);
    setPanStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setPanStartOffset({ x: transform.offsetX, y: transform.offsetY });
  }, [transform.offsetX, transform.offsetY]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const dx = currentX - panStart.x;
    const dy = currentY - panStart.y;
    setTransform(prev => ({
      ...prev,
      offsetX: panStartOffset.x + dx,
      offsetY: panStartOffset.y + dy,
    }));
  }, [isPanning, panStart, panStartOffset]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);
  const handleMouseLeave = useCallback(() => setIsPanning(false), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = dimensions;
    if (width === 0 || height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (nodes.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No map data available', width / 2, height / 2);
      return;
    }

    const bounds = getBounds();
    const nodeMap = Object.fromEntries(nodes.map(n => [n.node_id, n]));
    const { scale, offsetX, offsetY } = transform;

    // ── 1. Edges ──────────────────────────────────────────────────────────
    for (const edge of edges) {
      const from = nodeMap[edge.from_node];
      const to = nodeMap[edge.to_node];
      if (!from || !to) continue;
      const p1 = toPixel(from.x, from.y, width, height, bounds, scale, offsetX, offsetY);
      const p2 = toPixel(to.x, to.y, width, height, bounds, scale, offsetX, offsetY);
      ctx.beginPath();
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = Math.max(1, 0.8 * scale);
      ctx.stroke();

      // Only show distance label when zoomed in a lot (> 4x)
      if (scale > 4.0) {
        const mx = (p1.px + p2.px) / 2;
        const my = (p1.py + p2.py) / 2;
        ctx.fillStyle = '#64748b';
        ctx.font = `${Math.min(12, 10 * scale)}px sans-serif`; // cap at 12px
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${edge.distance_km} km`, mx, my - 2);
      }
    }

    // ── 2. Nodes ──────────────────────────────────────────────────────────
    // Keep node sizes small unless zoomed in
    const nodeRadius = Math.max(3, Math.min(8, 3 * scale));
    const showNodeLabels = scale > 1.5;

    for (const node of nodes) {
      const p = toPixel(node.x, node.y, width, height, bounds, scale, offsetX, offsetY);
      const isWarehouse = node.is_warehouse || warehouses.some(w => w.node_id === node.node_id);
      ctx.beginPath();
      ctx.arc(p.px, p.py, isWarehouse ? nodeRadius * 1.6 : nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = isWarehouse ? '#f59e0b' : '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, 1.2 * scale);
      ctx.stroke();

      if (showNodeLabels) {
        ctx.fillStyle = '#1e293b';
        ctx.font = `${Math.min(12, 8 * scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(node.node_id, p.px, p.py + nodeRadius + 2);
      }
    }

    // ── 3. Warehouses ────────────────────────────────────────────────────
    for (const wh of warehouses) {
      const node = nodeMap[wh.node_id];
      if (!node) continue;
      const p = toPixel(node.x, node.y, width, height, bounds, scale, offsetX, offsetY);
      ctx.beginPath();
      ctx.arc(p.px, p.py, nodeRadius * 3, 0, 2 * Math.PI);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = Math.max(1, 1.5 * scale);
      ctx.setLineDash([4 * scale, 4 * scale]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Warehouse name only at high zoom (> 3x)
      if (scale > 3.0) {
        ctx.fillStyle = '#b45309';
        ctx.font = `bold ${Math.min(14, 10 * scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('🏢', p.px, p.py - 10 * scale);
        ctx.fillStyle = '#92400e';
        ctx.font = `${Math.min(12, 8 * scale)}px sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(wh.warehouse_id || wh.node_id, p.px, p.py + nodeRadius * 2 + 2);
      } else {
        // Small warehouse icon at any zoom
        ctx.fillStyle = '#b45309';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('🏢', p.px, p.py - 10);
      }
    }

    // ── 4. Loads ──────────────────────────────────────────────────────────
    for (const load of loads) {
      const node = nodeMap[load.pickup_node_id];
      if (!node) continue;
      const p = toPixel(node.x, node.y, width, height, bounds, scale, offsetX, offsetY);
      const fontSize = Math.min(18, 14 * scale);
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📦', p.px, p.py - 18 * scale);

      // Load ID only at high zoom (> 3x)
      if (scale > 3.0) {
        ctx.fillStyle = '#065f46';
        ctx.font = `${Math.min(11, 7 * scale)}px sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(load.load_id, p.px, p.py - 6 * scale);
      }
    }

    // ── 5. Trucks ──────────────────────────────────────────────────────────
    for (const truck of trucks) {
      let px, py;
      if (truck.current_node_id) {
        const node = nodeMap[truck.current_node_id];
        if (!node) continue;
        const p = toPixel(node.x, node.y, width, height, bounds, scale, offsetX, offsetY);
        px = p.px; py = p.py;
      } else if (truck.current_edge_id) {
        const edge = edges.find(e => e.edge_id === truck.current_edge_id);
        if (!edge) continue;
        const from = nodeMap[edge.from_node];
        const to = nodeMap[edge.to_node];
        if (!from || !to) continue;
        const p1 = toPixel(from.x, from.y, width, height, bounds, scale, offsetX, offsetY);
        const p2 = toPixel(to.x, to.y, width, height, bounds, scale, offsetX, offsetY);
        const fraction = Math.min(truck.progress_km / edge.distance_km, 1);
        px = p1.px + (p2.px - p1.px) * fraction;
        py = p1.py + (p2.py - p1.py) * fraction;
      } else continue;

      const glowRadius = Math.min(18, 14 * scale);
      const gradient = ctx.createRadialGradient(px, py, 2 * scale, px, py, glowRadius);
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, glowRadius, 0, 2 * Math.PI);
      ctx.fill();

      const truckRadius = Math.max(4, Math.min(8, 5 * scale));
      ctx.beginPath();
      ctx.arc(px, py, truckRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, 1.5 * scale);
      ctx.stroke();

      // Truck ID visible at moderate zoom (> 1.2x)
      if (scale > 1.2) {
        ctx.fillStyle = '#065f46';
        ctx.font = `bold ${Math.min(12, 9 * scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(truck.truck_id, px, py - truckRadius - 2);
      }

      // Status dot (always visible)
      const badgeSize = Math.max(2, Math.min(5, 3 * scale));
      if (truck.status === 'TRAVELING') {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(px + 10 * scale, py - 8 * scale, badgeSize, 0, 2 * Math.PI);
        ctx.fill();
      } else if (truck.status === 'AT_NODE') {
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(px + 10 * scale, py - 8 * scale, badgeSize, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // ── 6. Legend (fixed size, not scaled) ─────────────────────────────
    const legendX = 12, legendY = 12;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(legendX, legendY, 150, 110, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
    let lx = legendX + 12, ly = legendY + 16;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const legendItems = [
      { color: '#3b82f6', label: 'Node' },
      { color: '#f59e0b', label: 'Warehouse' },
      { color: '#10b981', label: 'Truck' },
      { label: '📦 Load (pickup)' },
      { label: '🏢 Warehouse' },
    ];
    for (const item of legendItems) {
      if (item.color) {
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(lx + 6, ly, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#1e293b';
        ctx.fillText(item.label, lx + 16, ly);
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillText(item.label, lx, ly);
      }
      ly += 20;
    }

    // Zoom indicator
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.font = '10px sans-serif';
    ctx.fillText(`Zoom: ${Math.round(scale * 100)}%`, width - 100, 30);

  }, [nodes, edges, trucks, warehouses, loads, dimensions, getBounds, toPixel, transform]);

  return (
    <div ref={containerRef} className={`w-full ${className}`} style={{ height: `${height}px`, position: 'relative' }}>
      <canvas ref={canvasRef} className="w-full h-full" style={{ cursor: isPanning ? 'grabbing' : 'grab' }} />
      <div className="absolute bottom-2 left-2 text-xs text-text-light bg-white/80 px-2 py-1 rounded shadow">
        Scroll to zoom · Drag to pan
      </div>
    </div>
  );
};

if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
    return this;
  };
}

export default React.memo(MapVisualizer);