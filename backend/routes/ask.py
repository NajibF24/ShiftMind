from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Optional

from difflib import SequenceMatcher

from db import get_db
from models.user import User
from models.knowledge import KnowledgeEntry
from models.query_log import QueryLog
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
- Core Values: Kualitas, Inovasi, Keberlanjutan"""


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
    
    # 2. Perform vector search in pgvector database — only search active entries (not drafts)
    similar_entries = db.query(KnowledgeEntry).filter(
        KnowledgeEntry.status == "active"
    ).order_by(
        KnowledgeEntry.embedding.l2_distance(query_embedding)
    ).limit(5).all()
    
    context = ""
    sources = []
    
    for entry in similar_entries:
        # Build richer context with source info
        source_label = ""
        if entry.source == "onedrive" and entry.source_file_name:
            source_label = f" (Sumber: {entry.source_file_name})"
        elif entry.source == "company":
            source_label = " (Sumber: Website GYS)"

        context += f"Dokumen: {entry.title}{source_label}\nIsi: {entry.content}\n\n"
        
        source_info = {"id": entry.id, "title": entry.title, "source": entry.source or "manual"}
        if entry.source_file_name:
            source_info["file_name"] = entry.source_file_name
        if entry.source_url:
            source_info["url"] = entry.source_url
        sources.append(source_info)
        
    # 3. Construct prompt for LLM
    if context.strip():
        system_prompt = (
            "Kamu adalah ShiftMind, asisten AI cerdas untuk PT Garuda Yamato Steel (GYS). "
            "Kamu membantu karyawan memahami SOP, prosedur, kebijakan perusahaan, dan informasi operasional.\n\n"
            f"{GYS_CONTEXT}\n\n"
            "ATURAN MENJAWAB:\n"
            "1. Jawab menggunakan Bahasa Indonesia yang MUDAH DIMENGERTI oleh semua level karyawan\n"
            "2. Jika konteks berisi informasi yang relevan, gunakan untuk menjawab dengan akurat\n"
            "3. Sebutkan nama dokumen sumber jika ada (contoh: 'Menurut SOP-HR-001...')\n"
            "4. Jika pertanyaan di luar konteks yang tersedia, katakan dengan jujur dan sarankan menghubungi departemen terkait\n"
            "5. JANGAN mengarang informasi yang tidak ada di konteks\n"
            "6. PENTING - FORMAT JAWABAN:\n"
            "   - Gunakan heading markdown (### Judul) untuk sub-bagian\n"
            "   - Gunakan **bold** untuk istilah penting\n"
            "   - Gunakan tabel markdown jika perlu perbandingan atau ringkasan terstruktur\n"
            "   - Gunakan numbered list (1. 2. 3.) untuk langkah-langkah prosedur\n"
            "   - Gunakan bullet list (- item) untuk daftar\n"
            "   - Buat analisis yang mendalam, bukan hanya mengutip dokumen\n"
            "   - Berikan rangkuman singkat di awal jawaban jika jawaban panjang\n"
            "7. Jika diminta analisis, buatkan:\n"
            "   - Tabel perbandingan jika ada data yang bisa dibandingkan\n"
            "   - Rangkuman poin-poin kunci dari dokumen\n"
            "   - Langkah-langkah prosedur yang jelas dan terstruktur\n"
            f"\n\nKONTEKS KNOWLEDGE BASE:\n{context}"
        )
    else:
        # Fallback persona if no context is found
        system_prompt = (
            "Kamu adalah ShiftMind, asisten AI cerdas untuk PT Garuda Yamato Steel (GYS). "
            "Kamu membantu karyawan memahami SOP, prosedur, kebijakan perusahaan, dan informasi operasional.\n\n"
            f"{GYS_CONTEXT}\n\n"
            "Saat ini tidak ada dokumen spesifik di knowledge base yang sesuai dengan pertanyaan user. "
            "Jawab berdasarkan pengetahuan umum tentang GYS di atas jika relevan. "
            "Jika pertanyaan sangat spesifik tentang SOP/prosedur yang belum ter-input, "
            "sarankan user untuk menghubungi departemen terkait atau minta admin untuk menambahkan "
            "dokumen tersebut ke knowledge base."
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
            # CRITICAL FIX: New entries are saved as status="draft" and require admin approval
            # before appearing in search results. This prevents KB pollution.
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
                from datetime import datetime, timedelta
                
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
                        status="draft",  # <-- CRITICAL: draft until admin approves
                        confidence_score=confidence_score,
                        embedding=history_embedding,
                        author_id=current_user.id
                    )
                    db.add(new_history_entry)
                
            db.commit()
        except Exception as e:
            print(f"Failed to save query log & history: {e}")
            db.rollback()
    
    return AskResponse(answer=answer, sources=sources)
