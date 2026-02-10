from typing import List, Dict, Set
from datetime import datetime
from backend_app.core.models import RawPR, RawReview, RawCommit, Signal

WEIGHT_COMMIT = 1.0
WEIGHT_REVIEW_APPROVED = 3.0
WEIGHT_REVIEW_COMMENTED = 2.0
WEIGHT_REVIEW_CHANGES_REQUESTED = 2.5

def get_modules_for_paths(paths: List[str], modules_config: Dict[str, List[str]]) -> Set[str]:
    """
    Given a list of file paths changed in a PR or Commit,
    return the set of module_ids that apply.
    A path belongs to a module if it starts with any of the module's prefixes.
    """
    matched_modules = set()
    # Debug: if no paths, maybe root? No, we need changed paths.
    if not paths:
        # If no paths info (e.g. from API limitation), assume root if config has root
        if "root" in modules_config:
            return {"root"}
        return set()

    for path in paths:
        path_str = str(path)
        mapped = False
        for mod_id, prefixes in modules_config.items():
            for prefix in prefixes:
                # Handle root special case: prefix "" matches everything
                if prefix == "" or path_str.startswith(prefix):
                    matched_modules.add(mod_id)
                    mapped = True
        
        # Fallback: if path didn't map to anything specific, map to 'root' if it exists
        if not mapped and "root" in modules_config:
            matched_modules.add("root")
            
    return matched_modules

def process_signals(
    prs: List[RawPR],
    reviews: List[RawReview],
    commits: List[RawCommit],
    modules_config: Dict[str, List[str]]
) -> Dict[str, List[Signal]]:
    """
    Convert raw events into signals grouped by module_id.
    """
    signals_by_module: Dict[str, List[Signal]] = {}
    
    # Init empty list for all modules so we get a result even if 0 signals
    for mod_id in modules_config:
        signals_by_module[mod_id] = []
    
    # Helper to append signal
    def add_signal(mod_id: str, sig: Signal):
        if mod_id not in signals_by_module:
            signals_by_module[mod_id] = []
        signals_by_module[mod_id].append(sig)

    # 1. Process Commits

    # 1. Process Commits
    for commit in commits:
        files = commit.files_changed
        if not files: 
            # If files list is empty from Supabase, try to fallback to 'root'
            files = []
            
        affected_modules = get_modules_for_paths(files, modules_config)
            
        for mod_id in affected_modules:
            # Create signal from commit
            sig = Signal(
                person_id=commit.author,
                module_id=mod_id,
                signal_type="commit",
                weight=1.0, # WEIGHT_COMMIT
                timestamp=commit.timestamp,
                source_id=commit.commit_id
            )
            # Add to module list
            if mod_id not in signals_by_module:
                 signals_by_module[mod_id] = []
            signals_by_module[mod_id].append(sig)


    # 2. Process PRs and Reviews
    # NEW RULE: If reviews are missing in Supabase, treat PR creation/merge as a signal for the AUTHOR.
    # This ensures we get risk data even if no reviews exist.
    
    # Process PR Author signals
    for pr in prs:
        # Fallback for empty files list
        files = pr.files_changed if pr.files_changed else []
        affected_modules = get_modules_for_paths(files, modules_config)
            
        for mod_id in affected_modules:
            # Treat PR creation as a signal (e.g. weight 1.5)
            sig = Signal(
                person_id=pr.author,
                module_id=mod_id,
                signal_type="pr_created",
                weight=1.5,
                timestamp=pr.created_at,
                source_id=pr.pr_id
            )
            add_signal(mod_id, sig)
            
    # Process Reviews (if any)
    pr_map = {pr.pr_id: pr for pr in prs}

    for review in reviews:
        if review.pr_id not in pr_map:
            continue # Skip reviews for unknown PRs
            
        pr = pr_map[review.pr_id]
        affected_modules = get_modules_for_paths(pr.files_changed, modules_config)
        
        # Determine weight and type
        w = 0.0
        s_type = ""
        if review.state == "APPROVED":
            w = WEIGHT_REVIEW_APPROVED
            s_type = "review_approval"
        elif review.state == "COMMENTED":
            w = WEIGHT_REVIEW_COMMENTED
            s_type = "review_comment"
        elif review.state == "CHANGES_REQUESTED":
            w = WEIGHT_REVIEW_CHANGES_REQUESTED
            s_type = "review_changes_requested"
        else:
            continue # Unknown state

        for mod_id in affected_modules:
            sig = Signal(
                person_id=review.reviewer,
                module_id=mod_id,
                signal_type=s_type,
                weight=w,
                timestamp=review.timestamp,
                source_id=review.pr_id
            )
            add_signal(mod_id, sig)
            
    return signals_by_module
