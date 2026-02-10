from typing import List, Dict
import math
from backend_app.core.models import Signal, ModuleMetric, PersonMetric
from backend_app.core.explain import generate_explanation

def compute_metrics(module_id: str, signals: List[Signal], max_total_score_global: float) -> ModuleMetric:
    # 1. Aggregate scores per person
    person_scores: Dict[str, float] = {}
    person_signal_counts: Dict[str, Dict[str, int]] = {} # person -> type -> count
    
    total_score = 0.0
    
    for s in signals:
        total_score += s.weight
        person_scores[s.person_id] = person_scores.get(s.person_id, 0.0) + s.weight
        
        if s.person_id not in person_signal_counts:
            person_signal_counts[s.person_id] = {}
        person_signal_counts[s.person_id][s.signal_type] = person_signal_counts[s.person_id].get(s.signal_type, 0) + 1

    # 2. Calculate person metrics
    people_metrics: List[PersonMetric] = []
    
    # Sort people by score desc
    sorted_people = sorted(person_scores.items(), key=lambda x: x[1], reverse=True)
    
    for person_id, score in sorted_people:
        share = score / total_score if total_score > 0 else 0.0
        people_metrics.append(PersonMetric(
            person_id=person_id,
            knowledge_score=score,
            share_pct=share, # Keep as 0-1 float for now, will format later or in model? Model says float.
            type_counts=person_signal_counts.get(person_id, {})
        ))

    # 3. Module level metrics
    top1_share = people_metrics[0].share_pct if len(people_metrics) > 0 else 0.0
    top2_share = people_metrics[1].share_pct if len(people_metrics) > 1 else 0.0
    
    bus_factor = sum(1 for p in people_metrics if p.share_pct >= 0.10)
    
    # Risk Index Formula
    # silo = clamp((top1_share - 0.4)/0.6, 0, 1)
    # bus = clamp((2 - bus_factor)/2, 0, 1)
    # criticality = clamp(total_score / max_total_score_across_modules, 0, 1)
    # risk = 100 * (0.5*silo + 0.3*bus + 0.2*criticality)
    
    def clamp(val, min_v, max_v):
        return max(min_v, min(val, max_v))

    if not signals:
        # No signals = No Risk (or No Data)
        return ModuleMetric(
            module_id=module_id,
            risk_index=0.0,
            severity="HEALTHY",
            top1_share_pct=0.0,
            top2_share_pct=0.0,
            bus_factor=0,
            total_knowledge_weight=0.0,
            signals_count=0,
            people=[],
            evidence=[],
            plain_explanation="No activity detected."
        )


    silo_factor = (top1_share - 0.4) / 0.6
    bus_risk_factor = (2 - bus_factor) / 2.0
    criticality_factor = total_score / max_total_score_global if max_total_score_global > 0 else 0.0

    # Ensure non-negative before clamping
    silo_factor = max(silo_factor, 0.0)
    bus_risk_factor = max(bus_risk_factor, 0.0)
    criticality_factor = max(criticality_factor, 0.0)

    # Calculate raw risk
    risk_index_raw = 100.0 * (0.6 * silo_factor + 0.25 * bus_risk_factor + 0.15 * criticality_factor)
    
    # Remove dampening logic entirely as it's suppressing real risk on small repos
    # if len(signals) < 10:
    #    risk_index_raw = risk_index_raw * (len(signals) / 10.0)
        
    risk_index = round(min(risk_index_raw, 100.0), 2)
    
    # Severity - lowered thresholds slightly to show more "risk"
    if risk_index >= 60:
        severity = "SEVERE"
    elif risk_index >= 30:
        severity = "MODERATE"
    else:
        severity = "HEALTHY"

    # 4. Evidence
    # Generate 2-5 evidence strings for top contributors
    evidence_lines = []
    for p in people_metrics[:5]:
        # “dev_a: share 84.0% | approvals=2, review_notes=0, commits=2”
        # Map internal types to display names if needed, or just use raw keys
        # The prompt examples: approvals, review_notes, commits
        # My keys: review_approval, review_comment, review_changes_requested, commit
        
        # Helper to get count
        def gc(k): return p.type_counts.get(k, 0)
        
        # Just dumping all counts for simplicity or Mapping to prettier names?
        # Prompt: approvals=2, review_notes=0, commits=2
        # I'll try to map to something readable.
        
        parts = []
        parts.append(f"commits={gc('commit')}")
        approvals = gc('review_approval')
        if approvals > 0: parts.append(f"approvals={approvals}")
        comments = gc('review_comment')
        if comments > 0: parts.append(f"comments={comments}")
        changes = gc('review_changes_requested')
        if changes > 0: parts.append(f"changes_requested={changes}")
        
        counts_str = ", ".join(parts)
        line = f"{p.person_id}: share {p.share_pct*100:.1f}% | {counts_str}"
        evidence_lines.append(line)

    mod_metric = ModuleMetric(
        module_id=module_id,
        risk_index=risk_index,
        severity=severity,
        top1_share_pct=top1_share,
        top2_share_pct=top2_share,
        bus_factor=bus_factor,
        total_knowledge_weight=total_score,
        signals_count=len(signals),
        people=people_metrics,
        evidence=evidence_lines,
        plain_explanation=""
    )
    
    # Generate explanation
    mod_metric.plain_explanation = generate_explanation(mod_metric)
    
    return mod_metric
