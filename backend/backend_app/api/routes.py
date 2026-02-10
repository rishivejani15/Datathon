from fastapi import APIRouter, HTTPException, Path, Body
from typing import List, Dict, Optional
from pydantic import BaseModel
from backend_app.state.store import store
from backend_app.core.models import LoadStatus, ComputeHeadline, ModuleMetric
from backend_app.integrations.supabase_client import supabase
import requests
import uuid

router = APIRouter()

class LiveDataRequest(BaseModel):
    org: str
    repo: str

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.get("/test-supabase")
def test_supabase_connection():
    if not supabase:
        return {"status": "error", "message": "Supabase client is None (failed to init)"}
    
    try:
        # Try a lightweight query
        print("Testing Supabase connection...")
        response = supabase.table("pull_requests").select("count", count="exact").limit(1).execute()
        print(f"Supabase Test Result: {response}")
        return {
            "status": "ok", 
            "data": response.data, 
            "message": "Connection successful"
        }
    except Exception as e:
        print(f"Supabase Test Failed: {e}")
        return {"status": "error", "message": str(e)}

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

@router.get("/commits")
def get_commits_list():
    """
    Returns the list of loaded commits.
    """
    total_count = len(store.commits)
    # Sort by timestamp desc
    sorted_commits = sorted(store.commits, key=lambda c: c.timestamp, reverse=True)
    
    return {
        "count": total_count,
        "commits": sorted_commits
    }

@router.post("/run-workflow")
def run_workflow_endpoint(input_text: str = Body(default="hello world!", embed=True)):
    api_key = 'sk-y2mGytaDwLg927nc2LqZDOs-Go1dWGzjvjlHUN7zXj8'
    url = "http://localhost:7860/api/v1/run/7e37cb01-7c44-44df-be5e-9969091a5ffe"

    payload = {
        "output_type": "chat",
        "input_type": "text",
        "input_value": input_text
    }
    payload["session_id"] = str(uuid.uuid4())
    headers = {"x-api-key": api_key}

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return {"output": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workflow Error: {str(e)}")

