import argparse
import json
from pathlib import Path

from .guardian import Guardian
from .models import review_request_from_dict
from .reasoning import DeterministicReasoner, GroqReasoner, ReasoningProvider
from .sibyl_store import SibylStore, decision_to_dict


def _build_reasoner(name: str) -> ReasoningProvider:
    if name == "groq":
        return GroqReasoner()
    return DeterministicReasoner()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a Sibyl-backed milestone review")
    parser.add_argument("fixture", type=Path)
    parser.add_argument("--database", type=Path, default=Path(".sibyl-memory/guardian.db"))
    parser.add_argument(
        "--output",
        type=Path,
        help="Write the validated decision JSON to this path instead of only printing it.",
    )
    parser.add_argument("--seed", action="store_true")
    parser.add_argument(
        "--reasoner",
        choices=["deterministic", "groq"],
        default="groq",
        help="Reasoning provider (default: groq). Requires GROQ_API_KEY in env. Use 'deterministic' to run without a key.",
    )
    args = parser.parse_args()
    request = review_request_from_dict(json.loads(args.fixture.read_text(encoding="utf-8")))
    guardian = Guardian(SibylStore.local(args.database), reasoner=_build_reasoner(args.reasoner))
    if args.seed:
        guardian.seed(request)
    decision_json = json.dumps(decision_to_dict(guardian.review(request)), indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(f"{decision_json}\n", encoding="utf-8")
    print(decision_json)


if __name__ == "__main__":
    main()
