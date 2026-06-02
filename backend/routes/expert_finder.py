from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from collections import Counter

from db import get_db
from models.user import User
from models.work_journal import WorkJournal
from models.workflow import Workflow
from models.knowledge import KnowledgeEntry
from models.query_log import QueryLog
from services.auth import get_current_user

router = APIRouter()


@router.get("")
def find_experts(
    topic: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Find domain experts based on journal entries, workflows, and knowledge contributions.
    
    Scoring:
    - Journal entries on topic: 3 pts each
    - Workflows on topic: 5 pts each  
    - Knowledge contributions: 2 pts each
    - Helpful votes received: 1 pt each
    """
    from models.user import User as UserModel

    all_users = db.query(UserModel).all()
    expert_scores = []

    for user in all_users:
        score = 0
        expertise_areas = []
        entry_count = 0

        # --- Journal-based expertise ---
        journal_query = db.query(WorkJournal).filter(WorkJournal.user_id == user.id)
        if topic:
            journal_query = journal_query.filter(
                (WorkJournal.title.ilike(f"%{topic}%")) |
                (WorkJournal.content.ilike(f"%{topic}%")) |
                (WorkJournal.category.ilike(f"%{topic}%"))
            )
        journals = journal_query.all()
        journal_score = len(journals) * 3
        score += journal_score
        entry_count += len(journals)

        # Extract expertise areas from journal categories
        for j in journals:
            if j.category and j.category not in expertise_areas:
                expertise_areas.append(j.category)

        # Helpful votes
        helpful_sum = sum(j.helpful_count or 0 for j in journals)
        score += helpful_sum

        # --- Workflow-based expertise ---
        wf_query = db.query(Workflow).filter(Workflow.user_id == user.id)
        if topic:
            wf_query = wf_query.filter(
                (Workflow.title.ilike(f"%{topic}%")) |
                (Workflow.description.ilike(f"%{topic}%")) |
                (Workflow.category.ilike(f"%{topic}%"))
            )
        workflows = wf_query.all()
        score += len(workflows) * 5
        entry_count += len(workflows)

        for w in workflows:
            if w.category and w.category not in expertise_areas:
                expertise_areas.append(w.category)

        # --- Knowledge contributions ---
        kb_query = db.query(KnowledgeEntry).filter(KnowledgeEntry.author_id == user.id)
        if topic:
            kb_query = kb_query.filter(
                (KnowledgeEntry.title.ilike(f"%{topic}%")) |
                (KnowledgeEntry.content.ilike(f"%{topic}%"))
            )
        kb_entries = kb_query.count()
        score += kb_entries * 2
        entry_count += kb_entries

        if score > 0:
            expert_scores.append({
                "user_id": user.id,
                "username": user.username,
                "display_name": user.display_name or user.username,
                "score": score,
                "journal_entries": len(journals),
                "workflows": len(workflows),
                "knowledge_entries": kb_entries,
                "helpful_votes": helpful_sum,
                "expertise_areas": expertise_areas[:5],
                "total_contributions": entry_count,
            })

    # Sort by score descending
    expert_scores.sort(key=lambda x: x["score"], reverse=True)

    return {
        "topic": topic or "all",
        "experts": expert_scores[:20],
        "total_contributors": len(expert_scores),
    }


@router.get("/leaderboard")
def get_leaderboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Gamified leaderboard: who contributes the most knowledge."""
    from models.user import User as UserModel

    all_users = db.query(UserModel).all()
    leaderboard = []

    for user in all_users:
        journals = db.query(func.count(WorkJournal.id)).filter(
            WorkJournal.user_id == user.id
        ).scalar() or 0

        workflows = db.query(func.count(Workflow.id)).filter(
            Workflow.user_id == user.id
        ).scalar() or 0

        kb = db.query(func.count(KnowledgeEntry.id)).filter(
            KnowledgeEntry.author_id == user.id,
            KnowledgeEntry.source == "manual"
        ).scalar() or 0

        helpful = db.query(func.coalesce(func.sum(WorkJournal.helpful_count), 0)).filter(
            WorkJournal.user_id == user.id
        ).scalar() or 0

        queries = db.query(func.count(QueryLog.id)).filter(
            QueryLog.user_id == user.id
        ).scalar() or 0

        total_score = (journals * 3) + (workflows * 5) + (kb * 2) + helpful + queries

        if total_score > 0:
            # Determine badge
            if total_score >= 100:
                badge = "Knowledge Master"
                badge_color = "#FFD700"
            elif total_score >= 50:
                badge = "Expert Contributor"
                badge_color = "#C0C0C0"
            elif total_score >= 20:
                badge = "Active Learner"
                badge_color = "#CD7F32"
            elif total_score >= 5:
                badge = "Rising Star"
                badge_color = "var(--neon-cyan)"
            else:
                badge = "Newcomer"
                badge_color = "var(--text-muted)"

            leaderboard.append({
                "user_id": user.id,
                "display_name": user.display_name or user.username,
                "score": total_score,
                "journals": journals,
                "workflows": workflows,
                "knowledge": kb,
                "helpful_votes": helpful,
                "queries": queries,
                "badge": badge,
                "badge_color": badge_color,
            })

    leaderboard.sort(key=lambda x: x["score"], reverse=True)

    return {
        "leaderboard": leaderboard[:20],
        "total_participants": len(leaderboard),
    }
