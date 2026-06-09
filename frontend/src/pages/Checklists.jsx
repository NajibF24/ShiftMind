import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck, Plus, CheckCircle, XCircle, AlertTriangle,
  Loader2, Trash2, Printer, Search, FileDown, Calendar
} from 'lucide-react';

export default function Checklists() {
  const [checklists, setChecklists] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [items, setItems] = useState([{ item: '', status: 'OK', notes: '' }]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Filtering State
  const [areaFilter, setAreaFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'FAIL' | 'OK'
  
  // Custom Confirmation Modals
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchChecklists = () => {
    setLoading(true);
    axios.get('/api/checklists', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => setChecklists(r.data.items || []))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  };

  const fetchTemplates = () => {
    axios.get('/api/checklists/templates', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => setTemplates(r.data || []))
      .catch(e => console.error(e));
  };

  useEffect(() => {
    fetchChecklists();
    fetchTemplates();
  }, []);

  const addItem = () => setItems([...items, { item: '', status: 'OK', notes: '' }]);
  const updateItem = (i, field, val) => {
    const next = [...items]; next[i][field] = val; setItems(next);
  };
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  const handleLoadTemplate = (templateId) => {
    if (!templateId) return;
    const t = templates.find(temp => temp.id === Number(templateId));
    if (t) {
      setTitle(t.title);
      const newItems = t.items.map(it => ({
        item: it.item || it.title || '',
        status: 'OK',
        notes: ''
      }));
      setItems(newItems);
    }
  };

  const submit = async () => {
    if (!title.trim()) return;
    await axios.post('/api/checklists', { title, items: items.filter(i => i.item.trim()) },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    setTitle(''); setItems([{ item: '', status: 'OK', notes: '' }]); setShowForm(false);
    fetchChecklists();
  };

  const handleDelete = async () => {
    const { id } = deleteModal;
    if (!id) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`/api/checklists/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setDeleteModal({ open: false, id: null });
      fetchChecklists();
    } catch (e) { console.error(e); }
    setDeleteLoading(false);
  };

  const printChecklist = (cl) => {
    const printWindow = window.open('', '_blank');
    const itemsHtml = cl.items.map(it => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 10px; font-weight: bold; color: ${it.status === 'FAIL' ? '#e11d48' : '#333'}">${it.status}</td>
        <td style="padding: 10px;">${it.item}</td>
        <td style="padding: 10px; color: #666; font-style: italic;">${it.notes || '-'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${cl.title}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f5f5f5; text-align: left; padding: 10px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <h1>Checklist: ${cl.title}</h1>
          <p>Tanggal: ${new Date(cl.created_at).toLocaleString('id-ID')}</p>
          <table>
            <thead>
              <tr>
                <th style="width: 100px;">Status</th>
                <th>Item</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          ${cl.ai_analysis ? `
            <div style="margin-top: 30px; padding: 15px; border: 1px solid #f5c2c2; background: #fff5f5; border-radius: 8px;">
              <h3 style="margin-top: 0; color: #e11d48;">AI Analysis</h3>
              <p>${cl.ai_analysis}</p>
            </div>
          ` : ''}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const statIcon = (s) => {
    if (s === 'OK') return <CheckCircle size={15} color="var(--neon-green)" />;
    if (s === 'FAIL') return <XCircle size={15} color="var(--danger)" />;
    return <AlertTriangle size={15} color="var(--warning)" />;
  };

  const getOkPercentage = (clItems) => {
    if (!clItems || clItems.length === 0) return 0;
    const okCount = clItems.filter(i => i.status === 'OK' || i.status === 'N/A').length;
    return Math.round((okCount / clItems.length) * 100);
  };

  const getFailCount = (clItems) => {
    if (!clItems) return 0;
    return clItems.filter(i => i.status === 'FAIL').length;
  };

  const filteredChecklists = checklists.filter(cl => {
    // Area Filter
    if (areaFilter !== 'All') {
      const match = cl.title.toLowerCase().includes(areaFilter.toLowerCase());
      if (!match) return false;
    }
    // Date Filter
    if (dateFilter) {
      const clDate = new Date(cl.created_at).toISOString().split('T')[0];
      if (clDate !== dateFilter) return false;
    }
    // Status Filter
    if (statusFilter !== 'All') {
      const hasFail = getFailCount(cl.items) > 0;
      if (statusFilter === 'FAIL' && !hasFail) return false;
      if (statusFilter === 'OK' && hasFail) return false;
    }
    return true;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-content page-content--wide">
      <div className="section-header" style={{ marginBottom: '32px' }}>
        <div className="section-header__eyebrow">
          <div className="section-header__dot" />
          <span className="section-header__tag">Safety & Maintenance</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="section-header__title">Daily <span className="text-gradient">Checklists</span></h1>
            <p className="section-header__subtitle">Operational safety & plant maintenance checks</p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> New Checklist
          </button>
        </div>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel--strong" style={{ marginBottom: '32px', padding: '28px', borderRadius: 'var(--radius-xl)' }}>
          <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>Create Checklist</h3>
          
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: 2, minWidth: '250px' }}>
              <label className="form-label">Checklist Title</label>
              <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. EAF Morning Inspection" />
            </div>
            
            {templates.length > 0 && (
              <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label">Load Template</label>
                <select className="input-field" value={selectedTemplate} onChange={e => { setSelectedTemplate(e.target.value); handleLoadTemplate(e.target.value); }}>
                  <option value="">-- Select Template --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.area || 'General'})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <label className="form-label">Checklist Items</label>
            {items.map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(255,255,255,0.4)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <input className="input-field" value={it.item} onChange={e => updateItem(i, 'item', e.target.value)} placeholder="Item name" style={{ flex: 3, minWidth: '180px' }} />
                
                {/* 3 Large Toggle Buttons instead of dropdown */}
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.03)', padding: '3px', borderRadius: '8px' }}>
                  {['OK', 'FAIL', 'N/A'].map(statusVal => {
                    let activeBg = 'transparent';
                    let activeColor = 'var(--text-muted)';
                    if (it.status === statusVal) {
                      if (statusVal === 'OK') { activeBg = 'var(--neon-green)'; activeColor = '#fff'; }
                      else if (statusVal === 'FAIL') { activeBg = 'var(--danger)'; activeColor = '#fff'; }
                      else { activeBg = 'var(--warning)'; activeColor = '#fff'; }
                    }
                    return (
                      <button key={statusVal} type="button" onClick={() => updateItem(i, 'status', statusVal)} style={{
                        padding: '8px 16px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                        background: activeBg, color: activeColor, transition: 'all 0.15s'
                      }}>
                        {statusVal}
                      </button>
                    );
                  })}
                </div>

                <input className="input-field" value={it.notes} onChange={e => updateItem(i, 'notes', e.target.value)} placeholder="Notes" style={{ flex: 3, minWidth: '180px' }} />
                {items.length > 1 && <button className="btn-danger" onClick={() => removeItem(i)} style={{ padding: '8px 12px', borderRadius: '8px' }}>×</button>}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <button className="btn-ghost" onClick={addItem}>+ Add Item</button>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn-primary" onClick={submit} disabled={!title.trim()}>Save Checklist</button>
          </div>
        </motion.div>
      )}

      {/* FILTER BAR */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px' }}>
          <Search size={16} color="var(--text-muted)" />
          <select className="form-input" value={areaFilter} onChange={e => setAreaFilter(e.target.value)}>
            <option value="All">All Areas</option>
            <option value="EAF">Electric Arc Furnace (EAF)</option>
            <option value="LF">Ladle Furnace (LF)</option>
            <option value="CCM">Continuous Casting Machine (CCM)</option>
            <option value="Rolling">Rolling Mill</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
          <Calendar size={16} color="var(--text-muted)" />
          <input type="date" className="form-input" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {['All', 'OK', 'FAIL'].map(f => (
            <button key={f} className={`filter-toggle__btn ${statusFilter === f ? 'filter-toggle__btn--active' : ''}`} onClick={() => setStatusFilter(f)}>
              {f === 'All' ? 'All Status' : f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Loader2 size={32} className="animate-spin" color="var(--neon-cyan)" /></div>
      ) : filteredChecklists.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <ClipboardCheck size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
          <p>No checklists found matching criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredChecklists.map(cl => {
            const okPercent = getOkPercentage(cl.items);
            const failCount = getFailCount(cl.items);
            return (
              <div key={cl.id} className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ color: 'var(--text-primary)', margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 600 }}>{cl.title}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Checked on {new Date(cl.created_at).toLocaleString('id-ID')}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {failCount > 0 ? (
                      <span className="badge badge--red" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                        ⚠️ {failCount} FAIL
                      </span>
                    ) : (
                      <span className="badge badge--green" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                        All OK
                      </span>
                    )}
                    <button className="btn-ghost" style={{ padding: '8px' }} onClick={() => printChecklist(cl)} title="Print / Export PDF">
                      <Printer size={14} />
                    </button>
                    <button className="btn-danger" style={{ padding: '8px' }} onClick={() => setDeleteModal({ open: true, id: cl.id })} title="Delete Checklist">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress bar visual */}
                <div style={{ marginBottom: '20px' }}>
                  <div className="progress-bar" style={{ height: '6px' }}>
                    <div className="progress-bar__fill" style={{
                      width: `${okPercent}%`,
                      background: failCount > 0 ? 'var(--danger)' : 'var(--neon-green)'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>Completion Progress</span>
                    <span style={{ fontWeight: 600, color: failCount > 0 ? 'var(--danger)' : 'var(--neon-green)' }}>{okPercent}% OK</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cl.items?.map((it, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.3)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                      {statIcon(it.status)}
                      <span style={{ flex: 1, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{it.item}</span>
                      {it.notes && <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>— {it.notes}</span>}
                    </div>
                  ))}
                </div>

                {cl.ai_analysis && (
                  <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(225,29,72,0.04)', borderRadius: '10px', border: '1px solid rgba(225,29,72,0.15)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>⚠️ AI RECOMMENDATIONS</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{cl.ai_analysis}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.open && (
          <div className="menu-overlay menu-overlay--open" style={{ padding: 0, justifyContent: 'center', alignItems: 'center', background: 'rgba(10,15,30,0.6)', backdropFilter: 'blur(8px)' }} onClick={() => setDeleteModal({ open: false, id: null })}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel--strong" style={{ width: '100%', maxWidth: '400px', padding: '32px', borderRadius: 'var(--radius-2xl)' }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <Trash2 size={48} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 8px', color: 'var(--text-primary)' }}>Delete Checklist?</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                  Are you sure you want to delete checklist #{deleteModal.id}? This action cannot be undone.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDeleteModal({ open: false, id: null })}>Cancel</button>
                <button className="btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={handleDelete} disabled={deleteLoading}>
                  {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}