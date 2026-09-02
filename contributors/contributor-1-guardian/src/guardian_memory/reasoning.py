import re
from typing import Mapping, Protocol, Sequence

from .models import Evidence


class ReasoningProvider(Protocol):
    def evaluate(self, context: Mapping[str, object], evidence: Sequence[Evidence]) -> Mapping[str, object]:
        """Return a candidate Guardian decision. A future LLM implements this contract."""


class DeterministicReasoner:
    """Temporary reasoning implementation used until an LLM provider is selected."""

    _STOP_WORDS = {"api", "must", "support", "include", "the", "and", "for", "with", "requests"}

    def evaluate(self, context: Mapping[str, object], evidence: Sequence[Evidence]) -> Mapping[str, object]:
        criteria_record = context.get("criteria")
        criteria = criteria_record.get("criteria", []) if isinstance(criteria_record, Mapping) else []
        evidence_text = " ".join(item.summary.lower() for item in evidence)
        missing = [criterion for criterion in criteria if not self._criterion_present(str(criterion), evidence_text)]
        evidence_ids = [item.id for item in evidence]
        memory_ids = ["criteria", *[f"feedback:{item}" for item in self._feedback_ids(context)]]
        if missing:
            return {
                "outcome": "request_revision",
                "rationale": "The submission does not address all requirements recalled from the project history.",
                "confidence": 0.9,
                "cited_memory_ids": memory_ids,
                "cited_evidence_ids": evidence_ids,
                "missing_information": missing,
            }
        return {
            "outcome": "approve",
            "rationale": "The submission addresses the requirements recalled from the project history.",
            "confidence": 0.86,
            "cited_memory_ids": memory_ids,
            "cited_evidence_ids": evidence_ids,
            "missing_information": [],
        }

    def _criterion_present(self, criterion: str, evidence_text: str) -> bool:
        terms = [term for term in re.findall(r"[a-z0-9]+", criterion.lower()) if term not in self._STOP_WORDS and len(term) > 3]
        return bool(terms) and all(term in evidence_text for term in terms)

    @staticmethod
    def _feedback_ids(context: Mapping[str, object]) -> list[str]:
        history = context.get("history")
        if not isinstance(history, Sequence) or isinstance(history, (str, bytes)):
            return []
        ids: list[str] = []
        for item in history:
            if isinstance(item, Mapping) and item.get("kind") == "feedback" and isinstance(item.get("id"), str):
                ids.append(item["id"])
        return ids
