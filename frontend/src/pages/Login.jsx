import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NeuralBackground from '../components/NeuralBackground';
import HologramRing from '../components/HologramRing';
import { Sparkles, ArrowRight, Shield, Database, Cloud, Bot } from 'lucide-react';

const TAGLINE = 'AI-Powered Knowledge Intelligence for PT Garuda Yamato Steel';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [typed, setTyped] = useState('');
  const [glitch, setGlitch] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i <= TAGLINE.length) {
        setTyped(TAGLINE.slice(0, i));
        i++;
      } else clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (error) {
      setGlitch(true);
      const t = setTimeout(() => setGlitch(false), 600);
      return () => clearTimeout(t);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      const res = await axios.post('/api/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (res.data.display_name) localStorage.setItem('display_name', res.data.display_name);
      onLogin(res.data.access_token, res.data.role);
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setError(err.response.data?.detail || 'Username atau password salah.');
        } else if (err.response.status >= 500) {
          setError('Server error (' + err.response.status + '). Hubungi administrator.');
        } else {
          setError('Gagal login: ' + (err.response.data?.detail || err.message));
        }
      } else if (err.request) {
        setError('Tidak dapat terhubung ke server. Pastikan backend sudah running.');
      } else {
        setError('Error: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #e8ecf4 50%, #f5f7fb 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      <NeuralBackground />

      {/* Left panel — branding */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '80px', position: 'relative', zIndex: 2,
      }} className="login-left-panel">
        <div style={{ maxWidth: '520px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(14,165,233,0.06)',
            border: '1px solid rgba(14,165,233,0.15)',
            borderRadius: '20px', padding: '6px 16px 6px 8px', marginBottom: '28px',
            fontSize: '0.7rem', color: 'var(--neon-cyan)', letterSpacing: '2px', fontWeight: '600',
          }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%', background: 'var(--neon-green)',
              display: 'inline-block', boxShadow: '0 0 6px rgba(16,185,129,0.4)',
              flexShrink: 0, animation: 'pulseDot 2s ease-in-out infinite',
            }} />
            SYSTEM ONLINE — v2.0
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.8rem, 5vw, 4.5rem)', fontWeight: '700', lineHeight: 1,
            letterSpacing: '-2px', marginBottom: '20px',
          }}>
            <span className="text-gradient">Shift</span>
            <span style={{ color: 'var(--neon-cyan)' }}>Mind</span>
          </h1>

          <div style={{
            fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: '1.7',
            minHeight: '52px', marginBottom: '32px',
          }}>
            {typed}
            <span style={{
              borderRight: '2px solid var(--neon-cyan)',
              marginLeft: '2px',
              animation: 'neonFlicker 0.8s step-end infinite',
            }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { icon: Bot, label: 'AI Knowledge Base', color: 'rgba(14,165,233,0.08)' },
              { icon: Database, label: 'Vector Search', color: 'rgba(59,130,246,0.08)' },
              { icon: Cloud, label: 'OneDrive Sync', color: 'rgba(124,58,237,0.08)' },
              { icon: Shield, label: 'Secure Access', color: 'rgba(16,185,129,0.06)' },
            ].map(({ icon: Icon, label, color }) => (
              <span key={label} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '500',
                background: color, border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                transition: 'all 0.3s var(--ease-out-expo)', cursor: 'default',
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <Icon size={12} style={{ opacity: 0.6 }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{
        width: '440px', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 44px', position: 'relative', zIndex: 2,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(40px)',
        borderLeft: '1px solid var(--border)',
        boxShadow: '-4px 0 40px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'center', marginBottom: '12px',
          filter: 'drop-shadow(0 4px 12px rgba(14,165,233,0.1))',
        }}>
          <HologramRing size={120} />
        </div>

        <h2 style={{
          textAlign: 'center', marginBottom: '2px', fontSize: '1.6rem', fontWeight: '700',
          fontFamily: 'var(--font-display)', letterSpacing: '-0.5px',
          color: 'var(--text-primary)',
        }}>
          Welcome Back
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '32px' }}>
          Authenticate to access the system
        </p>

        {error && (
          <div style={{
            background: 'rgba(225,29,72,0.06)',
            border: '1px solid rgba(225,29,72,0.15)',
            color: 'var(--danger)', padding: '14px 16px', borderRadius: '12px',
            marginBottom: '20px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '10px',
            animation: glitch ? 'glitch 0.3s ease-in-out' : undefined,
          }}>
            <Sparkles size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{
              fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)',
              letterSpacing: '1px', textTransform: 'uppercase',
            }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. najib.fauzan"
              required
              autoComplete="username"
              style={{
                width: '100%', padding: '14px 16px', fontSize: '0.92rem',
                background: focusedField === 'username' ? '#fff' : 'rgba(255,255,255,0.6)',
                border: focusedField === 'username'
                  ? '1px solid var(--neon-cyan)'
                  : '1px solid var(--border)',
                borderRadius: '12px', color: 'var(--text-primary)',
                outline: 'none', fontFamily: 'var(--font-body)',
                transition: 'all 0.3s var(--ease-out-expo)',
                boxShadow: focusedField === 'username'
                  ? '0 0 0 3px rgba(14,165,233,0.08)'
                  : 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{
              fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)',
              letterSpacing: '1px', textTransform: 'uppercase',
            }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="Windows / Active Directory password"
              required
              autoComplete="current-password"
              style={{
                width: '100%', padding: '14px 16px', fontSize: '0.92rem',
                background: focusedField === 'password' ? '#fff' : 'rgba(255,255,255,0.6)',
                border: focusedField === 'password'
                  ? '1px solid var(--neon-cyan)'
                  : '1px solid var(--border)',
                borderRadius: '12px', color: 'var(--text-primary)',
                outline: 'none', fontFamily: 'var(--font-body)',
                transition: 'all 0.3s var(--ease-out-expo)',
                boxShadow: focusedField === 'password'
                  ? '0 0 0 3px rgba(14,165,233,0.08)'
                  : 'none',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: '4px', width: '100%', fontSize: '0.92rem', fontWeight: '600',
              padding: '15px', letterSpacing: '1px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-blue))',
              border: 'none', borderRadius: '12px', color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)',
              opacity: loading ? 0.6 : 1,
              boxShadow: '0 4px 16px rgba(14,165,233,0.2)',
              transition: 'all 0.3s var(--ease-out-expo)',
            }}
            disabled={loading}
            onMouseOver={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(14,165,233,0.25)'; }}}
            onMouseOut={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(14,165,233,0.2)'; }}}
          >
            {loading ? (
              <>
                <span style={{
                  width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid #fff', borderRadius: '50%',
                  display: 'inline-block', animation: 'spin 0.8s linear infinite',
                }} />
                AUTHENTICATING
              </>
            ) : (
              <>
                ENTER SYSTEM <ArrowRight size={16} style={{ transition: 'transform 0.3s var(--ease-out-expo)' }} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
            marginBottom: '14px',
          }} />
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.3px' }}>
            PT Garuda Yamato Steel &copy; {new Date().getFullYear()} &middot; ShiftMind v2.0
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .login-left-panel { display: none !important; }
          div[style*="width: 440px"] { width: 100% !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .login-glitch { animation: none !important; }
          .animate-fade-in, .animate-fade-in-up { animation: none !important; }
        }
      `}</style>

      {/* Apply reduced-motion class to glitch element */}
      {glitch && <style>{`@media (prefers-reduced-motion: reduce) { .login-glitch { animation: none !important; } }`}</style>}
    </div>
  );
};

export default Login;
