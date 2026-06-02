from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import engine, Base

# Import models to ensure they are registered with SQLAlchemy
import models.user
import models.knowledge
import models.query_log
import models.work_journal
import models.workflow
import models.checklist
import models.approval
import models.notification
import models.settings

# Import routes
from routes import auth, knowledge, ask, dashboard, sync, analytics, work_journal, workflow, expert_finder, checklist, approval, notification, export, whatsapp

# Create database tables (in production use alembic for migrations)
import sqlalchemy as sa
with engine.connect() as conn:
    conn.execute(sa.text("CREATE EXTENSION IF NOT EXISTS vector"))
    conn.commit()

Base.metadata.create_all(bind=engine)

from fastapi.staticfiles import StaticFiles

app = FastAPI(title="ShiftMind API", version="2.0")

import os
os.makedirs("/app/static", exist_ok=True)
app.mount("/static", StaticFiles(directory="/app/static"), name="static")

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(knowledge.router, prefix="/api/knowledge", tags=["knowledge"])
app.include_router(ask.router, prefix="/api/ask", tags=["ask"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(sync.router, prefix="/api/sync", tags=["sync"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(work_journal.router, prefix="/api/journal", tags=["work-journal"])
app.include_router(workflow.router, prefix="/api/workflow", tags=["workflow"])
app.include_router(expert_finder.router, prefix="/api/experts", tags=["expert-finder"])
app.include_router(checklist.router, prefix="/api/checklists", tags=["checklists"])
app.include_router(approval.router, prefix="/api/approvals", tags=["approvals"])
app.include_router(notification.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(export.router, prefix="/api/export", tags=["export"])
app.include_router(whatsapp.router, prefix="/api/whatsapp", tags=["whatsapp"])

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Check DB connectivity
        db.execute(sa.text("SELECT 1"))
        return {"status": "ok", "version": "1.0", "db": "operational"}
    except Exception as e:
        return {"status": "degraded", "version": "1.0", "db": "offline", "error": str(e)}

# ─── APScheduler: Auto-sync Data every day at 7 AM ───────────────────────────
from apscheduler.schedulers.background import BackgroundScheduler
from services.onedrive_service import is_configured
import os
import logging

logger = logging.getLogger(__name__)

def scheduled_sync_jobs():
    """Scheduled task to sync OneDrive documents and Scrape Data."""
    # 1. Scrape News & Power BI
    from services.scraper_service import run_daily_scraper_sync
    try:
        run_daily_scraper_sync()
    except Exception as e:
        logger.error(f"Scheduled scraper failed: {e}")

    # 2. Sync OneDrive
    if not is_configured():
        logger.warning("OneDrive not configured, skipping sync.")
        return
    
    from db import SessionLocal
    from services.knowledge_sync import sync_onedrive_documents
    
    logger.info("Starting scheduled OneDrive sync...")
    db = SessionLocal()
    try:
        result = sync_onedrive_documents(db)
        logger.info(f"Scheduled sync complete: {result.to_dict()}")
    except Exception as e:
        logger.error(f"Scheduled sync failed: {e}")
    finally:
        db.close()

scheduler = BackgroundScheduler()
sync_hour = int(os.environ.get("AUTO_SYNC_HOUR", "7"))
scheduler.add_job(scheduled_sync_jobs, 'cron', hour=sync_hour, minute=0, id='daily_sync_jobs')

@app.on_event("startup")
async def startup_event():
    """Start the scheduler and connect WhatsApp on app startup."""
    scheduler.start()
    logger.info(f"APScheduler started — Daily sync scheduled at {sync_hour:02d}:00")
    # Attempt WhatsApp connection (non-blocking)
    try:
        from services.whatsapp_service import connect_whatsapp, load_config_from_db
        from db import SessionLocal
        
        db = SessionLocal()
        try:
            load_config_from_db(db)
        finally:
            db.close()
            
        await connect_whatsapp()
    except Exception as e:
        logger.warning(f"WhatsApp connection skipped: {e}")

@app.on_event("shutdown")
def shutdown_event():
    """Shutdown the scheduler gracefully."""
    scheduler.shutdown(wait=False)
