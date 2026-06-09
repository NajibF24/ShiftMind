import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSignature, Plus, CheckCircle, XCircle, Clock, FileText,
  Upload, Loader2, RefreshCw, ShoppingCart, Settings
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function Approvals() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'ai-review'
  
  // Tab List State
  const [listFilter, setListFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected'
  
  // New Request Form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [requestType, setRequestType] = useState('contract');
  const [submitLoading, setSubmitLoading] = useState(false);

  // AI Review Form
  const [file, setFile] = useState(null);
  const [reviewResult, setReviewResult] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  
  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null, action: null });
  const [actionLoading, setActionLoading] = useState(false);
  
  const role = localStorage.getItem('role');

  const fetch = () => {
    setLoading(true);
    axios.get('/api/approvals', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => setApprovals(r.data.items || []))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const submitApproval = async () => {
    if (!title.trim() || !details.trim()) return;
    setSubmitLoading(true);
    try {
      await axios.post('/api/approvals', { title, details, request_type: requestType },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setTitle(''); setDetails(''); setShowForm(false);
      fetch();
    } catch (e) { console.error(e); }
    setSubmitLoading(false);
  };

  const executeAction = async () => {
    const { id, action } = confirmModal;
    if (!id || !action) return;
    setActionLoading(true);
    try {
      await axios.post(`/api/approvals/${id}/action?action=${action}`, {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setConfirmModal({ open: false, id: null, action: null });
      fetch();
    } catch (e) { console.error(e); }
    setActionLoading(false);
  };

  const handleReview = async () => {
    if (!file) return;
    setReviewing(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await axios.post('/api/approvals/review-contract', fd,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' } });
      setReviewResult(res.data.ai_review);
    } catch (e) {
      setReviewResult('Review failed: ' + (e.response?.data?.detail || e.message));
    }
    setReviewing(false);
  };

  const statusBadge = (s) => {
    if (s === 'approved') return { icon: <CheckCircle size={14} />, class: 'badge--green', label: 'Approved' };
    if (s === 'rejected') return { icon: <XCircle size={14} />, class: 'badge--red', label: 'Rejected' };
    return { icon: <Clock size={14} />, class: 'badge--yellow', label: 'Pending' };
  };

  const typeIcon = (t) => {
    if (t === 'purchase') return <ShoppingCart size={14} />;
    if (t === 'workflow') return <Settings size={14} />;
    return <FileText size={14} />;
  };

  const filteredApprovals = approvals.filter(a => listFilter === 'all' || a.status === listFilter);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-content page-content--wide">
      <div className="section-header" style={{ marginBottom: '32px' }}>
        <div className="section-header__eyebrow">
          <div className="section-header__dot" />
          <span className="section-header__tag">Workflow</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="section-header__title"><span className="text-gradient">Approvals</span> & Contract Review</h1>
            <p className="section-header__subtitle">Review contract using AI, submit workflow approvals</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-ghost" onClick={fetch} disabled={loading} style={{ padding: '10px' }}>
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
              <Plus size={16} /> New Request
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel--strong" style={{ padding: '24px', marginBottom: '32px', borderRadius: 'var(--radius-xl)' }}>
          <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>Create New Approval Request</h3>
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Request Type</label>
            <select className="input-field" value={requestType} onChange={e => setRequestType(e.target.value)}>
              <option value="contract">Contract Review</option>
              <option value="purchase">Purchase Order</option>
              <option value="workflow">Workflow Approval</option>
            </select>
          </div>
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Title</label>
            <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Vendor ABC Q3 Renewal" />
          </div>
          <div className="input-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Details</label>
            <textarea className="input-field input-field--textarea" value={details} onChange={e => setDetails(e.target.value)} placeholder="Provide full context for reviewers..." />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn-primary" onClick={submitApproval} disabled={submitLoading || !title.trim() || !details.trim()}>
              {submitLoading ? <Loader2 size={16} className="animate-spin" /> : 'Submit Request'}
            </button>
          </div>
        </motion.div>
      )}

      {/* TABS */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('list')}
          style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-body)',
            background: activeTab === 'list' ? 'rgba(14,165,233,0.08)' : 'transparent',
            color: activeTab === 'list' ? 'var(--neon-cyan)' : 'var(--text-muted)',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <FileSignature size={16} /> Approval Requests
        </button>
        <button
          onClick={() => setActiveTab('ai-review')}
          style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-body)',
            background: activeTab === 'ai-review' ? 'rgba(139,92,246,0.08)' : 'transparent',
            color: activeTab === 'ai-review' ? 'var(--neon-purple)' : 'var(--text-muted)',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <FileText size={16} /> AI Contract Review
        </button>
      </div>

      {/* AI Contract Review Tab */}
      {activeTab === 'ai-review' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} color="var(--neon-purple)" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>AI Contract Assessment</h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Upload a contract document (PDF, DOCX) to analyze risks and obligations.</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '24px', background: 'rgba(255,255,255,0.5)', padding: '16px', borderRadius: '12px', border: '1px dashed var(--border-light)' }}>
            <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={e => setFile(e.target.files[0])} className="input-field" style={{ flex: 1, background: 'transparent', border: 'none', padding: 0 }} />
            <button className="btn-primary" onClick={handleReview} disabled={!file || reviewing} style={{ background: 'var(--neon-purple)', borderColor: 'var(--neon-purple)' }}>
              {reviewing ? <Loader2 size={16} className="animate-spin" /> : <><Upload size={16} /> Analyze Document</>}
            </button>
          </div>
          
          {reviewResult && (
            <div style={{ marginTop: '24px', padding: '24px', background: 'var(--bg-void)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--neon-purple)', fontWeight: 700, letterSpacing: '1px', marginBottom: '16px' }}>📋 ANALYSIS RESULT</div>
              <div className="markdown-body" style={{ fontSize: '0.9rem' }}>
                <ReactMarkdown>{reviewResult}</ReactMarkdown>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Approval Requests Tab */}
      {activeTab === 'list' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {['pending', 'approved', 'rejected', 'all'].map(f => (
              <button key={f} className="filter-toggle__btn" style={{ background: listFilter === f ? 'rgba(0,0,0,0.06)' : 'transparent', color: listFilter === f ? 'var(--text-primary)' : 'var(--text-muted)' }} onClick={() => setListFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)} {f !== 'all' && `(${approvals.filter(a => a.status === f).length})`}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Loader2 size={32} className="animate-spin" color="var(--neon-cyan)" /></div>
          ) : filteredApprovals.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
              <p>No {listFilter !== 'all' ? listFilter : ''} approval requests found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredApprovals.map(a => {
                const badge = statusBadge(a.status);
                return (
                  <div key={a.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                          <span className="badge badge--cyan" style={{ textTransform: 'uppercase' }}>
                            {typeIcon(a.request_type)} {a.request_type}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ID: {a.id}
                          </span>
                        </div>
                        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 600 }}>{a.title}</h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Submitted on {new Date(a.created_at).toLocaleString('id-ID')}
                        </div>
                      </div>
                      <span className={`badge ${badge.class}`} style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
                        {badge.icon} {badge.label}
                      </span>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.4)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {a.details}
                    </div>

                    {a.ai_assessment && (
                      <details style={{ background: 'rgba(139,92,246,0.04)', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.15)', overflow: 'hidden' }}>
                        <summary style={{ padding: '12px 16px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--neon-purple)', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AlertTriangle size={14} /> View AI Risk Assessment
                        </summary>
                        <div className="markdown-body" style={{ padding: '0 16px 16px', fontSize: '0.85rem' }}>
                          <ReactMarkdown>{a.ai_assessment}</ReactMarkdown>
                        </div>
                      </details>
                    )}

                    {a.status === 'pending' && role === 'admin' && (
                      <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px', justifyContent: 'flex-end' }}>
                        <button className="btn-danger" onClick={() => setConfirmModal({ open: true, id: a.id, action: 'rejected' })}>
                          <XCircle size={16} /> Reject
                        </button>
                        <button className="btn-primary btn-primary--green" onClick={() => setConfirmModal({ open: true, id: a.id, action: 'approved' })}>
                          <CheckCircle size={16} /> Approve
                        </button>
                      </div>
                    )}

                    {/* Timeline Tracker */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--neon-cyan)' }} />
                      <div style={{ height: '2px', flex: 1, background: 'var(--neon-cyan)', opacity: 0.3 }} />
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.status !== 'pending' ? badge.color : 'var(--border-light)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <span>Submitted</span>
                      <span>{a.status === 'pending' ? 'Under Review' : 'Decided'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.open && (
          <div className="menu-overlay menu-overlay--open" style={{ padding: 0, justifyContent: 'center', alignItems: 'center', background: 'rgba(10,15,30,0.6)', backdropFilter: 'blur(8px)' }} onClick={() => setConfirmModal({ open: false, id: null, action: null })}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel--strong" style={{ width: '100%', maxWidth: '400px', padding: '32px', borderRadius: 'var(--radius-2xl)' }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                {confirmModal.action === 'approved' ? <CheckCircle size={48} color="var(--neon-green)" style={{ margin: '0 auto 16px' }} /> : <XCircle size={48} color="var(--danger)" style={{ margin: '0 auto 16px' }} />}
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 8px', color: 'var(--text-primary)' }}>Confirm Decision</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                  Are you sure you want to <strong>{confirmModal.action}</strong> request #{confirmModal.id}? This action cannot be undone.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirmModal({ open: false, id: null, action: null })}>Cancel</button>
                <button className={confirmModal.action === 'approved' ? 'btn-primary btn-primary--green' : 'btn-danger'} style={{ flex: 1, justifyContent: 'center' }} onClick={executeAction} disabled={actionLoading}>
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}