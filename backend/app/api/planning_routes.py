from fastapi import APIRouter, HTTPException, Path
from typing import List, Dict
from app.state.store import store
from app.core.planning_models import AutoCorrectHeadline, SprintMetrics, CorrectionRule

router = APIRouter(prefix="/planning", tags=["planning"])

@router.post("/load_jira_dummy")
def load_jira_dummy():
    try:
        counts = store.load_jira_data()
        return {"status": "loaded", "counts": counts}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/compute_autocorrect", response_model=AutoCorrectHeadline)
def compute_autocorrect():
    try:
        store.compute_planning()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    return AutoCorrectHeadline(headline=store.planning_headline)

@router.get("/sprints", response_model=List[SprintMetrics])
def list_sprints():
    if not store.jira_loaded:
        raise HTTPException(status_code=400, detail="Jira data not loaded. Call /planning/load_jira_dummy first.")
    
    return store.get_sprints()

@router.get("/sprints/{sprint_id}", response_model=SprintMetrics)
def get_sprint(sprint_id: str):
    sprint = store.get_sprint(sprint_id)
    if not sprint:
        # Check if loaded but not computed? 
        if not store.jira_loaded:
             raise HTTPException(status_code=400, detail="Jira data not loaded.")
        raise HTTPException(status_code=404, detail="Sprint not found or metrics not computed.")
    return sprint

@router.get("/autocorrect/rules", response_model=List[CorrectionRule])
def list_rules():
    return store.get_corrections()
