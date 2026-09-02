import json
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
    assert decision.cited_memory_ids


def test_decision_contract_rejects_invalid_output():
    with pytest.raises(ValueError):
        decision_from_dict({"outcome": "unknown"})
