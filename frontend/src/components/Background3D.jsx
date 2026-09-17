import React, { useEffect, useRef } from 'react';

/**
 * 3D Ambient Background Engine for CareerPulse AI.
 * Renders an interactive 3D spatial neural constellation, career vector nodes,
 * perspective grid horizon, and subtle mouse-tracked parallax depth.
 */
export default function Background3D() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking for 3D parallax
    let targetRotX = 0;
    let targetRotY = 0;
    let curRotX = 0;
    let curRotY = 0;

    const handleMouseMove = (e) => {
      const normX = (e.clientX / width) - 0.5;
      const normY = (e.clientY / height) - 0.5;
      targetRotY = normX * 0.45; // Yaw
      targetRotX = -normY * 0.35; // Pitch
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    // Generate 3D Neural Nodes (Skills, Internships, AI Vectors)
    const NODE_COUNT = 55;
    const nodes = [];
    const focalLength = 400;

    const nodeLabels = [
      'React', 'Python', 'AI/ML', 'Docker', 'RAG Vector', 'Matching Agent',
      'FastAPI', 'SQL', 'Cloud/DevOps', 'Interview Coach', 'Skill Gap Agent',
      'PyTorch', 'TypeScript', 'Node.js', 'Kubernetes', 'ATS Customizer'
    ];

    for (let i = 0; i < NODE_COUNT; i++) {
      const radius = 220 + Math.random() * 320;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      nodes.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: (radius * Math.sin(phi) * Math.sin(theta)) * 0.7,
        z: radius * Math.cos(phi),
        baseRadius: 2.2 + Math.random() * 2.8,
        speedX: (Math.random() - 0.5) * 0.003,
        speedY: (Math.random() - 0.5) * 0.003,
        speedZ: (Math.random() - 0.5) * 0.003,
        color: i % 4 === 0 ? '#06b6d4' : (i % 4 === 1 ? '#818cf8' : (i % 4 === 2 ? '#a855f7' : '#10b981')),
        hasLabel: i < nodeLabels.length,
        label: i < nodeLabels.length ? nodeLabels[i] : null,
        pulse: Math.random() * Math.PI
      });
    }

    // 3D Perspective Grid Points
    const gridLines = [];
    const GRID_SIZE = 600;
    const GRID_STEP = 60;
    const GRID_Y = 160;

    for (let x = -GRID_SIZE; x <= GRID_SIZE; x += GRID_STEP) {
      gridLines.push({ x1: x, z1: -GRID_SIZE, x2: x, z2: GRID_SIZE, y: GRID_Y });
    }
    for (let z = -GRID_SIZE; z <= GRID_SIZE; z += GRID_STEP) {
      gridLines.push({ x1: -GRID_SIZE, z1: z, x2: GRID_SIZE, z2: z, y: GRID_Y });
    }

    let time = 0;

    function render() {
      time += 0.015;

      // Smooth camera interpolation
      curRotX += (targetRotX - curRotX) * 0.05;
      curRotY += (targetRotY - curRotY) * 0.05;

      const cosX = Math.cos(curRotX + 0.1);
      const sinX = Math.sin(curRotX + 0.1);
      const cosY = Math.cos(curRotY + time * 0.12);
      const sinY = Math.sin(curRotY + time * 0.12);

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Draw 3D Radial Background Glow Orbs
      const bgGrad = ctx.createRadialGradient(
        centerX + curRotY * 180, 
        centerY + curRotX * 120, 
        50, 
        centerX, 
        centerY, 
        Math.max(width, height) * 0.65
      );
      bgGrad.addColorStop(0, 'rgba(99, 102, 241, 0.13)');
      bgGrad.addColorStop(0.35, 'rgba(6, 182, 212, 0.07)');
      bgGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.03)');
      bgGrad.addColorStop(1, 'rgba(11, 15, 25, 0)');
      
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw 3D Perspective Ground Grid (Neural Wireframe)
      ctx.lineWidth = 0.65;
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';

      for (let i = 0; i < gridLines.length; i++) {
        const line = gridLines[i];

        // Rotate point 1
        const y1_ = line.y;
        const x1_ = line.x1 * cosY - line.z1 * sinY;
        const z1_temp = line.x1 * sinY + line.z1 * cosY;
        const z1_ = z1_temp * cosX - y1_ * sinX + 450;
        const y1_proj = y1_ * cosX + z1_temp * sinX;

        // Rotate point 2
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

          const alpha = Math.max(0, Math.min(0.12, (1 - z1_ / 900) * 0.15));
          ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.lineTo(p2x, p2y);
          ctx.stroke();
        }
      }

      // 3. Project 3D Nodes
      const projected = [];

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.pulse += 0.03;

        // 3D Rotation Transform
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.x * sinY + node.z * cosY;

        const y2 = node.y * cosX - z1 * sinX;
        const z2 = node.y * sinX + z1 * cosX + 480; // Distance offset

        if (z2 > 10) {
          const scale = focalLength / z2;
          const px = centerX + x1 * scale;
          const py = centerY + y2 * scale;
          const alpha = Math.max(0.15, Math.min(0.9, (1 - z2 / 900)));

          projected.push({
            node,
            px,
            py,
            z: z2,
            scale,
            alpha,
            radius: Math.max(1.2, node.baseRadius * scale * (1 + Math.sin(node.pulse) * 0.2))
          });
        }
      }

      // 4. Draw Synaptic 3D Connection Lines between Close Nodes
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];

          const dx = p1.px - p2.px;
          const dy = p1.py - p2.py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const lineAlpha = (1 - dist / 110) * Math.min(p1.alpha, p2.alpha) * 0.35;
            ctx.strokeStyle = `rgba(99, 102, 241, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.stroke();
          }
        }
      }

      // 5. Draw 3D Spheres & Glowing Vector Labels
      projected.sort((a, b) => b.z - a.z); // Depth sorting

      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];

        // Outer glow halo
        ctx.beginPath();
        ctx.arc(p.px, p.py, p.radius * 2.6, 0, Math.PI * 2);
        ctx.fillStyle = p.node.color.replace(')', `, ${p.alpha * 0.2})`).replace('rgb', 'rgba').replace('#06b6d4', `rgba(6, 182, 212, ${p.alpha * 0.25})`).replace('#818cf8', `rgba(129, 140, 248, ${p.alpha * 0.25})`).replace('#a855f7', `rgba(168, 85, 247, ${p.alpha * 0.25})`).replace('#10b981', `rgba(16, 185, 129, ${p.alpha * 0.25})`);
        ctx.fill();

        // Solid Core Node
        ctx.beginPath();
        ctx.arc(p.px, p.py, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.node.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Label if present and close enough to camera
        if (p.node.hasLabel && p.scale > 0.65 && p.alpha > 0.35) {
          ctx.font = `600 ${Math.max(9, Math.round(11 * p.scale))}px 'Inter', sans-serif`;
          ctx.fillStyle = `rgba(241, 245, 249, ${p.alpha * 0.75})`;
          ctx.textAlign = 'center';
          ctx.fillText(p.node.label, p.px, p.py - p.radius - 4);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
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
        opacity: 0.95
      }}
    />
  );
}
