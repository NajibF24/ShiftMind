from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract
from datetime import datetime, timedelta, date
from typing import Optional
from collections import Counter
import re

from db import get_db
from models.user import User
from models.knowledge import KnowledgeEntry
from models.query_log import QueryLog
from services.auth import get_current_user
from services.ai_service import get_chat_completion

router = APIRouter()


@router.get("/knowledge-gaps")
def get_knowledge_gaps(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze queries to find topics frequently asked but poorly covered in knowledge base."""
    since = datetime.utcnow() - timedelta(days=days)

    # Get all queries in period
    queries = db.query(QueryLog).filter(QueryLog.created_at >= since).all()

    if not queries:
        return {"gaps": [], "total_queries": 0, "period_days": days}

    # Extract keywords from queries
    stop_words = {
        "apa", "bagaimana", "cara", "yang", "di", "ke", "dari", "dan", "atau",
        "untuk", "dengan", "ini", "itu", "adalah", "pada", "dalam", "tidak",
        "bisa", "bagai", "mana", "siapa", "kapan", "dimana", "kenapa", "mengapa",
        "tolong", "jelaskan", "berikan", "mohon", "saya", "mau", "ingin", "tahu",
        "the", "is", "are", "what", "how", "can", "do", "does", "a", "an", "to",
        "of", "in", "on", "at", "for", "with", "this", "that", "it", "be", "was",
    }

    keyword_counter = Counter()
    topic_queries = {}  # keyword -> list of original queries

    for q in queries:
        words = re.findall(r'\b[a-zA-Z]{3,}\b', q.query.lower())
        unique_words = set(words) - stop_words
        for word in unique_words:
            keyword_counter[word] += 1
            if word not in topic_queries:
                topic_queries[word] = []
            topic_queries[word].append(q.query)

    # Get top 20 most asked keywords
    top_keywords = keyword_counter.most_common(20)

    # Check which topics have poor coverage in knowledge base
    gaps = []
    for keyword, count in top_keywords:
        # Search knowledge entries for this keyword
        kb_count = db.query(func.count(KnowledgeEntry.id)).filter(
            KnowledgeEntry.content.ilike(f"%{keyword}%")
        ).scalar() or 0

        coverage_ratio = kb_count / max(count, 1)
        gaps.append({
            "topic": keyword,
            "query_count": count,
            "knowledge_entries": kb_count,
            "coverage_ratio": round(coverage_ratio, 2),
            "status": "well-covered" if coverage_ratio >= 1.0 else ("partial" if coverage_ratio >= 0.3 else "gap"),
            "sample_queries": topic_queries.get(keyword, [])[:3],
        })

    # Sort by gap severity (lowest coverage ratio first)
    gaps.sort(key=lambda x: x["coverage_ratio"])

    return {
        "gaps": gaps,
        "total_queries": len(queries),
        "period_days": days,
        "total_gaps": len([g for g in gaps if g["status"] == "gap"]),
        "total_partial": len([g for g in gaps if g["status"] == "partial"]),
    }


@router.get("/query-trends")
def get_query_trends(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get query volume trends over time."""
    since = datetime.utcnow() - timedelta(days=days)

    # Daily query counts
    daily = db.query(
        func.date(QueryLog.created_at).label("day"),
        func.count(QueryLog.id).label("count")
    ).filter(
        QueryLog.created_at >= since
    ).group_by(
        func.date(QueryLog.created_at)
    ).order_by(
        func.date(QueryLog.created_at)
    ).all()

    # Hourly distribution (what time do people ask most)
    hourly = db.query(
        extract("hour", QueryLog.created_at).label("hour"),
        func.count(QueryLog.id).label("count")
    ).filter(
        QueryLog.created_at >= since
    ).group_by(
        extract("hour", QueryLog.created_at)
    ).order_by(
        extract("hour", QueryLog.created_at)
    ).all()

    # Top users
    top_users = db.query(
        QueryLog.user_id,
        func.count(QueryLog.id).label("count")
    ).filter(
        QueryLog.created_at >= since
    ).group_by(QueryLog.user_id).order_by(desc("count")).limit(10).all()

    total = db.query(func.count(QueryLog.id)).filter(QueryLog.created_at >= since).scalar() or 0

    return {
        "period_days": days,
        "total_queries": total,
        "daily_trend": [{"date": str(d[0]), "count": d[1]} for d in daily],
        "hourly_distribution": [{"hour": int(h[0]), "count": h[1]} for h in hourly],
        "top_users": [{"user_id": u[0], "query_count": u[1]} for u in top_users],
        "avg_daily": round(total / max(days, 1), 1),
    }


@router.get("/ai-insight")
def get_ai_insight(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """AI-generated insight about knowledge usage patterns."""
    since = datetime.utcnow() - timedelta(days=days)

    queries = db.query(QueryLog).filter(QueryLog.created_at >= since).order_by(desc(QueryLog.created_at)).limit(50).all()

    if not queries:
        return {"insight": "Belum ada data query untuk dianalisis.", "period_days": days}

    query_list = "\n".join([f"- {q.query}" for q in queries[:30]])

    messages = [
        {
            "role": "system",
            "content": (
                "Kamu adalah Knowledge Analytics AI untuk PT Garuda Yamato Steel (GYS). "
                "Analisis daftar pertanyaan karyawan berikut dan berikan insight:\n\n"
                "1. **Topik Trending**: Apa yang paling banyak ditanyakan?\n"
                "2. **Knowledge Gap**: Topik apa yang sepertinya belum ter-cover dengan baik?\n"
                "3. **Rekomendasi**: SOP/dokumen apa yang perlu ditambahkan ke knowledge base?\n"
                "4. **Pola Menarik**: Ada pola atau concern menarik dari pertanyaan ini?\n\n"
                "Jawab singkat, padat, dalam Bahasa Indonesia."
            )
        },
        {
            "role": "user",
            "content": f"Daftar pertanyaan karyawan GYS dalam {days} hari terakhir:\n{query_list}"
        }
    ]

    try:
        insight = get_chat_completion(messages)
    except Exception:
        insight = "AI insight tidak tersedia saat ini."

    return {
        "insight": insight,
        "total_queries_analyzed": len(queries),
        "period_days": days,
    }
