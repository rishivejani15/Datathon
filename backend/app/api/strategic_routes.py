from fastapi import APIRouter, HTTPException
from app.state.store import store
from app.core.strategic_controller import get_strategic_audit
from pydantic import BaseModel

class StrategicAuditResponse(BaseModel):
    briefing: str

router = APIRouter(prefix="/strategic", tags=["strategic"])

@router.post("/audit", response_model=StrategicAuditResponse)
def compute_strategic_audit():
    # Make sure we have GitHub data loaded
    if not store.loaded:
         raise HTTPException(status_code=400, detail="GitHub data not loaded. Call /load_data first.")
    
    # We can run without Jira loaded but it will default to empty plan.
    # But best to encourage full load.
    
    briefing_text = get_strategic_audit()
    return StrategicAuditResponse(briefing=briefing_text)
