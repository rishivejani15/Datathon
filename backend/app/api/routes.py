from fastapi import APIRouter, HTTPException, Path
from typing import List, Dict, Optional
from pydantic import BaseModel
from app.state.store import store
from app.core.models import LoadStatus, ComputeHeadline, ModuleMetric

router = APIRouter()

class LiveDataRequest(BaseModel):
    org: str
    repo: str

@router.post("/load_data", response_model=Dict)
def load_data(req: Optional[LiveDataRequest] = None):
    try:
        if req and req.org and req.repo:
            return store.load_live_data(req.org, req.repo)
        else:
             counts = store.load_data()
             return {
                "prs": counts.get("prs", 0),
                "reviews": counts.get("reviews", 0),
                "commits": counts.get("commits", 0),
                "modules": counts.get("modules", 0),
                "source": "Dummy Data"
            }
    except Exception as e:
        # Check for specific integration failure message
        msg = str(e)
        if "Integration failed" in msg:
             raise HTTPException(status_code=502, detail=msg)
        if "missing" in msg.lower(): # File missing
             raise HTTPException(status_code=404, detail=msg)
             
        raise HTTPException(status_code=500, detail=f"Error loading data: {msg}")

@router.post("/compute", response_model=ComputeHeadline)
def compute():
    try:
        store.compute()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    # Generate headline from the highest risk module
    modules = store.get_modules()
    if not modules:
        return ComputeHeadline(headline="No modules found or computed.")
    
    # Pick top risk
    top_mod = modules[0]
    risk_level = top_mod.severity
    
    # Extract top person
    top_person_name = "No one"
    if top_mod.people:
        top_person_name = top_mod.people[0].person_id
        
    headline = f"{top_mod.module_id} module is at {risk_level} risk because {top_person_name} owns most of the knowledge signals."
    
    return ComputeHeadline(headline=headline)

@router.get("/modules", response_model=List[ModuleMetric], response_model_exclude={"people", "evidence", "plain_explanation"})
def list_modules():
    """
    List modules sorted by risk_index desc.
    Excludes detailed fields for the list view to keep it lightweight if needed, 
    but the prompt asks for specific fields.
    Prompt: "List modules... with fields: module_id, risk_index, severity, top1_share_pct, top2_share_pct, bus_factor, total_knowledge_weight, signals_count"
    The response_model_exclude in FastAPI handles hiding fields.
    """
    if not store.loaded and not store.module_metrics:
        # If not loaded/computed, return empty or error?
        # Prompt doesn't specify. Implicitly empty list or 400.
        # But if compute hasn't run, module_metrics is empty.
        pass
        
    return store.get_modules()

@router.get("/modules/{module_id}", response_model=ModuleMetric)
def get_module(module_id: str = Path(..., description="The ID of the module")):
    metric = store.get_module(module_id)
    if not metric:
        raise HTTPException(status_code=404, detail=f"Module '{module_id}' not found. Ensure signals are computed.")
    return metric
