from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from db import get_db
from models.user import User
from models.work_journal import WorkJournal
from models.knowledge import KnowledgeEntry
from services.auth import get_current_user
from services.ai_service import generate_embedding, get_chat_completion

router = APIRouter()


# ─── Schemas ─────────────────────────────────────────────────────────────────

class JournalCreate(BaseModel):
    title: str
    content: str
    department: Optional[str] = None
    area: Optional[str] = None
    is_public: Optional[int] = 1


class JournalResponse(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    category: Optional[str]
    tags: Optional[List[str]]
    difficulty: Optional[str]
    department: Optional[str]
    area: Optional[str]
    ai_summary: Optional[str]
    ai_lessons_learned: Optional[str]
    ai_related_sops: Optional[str]
    is_public: int
    helpful_count: int
    created_at: str
    author_name: Optional[str] = None

    class Config:
        from_attributes = True


# ─── AI Processing ──────────────────────────────────────────────────────────

def _ai_process_journal(title: str, content: str, related_knowledge: list) -> dict:
    """AI analyzes journal entry: categorize, tag, summarize, extract lessons."""

    kb_context = ""
    if related_knowledge:
        for entry in related_knowledge[:3]:
            kb_context += f"- {entry.title}: {entry.content[:200]}...\n"

    messages = [
        {
            "role": "system",
            "content": (
                "Kamu adalah ShiftMind AI untuk PT Garuda Yamato Steel (GYS), pabrik baja.\n"
                "User baru saja mencatat aktivitas kerja hariannya. Tugasmu:\n\n"
                "Jawab dalam format JSON SAJA (tanpa markdown code block), dengan field:\n"
                "{\n"
                '  "category": "kategori kerja (contoh: EAF Operation, Rolling Mill, Quality Control, Maintenance, Warehouse, Safety, Administration, IT Support)",\n'
                '  "tags": ["tag1", "tag2", "tag3"],  // keyword penting, max 5\n'
                '  "difficulty": "routine|troubleshooting|critical",  // tingkat kesulitan\n'
                '  "summary": "ringkasan 1-2 kalimat",\n'
                '  "lessons_learned": "pelajaran atau insight penting dari aktivitas ini",\n'
                '  "related_sops": "SOP atau dokumen terkait yang mungkin relevan (berdasarkan knowledge base jika ada)"\n'
                "}\n\n"
                "PENTING: Output HANYA JSON, tanpa penjelasan tambahan."
            )
        },
        {
            "role": "user",
            "content": (
                f"Judul: {title}\n"
                f"Isi: {content}\n\n"
                f"Knowledge Base terkait:\n{kb_context if kb_context else 'Tidak ada data terkait.'}"
            )
        }
    ]

    try:
        response = get_chat_completion(messages)
        # Parse JSON from response
        import json
        # Strip markdown code fences if present
        clean = response.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
            if clean.endswith("```"):
                clean = clean[:-3]
            clean = clean.strip()
        
        data = json.loads(clean)
        return {
            "category": data.get("category", "General"),
            "tags": data.get("tags", []),
            "difficulty": data.get("difficulty", "routine"),
            "ai_summary": data.get("summary", ""),
            "ai_lessons_learned": data.get("lessons_learned", ""),
            "ai_related_sops": data.get("related_sops", ""),
        }
    except Exception as e:
        print(f"AI journal processing failed: {e}")
        return {
            "category": "General",
            "tags": [],
            "difficulty": "routine",
            "ai_summary": "",
            "ai_lessons_learned": "",
            "ai_related_sops": "",
        }


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.post("", response_model=JournalResponse)
def create_journal(
    data: JournalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Log a work journal entry. AI auto-processes it."""

    # Generate embedding for semantic search
    text_for_embed = f"{data.title}\n{data.content}"
    embedding = generate_embedding(text_for_embed)

    # Find related knowledge entries via vector search
    related = db.query(KnowledgeEntry).order_by(
        KnowledgeEntry.embedding.l2_distance(embedding)
    ).limit(3).all()

    # AI processing
    ai_result = _ai_process_journal(data.title, data.content, related)

    journal = WorkJournal(
        user_id=current_user.id,
        title=data.title,
        content=data.content,
        department=data.department,
        area=data.area,
        is_public=data.is_public if data.is_public is not None else 1,
        category=ai_result["category"],
        tags=ai_result["tags"],
        difficulty=ai_result["difficulty"],
        ai_summary=ai_result["ai_summary"],
        ai_lessons_learned=ai_result["ai_lessons_learned"],
        ai_related_sops=ai_result["ai_related_sops"],
        embedding=embedding,
    )

    db.add(journal)

    # Also inject into main knowledge base as tacit knowledge (confidence 0.7)
    # Skip if similar entry already exists for this user
    existing_kb = db.query(KnowledgeEntry).filter(
        KnowledgeEntry.source == "journal",
        KnowledgeEntry.author_id == current_user.id,
        KnowledgeEntry.title == f"[Work Journal] {data.title}"
    ).first()
    
    if not existing_kb:
        kb_entry = KnowledgeEntry(
            title=f"[Work Journal] {data.title}",
            content=f"{data.content}\n\nAI Summary: {ai_result['ai_summary']}\nLessons: {ai_result['ai_lessons_learned']}",
            category=ai_result["category"],
            department=data.department,
            source="journal",
            confidence_score=0.7,
            embedding=embedding,
            author_id=current_user.id,
        )
        db.add(kb_entry)

    db.commit()
    db.refresh(journal)

    return _to_response(journal, current_user.display_name or current_user.username)


@router.get("", response_model=List[JournalResponse])
def list_journals(
    user_id: Optional[int] = None,
    category: Optional[str] = None,
    area: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List journal entries. Shows public + own private entries."""
    from models.user import User as UserModel

    query = db.query(WorkJournal, UserModel.display_name, UserModel.username).join(
        UserModel, WorkJournal.user_id == UserModel.id
    )

    # Show public entries + own private entries
    query = query.filter(
        (WorkJournal.is_public == 1) | (WorkJournal.user_id == current_user.id)
    )

    if user_id:
        query = query.filter(WorkJournal.user_id == user_id)
    if category:
        query = query.filter(WorkJournal.category == category)
    if area:
        query = query.filter(WorkJournal.area == area)
    if search:
        # Semantic search
        search_embedding = generate_embedding(search)
        query = query.order_by(WorkJournal.embedding.l2_distance(search_embedding))
    else:
        query = query.order_by(desc(WorkJournal.created_at))

    results = query.limit(limit).all()
    return [
        _to_response(j, display_name or username)
        for j, display_name, username in results
    ]


@router.get("/my-stats")
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's journal statistics + AI insights about their work patterns."""
    journals = db.query(WorkJournal).filter(
        WorkJournal.user_id == current_user.id
    ).order_by(desc(WorkJournal.created_at)).all()

    if not journals:
        return {
            "total_entries": 0,
            "categories": {},
            "top_tags": [],
            "streak_days": 0,
            "ai_work_profile": "Belum ada data untuk dianalisis. Mulai catat aktivitas kerja harian Anda!",
        }

    # Category breakdown
    categories = {}
    all_tags = []
    for j in journals:
        cat = j.category or "General"
        categories[cat] = categories.get(cat, 0) + 1
        if j.tags:
            all_tags.extend(j.tags)

    # Tag frequency
    from collections import Counter
    tag_freq = Counter(all_tags).most_common(10)

    # Streak calculation
    streak = 0
    today = datetime.utcnow().date()
    check_date = today
    entry_dates = set(j.created_at.date() for j in journals if j.created_at)
    while check_date in entry_dates:
        streak += 1
        check_date -= timedelta(days=1)

    # AI work profile (only if enough data)
    ai_profile = ""
    if len(journals) >= 3:
        recent_summaries = "\n".join([
            f"- [{j.category}] {j.title}: {j.ai_summary or j.content[:100]}"
            for j in journals[:15]
        ])
        messages = [
            {
                "role": "system",
                "content": (
                    "Kamu adalah ShiftMind AI. Analisis pola kerja karyawan ini berdasarkan journal entries mereka.\n"
                    "Berikan profil singkat:\n"
                    "1. **Keahlian Utama**: Bidang apa yang paling sering dikerjakan?\n"
                    "2. **Pola Kerja**: Apakah ada pola menarik?\n"
                    "3. **Growth Area**: Area apa yang bisa dikembangkan?\n"
                    "4. **Saran**: Satu saran actionable.\n\n"
                    "Jawab singkat, 4-6 kalimat, Bahasa Indonesia."
                )
            },
            {"role": "user", "content": f"Journal entries karyawan:\n{recent_summaries}"}
        ]
        try:
            ai_profile = get_chat_completion(messages)
        except:
            ai_profile = "AI profil tidak tersedia saat ini."

    return {
        "total_entries": len(journals),
        "categories": categories,
        "top_tags": [{"tag": t, "count": c} for t, c in tag_freq],
        "streak_days": streak,
        "ai_work_profile": ai_profile,
        "recent_difficulty": {
            "routine": sum(1 for j in journals[:20] if j.difficulty == "routine"),
            "troubleshooting": sum(1 for j in journals[:20] if j.difficulty == "troubleshooting"),
            "critical": sum(1 for j in journals[:20] if j.difficulty == "critical"),
        }
    }


@router.get("/ai-digest")
def get_ai_digest(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """AI-generated weekly digest of all team journal entries."""
    since = datetime.utcnow() - timedelta(days=days)

    journals = db.query(WorkJournal).filter(
        WorkJournal.created_at >= since,
        WorkJournal.is_public == 1
    ).order_by(desc(WorkJournal.created_at)).limit(50).all()

    if not journals:
        return {"digest": "Tidak ada journal entries dalam periode ini.", "period_days": days}

    entries_text = "\n".join([
        f"- [{j.category}] {j.title} (oleh user #{j.user_id}): {j.ai_summary or j.content[:150]}"
        for j in journals
    ])

    messages = [
        {
            "role": "system",
            "content": (
                "Kamu adalah ShiftMind AI untuk PT Garuda Yamato Steel.\n"
                "Buat WEEKLY DIGEST dari seluruh aktivitas kerja tim berdasarkan journal entries.\n\n"
                "Format:\n"
                "### Ringkasan Minggu Ini\n"
                "[Overview 2-3 kalimat]\n\n"
                "### Highlight Utama\n"
                "[3-5 bullet points hal penting]\n\n"
                "### Masalah & Troubleshooting\n"
                "[Masalah yang muncul dan bagaimana diselesaikan]\n\n"
                "### Knowledge Baru Tercatat\n"
                "[Tacit knowledge berharga yang baru di-capture]\n\n"
                "### Rekomendasi\n"
                "[2-3 saran untuk minggu depan]\n\n"
                "Bahasa Indonesia, singkat dan actionable."
            )
        },
        {"role": "user", "content": f"Journal entries {days} hari terakhir:\n{entries_text}"}
    ]

    try:
        digest = get_chat_completion(messages)
    except:
        digest = "AI digest tidak tersedia saat ini."

    return {
        "digest": digest,
        "period_days": days,
        "total_entries": len(journals),
        "contributors": len(set(j.user_id for j in journals)),
    }


@router.post("/{journal_id}/helpful")
def mark_helpful(
    journal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a journal entry as helpful (upvote)."""
    journal = db.query(WorkJournal).filter(WorkJournal.id == journal_id).first()
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found")
    journal.helpful_count = (journal.helpful_count or 0) + 1
    db.commit()
    return {"message": "Marked as helpful", "helpful_count": journal.helpful_count}


@router.get("/suggest-task")
def suggest_task(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """AI predicts what the user might need to do based on their journal patterns."""
    # Get user's recent journals
    journals = db.query(WorkJournal).filter(
        WorkJournal.user_id == current_user.id
    ).order_by(desc(WorkJournal.created_at)).limit(20).all()

    if len(journals) < 3:
        return {"suggestion": "Catat lebih banyak aktivitas kerja agar AI bisa mempelajari pola kerja Anda.", "confidence": 0}

    today = datetime.utcnow()
    day_name = today.strftime("%A")

    entries_text = "\n".join([
        f"- {j.created_at.strftime('%A %Y-%m-%d') if j.created_at else 'N/A'} [{j.category}]: {j.title}"
        for j in journals
    ])

    messages = [
        {
            "role": "system",
            "content": (
                "Kamu adalah ShiftMind AI. Analisis pola kerja user dari journal entries mereka.\n"
                f"Hari ini adalah {day_name}.\n\n"
                "Berdasarkan pola yang kamu lihat, prediksi:\n"
                "1. Apa yang kemungkinan perlu dikerjakan hari ini?\n"
                "2. Apakah ada tugas rutin yang biasanya dilakukan di hari ini?\n"
                "3. Ada reminder dari entries sebelumnya?\n\n"
                "Jawab singkat 2-3 kalimat, langsung ke poin, Bahasa Indonesia."
            )
        },
        {"role": "user", "content": f"Riwayat journal:\n{entries_text}"}
    ]

    try:
        suggestion = get_chat_completion(messages)
    except:
        suggestion = "Prediksi tidak tersedia saat ini."

    return {"suggestion": suggestion, "day": day_name, "based_on": len(journals)}


# ─── Helper ──────────────────────────────────────────────────────────────────

def _to_response(j: WorkJournal, author_name: str = None) -> JournalResponse:
    return JournalResponse(
        id=j.id,
        user_id=j.user_id,
        title=j.title,
        content=j.content,
        category=j.category,
        tags=j.tags,
        difficulty=j.difficulty,
        department=j.department,
        area=j.area,
        ai_summary=j.ai_summary,
        ai_lessons_learned=j.ai_lessons_learned,
        ai_related_sops=j.ai_related_sops,
        is_public=j.is_public or 1,
        helpful_count=j.helpful_count or 0,
        created_at=j.created_at.isoformat() if j.created_at else "",
        author_name=author_name,
    )
