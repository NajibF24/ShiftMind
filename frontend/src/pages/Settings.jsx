import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Settings as SettingsIcon, MessageSquare, Save, CheckCircle2,
  AlertCircle, Smartphone, Plus, Trash2, Power, PowerOff,
  Server, Database, Activity, RefreshCw
} from 'lucide-react';

const API_HEADERS = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const Settings = () => {
  const [waConfig, setWaConfig] = useState({ enabled: false, recipients: [], connected: false, qr: null });
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [newNumber, setNewNumber] = useState('');

  const fetchStatus = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [waRes, healthRes] = await Promise.all([
        axios.get('/api/whatsapp/status', { headers: API_HEADERS() }),
        axios.get('/api/health').catch(() => ({ data: null })),
      ]);
      setWaConfig({
        enabled: waRes.data.enabled,
        recipients: waRes.data.recipients || [],
        connected: waRes.data.connected,
        qr: waRes.data.qr
      });
      if (healthRes.data) setSystemInfo(healthRes.data);
    } catch (err) {
      console.error('Failed to fetch status', err);
      setMessage({ type: 'error', text: 'Gagal memuat konfigurasi WhatsApp.' });
    }
    if (showLoading) setLoading(false);
  };

  useEffect(() => {
    fetchStatus(true);
  }, []);

  useEffect(() => {
    let interval;
    if (waConfig.enabled && !waConfig.connected) {
      interval = setInterval(() => {
        fetchStatus(false);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [waConfig.enabled, waConfig.connected]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await axios.post('/api/whatsapp/settings', {
        enabled: waConfig.enabled,
        recipients: waConfig.recipients
      }, { headers: API_HEADERS() });
      setMessage({ type: 'success', text: 'Konfigurasi WhatsApp berhasil disimpan.' });
      setTimeout(fetchStatus, 1500); // refresh status after save to see if connected changed
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Gagal menyimpan konfigurasi.' });
    }
    setSaving(false);
  };

  const handleAddNumber = (e) => {
    e.preventDefault();
    if (!newNumber.trim()) return;
    
    // Validation logic: must start with 62 or 08
    const cleanNum = newNumber.replace(/\D/g, '');
    if (!cleanNum.startsWith('62') && !cleanNum.startsWith('08')) {
      setMessage({ type: 'error', text: 'Format nomor tidak valid! Nomor harus diawali dengan 62 atau 08.' });
      return;
    }
    
    if (!waConfig.recipients.includes(cleanNum)) {
      setWaConfig(prev => ({ ...prev, recipients: [...prev.recipients, cleanNum] }));
    }
    setNewNumber('');
  };

  const handleRemoveNumber = (num) => {
    setWaConfig(prev => ({ ...prev, recipients: prev.recipients.filter(r => r !== num) }));
  };

  if (loading) {
    return (
      <div className="page-content page-content--wide animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ color: 'var(--text-muted)' }}>Memuat...</div>
      </div>
    );
  }

  return (
    <div className="page-content page-content--wide animate-fade-in">
      <div className="section-header">
        <div className="section-header__eyebrow"><div className="section-header__dot" /><span className="section-header__tag">Admin</span></div>
        <h1 className="section-header__title"><span className="text-gradient">System</span> <span style={{ color: 'var(--text-primary)' }}>Settings</span></h1>
        <p className="section-header__subtitle">Konfigurasi integrasi eksternal dan sistem notifikasi ShiftMind.</p>
      </div>

      {message && (
        <div style={{
          padding: '14px 18px', borderRadius: '12px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem',
          background: message.type === 'success' ? 'rgba(16,185,129,0.04)' : 'rgba(225,29,72,0.04)',
          border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(225,29,72,0.15)'}`,
          color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
        }}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
          <button onClick={() => setMessage(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
        </div>
      )}

      <div className="glass-panel--strong" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <MessageSquare size={18} color="var(--neon-green)" /> Integrasi WhatsApp
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Kelola status bot WhatsApp dan daftar penerima notifikasi otomatis (misal: checklist FAIL, Approval baru).
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <span style={{ fontSize: '0.8rem', color: waConfig.connected ? 'var(--neon-green)' : 'var(--text-muted)' }}>
               {waConfig.connected ? '● Server Terhubung' : '○ Server Disconnected'}
             </span>
             <button 
               onClick={() => setWaConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
               style={{
                 display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '20px',
                 background: waConfig.enabled ? 'rgba(16,185,129,0.1)' : 'rgba(225,29,72,0.1)',
                 color: waConfig.enabled ? 'var(--neon-green)' : 'var(--danger)',
                 border: `1px solid ${waConfig.enabled ? 'rgba(16,185,129,0.3)' : 'rgba(225,29,72,0.3)'}`,
                 cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s'
               }}
             >
               {waConfig.enabled ? <Power size={14} /> : <PowerOff size={14} />}
               {waConfig.enabled ? 'Enabled' : 'Disabled'}
             </button>
           </div>
         </div>

         {waConfig.enabled && !waConfig.connected && waConfig.qr && (
           <div style={{ textAlign: 'center', margin: '24px 0' }}>
             <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Scan QR code to connect WhatsApp</p>
             <img src={waConfig.qr} alt="WhatsApp QR" style={{ width: '200px', height: '200px' }} />
           </div>
         )}

         <div style={{ opacity: waConfig.enabled ? 1 : 0.5, transition: 'opacity 0.3s' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '16px' }}>Daftar Penerima (Nomor WA)</h3>
            
            <form onSubmit={handleAddNumber} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <input 
                    value={newNumber} 
                    onChange={e => setNewNumber(e.target.value)} 
                    placeholder="Contoh: 08123456789 atau 628123456789" 
                    className="form-input" 
                    style={{ maxWidth: '300px' }}
                    disabled={!waConfig.enabled}
                />
                <button type="submit" className="btn-ghost" disabled={!waConfig.enabled} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={14} /> Tambah Nomor
                </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                {waConfig.recipients.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Belum ada nomor yang didaftarkan.</div>
                ) : (
                    waConfig.recipients.map((num, idx) => (
                        <div key={idx} style={{ 
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                            padding: '12px 16px', background: 'rgba(255,255,255,0.02)', 
                            border: '1px solid var(--border)', borderRadius: '8px', maxWidth: '400px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Smartphone size={16} color="var(--neon-cyan)" />
                                <span style={{ fontSize: '0.9rem', letterSpacing: '1px' }}>{num}</span>
                            </div>
                            <button 
                                onClick={() => handleRemoveNumber(num)}
                                disabled={!waConfig.enabled}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
            
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Save size={15} /> {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                </button>
            </div>
        </div>
      </div>
      {/* System Info */}
      <div className="glass-panel--strong" style={{ padding: '32px', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.1)' }}>
            <Server size={15} color="var(--neon-cyan)" />
          </div>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', fontFamily: 'var(--font-display)' }}>System Info</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Backend Status', value: systemInfo?.status || 'Unknown', icon: Activity },
            { label: 'Database', value: systemInfo?.db || 'Unknown', icon: Database },
            { label: 'API Version', value: systemInfo?.version || 'v2.0', icon: RefreshCw },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <Icon size={13} color="var(--neon-cyan)" /> {label}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: value === 'operational' || value === 'Online' ? 'var(--neon-green)' : 'var(--text-primary)' }}>
                {value === 'operational' || value === 'Online' ? 'Operational' : value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
