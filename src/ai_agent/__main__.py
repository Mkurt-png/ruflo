"""CLI entrypoint.

Usage:
  python -m src.ai_agent ask '<task>'         # universal agent (all-in-one)
  python -m src.ai_agent run '<task>'         # legacy autonomous agent
  python -m src.ai_agent scan <file> [...]    # security scan (static, no LLM)
  python -m src.ai_agent audit <file> [...]   # deep security audit (with LLM)
"""

import argparse
import sys


# ── Sub-commands ───────────────────────────────────────────────────────────


def cmd_ask(args: argparse.Namespace) -> None:
    """Universal agent — one entry point for any task (research, code, test, audit)."""
    task = args.task or sys.stdin.read().strip()
    if not task:
        sys.exit("Error: provide a task as argument or via stdin.")

    from src.ai_agent.universal_agent import UniversalAgent

    agent = UniversalAgent(api_key=args.api_key)
    print(f"Task: {task}\n{'─' * 60}", flush=True)
    result = agent.run(task, verbose=not args.quiet)

    print(f"\n{'─' * 60}")
    print(f"Answer:\n{result.answer}")
    print(f"\n{'─' * 60}")
    print(
        f"Stats: {result.iterations} iter | stopped={result.stopped} | "
        f"in={result.input_tokens} out={result.output_tokens} "
        f"cache_r={result.cache_read_tokens} cache_w={result.cache_write_tokens}"
    )


def cmd_run(args: argparse.Namespace) -> None:
    """Legacy autonomous agent (smaller toolset). Use `ask` for new work."""
    task = args.task or sys.stdin.read().strip()
    if not task:
        sys.exit("Error: provide a task as argument or via stdin.")

    from src.ai_agent.agent import AutonomousAgent

    agent = AutonomousAgent(api_key=args.api_key)
    print(f"Task: {task}\n{'─' * 60}", flush=True)
    result = agent.run(task, verbose=not args.quiet)

    print(f"\n{'─' * 60}")
    print(f"Answer:\n{result.answer}")
    print(f"\n{'─' * 60}")
    print(
        f"Stats: {result.iterations} iteration(s) | "
        f"input={result.input_tokens} output={result.output_tokens} "
        f"cache_read={result.cache_read_tokens} cache_write={result.cache_write_tokens} tokens"
    )


def cmd_scan(args: argparse.Namespace) -> None:
    """Fast static-only security scan — no LLM, instant results."""
    from src.ai_agent.security_tools import scan_report

    exit_code = 0
    for path in args.files:
        report = scan_report(path)
        print(report)
        print()
        if "CRITICAL" in report or "HIGH" in report:
            exit_code = 1

    sys.exit(exit_code)


def cmd_audit(args: argparse.Namespace) -> None:
    """Deep LLM-powered security audit."""
    from src.ai_agent.security_agent import SecurityAgent

    agent = SecurityAgent(api_key=args.api_key)
    exit_code = 0

    for path in args.files:
        print(f"\n{'─' * 60}")
        print(f"Auditing: {path}")
        verdict = agent.analyse(path, verbose=not args.quiet)

        badge = "✅ CLEAN" if verdict.clean else "🔴 ISSUES FOUND"
        print(f"\n{badge}")
        print(verdict.summary)
        print(
            f"\nFindings: {verdict.findings_count} | "
            f"Iterations: {verdict.iterations} | "
            f"Tokens: in={verdict.input_tokens} out={verdict.output_tokens}"
        )

        if not verdict.clean:
            exit_code = 1

    sys.exit(exit_code)


# ── Main ───────────────────────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="ai_agent",
        description="Autonomous AI agent + persistent security guardian.",
    )
    parser.add_argument("--api-key", help="Anthropic API key (default: ANTHROPIC_API_KEY env var)")

    sub = parser.add_subparsers(dest="command", required=True)

    # ── ask (PRIMARY: universal agent) ────────────────────────────────────
    p_ask = sub.add_parser(
        "ask",
        help="Universal agent — handles any task (research, code, test, audit, git)",
    )
    p_ask.add_argument("task", nargs="?", help="Task description (or stdin)")
    p_ask.add_argument("--quiet", "-q", action="store_true")
    p_ask.set_defaults(func=cmd_ask)

    # ── run (legacy autonomous agent) ─────────────────────────────────────
    p_run = sub.add_parser("run", help="Legacy autonomous agent (4 tools)")
    p_run.add_argument("task", nargs="?", help="Task description (or stdin)")
    p_run.add_argument("--quiet", "-q", action="store_true")
    p_run.set_defaults(func=cmd_run)

    # ── scan ───────────────────────────────────────────────────────────────
    p_scan = sub.add_parser("scan", help="Fast static security scan (no LLM)")
    p_scan.add_argument("files", nargs="+", metavar="FILE")
    p_scan.set_defaults(func=cmd_scan)

    # ── audit ──────────────────────────────────────────────────────────────
    p_audit = sub.add_parser("audit", help="Deep LLM-powered security audit")
    p_audit.add_argument("files", nargs="+", metavar="FILE")
    p_audit.add_argument("--quiet", "-q", action="store_true")
    p_audit.set_defaults(func=cmd_audit)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
