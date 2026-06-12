from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime, timedelta

from difflib import SequenceMatcher

from db import get_db
from models.user import User
from models.knowledge import KnowledgeEntry
from models.query_log import QueryLog
from models.work_journal import WorkJournal
from models.workflow import Workflow
from models.checklist import DailyChecklist
from models.approval import ApprovalRequest
from services.auth import get_current_user
from services.ai_service import generate_embedding, get_chat_completion

router = APIRouter()

# ─── GYS Company Context (always included in system prompt) ───────────────────
GYS_CONTEXT = """TENTANG PT GARUDA YAMATO STEEL (GYS):
- Joint venture didirikan 2024 oleh Yamato Kogyo Co Ltd (Jepang), Siam Yamato Steel Co Ltd (Thailand), PT Hanwa Indonesia, dan PT Gunung Raja Paksi Tbk
- Berlokasi di Jl. Perjuangan No.8, Cikarang, Bekasi, Jawa Barat 17530
- Jam operasional: Senin-Jumat 08:00-17:00 WIB
- Produsen baja panjang berkualitas tinggi: H-Beam, IWF (Wide Flange), Channel (Kanal U), Equal Angle (Siku Sama Kaki)
- Menggunakan Electric Arc Furnace (EAF) untuk proses produksi ramah lingkungan
- Bersertifikat: ISO 9001, ISO 14001, ISO 45001, ISO/IEC 17025, SNI, CE Marking, UKCA, ACRS, SIRIM
- TKDN > 90% untuk semua produk utama
- Visi: Menjadi perusahaan terkemuka dalam kategori baja panjang dengan standar internasional
- Misi: Memberikan kepuasan pelanggan tak tertandingi, menjunjung tanggung jawab sosial dan lingkungan
- Core Values: Kualitas, Inovasi, Keberlanjutan"""

# ─── Keyword sets untuk intent detection ──────────────────────────────────────
COMPANY_INFO_KEYWORDS = [
    "visi", "misi", "vision", "mission",
    "profil", "profile", "company", "perusahaan",
    "core value", "nilai", "investor", "pemegang saham",
    "sejarah", "history", "didirikan", "berdiri",
    "kebijakan manajemen", "management policy",
    "siapa", "tentang gys", "tentang garuda yamato",
    "apa itu gys", "alamat", "lokasi", "kontak",
    "sertifikat", "sertifikasi", "iso", "tkdn",
    "produk", "h-beam", "iwf", "channel", "equal angle",
]

MARKET_KEYWORDS = [
    "harga", "price", "market", "pasar",
    "usd", "idr", "kurs", "exchange",
    "hrc", "steel price", "berita", "news",
    "indikator", "market intelligence",
]

CHECKLIST_KEYWORDS = [
    "checklist", "cek list", "inspeksi", "inspection",
    "fail", "ok", "status pengecekan",
    "pengecekan harian", "daily check",
    "temuan", "finding", "anomali",
]

APPROVAL_KEYWORDS = [
    "approval", "persetujuan", "contract", "kontrak",
    "purchase", "pembelian", "review kontrak",
    "pengajuan", "request", "pending approval",
    "disetujui", "ditolak", "approved", "rejected",
]

WORKFLOW_KEYWORDS = [
    "workflow", "sop", "prosedur", "procedure",
    "langkah", "step", "cara", "how to",
    "proses", "process", "alur kerja",
]

JOURNAL_KEYWORDS = [
    "journal", "jurnal", "catatan kerja", "log kerja",
    "aktivitas", "activity", "apa yang dikerjakan",
    "pekerjaan", "tugas", "task", "lessons learned",
    "troubleshooting", "masalah", "problem",
]


