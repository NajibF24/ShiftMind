import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpen, Plus, Sparkles, Brain, TrendingUp, Calendar,
  Tag, AlertTriangle, CheckCircle, Zap, ChevronRight,
  ThumbsUp, Loader2, Mic, MicOff, Search, Eye
} from 'lucide-react';

const API = '/api/journal';
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const AREAS = ['EAF (Electric Arc Furnace)', 'Rolling Mill', 'QC Lab', 'Warehouse', 'Maintenance', 'Utility', 'Continuous Casting', 'IT', 'HR', 'Other'];

const WorkJournal = () => {
  const [journals, setJournals] = useState([]);
  const [stats, setStats] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [digest, setDigest] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [tab, setTab] = useState('timeline'); // timeline | my-stats | digest

  // Voice input
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // Form
  const [form, setForm] = useState({
    title: '', content: '', department: '', area: '', is_public: 1
  });

  useEffect(() => { fetchJournals(); fetchStats(); fetchSuggestion(); }, []);

  const fetchJournals = async (searchQuery, areaFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery || search) params.append('search', searchQuery || search);
      if (areaFilter || filterArea) params.append('area', areaFilter || filterArea);
      const r = await axios.get(`${API}?${params}`, { headers: headers() });
      setJournals(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const r = await axios.get(`${API}/my-stats`, { headers: headers() });
      setStats(r.data);
    } catch (e) { console.error(e); }
  };

  const fetchSuggestion = async () => {
    try {
      const r = await axios.get(`${API}/suggest-task`, { headers: headers() });
      setSuggestion(r.data);
    } catch (e) { console.error(e); }
  };

  const fetchDigest = async () => {
    try {
      const r = await axios.get(`${API}/ai-digest?days=7`, { headers: headers() });
      setDigest(r.data);
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSubmitting(true);
    try {
      await axios.post(API, form, { headers: headers() });
      setForm({ title: '', content: '', department: '', area: '', is_public: 1 });
      setShowForm(false);
      fetchJournals();
      fetchStats();
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message));
    }
    setSubmitting(false);
  };

  const handleHelpful = async (id) => {
    try {
      await axios.post(`${API}/${id}/helpful`, {}, { headers: headers() });
      fetchJournals();
    } catch (e) { console.error(e); }
  };

  // Voice input
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Browser tidak mendukung voice input. Gunakan Chrome.');
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'id-ID';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setForm(prev => ({ ...prev, content: transcript }));
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const difficultyColor = (d) => {
    if (d === 'critical') return 'var(--danger)';
    if (d === 'troubleshooting') return 'var(--warning)';
    return 'var(--neon-green)';
  };

  const difficultyIcon = (d) => {
    if (d === 'critical') return <AlertTriangle size={12} />;
    if (d === 'troubleshooting') return <Zap size={12} />;
    return <CheckCircle size={12} />;
  };

  return (
    <div className="page-content animate-fade-in">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '32px' }}>
        <div className="section-header__eyebrow">
          <div className="section-header__dot" />
          <span className="section-header__tag">Tacit Knowledge Capture</span>
        </div>
        <h1 className="section-header__title">
          <span className="text-gradient">Work</span>
          <br />
          <span style={{ color: 'var(--text-primary)' }}>Journal</span>
        </h1>
        <p className="section-header__subtitle">
          Catat pekerjaan harian Anda. AI akan menganalisis, mengkategorikan, dan mengekstrak <strong style={{ color: 'var(--neon-cyan)' }}>tacit knowledge</strong> yang tidak ada di Google.
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={15} /> Catat Aktivitas
          </button>
          <button onClick={() => { setTab('digest'); fetchDigest(); }} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={15} /> AI Weekly Digest
          </button>
        </div>
      </div>

      {/* AI Task Suggestion */}
      {suggestion?.suggestion && suggestion.based_on >= 3 && (
        <div className="glass-panel glass-panel--interactive animate-fade-in-up" style={{
          marginBottom: '24px', padding: '20px', borderLeft: '4px solid var(--neon-purple)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Brain size={18} color="var(--neon-purple)" />
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--neon-purple)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              AI Task Prediction — {suggestion.day}
            </span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {suggestion.suggestion}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
        {[
          { key: 'timeline', label: 'Timeline', icon: Calendar },
          { key: 'my-stats', label: 'My Stats', icon: TrendingUp },
          { key: 'digest', label: 'Team Digest', icon: Sparkles },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setTab(key); if (key === 'digest' && !digest) fetchDigest(); }}
            style={{
              padding: '10px 20px', borderRadius: '10px', border: '1px solid',
              borderColor: tab === key ? 'rgba(14,165,233,0.3)' : 'var(--border)',
              background: tab === key ? 'rgba(14,165,233,0.06)' : 'transparent',
              color: tab === key ? 'var(--neon-cyan)' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.3s var(--ease-out-expo)',
            }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* New Entry Form */}
      {showForm && (
        <div className="glass-panel animate-fade-in-up" style={{ padding: '28px', marginBottom: '24px', borderLeft: '4px solid var(--neon-cyan)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '20px', fontFamily: 'var(--font-display)' }}>
            <BookOpen size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Catat Aktivitas Kerja
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Judul aktivitas (contoh: Adjust suhu EAF karena scrap quality rendah)"
              className="form-input" required
            />
            <div style={{ position: 'relative' }}>
              <textarea
                value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                placeholder="Ceritakan detail apa yang Anda kerjakan, kenapa, dan bagaimana hasilnya. Semakin detail semakin baik — AI akan mengekstrak knowledge dari catatan ini."
                className="form-input" rows={5} required
                style={{ paddingRight: '50px' }}
              />
              <button type="button" onClick={toggleVoice}
                style={{
                  position: 'absolute', top: '10px', right: '10px',
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: isRecording ? 'rgba(225,29,72,0.15)' : 'rgba(14,165,233,0.06)',
                  border: `1px solid ${isRecording ? 'rgba(225,29,72,0.3)' : 'rgba(14,165,233,0.15)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                }}>
                {isRecording ? <MicOff size={16} color="var(--danger)" /> : <Mic size={16} color="var(--neon-cyan)" />}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} className="form-input">
                <option value="">Pilih Area</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                placeholder="Department" className="form-input" />
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_public === 1}
                  onChange={e => setForm({ ...form, is_public: e.target.checked ? 1 : 0 })} />
                <Eye size={13} /> Visible to team
              </label>
              <div style={{ flex: 1 }} />
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {submitting ? 'AI Processing...' : 'Save & Analyze'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB: Timeline */}
      {tab === 'timeline' && (
        <>
          {/* Search & Filter */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') fetchJournals(search, filterArea); }}
                placeholder="Semantic search: cari berdasarkan makna, bukan kata..."
                className="form-input" style={{ paddingLeft: '40px' }}
              />
            </div>
            <select value={filterArea} onChange={e => { setFilterArea(e.target.value); fetchJournals(search, e.target.value); }} className="form-input" style={{ width: '200px' }}>
              <option value="">All Areas</option>
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Journal List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              Loading...
            </div>
          ) : journals.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
              <BookOpen size={40} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Belum ada journal entry. Mulai catat aktivitas kerja Anda!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {journals.map((j, idx) => (
                <div key={j.id} className="glass-panel glass-panel--interactive animate-fade-in-up"
                  style={{ padding: '20px', cursor: 'pointer', animationDelay: `${idx * 0.05}s` }}
                  onClick={() => setShowDetail(showDetail === j.id ? null : j.id)}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                          {new Date(j.created_at).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        {j.category && (
                          <span className="badge badge--cyan" style={{ fontSize: '0.6rem' }}>{j.category}</span>
                        )}
                        {j.difficulty && (
                          <span className="badge" style={{
                            fontSize: '0.6rem',
                            background: `${difficultyColor(j.difficulty)}15`,
                            color: difficultyColor(j.difficulty),
                            border: `1px solid ${difficultyColor(j.difficulty)}30`,
                            display: 'flex', alignItems: 'center', gap: '4px',
                          }}>
                            {difficultyIcon(j.difficulty)} {j.difficulty}
                          </span>
                        )}
                        {j.author_name && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>by {j.author_name}</span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>{j.title}</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        {j.ai_summary || j.content.substring(0, 150) + (j.content.length > 150 ? '...' : '')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleHelpful(j.id); }}
                        style={{
                          background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)',
                          borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--neon-cyan)', fontSize: '0.7rem',
                        }}>
                        <ThumbsUp size={12} /> {j.helpful_count || 0}
                      </button>
                      <ChevronRight size={14} color="var(--text-muted)" style={{ transform: showDetail === j.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>
                  </div>

                  {/* Tags */}
                  {j.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {j.tags.map((tag, i) => (
                        <span key={i} style={{
                          padding: '2px 10px', borderRadius: '10px', fontSize: '0.65rem',
                          background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)',
                          color: 'var(--neon-purple)',
                        }}>
                          <Tag size={9} style={{ marginRight: '3px', verticalAlign: 'middle' }} />{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expanded Detail */}
                  {showDetail === j.id && (
                    <div className="animate-fade-in" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Entry</div>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{j.content}</p>
                      </div>
                      {j.ai_lessons_learned && (
                        <div style={{ marginBottom: '14px', padding: '14px', borderRadius: '10px', background: 'rgba(14,165,233,0.03)', border: '1px solid rgba(14,165,233,0.1)' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--neon-cyan)', fontWeight: '600', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Brain size={13} /> AI Lessons Learned
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{j.ai_lessons_learned}</p>
                        </div>
                      )}
                      {j.ai_related_sops && (
                        <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(124,58,237,0.03)', border: '1px solid rgba(124,58,237,0.1)' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--neon-purple)', fontWeight: '600', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <BookOpen size={13} /> Related SOPs
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{j.ai_related_sops}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB: My Stats */}
      {tab === 'my-stats' && stats && (
        <div className="animate-fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Total Entries', value: stats.total_entries, color: 'var(--neon-cyan)', icon: BookOpen },
              { label: 'Streak (days)', value: stats.streak_days, color: 'var(--neon-green)', icon: TrendingUp },
              { label: 'Troubleshooting', value: stats.recent_difficulty?.troubleshooting || 0, color: 'var(--warning)', icon: Zap },
              { label: 'Critical', value: stats.recent_difficulty?.critical || 0, color: 'var(--danger)', icon: AlertTriangle },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="stat-card" style={{ '--card-color': color }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Icon size={18} color={color} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color, fontFamily: 'var(--font-display)' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Category Breakdown */}
          {Object.keys(stats.categories || {}).length > 0 && (
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '16px', fontFamily: 'var(--font-display)' }}>Category Breakdown</h3>
              {Object.entries(stats.categories).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                const pct = stats.total_entries > 0 ? Math.round((count / stats.total_entries) * 100) : 0;
                return (
                  <div key={cat} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{cat}</span>
                      <span style={{ color: 'var(--neon-cyan)', fontWeight: '600' }}>{count} ({pct}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar__fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, rgba(14,165,233,0.4), var(--neon-cyan))' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Top Tags */}
          {stats.top_tags?.length > 0 && (
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '16px', fontFamily: 'var(--font-display)' }}>Top Tags</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {stats.top_tags.map(({ tag, count }) => (
                  <span key={tag} style={{
                    padding: '6px 14px', borderRadius: '16px', fontSize: '0.78rem',
                    background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)',
                    color: 'var(--neon-purple)',
                  }}>
                    {tag} <strong>({count})</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Work Profile */}
          {stats.ai_work_profile && (
            <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--neon-purple)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <Brain size={18} color="var(--neon-purple)" />
                <h3 style={{ fontSize: '0.9rem', fontWeight: '600', fontFamily: 'var(--font-display)' }}>AI Work Profile</h3>
              </div>
              <div className="markdown-body" style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{stats.ai_work_profile}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: Team Digest */}
      {tab === 'digest' && (
        <div className="animate-fade-in">
          {digest ? (
            <div className="glass-panel" style={{ padding: '28px', borderLeft: '4px solid var(--neon-cyan)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Sparkles size={18} color="var(--neon-cyan)" />
                <h3 style={{ fontSize: '1rem', fontWeight: '600', fontFamily: 'var(--font-display)' }}>AI Weekly Digest</h3>
                <span className="badge badge--cyan" style={{ fontSize: '0.6rem' }}>{digest.total_entries} entries from {digest.contributors} contributors</span>
              </div>
              <div className="markdown-body" style={{ fontSize: '0.9rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{digest.digest}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              Generating AI digest...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkJournal;
