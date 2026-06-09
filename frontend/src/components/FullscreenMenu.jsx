import React, { useEffect, useRef } from 'react';
import { LogOut, ArrowRight } from 'lucide-react';

const ICONS = {
  '01': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  '02': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  '03': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a9 9 0 0 1 9 9c0 3-1.5 5.5-4 6.5V20l-3-2.5a9 9 0 0 1-2 0l-3 2.5V17.5C4.5 16.5 3 14 3 11a9 9 0 0 1 9-9z"/></svg>,
  '04': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14"/></svg>,
  '05': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  '06': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  '07': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  '08': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>,
  '09': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  '10': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  '11': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>,
  '12': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
};

const FullscreenMenu = ({ open, items, currentPath, onNavigate, onLogout, displayName, role }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && open) onNavigate(currentPath);
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', onKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, currentPath, onNavigate]);

  return (
    <div
      ref={containerRef}
      className={`menu-overlay ${open ? 'menu-overlay--open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      <nav className="menu-overlay__items">
        {items.map((item, i) => (
          <button
            key={item.to}
            className={`menu-overlay__item ${currentPath === item.to ? 'menu-overlay__item--active' : ''}`}
            onClick={() => onNavigate(item.to)}
            style={{
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0)' : 'translateY(20px)',
              transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${open ? i * 0.07 + 0.15 : 0}s`,
            }}
          >
            <span className="menu-overlay__item-num">{item.icon}</span>
            <span className="menu-overlay__item-icon">
              {ICONS[item.icon] || null}
            </span>
            <span className="menu-overlay__item-label">{item.label}</span>
            <span className="menu-overlay__item-arrow"><ArrowRight size={18} /></span>
          </button>
        ))}
      </nav>

      <div
        className="menu-overlay__footer"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0)' : 'translateY(10px)',
          transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${open ? 0.4 : 0}s`,
        }}
      >
        <div className="menu-overlay__user-info">
          <span className="menu-overlay__user-label">Logged in as</span>
          <span className="menu-overlay__user-name">{displayName}</span>
          <span className="menu-overlay__user-role">{role}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button
            onClick={onLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              border: '1px solid rgba(225,29,72,0.2)', borderRadius: '8px',
              padding: '8px 16px', color: 'var(--text-muted)', fontSize: '0.8rem',
              fontFamily: 'var(--font-body)', transition: 'all 0.3s', cursor: 'pointer',
              background: 'transparent',
            }}
            onMouseOver={e => {
              e.currentTarget.style.color = 'var(--danger)';
              e.currentTarget.style.borderColor = 'rgba(225,29,72,0.5)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'rgba(225,29,72,0.2)';
            }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
          <span className="menu-overlay__version">ShiftMind v2.0</span>
        </div>
      </div>
    </div>
  );
};

export default FullscreenMenu;
