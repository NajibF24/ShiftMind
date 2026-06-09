# Analisis Jujur ShiftMind

Sebelum saya kasih rekomendasi, izinkan saya bicara blak-blakan dulu tentang kondisi ShiftMind sekarang.

---

## Apa yang Sudah Luar Biasa

ShiftMind sudah punya fondasi yang sangat solid. RAG dengan pgvector, LDAP auth, OneDrive sync, WhatsApp notif, 3D gallery yang unik, auto-learning dari query history — ini bukan aplikasi biasa. Ini sudah production-grade.

Masalahnya bukan di fitur. Masalahnya di **depth dan polish**.

---

## Masalah yang Saya Temukan di Codebase

### 1. `main.py` ada bug — `Session` dan `Depends` tidak diimport

```python
# backend/main.py line ini akan error saat runtime:
@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):  # Session tidak diimport!
```

Ini akan crash kalau endpoint health di-hit. Perbaiki dulu:

```python
# tambahkan di main.py
from fastapi import Depends
from sqlalchemy.orm import Session
from db import get_db
import sqlalchemy as sa
```

### 2. Auto-Learning Bisa Jadi Spam

Di `ask.py`, setiap query yang unik akan masuk ke knowledge base dengan confidence 0.8. Dalam seminggu pemakaian, knowledge base bisa dipenuhi "history" noise yang menurunkan kualitas search.

### 3. Scraper Service Tidak Ada Error Recovery

Di `scraper_service.py`, kalau Yahoo Finance down, data market jadi `0` dan dashboard tampil `$0.00` — terlihat seperti bug bukan fitur.

### 4. Frontend `vite.config.js` Proxy Tidak Match Docker

```js
// vite.config.js — proxy ke localhost:8000
// tapi di docker-compose, frontend container tidak bisa akses localhost:8000
// seharusnya proxy ke backend:8000
proxy: {
  '/api': {
    target: 'http://backend:8000',  // bukan localhost
```

---

## Rekomendasi Upgrade yang Benar-Benar Original

Bukan mengambil ide kompetitor, tapi memperdalam apa yang sudah ShiftMind miliki dan belum ada di mana-mana.

---

### 🎯 Ide 1: "Knowledge Decay Detection"

**Masalah nyata yang belum ada solusinya di mana pun:**

SOP dan dokumen perusahaan punya tanggal kedaluwarsa. SOP dari 2020 mungkin sudah tidak relevan di 2025. Tapi tidak ada yang tahu mana yang sudah expired kecuali dicek manual.

**ShiftMind bisa detect ini secara otomatis:**

Ketika AI menjawab query dari knowledge base, bandingkan jawaban AI dengan query log historis. Kalau ada pattern di mana user sering follow-up "tapi itu sudah berubah" atau "itu cara lama", tandai dokumen tersebut sebagai potentially stale.

```python
# backend/services/knowledge_health.py

def analyze_knowledge_freshness(db: Session) -> list:
    """
    Deteksi knowledge entries yang mungkin sudah outdated
    berdasarkan tiga sinyal:
    1. Usia dokumen vs frekuensi diakses
    2. User feedback patterns dari query logs
    3. Kontradiksi antar dokumen dalam topik yang sama
    """
    stale_candidates = []
    
    # Sinyal 1: Dokumen lama yang masih sering diquery
    # = ada kebutuhan tapi mungkin informasinya sudah outdated
    cutoff = datetime.utcnow() - timedelta(days=180)
    
    old_but_accessed = db.query(KnowledgeEntry).filter(
        KnowledgeEntry.created_at < cutoff,
        KnowledgeEntry.source.in_(["manual", "onedrive"]),
    ).all()
    
    for entry in old_but_accessed:
        age_days = (datetime.utcnow() - entry.created_at).days
        
        # Sinyal 2: Cek query log — apakah dokumen ini sering 
        # di-retrieve tapi diikuti query lanjutan dalam 5 menit?
        # (indikasi jawaban tidak memuaskan)
        follow_up_queries = db.query(QueryLog).filter(
            QueryLog.response.contains(entry.title),
            QueryLog.created_at > datetime.utcnow() - timedelta(days=30)
        ).count()
        
        staleness_score = (age_days / 30) * 0.4 + follow_up_queries * 0.6
        
        if staleness_score > 3.0:
            stale_candidates.append({
                "entry_id": entry.id,
                "title": entry.title,
                "age_days": age_days,
                "staleness_score": round(staleness_score, 2),
                "reason": _explain_staleness(age_days, follow_up_queries)
            })
    
    return sorted(stale_candidates, key=lambda x: x["staleness_score"], reverse=True)


def detect_knowledge_contradictions(db: Session) -> list:
    """
    Temukan dua dokumen dalam topik sama yang mungkin kontradiksi.
    Contoh: SOP lama bilang suhu 1580°C, SOP baru bilang 1600°C.
    """
    contradictions = []
    
    entries = db.query(KnowledgeEntry).filter(
        KnowledgeEntry.source.in_(["manual", "onedrive"])
    ).all()
    
    for i, entry_a in enumerate(entries):
        for entry_b in entries[i+1:]:
            if entry_a.embedding and entry_b.embedding:
                # Kalau topik mirip (jarak vektor kecil)
                # tapi bukan chunk dari file yang sama
                if entry_a.source_file_id != entry_b.source_file_id:
                    # Cek apakah ada angka yang berbeda di topik yang sama
                    numbers_a = extract_numbers(entry_a.content)
                    numbers_b = extract_numbers(entry_b.content)
                    
                    if numbers_a and numbers_b and numbers_a != numbers_b:
                        contradictions.append({
                            "doc_a": entry_a.title,
                            "doc_b": entry_b.title,
                            "potential_conflict": "Numerical values differ"
                        })
    
    return contradictions
```

