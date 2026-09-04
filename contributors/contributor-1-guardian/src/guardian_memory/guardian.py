from typing import Mapping

from .models import Decision, ReviewRequest, decision_from_dict
from .reasoning import DeterministicReasoner, ReasoningProvider
from .sibyl_store import SibylStore


class Guardian:
    def __init__(self, store: SibylStore, reasoner: ReasoningProvider | None = None) -> None:
        self._store = store
        self._reasoner = reasoner or DeterministicReasoner()

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
