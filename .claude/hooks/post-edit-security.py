#!/usr/bin/env python3
"""
Claude Code post-edit hook — runs the security agent after every file write/edit.

Claude Code calls this script with the edited file path in the environment
variable CLAUDE_TOOL_INPUT_FILE_PATH (or as argv[1]).

Exit 0 = OK (even with findings — we warn but don't block)
Exit 2 = BLOCK (CRITICAL finding — prevents the edit from being accepted)
"""

import json
import os
import sys

# ── Resolve file path ──────────────────────────────────────────────────────

# Claude Code passes tool input as JSON on stdin for PostToolUse hooks
raw = sys.stdin.read().strip() if not sys.stdin.isatty() else ""
file_path: str = ""

if raw:
    try:
        data = json.loads(raw)
        file_path = (
            data.get("file_path")
            or data.get("path")
            or data.get("new_path")
            or ""
        )
    except json.JSONDecodeError:
        file_path = raw.strip()

if not file_path and len(sys.argv) > 1:
    file_path = sys.argv[1]

if not file_path:
    # No file path — nothing to scan
    sys.exit(0)

# ── Run fast static scan (no LLM, always runs) ────────────────────────────

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, REPO_ROOT)

try:
    from src.ai_agent.security_tools import scan_file, ScanResult
except ImportError:
    # Package not importable — skip gracefully
    sys.exit(0)

result: ScanResult = scan_file(file_path)

if not result.scanned:
    sys.exit(0)  # Unsupported extension or too large — skip

# Print all findings to stderr (visible in Claude Code output)
if result.findings:
    print(f"\n🔐 Security scan: {file_path}", file=sys.stderr)
    for f in sorted(result.findings, key=lambda x: x.line or 0):
        print(f"  {f}", file=sys.stderr)

# ── CRITICAL findings block the edit ──────────────────────────────────────

critical = [f for f in result.findings if f.severity == "CRITICAL"]
if critical:
    print(
        f"\n🚨 BLOCKED: {len(critical)} CRITICAL security issue(s) detected in {file_path}.",
        file=sys.stderr,
    )
    print(
        "   Fix the issue(s) above before saving this file.",
        file=sys.stderr,
    )
    sys.exit(2)  # Exit 2 = block in Claude Code hooks

# ── HIGH findings warn but don't block ────────────────────────────────────

high = [f for f in result.findings if f.severity == "HIGH"]
if high:
    print(
        f"\n⚠️  WARNING: {len(high)} HIGH severity issue(s) in {file_path}. "
        "Review before merging.",
        file=sys.stderr,
    )

if result.is_clean and result.findings:
    print(f"  ℹ️  {len(result.findings)} low/medium finding(s) — review recommended.", file=sys.stderr)
elif result.is_clean:
    print(f"  ✅ {file_path}: clean", file=sys.stderr)

sys.exit(0)
