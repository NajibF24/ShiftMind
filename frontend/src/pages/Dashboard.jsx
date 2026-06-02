import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Database, Zap, Users, CloudDownload, Activity, TrendingUp, Building2, PenLine, RefreshCw, Globe, BarChart3, Sparkles, ChevronRight } from 'lucide-react';

const AnimatedNumber = ({ value, duration = 1200 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value) || 0;
    if (start === end) { setDisplay(end); return; }
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{display}</>;
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_entries: 0, ai_queries_today: 0, active_contributors: 0,
    source_breakdown: {}, last_onedrive_sync: null, onedrive_documents: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [newsData, setNewsData] = useState([]);
  const [marketData, setMarketData] = useState(null);

  useEffect(() => {
    axios.get('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(r => setStats(r.data)).catch(console.error);
    axios.get('/static/latest_news.json')
      .then(r => { setNewsData(r.data.news || []); setMarketData(r.data.market || null); })
      .catch(() => {});
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await axios.post('/api/knowledge/sync/manual', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      window.location.reload();
    } catch (e) {
      alert('Sync failed: ' + (e.response?.data?.detail || e.message));
    } finally { setIsSyncing(false); }
  };

  const breakdown = stats.source_breakdown || {};
  const total = stats.total_entries;
  const displayName = localStorage.getItem('display_name') || 'Operator';

  const kpis = [
    { icon: Database, label: 'Knowledge Entries', value: total, color: 'var(--neon-cyan)' },
    { icon: Zap, label: 'AI Queries Today', value: stats.ai_queries_today, color: 'var(--neon-blue)' },
    { icon: Users, label: 'Contributors', value: stats.active_contributors, color: 'var(--neon-purple)' },
    { icon: CloudDownload, label: 'OneDrive Docs', value: stats.onedrive_documents, color: 'var(--neon-green)' },
  ];

  const sources = [
    { label: 'Company', value: breakdown.company || 0, color: '#3d7eff', icon: Building2 },
    { label: 'OneDrive SOP', value: breakdown.onedrive || 0, color: 'var(--neon-cyan)', icon: CloudDownload },
    { label: 'Manual', value: breakdown.manual || 0, color: '#fbbf24', icon: PenLine },
  ];

  const systems = [
    { label: 'AI Engine', status: 'Operational', ok: true },
    { label: 'Vector DB', status: 'Online', ok: true },
    { label: 'OneDrive', status: total > 0 ? 'Connected' : 'Awaiting', ok: total > 0 },
    { label: 'Knowledge Sync', status: stats.last_onedrive_sync ? 'Synced' : 'Pending', ok: !!stats.last_onedrive_sync },
  ];

  return (
    <div className="page-content animate-fade-in">
      <div className="section-header" style={{ marginBottom: '40px' }}>
        <div className="section-header__eyebrow">
          <div className="section-header__dot" />
          <span className="section-header__tag">Operations Live</span>
        </div>
        <h1 className="section-header__title">
          <span className="text-gradient">Operations</span>
          <br />
          <span style={{ color: 'var(--text-primary)' }}>Dashboard</span>
        </h1>
        <p className="section-header__subtitle">
          Welcome back, <strong style={{ color: 'var(--neon-cyan)' }}>{displayName}</strong>. Real-time intelligence overview.
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button onClick={handleManualSync} disabled={isSyncing} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </div>

      <div className="glass-panel glass-panel--interactive" style={{ marginBottom: '32px', padding: '28px', borderLeft: '4px solid var(--neon-cyan)', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-50%', right: '-20%', width: '300px', height: '300px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.03), transparent)',
          pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', position: 'relative' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)',
          }}>
            <Globe size={18} color="var(--neon-cyan)" />
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>
            GYS<span style={{ color: 'var(--neon-cyan)' }}> Steel </span>Signal
          </h2>
          <span className="badge badge--cyan" style={{ fontSize: '0.65rem' }}>Daily Market Intelligence</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Latest Steel Market News
            </h3>
            {newsData.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {newsData.map((news, i) => (
                  <a key={i} href={news.link} target="_blank" rel="noreferrer"
                     style={{
                       display: 'block', padding: '14px 16px', borderRadius: '12px',
                       background: 'rgba(14,165,233,0.02)', border: '1px solid var(--border)',
                       textDecoration: 'none', transition: 'all 0.3s var(--ease-out-expo)',
                       position: 'relative', overflow: 'hidden',
                     }}
                     onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(14,165,233,0.2)'; e.currentTarget.style.background = 'rgba(14,165,233,0.04)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                     onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'rgba(14,165,233,0.02)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                  >
                    <div style={{ fontSize: '0.82rem', color: 'var(--neon-cyan)', fontWeight: '600', marginBottom: '4px', lineHeight: 1.4 }}>
                      {news.title}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{news.date}</div>
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '20px 0' }}>
                No news available. Click "Sync Data Now" to fetch updates.
              </div>
            )}
          </div>

          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '6px', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)',
              }}>
                <TrendingUp size={13} color="var(--neon-green)" />
              </div>
              Market Movement
            </h3>
            <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: '12px', border: '1px solid var(--border)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {marketData ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>USD/IDR Exchange Rate</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--neon-green)', fontFamily: 'var(--font-display)' }}>
                        Rp {marketData.usd_idr?.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <span className="badge badge--green">Live</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>HRC Steel Futures</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--neon-cyan)', fontFamily: 'var(--font-display)' }}>
                        $ {marketData.steel_hrc?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> / short ton</span>
                      </div>
                    </div>
                    <span className="badge badge--cyan">NYSE</span>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0' }}>
                  Market data not available yet. Run sync to fetch.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="stagger-children" style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px', marginBottom: '32px',
      }}>
        {kpis.map(({ icon: Icon, label, value, color }) => (
          <div className="stat-card" key={label} style={{ '--card-color': color }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: `rgba(14,165,233,0.06)`, border: '1px solid rgba(14,165,233,0.1)',
                transition: 'all 0.3s var(--ease-out-expo)',
              }} className="stat-card__icon">
                <Icon size={20} color={color} />
              </div>
              <span className="badge badge--green" style={{ fontSize: '0.6rem' }}>LIVE</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.5px' }}>{label}</div>
            <div style={{
              fontSize: '2.2rem', fontWeight: '700', lineHeight: 1,
              fontFamily: 'var(--font-display)', color: color,
              textShadow: `0 0 30px color-mix(in srgb, ${color} 30%, transparent)`,
              transition: 'all 0.3s var(--ease-out-expo)',
            }}>
              <AnimatedNumber value={value} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-panel animate-fade-in-up" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.1)',
            }}>
              <BarChart3 size={15} color="var(--neon-cyan)" />
            </div>
            <h2 style={{ fontSize: '0.9rem', fontWeight: '600', fontFamily: 'var(--font-display)' }}>Knowledge Sources</h2>
          </div>
          {sources.map(({ label, value, color, icon: Icon }) => {
            const pct = total > 0 ? Math.round((value / total) * 100) : 0;
            return (
              <div key={label} style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <Icon size={13} style={{ color }} /> {label}
                  </span>
                  <span style={{ color, fontWeight: '700', fontFamily: 'var(--font-display)' }}>
                    {value} <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '0.68rem' }}>({pct}%)</span>
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar__fill" style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, color-mix(in srgb, ${color} 40%, transparent), ${color})`,
                    boxShadow: `0 0 12px color-mix(in srgb, ${color} 25%, transparent)`,
                    transition: 'width 1s var(--ease-out-expo)',
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="glass-panel animate-fade-in-up" style={{ padding: '28px', animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.1)',
            }}>
              <Activity size={15} color="var(--neon-green)" />
            </div>
            <h2 style={{ fontSize: '0.9rem', fontWeight: '600', fontFamily: 'var(--font-display)' }}>System Status</h2>
          </div>
          {systems.map(({ label, status, ok }) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0', borderBottom: '1px solid var(--border)',
              transition: 'all 0.3s var(--ease-out-expo)',
            }}
            onMouseOver={e => { e.currentTarget.style.paddingLeft = '8px'; e.currentTarget.style.borderBottomColor = 'rgba(14,165,233,0.1)'; }}
            onMouseOut={e => { e.currentTarget.style.paddingLeft = '0'; e.currentTarget.style.borderBottomColor = 'var(--border)'; }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: ok ? 'var(--neon-green)' : 'var(--warning)',
                  boxShadow: ok ? '0 0 8px var(--neon-green)' : '0 0 8px var(--warning)',
                  flexShrink: 0,
                }} />
                {label}
              </span>
              <span className="badge" style={{
                background: ok ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                color: ok ? 'var(--neon-green)' : 'var(--warning)',
                border: `1px solid ${ok ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                transition: 'all 0.3s var(--ease-out-expo)',
              }}>
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel animate-fade-in-up" style={{ padding: '24px', animationDelay: '0.2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Sparkles size={16} color="var(--neon-cyan)" />
          <h2 style={{ fontSize: '0.9rem', fontWeight: '600', fontFamily: 'var(--font-display)' }}>Intelligence</h2>
        </div>
        <div style={{
          background: total > 0 ? 'rgba(14,165,233,0.03)' : 'rgba(245,158,11,0.04)',
          border: `1px solid ${total > 0 ? 'rgba(14,165,233,0.1)' : 'rgba(245,158,11,0.12)'}`,
          padding: '16px 20px', borderRadius: '12px',
          display: 'flex', gap: '14px', alignItems: 'flex-start',
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginTop: '4px',
            background: total > 0 ? 'var(--neon-cyan)' : 'var(--warning)',
            boxShadow: total > 0 ? '0 0 12px var(--neon-cyan)' : '0 0 12px var(--warning)',
          }} />
          <div>
            <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '0.9rem', color: total > 0 ? 'var(--neon-cyan)' : 'var(--warning)' }}>
              {total > 0 ? `Knowledge Base Active — ${total} entries loaded` : 'Knowledge Base Empty'}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {total > 0
                ? 'ShiftMind AI is ready to answer employee questions about GYS SOPs, products, and company policy.'
                : 'Go to Knowledge Manager to seed company knowledge & sync OneDrive.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
