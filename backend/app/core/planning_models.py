from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

# --- Jira Data Models ---

class RawSprint(BaseModel):
    sprint_id: str
    name: str
    start_date: datetime
    end_date: datetime
    team_id: str
    planned_story_points: int

class RawIssue(BaseModel):
    issue_id: str
    sprint_id: str
    title: str
    issue_type: str # Story|Bug|Task
    story_points: int
    assignee: str
    module_id: str
    created_at: datetime

class RawIssueEvent(BaseModel):
    issue_id: str
    timestamp: datetime
    from_status: str
    to_status: str

# --- Planning Output Models ---

class SprintMetrics(BaseModel):
    sprint_id: str
    name: str
    start_date: datetime
    end_date: datetime
    planned_story_points: int
    completed_story_points: int
    completion_pct: float
    
    # Gap Metrics
    reality_gap_score: int # 0-100
    points_completion_gap: float
    
    # Prediction
    predicted_slip_days: int
    predicted_finish_date: str # Just string for simplicity in display

    # Breakdown by module for detailed views
    module_breakdown: Dict[str, Dict[str, float]] = Field(default_factory=dict) # mod -> {planned, actual}
    
    # Evidence & Recs
    top_drivers: List[str]
    recommended_actions: List[str]

class CorrectionRule(BaseModel):
    team_id: str
    module_id: str
    issue_type: str
    multiplier: float
    samples_count: int
    explanation: str

class AutoCorrectHeadline(BaseModel):
    headline: str
