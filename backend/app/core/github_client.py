from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import requests
import json
import random # Fallback for story points
from app.core.models import RawCommit, RawPR, RawReview
from app.core.planning_models import RawIssue, RawIssueEvent, RawSprint

# Base URL for the custom GitHub App/API
BASE_URL = "https://samyak000-github-app.hf.space/insights"

class GitHubClient:
    def __init__(self, org: str, repo: str):
        self.org = org
        self.repo = repo
        
    def _parse_ts(self, ts_str: Optional[str]) -> datetime:
        if not ts_str:
            return datetime.now(timezone.utc)
        try:
            return datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
        except:
            return datetime.now(timezone.utc)

    def fetch_commits(self) -> List[RawCommit]:
        url = f"{BASE_URL}/commits"
        payload = {"org": self.org, "repo": self.repo}
        try:
            resp = requests.post(url, json=payload, timeout=10)
            if resp.status_code != 200: return []
            data = resp.json()
            commits = []
            for item in data.get("commits", []):
                try:
                    c = item.get("commit", {})
                    author_info = c.get("author", {})
                    ts = self._parse_ts(author_info.get("date"))
                    author_name = author_info.get("name", "Unknown")
                    if item.get("author") and "login" in item["author"]:
                        author_name = item["author"]["login"]
                    
                    files = []
                    if "files" in item:
                        files = [f.get("filename") for f in item["files"] if "filename" in f]
                        
                    commits.append(RawCommit(
                        commit_id=item.get("sha", ""), 
                        author=author_name, 
                        timestamp=ts, 
                        files_changed=files
                    ))
                except Exception: continue
            return commits
        except Exception: return []

    def fetch_prs(self) -> List[RawPR]:
        url = f"{BASE_URL}/pull-requests"
        payload = {"org": self.org, "repo": self.repo}
        try:
            resp = requests.post(url, json=payload, timeout=15)
            if resp.status_code != 200: return []
            data = resp.json()
            
            # Adjust based on actual key. 
            # If endpoint is /pull-requests, maybe key is "pull_requests" or "prs"?
            # I'll check generic keys if specific fails
            raw_list = data.get("pull_requests", data.get("prs", []))
            
            prs = []
            for item in raw_list:
                try:
                    # Generic structure mapping
                    pid = str(item.get("number", item.get("id", "unknown")))
                    user = item.get("user", {})
                    author = user.get("login", "unknown")
                    created = self._parse_ts(item.get("created_at"))
                    merged = self._parse_ts(item.get("merged_at")) if item.get("merged_at") else None
                    
                    # Files? Usually not in list view.
                    # If this API is "smart", maybe it includes them?
                    # If not, we assume empty or try "files" key
                    files = [] # item.get("files", []) if we're lucky
                    
                    prs.append(RawPR(
                        pr_id=pid,
                        author=author,
                        created_at=created,
                        merged_at=merged,
                        files_changed=files
                    ))
                except: continue
            return prs
        except Exception: return []

    def fetch_issues(self) -> List[RawIssue]:
        url = f"{BASE_URL}/pull-issues"
        payload = {"org": self.org, "repo": self.repo}
        try:
            resp = requests.post(url, json=payload, timeout=15)
            if resp.status_code != 200: return []
            data = resp.json()
            raw_list = data.get("issues", [])
            
            issues = []
            for item in raw_list:
                try:
                    # Skip PRs if they come through this endpoint
                    if "pull_request" in item and item["pull_request"]:
                        continue
                        
                    iid = f"GH-{item.get('number')}"
                    title = item.get("title", "")
                    
                    # Map to Planning Model (Jira-style)
                    # We need to fabricate some data for the Planning Engine to work
                    assignees = item.get("assignees", [])
                    assignee = assignees[0].get("login") if assignees else "unassigned"
                    
                    # Module? Try label
                    labels = [l.get("name") for l in item.get("labels", [])]
                    module_id = "general"
                    for l in labels:
                        if "module:" in l: # Convention?
                            module_id = l.replace("module:", "")
                            break
                        
                    # Sprint? Milestone?
                    sprint_id = "SPR-LIVE" # Default bucket
                    if item.get("milestone"):
                        sprint_id = f"SPR-{item['milestone'].get('title')}"
                        
                    issues.append(RawIssue(
                        issue_id=iid,
                        sprint_id=sprint_id,
                        title=title,
                        issue_type="Story", # Default
                        story_points=1, # Default
                        assignee=assignee,
                        module_id=module_id,
                        created_at=self._parse_ts(item.get("created_at"))
                    ))
                except: continue
            return issues
        except Exception: return []

    def fetch_activity(self) -> List[RawIssueEvent]:
        # Maps activity timeline to issue events (transitions)
        return [] # Placeholder, complex to map generic activity stream to "status changes" reliably without more info
