import json
from pathlib import Path
from typing import Mapping, Protocol, Sequence

from sibyl_memory_client.exceptions import NotFoundError

from .models import Decision, ReviewRequest


class MemoryClientProtocol(Protocol):
    def set_entity(self, category: str, name: str, body: dict[str, object]) -> Mapping[str, object]: ...
    def get_entity(self, category: str, name: str) -> Mapping[str, object]: ...
    def set_state(self, key: str, body: dict[str, object]) -> None: ...
    def get_state(self, key: str) -> Mapping[str, object] | None: ...
    def set_reference(self, key: str, body: str | dict[str, object]) -> None: ...
    def get_reference(self, key: str) -> Mapping[str, object] | None: ...
    def write_event(self, *, acted: Sequence[str]) -> str: ...
    def read_events(self, *, limit: int = 50) -> list[Mapping[str, object]]: ...


class SibylStore:
    """Application-owned mapping between Guardian records and Sibyl tiers."""

    def __init__(self, memory_client: MemoryClientProtocol):
        self._memory = memory_client

    @classmethod
    def local(cls, database_path: str | Path) -> "SibylStore":
        from sibyl_memory_client import MemoryClient

        return cls(MemoryClient.local(str(database_path)))

    def seed_project(self, request: ReviewRequest) -> None:
        scope = self._scope(request.project_id, request.milestone_id)
        self._memory.set_entity(
            "project",
            request.project_id,
            {
                "project_id": request.project_id,
                "status": "active",
                "milestone_id": request.milestone_id,
                "stakeholder_expectations": [feedback.content for feedback in request.feedback],
            },
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
        for issue in request.unresolved_issues:
            self._write_scoped_event(scope, "unresolved_issue", issue.id, {"description": issue.description})
        for decision in request.prior_decisions:
            self._write_scoped_event(scope, "prior_decision", decision.id, {"outcome": decision.outcome, "rationale": decision.rationale})

    def record_submission(self, request: ReviewRequest) -> None:
        scope = self._scope(request.project_id, request.milestone_id)
        for evidence in request.evidence:
            self._write_scoped_event(
                scope,
                "evidence",
                evidence.id,
                {
                    "type": evidence.type,
                    "locator": evidence.locator,
                    "summary": evidence.summary,
                    "content_hash": evidence.content_hash,
                },
            )

    def record_decision(self, request: ReviewRequest, decision: Decision) -> None:
        scope = self._scope(request.project_id, request.milestone_id)
        self._write_scoped_event(scope, "decision", f"decision-{scope}", decision_to_dict(decision))
        self._memory.set_state(
            f"{scope}:review",
            {"project_id": request.project_id, "milestone_id": request.milestone_id, "status": decision.outcome},
        )

    def review_context(self, project_id: str, milestone_id: str) -> Mapping[str, object]:
        scope = self._scope(project_id, milestone_id)
        reference = self._memory.get_reference(f"{scope}:criteria")
        project = self._get_entity_or_none(project_id)
        return {
            "project": project,
            "review_state": self._memory.get_state(f"{scope}:review"),
            "criteria": self._decode_reference(reference),
            "history": self._scoped_events(scope),
        }

    def _get_entity_or_none(self, project_id: str) -> Mapping[str, object] | None:
        try:
            return self._memory.get_entity("project", project_id)
        except NotFoundError:
            return None

    @staticmethod
    def _scope(project_id: str, milestone_id: str) -> str:
        return f"{project_id}:{milestone_id}"

    def _write_scoped_event(self, scope: str, kind: str, record_id: str, body: Mapping[str, object]) -> str:
        payload = {"scope": scope, "kind": kind, "id": record_id, **body}
        return self._memory.write_event(acted=[json.dumps(payload, sort_keys=True)])

    def _scoped_events(self, scope: str) -> list[dict[str, object]]:
        records: list[dict[str, object]] = []
        for event in self._memory.read_events(limit=500):
            event_id = event.get("id")
            acted = event.get("acted")
            if not isinstance(acted, Sequence) or isinstance(acted, (str, bytes)):
                continue
            for entry in acted:
                if not isinstance(entry, str):
                    continue
                try:
                    payload = json.loads(entry)
                except json.JSONDecodeError:
                    continue
                if isinstance(payload, dict) and payload.get("scope") == scope:
                    record = dict(payload)
                    if isinstance(event_id, str):
                        record["event_id"] = event_id
                    records.append(record)
        return records

    @staticmethod
    def _decode_reference(reference: Mapping[str, object] | None) -> dict[str, object] | None:
        if reference is None:
            return None
        body = reference.get("body")
        if isinstance(body, Mapping):
            return dict(body)
        if isinstance(body, str):
            try:
                decoded = json.loads(body)
            except json.JSONDecodeError:
                return None
            return dict(decoded) if isinstance(decoded, dict) else None
        return None


def decision_to_dict(decision: Decision) -> dict[str, object]:
    return {
        "outcome": decision.outcome,
        "rationale": decision.rationale,
        "confidence": decision.confidence,
        "cited_memory_ids": list(decision.cited_memory_ids),
        "cited_evidence_ids": list(decision.cited_evidence_ids),
        "missing_information": list(decision.missing_information),
    }
