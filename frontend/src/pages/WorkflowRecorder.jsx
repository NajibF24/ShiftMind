import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  GitBranch, Plus, Sparkles, FileText, Shield, Zap, Clock,
  ChevronRight, Loader2, Trash2, CheckCircle, Award, Eye,
  ArrowUp, ArrowDown, CheckSquare, AlertTriangle
} from 'lucide-react';

const API = '/api/workflow';
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const CATEGORIES = ['Machine Setup', 'Troubleshooting', 'Maintenance', 'Quality Check', 'Safety Procedure', 'Administrative', 'IT Process', 'Other'];
const AREAS = ['EAF (Electric Arc Furnace)', 'Rolling Mill', 'QC Lab', 'Warehouse', 'Maintenance', 'Utility', 'Continuous Casting', 'IT', 'HR', 'Other'];

const WorkflowRecorder = () => {
  const [workflows, setWorkflows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewingSOP, setViewingSOP] = useState(null);
  const role = localStorage.getItem('role');
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [form, setForm] = useState({
    title: '', description: '', category: '', department: '', area: '',
    steps: [{ step: 1, action: '', notes: '', duration: '' }],
  });

  useEffect(() => { fetchWorkflows(); }, []);

  const fetchWorkflows = async (pageNum = 1) => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}?page=${pageNum}`, { headers: headers() });
      if (pageNum === 1) {
          setWorkflows(r.data);
      } else {
          setWorkflows(prev => [...prev, ...r.data]);
      }
      setPage(pageNum);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const addStep = () => {
    setForm(prev => ({
      ...prev,
      steps: [...prev.steps, { step: prev.steps.length + 1, action: '', notes: '', duration: '' }]
    }));
  };

  const removeStep = (idx) => {
    if (form.steps.length <= 1) return;
    setForm(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step: i + 1 }))
    }));
  };

  const moveStepUp = (idx) => {
    if (idx === 0) return;
    setForm(prev => {
      const newSteps = [...prev.steps];
      const temp = newSteps[idx - 1];
      newSteps[idx - 1] = newSteps[idx];
      newSteps[idx] = temp;
      return { ...prev, steps: newSteps.map((s, i) => ({ ...s, step: i + 1 })) };
    });
  };

  const moveStepDown = (idx) => {
    if (idx === form.steps.length - 1) return;
    setForm(prev => {
      const newSteps = [...prev.steps];
      const temp = newSteps[idx + 1];
      newSteps[idx + 1] = newSteps[idx];
      newSteps[idx] = temp;
      return { ...prev, steps: newSteps.map((s, i) => ({ ...s, step: i + 1 })) };
    });
  };

  const updateStep = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      steps: prev.steps.map((s, i) => i === idx ? { ...s, [field]: value } : s)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.steps[0].action.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        steps: form.steps.filter(s => s.action.trim()),
      };
      if (editId) {
          await axios.put(`${API}/${editId}`, payload, { headers: headers() });
      } else {
          await axios.post(API, payload, { headers: headers() });
      }
      setForm({
        title: '', description: '', category: '', department: '', area: '',
        steps: [{ step: 1, action: '', notes: '', duration: '' }],
      });
      setShowForm(false);
      setEditId(null);
      fetchWorkflows(1);
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message));
    }
    setSubmitting(false);
  };

  const handleEdit = (wf) => {
      setForm({
          title: wf.title,
          description: wf.description || '',
          category: wf.category || '',
          department: wf.department || '',
          area: wf.area || '',
          steps: wf.steps && wf.steps.length > 0 ? wf.steps : [{ step: 1, action: '', notes: '', duration: '' }]
      });
      setEditId(wf.id);
      setShowForm(true);
      window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
      try {
          await axios.delete(`${API}/${id}`, { headers: headers() });
          setConfirmDelete(null);
          fetchWorkflows(1);
      } catch (e) {
          alert('Error: ' + (e.response?.data?.detail || e.message));
      }
  };

  const handleApprove = async (id) => {
    try {
      await axios.post(`${API}/${id}/approve`, {}, { headers: headers() });
      fetchWorkflows();
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message));
    }
  };

  const viewFullWorkflow = async (id) => {
    try {
      const r = await axios.get(`${API}/${id}`, { headers: headers() });
      setViewingSOP(r.data);
    } catch (e) { console.error(e); }
  };

  const handleMarkUsed = async (id) => {
    try {
      await axios.post(`${API}/${id}/mark-used`, {}, { headers: headers() });
      setViewingSOP(prev => ({ ...prev, used_count: prev.used_count + 1 }));
      fetchWorkflows(1);
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message));
    }
  };

  return (
    <div className="page-content animate-fade-in">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '32px' }}>
        <div className="section-header__eyebrow">
          <div className="section-header__dot" />
          <span className="section-header__tag">Auto-SOP Generator</span>
        </div>
        <h1 className="section-header__title">
          <span className="text-gradient">Workflow</span>
          <br />
          <span style={{ color: 'var(--text-primary)' }}>Recorder</span>
        </h1>
        <p className="section-header__subtitle">
          Rekam langkah-langkah kerja Anda. AI akan mengkonversi menjadi <strong style={{ color: 'var(--neon-cyan)' }}>dokumen SOP formal</strong> + analisis keselamatan otomatis.
        </p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={15} /> Record Workflow
        </button>
      </div>

      {/* SOP Viewer Modal */}
      {viewingSOP && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px',
        }} onClick={() => setViewingSOP(null)}>
          <div className="glass-panel" style={{
            maxWidth: '800px', width: '100%', maxHeight: '80vh', overflowY: 'auto',
            padding: '32px',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>{viewingSOP.title}</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {viewingSOP.is_approved === 1 && <span className="badge badge--green" style={{ fontSize: '0.6rem' }}><Award size={10} /> Approved SOP</span>}
                  {viewingSOP.ai_estimated_time && <span className="badge badge--cyan" style={{ fontSize: '0.6rem' }}><Clock size={10} /> {viewingSOP.ai_estimated_time}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={() => handleMarkUsed(viewingSOP.id)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--neon-green)', color: '#000' }}>
                      <CheckSquare size={14} /> Mark as Used
                  </button>
                  <button onClick={() => {
                      const token = localStorage.getItem('token');
                      window.open(`/api/export/workflow/${viewingSOP.id}/docx?token=${token}`, '_blank');
                  }} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} /> Export DOCX
                  </button>
                  <button onClick={() => setViewingSOP(null)} className="btn-ghost" style={{ fontSize: '0.8rem' }}>Close</button>
              </div>
            </div>

            {/* Tabs inside modal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {viewingSOP.ai_sop_draft && (
                <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(14,165,233,0.03)', border: '1px solid rgba(14,165,233,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.8rem', color: 'var(--neon-cyan)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <FileText size={14} /> AI-Generated SOP
                  </div>
                  <div className="markdown-body" style={{ fontSize: '0.88rem', lineHeight: 1.8 }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{viewingSOP.ai_sop_draft}</ReactMarkdown>
                  </div>
                </div>
              )}

              {viewingSOP.ai_safety_notes && (
                <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(225,29,72,0.03)', border: '1px solid rgba(225,29,72,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.8rem', color: 'var(--danger)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <Shield size={14} /> Safety Analysis
                  </div>
                  <div className="markdown-body" style={{ fontSize: '0.88rem', lineHeight: 1.8 }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{viewingSOP.ai_safety_notes}</ReactMarkdown>
                  </div>
                </div>
              )}

              {viewingSOP.ai_optimization && (
                <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(124,58,237,0.03)', border: '1px solid rgba(124,58,237,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.8rem', color: 'var(--neon-purple)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <Zap size={14} /> Optimization Suggestions
                  </div>
                  <div className="markdown-body" style={{ fontSize: '0.88rem', lineHeight: 1.8 }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{viewingSOP.ai_optimization}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Workflow Form */}
      {showForm && (
        <div className="glass-panel animate-fade-in-up" style={{ padding: '28px', marginBottom: '24px', borderLeft: '4px solid var(--neon-green)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '20px', fontFamily: 'var(--font-display)' }}>
            <GitBranch size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Record New Workflow
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Judul workflow (contoh: Cara setting Rolling Mill untuk H-Beam 200x200)"
              className="form-input" required />
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Deskripsi singkat tujuan workflow ini" className="form-input" rows={2} />
            <div className="wf-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="form-input">
                <option value="">Category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} className="form-input">
                <option value="">Area</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                placeholder="Department" className="form-input" />
            </div>

            {/* Steps */}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Langkah-langkah Prosedur
              </div>
              {form.steps.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: '700', color: 'var(--neon-cyan)', fontFamily: 'var(--font-display)',
                    marginTop: '4px',
                  }}>
                    {step.step}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input value={step.action} onChange={e => updateStep(idx, 'action', e.target.value)}
                      placeholder={`Langkah ${step.step}: Apa yang dilakukan?`}
                      className="form-input" required={idx === 0} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input value={step.notes} onChange={e => updateStep(idx, 'notes', e.target.value)}
                        placeholder="Catatan/tips (opsional)" className="form-input" style={{ flex: 1 }} />
                      <input value={step.duration} onChange={e => updateStep(idx, 'duration', e.target.value)}
                        placeholder="Durasi" className="form-input" style={{ width: '120px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                    <button type="button" onClick={() => moveStepUp(idx)} disabled={idx === 0}
                      style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', padding: '4px', color: idx === 0 ? 'transparent' : 'var(--text-muted)' }}>
                      <ArrowUp size={14} />
                    </button>
                    <button type="button" onClick={() => moveStepDown(idx)} disabled={idx === form.steps.length - 1}
                      style={{ background: 'none', border: 'none', cursor: idx === form.steps.length - 1 ? 'not-allowed' : 'pointer', padding: '4px', color: idx === form.steps.length - 1 ? 'transparent' : 'var(--text-muted)' }}>
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  {form.steps.length > 1 && (
                    <button type="button" onClick={() => removeStep(idx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addStep} className="btn-ghost" style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                <Plus size={13} /> Add Step
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                  setForm({
                      title: '', description: '', category: '', department: '', area: '',
                      steps: [{ step: 1, action: '', notes: '', duration: '' }],
                  });
              }} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {submitting ? 'Generating SOP...' : 'Save & Generate SOP'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Workflow List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        </div>
      ) : workflows.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
          <GitBranch size={40} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Belum ada workflow. Mulai rekam prosedur kerja Anda!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {workflows.map((wf, idx) => (
            <div key={wf.id} className="glass-panel glass-panel--interactive animate-fade-in-up"
              style={{ padding: '22px', cursor: 'pointer', animationDelay: `${idx * 0.05}s` }}
              onClick={() => viewFullWorkflow(wf.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>{wf.title}</h3>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {wf.category && <span className="badge badge--cyan" style={{ fontSize: '0.6rem' }}>{wf.category}</span>}
                    {wf.is_approved !== 1 && <span className="badge" style={{ fontSize: '0.6rem', background: 'rgba(245,158,11,0.08)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.2)' }}><Clock size={9} /> Pending Review</span>}
                    {wf.is_approved === 1 && <span className="badge badge--green" style={{ fontSize: '0.6rem' }}><CheckCircle size={9} /> Approved</span>}
                    {wf.version && <span className="badge" style={{ fontSize: '0.6rem', background: 'rgba(124,58,237,0.08)', color: 'var(--neon-purple)', border: '1px solid rgba(124,58,237,0.2)' }}>v{wf.version}</span>}
                    {wf.ai_estimated_time && <span className="badge" style={{ fontSize: '0.6rem', background: 'rgba(14,165,233,0.04)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}><Clock size={9} /> {wf.ai_estimated_time}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  <Eye size={12} /> {wf.used_count}
                </div>
              </div>

              {wf.description && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
                  {wf.description}
                </p>
              )}

              {/* Steps preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {(wf.steps || []).slice(0, 3).map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
                    <span style={{
                      width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', color: 'var(--neon-cyan)', fontWeight: '700',
                    }}>{s.step}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{s.action}</span>
                  </div>
                ))}
                {(wf.steps || []).length > 3 && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '28px' }}>
                    +{wf.steps.length - 3} more steps...
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>by {wf.author_name}</span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button onClick={(e) => { e.stopPropagation(); viewFullWorkflow(wf.id); }} className="btn-ghost" style={{ fontSize: '0.65rem', padding: '4px 8px' }}>
                    <Eye size={11} /> SOP
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); const token = localStorage.getItem('token'); window.open(`/api/export/workflow/${wf.id}/docx?token=${token}`, '_blank'); }} className="btn-ghost" style={{ fontSize: '0.65rem', padding: '4px 8px' }}>
                    <FileText size={11} /> DOCX
                  </button>
                  {role === 'admin' && wf.is_approved !== 1 && (
                    <button onClick={(e) => { e.stopPropagation(); handleApprove(wf.id); }}
                      className="btn-ghost" style={{ fontSize: '0.65rem', padding: '4px 8px', color: 'var(--neon-green)' }}>
                      <Award size={11} /> Approve
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(wf); }} className="btn-ghost" style={{ padding: '4px 8px', fontSize: '0.65rem' }}>Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(wf); }} style={{ padding: '4px 8px', fontSize: '0.65rem', background: 'rgba(225,29,72,0.1)', color: 'var(--danger)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && workflows.length >= page * 20 && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button onClick={() => fetchWorkflows(page + 1)} className="btn-ghost">
                  Load More
              </button>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="menu-overlay menu-overlay--open" style={{ padding: 0, justifyContent: 'center', alignItems: 'center', background: 'rgba(10,15,30,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={() => setConfirmDelete(null)}>
          <div className="glass-panel animate-fade-in-up" style={{ maxWidth: '420px', width: '90%', padding: '32px', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <AlertTriangle size={48} color="var(--danger)" style={{ margin: '0 auto 16px', opacity: 0.7 }} />
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Hapus Workflow?</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
              "{confirmDelete.title}" akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirmDelete(null)}>Batal</button>
              <button className="btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleDelete(confirmDelete.id)}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .wf-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default WorkflowRecorder;
