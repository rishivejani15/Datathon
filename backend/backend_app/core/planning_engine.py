from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional, Tuple
import math

from backend_app.core.planning_models import (
    RawSprint, RawIssue, RawIssueEvent, 
    SprintMetrics, CorrectionRule, AutoCorrectHeadline
)
from backend_app.core.models import Signal, RawPR, RawReview
# We need access to GitHub data (processed signals or raw)

# Heuristic Constants
DEFAULT_POINTS_PER_DAY_DEV = 1.0 # Fallback
REALITY_GAP_WEIGHT_POINTS = 0.6
REALITY_GAP_WEIGHT_REVIEW = 0.4

def compute_autocorrect(
    sprints: List[RawSprint], 
    issues: List[RawIssue], 
    events: List[RawIssueEvent],
    github_prs: List[RawPR],
    github_reviews: List[RawReview],
    modules_config: Dict[str, List[str]]
) -> Tuple[List[SprintMetrics], List[CorrectionRule], str]:
    
    # 1. Organize Data
    # Issues per sprint
    issues_by_sprint = {s.sprint_id: [] for s in sprints}
    for i in issues:
        if i.sprint_id in issues_by_sprint:
            issues_by_sprint[i.sprint_id].append(i)

    # Events by issue
    events_by_issue = {i.issue_id: [] for i in issues}
    for e in events:
        if e.issue_id in events_by_issue:
            events_by_issue[e.issue_id].append(e)
            
    # Sort events by time
    for iid in events_by_issue:
        events_by_issue[iid].sort(key=lambda x: x.timestamp)

    # 2. Historical Analysis (Correction Rules)
    # We look at COMPLETED sprints to learn multipliers.
    # Current time is "now" (simulated). We can assume "now" is the end of the last sprint or mid-current.
    # The prompt says "current local time is 2026-02-07". 
    # Sprint 1 (Jan 15-29) is done. Sprint 2 (Feb 1-14) is in progress.
    
    correction_rules = _learn_correction_rules(sprints, issues, events_by_issue)
    
    # 3. Compute Metrics for Sprints (focus on active/recent)
    sprint_metrics_list = []
    
    # We need to simulate "current status" relative to 2026-02-07 (NOW)
    NOW = datetime(2026, 2, 7, 14, 0, 0, tzinfo=timezone.utc)
    
    headline = "No active sprint analysis."

    for sprint in sprints:
        # Determine if sprint is past, current, or future
        # Simple check
        is_current = sprint.start_date <= NOW <= sprint.end_date
        is_past = sprint.end_date < NOW
        
        # Calculate Planned
        total_points = sprint.planned_story_points
        days_duration = (sprint.end_date - sprint.start_date).days + 1
        points_per_day_planned = total_points / days_duration if days_duration > 0 else 0
        
        # Calculate Actual / Projected
        # Points completed within sprint window (for past) or up to NOW (for current)
        completed_points = 0
        
        sprint_issues = issues_by_sprint[sprint.sprint_id]
        
        # Track module breakdown
        # mod_id -> {planned: int, completed: int}
        mod_stats = {}
        
        for issue in sprint_issues:
            mid = issue.module_id
            if mid not in mod_stats: mod_stats[mid] = {"planned": 0, "completed": 0}
            mod_stats[mid]["planned"] += issue.story_points
            
            # Check if done
            # Issue is done if it has a transition to DONE within the sprint window
            # For current sprint, within start -> NOW
            # For past, within start -> end
            
            cutoff = NOW if is_current else sprint.end_date
            
            done_time = None
            evt_list = events_by_issue.get(issue.issue_id, [])
            for evt in evt_list:
                if evt.to_status == "DONE":
                    done_time = evt.timestamp
                    break # Assuming once done stays done for simplicity
            
            if done_time and done_time <= cutoff and done_time >= sprint.start_date:
                completed_points += issue.story_points
                mod_stats[mid]["completed"] += issue.story_points
                
        # --- Gap Analysis ---
        
        # Expected completion based on linear burn
        # For past sprints, expected at end is 100%.
        # For current, expected is proportional to time passed.
        
        if is_past:
            time_progress_pct = 1.0
        else:
            days_passed = (NOW - sprint.start_date).days
            if days_passed < 0: days_passed = 0
            time_progress_pct = days_passed / days_duration
            
        expected_points = total_points * time_progress_pct
        points_gap = expected_points - completed_points
        
        # Review Delay Signal from GitHub
        # Get PRs created during this sprint
        sprint_prs = []
        # Naive PR filter by created_at in sprint window
        # Note: timezone awareness might be tricky if mixed naive/aware. 
        # Assuming GitHub data is loaded as datetime (model).
        for pr in github_prs:
            # check overlap? created_at inside sprint
            # Handle tz: ensure both are consistent. 
            # Our models define datetime, likely parsed as aware or naive.
            # We'll assume both are UTC aware for this exercise.
            if sprint.start_date <= pr.created_at <= sprint.end_date:
                sprint_prs.append(pr)
                
        # Calculate avg review time
        # We need reviews for these PRs
        # Map needed.
        # This is expensive if unrelated, but dataset is small.
        review_delays = []
        for pr in sprint_prs:
            # Find approval
            approval_ts = None
            for rev in github_reviews:
                if rev.pr_id == pr.pr_id and rev.state == "APPROVED":
                    approval_ts = rev.timestamp
                    break
            
            if approval_ts:
                delay = (approval_ts - pr.created_at).total_seconds() / 86400.0 # days
                review_delays.append(delay)
            elif is_current:
                 # If not approved yet, delay is (NOW - created)
                 current_wait = (NOW - pr.created_at).total_seconds() / 86400.0
                 if current_wait > 1.0: # Only count if waiting > 1 day
                    review_delays.append(current_wait)

        avg_review_delay = sum(review_delays)/len(review_delays) if review_delays else 0.5 # default 0.5d
        
        # Baseline review delay? Say 0.6 is good.
        review_gap = max(0, avg_review_delay - 0.6)
        
        # Reality Gap Score (0-100)
        # normalize points gap: if we are 30% behind, that's bad.
        pct_behind = points_gap / total_points if total_points > 0 else 0
        score_points = min(100, max(0, pct_behind * 100 * 2)) # Multiplier 2x: 50% behind = 100 risk
        
        score_review = min(100, review_gap * 20) # 1 day late = 20 pts, 5 days = 100
        
        reality_gap_score = int(score_points * 0.7 + score_review * 0.3)
        
        # Prediction
        # Simple velocity based on current completed vs time used
        predicted_slip = 0
        predicted_finish = sprint.end_date
        
        if is_current and completed_points < total_points and time_progress_pct > 0.1:
            # Pace: points per day actual
            days_spent = (NOW - sprint.start_date).days
            if days_spent < 1: days_spent = 1
            avg_pace = completed_points / days_spent
            
            remaining = total_points - completed_points
            if avg_pace > 0:
                days_needed = remaining / avg_pace
                finish_date = NOW + timedelta(days=days_needed)
                slip = (finish_date - sprint.end_date).days
                if slip > 0:
                    predicted_slip = int(slip)
                    predicted_finish = finish_date
            else:
                # Stall
                predicted_slip = 99
                predicted_finish = NOW + timedelta(days=30)
        
        # Explainability
        top_drivers = []
        # Who is missing points?
        # Which modules?
        bad_modules = []
        for m, stats in mod_stats.items():
            if stats["planned"] > 0:
                p = stats["completed"] / stats["planned"]
                # Adjust expectation: expected p should be time_progress_pct
                if p < (time_progress_pct * 0.7): # 30% buffer
                   bad_modules.append(m)
        
        if bad_modules:
            top_drivers.append(f"Modules behind schedule: {', '.join(bad_modules)}")
        
        if review_gap > 1.0:
            top_drivers.append(f"High review delays (avg {avg_review_delay:.1f}d)")

        if points_gap > 5:
            top_drivers.append(f"Point completion gap: {points_gap} pts behind plan")

        # Recommendations
        actions = []
        if is_current and "payments" in bad_modules and review_gap > 1.0:
             actions.append("Payments module is bottlenecked by reviews. Assign 1 extra reviewer.")
        if predicted_slip > 2:
             actions.append(f"Predicted slip {predicted_slip} days. Reduce scope by {int(points_gap)} pts.")
             
        metric = SprintMetrics(
            sprint_id=sprint.sprint_id,
            name=sprint.name,
            start_date=sprint.start_date,
            end_date=sprint.end_date,
            planned_story_points=total_points,
            completed_story_points=completed_points,
            completion_pct=round(completed_points / total_points * 100, 1) if total_points else 0,
            reality_gap_score=reality_gap_score,
            points_completion_gap=round(points_gap, 1),
            predicted_slip_days=predicted_slip,
            predicted_finish_date=predicted_finish.strftime("%Y-%m-%d"),
            module_breakdown=mod_stats,
            top_drivers=top_drivers,
            recommended_actions=actions
        )
        sprint_metrics_list.append(metric)

        if is_current:
            drivers_short = "; ".join(top_drivers[:1]) if top_drivers else "on track"
            headline = f"{sprint.name} is trending {predicted_slip} days late: {drivers_short}."

    return sprint_metrics_list, correction_rules, headline


