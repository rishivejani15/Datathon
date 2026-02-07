from datetime import datetime, timezone
import json
from openai import OpenAI
from app.state.store import store
from app.core.planning_engine import compute_autocorrect # Re-use metrics if needed

# --- Configuration ---
FEATHERLESS_API_KEY = "rc_3a397e668b06eae8d8e477e2f5434b97dc9f3ffd8bf0856563a6d1cd9941fcac"
FEATHERLESS_BASE_URL = "https://api.featherless.ai/v1"
MODEL_NAME = "Qwen/Qwen2.5-7B-Instruct"

def get_strategic_audit():
    """
    Gather data from the store, format it for the LLM, and request an executive briefing.
    """
    
    # 1. Gather Data (Jira Plan vs Github Reality)
    
    # Jira: Current Active Sprint (Sprint 02 in dummy data)
    # We need to find the "current" sprint relative to NOW (2026-02-07T15:00:39+05:30)
    # Using fixed NOW from previous context: 2026-02-07
    NOW = datetime(2026, 2, 7, 15, 0, 0, tzinfo=timezone.utc)
    
    current_sprint = None
    if store.sprints:
        for s in store.sprints:
            s_start = s.start_date.replace(tzinfo=timezone.utc) if s.start_date.tzinfo is None else s.start_date
            s_end = s.end_date.replace(tzinfo=timezone.utc) if s.end_date.tzinfo is None else s.end_date
            
            if s_start <= NOW <= s_end:
                current_sprint = s
                break
        if not current_sprint:
            current_sprint = store.sprints[-1]

    jira_summary = {
        "sprint": current_sprint.name if current_sprint else "Unknown",
        "planned_points": current_sprint.planned_story_points if current_sprint else 0,
        "team": current_sprint.team_id if current_sprint else "Unknown",
        "active_issues": []
    }
    
    # Filter issues for this sprint
    issues_list = []
    if current_sprint:
        # Be careful with ID match, assuming string match on sprint_id
        issues_list = [i for i in store.issues if i.sprint_id == current_sprint.sprint_id]

    for i in issues_list:
        jira_summary["active_issues"].append({
            "id": i.issue_id,
            "title": i.title,
            "points": i.story_points,
            "module": i.module_id,
            "assignee": i.assignee,
            "type": i.issue_type # Assuming stored as issue_type
        })

    # GitHub: Recent Activity (in Sprint Window)
    sprint_start = current_sprint.start_date.replace(tzinfo=timezone.utc) if current_sprint and current_sprint.start_date.tzinfo is None else (current_sprint.start_date if current_sprint else NOW)
    sprint_end = current_sprint.end_date.replace(tzinfo=timezone.utc) if current_sprint and current_sprint.end_date.tzinfo is None else (current_sprint.end_date if current_sprint else NOW)
    
    github_summary = {
        "recent_commits_count": 0,
        "recent_prs": [],
        "active_contributors": set()
    }
    
    # Scan Commits
    for c in store.commits:
        c_ts = c.timestamp.replace(tzinfo=timezone.utc) if c.timestamp.tzinfo is None else c.timestamp
        if sprint_start <= c_ts <= sprint_end:
            github_summary["recent_commits_count"] += 1
            github_summary["active_contributors"].add(c.author)
            
    # Scan PRs
    for p in store.prs:
        p_ts = p.created_at.replace(tzinfo=timezone.utc) if p.created_at.tzinfo is None else p.created_at
        relevant = False
        if sprint_start <= p_ts <= sprint_end: relevant = True
        
        if p.merged_at:
            p_m = p.merged_at.replace(tzinfo=timezone.utc) if p.merged_at.tzinfo is None else p.merged_at
            if sprint_start <= p_m <= sprint_end: relevant = True
        
        if relevant:
            github_summary["recent_prs"].append({
                "id": p.pr_id,
                "author": p.author,
                "files": p.files_changed[:2],
                "merged": bool(p.merged_at)
            })
            github_summary["active_contributors"].add(p.author)
            
    github_summary["active_contributors"] = list(github_summary["active_contributors"])


    # 2. Construct Prompt for LLM
    
    system_prompt = (
        "You are a 'Strategic Engineering Controller.' Your job is to reconcile two conflicting data sources: "
        "Jira (The Plan) and GitHub (The Technical Reality). "
        "You must identify 'Strategic Drift'—the gap between what the company thinks it's doing and what is actually happening. "
        "Output your analysis in a concise, high-impact 'Executive Briefing' format."
    )
    
    user_prompt = f"""
    DATA INPUTS:

    Jira Sprint Data:
    {json.dumps(jira_summary, indent=2, default=str)}

    GitHub Activity:
    {json.dumps(github_summary, indent=2, default=str)}

    TASK: Analyze these inputs and provide:

    1. The Reality Score: A percentage (0-100%) of how "on track" the project truly is compared to the Jira board.
    2. The Shadow Work Audit: Identify what percentage of time is being spent on tasks NOT in Jira (e.g., maintenance, mentoring, or technical debt) based on GitHub activity vs Jira tickets.
    3. The Tribal Knowledge Hero: Identify the developer who is providing the most "unseen" value through mentoring and code reviews (infer from PRs/commits).
    4. Financial Risk Alert: Estimate the dollar cost of current delays (assume $100/hr avg cost) and suggest one specific resource reallocation to fix it.
    5. Executive Summary: A 3-sentence briefing for the CEO.

    Format the output clearly with headers. Be direct and concise.
    """

    # 3. Call LLM
    try:
        client = OpenAI(
            base_url=FEATHERLESS_BASE_URL,
            api_key=FEATHERLESS_API_KEY,
        )
        
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=600
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        return f"Error generating strategic audit: {str(e)}"
