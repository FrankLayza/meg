import os
from typing import Mapping

from .models import Decision, ReviewRequest, decision_from_dict
from .reasoning import DeterministicReasoner, GroqReasoner, ReasoningProvider
from .sibyl_store import SibylStore


def _default_reasoner() -> ReasoningProvider:
    """Pick GroqReasoner when GROQ_API_KEY is present, otherwise fall back to DeterministicReasoner."""
    if os.environ.get("GROQ_API_KEY"):
        return GroqReasoner()
    return DeterministicReasoner()


class Guardian:
    def __init__(self, store: SibylStore, reasoner: ReasoningProvider | None = None) -> None:
        self._store = store
        self._reasoner = reasoner if reasoner is not None else _default_reasoner()

    def seed(self, request: ReviewRequest) -> None:
        self._store.seed_project(request)

    def review(self, request: ReviewRequest) -> Decision:
        self._store.record_submission(request)
        context = self._store.review_context(request.project_id, request.milestone_id)
        candidate = self._reasoner.evaluate(context, request.evidence)
        decision = decision_from_dict(candidate)
        self._store.record_decision(request, decision)
        return decision

    def context(self, project_id: str, milestone_id: str) -> Mapping[str, object]:
        return self._store.review_context(project_id, milestone_id)
