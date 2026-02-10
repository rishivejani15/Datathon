from datetime import datetime, timezone
import json
from openai import OpenAI
from backend_app.state.store import store
from backend_app.core.planning_engine import compute_autocorrect # Re-use metrics if needed
from backend_app.integrations.supabase_client import supabase

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

def get_latest_jira_payload():
    """
    Fetch the latest Jira payload from the 'jira_data' table in Supabase.
    """
    if not supabase:
        print("Warning: Supabase client not initialized.")
        return None
        
    try:
        # Fetch the latest record based on synced_at
        res = supabase.table("jira_data").select("jira_payload").order("synced_at", desc=True).limit(1).execute()
        if res.data:
            return res.data[0]['jira_payload']
        return None
    except Exception as e:
        print(f"Error fetching Jira payload: {e}")
        return None

def analyze_jira_from_db():
    """
    Compare Jira data from DB with GitHub reality using Featherless API.
    """
    # 1. Fetch Jira Payload
    jira_payload = get_latest_jira_payload()
    if not jira_payload:
        return "No Jira data found in database."

    # 2. Gather GitHub Data (Reality)
    # Using existing store data (populated via /load_data or /load_live_data)
    # We'll use a summary similar to get_strategic_audit but tailored for this comparison
    
    # Calculate time window based on data available or assume last 2 weeks if not specified
    # For now, let's use the full loaded data context to find active sprint window if possible, 
    # or just summarize recent activity.
    
    # If jira_payload has sprint info, use that window.
    # Assuming jira_payload is a dict with sprint info.
    sprint_info = jira_payload.get("sprint", {}) if isinstance(jira_payload, dict) else {}
    # If payload structure is list of issues, we might need to infer.
    
    # Simplification: pass the raw payload structure to LLM to interpret, 
    # along with a structured summary of GitHub activity.
    
    github_summary = {
        "total_commits": len(store.commits),
        "recent_commits": [
            {
                "author": c.author,
                "message": c.message if hasattr(c, 'message') else "",
                "timestamp": str(c.timestamp)
            } for c in store.commits[:20] # Last 20 commits
        ],
        "active_prs": [
            {
                "id": str(p.pr_id),
                "author": p.author,
                "status": "merged" if p.merged_at else "open",
                "created_at": str(p.created_at)
            } for p in store.prs if not p.merged_at or (p.merged_at and (datetime.now(timezone.utc) - p.merged_at).days < 14)
        ]
    }

    # 3. Construct Prompt
    system_prompt = (
        "You are an expert Engineering Analyst. Your goal is to compare the planned work (Jira) "
        "against the actual engineering activity (GitHub) to identify discrepancies, risks, and "
        "undocumented work."
    )
    
    user_prompt = f"""
    JIRA DATA (The Plan):
    {json.dumps(jira_payload, indent=2, default=str)}
    
    GITHUB DATA (The Reality):
    {json.dumps(github_summary, indent=2, default=str)}
    
    TASK:
    Analyze the alignment between the Jira plan and GitHub activity.
    Produce a report strictly following this structure:

    ### Executive Summary: Alignment Analysis between Jira Plan and GitHub Activity

    #### Overview:
    [Brief overview of the comparison]

    #### 1. Shadow Work: Untracked GitHub Activity
    **GitHub Data:**
    [List relevant commits/PRs]
    
    **Jira Data:**
    [Mention if these are found in Jira or not]
    
    **Conclusion:**
    - **Shadow Work Identified:** [Analysis]
    - **Recommendation:** [Actionable advice]

    #### 2. Stalled Work: Jira Items Without Corresponding GitHub Activity
    **Jira Data:**
    [List Jira items that seem stalled]
    
    **GitHub Data:**
    [Mention lack of activity]
    
    **Conclusion:**
    - **Stalled Work Identified:** [Analysis]
    - **Recommendation:** [Actionable advice]

    #### 3. Reality Score
    Based on the analysis:
    - **Shadow Work:** [Summary]
    - **Stalled Work:** [Summary]
    
    **Reality Score: [0-100]/100**

    #### 4. Top Risks
    1. **[Risk Title]:** [Description]
    2. **[Risk Title]:** [Description]
    3. **[Risk Title]:** [Description]

    **Recommendations:**
    - [Recommendation 1]
    - [Recommendation 2]

    ### Conclusion
    [Final concluding paragraph]
    """
    
    # 4. Call Featherless API
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
            max_tokens=800
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        return f"Error generating analysis: {str(e)}"
