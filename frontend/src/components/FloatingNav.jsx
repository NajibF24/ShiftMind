import React, { useState, useRef, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import FullscreenMenu from './FullscreenMenu';

// ─── Morphing Torus Logo (Three.js) ──────────────────────────────────────────
function MorphingTorus() {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.rotation.x = t * 0.4;
    meshRef.current.rotation.y = t * 0.6;
    meshRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.08);
  });
  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[0.55, 0.22, 16, 32]} />
      <meshStandardMaterial
        color="#0ea5e9"
        emissive="#3b82f6"
        emissiveIntensity={0.4}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '01', roles: ['admin', 'user', 'viewer'] },
  { to: '/explore', label: '3D Gallery', icon: '02', roles: ['admin', 'user', 'viewer'] },
  { to: '/ask', label: 'Ask AI', icon: '03', roles: ['admin', 'user', 'viewer'] },
  { to: '/journal', label: 'Work Journal', icon: '04', roles: ['admin', 'user', 'viewer'] },
  { to: '/workflows', label: 'Workflow Recorder', icon: '05', roles: ['admin', 'user', 'viewer'] },
  { to: '/experts', label: 'Expert Finder', icon: '06', roles: ['admin', 'user', 'viewer'] },
  { to: '/checklists', label: 'Daily Checklists', icon: '07', roles: ['admin', 'user', 'viewer'] },
  { to: '/approvals', label: 'Approvals', icon: '08', roles: ['admin', 'user', 'viewer'] },
  { to: '/capture', label: 'Capture Knowledge', icon: '09', roles: ['admin', 'user'] },
  { to: '/knowledge-manager', label: 'Knowledge Manager', icon: '10', roles: ['admin'] },
  { to: '/knowledge-health', label: 'Knowledge Health', icon: '11', roles: ['admin'] },
  { to: '/settings', label: 'System Settings', icon: '12', roles: ['admin'] },
];

const FloatingNav = ({ role, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const displayName = localStorage.getItem('display_name') || role;
  const initials = displayName
    ?.split(/[\s.]+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const handleNavigate = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(role));

  return (
    <>
      <header className="floating-nav">
        <button
          className={`floating-nav__menu-btn ${menuOpen ? 'floating-nav__menu-btn--open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <div className="floating-nav__hamburger">
            <span />
            <span />
          </div>
          <span className="floating-nav__menu-label">{menuOpen ? 'Close' : 'Menu'}</span>
        </button>

        <div className="floating-nav__logo" onClick={() => { navigate('/dashboard'); setMenuOpen(false); }}>
          <div className="floating-nav__logo-icon" style={{ overflow: 'hidden' }}>
            <Suspense fallback={
              <span style={{ fontSize: '14px', color: '#000', fontWeight: 700 }}>S</span>
            }>
              <Canvas
                style={{ width: '100%', height: '100%' }}
                camera={{ position: [0, 0, 2.2], fov: 45 }}
                gl={{ alpha: true, antialias: true }}
              >
                <ambientLight intensity={0.6} />
                <directionalLight position={[2, 2, 2]} intensity={1.2} />
                <MorphingTorus />
              </Canvas>
            </Suspense>
          </div>
          <span className="floating-nav__logo-text">
            <span style={{ color: 'var(--text-primary)' }}>Shift</span>
            <span style={{ color: 'var(--neon-cyan)' }}>Mind</span>
          </span>
        </div>

        <div className="floating-nav__user">
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{displayName}</span>
          <div className="floating-nav__user-avatar">{initials}</div>
        </div>
      </header>

      <FullscreenMenu
        open={menuOpen}
        items={visibleItems}
        currentPath={location.pathname}
        onNavigate={handleNavigate}
        onLogout={() => { setMenuOpen(false); onLogout(); }}
        displayName={displayName}
        role={role}
      />
    </>
  );
};

export default FloatingNav;
