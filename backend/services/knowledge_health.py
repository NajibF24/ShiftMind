from datetime import datetime, timedelta
import re
from sqlalchemy.orm import Session
from models.knowledge import KnowledgeEntry
from models.query_log import QueryLog

def extract_numbers(text: str) -> list:
    return re.findall(r'\d+\.?\d*', text) if text else []

def _explain_staleness(age_days: int, follow_up_queries: int) -> str:
    if follow_up_queries > 10:
        return f"Sering di-query ({follow_up_queries}x) tapi banyak follow-up"
    elif age_days > 365:
        return f"Sudah {age_days} hari tidak diupdate"
    return "Dokumen lama dengan akses aktif"

def analyze_knowledge_freshness(db: Session) -> list:
    stale_candidates = []
    cutoff = datetime.utcnow() - timedelta(days=180)
    old_entries = db.query(KnowledgeEntry).filter(
        KnowledgeEntry.created_at < cutoff,
        KnowledgeEntry.source.in_(["manual", "onedrive"]),
    ).limit(20).all()

    for entry in old_entries:
        age_days = (datetime.utcnow() - entry.created_at).days
        follow_up_queries = db.query(QueryLog).filter(
            QueryLog.response.contains(entry.title),
            QueryLog.created_at > datetime.utcnow() - timedelta(days=30)
        ).count()
        staleness_score = (age_days / 30) * 0.4 + follow_up_queries * 0.6
        if staleness_score > 3.0:
            stale_candidates.append({
                "entry_id": entry.id, "title": entry.title,
                "age_days": age_days, "staleness_score": round(staleness_score, 2),
                "reason": _explain_staleness(age_days, follow_up_queries)
            })
    return sorted(stale_candidates, key=lambda x: x["staleness_score"], reverse=True)

def detect_knowledge_contradictions(db: Session) -> list:
    contradictions = []
    entries = db.query(KnowledgeEntry).filter(
        KnowledgeEntry.source.in_(["manual", "onedrive"]),
        KnowledgeEntry.embedding.isnot(None)
    ).order_by(KnowledgeEntry.created_at.desc()).limit(20).all()

    for i, entry_a in enumerate(entries):
        for entry_b in entries[i+1:]:
            if len(contradictions) >= 5:
                break
            if entry_a.source_file_id and entry_b.source_file_id and entry_a.source_file_id == entry_b.source_file_id:
                continue
            numbers_a = extract_numbers(entry_a.content)
            numbers_b = extract_numbers(entry_b.content)
            if numbers_a and numbers_b and numbers_a != numbers_b:
                contradictions.append({
                    "doc_a": entry_a.title, "doc_b": entry_b.title,
                    "potential_conflict": "Numerical values differ",
                    "numbers_a": numbers_a[:5], "numbers_b": numbers_b[:5]
                })
    return contradictions

def get_knowledge_health_summary(db: Session) -> dict:
    total_entries = db.query(KnowledgeEntry).count()
    cutoff_90 = datetime.utcnow() - timedelta(days=90)
    cutoff_180 = datetime.utcnow() - timedelta(days=180)
    fresh_count = db.query(KnowledgeEntry).filter(KnowledgeEntry.created_at >= cutoff_90).count()
    stale_count = db.query(KnowledgeEntry).filter(KnowledgeEntry.created_at < cutoff_180, KnowledgeEntry.source.in_(["manual", "onedrive"])).count()

    contradictions = detect_knowledge_contradictions(db)

    return {
        "total_entries": total_entries, "fresh_count": fresh_count, "stale_count": stale_count,
        "contradiction_count": len(contradictions),
        "stale_entries": analyze_knowledge_freshness(db)[:10],
        "contradictions": contradictions[:5]
    }
