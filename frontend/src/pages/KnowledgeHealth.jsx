import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  HeartPulse, ShieldCheck, AlertTriangle, RefreshCw, Loader2,
  FileWarning, CheckCircle2, XCircle, Clock, Zap, ArrowRight
} from 'lucide-react';

const API_HEADERS = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const KnowledgeHealth = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const r = await axios.get('/api/knowledge-health', { headers: API_HEADERS() });
      setHealth(r.data);
    } catch (e) {
      console.error('Failed to fetch knowledge health', e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchHealth(); }, []);

  const handleMarkValid = async (entryId) => {
    setActionLoading(prev => ({ ...prev, [entryId]: 'valid' }));
    try {
      await axios.post(`/api/knowledge-health/mark-valid/${entryId}`, {}, { headers: API_HEADERS() });
      fetchHealth();
    } catch (e) {
      console.error('Failed to mark valid', e);
    }
    setActionLoading(prev => ({ ...prev, [entryId]: null }));
  };

  if (loading) {
    return (
      <div className="page-content animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--neon-cyan)' }} />
      </div>
    );
  }

  if (!health) {
    return (
      <div className="page-content animate-fade-in">
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertTriangle size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
          <p>Gagal memuat data Knowledge Health.</p>
          <button className="btn-primary" onClick={fetchHealth} style={{ marginTop: '16px' }}>
            <RefreshCw size={14} /> Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const healthScore = health.total_entries > 0
    ? Math.round(((health.fresh_count) / health.total_entries) * 100)
    : 0;

  const getHealthColor = (score) => {
    if (score >= 70) return 'var(--neon-green)';
    if (score >= 40) return 'var(--warning)';
    return 'var(--danger)';
  };

  const healthColor = getHealthColor(healthScore);

  return (
    <div className="page-content page-content--wide animate-fade-in">
      <div className="section-header">
        <div className="section-header__eyebrow">
          <div className="section-header__dot" />
          <span className="section-header__tag">Intelligence</span>
        </div>
        <h1 className="section-header__title">
          <span className="text-gradient">Knowledge</span>
          <span style={{ color: 'var(--text-primary)' }}> Health</span>
        </h1>
        <p className="section-header__subtitle">
          Deteksi otomatis dokumen yang mungkin sudah tidak relevan
          sebelum karyawan mendapat informasi yang salah.
        </p>
        <button className="btn-primary" onClick={fetchHealth} style={{ marginTop: '16px' }}>
          <RefreshCw size={14} /> Refresh Analysis
        </button>
      </div>

      {/* Health Score Ring + Stats */}
      <div className="stagger-children" style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px', marginBottom: '32px',
      }}>
        {/* Overall Health Score */}
        <div className="stat-card" style={{ '--card-color': healthColor, textAlign: 'center', padding: '28px' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 16px' }}>
            <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="42" stroke="rgba(0,0,0,0.04)" strokeWidth="6" fill="none" />
              <circle cx="50" cy="50" r="42" stroke={healthColor} strokeWidth="6" fill="none"
                strokeDasharray={`${healthScore * 2.64} ${264 - healthScore * 2.64}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1.5s var(--ease-out-expo)' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: healthColor }}>
                {healthScore}%
              </span>
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
            Knowledge Health Score
          </div>
        </div>

        <div className="stat-card" style={{ '--card-color': 'var(--neon-green)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)',
            }}>
              <ShieldCheck size={18} color="var(--neon-green)" />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fresh (&lt; 90 hari)</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--neon-green)', fontFamily: 'var(--font-display)' }}>
            {health.fresh_count}
          </div>
        </div>

        <div className="stat-card" style={{ '--card-color': 'var(--warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)',
            }}>
              <Clock size={18} color="var(--warning)" />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Perlu Review</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--warning)', fontFamily: 'var(--font-display)' }}>
            {health.stale_count}
          </div>
        </div>

        <div className="stat-card" style={{ '--card-color': 'var(--danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.15)',
            }}>
              <FileWarning size={18} color="var(--danger)" />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Potensi Kontradiksi</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--danger)', fontFamily: 'var(--font-display)' }}>
            {health.contradiction_count}
          </div>
        </div>
      </div>

      {/* Stale Documents */}
      {health.stale_entries?.length > 0 && (
        <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.1)',
            }}>
              <AlertTriangle size={15} color="var(--warning)" />
            </div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
              Dokumen yang Berpotensi Outdated
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {health.stale_entries.map((entry, idx) => (
              <motion.div
                key={entry.entry_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  padding: '20px', borderRadius: '14px',
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid var(--border)',
                  borderLeft: `4px solid ${entry.staleness_score > 5 ? 'var(--danger)' : 'var(--warning)'}`,
                  transition: 'all 0.3s var(--ease-out-expo)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                      {entry.title}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      <Clock size={11} style={{ display: 'inline', marginBottom: '-1px', marginRight: '4px' }} />
                      {entry.age_days} hari sejak dibuat · {entry.reason}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    <button
                      className="btn-primary"
                      style={{ fontSize: '0.75rem', padding: '8px 14px' }}
                      onClick={() => handleMarkValid(entry.entry_id)}
                      disabled={actionLoading[entry.entry_id] === 'valid'}
                    >
                      {actionLoading[entry.entry_id] === 'valid'
                        ? <Loader2 size={12} className="animate-spin" />
                        : <CheckCircle2 size={12} />
                      }
                      Masih Valid
                    </button>
                  </div>
                </div>

                {/* Staleness bar */}
                <div className="progress-bar" style={{ marginTop: '14px' }}>
                  <div className="progress-bar__fill" style={{
                    width: `${Math.min(entry.staleness_score * 10, 100)}%`,
                    background: entry.staleness_score > 5
                      ? 'linear-gradient(90deg, var(--warning), var(--danger))'
                      : 'linear-gradient(90deg, rgba(245,158,11,0.4), var(--warning))',
                    transition: 'width 1.2s var(--ease-out-expo)',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Staleness Score</span>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                    color: entry.staleness_score > 5 ? 'var(--danger)' : 'var(--warning)',
                  }}>
                    {entry.staleness_score}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Contradictions */}
      {health.contradictions?.length > 0 && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(225,29,72,0.06)', border: '1px solid rgba(225,29,72,0.1)',
            }}>
              <XCircle size={15} color="var(--danger)" />
            </div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
              Potensi Kontradiksi Antar Dokumen
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {health.contradictions.map((c, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.4 }}
                style={{
                  padding: '16px 20px', borderRadius: '12px',
                  background: 'rgba(225,29,72,0.02)',
                  border: '1px solid rgba(225,29,72,0.08)',
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}
              >
                <Zap size={14} color="var(--danger)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    <span style={{ color: 'var(--neon-cyan)' }}>{c.doc_a}</span>
                    <ArrowRight size={12} style={{ display: 'inline', margin: '0 8px', opacity: 0.4, verticalAlign: 'middle' }} />
                    <span style={{ color: 'var(--warning)' }}>{c.doc_b}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {c.potential_conflict}
                    {c.numbers_a && c.numbers_b && (
                      <span> — Dokumen A: [{c.numbers_a.join(', ')}] vs Dokumen B: [{c.numbers_b.join(', ')}]</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* No issues */}
      {(!health.stale_entries?.length && !health.contradictions?.length) && (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <ShieldCheck size={48} color="var(--neon-green)" style={{ marginBottom: '16px', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px', color: 'var(--neon-green)' }}>
            Knowledge Base dalam kondisi sehat!
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
            Tidak ditemukan dokumen yang outdated atau kontradiksi antar dokumen.
          </p>
        </div>
      )}
    </div>
  );
};

export default KnowledgeHealth;
