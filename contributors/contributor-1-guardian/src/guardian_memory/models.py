from dataclasses import dataclass
from typing import Literal, Mapping, Sequence

Outcome = Literal["approve", "request_revision", "escalate"]


@dataclass(frozen=True)
class Feedback:
    id: str
    author: str
    content: str


@dataclass(frozen=True)
class Evidence:
    id: str
    type: str
    locator: str
    summary: str
    content_hash: str | None = None


@dataclass(frozen=True)
class UnresolvedIssue:
    id: str
    description: str


@dataclass(frozen=True)
class PriorDecision:
    id: str
    outcome: Outcome
    rationale: str


@dataclass(frozen=True)
class ReviewRequest:
    project_id: str
    milestone_id: str
    acceptance_criteria: tuple[str, ...]
    feedback: tuple[Feedback, ...]
    evidence: tuple[Evidence, ...]
    unresolved_issues: tuple[UnresolvedIssue, ...] = ()
    prior_decisions: tuple[PriorDecision, ...] = ()


@dataclass(frozen=True)
class Decision:
    outcome: Outcome
    rationale: str
    confidence: float
    cited_memory_ids: tuple[str, ...]
    cited_evidence_ids: tuple[str, ...]
    missing_information: tuple[str, ...]


def review_request_from_dict(raw: Mapping[str, object]) -> ReviewRequest:
    allowed_fields = {"project_id", "milestone_id", "acceptance_criteria", "feedback", "evidence", "unresolved_issues", "prior_decisions"}
    unknown_fields = set(raw) - allowed_fields
    if unknown_fields:
        raise ValueError(f"unknown review request fields: {', '.join(sorted(unknown_fields))}")
    feedback_items = raw.get("feedback")
    evidence_items = raw.get("evidence")
    criteria = raw.get("acceptance_criteria")
    if not isinstance(criteria, Sequence) or isinstance(criteria, (str, bytes)):
        raise ValueError("acceptance_criteria must be a list")
    if not isinstance(feedback_items, Sequence) or isinstance(feedback_items, (str, bytes)):
        raise ValueError("feedback must be a list")
    if not isinstance(evidence_items, Sequence) or isinstance(evidence_items, (str, bytes)):
        raise ValueError("evidence must be a list")

    def required_text(value: object, field: str) -> str:
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f"{field} must be a non-empty string")
        return value

    feedback: list[Feedback] = []
    for item in feedback_items:
        if not isinstance(item, Mapping):
            raise ValueError("feedback items must be objects")
        feedback.append(
            Feedback(
                id=required_text(item.get("id"), "feedback.id"),
                author=required_text(item.get("author"), "feedback.author"),
                content=required_text(item.get("content"), "feedback.content"),
            )
        )

    evidence: list[Evidence] = []
    for item in evidence_items:
        if not isinstance(item, Mapping):
            raise ValueError("evidence items must be objects")
        evidence.append(
            Evidence(
                id=required_text(item.get("id"), "evidence.id"),
                type=required_text(item.get("type"), "evidence.type"),
                locator=required_text(item.get("locator"), "evidence.locator"),
                summary=required_text(item.get("summary"), "evidence.summary"),
                content_hash=item.get("content_hash") if isinstance(item.get("content_hash"), str) else None,
            )
        )

    unresolved_raw = raw.get("unresolved_issues", [])
    if not isinstance(unresolved_raw, Sequence) or isinstance(unresolved_raw, (str, bytes)):
        raise ValueError("unresolved_issues must be a list")
    unresolved_issues: list[UnresolvedIssue] = []
    for item in unresolved_raw:
        if not isinstance(item, Mapping):
            raise ValueError("unresolved issue items must be objects")
        unresolved_issues.append(
            UnresolvedIssue(
                id=required_text(item.get("id"), "unresolved_issues.id"),
                description=required_text(item.get("description"), "unresolved_issues.description"),
            )
        )

    decisions_raw = raw.get("prior_decisions", [])
    if not isinstance(decisions_raw, Sequence) or isinstance(decisions_raw, (str, bytes)):
        raise ValueError("prior_decisions must be a list")
    prior_decisions: list[PriorDecision] = []
    for item in decisions_raw:
        if not isinstance(item, Mapping):
            raise ValueError("prior decision items must be objects")
        outcome = item.get("outcome")
        if outcome not in {"approve", "request_revision", "escalate"}:
            raise ValueError("prior_decisions.outcome is invalid")
        prior_decisions.append(
            PriorDecision(
                id=required_text(item.get("id"), "prior_decisions.id"),
                outcome=outcome,
                rationale=required_text(item.get("rationale"), "prior_decisions.rationale"),
            )
        )
    return ReviewRequest(
        project_id=required_text(raw.get("project_id"), "project_id"),
        milestone_id=required_text(raw.get("milestone_id"), "milestone_id"),
        acceptance_criteria=tuple(required_text(item, "acceptance_criteria item") for item in criteria),
        feedback=tuple(feedback),
        evidence=tuple(evidence),
        unresolved_issues=tuple(unresolved_issues),
        prior_decisions=tuple(prior_decisions),
    )


def decision_from_dict(raw: Mapping[str, object]) -> Decision:
    allowed_fields = {"outcome", "rationale", "confidence", "cited_memory_ids", "cited_evidence_ids", "missing_information"}
    unknown_fields = set(raw) - allowed_fields
    if unknown_fields:
        raise ValueError(f"unknown decision fields: {', '.join(sorted(unknown_fields))}")
    outcome = raw.get("outcome")
    if outcome not in {"approve", "request_revision", "escalate"}:
        raise ValueError("outcome must be approve, request_revision, or escalate")
    rationale = raw.get("rationale")
    confidence = raw.get("confidence")
    if not isinstance(rationale, str) or not rationale.strip():
        raise ValueError("rationale must be a non-empty string")
    if not isinstance(confidence, (int, float)) or isinstance(confidence, bool) or not 0 <= confidence <= 1:
        raise ValueError("confidence must be between 0 and 1")

    def string_tuple(field: str) -> tuple[str, ...]:
        value = raw.get(field)
        if not isinstance(value, Sequence) or isinstance(value, (str, bytes)):
            raise ValueError(f"{field} must be a list")
        if not all(isinstance(item, str) and item.strip() for item in value):
            raise ValueError(f"{field} must contain non-empty strings")
        return tuple(value)

    return Decision(
        outcome=outcome,
        rationale=rationale,
        confidence=float(confidence),
        cited_memory_ids=string_tuple("cited_memory_ids"),
        cited_evidence_ids=string_tuple("cited_evidence_ids"),
        missing_information=string_tuple("missing_information"),
    )
