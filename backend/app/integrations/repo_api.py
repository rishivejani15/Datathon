import requests
from typing import List, Dict, Optional, Any

# API Base URL
BASE_URL = "https://samyak000-github-app.hf.space/insights"

# Contract required by user:
# 1) get_pull_requests(org, repo) -> list[dict]
# 2) get_reviews(org, repo) -> list[dict]
# 3) get_commits(org, repo) -> list[dict]
# 4) get_modules_mapping(org, repo) -> dict

def get_pull_requests(org: str, repo: str) -> List[Dict]:
    url = f"{BASE_URL}/pull-requests"
    try:
        resp = requests.post(url, json={"org": org, "repo": repo}, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        raw_list = data.get("pull_requests", data.get("prs", []))
        
        parsed = []
        for item in raw_list:
            # Map to schema: pr_id, author, created_at, merged_at, files_changed
            files = [] # Not usually in list view
            
            p = {
                "pr_id": str(item.get("number", "unknown")),
                "author": item.get("user", {}).get("login", "unknown"),
                "created_at": item.get("created_at"),
                "merged_at": item.get("merged_at"),
                "files_changed": files
            }
            parsed.append(p)
        return parsed
    except Exception as e:
        raise Exception(f"get_pull_requests failed: {str(e)}")

def get_reviews(org: str, repo: str) -> List[Dict]:
    # Endpoint not listed in snippet, returning empty list safely
    return []

def get_commits(org: str, repo: str) -> List[Dict]:
    url = f"{BASE_URL}/commits"
    try:
        resp = requests.post(url, json={"org": org, "repo": repo}, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        parsed = []
        parsed = []
        for item in data.get("commits", []):
            files = []
            if "files" in item:
                 files = [f.get("filename") for f in item["files"] if "filename" in f]
                 
            c = item.get("commit", {})
            if not c: c = {}
            
            # author info inside commit object (git author)
            commit_author = c.get("author", {})
            if not commit_author: commit_author = {}
            
            # github user info (top level author key)
            gh_author = item.get("author")
            
            # Determine author name
            # Prefer GitHub Login, then Git Name, then Unknown
            author_name = "unknown"
            if gh_author and isinstance(gh_author, dict):
                author_name = gh_author.get("login", author_name)
            elif commit_author:
                author_name = commit_author.get("name", author_name)
                
            parsed.append({
                "commit_id": item.get("sha"),
                "author": author_name,
                "timestamp": commit_author.get("date"),
                "files_changed": files
            })
        return parsed
    except Exception as e:
        raise Exception(f"get_commits failed: {str(e)}")

def get_modules_mapping(org: str, repo: str) -> Dict[str, List[str]]:
    # Fallback / Default Contract
    return {
        "backend": ["backend/", "app/", "api/"],
        "frontend": ["frontend/", "src/", "ui/"],
        "docs": ["README.md", "docs/"],
        "root": [""]
    }
