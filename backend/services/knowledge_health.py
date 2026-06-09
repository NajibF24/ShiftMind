from datetime import datetime, timedelta
import re
from typing import Optional
from db import Session
from models.knowledge import KnowledgeEntry
from models.query_log import QueryLog

def extract_numbers(text: str) -> list:
    """Extract all numbers from text for contradiction detection."""
    return re.findall(r'\d+\.?\d*', text)

def _explain_staleness(age_days: int, follow_up_queries: int) -> str:
    """Generate explanation for why a document is flagged as stale."""
    if follow_up_queries > 10:
        return f"Sering di-query ({follow_up_queries}x) tapi banyak follow-up"
    elif age_days > 365:
        return f"Sudah {age_days} hari tidak diupdate"
    elif age_days > 180:
        return "Dokumen lama dengan akses aktif"
    return "Potensi sudah outdated"

def analyze_knowledge_freshness(db: Session) -> list:
    """
    Deteksi knowledge entries yang mungkin sudah outdated
    berdasarkan tiga sinyal:
    1. Usia dokumen vs frekuensi diakses
    2. User feedback patterns dari query logs
    3. Kontradiksi antar dokumen dalam topik yang sama
    """
    stale_candidates = []
    
    cutoff = datetime.utcnow() - timedelta(days=180)
    
    old_but_accessed = db.query(KnowledgeEntry).filter(
        KnowledgeEntry.created_at < cutoff,
        KnowledgeEntry.source.in_(["manual", "onedrive"]),
    ).all()
    
    for entry in old_but_accessed:
        age_days = (datetime.utcnow() - entry.created_at).days
        
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
            if entry_a.embedding is not None and entry_b.embedding is not None:
                if entry_a.source_file_id != entry_b.source_file_id:
                    numbers_a = extract_numbers(entry_a.content)
                    numbers_b = extract_numbers(entry_b.content)
                    
                    if numbers_a and numbers_b and numbers_a != numbers_b:
                        contradictions.append({
                            "doc_a": entry_a.title,
                            "doc_b": entry_b.title,
                            "potential_conflict": "Numerical values differ",
                            "numbers_a": numbers_a[:5],
                            "numbers_b": numbers_b[:5]
                        })
    
    return contradictions


def get_knowledge_health_summary(db: Session) -> dict:
    """Get summary statistics for knowledge health dashboard."""
    total_entries = db.query(KnowledgeEntry).count()
    
    cutoff_90 = datetime.utcnow() - timedelta(days=90)
    cutoff_180 = datetime.utcnow() - timedelta(days=180)
    
    fresh_count = db.query(KnowledgeEntry).filter(
        KnowledgeEntry.created_at >= cutoff_90
    ).count()
    
    stale_count = db.query(KnowledgeEntry).filter(
        KnowledgeEntry.created_at < cutoff_180,
        KnowledgeEntry.source.in_(["manual", "onedrive"])
    ).count()
    
    contradictions = detect_knowledge_contradictions(db)
    
    return {
        "total_entries": total_entries,
        "fresh_count": fresh_count,
        "stale_count": stale_count,
        "contradiction_count": len(contradictions),
        "stale_entries": analyze_knowledge_freshness(db)[:10],
        "contradictions": contradictions[:5]
    }