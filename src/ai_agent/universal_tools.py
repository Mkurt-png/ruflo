"""Universal tool catalog for the all-in-one agent.

Combines the capabilities of every specialised role (researcher, coder,
tester, reviewer, architect, security-auditor, devops) into a single tool set.
"""

from __future__ import annotations

import re
import subprocess
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from .security_tools import scan_report


# ── Tool catalog (sent to Claude) ──────────────────────────────────────────


TOOL_DEFINITIONS: list[dict[str, Any]] = [
    # ── File operations ────────────────────────────────────────────────────
    {
        "name": "read_file",
        "description": (
            "Read a text file and return its content with line numbers. "
            "Supports paging via offset/limit for large files."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "offset": {"type": "integer", "description": "Start line (1-indexed)"},
                "limit": {"type": "integer", "description": "Max lines"},
            },
            "required": ["path"],
        },
    },
    {
        "name": "write_file",
        "description": (
            "Create a new file or fully overwrite an existing one. "
            "Prefer edit_file when modifying an existing file."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "content": {"type": "string"},
            },
            "required": ["path", "content"],
        },
    },
    {
        "name": "edit_file",
        "description": (
            "Replace one exact occurrence of old_string with new_string. "
            "Fails if old_string is missing or not unique."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "old_string": {"type": "string"},
                "new_string": {"type": "string"},
            },
            "required": ["path", "old_string", "new_string"],
        },
    },
    {
        "name": "list_directory",
        "description": "List entries in a directory (files + subdirs).",
        "input_schema": {
            "type": "object",
            "properties": {"path": {"type": "string"}},
        },
    },
    {
        "name": "find_files",
        "description": "Find files by glob (e.g. '**/*.py').",
        "input_schema": {
            "type": "object",
            "properties": {
                "pattern": {"type": "string"},
                "path": {"type": "string"},
            },
            "required": ["pattern"],
        },
    },
    {
        "name": "search_code",
        "description": "Search file contents with a regex (like grep). Returns path:line: match.",
        "input_schema": {
            "type": "object",
            "properties": {
                "pattern": {"type": "string"},
                "path": {"type": "string"},
                "file_glob": {"type": "string", "description": "Filter files (e.g. '*.py')"},
            },
            "required": ["pattern"],
        },
    },
    # ── Execution ──────────────────────────────────────────────────────────
    {
        "name": "execute_command",
        "description": (
            "Run a shell command. Captures stdout/stderr/exit code. "
            "Destructive commands (rm -rf /, mkfs, dd, fork bombs) are blocked."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "command": {"type": "string"},
                "timeout": {"type": "integer", "description": "Seconds (default 30)"},
            },
            "required": ["command"],
        },
    },
    {
        "name": "execute_python",
        "description": "Run a Python snippet in a fresh subprocess. Returns stdout.",
        "input_schema": {
            "type": "object",
            "properties": {
                "code": {"type": "string"},
                "timeout": {"type": "integer", "description": "Seconds (default 15)"},
            },
            "required": ["code"],
        },
    },
    # ── Web ────────────────────────────────────────────────────────────────
    {
        "name": "fetch_url",
        "description": "GET an http(s) URL and return its body (max 50KB).",
        "input_schema": {
            "type": "object",
            "properties": {"url": {"type": "string"}},
            "required": ["url"],
        },
    },
    # ── Git ────────────────────────────────────────────────────────────────
    {
        "name": "git_command",
        "description": (
            "Run a read-only git command: status, diff, log, branch, show, ls-files. "
            "Write commands (commit, push, reset) require explicit user approval — "
            "use execute_command after confirming."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "subcommand": {
                    "type": "string",
                    "enum": ["status", "diff", "log", "branch", "show", "ls-files"],
                },
                "args": {"type": "string"},
            },
            "required": ["subcommand"],
        },
    },
    # ── Security ───────────────────────────────────────────────────────────
    {
        "name": "security_scan",
        "description": (
            "Run the static security scanner on a file. "
            "Detects secrets, malware patterns, injections, and dangerous builtins. "
            "Zero-cost — does not call the LLM."
        ),
        "input_schema": {
            "type": "object",
            "properties": {"path": {"type": "string"}},
            "required": ["path"],
        },
    },
    # ── Output ─────────────────────────────────────────────────────────────
    {
        "name": "write_output",
        "description": (
            "Provide the FINAL answer to the user. Call this exactly once when the "
            "task is complete. The agent loop terminates after this call."
        ),
        "input_schema": {
            "type": "object",
            "properties": {"answer": {"type": "string"}},
            "required": ["answer"],
        },
    },
]


# ── Limits ─────────────────────────────────────────────────────────────────


_MAX_OUTPUT = 10_000   # chars returned per tool call
_MAX_FETCH = 50_000    # chars for fetch_url
_MAX_FIND = 200        # max paths returned by find_files
_MAX_GREP = 100        # max matches returned by search_code


