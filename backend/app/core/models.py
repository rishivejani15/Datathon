from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

# --- Input Models ---

class RawPR(BaseModel):
    pr_id: str
    author: str
    created_at: datetime
    merged_at: Optional[datetime] = None
    files_changed: List[str]

class RawReview(BaseModel):
    pr_id: str
    reviewer: str
    state: str  # APPROVED, CHANGES_REQUESTED, COMMENTED
    timestamp: datetime

class RawCommit(BaseModel):
    commit_id: str
    author: str
    timestamp: datetime
    files_changed: List[str]

# Dictionary mapping module_id -> list of path prefixes
ModulesConfig = Dict[str, List[str]]


# --- Output / Internal Models ---

class Signal(BaseModel):
    person_id: str
    module_id: str
    signal_type: str
    weight: float
    timestamp: datetime
    source_id: str  # pr_id or commit_id

class PersonMetric(BaseModel):
    person_id: str
    knowledge_score: float
    share_pct: float
    type_counts: Dict[str, int] = Field(default_factory=dict)

class ModuleMetric(BaseModel):
    module_id: str
    risk_index: float
    severity: str  # SEVERE, MODERATE, HEALTHY
    top1_share_pct: float
    top2_share_pct: float
    bus_factor: int
    total_knowledge_weight: float
    signals_count: int
    people: List[PersonMetric]
    evidence: List[str]
    plain_explanation: str

class ComputeHeadline(BaseModel):
    headline: str

class LoadStatus(BaseModel):
    prs_count: int
    reviews_count: int
    commits_count: int
    modules_count: int
