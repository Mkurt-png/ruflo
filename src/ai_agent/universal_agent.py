"""All-in-one autonomous agent.

A single agent that combines the capabilities of every specialised Claude role
(researcher, coder, tester, reviewer, architect, security auditor, devops)
into one always-on entry point. Drives an agentic loop until the model calls
`write_output` or stops emitting tool calls.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Any, Optional

try:
    from anthropic import Anthropic
except ImportError:  # pragma: no cover — surfaced at instantiation
    Anthropic = None  # type: ignore[assignment,misc]

from .universal_tools import TOOL_DEFINITIONS, execute_tool


MODEL = "claude-opus-4-7"
MAX_TOKENS = 4096
MAX_ITERATIONS = 30
MAX_TOOL_RESULT_CHARS = 20_000


_SYSTEM_PROMPT = """You are the Universal Agent — a single autonomous agent that
combines the capabilities of every specialised role (researcher, coder,
architect, tester, reviewer, security auditor, performance engineer, devops).

You decide which role to play based on the user's task. You can:

• Research  — search code, list files, fetch URLs, read docs, analyse projects
• Code      — write, edit, refactor, and execute files (Python, shell, web)
• Test      — run test suites, inspect results, write new tests
• Review    — analyse code for quality, performance, design issues
• Audit     — static security scan + deep manual analysis for malware/CVEs
• Plan      — break work into steps, explain architecture, propose designs
• Operate   — git status/diff/log, build, deploy (read-only by default)

OPERATING PRINCIPLES
1. Investigate before acting. Read code, run small probes, then change.
2. Prefer minimal, surgical edits. Use edit_file over write_file when possible.
3. After writing or modifying code that handles credentials, user input,
   network I/O, or auth — run security_scan on it.
4. When uncertain, prefer reading a file or running a small command over
   guessing. Tools are cheap; wrong answers are expensive.
5. Stop when the task is complete. Call write_output exactly once with a
   concise final answer (what you did + key file paths + next steps).

SECURITY RULES
• Never read, write, or print .env files, private keys, or credential files.
• Never run destructive system commands (rm -rf /, mkfs, dd, fork bombs) —
  the tool layer blocks these but you must not attempt them.
• Never commit changes without explicit user approval.
• Surface secrets only as REDACTED.

EFFICIENCY
• Don't narrate every step — work, then summarise.
• If you've tried the same approach 3 times without progress, stop and report
  what you've learned instead of looping.
• Answer in the language the user used.
"""


@dataclass
class AgentResult:
    """Outcome of a single run."""

    answer: str
    iterations: int
    input_tokens: int
    output_tokens: int
    cache_read_tokens: int
    cache_write_tokens: int
    stopped: str = "completed"


@dataclass
class _State:
    messages: list[dict[str, Any]] = field(default_factory=list)
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_tokens: int = 0
    cache_write_tokens: int = 0


class UniversalAgent:
    """The all-in-one agent. Use `.run(task)` to execute any objective."""

    def __init__(self, api_key: Optional[str] = None) -> None:
        if Anthropic is None:
            raise RuntimeError(
                "anthropic SDK not installed. Run: pip install anthropic"
            )
        key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not key:
            raise RuntimeError(
                "ANTHROPIC_API_KEY is not set. "
                "Pass api_key=... or set the environment variable."
            )
        self._client = Anthropic(api_key=key)

    # ── main loop ─────────────────────────────────────────────────────────

    def run(self, task: str, verbose: bool = True) -> AgentResult:
        state = _State()
        state.messages.append({"role": "user", "content": task})

        final_answer = ""
        stopped_reason = "completed"
        iteration = 0

        for iteration in range(1, MAX_ITERATIONS + 1):
            response = self._client.messages.create(
                model=MODEL,
                max_tokens=MAX_TOKENS,
                system=[
                    {
                        "type": "text",
                        "text": _SYSTEM_PROMPT,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
                tools=TOOL_DEFINITIONS,
                messages=state.messages,
            )

            self._accumulate_usage(state, response.usage)
            state.messages.append({"role": "assistant", "content": response.content})

            if verbose:
                self._log_turn(iteration, response.content)

            tool_uses = [b for b in response.content if b.type == "tool_use"]
            if not tool_uses:
                final_answer = self._extract_text(response.content)
                stopped_reason = "end_turn"
                break

            tool_results: list[dict[str, Any]] = []
            done = False

            for tu in tool_uses:
                if tu.name == "write_output":
                    final_answer = str(tu.input.get("answer", "")).strip()
                    done = True
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tu.id,
                        "content": "Answer delivered to user.",
                    })
                    continue

                result = execute_tool(tu.name, tu.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tu.id,
                    "content": str(result)[:MAX_TOOL_RESULT_CHARS],
                })
                if verbose:
                    print(
                        f"  ↳ {tu.name}({_summarise(tu.input)}) "
                        f"→ {len(str(result))} chars",
                        flush=True,
                    )

            state.messages.append({"role": "user", "content": tool_results})

            if done:
                break
        else:
            stopped_reason = "max_iterations"

        if not final_answer:
            final_answer = self._extract_text(state.messages[-1].get("content", [])) \
                or "Reached maximum iterations without a final answer."

        return AgentResult(
            answer=final_answer,
            iterations=iteration,
            input_tokens=state.input_tokens,
            output_tokens=state.output_tokens,
            cache_read_tokens=state.cache_read_tokens,
            cache_write_tokens=state.cache_write_tokens,
            stopped=stopped_reason,
        )

    # ── helpers ───────────────────────────────────────────────────────────

    @staticmethod
    def _accumulate_usage(state: _State, usage: Any) -> None:
        state.input_tokens += getattr(usage, "input_tokens", 0) or 0
        state.output_tokens += getattr(usage, "output_tokens", 0) or 0
        state.cache_read_tokens += getattr(usage, "cache_read_input_tokens", 0) or 0
        state.cache_write_tokens += getattr(usage, "cache_creation_input_tokens", 0) or 0

    @staticmethod
    def _extract_text(content: Any) -> str:
        if isinstance(content, str):
            return content.strip()
        if not isinstance(content, list):
            return ""
        parts: list[str] = []
        for block in content:
            text = getattr(block, "text", None)
            if text:
                parts.append(text)
        return "\n".join(parts).strip()

    @staticmethod
    def _log_turn(iteration: int, content_blocks: list[Any]) -> None:
        print(f"\n[iteration {iteration}]", flush=True)
        for block in content_blocks:
            if block.type == "text" and block.text.strip():
                print(f"  💬 {block.text.strip()[:300]}", flush=True)
            elif block.type == "tool_use":
                print(f"  🔧 {block.name}", flush=True)


def _summarise(d: dict[str, Any]) -> str:
    """Short representation of tool inputs for logging."""
    parts: list[str] = []
    for k, v in d.items():
        s = str(v).replace("\n", " ")
        if len(s) > 40:
            s = s[:40] + "…"
        parts.append(f"{k}={s}")
    return ", ".join(parts)