def detect_query_intent(query: str) -> str:
    """
    Deteksi intent pertanyaan user:
    - 'company' : pertanyaan tentang profil, visi, misi, dll perusahaan
    - 'market'  : pertanyaan tentang harga, news, market data
    - 'checklist': pertanyaan tentang checklist / inspeksi
    - 'approval': pertanyaan tentang approval / kontrak
    - 'workflow': pertanyaan tentang SOP / workflow / prosedur
    - 'journal' : pertanyaan tentang catatan kerja / aktivitas
    - 'general' : pertanyaan umum
    """
    q_lower = query.lower()
    
    scores = {
        "company": sum(1 for kw in COMPANY_INFO_KEYWORDS if kw in q_lower),
        "market": sum(1 for kw in MARKET_KEYWORDS if kw in q_lower),
        "checklist": sum(1 for kw in CHECKLIST_KEYWORDS if kw in q_lower),
        "approval": sum(1 for kw in APPROVAL_KEYWORDS if kw in q_lower),
        "workflow": sum(1 for kw in WORKFLOW_KEYWORDS if kw in q_lower),
        "journal": sum(1 for kw in JOURNAL_KEYWORDS if kw in q_lower),
    }
    
    best_intent = max(scores, key=scores.get)
    if scores[best_intent] > 0:
        return best_intent
    return "general"


# ─── Cross-module context gatherers ──────────────────────────────────────────

def _gather_journal_context(db: Session, query: str, query_embedding: list, limit: int = 3) -> tuple[str, list]:
    """Search Work Journals for relevant context."""
    context = ""
    sources = []
    
    try:
        journals = db.query(WorkJournal).filter(
            WorkJournal.is_public == 1
        ).order_by(
            WorkJournal.embedding.l2_distance(query_embedding)
        ).limit(limit).all()
        
        for j in journals:
            author_name = ""
            try:
                author = db.query(User).filter(User.id == j.user_id).first()
                author_name = f" oleh {author.display_name or author.username}" if author else ""
            except:
                pass
            
            context += (
                f"📓 Catatan Kerja: {j.title}{author_name}\n"
                f"   Tanggal: {j.created_at.strftime('%Y-%m-%d') if j.created_at else 'N/A'}\n"
                f"   Kategori: {j.category or 'N/A'} | Tingkat: {j.difficulty or 'N/A'}\n"
                f"   Isi: {j.content}\n"
            )
            if j.ai_summary:
                context += f"   Ringkasan AI: {j.ai_summary}\n"
            if j.ai_lessons_learned:
                context += f"   Lessons Learned: {j.ai_lessons_learned}\n"
            if j.ai_related_sops:
                context += f"   SOP Terkait: {j.ai_related_sops}\n"
            context += "\n"
            
            sources.append({
                "id": j.id, "title": f"[Journal] {j.title}",
                "source": "journal", "type": "work_journal"
            })
    except Exception as e:
        print(f"Error gathering journal context: {e}")
    
    return context, sources


def _gather_workflow_context(db: Session, query: str, query_embedding: list, limit: int = 3) -> tuple[str, list]:
    """Search Workflows/SOPs for relevant context."""
    context = ""
    sources = []
    
    try:
        workflows = db.query(Workflow).filter(
            Workflow.is_latest == 1
        ).order_by(
            Workflow.embedding.l2_distance(query_embedding)
        ).limit(limit).all()
        
        for w in workflows:
            status = "✅ Approved" if w.is_approved else "📝 Draft"
            context += (
                f"📋 Workflow/SOP: {w.title} ({status})\n"
                f"   Deskripsi: {w.description or 'N/A'}\n"
                f"   Department: {w.department or 'N/A'} | Area: {w.area or 'N/A'}\n"
            )
            if w.steps:
                context += "   Langkah-langkah:\n"
                for step in w.steps[:10]:
                    s = step if isinstance(step, dict) else {}
                    context += f"     {s.get('step', '?')}. {s.get('action', '')}"
                    if s.get('notes'):
                        context += f" (catatan: {s['notes']})"
                    context += "\n"
            if w.ai_sop_draft:
                context += f"   SOP Formal:\n{w.ai_sop_draft[:1500]}\n"
            if w.ai_safety_notes:
                context += f"   Catatan Keselamatan: {w.ai_safety_notes[:500]}\n"
            context += "\n"
            
            sources.append({
                "id": w.id, "title": f"[Workflow] {w.title}",
                "source": "workflow", "type": "workflow"
            })
    except Exception as e:
        print(f"Error gathering workflow context: {e}")
    
    return context, sources


