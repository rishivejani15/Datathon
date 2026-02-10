from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from pydantic import BaseModel
from backend_app.state.store import store

from datetime import datetime

router = APIRouter()

class RiskAnalysisRequest(BaseModel):
    org: str
    repo: str

@router.post("/analyze/risk", response_model=Dict[str, Any])
def analyze_risk(req: RiskAnalysisRequest):
    """
    One-shot API to:
    1. Load Live Data
    2. Compute Metrics
    3. Return 'Bus Factor' Risk Analysis (Feature #1)
       PLUS Detailed raw stats: commits, PRs, merges per user.
    """
    try:
        # 1. Load Data
        print(f"[{datetime.now()}] Received risk analysis request for: {req.org}/{req.repo}")
        store.load_live_data(req.org, req.repo)
        print(f"[{datetime.now()}] Data loaded. Commits: {len(store.commits)}, PRs: {len(store.prs)}, Reviews: {len(store.reviews)}")
        
        # 2. Compute
        print(f"[{datetime.now()}] Computing metrics...")
        store.compute()
        print(f"[{datetime.now()}] Metrics computed.")
        
        # 3. Collect Detailed Stats
        # We want: commits, comments (reviews), PRs, Merge counts per user.
        
        stats = {} 
        # Structure: { "user": { "commits": 0, "prs_opened": 0, "prs_merged": 0, "reviews": 0 } }
        
        def get_stat(u):
            if u not in stats: stats[u] = {"commits": 0, "prs_opened": 0, "prs_merged": 0, "reviews": 0}
            return stats[u]
            
        # Commits
        for c in store.commits:
            u = c.author or "unknown"
            get_stat(u)["commits"] += 1
            
        # PRs
        for p in store.prs:
            u = p.author or "unknown"
            get_stat(u)["prs_opened"] += 1
            if p.merged_at:
                get_stat(u)["prs_merged"] += 1
                
        # Reviews
        for r in store.reviews:
            u = r.reviewer or "unknown"
            get_stat(u)["reviews"] += 1
            
        # Format for response
        detailed_stats = []
        for user, data in stats.items():
            detailed_stats.append({
                "user": user,
                **data
            })
            
        # Sort by commits desc
        detailed_stats.sort(key=lambda x: x["commits"], reverse=True)
        
        modules = store.get_modules()
        if not modules:
             return {
                "headline": "No activity found.",
                "overall_repo_risk": 0,
                "user_stats": detailed_stats,
                "modules_analysis": []
            }
            
        top_risk_module = modules[0]
        
        results = []
        for mod in modules:
            if not mod.people: continue
            top_person = mod.people[0]
            share = top_person.share_pct * 100
            
            # Bus Factor Check
            bus_factor = mod.bus_factor
            insight = f"Healthy distribution."
            if bus_factor == 1:
                insight = f"CRITICAL: {top_person.person_id} is a single point of failure (Bus Factor 1). If they leave, {share:.1f}% of module logic is orphaned."
            elif share > 50:
                 insight = f"HIGH RISK: {top_person.person_id} dominates ({share:.1f}%)."
            
            results.append({
                "module": mod.module_id,
                "risk_score": mod.risk_index,
                "severity": mod.severity,
                "bus_factor": bus_factor,
                "key_person": top_person.person_id,
                "knowledge_share_pct": round(share, 1),
                "insight": insight,
                "evidence": mod.evidence
            })

        headline = f"Repo Analysis: {top_risk_module.module_id} is at {top_risk_module.severity} risk."
        if top_risk_module.bus_factor == 1:
            headline += f" {top_risk_module.people[0].person_id} is a Single Point of Failure."
            
        print(f"[{datetime.now()}] Analysis complete. Headling: {headline}")
        print(f"[{datetime.now()}] Top module risk: {top_risk_module.risk_index}")

        return {
            "headline": headline,
            "overall_repo_risk": top_risk_module.risk_index,
            "user_stats": detailed_stats,
            "modules_analysis": results
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
