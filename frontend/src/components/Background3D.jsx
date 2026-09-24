import React, { useEffect, useRef } from 'react';

/**
 * High-Performance 3D Ambient Background Engine for CareerPulse AI.
 * Ultra-lightweight rendering with precomputed color lookup, optimized node counts,
 * and zero DOM jank on page navigation.
 */
export default function Background3D() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking for 3D parallax
    let targetRotX = 0;
    let targetRotY = 0;
    let curRotX = 0;
    let curRotY = 0;

    let isVisible = true;
    const handleVisibility = () => {
      isVisible = !document.hidden;
    };

    const handleMouseMove = (e) => {
      const normX = (e.clientX / width) - 0.5;
      const normY = (e.clientY / height) - 0.5;
      targetRotY = normX * 0.35; // Yaw
      targetRotX = -normY * 0.25; // Pitch
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);

    // Optimized Color Palette Precomputations
    const PALETTES = [
      { core: '#06b6d4', r: 6, g: 182, b: 212 },   // Cyan
      { core: '#818cf8', r: 129, g: 140, b: 248 }, // Indigo
      { core: '#a855f7', r: 168, g: 85, b: 247 },  // Purple
      { core: '#10b981', r: 16, g: 185, b: 129 }   // Emerald
    ];

    // High-performance 28-node neural vector constellation
    const NODE_COUNT = 26;
    const nodes = [];
    const focalLength = 380;

    const nodeLabels = [
      'React', 'Python', 'AI/ML', 'Docker', 'RAG Vector', 'Matcher',
      'FastAPI', 'SQL', 'DevOps', 'Interview Coach', 'Skill Gap',
      'TypeScript', 'Node.js', 'ATS Engine'
    ];

    for (let i = 0; i < NODE_COUNT; i++) {
      const radius = 200 + Math.random() * 260;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const pal = PALETTES[i % PALETTES.length];

      nodes.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: (radius * Math.sin(phi) * Math.sin(theta)) * 0.65,
        z: radius * Math.cos(phi),
        baseRadius: 2.0 + Math.random() * 2.2,
        pal,
        hasLabel: i < nodeLabels.length,
        label: i < nodeLabels.length ? nodeLabels[i] : null,
        pulse: Math.random() * Math.PI
      });
    }

    // 3D Perspective Grid Points (optimized density)
    const gridLines = [];
    const GRID_SIZE = 500;
    const GRID_STEP = 100;
    const GRID_Y = 150;

    for (let x = -GRID_SIZE; x <= GRID_SIZE; x += GRID_STEP) {
      gridLines.push({ x1: x, z1: -GRID_SIZE, x2: x, z2: GRID_SIZE, y: GRID_Y });
    }
    for (let z = -GRID_SIZE; z <= GRID_SIZE; z += GRID_STEP) {
      gridLines.push({ x1: -GRID_SIZE, z1: z, x2: GRID_SIZE, z2: z, y: GRID_Y });
    }

    let time = 0;
    let lastRenderTime = 0;

    function render(now) {
      animationFrameId = requestAnimationFrame(render);
      if (!isVisible) return;

      // Smooth ~45fps frame throttling to save battery and GPU overhead
      if (now - lastRenderTime < 20) return;
      lastRenderTime = now;

      time += 0.012;

      // Smooth camera interpolation
      curRotX += (targetRotX - curRotX) * 0.06;
      curRotY += (targetRotY - curRotY) * 0.06;

      const cosX = Math.cos(curRotX + 0.1);
      const sinX = Math.sin(curRotX + 0.1);
      const cosY = Math.cos(curRotY + time * 0.1);
      const sinY = Math.sin(curRotY + time * 0.1);

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Draw 3D Perspective Grid
      ctx.lineWidth = 0.65;
      for (let i = 0; i < gridLines.length; i++) {
        const line = gridLines[i];
        const y1_ = line.y;
        const x1_ = line.x1 * cosY - line.z1 * sinY;
        const z1_temp = line.x1 * sinY + line.z1 * cosY;
        const z1_ = z1_temp * cosX - y1_ * sinX + 450;
        const y1_proj = y1_ * cosX + z1_temp * sinX;

        const y2_ = line.y;
        const x2_ = line.x2 * cosY - line.z2 * sinY;
        const z2_temp = line.x2 * sinY + line.z2 * cosY;
        const z2_ = z2_temp * cosX - y2_ * sinX + 450;
        const y2_proj = y2_ * cosX + z2_temp * sinX;

        if (z1_ > 20 && z2_ > 20) {
          const p1x = centerX + (x1_ * focalLength) / z1_;
          const p1y = centerY + (y1_proj * focalLength) / z1_;
          const p2x = centerX + (x2_ * focalLength) / z2_;
          const p2y = centerY + (y2_proj * focalLength) / z2_;

          const alpha = Math.max(0, Math.min(0.08, (1 - z1_ / 900) * 0.12));
          ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.lineTo(p2x, p2y);
          ctx.stroke();
        }
      }

      // 2. Project Nodes
      const projected = [];
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.pulse += 0.025;

        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.x * sinY + node.z * cosY;
        const y2 = node.y * cosX - z1 * sinX;
        const z2 = node.y * sinX + z1 * cosX + 480;

        if (z2 > 15) {
          const scale = focalLength / z2;
          const px = centerX + x1 * scale;
          const py = centerY + y2 * scale;
          const alpha = Math.max(0.18, Math.min(0.85, (1 - z2 / 850)));

          projected.push({
            node,
            px,
            py,
            z: z2,
            scale,
            alpha,
            radius: Math.max(1.2, node.baseRadius * scale * (1 + Math.sin(node.pulse) * 0.18))
          });
        }
      }

      // 3. Draw Synaptic Connection Lines
      for (let i = 0; i < projected.length; i++) {
        const p1 = projected[i];
        for (let j = i + 1; j < projected.length; j++) {
          const p2 = projected[j];
          const dx = p1.px - p2.px;
          const dy = p1.py - p2.py;
          const distSq = dx * dx + dy * dy;

          if (distSq < 10000) { // dist < 100px
            const dist = Math.sqrt(distSq);
            const lineAlpha = (1 - dist / 100) * Math.min(p1.alpha, p2.alpha) * 0.28;
            ctx.strokeStyle = `rgba(99, 102, 241, ${lineAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.stroke();
          }
        }
      }

      // 4. Draw Core Nodes & Halo
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const pal = p.node.pal;

        // Outer halo
        ctx.beginPath();
        ctx.arc(p.px, p.py, p.radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pal.r}, ${pal.g}, ${pal.b}, ${p.alpha * 0.18})`;
        ctx.fill();

        // Core Node
        ctx.beginPath();
        ctx.arc(p.px, p.py, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = pal.core;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Label for primary nodes
        if (p.node.hasLabel && p.scale > 0.7 && p.alpha > 0.4) {
          ctx.font = `600 ${Math.max(9, Math.round(11 * p.scale))}px sans-serif`;
          ctx.fillStyle = `rgba(241, 245, 249, ${p.alpha * 0.7})`;
          ctx.textAlign = 'center';
          ctx.fillText(p.node.label, p.px, p.py - p.radius - 4);
        }
      }
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.9,
        willChange: 'transform',
        transform: 'translate3d(0,0,0)',
        contain: 'strict'
      }}
    />
  );
}