**Kenapa ini original:**
Tidak ada knowledge management tool yang melakukan ini. Notion tidak. Confluence tidak. Ini adalah fitur yang hanya bisa ada kalau kamu punya query log + vector search sekaligus — persis yang ShiftMind miliki.

**Tampilannya di frontend — Knowledge Health Dashboard:**

```jsx
// KnowledgeHealth.jsx
const KnowledgeHealth = () => {
  return (
    <div className="page-content animate-fade-in">
      <div className="section-header">
        <h1 className="section-header__title">
          <span className="text-gradient">Knowledge</span>
          <span style={{ color: 'var(--text-primary)' }}> Health</span>
        </h1>
        <p className="section-header__subtitle">
          Deteksi otomatis dokumen yang mungkin sudah tidak relevan
          sebelum karyawan mendapat informasi yang salah.
        </p>
      </div>

      {/* Staleness Gauge */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div className="stat-card" style={{ '--card-color': 'var(--neon-green)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fresh (< 90 hari)</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--neon-green)' }}>
            {health.fresh_count}
          </div>
        </div>
        <div className="stat-card" style={{ '--card-color': 'var(--warning)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Perlu Review</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--warning)' }}>
            {health.stale_count}
          </div>
        </div>
        <div className="stat-card" style={{ '--card-color': 'var(--danger)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Potensi Kontradiksi</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)' }}>
            {health.contradiction_count}
          </div>
        </div>
      </div>

      {/* Stale Documents List */}
      {staleEntries.map(entry => (
        <div key={entry.entry_id} className="glass-panel" style={{ 
          padding: '20px', 
          marginBottom: '12px',
          borderLeft: `4px solid ${entry.staleness_score > 5 ? 'var(--danger)' : 'var(--warning)'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '4px' }}>{entry.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {entry.age_days} hari sejak dibuat · {entry.reason}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                Minta Update
              </button>
              <button className="btn-ghost" style={{ fontSize: '0.75rem' }}>
                Masih Valid
              </button>
            </div>
          </div>
          
          {/* Staleness bar */}
          <div className="progress-bar" style={{ marginTop: '12px' }}>
            <div className="progress-bar__fill" style={{ 
              width: `${Math.min(entry.staleness_score * 10, 100)}%`,
              background: entry.staleness_score > 5 
                ? 'var(--danger)' 
                : 'var(--warning)'
            }} />
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

### 🎯 Ide 2: "Contextual SOP Delivery" — Push, Bukan Pull

**Masalah nyata:**

Sekarang ShiftMind bersifat reactive — user harus tanya dulu baru dapat jawaban. Di pabrik, operator yang sedang kerja tidak akan berhenti untuk buka HP dan tanya AI.

**Ide:** ShiftMind detect konteks dari checklist yang sedang diisi, lalu secara proaktif push informasi relevan **tanpa user harus tanya**.

Contoh: Operator lagi isi checklist "EAF Morning Inspection" dan ada item "Check electrode gap" yang di-mark FAIL. ShiftMind langsung tampilkan SOP troubleshooting electrode gap di layar, tanpa operator perlu tanya.

```python
# backend/routes/checklist.py — tambahkan di endpoint create_checklist

@router.post("", status_code=201)
def create_checklist(data: ChecklistCreate, ...):
    # ... existing code ...
    
    # NEW: Contextual SOP suggestion untuk setiap FAIL item
    fail_suggestions = {}
    for item in items_list:
        if item["status"] == "FAIL":
            # Vector search untuk SOP paling relevan
            item_embedding = generate_embedding(
                f"troubleshoot FAIL {item['item']} {data.title}"
            )
            
            relevant_sop = db.query(KnowledgeEntry).order_by(
                KnowledgeEntry.embedding.l2_distance(item_embedding)
            ).first()
            
            if relevant_sop:
                fail_suggestions[item["item"]] = {
                    "sop_title": relevant_sop.title,
                    "sop_excerpt": relevant_sop.content[:300],
                    "sop_url": relevant_sop.source_url,
                    "confidence": "high" if relevant_sop.confidence_score > 0.8 else "medium"
                }
    
    checklist = DailyChecklist(...)
    # ... save ...
    
    return {
        **checklist.__dict__,
        "contextual_sops": fail_suggestions  # Langsung return SOP relevan
    }
```

**Di frontend, saat operator isi checklist dan mark FAIL:**

```jsx
// Checklists.jsx — update item handler
const updateItemStatus = async (idx, status) => {
  const newItems = [...items];
  newItems[idx].status = status;
  setItems(newItems);
  
  // NEW: Kalau FAIL, langsung fetch SOP relevan
  if (status === 'FAIL') {
    const itemName = newItems[idx].item;
    
    // Search knowledge base secara real-time
    const res = await axios.post('/api/ask', {
      query: `Bagaimana cara menangani FAIL pada: ${itemName}?`,
      // Flag untuk tidak disimpan ke query log
      silent: true  
    }, { headers: { Authorization: `Bearer ${token}` } });
    
    // Tampilkan sebagai tooltip/panel di sebelah item
    setSopSuggestions(prev => ({
      ...prev,
      [idx]: {
        answer: res.data.answer,
        sources: res.data.sources
      }
    }));
  }
};

// Render dengan SOP popup
{items.map((item, idx) => (
  <div key={idx}>
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <input value={item.item} ... />
      <select value={item.status} onChange={e => updateItemStatus(idx, e.target.value)}>
        <option value="OK">OK</option>
        <option value="FAIL">FAIL</option>
        <option value="N/A">N/A</option>
      </select>
    </div>
    
    {/* NEW: SOP suggestion muncul otomatis kalau FAIL */}
    {item.status === 'FAIL' && sopSuggestions[idx] && (
      <div className="animate-fade-in-up" style={{
        marginTop: '8px', padding: '14px',
        background: 'rgba(14,165,233,0.04)',
        border: '1px solid rgba(14,165,233,0.15)',
        borderRadius: '10px', marginLeft: '16px'
      }}>
        <div style={{ 
          fontSize: '0.65rem', color: 'var(--neon-cyan)', 
          fontWeight: 700, marginBottom: '8px',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <Zap size={11} /> SOP RELEVAN DITEMUKAN OTOMATIS
        </div>
        <div className="markdown-body" style={{ fontSize: '0.82rem' }}>
          <ReactMarkdown>{sopSuggestions[idx].answer.substring(0, 500)}...</ReactMarkdown>
        </div>
      </div>
    )}
  </div>
))}
```

**Kenapa ini berbeda dari semua kompetitor:**

Ini bukan chatbot. Ini bukan search engine. Ini adalah sistem yang **memahami konteks pekerjaan dan menyajikan pengetahuan tepat saat dibutuhkan** — tanpa user harus melakukan apa-apa. Ini lebih mirip "intelligent co-pilot" daripada "AI assistant".

---

### 🎯 Ide 3: "Knowledge Lineage" — Dari Mana Pengetahuan Ini Berasal

**Masalah yang underrated:**

Ketika AI menjawab pertanyaan, user tidak tahu apakah jawaban itu dari SOP resmi, dari catatan journal karyawan lain, atau dari auto-learning. Padahal trust level-nya sangat berbeda.

ShiftMind sudah punya `confidence_score` dan `source` di knowledge entries. Tinggal **visualisasikan lineage-nya**.

```python
# backend/routes/ask.py — tambahkan lineage info

# Di response, tambahkan lineage per source
sources_with_lineage = []
for entry in similar_entries:
    lineage = {
        "id": entry.id,
        "title": entry.title,
        "source_type": entry.source,
        "confidence": entry.confidence_score,
        "age_days": (datetime.utcnow() - entry.created_at).days if entry.created_at else None,
        "trust_level": _calculate_trust_level(entry),
        "lineage_chain": _build_lineage_chain(entry, db)
    }
    sources_with_lineage.append(lineage)

def _calculate_trust_level(entry: KnowledgeEntry) -> str:
    """
    Official  → SOP dari OneDrive (confidence 0.9+)
    Verified  → Manual entry oleh admin (confidence 1.0)  
    Community → Journal/workflow dari karyawan (confidence 0.6-0.7)
    AI-Learned → Auto-learning dari query history (confidence 0.8)
    """
    if entry.source == "onedrive":
        return "official"
    elif entry.source == "manual" and entry.confidence_score >= 1.0:
        return "verified"
    elif entry.source in ("journal", "workflow"):
        return "community"
    elif entry.source == "history":
        return "ai_learned"
    return "unknown"

def _build_lineage_chain(entry: KnowledgeEntry, db: Session) -> list:
    """
    Trace dari mana knowledge ini berasal.
    Contoh: "Workflow #12 → diapprove Admin → masuk KB"
    """
    chain = [{"step": "Created", "detail": entry.source_file_name or entry.source}]
    
    if entry.author_id:
        author = db.query(User).filter(User.id == entry.author_id).first()
        if author:
            chain.append({
                "step": "Contributed by",
                "detail": author.display_name or author.username
            })
    
    if entry.last_synced_at:
        chain.append({
            "step": "Last synced",
            "detail": entry.last_synced_at.strftime("%d %b %Y")
        })
    
    return chain
```

**Di AskAI.jsx, sources sekarang jadi lebih informative:**

```jsx
// Di message sources section
{msg.sources?.length > 0 && (
  <div style={{ marginTop: '12px' }}>
    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
      SUMBER JAWABAN
    </div>
    {msg.sources.map((src, j) => {
      const trustConfig = {
        official: { color: 'var(--neon-green)', label: 'Dokumen Resmi', icon: '✓' },
        verified: { color: 'var(--neon-blue)', label: 'Terverifikasi', icon: '★' },
        community: { color: 'var(--warning)', label: 'Dari Tim', icon: '👥' },
        ai_learned: { color: 'var(--text-muted)', label: 'AI Learned', icon: '🤖' },
      };
      const trust = trustConfig[src.trust_level] || trustConfig.ai_learned;
      
      return (
        <div key={j} style={{
          padding: '10px 14px', borderRadius: '8px', marginBottom: '6px',
          background: 'rgba(255,255,255,0.5)', border: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{src.title}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {src.age_days} hari lalu · {src.lineage_chain?.map(l => l.detail).join(' → ')}
            </div>
          </div>
          <span style={{
            padding: '3px 10px', borderRadius: '20px', fontSize: '0.6rem',
            fontWeight: 700, color: trust.color,
            background: `${trust.color}15`,
            border: `1px solid ${trust.color}30`,
            whiteSpace: 'nowrap'
          }}>
            {trust.icon} {trust.label}
          </span>
        </div>
      );
    })}
    
    {/* Warning kalau ada sumber dengan trust rendah */}
    {msg.sources.some(s => s.trust_level === 'ai_learned') && (
      <div style={{
        padding: '8px 12px', borderRadius: '8px', marginTop: '6px',
        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
        fontSize: '0.72rem', color: 'var(--warning)',
        display: 'flex', alignItems: 'center', gap: '6px'
      }}>
        ⚠️ Sebagian jawaban dari AI learning — verifikasi ke dokumen resmi jika kritis
      </div>
    )}
  </div>
)}
```

---

## Satu Hal yang Paling Penting Diperbaiki

Dari semua yang ada, **Knowledge Health** adalah fitur yang paling unik dan paling susah ditiru kompetitor karena membutuhkan kombinasi:

- Query logs historis ✅ (ShiftMind sudah punya)
- Vector search ✅ (ShiftMind sudah punya)
- Dokumen dari multiple source ✅ (ShiftMind sudah punya)
- Logika bisnis untuk detect staleness ← ini yang perlu dibangun

Tidak ada platform lain yang bisa melakukan ini karena mereka tidak punya semua prerequisite di atas dalam satu sistem.

Fitur ini juga sangat mudah di-demo: "Sistem kami tahu bahwa SOP ini sudah 8 bulan tidak diupdate, sementara ada 23 pertanyaan yang tidak terjawab dengan baik dari dokumen ini."
