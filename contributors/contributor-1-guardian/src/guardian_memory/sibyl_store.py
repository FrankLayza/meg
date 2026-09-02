import json
from pathlib import Path
from typing import Any, Mapping

from .models import Decision, ReviewRequest


class SibylStore:
    """Application-owned mapping between Guardian records and Sibyl tiers."""

    def __init__(self, memory_client: Any):
        self._memory = memory_client

    @classmethod
    def local(cls, database_path: str | Path) -> "SibylStore":
        from sibyl_memory_client import MemoryClient

        return cls(MemoryClient.local(str(database_path)))

    def seed_project(self, request: ReviewRequest) -> None:
        scope = f"{request.project_id}:{request.milestone_id}"
        self._memory.set_entity(
            "project",
            request.project_id,
            {"project_id": request.project_id, "status": "active", "milestone_id": request.milestone_id},
        )
        self._memory.set_state(
            f"{scope}:review",
            {"project_id": request.project_id, "milestone_id": request.milestone_id, "status": "pending"},
        )
        self._memory.set_reference(
            f"{scope}:criteria",
            {"project_id": request.project_id, "milestone_id": request.milestone_id, "criteria": list(request.acceptance_criteria)},
        )
        for feedback in request.feedback:
            self._write_scoped_event(scope, "feedback", feedback.id, {"author": feedback.author, "content": feedback.content})

    def record_submission(self, request: ReviewRequest) -> None:
        scope = f"{request.project_id}:{request.milestone_id}"
        for evidence in request.evidence:
            self._write_scoped_event(
                scope,
                "evidence",
                evidence.id,
                {"type": evidence.type, "locator": evidence.locator, "summary": evidence.summary, "content_hash": evidence.content_hash},
            )

    def record_decision(self, request: ReviewRequest, decision: Decision) -> None:
        scope = f"{request.project_id}:{request.milestone_id}"
        self._write_scoped_event(scope, "decision", f"decision-{scope}", decision_to_dict(decision))
        self._memory.set_state(
            f"{scope}:review",
            {"project_id": request.project_id, "milestone_id": request.milestone_id, "status": decision.outcome},
        )

    def review_context(self, project_id: str, milestone_id: str) -> Mapping[str, object]:
        scope = f"{project_id}:{milestone_id}"
        return {
            "project": self._memory.get_entity("project", project_id),
            "review_state": self._memory.get_state(f"{scope}:review"),
            "criteria": self._memory.get_reference(f"{scope}:criteria"),
            "history": self._memory.search_entities(scope),
        }

    def _write_scoped_event(self, scope: str, kind: str, record_id: str, body: Mapping[str, object]) -> None:
        payload = {"scope": scope, "kind": kind, "id": record_id, **body}
        self._memory.write_event(acted=[json.dumps(payload, sort_keys=True)])


def decision_to_dict(decision: Decision) -> dict[str, object]:
    return {
        "outcome": decision.outcome,
        "rationale": decision.rationale,
        "confidence": decision.confidence,
        "cited_memory_ids": list(decision.cited_memory_ids),
        "cited_evidence_ids": list(decision.cited_evidence_ids),
        "missing_information": list(decision.missing_information),
    }
