from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"

PRS_FILE = DATA_DIR / "prs.json"
REVIEWS_FILE = DATA_DIR / "reviews.json"
COMMITS_FILE = DATA_DIR / "commits.json"
MODULES_FILE = DATA_DIR / "modules.json"

JIRA_SPRINTS_FILE = DATA_DIR / "jira_sprints.json"
JIRA_ISSUES_FILE = DATA_DIR / "jira_issues.json"
JIRA_EVENTS_FILE = DATA_DIR / "jira_issue_events.json"
