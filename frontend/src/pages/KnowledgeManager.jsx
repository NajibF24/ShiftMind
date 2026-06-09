import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  CloudDownload, Building2, FileText, PenLine, RefreshCw,
  Trash2, CheckCircle2, AlertCircle, Loader2, FolderSync, Filter, Search,
  BrainCircuit, ThumbsUp, ThumbsDown, Clock,
} from 'lucide-react';

const API_HEADERS = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const KnowledgeManager = () => {
  const [entries, setEntries] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [draftsTotal, setDraftsTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('entries');
  const [stats, setStats] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [sourceFilter, setSourceFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState(null);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchAll(); }, [sourceFilter]);

  const fetchDrafts = async () => {
    setLoadingDrafts(true);
    try {
      const r = await axios.get('/api/knowledge/drafts', { headers: API_HEADERS() });
      setDrafts(r.data.items || []);
      setDraftsTotal(r.data.total || 0);
    } catch (err) { console.error('Failed to load drafts', err); }
    setLoadingDrafts(false);
  };

  useEffect(() => { if (activeTab === 'drafts') fetchDrafts(); }, [activeTab]);

  const handleApproveDraft = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: 'approve' }));
    try {
      const res = await axios.post(`/api/knowledge/${id}/approve`, {}, { headers: API_HEADERS() });
      setMessage({ type: 'success', text: res.data.message });
      fetchDrafts();
    } catch (err) { setMessage({ type: 'error', text: err.response?.data?.detail || 'Gagal approve' }); }
    setActionLoading(prev => ({ ...prev, [id]: null }));
  };

  const handleRejectDraft = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: 'reject' }));
    try {
      const res = await axios.delete(`/api/knowledge/${id}/reject`, { headers: API_HEADERS() });
      setMessage({ type: 'success', text: res.data.message });
      fetchDrafts();
    } catch (err) { setMessage({ type: 'error', text: err.response?.data?.detail || 'Gagal reject' }); }
    setActionLoading(prev => ({ ...prev, [id]: null }));
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [entriesRes, statsRes, syncRes] = await Promise.all([
        axios.get(`/api/knowledge${sourceFilter ? `?source=${sourceFilter}` : ''}`, { headers: API_HEADERS() }),
        axios.get('/api/dashboard/stats', { headers: API_HEADERS() }),
        axios.get('/api/sync/status', { headers: API_HEADERS() }).catch(() => ({ data: null })),
      ]);
      setEntries(entriesRes.data);
      setStats(statsRes.data);
      setSyncStatus(syncRes.data);
    } catch (err) { console.error('Failed to fetch data', err); }
    setLoading(false);
  };

  const handleSyncOneDrive = async () => {
    setSyncing(true); setMessage(null);
    try {
      const res = await axios.post('/api/sync/onedrive', {}, { headers: API_HEADERS() });
      setMessage({ type: 'success', text: res.data.message });
    } catch (err) { setMessage({ type: 'error', text: err.response?.data?.detail || 'Sync failed' }); }
    setSyncing(false);
  };

  const handleSeedCompany = async () => {
    setSeeding(true); setMessage(null);
    try {
      const res = await axios.post('/api/sync/seed-company', {}, { headers: API_HEADERS() });
      const s = res.data.stats;
      setMessage({ type: 'success', text: `Seeding done — ${s.created} new, ${s.skipped} skipped, ${s.errors} errors.` });
      fetchAll();
    } catch (err) { setMessage({ type: 'error', text: err.response?.data?.detail || 'Seeding failed' }); }
    setSeeding(false);
  };

  const [confirmDeleteSource, setConfirmDeleteSource] = useState(null);

  const handleDeleteBySource = async (source) => {
    try { const res = await axios.delete(`/api/knowledge/source/${source}`, { headers: API_HEADERS() }); setMessage({ type: 'success', text: res.data.message }); fetchAll(); setConfirmDeleteSource(null); }
    catch { setMessage({ type: 'error', text: 'Gagal menghapus' }); }
  };

  const [confirmDeleteEntry, setConfirmDeleteEntry] = useState(null);

  const handleDeleteEntry = async (id) => {
    try { await axios.delete(`/api/knowledge/${id}`, { headers: API_HEADERS() }); setEntries(entries.filter(e => e.id !== id)); setConfirmDeleteEntry(null); }
    catch { console.error('Delete failed'); }
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!fileToUpload) return;
    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('category', 'Document');
    
    try {
      const res = await axios.post('/api/knowledge/upload-file', formData, {
        headers: {
          ...API_HEADERS(),
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage({ type: 'success', text: res.data.message });
      setFileToUpload(null);
      fetchAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Upload failed' });
    }
    setUploading(false);
  };

  const breakdown = stats?.source_breakdown || {};

  const sourceBadge = (source) => {
    const map = {
      company: { bg: 'rgba(59,130,246,0.1)', color: '#60a5fa', icon: Building2 },
      onedrive: { bg: 'rgba(14,165,233,0.08)', color: 'var(--neon-cyan)', icon: CloudDownload },
      manual: { bg: 'rgba(245,158,11,0.08)', color: '#fbbf24', icon: PenLine },
    };
    const s = map[source] || map.manual;
    const Icon = s.icon;
    return <span className="badge" style={{ background: s.bg, color: s.color }}><Icon size={10} /> {source}</span>;
  };

  return (
    <div className="page-content page-content--wide animate-fade-in">
      <div className="section-header">
        <div className="section-header__eyebrow"><div className="section-header__dot" /><span className="section-header__tag">Admin</span></div>
        <h1 className="section-header__title"><span className="text-gradient">Knowledge</span> <span style={{ color: 'var(--text-primary)' }}>Manager</span></h1>
        <p className="section-header__subtitle">Kelola knowledge base — Company, OneDrive SOP, dan Manual entries.</p>
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

      <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        <div className="stat-card" style={{ '--card-color': 'var(--neon-cyan)', padding: '20px' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>Total</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', fontFamily: 'var(--font-display)', color: 'var(--neon-cyan)' }}>{stats?.total_entries || 0}</div>
        </div>
        <div className="stat-card" style={{ '--card-color': '#3d7eff', padding: '20px' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Building2 size={10} /> Company</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', fontFamily: 'var(--font-display)', color: '#3d7eff' }}>{breakdown.company || 0}</div>
        </div>
        <div className="stat-card" style={{ '--card-color': 'var(--neon-cyan)', padding: '20px' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><CloudDownload size={10} /> OneDrive</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', fontFamily: 'var(--font-display)', color: 'var(--neon-cyan)' }}>{breakdown.onedrive || 0}</div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '2px' }}>{stats?.onedrive_documents || 0} dokumen</div>
        </div>
        <div className="stat-card" style={{ '--card-color': '#fbbf24', padding: '20px' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><PenLine size={10} /> Manual</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', fontFamily: 'var(--font-display)', color: '#fbbf24' }}>{breakdown.manual || 0}</div>
        </div>
      </div>

      <div className="glass-panel--strong" style={{ padding: '24px', borderRadius: 'var(--radius-xl)', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: '600', fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FolderSync size={15} color="var(--neon-cyan)" /> Sumber Knowledge
        </h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn-primary" onClick={handleSeedCompany} disabled={seeding}>
            {seeding ? <Loader2 size={15} className="animate-spin" /> : <Building2 size={15} />}
            {seeding ? 'Seeding...' : 'Seed Company Knowledge'}
          </button>
          <button className="btn-primary btn-primary--green" onClick={handleSyncOneDrive} disabled={syncing || syncStatus?.is_running}>
            {(syncing || syncStatus?.is_running) ? <Loader2 size={15} className="animate-spin" /> : <FolderSync size={15} />}
            {syncStatus?.is_running ? 'Syncing...' : 'Sync OneDrive SOP'}
          </button>
          <button className="btn-ghost" onClick={fetchAll}><RefreshCw size={14} /> Refresh</button>
        </div>
        {syncStatus?.last_run_at && (
          <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Last sync: {new Date(syncStatus.last_run_at).toLocaleString('id-ID')}
            {syncStatus.last_result && (
              <span> — {syncStatus.last_result.files_synced || 0} files, {syncStatus.last_result.chunks_created || 0} chunks</span>
            )}
          </div>
        )}
        {syncStatus && !syncStatus.onedrive_configured && (
          <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--warning)' }}>
            OneDrive not configured. Set MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET in .env
          </div>
        )}
        
        {/* Upload File Section */}
        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '12px' }}>Upload Dokumen (PDF, DOCX, TXT)</h3>
            <form onSubmit={handleUploadFile} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input 
                    type="file" 
                    onChange={e => setFileToUpload(e.target.files[0])}
                    accept=".pdf,.docx,.doc,.txt,.xlsx,.xls,.pptx,.ppt"
                    className="form-input"
                    style={{ flex: 1, padding: '8px' }}
                />
                <button type="submit" disabled={!fileToUpload || uploading} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
                    {uploading ? <Loader2 size={15} className="animate-spin" /> : 'Upload & Parse'}
                </button>
            </form>
        </div>
      </div>

      <div className="glass-panel--strong" style={{ padding: '24px', borderRadius: 'var(--radius-xl)' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('entries')}
            style={{
              padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '0.82rem', fontWeight: 600, fontFamily: 'var(--font-body)',
              background: activeTab === 'entries' ? 'rgba(14,165,233,0.08)' : 'transparent',
              color: activeTab === 'entries' ? 'var(--neon-cyan)' : 'var(--text-muted)',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <FileText size={14} /> Knowledge Entries {sourceFilter && `— ${sourceFilter}`}
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            style={{
              padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '0.82rem', fontWeight: 600, fontFamily: 'var(--font-body)',
              background: activeTab === 'drafts' ? 'rgba(245,158,11,0.08)' : 'transparent',
              color: activeTab === 'drafts' ? 'var(--warning)' : 'var(--text-muted)',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '6px', position: 'relative',
            }}
          >
            <BrainCircuit size={14} /> Pending Review
            {draftsTotal > 0 && (
              <span style={{
                background: 'var(--warning)', color: '#000', borderRadius: '10px',
                padding: '1px 7px', fontSize: '0.65rem', fontWeight: 700, lineHeight: 1.5,
              }}>{draftsTotal}</span>
            )}
          </button>
        </div>

        {activeTab === 'drafts' ? (
          // ── Drafts Panel ──
          loadingDrafts ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="animate-spin" style={{ marginBottom: '8px' }} /> Memuat drafts...
            </div>
          ) : drafts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p>Tidak ada entri yang menunggu review. 🎉</p>
              <p style={{ fontSize: '0.78rem', marginTop: '8px', opacity: 0.6 }}>Auto-learned entries akan muncul di sini sebelum ditambahkan ke Knowledge Base.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <Clock size={12} style={{ display: 'inline', marginBottom: '-1px', marginRight: '4px' }} />
                {drafts.length} entri menunggu review sebelum masuk ke Knowledge Base aktif.
              </p>
              {drafts.map((draft, idx) => (
                <div key={draft.id} style={{
                  padding: '18px', borderRadius: '12px',
                  background: 'rgba(245,158,11,0.02)',
                  border: '1px solid rgba(245,158,11,0.1)',
                  borderLeft: '4px solid var(--warning)',
                  animation: `fadeInUp 0.4s var(--ease-out-expo) ${idx * 0.04}s forwards`,
                  opacity: 0,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span className="badge" style={{ background: 'rgba(245,158,11,0.08)', color: 'var(--warning)' }}>
                          <BrainCircuit size={9} /> Auto-Learned
                        </span>
                        {draft.category && <span className="badge">{draft.category}</span>}
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {draft.confidence_score ? `Confidence: ${Math.round(draft.confidence_score * 100)}%` : ''}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-primary)' }}>
                        {draft.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5,
                        overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {draft.content}
                      </div>
                      {draft.created_at && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                          {new Date(draft.created_at).toLocaleString('id-ID')}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleApproveDraft(draft.id)}
                        disabled={!!actionLoading[draft.id]}
                        style={{
                          padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                          background: 'rgba(16,185,129,0.08)', color: 'var(--success)',
                          fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
                          transition: 'all 0.2s',
                        }}
                        title="Approve: tambahkan ke Knowledge Base aktif"
                      >
                        {actionLoading[draft.id] === 'approve'
                          ? <Loader2 size={12} className="animate-spin" />
                          : <ThumbsUp size={12} />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectDraft(draft.id)}
                        disabled={!!actionLoading[draft.id]}
                        style={{
                          padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                          background: 'rgba(225,29,72,0.06)', color: 'var(--danger)',
                          fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
                          transition: 'all 0.2s',
                        }}
                        title="Reject: hapus draft ini"
                      >
                        {actionLoading[draft.id] === 'reject'
                          ? <Loader2 size={12} className="animate-spin" />
                          : <ThumbsDown size={12} />}
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // ── Entries Panel ──
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: '600', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={14} color="var(--neon-cyan)" /> Knowledge Entries {entries.length > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>({entries.length})</span>}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '6px', fontSize: '0.6rem', alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}><Building2 size={9} /> Company</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(14,165,233,0.08)', color: 'var(--neon-cyan)' }}><CloudDownload size={9} /> OneDrive</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(245,158,11,0.08)', color: '#fbbf24' }}><PenLine size={9} /> Manual</span>
            </div>
            <div className="filter-toggle">
              {[['', 'All'], ['company', 'Company'], ['onedrive', 'OneDrive'], ['manual', 'Manual']].map(([f, label]) => (
                <button key={f} className={`filter-toggle__btn ${sourceFilter === f ? 'filter-toggle__btn--active' : ''}`}
                  onClick={() => setSourceFilter(f)}>{label}</button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            <Loader2 size={24} className="animate-spin" style={{ marginBottom: '8px' }} /> Memuat...
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            <FileText size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p>Belum ada entries{sourceFilter ? ` untuk "${sourceFilter}"` : ''}.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {entries.map((entry, idx) => (
              <div key={entry.id} style={{
                padding: '16px', borderRadius: '12px',
                background: 'rgba(14,165,233,0.015)', border: '1px solid var(--border)',
                transition: 'all 0.3s',
                animation: `fadeInUp 0.5s var(--ease-out-expo) ${Math.min(idx * 0.015, 0.2)}s forwards`,
                opacity: 0,
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(14,165,233,0.12)'; e.currentTarget.style.background = 'rgba(14,165,233,0.02)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'rgba(14,165,233,0.015)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      {sourceBadge(entry.source)}
                      {entry.category && <span className="badge" style={{ background: 'rgba(14,165,233,0.04)', color: 'var(--text-muted)' }}>{entry.category}</span>}
                      {entry.department && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{entry.department}</span>}
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '4px' }}>{entry.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {entry.content}
                    </div>
                    {entry.source_file_name && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '6px', opacity: 0.7 }}>
                        {entry.source_file_name}
                        {entry.source_url && (
                          <a href={entry.source_url} target="_blank" rel="noreferrer" style={{ marginLeft: '8px', color: 'var(--neon-cyan)' }}>Open ↗</a>
                        )}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setConfirmDeleteEntry(entry)} title="Hapus"
                    style={{ flexShrink: 0, padding: '6px', borderRadius: '8px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(225,29,72,0.08)'; }}
                    onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {sourceFilter && entries.length > 0 && activeTab === 'entries' && (
          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <button className="btn-danger" onClick={() => setConfirmDeleteSource(sourceFilter)}>
              <Trash2 size={14} /> Hapus "{sourceFilter}" ({entries.length})
            </button>
          </div>
        )}
          </>
        )}
      </div>
      {/* Delete Entry Confirmation Modal */}
      {confirmDeleteEntry && (
        <div className="menu-overlay menu-overlay--open" style={{ padding: 0, justifyContent: 'center', alignItems: 'center', background: 'rgba(10,15,30,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={() => setConfirmDeleteEntry(null)}>
          <div className="glass-panel animate-fade-in-up" style={{ maxWidth: '420px', width: '90%', padding: '32px', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <Trash2 size={48} color="var(--danger)" style={{ margin: '0 auto 16px', opacity: 0.7 }} />
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Hapus Entry?</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
              "{confirmDeleteEntry.title}" akan dihapus permanen dari Knowledge Base.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirmDeleteEntry(null)}>Batal</button>
              <button className="btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleDeleteEntry(confirmDeleteEntry.id)}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Source Confirmation Modal */}
      {confirmDeleteSource && (
        <div className="menu-overlay menu-overlay--open" style={{ padding: 0, justifyContent: 'center', alignItems: 'center', background: 'rgba(10,15,30,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={() => setConfirmDeleteSource(null)}>
          <div className="glass-panel animate-fade-in-up" style={{ maxWidth: '420px', width: '90%', padding: '32px', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <AlertCircle size={48} color="var(--danger)" style={{ margin: '0 auto 16px', opacity: 0.7 }} />
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Hapus SEMUA dari "{confirmDeleteSource}"?</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
              {entries.length} entri dari sumber "{confirmDeleteSource}" akan dihapus permanen.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirmDeleteSource(null)}>Batal</button>
              <button className="btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleDeleteBySource(confirmDeleteSource)}>Hapus Semua</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeManager;
