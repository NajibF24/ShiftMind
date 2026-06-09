import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, BrainCircuit, User, Loader2, Sparkles, Trash2, Zap, MessageSquare, TrendingUp, Globe, Newspaper, Mic, MicOff, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ASK_AI = 'Ask ShiftMind';

const NEWS_KEYWORDS = ['news', 'berita', 'hari ini', 'market', 'steel', 'hrc', 'kurs', 'usd', 'harga', 'latest', 'update', 'signal', 'market intelligence', 'steel signal', 'gys steel signal'];

const MAX_HISTORY_MESSAGES = 100;

const AskAI = () => {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('askAI_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [newsData, setNewsData] = useState([]);
  const [marketData, setMarketData] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    axios.get('/static/latest_news.json')
      .then(r => { setNewsData(r.data.news || []); setMarketData(r.data.market || null); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Persist to localStorage with max cap
    const toSave = messages.length > MAX_HISTORY_MESSAGES
      ? messages.slice(-MAX_HISTORY_MESSAGES)
      : messages;
    try {
      localStorage.setItem('askAI_history', JSON.stringify(toSave));
    } catch { /* storage full — silently fail */ }
  }, [messages]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (loading) {
      setLoadingTimeout(false);
      const t = setTimeout(() => setLoadingTimeout(true), 30000);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const isNewsQuery = (q) => {
    const lower = q.toLowerCase();
    return NEWS_KEYWORDS.some(k => lower.includes(k));
  };

  const formatNewsResponse = () => {
    if (!newsData.length && !marketData) return null;
    let md = '## 📡 GYS Steel Signal\n\n';
    if (marketData) {
      md += '### Market Movement\n';
      md += `| Indikator | Nilai |\n|---|---|\n`;
      if (marketData.usd_idr) md += `| USD/IDR | Rp ${marketData.usd_idr.toLocaleString('id-ID', { minimumFractionDigits: 2 })} |\n`;
      if (marketData.steel_hrc) md += `| HRC Steel | $ ${marketData.steel_hrc.toLocaleString('en-US', { minimumFractionDigits: 2 })} / short ton |\n`;
      md += '\n';
    }
    if (newsData.length > 0) {
      md += '### Latest News\n';
      newsData.slice(0, 5).forEach((n, i) => {
        md += `${i + 1}. **${n.title}** — ${n.date || ''}\n`;
      });
    }
    md += '\n---\n*Ada pertanyaan lain tentang market atau SOP GYS?*';
    return md;
  };

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;

    if (isNewsQuery(q) && (newsData.length || marketData)) {
      const newsResponse = formatNewsResponse();
      if (newsResponse) {
        setMessages(prev => [...prev, { role: 'user', content: q }]);
        setInput('');
        setMessages(prev => [...prev, { role: 'assistant', content: newsResponse, sources: [] }]);
        return;
      }
    }

    const userMsg = { role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      let enhancedQuery = q;
      if (isNewsQuery(q)) {
        const ctx = [];
        if (marketData) ctx.push(`USD/IDR: ${marketData.usd_idr}, HRC Steel: ${marketData.steel_hrc}`);
        if (newsData.length) ctx.push(`Berita terbaru: ${newsData.slice(0, 3).map(n => n.title).join('; ')}`);
        if (ctx.length) enhancedQuery = `${q}\n\n[KONTEKS MARKET: ${ctx.join(' | ')}]`;
      }
      const res = await axios.post('/api/ask', { query: enhancedQuery }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        timeout: 120000,
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.answer, sources: res.data.sources || [] }]);
    } catch (err) {
      let errorMsg = 'Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi.';
      if (err.code === 'ECONNABORTED') errorMsg = 'Waktu tunggu habis. Silakan coba lagi.';
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg, error: true }]);
    }
    setLoading(false);
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('askAI_history');
    setLoading(false);
  };

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
      setInput(transcript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const isEmpty = messages.length === 0;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100vh', position: 'relative', zIndex: 2,
    }}>
        {isEmpty && (
          <div className="page-center animate-fade-in" style={{ flex: 1 }}>
            <div style={{ textAlign: 'center', maxWidth: '520px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '20px', margin: '0 auto 28px',
                background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(59,130,246,0.04))',
                border: '1px solid rgba(14,165,233,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 60px rgba(14,165,233,0.08)',
                animation: 'float 3s ease-in-out infinite',
              }}>
                <Sparkles size={32} color="var(--neon-cyan)" />
              </div>
              <h1 style={{
                fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                fontWeight: '300', letterSpacing: '-0.03em', marginBottom: '16px', lineHeight: 1.2,
              }}>
                <span className="text-gradient">{ASK_AI}</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '24px' }}>
                Tanyakan tentang SOP, kebijakan perusahaan, produk, prosedur — atau lihat <strong style={{ color: 'var(--neon-cyan)' }}>market intelligence</strong> & <strong style={{ color: 'var(--neon-green)' }}>berita steel</strong> terkini.
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 12px', borderRadius: '12px', fontSize: '0.7rem',
                  background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.12)',
                  color: 'var(--neon-cyan)',
                }}>
                  <Globe size={11} /> Market Live
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 12px', borderRadius: '12px', fontSize: '0.7rem',
                  background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)',
                  color: 'var(--neon-green)',
                }}>
                  <Newspaper size={11} /> News
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 12px', borderRadius: '12px', fontSize: '0.7rem',
                  background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)',
                  color: 'var(--neon-purple)',
                }}>
                  <BrainCircuit size={11} /> SOP
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {[
                  { text: 'Apa berita steel hari ini?', icon: Newspaper },
                  { text: 'Bagaimana SOP pengiriman produk?', icon: Zap },
                  { text: 'Jelaskan kebijakan cuti karyawan', icon: MessageSquare },
                ].map(({ text: s, icon: Icon }, i) => (
                  <button key={i} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                    style={{
                      padding: '10px 18px', borderRadius: '20px',
                      background: 'rgba(14,165,233,0.02)', border: '1px solid var(--border)',
                      color: 'var(--text-secondary)', fontSize: '0.8rem',
                      cursor: 'pointer', fontFamily: 'var(--font-body)',
                      transition: 'all 0.3s var(--ease-out-expo)',
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(14,165,233,0.25)'; e.currentTarget.style.background = 'rgba(14,165,233,0.04)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'rgba(14,165,233,0.02)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
          </div>
        </div>
      )}

      {!isEmpty && (
        <div style={{
          flex: 1, overflowY: 'auto', padding: '100px 40px 160px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div style={{ width: '100%', maxWidth: '700px', display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button onClick={() => setShowClearConfirm(true)} className="btn-ghost" style={{ fontSize: '0.75rem', padding: '6px 14px' }}>
              <Trash2 size={12} /> Clear Chat
            </button>
          </div>
          <div style={{ width: '100%', maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {messages.map((msg, i) => (
              <div key={i} className="animate-fade-in-up" style={{
                display: 'flex', gap: '14px', alignItems: 'flex-start',
                animationDelay: `${i * 0.03}s`,
              }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: msg.role === 'user' ? 'rgba(124,58,237,0.1)' : 'rgba(14,165,233,0.08)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(124,58,237,0.2)' : 'rgba(14,165,233,0.15)'}`,
                  marginTop: '2px',
                }}>
                  {msg.role === 'user' ? <User size={15} color="var(--neon-purple)" /> : <BrainCircuit size={15} color="var(--neon-cyan)" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.65rem', fontWeight: '600', letterSpacing: '1px',
                    color: msg.role === 'user' ? 'var(--neon-purple)' : 'var(--neon-cyan)',
                    marginBottom: '6px', textTransform: 'uppercase',
                  }}>
                    {msg.role === 'user' ? 'You' : 'ShiftMind AI'}
                  </div>
                  <div className={msg.role === 'assistant' ? 'markdown-body' : ''} style={{
                    fontSize: '0.92rem', lineHeight: 1.7, color: msg.error ? 'var(--danger)' : 'var(--text-primary)',
                    ...(msg.role === 'user' ? { whiteSpace: 'pre-wrap' } : {}),
                  }}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    ) : msg.content}
                  </div>
                  {msg.sources?.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {msg.sources.map((src, j) => (
                        <span key={j} className="badge badge--cyan" style={{ fontSize: '0.65rem' }}>
                          <Zap size={10} /> {src.title || src.file_name || 'Source'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(59,130,246,0.04))',
                  border: '1px solid rgba(14,165,233,0.15)',
                }}>
                  <Loader2 size={15} color="var(--neon-cyan)" className="animate-spin" />
                </div>
                <div style={{ paddingTop: '8px' }}>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: 'var(--neon-cyan)', opacity: 0.4,
                        animation: `pulseDot 1.2s ease-in-out ${i * 0.15}s infinite`,
                      }} />
                    ))}
                    {loadingTimeout && (
                      <span style={{ marginLeft: '12px', fontSize: '0.78rem', color: 'var(--warning)' }}>
                        <AlertTriangle size={12} style={{ display: 'inline', marginBottom: '-2px', marginRight: '4px' }} />
                        AI masih berpikir... mungkin butuh waktu hingga 60 detik
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
          padding: '20px 40px 28px',
          background: 'linear-gradient(to top, var(--bg-void) 60%, transparent)',
        }}>
          <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(14,165,233,0.04), rgba(59,130,246,0.02))',
                opacity: 0, transition: 'opacity 0.3s var(--ease-out-expo)',
                pointerEvents: 'none', zIndex: 0,
              }} className="input-glow" />
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                onFocus={e => { e.target.style.borderColor = 'rgba(14,165,233,0.3)'; e.target.style.boxShadow = '0 0 24px rgba(14,165,233,0.04), inset 0 1px 0 rgba(14,165,233,0.04)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.boxShadow = 'none'; }}
                placeholder="Tanyakan sesuatu tentang GYS..."
                rows={1}
                style={{
                  width: '100%', padding: '16px 20px',
                  background: 'rgba(255, 255, 255, 0.85)', border: '1px solid var(--glass-border)',
                  borderRadius: '14px', color: 'var(--text-primary)', fontSize: '0.95rem',
                  fontFamily: 'var(--font-body)', outline: 'none', resize: 'none',
                  backdropFilter: 'blur(20px)', transition: 'all 0.3s var(--ease-out-expo)', lineHeight: 1.5,
                  position: 'relative', zIndex: 1,
                }}
              />
            </div>
            <button
              onClick={toggleVoice}
              style={{
                width: '50px', height: '50px', borderRadius: '14px', flexShrink: 0,
                background: isRecording ? 'rgba(225,29,72,0.15)' : 'rgba(14,165,233,0.04)',
                border: `1px solid ${isRecording ? 'rgba(225,29,72,0.3)' : 'var(--glass-border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.3s var(--ease-out-expo)',
                animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                position: 'relative', zIndex: 1,
              }}
              title={isRecording ? 'Stop recording' : 'Voice input (Bahasa Indonesia)'}
            >
              {isRecording ? <MicOff size={18} color="var(--danger)" /> : <Mic size={18} color="var(--text-muted)" />}
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                width: '50px', height: '50px', borderRadius: '14px', flexShrink: 0,
                background: input.trim() ? 'linear-gradient(135deg, var(--neon-blue), var(--neon-cyan))' : 'rgba(14,165,233,0.04)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() ? 'pointer' : 'default', transition: 'all 0.3s var(--ease-out-expo)',
                boxShadow: input.trim() ? '0 4px 20px rgba(14,165,233,0.2)' : 'none',
                position: 'relative', zIndex: 1,
              }}
              onMouseOver={e => { if (input.trim()) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(14,165,233,0.3)'; }}}
              onMouseOut={e => { if (input.trim()) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(14,165,233,0.2)'; }}}
            >
              <Send size={18} color={input.trim() ? '#000' : 'var(--text-muted)'} />
            </button>
          </div>
        </div>

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="menu-overlay menu-overlay--open" style={{ padding: 0, justifyContent: 'center', alignItems: 'center', background: 'rgba(10,15,30,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowClearConfirm(false)}>
          <div className="glass-panel animate-fade-in-up" style={{ maxWidth: '420px', width: '90%', padding: '32px', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <Trash2 size={48} color="var(--warning)" style={{ margin: '0 auto 16px', opacity: 0.7 }} />
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Hapus Semua Pesan?</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
              Seluruh riwayat chat akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowClearConfirm(false)}>Batal</button>
              <button className="btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { clearChat(); setShowClearConfirm(false); }}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AskAI;
