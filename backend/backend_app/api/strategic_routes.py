from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException
from backend_app.state.store import store
from backend_app.core.strategic_controller import get_strategic_audit, analyze_jira_from_db
from pydantic import BaseModel

class StrategicAuditResponse(BaseModel):
    briefing: str
    status: str = "success"
    generated_at: str = None

router = APIRouter(prefix="/strategic", tags=["strategic"])

@router.post("/audit", response_model=StrategicAuditResponse)
def compute_strategic_audit():
    # Make sure we have GitHub data loaded
    if not store.loaded:
         raise HTTPException(status_code=400, detail="GitHub data not loaded. Call /load_data first.")
    
    # We can run without Jira loaded but it will default to empty plan.
    # But best to encourage full load.
    
    briefing_text = get_strategic_audit()
    return StrategicAuditResponse(
        briefing=briefing_text,
        generated_at=datetime.now().isoformat()
    )

@router.post("/jira-audit", response_model=StrategicAuditResponse)
def compute_jira_audit():
    """
    Compares the latest Jira data from DB with active GitHub data.
    """
    if not store.loaded:
         raise HTTPException(status_code=400, detail="GitHub data not loaded. Call /load_data first.")
         
    analysis = analyze_jira_from_db()
    return StrategicAuditResponse(
        briefing=analysis,
        generated_at=datetime.now().isoformat()
    )
