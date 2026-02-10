from typing import List, Dict, Optional, Any
from backend_app.integrations.supabase_client import supabase

# Contract required by user:
# 1) get_pull_requests(org, repo) -> list[dict]
# 2) get_reviews(org, repo) -> list[dict]
# 3) get_commits(org, repo) -> list[dict]
# 4) get_modules_mapping(org, repo) -> dict

def get_github_id(org: str, repo: str) -> Optional[str]:
    """
    Helper to resolve GitHub ID from 'github' table.
    Tries exact full_name match first, then falls back to repo name match.
    """
    full_name = f"{org}/{repo}"
    print(f"Resolving GitHub ID for {full_name}...")
    
    # 1. Try exact match on full_name
    res = supabase.table("github").select("id").eq("full_name", full_name).limit(1).execute()
    if res.data:
        uid = res.data[0]['id']
        print(f"Found GitHub ID (exact match): {uid}")
        return uid
        
    # 2. Fallback: Try match on 'repo' name only (User might use different org in request)
    # This expects 'repo' column to exist as seen in user screenshot
    print(f"Exact match failed. Trying fallback by repo name '{repo}'...")
    res = supabase.table("github").select("id, full_name").eq("repo", repo).limit(1).execute()
    if res.data:
        uid = res.data[0]['id']
        found_name = res.data[0]['full_name']
        print(f"Found GitHub ID (fallback repo match): {uid} (Matches {found_name})")
        return uid
        
    print(f"Error: Repository '{full_name}' (or repo '{repo}') not found in 'github' table.")
    return None

def get_pull_requests(org: str, repo: str) -> List[Dict]:
    """
    Fetch PRs from Supabase 'pull_requests' table.
    """
    if not supabase:
        print("Warning: Supabase client not initialized.")
        return []

    github_id = get_github_id(org, repo)
    if not github_id:
        return []

    try:
        # 2. Query Pull Requests using github_id
        res = supabase.table("pull_requests").select("*").eq("github_id", github_id).limit(500).execute()
        data = res.data if res else []
        print(f"DEBUG: Fetched {len(data)} PRs. First item: {data[0] if data else 'None'}")
        
        parsed = []
        for item in data:
            pr_id = str(item.get("pr_number", "unknown"))
            author = item.get("author", "unknown")
            created_at = item.get("created_at")
            merged_at = item.get("merged_at")
            files = [] 
            
            parsed.append({
                "pr_id": pr_id,
                "author": author,
                "created_at": created_at,
                "merged_at": merged_at,
                "files_changed": files
            })
        return parsed
    except Exception as e:
        print(f"Supabase PR fetch error: {e}")
        return []

def get_reviews(org: str, repo: str) -> List[Dict]:
    # Reviews not strictly required for risk analysis MVP (used for evidence but optional)
    # User didn't show reviews table (showed 'pull_requests', 'issues', 'commits', 'contributors')
    # Maybe inside pull_requests? For now return empty.
    return []

def get_commits(org: str, repo: str) -> List[Dict]:
    """
    Fetch commits from Supabase 'commits' table.
    """
    if not supabase:
        return []
        
    github_id = get_github_id(org, repo)
    if not github_id:
        return []

    try:
        # 2. Query Commits using github_id
        res = supabase.table("commits").select("*").eq("github_id", github_id).limit(1000).execute()
        data = res.data if res else []
        print(f"DEBUG: Fetched {len(data)} Commits. First item: {data[0] if data else 'None'}")
        
        parsed = []
        for item in data:
            # Map standard fields from PROVIDED SCHEMA
            sha = item.get("sha", "unknown")
            author = item.get("author", "unknown")
            ts = item.get("committed_date")
            message = item.get("message", "")
            
            # Again, commits table schema has additions/deletions but NO file list.
            files = []
            
            parsed.append({
                "commit_id": sha,
                "author": author,
                "timestamp": ts,
                "message": message,
                "files_changed": files
            })
        return parsed
    except Exception as e:
        print(f"Supabase Commits fetch error: {e}")
        # Return empty list gracefully if table is missing or column mismatch
        return []

def get_modules_mapping(org: str, repo: str) -> Dict[str, List[str]]:
    # Fallback / Default Contract
    return {
        "backend": ["backend/", "app/", "api/"],
        "frontend": ["frontend/", "src/", "ui/"],
        "docs": ["README.md", "docs/"],
        "root": [""]
    }
