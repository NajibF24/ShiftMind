import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const PARTICLE_COUNT = 50;
const COLORS = ['#0ea5e9', '#3b82f6', '#7c3aed', '#10b981', '#f59e0b'];

const ParticleTrail = () => {
  const location = useLocation();
  const containerRef = useRef(null);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (prevPath.current === location.pathname) return;
    prevPath.current = location.pathname;

    const container = containerRef.current;
    if (!container) return;

    // Clear previous particles
    container.innerHTML = '';

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const particle = document.createElement('div');
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const size = Math.random() * 4 + 2;
      const angle = (Math.random() * 360) * (Math.PI / 180);
      const distance = Math.random() * 300 + 100;
      const duration = Math.random() * 800 + 600;
      const delay = Math.random() * 200;

      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        left: ${centerX}px;
        top: ${centerY}px;
        pointer-events: none;
        opacity: 0.8;
        box-shadow: 0 0 ${size * 2}px ${color}40;
        animation: particleBurst ${duration}ms ${delay}ms var(--ease-out-expo) forwards;
        --tx: ${tx}px;
        --ty: ${ty}px;
      `;

      container.appendChild(particle);
    }

    // Cleanup after animation completes
    const timer = setTimeout(() => {
      if (container) container.innerHTML = '';
    }, 1200);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 150,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    />
  );
};

export default ParticleTrail;
