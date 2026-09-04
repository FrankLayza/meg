import json
from dataclasses import replace
from pathlib import Path

import pytest

pytest.importorskip("sibyl_memory_client")

from guardian_memory import Guardian, SibylStore, decision_from_dict
from guardian_memory.models import review_request_from_dict


ROOT = Path(__file__).resolve().parents[3]
FIXTURE = ROOT / "shared" / "fixtures" / "review-request-missing-idempotency.json"


def load_request():
    return review_request_from_dict(json.loads(FIXTURE.read_text(encoding="utf-8")))


def test_fresh_session_recalls_requirements(tmp_path: Path):
    database = tmp_path / "memory.db"
    request = load_request()
    Guardian(SibylStore.local(database)).seed(request)
    decision = Guardian(SibylStore.local(database)).review(request)
    assert decision.outcome == "request_revision"
    assert "idempotent" in " ".join(decision.missing_information)
    assert "feedback-001" in decision.cited_memory_ids


def test_approved_evidence_is_accepted_in_a_fresh_session(tmp_path: Path):
    database = tmp_path / "memory.db"
    request = review_request_from_dict(
        json.loads((ROOT / "shared" / "fixtures" / "review-request-approved.json").read_text(encoding="utf-8"))
    )
    Guardian(SibylStore.local(database)).seed(request)
    decision = Guardian(SibylStore.local(database)).review(request)
    assert decision.outcome == "approve"
    assert decision.missing_information == ()
    assert decision.cited_evidence_ids == ("commit-def456",)


def test_missing_evidence_requests_revision(tmp_path: Path):
    database = tmp_path / "memory.db"
    request = replace(load_request(), evidence=())
    Guardian(SibylStore.local(database)).seed(request)
    decision = Guardian(SibylStore.local(database)).review(request)
    assert decision.outcome == "request_revision"
    assert any("No deliverable evidence" in item for item in decision.missing_information)


def test_unresolved_issue_escalates(tmp_path: Path):
    database = tmp_path / "memory.db"
    base = load_request()
    request = review_request_from_dict(
        {
            "project_id": base.project_id,
            "milestone_id": base.milestone_id,
            "acceptance_criteria": list(base.acceptance_criteria),
            "feedback": [{"id": item.id, "author": item.author, "content": item.content} for item in base.feedback],
            "evidence": [
                {"id": item.id, "type": item.type, "locator": item.locator, "summary": item.summary}
                for item in base.evidence
            ],
            "unresolved_issues": [
                {"id": "issue-001", "description": "Client has not approved the retention policy."}
            ],
        }
    )
    Guardian(SibylStore.local(database)).seed(request)
    decision = Guardian(SibylStore.local(database)).review(request)
    assert decision.outcome == "escalate"
    assert "issue-001" in decision.cited_memory_ids


def test_contradictory_feedback_escalates(tmp_path: Path):
    database = tmp_path / "memory.db"
    request = review_request_from_dict(
        {
            "project_id": "project-conflict",
            "milestone_id": "milestone-001",
            "acceptance_criteria": ["API requests must support retries"],
            "feedback": [
                {"id": "feedback-positive", "author": "client", "content": "Retries are required for this milestone."},
                {"id": "feedback-negative", "author": "client", "content": "Retries are no longer required; drop the requirement."},
            ],
            "evidence": [
                {"id": "commit-1", "type": "github_commit", "locator": "commit-1", "summary": "Adds API retries."},
            ],
        }
    )
    Guardian(SibylStore.local(database)).seed(request)
    decision = Guardian(SibylStore.local(database)).review(request)
    assert decision.outcome == "escalate"
    assert "feedback-negative" in decision.cited_memory_ids


def test_without_seeded_memory_does_not_approve(tmp_path: Path):
    request = load_request()
    decision = Guardian(SibylStore.local(tmp_path / "empty.db")).review(request)
    assert decision.outcome == "escalate"
    assert decision.missing_information == ("No acceptance criteria available from project memory",)


def test_decision_contract_rejects_invalid_output():
    with pytest.raises(ValueError):
        decision_from_dict({"outcome": "unknown"})

    with pytest.raises(ValueError, match="unknown decision fields"):
        decision_from_dict({"outcome": "approve", "unexpected": True})


def test_review_request_rejects_malformed_nested_items():
    with pytest.raises(ValueError, match="feedback items must be objects"):
        review_request_from_dict(
            {
                "project_id": "project-001",
                "milestone_id": "milestone-001",
                "acceptance_criteria": ["criterion"],
                "feedback": ["not-an-object"],
                "evidence": [],
            }
        )

    with pytest.raises(ValueError, match="unknown review request fields"):
        review_request_from_dict(
            {
                "project_id": "project-001",
                "milestone_id": "milestone-001",
                "acceptance_criteria": ["criterion"],
                "feedback": [],
                "evidence": [],
                "unexpected": True,
            }
        )
