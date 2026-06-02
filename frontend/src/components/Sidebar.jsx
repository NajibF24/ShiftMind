import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BrainCircuit, FilePenLine, LogOut, BookOpen,
  Cpu, Wifi, Shield, ClipboardCheck, FileSignature, Search, Settings, MessageSquare,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'user', 'viewer'] },
  { to: '/ask',       label: 'Ask AI',    icon: MessageSquare,    roles: ['admin', 'user', 'viewer'] },
  { to: '/journal',   label: 'Work Journal', icon: BookOpen,     roles: ['admin', 'user', 'viewer'] },
  { to: '/workflows', label: 'Workflow Recorder', icon: Settings, roles: ['admin', 'user', 'viewer'] },
  { to: '/experts',   label: 'Expert Finder', icon: Search,      roles: ['admin', 'user', 'viewer'] },
  { to: '/checklists',label: 'Daily Checklists', icon: ClipboardCheck, roles: ['admin', 'user', 'viewer'] },
  { to: '/approvals', label: 'Approvals', icon: FileSignature,   roles: ['admin', 'user', 'viewer'] },
  { to: '/capture',   label: 'Capture Knowledge', icon: FilePenLine, roles: ['admin', 'user'] },
  { to: '/knowledge-manager', label: 'Knowledge Manager', icon: BrainCircuit, roles: ['admin'] },
];

const Sidebar = ({ role, onLogout }) => {
  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(role));

  return (
    <aside className="sidebar" style={{ gap: 0 }}>
      {/* Logo */}
      <div style={{ padding: '0 0 28px 0', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-cyan))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(14,165,233,0.3)',
            flexShrink: 0,
          }}>
            <BrainCircuit size={20} color="#000" />
          </div>
          <div>
            <div style={{
              fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.3px',
              background: 'linear-gradient(135deg, #fff 0%, var(--neon-cyan) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              ShiftMind
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1px', marginTop: '-2px' }}>
              AI KNOWLEDGE HUB
            </div>
          </div>
        </div>
      </div>

      {/* Status indicators */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '6px',
        marginBottom: '24px',
        padding: '12px', borderRadius: '10px',
        background: 'rgba(14,165,233,0.03)', border: '1px solid rgba(14,165,233,0.08)',
      }}>
        {[
          { icon: Cpu, label: 'AI Engine', status: 'Online', color: '#10b981' },
          { icon: Wifi, label: 'OneDrive', status: 'Synced', color: '#10b981' },
          { icon: Shield, label: 'Auth', status: role?.toUpperCase(), color: '#3b82f6' },
        ].map(({ icon: Icon, label, status, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem' }}>
            <Icon size={12} color={color} />
            <span style={{ color: 'var(--text-muted)', flex: 1 }}>{label}</span>
            <span style={{ color, fontWeight: '600' }}>{status}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: '8px', paddingLeft: '4px' }}>
        NAVIGATION
      </div>

      {/* Nav links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <Icon size={17} />
            <span style={{ fontSize: '0.9rem' }}>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          padding: '10px 12px', borderRadius: '10px', marginBottom: '8px',
          background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.1)',
          fontSize: '0.78rem',
        }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '2px', fontSize: '0.65rem', letterSpacing: '1px' }}>LOGGED IN AS</div>
          <div style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.85rem' }}>
            {localStorage.getItem('display_name') || role}
          </div>
          <div style={{ color: 'var(--neon-cyan)', fontWeight: '700', textTransform: 'capitalize', fontSize: '0.7rem', marginTop: '2px' }}>
            {role}
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
            padding: '10px 14px', background: 'transparent', border: '1px solid transparent',
            color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'left',
            borderRadius: '10px', fontFamily: 'inherit', fontSize: '0.88rem',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = 'rgba(225,29,72,0.08)';
            e.currentTarget.style.borderColor = 'rgba(225,29,72,0.2)';
            e.currentTarget.style.color = 'var(--danger)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
