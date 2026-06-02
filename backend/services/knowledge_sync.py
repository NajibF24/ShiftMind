"""
Knowledge Sync Service — Orchestrates OneDrive document sync into the knowledge base.
Downloads files, parses them, chunks the text, generates embeddings, and stores in pgvector.
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from models.knowledge import KnowledgeEntry
from models.user import User  # Required for SQLAlchemy ForeignKey mapping
from services.onedrive_service import (
    get_access_token,
    list_files_recursive,
    download_file,
    is_configured,
)
from services.document_parser import parse_document, chunk_text
from services.ai_service import generate_embedding

logger = logging.getLogger(__name__)


class SyncResult:
    """Result of a sync operation."""
    def __init__(self):
        self.files_found = 0
        self.files_synced = 0
        self.files_skipped = 0
        self.files_failed = 0
        self.chunks_created = 0
        self.errors = []

    def to_dict(self) -> dict:
        return {
            "files_found": self.files_found,
            "files_synced": self.files_synced,
            "files_skipped": self.files_skipped,
            "files_failed": self.files_failed,
            "chunks_created": self.chunks_created,
            "errors": self.errors[:10],  # Limit error messages
        }


def sync_onedrive_documents(db: Session) -> SyncResult:
    """
    Main sync function. Scans OneDrive folder, downloads new/updated files,
    parses them, creates knowledge entries with embeddings.
    """
    result = SyncResult()

    if not is_configured():
        result.errors.append("Microsoft Graph credentials not configured")
        return result

    # 1. Get access token
    token = get_access_token()
    if not token:
        result.errors.append("Failed to acquire Microsoft Graph access token")
        return result

    # 2. List all files in the SOP folder
    logger.info("Scanning OneDrive folder for SOP/Policy documents...")
    files = list_files_recursive(token)
    result.files_found = len(files)
    logger.info(f"Found {len(files)} supported documents")

    # 3. Process each file
    for file_info in files:
        try:
            file_id = file_info["id"]
            file_name = file_info["name"]
            last_modified = file_info.get("lastModifiedDateTime", "")

            # Check if already synced and up-to-date
            existing = db.query(KnowledgeEntry).filter(
                KnowledgeEntry.source == "onedrive",
                KnowledgeEntry.source_file_id == file_id,
            ).first()

            if existing and existing.last_synced_at:
                # 🔴 FIX: Compare as datetime objects, not strings
                # OneDrive returns ISO 8601 like "2025-01-15T10:30:00Z"
                if last_modified:
                    try:
                        from dateutil.parser import isoparse
                        od_modified = isoparse(last_modified)
                        # Ensure both are timezone-aware for comparison
                        synced_at = existing.last_synced_at
                        if synced_at.tzinfo is None:
                            synced_at = synced_at.replace(tzinfo=timezone.utc)
                        if od_modified.tzinfo is None:
                            od_modified = od_modified.replace(tzinfo=timezone.utc)
                        if synced_at >= od_modified:
                            result.files_skipped += 1
                            logger.debug(f"Skipping unchanged file: {file_name}")
                            continue
                    except Exception as e:
                        logger.warning(f"Date comparison failed for {file_name}, re-syncing: {e}")

            # 4. Download file
            logger.info(f"Downloading: {file_name}")
            content = download_file(token, file_id)
            if not content:
                result.files_failed += 1
                result.errors.append(f"Failed to download: {file_name}")
                continue

            # 5. Parse document
            text = parse_document(content, file_name)
            if not text or not text.strip():
                result.files_failed += 1
                result.errors.append(f"Failed to parse or empty: {file_name}")
                continue

            # 6. Delete old entries for this file (full re-sync per file)
            db.query(KnowledgeEntry).filter(
                KnowledgeEntry.source == "onedrive",
                KnowledgeEntry.source_file_id == file_id,
            ).delete()

            # 7. Chunk and create entries
            chunks = chunk_text(text, chunk_size=500, overlap=50)
            parent_path = file_info.get("parentPath", "")
            category = _derive_category(parent_path, file_name)

            for idx, chunk in enumerate(chunks):
                # Build a descriptive title
                if len(chunks) == 1:
                    title = f"SOP: {file_name}"
                else:
                    title = f"SOP: {file_name} (Bagian {idx + 1}/{len(chunks)})"

                # Generate embedding
                embedding = generate_embedding(title + " " + chunk)

                entry = KnowledgeEntry(
                    title=title,
                    content=chunk,
                    department=_derive_department(parent_path),
                    category=category,
                    author_id=None,
                    confidence_score=0.9,
                    source="onedrive",
                    source_file_id=file_id,
                    source_file_name=file_name,
                    source_url=file_info.get("webUrl", ""),
                    last_synced_at=datetime.now(timezone.utc),
                    chunk_index=idx,
                    embedding=embedding,
                )
                db.add(entry)
                result.chunks_created += 1

            db.commit()
            result.files_synced += 1
            logger.info(f"Synced {file_name}: {len(chunks)} chunks")

        except Exception as e:
            db.rollback()
            result.files_failed += 1
            result.errors.append(f"Error processing {file_info.get('name', 'unknown')}: {str(e)}")
            logger.error(f"Error syncing file: {e}", exc_info=True)

    logger.info(f"Sync complete: {result.to_dict()}")
    return result


def _derive_category(parent_path: str, filename: str) -> str:
    """Derive a category from the folder path or filename."""
    path_lower = parent_path.lower()
    name_lower = filename.lower()

    if "sop" in path_lower or "sop" in name_lower:
        return "SOP"
    elif "policy" in path_lower or "kebijakan" in path_lower or "policy" in name_lower:
        return "Policy"
    elif "procedure" in path_lower or "prosedur" in path_lower or "procedure" in name_lower:
        return "Procedure"
    elif "guideline" in path_lower or "panduan" in path_lower:
        return "Guideline"
    elif "form" in path_lower or "formulir" in path_lower:
        return "Form"
    elif "manual" in path_lower:
        return "Manual"
    else:
        return "Document"


def _derive_department(parent_path: str) -> Optional[str]:
    """Try to derive department from folder structure."""
    path_lower = parent_path.lower()

    department_map = {
        "hrd": "HRD",
        "hr": "HRD",
        "human resource": "HRD",
        "finance": "Finance",
        "keuangan": "Finance",
        "production": "Production",
        "produksi": "Production",
        "quality": "Quality",
        "qa": "Quality",
        "qc": "Quality",
        "safety": "HSE",
        "hse": "HSE",
        "k3": "HSE",
        "environment": "HSE",
        "lingkungan": "HSE",
        "maintenance": "Maintenance",
        "engineering": "Engineering",
        "warehouse": "Warehouse",
        "gudang": "Warehouse",
        "logistics": "Logistics",
        "logistik": "Logistics",
        "purchasing": "Purchasing",
        "procurement": "Purchasing",
        "sales": "Sales",
        "marketing": "Marketing",
        "it": "IT",
        "legal": "Legal",
        "general affair": "General Affairs",
        "ga": "General Affairs",
    }

    for keyword, dept in department_map.items():
        if keyword in path_lower:
            return dept

    return None
