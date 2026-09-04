import json
import tempfile
from pathlib import Path

from guardian_memory import Guardian, SibylStore, decision_from_dict, review_request_from_dict
from guardian_memory.sibyl_store import decision_to_dict


FIXTURE = Path(__file__).resolve().parents[3] / "shared" / "fixtures" / "review-request-missing-idempotency.json"


def main() -> None:
    request = review_request_from_dict(json.loads(FIXTURE.read_text(encoding="utf-8")))
    directory = Path(tempfile.mkdtemp(prefix="guardian-deletion-"))
    seeded_database = directory / "seeded.db"
    empty_database = directory / "empty.db"
    Guardian(SibylStore.local(seeded_database)).seed(request)
    with_memory = Guardian(SibylStore.local(seeded_database)).review(request)
    without_memory = Guardian(SibylStore.local(empty_database)).review(request)
    result = {
        "with_memory": decision_to_dict(with_memory),
        "without_memory": decision_to_dict(without_memory),
        "memory_changed_outcome": with_memory.outcome != without_memory.outcome,
    }
    decision_from_dict(result["with_memory"])
    decision_from_dict(result["without_memory"])
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