def _gather_checklist_context(db: Session, query: str, limit: int = 5) -> tuple[str, list]:
    """Search recent Checklists for relevant context (text-based, no embedding)."""
    context = ""
    sources = []
    
    try:
        q_lower = query.lower()
        
        # Get recent checklists — use text search since checklists have no embedding
        checklist_query = db.query(DailyChecklist).order_by(
            desc(DailyChecklist.created_at)
        )
        
        # Try keyword filtering first
        keywords = [w for w in q_lower.split() if len(w) > 2]
        filtered = []
        all_recent = checklist_query.limit(50).all()
        
        for cl in all_recent:
            # Check if any keyword matches title or items
            cl_text = (cl.title or "").lower()
            for item in (cl.items or []):
                cl_text += " " + (item.get("item", "") + " " + item.get("notes", "")).lower()
            
            if any(kw in cl_text for kw in keywords) or not keywords:
                filtered.append(cl)
            if len(filtered) >= limit:
                break
        
        # If no keyword match, just use most recent
        if not filtered:
            filtered = all_recent[:limit]
        
        for cl in filtered:
            author_name = ""
            try:
                author = db.query(User).filter(User.id == cl.user_id).first()
                author_name = f" oleh {author.display_name or author.username}" if author else ""
            except:
                pass
            
            items_text = ""
            fail_items = []
            ok_items = []
            for item in (cl.items or []):
                status = item.get("status", "N/A")
                item_name = item.get("item", "Unknown")
                notes = item.get("notes", "")
                items_text += f"     - {item_name}: {status}"
                if notes:
                    items_text += f" ({notes})"
                items_text += "\n"
                if status == "FAIL":
                    fail_items.append(item_name)
                elif status == "OK":
                    ok_items.append(item_name)
            
            context += (
                f"✅ Checklist: {cl.title}{author_name}\n"
                f"   Tanggal: {cl.created_at.strftime('%Y-%m-%d %H:%M') if cl.created_at else 'N/A'}\n"
                f"   Total Item: {len(cl.items or [])} | OK: {len(ok_items)} | FAIL: {len(fail_items)}\n"
                f"   Detail:\n{items_text}"
            )
            if cl.ai_analysis:
                context += f"   Analisis AI: {cl.ai_analysis[:500]}\n"
            context += "\n"
            
            sources.append({
                "id": cl.id, "title": f"[Checklist] {cl.title}",
                "source": "checklist", "type": "checklist"
            })
    except Exception as e:
        print(f"Error gathering checklist context: {e}")
    
    return context, sources


