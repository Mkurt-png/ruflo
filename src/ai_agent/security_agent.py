"""
Persistent security agent — always-on code guardian.

Works in two modes:
1. As a standalone agent (via CLI): scans files on demand.
2. As a hook (automatic): invoked by Claude Code after every file edit.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import anthropic

from .security_tools import Finding, scan_file, scan_report, scan_report_json
from .tools import execute_tool

# ── System prompt (cached once per session) ────────────────────────────────

_SECURITY_SYSTEM_PROMPT = """\
You are an elite cybersecurity analyst permanently embedded in this project.

Your mission — for EVERY file you analyse:
1. Check for hardcoded secrets (API keys, passwords, tokens, private keys)
2. Detect malware indicators (obfuscated code, reverse shells, crypto miners)
3. Identify injection vulnerabilities (SQL, command, path traversal, XSS)
4. Flag unsafe dependencies and dangerous builtins
5. Apply OWASP Top 10 heuristics

Response format (always structured):
- Start with a one-line verdict: ✅ CLEAN or 🔴 ISSUES FOUND
- List each finding with: [SEVERITY] Category/Rule (line N): description
- End with a short remediation summary if issues exist

Severity levels: CRITICAL > HIGH > MEDIUM > LOW > INFO
Be precise, avoid false positives, and explain WHY something is risky.
"""

MODEL = "claude-opus-4-7"
MAX_TOKENS = 2048
MAX_ITERATIONS = 10


# ── Extended tool set for the security agent ───────────────────────────────

_SECURITY_TOOL_DEFINITIONS: list[anthropic.types.ToolParam] = [
    {
        "name": "static_scan",
        "description": (
            "Run a fast static security scan on a file using built-in rules. "
            "Returns JSON with all findings (secrets, malware, injections, AST issues)."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Path to the file to scan"},
            },
            "required": ["path"],
        },
    },
    {
        "name": "read_file",
        "description": "Read the full source of a file for deeper analysis.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
            },
            "required": ["path"],
        },
    },
    {
        "name": "execute_code",
        "description": "Run Python code for custom checks (e.g., AST parsing, regex scanning).",
        "input_schema": {
            "type": "object",
            "properties": {
                "code": {"type": "string"},
            },
            "required": ["code"],
        },
    },
    {
        "name": "security_verdict",
        "description": (
            "Submit the final security verdict and end the analysis. "
            "Must be called when the analysis is complete."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "clean": {
                    "type": "boolean",
                    "description": "True if no HIGH or CRITICAL issues were found",
                },
                "summary": {
                    "type": "string",
                    "description": "One-paragraph plain-English verdict and remediation advice",
                },
                "findings_count": {
                    "type": "integer",
                    "description": "Total number of findings (any severity)",
                },
            },
            "required": ["clean", "summary", "findings_count"],
        },
    },
]


def _dispatch_tool(name: str, tool_input: dict) -> str:
    if name == "static_scan":
        return scan_report_json(tool_input["path"])
    return execute_tool(name, tool_input)


# ── Result ─────────────────────────────────────────────────────────────────


@dataclass
class SecurityVerdict:
    path: str
    clean: bool
    summary: str
    findings_count: int
    static_findings: list[Finding] = field(default_factory=list)
    iterations: int = 0
    input_tokens: int = 0
    output_tokens: int = 0


# ── Security agent ─────────────────────────────────────────────────────────


class SecurityAgent:
    """
    Persistent security agent — analyses a file and returns a SecurityVerdict.

    The system prompt is prompt-cached so the agent costs almost nothing
    on repeated calls within the same session.
    """

    def __init__(self, api_key: Optional[str] = None) -> None:
        self._client = anthropic.Anthropic(
            api_key=api_key or os.environ.get("ANTHROPIC_API_KEY")
        )

    def analyse(self, path: str, verbose: bool = False) -> SecurityVerdict:
        """Full security analysis of *path*. Returns a SecurityVerdict."""
        # Run static scan first — always, without LLM cost
        static_result = scan_file(path)

        # Build initial user message with static findings included
        static_report = scan_report(path)
        user_message = (
            f"Analyse this file for security issues: {path}\n\n"
            f"Static scan results (pre-computed):\n```\n{static_report}\n```\n\n"
            "Now perform your own deeper analysis and call `security_verdict` "
            "with your final conclusion."
        )

        messages: list[anthropic.types.MessageParam] = [
            {"role": "user", "content": user_message}
        ]

        total_input = total_output = 0

        for iteration in range(1, MAX_ITERATIONS + 1):
            response = self._client.messages.create(
                model=MODEL,
                max_tokens=MAX_TOKENS,
                system=[
                    {
                        "type": "text",
                        "text": _SECURITY_SYSTEM_PROMPT,
                        "cache_control": {"type": "ephemeral"},  # cached after first call
                    }
                ],
                tools=_SECURITY_TOOL_DEFINITIONS,  # type: ignore[arg-type]
                messages=messages,
            )

            total_input += response.usage.input_tokens
            total_output += response.usage.output_tokens

            if verbose:
                for block in response.content:
                    if isinstance(block, anthropic.types.TextBlock):
                        print(f"[security-agent] {block.text}")
                    elif isinstance(block, anthropic.types.ToolUseBlock):
                        print(f"[tool] {block.name}({json.dumps(block.input)[:120]})")

            messages.append({"role": "assistant", "content": response.content})

            if response.stop_reason != "tool_use":
                # Model finished without calling security_verdict
                text = next(
                    (b.text for b in response.content
                     if isinstance(b, anthropic.types.TextBlock)), ""
                )
                return SecurityVerdict(
                    path=path,
                    clean=static_result.is_clean,
                    summary=text or static_result.summary(),
                    findings_count=len(static_result.findings),
                    static_findings=static_result.findings,
                    iterations=iteration,
                    input_tokens=total_input,
                    output_tokens=total_output,
                )

            tool_results = []
            verdict: Optional[SecurityVerdict] = None

            for block in response.content:
                if not isinstance(block, anthropic.types.ToolUseBlock):
                    continue

                if block.name == "security_verdict":
                    inp = block.input  # type: ignore[union-attr]
                    verdict = SecurityVerdict(
                        path=path,
                        clean=inp["clean"],
                        summary=inp["summary"],
                        findings_count=inp["findings_count"],
                        static_findings=static_result.findings,
                        iterations=iteration,
                        input_tokens=total_input,
                        output_tokens=total_output,
                    )
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": "Verdict recorded.",
                    })
                else:
                    result_str = _dispatch_tool(block.name, block.input)  # type: ignore[arg-type]
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result_str,
                    })

            messages.append({"role": "user", "content": tool_results})

            if verdict is not None:
                return verdict

        # Fallback after max iterations
        return SecurityVerdict(
            path=path,
            clean=static_result.is_clean,
            summary=static_result.summary(),
            findings_count=len(static_result.findings),
            static_findings=static_result.findings,
            iterations=MAX_ITERATIONS,
            input_tokens=total_input,
            output_tokens=total_output,
        )
