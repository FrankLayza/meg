import argparse
import json
from pathlib import Path

from .guardian import Guardian
from .models import review_request_from_dict
from .sibyl_store import SibylStore, decision_to_dict


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a Sibyl-backed milestone review")
    parser.add_argument("fixture", type=Path)
    parser.add_argument("--database", type=Path, default=Path(".sibyl-memory/guardian.db"))
    parser.add_argument("--seed", action="store_true")
    args = parser.parse_args()
    request = review_request_from_dict(json.loads(args.fixture.read_text(encoding="utf-8")))
    guardian = Guardian(SibylStore.local(args.database))
    if args.seed:
        guardian.seed(request)
    print(json.dumps(decision_to_dict(guardian.review(request)), indent=2))


if __name__ == "__main__":
    main()
