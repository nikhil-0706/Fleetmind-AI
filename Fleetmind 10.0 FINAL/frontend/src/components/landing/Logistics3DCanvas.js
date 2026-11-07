import React, { useEffect, useRef } from 'react';

/**
 * Interactive 3D Logistics Spatial Network Canvas
 * Projects 3D rotating graph nodes and dynamic shipment pulse arcs onto HTML5 Canvas
 * Reacts to mouse movement with smooth angular momentum
 */
export default function Logistics3DCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse parallax tracking
    let targetRotX = 0.2;
    let targetRotY = 0;
    let rotX = 0.2;
    let rotY = 0;

    const handleMouseMove = (e) => {
      const normX = (e.clientX / width) * 2 - 1;
      const normY = (e.clientY / height) * 2 - 1;
      targetRotY = normX * 0.45;
      targetRotX = normY * 0.35 + 0.15;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Generate 3D Hub Nodes on a sphere / spatial manifold
    const NODE_COUNT = 36;
    const RADIUS = Math.min(width, height) * 0.38;
    const nodes = [];

    // Golden spiral distribution on 3D sphere
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
    for (let i = 0; i < NODE_COUNT; i++) {
      const y = 1 - (i / (NODE_COUNT - 1)) * 2; // -1 to 1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      nodes.push({
        x: x * RADIUS,
        y: y * RADIUS,
        z: z * RADIUS,
        baseSize: Math.random() * 2.5 + 2.5,
        pulseSpeed: Math.random() * 0.03 + 0.02,
        pulsePhase: Math.random() * Math.PI * 2,
        isWarehouse: i % 4 === 0,
      });
    }

    // Connect nodes into highway routes
    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dz = nodes[i].z - nodes[j].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < RADIUS * 0.72) {
          links.push({
            from: i,
            to: j,
            progress: Math.random(), // For cargo shipment pulses
            speed: Math.random() * 0.005 + 0.003,
          });
        }
      }
    }

    // Ambient floating 3D dust particles
    const PARTICLE_COUNT = 45;
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 1.2,
        y: (Math.random() - 0.5) * height * 1.2,
        z: (Math.random() - 0.5) * 800,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.8 + 0.8,
      });
    }

    let angle = 0;

    const render = () => {
      // Clear with dark cyber gradient
      ctx.clearRect(0, 0, width, height);

      // Smooth rotation dampening
      angle += 0.0025;
      rotX += (targetRotX - rotX) * 0.05;
      rotY += (targetRotY + angle - rotY) * 0.05;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const fov = 650;
      const centerX = width * 0.5;
      const centerY = height * 0.5;

      // Project function (3D -> 2D)
      const project = (x, y, z) => {
        // Rotate around Y
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;

        // Rotate around X
        const y2 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX + 600;

        const scale = fov / Math.max(10, z2);
        return {
          px: centerX + x1 * scale,
          py: centerY + y2 * scale,
          scale: scale,
          depth: z2,
        };
      };

      // 1. Render Floating Ambient Particles
      ctx.fillStyle = 'rgba(147, 197, 253, 0.25)';
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -width * 0.6) p.x = width * 0.6;
        if (p.x > width * 0.6) p.x = -width * 0.6;
        if (p.y < -height * 0.6) p.y = height * 0.6;
        if (p.y > height * 0.6) p.y = -height * 0.6;

        const proj = project(p.x, p.y, p.z);
        if (proj.depth > 100) {
          ctx.beginPath();
          ctx.arc(proj.px, proj.py, p.size * Math.min(1.5, proj.scale * 1.2), 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 2. Project Nodes
      const projectedNodes = nodes.map((n) => {
        n.pulsePhase += n.pulseSpeed;
        const proj = project(n.x, n.y, n.z);
        return {
          ...n,
          ...proj,
          pulse: (Math.sin(n.pulsePhase) + 1) * 0.5,
        };
      });

      // 3. Render Highway Route Arcs
      links.forEach((link) => {
        const p1 = projectedNodes[link.from];
        const p2 = projectedNodes[link.to];

        if (p1.depth < 100 || p2.depth < 100) return;

        // Depth-based opacity
        const avgDepth = (p1.depth + p2.depth) / 2;
        const alpha = Math.max(0.04, Math.min(0.28, (800 - avgDepth) / 700));

        ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
        ctx.lineWidth = Math.max(0.6, 1.2 * ((p1.scale + p2.scale) / 2));
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();

        // Animated cargo dispatch packet
        link.progress = (link.progress + link.speed) % 1;
        const pulseX = p1.px + (p2.px - p1.px) * link.progress;
        const pulseY = p1.py + (p2.py - p1.py) * link.progress;
        const pulseScale = p1.scale + (p2.scale - p1.scale) * link.progress;

        ctx.beginPath();
        ctx.arc(pulseX, pulseY, 2.2 * pulseScale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${Math.min(0.9, alpha * 3.5)})`;
        ctx.fill();
      });

      // 4. Render 3D Logistics Nodes (Warehouses & Transit Hubs)
      projectedNodes.forEach((node) => {
        if (node.depth < 100) return;

        const size = node.baseSize * node.scale;
        const alpha = Math.max(0.2, Math.min(1, (900 - node.depth) / 600));

        // Outer glow
        const gradient = ctx.createRadialGradient(
          node.px,
          node.py,
          0,
          node.px,
          node.py,
          size * (node.isWarehouse ? 4 : 2.5)
        );

        if (node.isWarehouse) {
          gradient.addColorStop(0, `rgba(245, 158, 11, ${0.9 * alpha})`);
          gradient.addColorStop(0.4, `rgba(245, 158, 11, ${0.3 * alpha})`);
          gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
        } else {
          gradient.addColorStop(0, `rgba(96, 165, 250, ${0.9 * alpha})`);
          gradient.addColorStop(0.4, `rgba(59, 130, 246, ${0.25 * alpha})`);
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.px, node.py, size * (node.isWarehouse ? 4 : 2.5), 0, Math.PI * 2);
        ctx.fill();

        // Node center core
        ctx.fillStyle = node.isWarehouse ? '#FBBF24' : '#60A5FA';
        ctx.beginPath();
        ctx.arc(node.px, node.py, size * 0.9, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 opacity-70"
      style={{ filter: 'contrast(115%)' }}
    />
  );
}