_DANGEROUS_COMMAND_PATTERNS = [  # nosec
    r"\brm\s+-rf?\s+(/|~|\$HOME|\*)",  # nosec
    r"\bmkfs\b",  # nosec
    r"\bdd\s+if=",  # nosec
    r">\s*/dev/(sd|hd|nvme|disk)",  # nosec
    r":\s*\(\s*\)\s*\{\s*:\s*\|\s*:&\s*\}\s*;\s*:",  # fork bomb  # nosec
    r"(curl|wget)\b[^|]*\|\s*(sh|bash|zsh|sudo)",  # pipe to shell  # nosec
    r"\bchmod\s+(-R\s+)?0?777\s+/",  # nosec
    r"\bsudo\b[^\n]*\brm\b",  # nosec
]


_SENSITIVE_FILE_PATTERNS = [
    r"^\.env(\..*)?$",
    r"\.pem$",
    r"\.key$",
    r"id_rsa(\.pub)?$",
    r"credentials(\.json)?$",
]


# ── Helpers ────────────────────────────────────────────────────────────────


def _clip(text: str, limit: int = _MAX_OUTPUT) -> str:
    if len(text) <= limit:
        return text
    return text[:limit] + f"\n... [truncated {len(text) - limit} chars]"


def _is_sensitive_path(path: str) -> bool:
    name = Path(path).name
    return any(re.search(p, name) for p in _SENSITIVE_FILE_PATTERNS)


def _is_dangerous_command(command: str) -> bool:
    return any(re.search(p, command) for p in _DANGEROUS_COMMAND_PATTERNS)


# ── Tool implementations ───────────────────────────────────────────────────


def _read_file(path: str, offset: int = 1, limit: int = 2000) -> str:
    if _is_sensitive_path(path):
        return f"ERROR: refusing to read sensitive file: {path}"
    p = Path(path)
    if not p.exists():
        return f"ERROR: file not found: {path}"
    if not p.is_file():
        return f"ERROR: not a regular file: {path}"
    try:
        lines = p.read_text(encoding="utf-8", errors="replace").splitlines()
    except Exception as exc:
        return f"ERROR reading file: {exc}"
    start = max(0, offset - 1)
    end = min(len(lines), start + limit)
    body = "\n".join(f"{i + 1}: {line}" for i, line in enumerate(lines[start:end], start=start))
    return f"# {path} (lines {start + 1}-{end} of {len(lines)})\n{body}"


def _write_file(path: str, content: str) -> str:
    if _is_sensitive_path(path):
        return f"ERROR: refusing to write sensitive file: {path}"
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")
    return f"Wrote {len(content)} chars to {path}"


def _edit_file(path: str, old: str, new: str) -> str:
    if _is_sensitive_path(path):
        return f"ERROR: refusing to edit sensitive file: {path}"
    p = Path(path)
    if not p.exists():
        return f"ERROR: file not found: {path}"
    content = p.read_text(encoding="utf-8")
    count = content.count(old)
    if count == 0:
        return f"ERROR: old_string not found in {path}"
    if count > 1:
        return f"ERROR: old_string is not unique ({count} matches) — add more surrounding context"
    p.write_text(content.replace(old, new, 1), encoding="utf-8")
    return f"Edited {path}: replaced 1 occurrence"


def _list_directory(path: str = ".") -> str:
    p = Path(path)
    if not p.exists():
        return f"ERROR: not found: {path}"
    if not p.is_dir():
        return f"ERROR: not a directory: {path}"
    entries = sorted(p.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower()))
    if not entries:
        return f"# {path} (empty)"
    rows = []
    for e in entries:
        kind = "d" if e.is_dir() else "f"
        try:
            size = "" if e.is_dir() else f" ({e.stat().st_size}B)"
        except OSError:
            size = ""
        rows.append(f"  {kind} {e.name}{size}")
    return f"# {path}\n" + "\n".join(rows)


def _find_files(pattern: str, root: str = ".") -> str:
    p = Path(root)
    if not p.exists():
        return f"ERROR: not found: {root}"
    matches: list[str] = []
    for m in p.glob(pattern):
        if m.is_file() and not _is_sensitive_path(str(m)):
            matches.append(str(m))
        if len(matches) >= _MAX_FIND:
            matches.append("... [more truncated]")
            break
    return "\n".join(matches) if matches else f"No files matching {pattern!r} under {root}"


def _search_code(pattern: str, root: str = ".", file_glob: str = "*") -> str:
    p = Path(root)
    if not p.exists():
        return f"ERROR: not found: {root}"
    try:
        rx = re.compile(pattern)
    except re.error as exc:
        return f"ERROR: invalid regex: {exc}"

    skip_dirs = {".git", "node_modules", "__pycache__", ".venv", "dist", "build", ".next"}
    hits: list[str] = []

    for path in p.rglob(file_glob):
        if not path.is_file() or any(part in skip_dirs for part in path.parts):
            continue
        if _is_sensitive_path(str(path)):
            continue
        try:
            lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
        except Exception:
            continue
        for i, line in enumerate(lines, start=1):
            if rx.search(line):
                hits.append(f"{path}:{i}: {line[:180]}")
                if len(hits) >= _MAX_GREP:
                    hits.append("... [more truncated]")
                    return "\n".join(hits)
    return "\n".join(hits) if hits else f"No matches for /{pattern}/"


