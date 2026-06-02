import React, { useState } from 'react';
import axios from 'axios';
import { PenLine, CheckCircle2, AlertCircle, Loader2, FileText, Tag, Building2 } from 'lucide-react';

const CaptureKnowledge = () => {
  const [form, setForm] = useState({ title: '', content: '', category: '', department: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await axios.post('/api/knowledge', { ...form, source: 'manual' }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStatus({ type: 'success', text: 'Knowledge berhasil ditambahkan ke database.' });
      setForm({ title: '', content: '', category: '', department: '' });
    } catch {
      setStatus({ type: 'error', text: 'Gagal menyimpan knowledge. Silakan coba lagi.' });
    }
    setLoading(false);
  };

  return (
    <div className="page-content page-content--narrow animate-fade-in">
      <div className="section-header">
        <div className="section-header__eyebrow">
          <PenLine size={14} color="var(--neon-cyan)" />
          <span className="section-header__tag" style={{ color: 'var(--neon-cyan)' }}>Capture</span>
        </div>
        <h1 className="section-header__title">
          <span className="text-gradient">Capture</span>{' '}
          <span style={{ color: 'var(--text-primary)' }}>Knowledge</span>
        </h1>
        <p className="section-header__subtitle">
          Tambahkan pengetahuan baru ke ShiftMind knowledge base secara manual.
        </p>
      </div>

      {status && (
        <div style={{
          padding: '14px 18px', borderRadius: '12px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem',
          background: status.type === 'success' ? 'rgba(16,185,129,0.04)' : 'rgba(225,29,72,0.04)',
          border: `1px solid ${status.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(225,29,72,0.15)'}`,
          color: status.type === 'success' ? 'var(--success)' : 'var(--danger)',
        }}>
          {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {status.text}
          <button onClick={() => setStatus(null)} style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: 'inherit', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1,
          }}>×</button>
        </div>
      )}

      <div className="glass-panel--strong" style={{ padding: '36px', borderRadius: 'var(--radius-2xl)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={12} /> Judul
            </label>
            <input type="text" className="input-field" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Contoh: Prosedur Penanganan Material Cacat" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={12} /> Kategori
              </label>
              <select className="input-field" value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">Pilih kategori</option>
                <option value="SOP">SOP</option>
                <option value="Policy">Policy</option>
                <option value="Technical">Technical</option>
                <option value="Product">Product</option>
                <option value="HR">HR</option>
                <option value="Safety">Safety (K3)</option>
                <option value="General">General</option>
              </select>
            </div>
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={12} /> Department
              </label>
              <input type="text" className="input-field" value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
                placeholder="Contoh: Produksi, HR, QC" />
            </div>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label className="form-label">Konten</label>
            <textarea className="input-field input-field--textarea" value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="Tuliskan pengetahuan, SOP, atau informasi yang ingin disimpan..."
              required style={{ minHeight: '200px' }} />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '0.95rem' }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <PenLine size={18} />}
            {loading ? 'Menyimpan...' : 'Simpan Knowledge'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CaptureKnowledge;
