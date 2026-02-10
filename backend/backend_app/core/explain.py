from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from backend_app.core.models import ModuleMetric

def generate_explanation(metric: 'ModuleMetric') -> str:
    """
    A deterministic explanation that mentions:
    - risk score
    - top1 share %
    - bus factor interpretation
    - 1–2 evidence lines
    """
    # Headline
    text = f"Risk Score: {metric.risk_index} ({metric.severity}). "
    
    # Top Share
    top_person = metric.people[0] if metric.people else None
    if top_person:
        text += f"Top contributor {top_person.person_id} holds {top_person.share_pct*100:.1f}% of the knowledge. "
    else:
        text += "No knowledge signals recorded. "
        return text

    # Bus Factor
    if metric.bus_factor == 0:
        text += "Bus factor is 0 (CRITICAL: No one has >10% share? Check data). "
    elif metric.bus_factor == 1:
        text += "Bus factor is 1 (Single point of failure). "
    elif metric.bus_factor < 3:
        text += f"Bus factor is {metric.bus_factor} (Low redundancy). "
    else:
        text += f"Bus factor is {metric.bus_factor} (Good redundancy). "

    # Evidence (1-2 lines)
    if metric.evidence:
        text += "Key evidence: "
        text += "; ".join(metric.evidence[:2]) + "."
        
    return text