def _execute_command(command: str, timeout: int = 30) -> str:
    if _is_dangerous_command(command):
        return f"ERROR: refused — destructive command pattern detected"
    try:
        result = subprocess.run(  # nosec
            command,
            shell=True,  # nosec — controlled by denylist above
            capture_output=True,
            text=True,
            timeout=max(1, min(timeout, 120)),
        )
    except subprocess.TimeoutExpired:
        return f"ERROR: command timed out after {timeout}s"
    except Exception as exc:
        return f"ERROR: {exc}"

    parts: list[str] = []
    if result.stdout:
        parts.append(f"STDOUT:\n{_clip(result.stdout)}")
    if result.stderr:
        parts.append(f"STDERR:\n{_clip(result.stderr)}")
    parts.append(f"Exit code: {result.returncode}")
    return "\n".join(parts)


def _execute_python(code: str, timeout: int = 15) -> str:
    try:
        result = subprocess.run(  # nosec
            ["python3", "-c", code],
            capture_output=True,
            text=True,
            timeout=max(1, min(timeout, 60)),
        )
    except subprocess.TimeoutExpired:
        return f"ERROR: python execution timed out after {timeout}s"
    except Exception as exc:
        return f"ERROR: {exc}"

    parts: list[str] = []
    if result.stdout:
        parts.append(f"STDOUT:\n{_clip(result.stdout)}")
    if result.stderr:
        parts.append(f"STDERR:\n{_clip(result.stderr)}")
    parts.append(f"Exit code: {result.returncode}")
    return "\n".join(parts)


def _fetch_url(url: str) -> str:
    if not url.startswith(("http://", "https://")):
        return "ERROR: only http(s) URLs are supported"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "ai-agent/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:  # nosec — bounded read below
            data = resp.read(_MAX_FETCH + 1)
            text = data.decode("utf-8", errors="replace")
            if len(data) > _MAX_FETCH:
                text = text[:_MAX_FETCH] + "\n... [truncated]"
            return f"# {url} (HTTP {resp.status})\n{text}"
    except urllib.error.URLError as exc:
        return f"ERROR fetching {url}: {exc}"
    except Exception as exc:
        return f"ERROR: {exc}"


_GIT_READ_ONLY = {"status", "diff", "log", "branch", "show", "ls-files"}


def _git_command(subcommand: str, args: str = "") -> str:
    if subcommand not in _GIT_READ_ONLY:
        return f"ERROR: only read-only git commands allowed: {sorted(_GIT_READ_ONLY)}"
    if any(c in args for c in ";|&`$()<>"):
        return "ERROR: unsafe characters in args"
    cmd = ["git", subcommand]
    if args:
        cmd += args.split()
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)  # nosec
    except Exception as exc:
        return f"ERROR: {exc}"
    output = result.stdout + (result.stderr if result.returncode else "")
    return _clip(output) or f"(no output, exit {result.returncode})"


def _security_scan(path: str) -> str:
    return scan_report(path)


# ── Dispatcher ─────────────────────────────────────────────────────────────


def execute_tool(name: str, tool_input: dict[str, Any]) -> str:
    """Run a tool by name with the given inputs and return a string result."""
    try:
        match name:
            case "read_file":
                return _read_file(
                    tool_input["path"],
                    int(tool_input.get("offset", 1)),
                    int(tool_input.get("limit", 2000)),
                )
            case "write_file":
                return _write_file(tool_input["path"], tool_input["content"])
            case "edit_file":
                return _edit_file(
                    tool_input["path"],
                    tool_input["old_string"],
                    tool_input["new_string"],
                )
            case "list_directory":
                return _list_directory(tool_input.get("path", "."))
            case "find_files":
                return _find_files(tool_input["pattern"], tool_input.get("path", "."))
            case "search_code":
                return _search_code(
                    tool_input["pattern"],
                    tool_input.get("path", "."),
                    tool_input.get("file_glob", "*"),
                )
            case "execute_command":
                return _execute_command(
                    tool_input["command"],
                    int(tool_input.get("timeout", 30)),
                )
            case "execute_python":
                return _execute_python(
                    tool_input["code"],
                    int(tool_input.get("timeout", 15)),
                )
            case "fetch_url":
                return _fetch_url(tool_input["url"])
            case "git_command":
                return _git_command(
                    tool_input["subcommand"],
                    tool_input.get("args", ""),
                )
            case "security_scan":
                return _security_scan(tool_input["path"])
            case "write_output":
                # Handled specially by the agent loop
                return tool_input.get("answer", "")
            case _:
                return f"ERROR: unknown tool '{name}'"
    except KeyError as exc:
        return f"ERROR: missing required parameter {exc}"
    except Exception as exc:
        return f"ERROR in tool {name}: {exc}"