def _gather_approval_context(db: Session, query: str, limit: int = 5) -> tuple[str, list]:
    """Search Approval Requests for relevant context."""
    context = ""
    sources = []
    
    try:
        q_lower = query.lower()
        
        # Get recent approvals with text search
        approval_query = db.query(ApprovalRequest).order_by(
            desc(ApprovalRequest.created_at)
        )
        
        keywords = [w for w in q_lower.split() if len(w) > 2]
        filtered = []
        all_recent = approval_query.limit(30).all()
        
        for ar in all_recent:
            ar_text = f"{ar.title} {ar.details} {ar.request_type}".lower()
            if any(kw in ar_text for kw in keywords) or not keywords:
                filtered.append(ar)
            if len(filtered) >= limit:
                break
        
        if not filtered:
            filtered = all_recent[:limit]
        
        for ar in filtered:
            requester_name = ""
            approver_name = ""
            try:
                requester = db.query(User).filter(User.id == ar.requester_id).first()
                requester_name = f" oleh {requester.display_name or requester.username}" if requester else ""
                if ar.approved_by_id:
                    approver = db.query(User).filter(User.id == ar.approved_by_id).first()
                    approver_name = f" oleh {approver.display_name or approver.username}" if approver else ""
            except:
                pass
            
            status_emoji = {"pending": "⏳", "approved": "✅", "rejected": "❌"}.get(ar.status, "❓")
            context += (
                f"📋 Approval Request: {ar.title}{requester_name}\n"
                f"   Tipe: {ar.request_type} | Status: {status_emoji} {ar.status}\n"
                f"   Tanggal: {ar.created_at.strftime('%Y-%m-%d') if ar.created_at else 'N/A'}\n"
                f"   Detail: {ar.details[:500]}\n"
            )
            if ar.ai_assessment:
                context += f"   AI Assessment: {ar.ai_assessment[:500]}\n"
            if ar.approved_by_id:
                context += f"   Di-{ar.status}{approver_name} pada {ar.approved_at.strftime('%Y-%m-%d') if ar.approved_at else 'N/A'}\n"
            
            # Include comment thread
            if ar.comments:
                context += "   Diskusi:\n"
                for comment in (ar.comments or [])[-5:]:
                    context += f"     - {comment.get('username', '?')}: {comment.get('content', '')}\n"
            context += "\n"
            
            sources.append({
                "id": ar.id, "title": f"[Approval] {ar.title}",
                "source": "approval", "type": "approval"
            })
    except Exception as e:
        print(f"Error gathering approval context: {e}")
    
    return context, sources


# ─── Main ask endpoint ───────────────────────────────────────────────────────

class AskRequest(BaseModel):
    query: str
    history: Optional[List[Dict[str, str]]] = []
    silent: Optional[bool] = False  # If true, don't save to query log

class AskResponse(BaseModel):
    answer: str
    sources: list[dict]