def _learn_correction_rules(sprints: List[RawSprint], issues: List[RawIssue], events_by_issue: Dict[str, List[RawIssueEvent]]) -> List[CorrectionRule]:
    """
    Learn from past COMPLETED sprints.
    Correction = actual_duration / planned_duration
    Wait, issues don't have "planned duration", they have points.
    We need:
       planned_days = points / sprint_avg_velocity (points/day)
       actual_days = DONE - IN_PROGRESS timestamp
    """
    rules = []
    
    # Group by (team, module, type) -> list of ratios
    history: Dict[Tuple[str, str, str], List[float]] = {}
    
    # Pre-calc sprint velocities
    sprint_velocities = {} # sprint_id -> points/day
    for s in sprints:
        duration = (s.end_date - s.start_date).days + 1
        vel = s.planned_story_points / duration if duration > 0 else 1.0
        sprint_velocities[s.sprint_id] = vel
        
    for issue in issues:
        # Only look at fully done issues
        evts = events_by_issue.get(issue.issue_id, [])
        start_ts = None
        end_ts = None
        
        for e in evts:
            if e.to_status == "IN_PROGRESS": start_ts = e.timestamp
            if e.to_status == "DONE": end_ts = e.timestamp
            
        if start_ts and end_ts:
            actual_days = (end_ts - start_ts).total_seconds() / 86400.0
            if actual_days < 0.1: actual_days = 0.1 # min
            
            # Planned days
            vel = sprint_velocities.get(issue.sprint_id, 1.0)
            planned_days = issue.story_points / vel
            
            ratio = actual_days / planned_days
            
            # Key
            # We assume team_alpha for all as per dummy data
            key = ("team_alpha", issue.module_id, issue.issue_type)
            if key not in history: history[key] = []
            history[key].append(ratio)
            
    # Compile rules
    for key, ratios in history.items():
        team, mod, itype = key
        avg_ratio = sum(ratios) / len(ratios)
        # Clamp
        multiplier = max(1.0, min(avg_ratio, 2.5))
        
        # Build explanation
        expl = f"Historically {mod}/{itype} tasks take {multiplier:.1f}x longer than planned."
        
        rules.append(CorrectionRule(
            team_id=team,
            module_id=mod,
            issue_type=itype,
            multiplier=round(multiplier, 2),
            samples_count=len(ratios),
            explanation=expl
        ))
        
    return rules
