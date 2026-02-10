import json
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime

from backend_app.core.config import PRS_FILE, REVIEWS_FILE, COMMITS_FILE, MODULES_FILE
from backend_app.core.models import (
    RawPR, RawReview, RawCommit, ModulesConfig, ModuleMetric, Signal
)
from backend_app.core.planning_models import (
    RawSprint, RawIssue, RawIssueEvent, 
    SprintMetrics, CorrectionRule, AutoCorrectHeadline
)
from backend_app.core.signals import process_signals
from backend_app.core.metrics import compute_metrics
from backend_app.core.planning_loader import load_jira_files
from backend_app.core.planning_engine import compute_autocorrect

from backend_app.integrations.repo_api import get_pull_requests, get_reviews, get_commits, get_modules_mapping

class Store:
    def __init__(self):
        self.prs: List[RawPR] = []
        self.reviews: List[RawReview] = []
        self.commits: List[RawCommit] = []
        self.modules_config: ModulesConfig = {}
        
        self.module_metrics: Dict[str, ModuleMetric] = {}
        
        # Jira Data
        self.sprints: List[RawSprint] = []
        self.issues: List[RawIssue] = []
        self.issue_events: List[RawIssueEvent] = []
        
        # Planning metrics
        self.sprint_metrics: List[SprintMetrics] = []
        self.correction_rules: List[CorrectionRule] = []
        self.planning_headline: str = ""
        
        self.loaded = False
        self.jira_loaded = False
        self.is_live_data = False

    def load_data(self) -> Dict[str, int]:
        return self._load_dummy_data()

    def _load_dummy_data(self) -> Dict[str, int]:
        if not PRS_FILE.exists() or not REVIEWS_FILE.exists() or not COMMITS_FILE.exists() or not MODULES_FILE.exists():
            raise FileNotFoundError("One or more data files are missing.")

        def load_json(path):
            with open(path, 'r') as f:
                return json.load(f)

        # Load PRs
        raw_prs = load_json(PRS_FILE)
        self.prs = [RawPR(**item) for item in raw_prs]

        # Load Reviews
        raw_reviews = load_json(REVIEWS_FILE)
        self.reviews = [RawReview(**item) for item in raw_reviews]

        # Load Commits
        raw_commits = load_json(COMMITS_FILE)
        self.commits = [RawCommit(**item) for item in raw_commits]

        # Load Modules
        self.modules_config = load_json(MODULES_FILE)

        self.loaded = True
        self.is_live_data = False
        return {
            "prs": len(self.prs),
            "reviews": len(self.reviews),
            "commits": len(self.commits),
            "modules": len(self.modules_config)
        }

    def load_live_data(self, org: str, repo: str) -> Dict[str, int]:
        """
        Fetches live data via the integration functions and stores it in memory.
        """
        # Clear existing
        self.prs = []
        self.reviews = []
        self.commits = []
        
        try:
            print(f"Calling integration functions for {org}/{repo}...")
            
            # 1. Modules Mapping
            self.modules_config = get_modules_mapping(org, repo)
            
            # 2. Commits
            raw_commits = get_commits(org, repo)
            self.commits = []
            for item in raw_commits:
                ts_str = item.get("timestamp")
                ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00")) if ts_str else datetime.now()
                self.commits.append(RawCommit(
                    commit_id=item["commit_id"],
                    author=item["author"],
                    timestamp=ts,
                    message=item.get("message", ""),
                    files_changed=item.get("files_changed", [])
                ))
            
            # 3. Pull Requests
            raw_prs = get_pull_requests(org, repo)
            self.prs = []
            for item in raw_prs:
                ts_created = item.get("created_at")
                ts_merged = item.get("merged_at")
                
                c_ts = datetime.fromisoformat(ts_created.replace("Z", "+00:00")) if ts_created else datetime.now()
                m_ts = datetime.fromisoformat(ts_merged.replace("Z", "+00:00")) if ts_merged else None
                
                self.prs.append(RawPR(
                    pr_id=item["pr_id"],
                    author=item["author"],
                    created_at=c_ts,
                    merged_at=m_ts,
                    files_changed=item.get("files_changed", [])
                ))
                
            # 4. Reviews
            raw_reviews = get_reviews(org, repo)
            self.reviews = []
            # ... map if reviews actually returned ...
            
            # Issues not in spec, clear them to avoid stale data
            self.issues = []
            self.sprints = []
            
            self.loaded = True
            self.is_live_data = True
            
            return {
                "prs": len(self.prs),
                "reviews": len(self.reviews),
                "commits": len(self.commits),
                "modules": len(self.modules_config),
                "source": "Integration Module (repo_api)"
            }
            
        except Exception as e:
            # Route handler should catch this to return 502
            # We raise a specific message
            print(f"Integration failure: {e}")
            raise Exception(f"Integration failed: {str(e)}")

    def compute(self) -> str:
        """
        Compute all metrics for the loaded data.
        Returns the headline string.
        """
        if not self.loaded:
            raise ValueError("Data not loaded. Call load_data first.")
            
        # Import here to avoid circular dependency if any (usually metrics imports models not store)
        from backend_app.core.signals import process_signals
        from backend_app.core.metrics import compute_metrics
            
        # 1. Process signals
        signals_map = process_signals(self.prs, self.reviews, self.commits, self.modules_config)
        
        # 2. Metrics
        # Iterate over ALL modules in config to ensure we include those with 0 signals.
        all_mod_ids = set(self.modules_config.keys())
        
        # Pre-calculate signal sums per module to find global max
        module_sums = {}
        for mid in all_mod_ids:
            sigs = signals_map.get(mid, [])
            module_sums[mid] = sum(s.weight for s in sigs)
            
        # Avoid zero division
        max_total = max(module_sums.values()) if module_sums else 1.0
        if max_total == 0: max_total = 1.0
        
        self.module_metrics = {}
        for mid in all_mod_ids:
            sigs = signals_map.get(mid, [])
            # Compute metric
            metric = compute_metrics(mid, sigs, max_total)
            self.module_metrics[mid] = metric
            
        # Find max risk module for headline
        sorted_mods = sorted(self.module_metrics.values(), key=lambda x: x.risk_index, reverse=True)
        if not sorted_mods:
            return "No modules analyzed."
            
        top_risk = sorted_mods[0]
        top_person = top_risk.people[0].person_id if top_risk.people else "nobody"
        
        return f"{top_risk.module_id} module is at {top_risk.risk_index} risk ({top_risk.severity}) because {top_person} owns most of the knowledge signals."

    def get_modules(self) -> List[ModuleMetric]:
        return sorted(self.module_metrics.values(), key=lambda x: x.risk_index, reverse=True)

    def load_jira_data(self) -> Dict[str, int]:
        self.sprints, self.issues, self.issue_events = load_jira_files()
        self.jira_loaded = True
        return {
            "sprints": len(self.sprints),
            "issues": len(self.issues),
            "events": len(self.issue_events)
        }
    
    def compute_planning(self):
        if not self.loaded:
            raise ValueError("GitHub data must be loaded first (call /load_data).")
        # If not jira_loaded, we can't compute planning metrics
        if not self.jira_loaded:
            raise ValueError("Jira data not loaded (call /load_jira_dummy).")

        # Reuse existing PRs/Reviews for Reality Gap analysis
        items = compute_autocorrect(
            self.sprints, 
            self.issues, 
            self.issue_events,
            self.prs,
            self.reviews,
            self.modules_config
        )
        self.sprint_metrics = items[0]
        self.correction_rules = items[1]
        self.planning_headline = items[2]
        
    def get_modules(self) -> List[ModuleMetric]:
        return sorted(self.module_metrics.values(), key=lambda x: x.risk_index, reverse=True)

    def get_module(self, module_id: str) -> Optional[ModuleMetric]:
        return self.module_metrics.get(module_id)
        
    def get_sprints(self) -> List[SprintMetrics]:
        # Sort by reality gap desc
        return sorted(self.sprint_metrics, key=lambda x: x.reality_gap_score, reverse=True)
        
    def get_sprint(self, sprint_id: str) -> Optional[SprintMetrics]:
        for s in self.sprint_metrics:
            if s.sprint_id == sprint_id:
                return s
        return None
        
    def get_corrections(self) -> List[CorrectionRule]:
        return self.correction_rules # Fix naming consistency

# Singleton instance
store = Store()
