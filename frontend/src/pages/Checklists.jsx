import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ClipboardCheck, Plus, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function Checklists() {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [items, setItems] = useState([{ item: '', status: 'OK', notes: '' }]);

  const fetch = () => {
    setLoading(true);
    axios.get('/api/checklists', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => setChecklists(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const addItem = () => setItems([...items, { item: '', status: 'OK', notes: '' }]);
  const updateItem = (i, field, val) => {
    const next = [...items]; next[i][field] = val; setItems(next);
  };
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!title.trim()) return;
    await axios.post('/api/checklists', { title, items: items.filter(i => i.item.trim()) },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    setTitle(''); setItems([{ item: '', status: 'OK', notes: '' }]); setShowForm(false);
    fetch();
  };

  const statIcon = (s) => {
    if (s === 'OK') return <CheckCircle size={14} color="#10b981" />;
    if (s === 'FAIL') return <XCircle size={14} color="#e11d48" />;
    return <AlertTriangle size={14} color="#f59e0b" />;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title"><ClipboardCheck size={24} /> Daily Checklists</h1>
          <p className="page-subtitle">Operational safety & maintenance checklists</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> New Checklist
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ marginBottom: '24px', padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Create Checklist</h3>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Checklist title (e.g. EAF Morning Inspection)" style={{ marginBottom: '16px', width: '100%' }} />
          {items.map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <input className="input" value={it.item} onChange={e => updateItem(i, 'item', e.target.value)} placeholder="Item name" style={{ flex: 2 }} />
              <select className="input" value={it.status} onChange={e => updateItem(i, 'status', e.target.value)} style={{ flex: 1 }}>
                <option value="OK">OK</option>
                <option value="FAIL">FAIL</option>
                <option value="N/A">N/A</option>
              </select>
              <input className="input" value={it.notes} onChange={e => updateItem(i, 'notes', e.target.value)} placeholder="Notes" style={{ flex: 2 }} />
              {items.length > 1 && <button className="btn btn-danger" onClick={() => removeItem(i)} style={{ padding: '6px 10px' }}>×</button>}
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button className="btn btn-secondary" onClick={addItem}>+ Add Item</button>
            <button className="btn btn-primary" onClick={submit}>Save Checklist</button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="loading-spinner"><Loader2 size={32} /></div>
      ) : checklists.length === 0 ? (
        <div className="empty-state">No checklists yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {checklists.map(cl => (
            <div key={cl.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ color: 'var(--neon-cyan)', margin: 0 }}>{cl.title}</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(cl.created_at).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {cl.items?.map((it, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {statIcon(it.status)}
                    <span style={{ flex: 1, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{it.item}</span>
                    <span style={{ fontSize: '0.75rem', color: it.status === 'FAIL' ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 600 }}>{it.status}</span>
                    {it.notes && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>— {it.notes}</span>}
                  </div>
                ))}
              </div>
              {cl.ai_analysis && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(225,29,72,0.06)', borderRadius: '8px', border: '1px solid rgba(225,29,72,0.15)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 600, marginBottom: '6px' }}>⚠ AI ANALYSIS</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{cl.ai_analysis}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
