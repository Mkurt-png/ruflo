"""Autonomous agent with an agentic loop and prompt caching."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Optional

import anthropic

from .tools import TOOL_DEFINITIONS, execute_tool

# ── Configuration ──────────────────────────────────────────────────────────

SYSTEM_PROMPT = """\
You are an autonomous AI agent. You have access to tools that let you search the web,
read files, execute code, and write your final answer.

Guidelines:
- Break complex tasks into smaller steps and use tools methodically.
- When you have gathered enough information to answer fully, call `write_output`.
- Be concise but thorough. Cite sources or file paths when relevant.
- If a tool returns an error, adapt your approach and try again differently.
"""

MODEL = "claude-opus-4-7"
MAX_TOKENS = 4096
MAX_ITERATIONS = 20  # safety cap to prevent infinite loops


# ── Data types ─────────────────────────────────────────────────────────────


@dataclass
class AgentResult:
    answer: str
    iterations: int
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_tokens: int = 0
    cache_write_tokens: int = 0


@dataclass
class AgentState:
    messages: list[anthropic.types.MessageParam] = field(default_factory=list)
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_cache_read_tokens: int = 0
    total_cache_write_tokens: int = 0


# ── Agent ──────────────────────────────────────────────────────────────────


class AutonomousAgent:
    """
    An agentic loop that drives Claude with tool use until the task is done.

    Prompt caching is applied to the (static) system prompt so that repeated
    calls within a session re-use the cached prefix and reduce cost.
    """

    def __init__(self, api_key: Optional[str] = None) -> None:
        self._client = anthropic.Anthropic(
            api_key=api_key or os.environ.get("ANTHROPIC_API_KEY")
        )

    # ── Public API ─────────────────────────────────────────────────────────

    def run(self, task: str, verbose: bool = True) -> AgentResult:
        """Run the agent on *task* and return the final answer."""
        state = AgentState()
        state.messages.append({"role": "user", "content": task})

        for iteration in range(1, MAX_ITERATIONS + 1):
            if verbose:
                print(f"\n[iteration {iteration}]", flush=True)

            response = self._call_api(state)
            self._accumulate_usage(state, response.usage)

            if verbose:
                self._print_response(response)

            # Check for task completion via write_output tool
            answer, done = self._process_response(state, response)
            if done:
                return AgentResult(
                    answer=answer or "",
                    iterations=iteration,
                    input_tokens=state.total_input_tokens,
                    output_tokens=state.total_output_tokens,
                    cache_read_tokens=state.total_cache_read_tokens,
                    cache_write_tokens=state.total_cache_write_tokens,
                )

            if response.stop_reason == "end_turn":
                # Model finished without calling write_output — treat last text as answer
                last_text = self._extract_text(response)
                return AgentResult(
                    answer=last_text,
                    iterations=iteration,
                    input_tokens=state.total_input_tokens,
                    output_tokens=state.total_output_tokens,
                    cache_read_tokens=state.total_cache_read_tokens,
                    cache_write_tokens=state.total_cache_write_tokens,
                )

        # Iteration limit reached
        return AgentResult(
            answer="[Agent reached the iteration limit without completing the task.]",
            iterations=MAX_ITERATIONS,
            input_tokens=state.total_input_tokens,
            output_tokens=state.total_output_tokens,
            cache_read_tokens=state.total_cache_read_tokens,
            cache_write_tokens=state.total_cache_write_tokens,
        )

    # ── Internal helpers ───────────────────────────────────────────────────

    def _call_api(self, state: AgentState) -> anthropic.types.Message:
        """Send the current conversation to Claude and return the response."""
        return self._client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            # Cache the system prompt — it never changes between iterations,
            # so subsequent calls save ~90 % of its token cost.
            system=[
                {
                    "type": "text",
                    "text": SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            tools=TOOL_DEFINITIONS,  # type: ignore[arg-type]
            messages=state.messages,
        )

    def _process_response(
        self,
        state: AgentState,
        response: anthropic.types.Message,
    ) -> tuple[str, bool]:
        """
        Append the assistant turn and execute any tool calls.

        Returns (answer, done) — done is True when write_output was called.
        """
        # Always append the full assistant content
        state.messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason != "tool_use":
            return "", False

        tool_results: list[anthropic.types.ToolResultBlockParam] = []
        final_answer: str = ""
        done = False

        for block in response.content:
            if not isinstance(block, anthropic.types.ToolUseBlock):
                continue

            result_str = execute_tool(block.name, block.input)  # type: ignore[arg-type]

            if block.name == "write_output":
                final_answer = result_str
                done = True

            tool_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result_str,
                }
            )

        state.messages.append({"role": "user", "content": tool_results})
        return final_answer, done

    @staticmethod
    def _accumulate_usage(
        state: AgentState, usage: anthropic.types.Usage
    ) -> None:
        state.total_input_tokens += usage.input_tokens
        state.total_output_tokens += usage.output_tokens
        state.total_cache_read_tokens += getattr(
            usage, "cache_read_input_tokens", 0
        ) or 0
        state.total_cache_write_tokens += getattr(
            usage, "cache_creation_input_tokens", 0
        ) or 0

    @staticmethod
    def _extract_text(response: anthropic.types.Message) -> str:
        for block in response.content:
            if isinstance(block, anthropic.types.TextBlock):
                return block.text
        return ""

    @staticmethod
    def _print_response(response: anthropic.types.Message) -> None:
        for block in response.content:
            if isinstance(block, anthropic.types.TextBlock):
                print(f"[agent] {block.text}", flush=True)
            elif isinstance(block, anthropic.types.ToolUseBlock):
                import json
                print(
                    f"[tool call] {block.name}({json.dumps(block.input, indent=2)})",
                    flush=True,
                )