@router.post("", response_model=AskResponse)
def ask_ai(
    req: AskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Generate embedding for the user's query
    query_embedding = generate_embedding(req.query)
    
    # 1b. Detect query intent
    intent = detect_query_intent(req.query)
    print(f"[ASK] Query: '{req.query[:80]}' | Intent: {intent}")
    
    # ═══════════════════════════════════════════════════════════════════════
    # 2. Gather context from ALL modules based on intent
    # ═══════════════════════════════════════════════════════════════════════
    
    all_context = ""
    all_sources = []
    
    # ── 2a. Knowledge Base (always search, filter by intent) ──────────────
    kb_query = db.query(KnowledgeEntry).filter(
        KnowledgeEntry.status == "active"
    )
    
    if intent == "company":
        # Perusahaan → semua source kecuali daily_news
        kb_query = kb_query.filter(
            KnowledgeEntry.source.in_([
                "company", "manual", "onedrive", "journal", 
                "workflow", "manual_upload", "history"
            ])
        )
    elif intent == "market":
        # Market → prioritaskan daily_news, tapi tetap cari semua
        pass
    # else: general/checklist/approval/workflow/journal → search semua
    
    kb_entries = kb_query.order_by(
        KnowledgeEntry.embedding.l2_distance(query_embedding)
    ).limit(5).all()
    
    for entry in kb_entries:
        source_label = ""
        if entry.source == "onedrive" and entry.source_file_name:
            source_label = f" (Sumber: {entry.source_file_name})"
        elif entry.source == "company":
            source_label = " (Sumber: Website GYS)"
        elif entry.source == "daily_news":
            source_label = " (Sumber: Market Intelligence)"
        elif entry.source == "journal":
            source_label = " (Sumber: Catatan Kerja Karyawan)"
        elif entry.source == "workflow":
            source_label = " (Sumber: Workflow/SOP)"
        elif entry.source == "manual_upload":
            source_label = f" (Sumber: Upload Dokumen - {entry.source_file_name or ''})"
        elif entry.source == "history":
            source_label = " (Sumber: Auto-Learned)"

        all_context += f"📄 Dokumen KB: {entry.title}{source_label}\nIsi: {entry.content}\n\n"
        
        source_info = {"id": entry.id, "title": entry.title, "source": entry.source or "manual", "type": "knowledge"}
        if entry.source_file_name:
            source_info["file_name"] = entry.source_file_name
        if entry.source_url:
            source_info["url"] = entry.source_url
        all_sources.append(source_info)
    
    # ── 2b. Work Journals (search when relevant) ─────────────────────────
    if intent in ("journal", "general", "workflow"):
        j_ctx, j_src = _gather_journal_context(db, req.query, query_embedding, limit=3)
        all_context += j_ctx
        all_sources += j_src
    
    # ── 2c. Workflows / SOPs (search when relevant) ──────────────────────
    if intent in ("workflow", "general", "company"):
        w_ctx, w_src = _gather_workflow_context(db, req.query, query_embedding, limit=3)
        all_context += w_ctx
        all_sources += w_src
    
    # ── 2d. Checklists (search when relevant) ────────────────────────────
    if intent in ("checklist", "general"):
        c_ctx, c_src = _gather_checklist_context(db, req.query, limit=5)
        all_context += c_ctx
        all_sources += c_src
    
    # ── 2e. Approvals / Contract Reviews (search when relevant) ──────────
    if intent in ("approval", "general"):
        a_ctx, a_src = _gather_approval_context(db, req.query, limit=5)
        all_context += a_ctx
        all_sources += a_src
    
    # ── 2f. If intent is very specific but we got no context, broaden ────
    if not all_context.strip() and intent not in ("general", "market"):
        # Fallback: search ALL modules
        j_ctx, j_src = _gather_journal_context(db, req.query, query_embedding, limit=2)
        w_ctx, w_src = _gather_workflow_context(db, req.query, query_embedding, limit=2)
        c_ctx, c_src = _gather_checklist_context(db, req.query, limit=3)
        a_ctx, a_src = _gather_approval_context(db, req.query, limit=3)
        all_context += j_ctx + w_ctx + c_ctx + a_ctx
        all_sources += j_src + w_src + c_src + a_src
    
    # Deduplicate sources by (type, id)
    seen = set()
    unique_sources = []
    for src in all_sources:
        key = (src.get("type", ""), src.get("id", ""))
        if key not in seen:
            seen.add(key)
            unique_sources.append(src)
    all_sources = unique_sources
    
    # ═══════════════════════════════════════════════════════════════════════
    # 3. Construct system prompt for LLM
    # ═══════════════════════════════════════════════════════════════════════
    
    base_persona = (
        "Kamu adalah **ShiftMind**, asisten AI resmi untuk PT Garuda Yamato Steel (GYS). "
        "Kamu adalah asisten yang cerdas, sopan, dan profesional.\n\n"
    )
    
    data_sources_info = (
        "SUMBER DATA YANG TERSEDIA UNTUKMU:\n"
        "Kamu memiliki akses ke data berikut dari sistem ShiftMind:\n"
        "1. 📄 **Knowledge Base** — SOP, kebijakan perusahaan, dokumen OneDrive, data manual\n"
        "2. 📓 **Catatan Kerja (Work Journal)** — catatan harian karyawan, lessons learned, troubleshooting\n"
        "3. 📋 **Workflow/SOP** — prosedur kerja yang dicatat karyawan, AI-generated SOP\n"
        "4. ✅ **Checklist** — hasil pengecekan harian (inspeksi, daily check), termasuk status OK/FAIL\n"
        "5. 📋 **Approval & Contract Review** — pengajuan persetujuan, review kontrak, AI risk assessment\n"
        "6. 📊 **Market Intelligence** — berita baja, harga HRC, kurs USD/IDR\n\n"
    )
    
    strict_rules = (
        "═══════════════════════════════════════════════════════════════\n"
        "ATURAN WAJIB — IKUTI TANPA PENGECUALIAN:\n"
        "═══════════════════════════════════════════════════════════════\n\n"
        
        "🎯 ATURAN #1 — JAWAB TEPAT SESUAI PERTANYAAN:\n"
        "- BACA pertanyaan user dengan cermat. Jawab HANYA dan PERSIS apa yang ditanyakan.\n"
        "- JANGAN pernah menjawab dengan topik lain yang tidak ditanyakan.\n"
        "- Jika user bertanya 'visi dan misi' → jawab HANYA visi dan misi, BUKAN berita/market/produk.\n"
        "- Jika user bertanya 'harga baja' → jawab HANYA tentang harga baja, BUKAN profil perusahaan.\n"
        "- Jika user bertanya 'SOP cuti' → jawab HANYA tentang SOP cuti.\n"
        "- Jika user bertanya tentang checklist → jawab dari data checklist yang tersedia.\n"
        "- Jika user bertanya tentang approval → jawab dari data approval yang tersedia.\n"
        "- Jika user bertanya tentang catatan kerja → jawab dari data journal yang tersedia.\n"
        "- JANGAN menambahkan informasi lain yang tidak diminta.\n\n"
        
        "🚫 ATURAN #2 — JANGAN MENGARANG:\n"
        "- HANYA gunakan informasi dari KONTEKS DATA yang diberikan di bawah.\n"
        "- Jika informasinya TIDAK ADA di konteks, katakan dengan jujur (lihat aturan #4).\n"
        "- JANGAN pernah mengarang data, angka, SOP, atau prosedur.\n\n"
        
        "📄 ATURAN #3 — SEBUTKAN SUMBER:\n"
        "- Jika menjawab dari dokumen, sebutkan sumbernya.\n"
        "  Contoh: 'Menurut SOP-HR-001...' atau 'Berdasarkan catatan kerja tanggal...' atau 'Dari hasil checklist...'\n\n"
        
        "💬 ATURAN #4 — JIKA TIDAK BISA MENJAWAB:\n"
        "Jika pertanyaan user TIDAK dapat dijawab dari konteks yang tersedia, "
        "berikan respons yang sopan dan membantu seperti contoh berikut:\n\n"
        
        "  Contoh 1 (pertanyaan SOP spesifik):\n"
        '  "Mohon maaf, saya belum memiliki informasi tentang [topik] di database saat ini. 🙏\\n\\n'
        '  **Saran:**\\n'
        '  - Hubungi **Dept. [nama dept]** untuk informasi lebih lanjut\\n'
        '  - Atau minta admin untuk mengunggah dokumen terkait ke ShiftMind"\n\n'
        
        "  Contoh 2 (pertanyaan umum di luar domain GYS):\n"
        '  "Pertanyaan ini di luar cakupan pengetahuan saya sebagai asisten GYS. '
        'Saya dapat membantu Anda tentang:\\n'
        '  - 📋 SOP & prosedur perusahaan\\n'
        '  - 🏭 Produk GYS (H-Beam, IWF, Channel, Equal Angle)\\n'
        '  - 📊 Market intelligence & harga baja\\n'
        '  - 📓 Catatan kerja & lessons learned\\n'
        '  - ✅ Hasil checklist & inspeksi\\n'
        '  - 📋 Status approval & review kontrak\\n'
        '  - 📜 Kebijakan & sertifikasi perusahaan\\n\\n'
        '  Silakan tanyakan tentang topik di atas! 😊"\n\n'
        
        "📐 ATURAN #5 — FORMAT JAWABAN:\n"
        "- Gunakan Bahasa Indonesia yang MUDAH DIMENGERTI oleh semua level karyawan\n"
        "- Gunakan heading markdown (### Judul) untuk sub-bagian\n"
        "- Gunakan **bold** untuk istilah penting\n"
        "- Gunakan tabel markdown jika ada data yang perlu dibandingkan\n"
        "- Gunakan numbered list (1. 2. 3.) untuk langkah-langkah prosedur\n"
        "- Gunakan bullet list (- item) untuk daftar\n"
        "- Jika jawaban panjang, berikan rangkuman singkat di awal\n"
        "- Akhiri dengan kalimat penutup yang ramah jika sesuai\n\n"
    )
    
    if all_context.strip():
        system_prompt = (
            f"{base_persona}"
            f"{GYS_CONTEXT}\n\n"
            f"{data_sources_info}"
            f"{strict_rules}"
            f"KONTEKS DATA DARI SISTEM SHIFTMIND (gunakan HANYA informasi yang RELEVAN dengan pertanyaan user):\n"
            f"─────────────────────────────────────────────────────\n"
            f"{all_context}"
            f"─────────────────────────────────────────────────────\n\n"
            f"PENGINGAT TERAKHIR: Jawab HANYA pertanyaan user. "
            f"Jangan campur topik. Jangan menambahkan info yang tidak diminta."
        )
    else:
        # No context found — give graceful fallback instruction
        system_prompt = (
            f"{base_persona}"
            f"{GYS_CONTEXT}\n\n"
            f"{data_sources_info}"
            f"{strict_rules}"
            "CATATAN: Tidak ada data spesifik di sistem ShiftMind yang cocok dengan pertanyaan user.\n\n"
            "INSTRUKSI:\n"
            "1. Jika pertanyaan bisa dijawab dari INFORMASI GYS di atas (visi, misi, produk, alamat, dll), "
            "jawab dari sana dengan akurat.\n"
            "2. Jika pertanyaan tentang SOP/prosedur/checklist/approval spesifik yang tidak tersedia, "
            "berikan respons yang sopan bahwa data tersebut belum tersedia di ShiftMind, "
            "dan sarankan user menghubungi departemen terkait atau mencatat data melalui fitur yang sesuai.\n"
            "3. JANGAN mengarang SOP atau prosedur.\n"
            "4. Tetap ramah, profesional, dan gunakan emoji secukupnya."
        )
    
    # Assemble messages with history
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add history
    if req.history:
        for msg in req.history[-10:]: # keep last 10 messages to avoid context limit
            # ensure valid roles
            if msg.get("role") in ["user", "assistant"]:
                messages.append({"role": msg["role"], "content": msg["content"]})
                
    # Add current query
    messages.append({"role": "user", "content": req.query})
    
    # 4. Get response from 9Router LLM
    answer = get_chat_completion(messages)
    
    # 5. Save the interaction to the database for Dashboard stats & Self-Improving Knowledge
    if not req.silent:
        try:
            new_log = QueryLog(
                user_id=current_user.id,
                query=req.query,
                response=answer
            )
            db.add(new_log)
            
            # 6. Auto-learning: Feed the answer back into the Knowledge Base
            # New entries are saved as status="draft" and require admin approval
            existing_similar = db.query(KnowledgeEntry).filter(
                KnowledgeEntry.source == "history"
            ).order_by(
                KnowledgeEntry.embedding.l2_distance(query_embedding)
            ).first()
            
            should_learn = True
            if existing_similar:
                ratio = SequenceMatcher(None, req.query.lower(), existing_similar.title.lower()).ratio()
                if ratio > 0.9:
                    should_learn = False
            
            if should_learn:
                similar_queries = db.query(QueryLog).filter(
                    QueryLog.created_at >= datetime.utcnow() - timedelta(days=30),
                    QueryLog.user_id == current_user.id
                ).all()
                
                query_count = 0
                for log in similar_queries:
                    ratio = SequenceMatcher(None, req.query.lower(), log.query.lower()).ratio()
                    if ratio > 0.8:
                        query_count += 1
                
                if query_count >= 2:
                    history_embedding = generate_embedding(req.query + "\n" + answer)
                    confidence_score = min(0.9, 0.7 + (query_count * 0.1))
                    
                    new_history_entry = KnowledgeEntry(
                        title=req.query,
                        content=answer,
                        category="Auto-Learned",
                        department="All",
                        source="history",
                        status="draft",  # <-- draft until admin approves
                        confidence_score=confidence_score,
                        embedding=history_embedding,
                        author_id=current_user.id
                    )
                    db.add(new_history_entry)
                
            db.commit()
        except Exception as e:
            print(f"Failed to save query log & history: {e}")
            db.rollback()
    
    return AskResponse(answer=answer, sources=all_sources)
