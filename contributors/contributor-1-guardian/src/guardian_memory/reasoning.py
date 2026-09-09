import json
import os
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
        if not isinstance(criteria, Sequence) or isinstance(criteria, (str, bytes)) or not criteria:
            return {
                "outcome": "escalate",
                "rationale": "No acceptance criteria were recalled for this project milestone.",
                "confidence": 0.98,
                "cited_memory_ids": [],
                "cited_evidence_ids": [item.id for item in evidence],
                "missing_information": ["No acceptance criteria available from project memory"],
            }
        evidence_text = " ".join(item.summary.lower() for item in evidence)
        missing = [criterion for criterion in criteria if not self._criterion_present(str(criterion), evidence_text)]
        evidence_ids = [item.id for item in evidence]
        memory_ids = ["criteria", *self._feedback_ids(context)]
        conflicts = self._conflicting_feedback(context, criteria)
        if conflicts:
            return {
                "outcome": "escalate",
                "rationale": "Project feedback contains conflicting expectations for the milestone criteria.",
                "confidence": 0.92,
                "cited_memory_ids": [*memory_ids, *conflicts],
                "cited_evidence_ids": evidence_ids,
                "missing_information": ["Resolve contradictory stakeholder feedback before deciding"],
            }
        unresolved = self._records_by_kind(context, "unresolved_issue")
        if unresolved:
            issue_ids = [item["id"] for item in unresolved if isinstance(item.get("id"), str)]
            return {
                "outcome": "escalate",
                "rationale": "The project history contains unresolved issues that require human review before release.",
                "confidence": 0.94,
                "cited_memory_ids": [*memory_ids, *issue_ids],
                "cited_evidence_ids": evidence_ids,
                "missing_information": [str(item.get("description")) for item in unresolved],
            }
        if missing:
            if not evidence:
                missing = ["No deliverable evidence was submitted", *[str(item) for item in missing]]
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

    @staticmethod
    def _criterion_present(criterion: str, evidence_text: str) -> bool:
        terms = [
            DeterministicReasoner._normalize_term(term)
            for term in re.findall(r"[a-z0-9]+", criterion.lower())
            if term not in DeterministicReasoner._STOP_WORDS and len(term) > 3
        ]
        evidence_terms = {DeterministicReasoner._normalize_term(term) for term in re.findall(r"[a-z0-9]+", evidence_text.lower())}
        return bool(terms) and all(term in evidence_terms for term in terms)

    @staticmethod
    def _normalize_term(term: str) -> str:
        if term.endswith("ies") and len(term) > 4:
            return f"{term[:-3]}y"
        if term.endswith("s") and len(term) > 4:
            return term[:-1]
        return term

    @staticmethod
    def _feedback_ids(context: Mapping[str, object]) -> list[str]:
        return [
            item["id"]
            for item in DeterministicReasoner._records_by_kind(context, "feedback")
            if isinstance(item.get("id"), str)
        ]

    @staticmethod
    def _records_by_kind(context: Mapping[str, object], kind: str) -> list[Mapping[str, object]]:
        history = context.get("history")
        if not isinstance(history, Sequence) or isinstance(history, (str, bytes)):
            return []
        return [item for item in history if isinstance(item, Mapping) and item.get("kind") == kind]

    @staticmethod
    def _conflicting_feedback(context: Mapping[str, object], criteria: Sequence[object]) -> list[str]:
        feedback = DeterministicReasoner._records_by_kind(context, "feedback")
        negative_markers = ("no longer", "not required", "do not require", "deprioritize", "drop the requirement")
        conflicts: list[str] = []
        for item in feedback:
            content = item.get("content")
            record_id = item.get("id")
            if not isinstance(content, str) or not isinstance(record_id, str):
                continue
            lowered = content.lower()
            if any(marker in lowered for marker in negative_markers) and any(
                DeterministicReasoner._criterion_present(str(criterion), lowered) for criterion in criteria
            ):
                conflicts.append(record_id)
        return conflicts


class GroqReasoner:
    """ReasoningProvider backed by a Groq-hosted model.

    Evidence is serialised as structured JSON in the user message, not
    interpolated as free text, to reduce prompt-injection surface.
    The model output is validated downstream by decision_from_dict, so
    any schema violation surfaces as a ValueError before it reaches the
    policy gate.
    """

    _SYSTEM_PROMPT = (
        "You are a Guardian evaluating a software milestone deliverable.\n"
        "You will receive a JSON object with two keys:\n"
        "  context  - the project history recalled from memory (criteria, feedback, unresolved issues, prior decisions)\n"
        "  evidence - the evidence items submitted for this milestone\n"
        "Return ONLY a single JSON object with exactly these keys:\n"
        '{\n'
        '  "outcome": "approve" | "request_revision" | "escalate",\n'
        '  "rationale": "<non-empty string explaining your decision>",\n'
        '  "confidence": <float between 0.0 and 1.0>,\n'
        '  "cited_memory_ids": ["<id>", ...],\n'
        '  "cited_evidence_ids": ["<id>", ...],\n'
        '  "missing_information": ["<item>", ...]\n'
        '}\n'
        "Do not output anything outside that JSON object."
    )

    def __init__(
        self,
        api_key: str | None = None,
        model: str = "openai/gpt-oss-120b",
        reasoning_effort: str = "medium",
    ) -> None:
        # Import deferred so the package stays runnable without groq installed.
        from groq import Groq  # type: ignore[import-untyped]

        self._client = Groq(api_key=api_key or os.environ["GROQ_API_KEY"])
        self._model = model
        self._reasoning_effort = reasoning_effort

    def evaluate(self, context: Mapping[str, object], evidence: Sequence[Evidence]) -> Mapping[str, object]:
        payload = json.dumps(
            {
                "context": dict(context),
                # Evidence passed as structured fields only — never raw locator strings
                # that could contain injected instructions (see PRD §13).
                "evidence": [
                    {"id": e.id, "type": e.type, "summary": e.summary}
                    for e in evidence
                ],
            },
            sort_keys=True,
        )
        response = self._client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": self._SYSTEM_PROMPT},
                {"role": "user", "content": payload},
            ],
            temperature=1,
            max_completion_tokens=2048,
            top_p=1,
            reasoning_effort=self._reasoning_effort,
            stream=False,
        )
        raw = response.choices[0].message.content or ""
        return self._parse_json(raw)

    @staticmethod
    def _parse_json(raw: str) -> dict[str, object]:
        """Extract the JSON object from the model reply.

        Reasoning models sometimes wrap output in markdown fences; strip
        them before parsing so decision_from_dict validation still catches
        any schema problems.
        """
        stripped = raw.strip()
        # Remove optional ```json ... ``` wrapper.
        fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", stripped, re.DOTALL)
        if fence_match:
            stripped = fence_match.group(1)
        # Find the outermost { ... } block if there is any preamble.
        brace_match = re.search(r"\{.*\}", stripped, re.DOTALL)
        if brace_match:
            stripped = brace_match.group(0)
        return json.loads(stripped)
