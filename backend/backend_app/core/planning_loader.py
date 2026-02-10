import json
from typing import List, Dict, Tuple
from backend_app.core.config import JIRA_SPRINTS_FILE, JIRA_ISSUES_FILE, JIRA_EVENTS_FILE
from backend_app.core.planning_models import RawSprint, RawIssue, RawIssueEvent

def load_jira_files() -> Tuple[List[RawSprint], List[RawIssue], List[RawIssueEvent]]:
    if not JIRA_SPRINTS_FILE.exists() or not JIRA_ISSUES_FILE.exists() or not JIRA_EVENTS_FILE.exists():
        raise FileNotFoundError("One or more Jira data files are missing.")
        
    with open(JIRA_SPRINTS_FILE, 'r') as f:
        sprints = [RawSprint(**i) for i in json.load(f)]
        
    with open(JIRA_ISSUES_FILE, 'r') as f:
        issues = [RawIssue(**i) for i in json.load(f)]
        
    with open(JIRA_EVENTS_FILE, 'r') as f:
        events = [RawIssueEvent(**i) for i in json.load(f)]
        
    return sprints, issues, events
