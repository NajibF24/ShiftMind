import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Users, Search, Trophy, Crown, Award, Star, BookOpen,
  GitBranch, Database, ThumbsUp, Zap, Loader2, Brain,
  TrendingUp, BarChart3, AlertCircle, Sparkles
} from 'lucide-react';

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const ExpertFinder = () => {
  const [tab, setTab] = useState('experts'); // experts | leaderboard | analytics
  const [experts, setExperts] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [searchTopic, setSearchTopic] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchExperts(); fetchLeaderboard(); }, []);

  const fetchExperts = async (topic) => {
    setLoading(true);
    try {
      const params = topic ? `?topic=${encodeURIComponent(topic)}` : '';
      const r = await axios.get(`/api/experts${params}`, { headers: headers() });
      setExperts(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchLeaderboard = async () => {
    try {
      const r = await axios.get('/api/experts/leaderboard', { headers: headers() });
      setLeaderboard(r.data);
    } catch (e) { console.error(e); }
  };

  const fetchAnalytics = async () => {
    try {
      const [gaps, trends, insight] = await Promise.all([
        axios.get('/api/analytics/knowledge-gaps?days=30', { headers: headers() }),
        axios.get('/api/analytics/query-trends?days=30', { headers: headers() }),
        axios.get('/api/analytics/ai-insight?days=7', { headers: headers() }),
      ]);
      setAnalytics({ gaps: gaps.data, trends: trends.data });
      setAiInsight(insight.data);
    } catch (e) { console.error(e); }
  };

  const badgeIcon = (badge) => {
    if (badge === 'Knowledge Master') return <Crown size={14} />;
    if (badge === 'Expert Contributor') return <Award size={14} />;
    if (badge === 'Active Learner') return <Star size={14} />;
    return <Zap size={14} />;
  };

  return (
    <div className="page-content animate-fade-in">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '32px' }}>
        <div className="section-header__eyebrow">
          <div className="section-header__dot" />
          <span className="section-header__tag">Intelligence Network</span>
        </div>
        <h1 className="section-header__title">
          <span className="text-gradient">Expert</span>
          <br />
          <span style={{ color: 'var(--text-primary)' }}>Finder</span>
        </h1>
        <p className="section-header__subtitle">
          Temukan siapa expert di topik tertentu. AI menganalisis dari journal, workflow, dan kontribusi knowledge.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
        {[
          { key: 'experts', label: 'Find Expert', icon: Brain },
          { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
          { key: 'analytics', label: 'Knowledge Analytics', icon: BarChart3 },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setTab(key); if (key === 'analytics' && !analytics) fetchAnalytics(); }}
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

      {/* TAB: Find Expert */}
      {tab === 'experts' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                value={searchTopic} onChange={e => setSearchTopic(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') fetchExperts(searchTopic); }}
                placeholder='Cari expert berdasarkan topik (contoh: "electrode", "quality", "rolling mill")'
                className="form-input" style={{ paddingLeft: '40px' }}
              />
            </div>
            <button onClick={() => fetchExperts(searchTopic)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Search size={14} /> Search
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            </div>
          ) : experts && experts.experts.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
              <Search size={40} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.4 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '8px' }}>Tidak ada expert ditemukan{searchTopic ? ` untuk topik "${searchTopic}"` : ''}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Coba gunakan kata kunci lain, atau cari berdasarkan area kerja seperti "EAF", "Rolling Mill", "QC Lab".</p>
            </div>
          ) : experts && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {experts.experts.map((exp, idx) => (
                <div key={exp.user_id} className="glass-panel glass-panel--interactive animate-fade-in-up"
                  style={{ padding: '20px', animationDelay: `${idx * 0.05}s` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                      background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(124,58,237,0.1))',
                      border: '1px solid rgba(14,165,233,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem', fontWeight: '700', color: 'var(--neon-cyan)', fontFamily: 'var(--font-display)',
                    }}>
                      #{idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
                        {exp.display_name}
                      </h3>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {exp.expertise_areas.map((area, i) => (
                          <span key={i} className="badge badge--cyan" style={{ fontSize: '0.6rem' }}>{area}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--neon-cyan)', fontFamily: 'var(--font-display)' }}>
                        {exp.score}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>expertise score</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                    {[
                      { icon: BookOpen, label: 'Journals', value: exp.journal_entries, color: 'var(--neon-cyan)' },
                      { icon: GitBranch, label: 'Workflows', value: exp.workflows, color: 'var(--neon-green)' },
                      { icon: Database, label: 'Knowledge', value: exp.knowledge_entries, color: 'var(--neon-purple)' },
                      { icon: ThumbsUp, label: 'Helpful', value: exp.helpful_votes, color: 'var(--warning)' },
                    ].map(({ icon: Icon, label, value, color }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Icon size={13} color={color} /> {value} {label}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Leaderboard */}
      {tab === 'leaderboard' && (
        <div className="animate-fade-in">
          {leaderboard && leaderboard.leaderboard.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {leaderboard.leaderboard.map((user, idx) => (
                <div key={user.user_id} className="glass-panel glass-panel--interactive animate-fade-in-up"
                  style={{
                    padding: '16px 20px', animationDelay: `${idx * 0.04}s`,
                    borderLeft: idx < 3 ? `4px solid ${idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : '#CD7F32'}` : undefined,
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      background: idx === 0 ? 'rgba(255,215,0,0.1)' : idx === 1 ? 'rgba(192,192,192,0.1)' : idx === 2 ? 'rgba(205,127,50,0.1)' : 'rgba(14,165,233,0.02)',
                      border: `1px solid ${idx === 0 ? 'rgba(255,215,0,0.3)' : idx === 1 ? 'rgba(192,192,192,0.3)' : idx === 2 ? 'rgba(205,127,50,0.3)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.85rem', fontWeight: '700', fontFamily: 'var(--font-display)',
                      color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'var(--text-muted)',
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '0.92rem', color: 'var(--text-primary)' }}>{user.display_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '2px 8px', borderRadius: '8px', fontSize: '0.6rem',
                          background: `${user.badge_color}15`,
                          color: user.badge_color,
                          border: `1px solid ${user.badge_color}30`,
                        }}>
                          {badgeIcon(user.badge)} {user.badge}
                        </span>
                      </div>
                    </div>
                    <div className="lb-stats" style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }} className="lb-stat">
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '2px' }}>J</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--neon-cyan)' }}>{user.journals}</div>
                      </div>
                      <div style={{ textAlign: 'center' }} className="lb-stat">
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '2px' }}>W</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--neon-green)' }}>{user.workflows}</div>
                      </div>
                      <div style={{ textAlign: 'center' }} className="lb-stat">
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '2px' }}>K</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--neon-purple)' }}>{user.knowledge}</div>
                      </div>
                      <div style={{
                        fontSize: '1.3rem', fontWeight: '700', fontFamily: 'var(--font-display)',
                        color: idx === 0 ? '#FFD700' : 'var(--neon-cyan)',
                        minWidth: '50px', textAlign: 'right',
                      }}>
                        {user.score}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
              <Trophy size={40} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
              <p style={{ color: 'var(--text-muted)' }}>Belum ada data leaderboard.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB: Knowledge Analytics */}
      {tab === 'analytics' && (
        <div className="animate-fade-in">
          {!analytics ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              Loading analytics...
            </div>
          ) : (
            <>
              {/* AI Insight */}
              {aiInsight?.insight && (
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px', borderLeft: '4px solid var(--neon-purple)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <Sparkles size={16} color="var(--neon-purple)" />
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '600', fontFamily: 'var(--font-display)' }}>AI Knowledge Insight</h3>
                    <span className="badge badge--purple" style={{ fontSize: '0.6rem' }}>{aiInsight.total_queries_analyzed} queries analyzed</span>
                  </div>
                  <div className="markdown-body" style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiInsight.insight}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Query Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Total Queries (30d)', value: analytics.trends.total_queries, color: 'var(--neon-cyan)', icon: Zap },
                  { label: 'Avg Daily', value: analytics.trends.avg_daily, color: 'var(--neon-blue)', icon: TrendingUp },
                  { label: 'Knowledge Gaps', value: analytics.gaps.total_gaps, color: 'var(--danger)', icon: AlertCircle },
                  { label: 'Partial Coverage', value: analytics.gaps.total_partial, color: 'var(--warning)', icon: AlertCircle },
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

              {/* Knowledge Gaps Table */}
              {analytics.gaps.gaps.length > 0 && (
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '16px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={15} color="var(--danger)" /> Knowledge Gaps
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Topic</th>
                          <th style={{ textAlign: 'center', padding: '10px 12px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.72rem' }}>Queries</th>
                          <th style={{ textAlign: 'center', padding: '10px 12px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.72rem' }}>KB Entries</th>
                          <th style={{ textAlign: 'center', padding: '10px 12px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.72rem' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.gaps.gaps.slice(0, 15).map((gap, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(14,165,233,0.02)' }}>
                            <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: '500' }}>{gap.topic}</td>
                            <td style={{ textAlign: 'center', padding: '10px 12px', color: 'var(--neon-cyan)', fontWeight: '600' }}>{gap.query_count}</td>
                            <td style={{ textAlign: 'center', padding: '10px 12px', color: 'var(--text-secondary)' }}>{gap.knowledge_entries}</td>
                            <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                              <span className={`badge ${gap.status === 'gap' ? '' : gap.status === 'partial' ? '' : 'badge--green'}`}
                                style={{
                                  fontSize: '0.6rem',
                                  background: gap.status === 'gap' ? 'rgba(225,29,72,0.08)' : gap.status === 'partial' ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                                  color: gap.status === 'gap' ? 'var(--danger)' : gap.status === 'partial' ? 'var(--warning)' : 'var(--neon-green)',
                                  border: `1px solid ${gap.status === 'gap' ? 'rgba(225,29,72,0.2)' : gap.status === 'partial' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`,
                                }}>
                                {gap.status === 'gap' ? 'GAP' : gap.status === 'partial' ? 'PARTIAL' : 'COVERED'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Query Trend */}
              {analytics.trends.daily_trend.length > 0 && (
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '16px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={15} color="var(--neon-cyan)" /> Daily Query Volume
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px' }}>
                    {analytics.trends.daily_trend.map((d, i) => {
                      const maxCount = Math.max(...analytics.trends.daily_trend.map(x => x.count));
                      const height = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.6rem', color: 'var(--neon-cyan)', fontWeight: '600' }}>{d.count}</span>
                          <div style={{
                            width: '100%', maxWidth: '30px', height: `${Math.max(height, 4)}%`,
                            background: 'linear-gradient(to top, rgba(14,165,233,0.2), var(--neon-cyan))',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.5s var(--ease-out-expo)',
                          }} />
                          <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                            {d.date.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      <style>{`
        @media (max-width: 600px) {
          .lb-stat { display: none !important; }
          .lb-stats { gap: 8px !important; }
        }
      `}</style>
    </div>
  );
};

export default ExpertFinder;
