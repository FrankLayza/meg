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
class ReviewRequest:
    project_id: str
    milestone_id: str
    acceptance_criteria: tuple[str, ...]
    feedback: tuple[Feedback, ...]
    evidence: tuple[Evidence, ...]


@dataclass(frozen=True)
class Decision:
    outcome: Outcome
    rationale: str
    confidence: float
    cited_memory_ids: tuple[str, ...]
    cited_evidence_ids: tuple[str, ...]
    missing_information: tuple[str, ...]


def review_request_from_dict(raw: Mapping[str, object]) -> ReviewRequest:
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

    feedback = tuple(
        Feedback(
            id=required_text(item.get("id"), "feedback.id"),
            author=required_text(item.get("author"), "feedback.author"),
            content=required_text(item.get("content"), "feedback.content"),
        )
        for item in feedback_items
        if isinstance(item, Mapping)
    )
    evidence = tuple(
        Evidence(
            id=required_text(item.get("id"), "evidence.id"),
            type=required_text(item.get("type"), "evidence.type"),
            locator=required_text(item.get("locator"), "evidence.locator"),
            summary=required_text(item.get("summary"), "evidence.summary"),
            content_hash=item.get("content_hash") if isinstance(item.get("content_hash"), str) else None,
        )
        for item in evidence_items
        if isinstance(item, Mapping)
    )
    return ReviewRequest(
        project_id=required_text(raw.get("project_id"), "project_id"),
        milestone_id=required_text(raw.get("milestone_id"), "milestone_id"),
        acceptance_criteria=tuple(required_text(item, "acceptance_criteria item") for item in criteria),
        feedback=feedback,
        evidence=evidence,
    )


def decision_from_dict(raw: Mapping[str, object]) -> Decision:
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
