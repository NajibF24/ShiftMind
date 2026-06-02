import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FileSignature, Plus, CheckCircle, XCircle, Clock, FileText, Upload, Loader2 } from 'lucide-react';

export default function Approvals() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [requestType, setRequestType] = useState('contract');
  const [file, setFile] = useState(null);
  const [reviewResult, setReviewResult] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const role = localStorage.getItem('role');

  const fetch = () => {
    setLoading(true);
    axios.get('/api/approvals', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => setApprovals(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const submitApproval = async () => {
    if (!title.trim() || !details.trim()) return;
    await axios.post('/api/approvals', { title, details, request_type: requestType },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    setTitle(''); setDetails(''); setShowForm(false); fetch();
  };

  const handleAction = async (id, action) => {
    await axios.post(`/api/approvals/${id}/action?action=${action}`, {},
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    fetch();
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
    if (s === 'approved') return { icon: <CheckCircle size={14} />, color: '#10b981', label: 'Approved' };
    if (s === 'rejected') return { icon: <XCircle size={14} />, color: '#e11d48', label: 'Rejected' };
    return { icon: <Clock size={14} />, color: '#f59e0b', label: 'Pending' };
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title"><FileSignature size={24} /> Approvals & Contract Review</h1>
          <p className="page-subtitle">Submit requests, review contracts with AI assistance</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> New Request
        </button>
      </div>

      {/* AI Contract Review */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} /> AI Contract Review
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Upload a contract document (PDF, DOCX, TXT) and AI will analyze risks and obligations.
        </p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={e => setFile(e.target.files[0])} className="input" style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={handleReview} disabled={!file || reviewing}>
            {reviewing ? <Loader2 size={16} className="spin" /> : <Upload size={16} />} Review
          </button>
        </div>
        {reviewResult && (
          <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(59,130,246,0.06)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.15)', whiteSpace: 'pre-wrap' }}>
            <div style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 600, marginBottom: '8px' }}>📋 AI REVIEW RESULT</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{reviewResult}</div>
          </div>
        )}
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>New Approval Request</h3>
          <select className="input" value={requestType} onChange={e => setRequestType(e.target.value)} style={{ width: '100%', marginBottom: '12px' }}>
            <option value="contract">Contract Review</option>
            <option value="purchase">Purchase Order</option>
            <option value="workflow">Workflow Approval</option>
          </select>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Request title" style={{ width: '100%', marginBottom: '12px' }} />
          <textarea className="input" value={details} onChange={e => setDetails(e.target.value)} placeholder="Details..." rows={4} style={{ width: '100%', marginBottom: '12px', resize: 'vertical' }} />
          <button className="btn btn-primary" onClick={submitApproval}>Submit Request</button>
        </motion.div>
      )}

      {loading ? (
        <div className="loading-spinner"><Loader2 size={32} /></div>
      ) : approvals.length === 0 ? (
        <div className="empty-state">No approval requests yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {approvals.map(a => {
            const badge = statusBadge(a.status);
            return (
              <div key={a.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1rem' }}>{a.title}</h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.request_type} · {new Date(a.created_at).toLocaleString()}</span>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: badge.color, fontWeight: 600 }}>
                    {badge.icon} {badge.label}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>{a.details}</p>
                {a.ai_assessment && (
                  <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(139,92,246,0.06)', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.12)', fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    <strong style={{ color: '#a78bfa' }}>AI Assessment:</strong> {a.ai_assessment}
                  </div>
                )}
                {a.status === 'pending' && role === 'admin' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button className="btn btn-success" onClick={() => handleAction(a.id, 'approved')} style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button className="btn btn-danger" onClick={() => handleAction(a.id, 'rejected')} style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
