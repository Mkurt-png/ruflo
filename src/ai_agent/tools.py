"""Tool definitions and implementations for the autonomous agent."""

import json
import os
from typing import Any

import anthropic

# ── Tool schemas (sent to Claude) ──────────────────────────────────────────

TOOL_DEFINITIONS: list[anthropic.types.ToolParam] = [
    {
        "name": "web_search",
        "description": (
            "Search the web for information on a topic. "
            "Returns a list of relevant results with titles and snippets."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query to look up",
                },
                "num_results": {
                    "type": "integer",
                    "description": "Number of results to return (default 5)",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "read_file",
        "description": (
            "Read the contents of a file from the local filesystem. "
            "Returns the file contents as a string."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Absolute or relative path to the file",
                },
            },
            "required": ["path"],
        },
    },
    {
        "name": "execute_code",
        "description": (
            "Execute Python code and return the output. "
            "Use this for calculations, data processing, or any programmatic task."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "The Python code to execute",
                },
            },
            "required": ["code"],
        },
    },
    {
        "name": "write_output",
        "description": (
            "Write the final answer or output to signal task completion. "
            "Call this when you have a complete answer for the user."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "content": {
                    "type": "string",
                    "description": "The final answer or output content",
                },
            },
            "required": ["content"],
        },
    },
]


# ── Tool implementations ────────────────────────────────────────────────────


def _web_search(query: str, num_results: int = 5) -> str:
    """Simulated web search returning plausible mock results."""
    results = [
        {
            "title": f"Result {i + 1}: {query}",
            "url": f"https://example.com/search?q={query.replace(' ', '+')}&r={i + 1}",
            "snippet": (
                f"This page contains information about '{query}'. "
                f"Result {i + 1} provides relevant context and details."
            ),
        }
        for i in range(min(num_results, 5))
    ]
    return json.dumps({"query": query, "results": results}, indent=2)


def _read_file(path: str) -> str:
    """Read a file from disk, returning its contents or an error message."""
    try:
        abs_path = os.path.abspath(path)
        if not os.path.exists(abs_path):
            return f"Error: file not found at '{abs_path}'"
        if not os.path.isfile(abs_path):
            return f"Error: '{abs_path}' is not a regular file"
        with open(abs_path, "r", encoding="utf-8") as fh:
            return fh.read()
    except PermissionError:
        return f"Error: permission denied reading '{path}'"
    except UnicodeDecodeError:
        return f"Error: '{path}' is not a readable text file"


def _execute_code(code: str) -> str:
    """Execute Python code in a restricted namespace and capture output."""
    import io
    import sys
    import traceback

    stdout_buf = io.StringIO()
    namespace: dict[str, Any] = {"__builtins__": __builtins__}

    old_stdout = sys.stdout
    sys.stdout = stdout_buf
    try:
        exec(code, namespace)  # noqa: S102
        output = stdout_buf.getvalue()
        return output if output else "(no output)"
    except Exception:
        return f"Error:\n{traceback.format_exc()}"
    finally:
        sys.stdout = old_stdout


# ── Dispatch ───────────────────────────────────────────────────────────────


ToolResult = str  # All tools return plain strings for simplicity


def execute_tool(name: str, tool_input: dict[str, Any]) -> ToolResult:
    """Dispatch a tool call and return its string result."""
    match name:
        case "web_search":
            return _web_search(
                query=tool_input["query"],
                num_results=tool_input.get("num_results", 5),
            )
        case "read_file":
            return _read_file(path=tool_input["path"])
        case "execute_code":
            return _execute_code(code=tool_input["code"])
        case "write_output":
            # The agent layer intercepts this; implementations just echo it back.
            return tool_input["content"]
        case _:
            return f"Error: unknown tool '{name}'"
