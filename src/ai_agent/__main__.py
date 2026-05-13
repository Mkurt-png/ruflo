"""CLI entrypoint: python -m src.ai_agent 'Your task here'"""

import argparse
import sys


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="ai_agent",
        description="Run the autonomous AI agent on a task.",
    )
    parser.add_argument(
        "task",
        nargs="?",
        help="The task for the agent to complete (or reads from stdin if omitted)",
    )
    parser.add_argument(
        "--quiet",
        "-q",
        action="store_true",
        help="Suppress per-iteration output; only print the final answer",
    )
    parser.add_argument(
        "--api-key",
        help="Anthropic API key (defaults to ANTHROPIC_API_KEY env var)",
    )
    args = parser.parse_args()

    task = args.task or sys.stdin.read().strip()
    if not task:
        parser.error("A task must be provided as an argument or via stdin.")

    # Lazy import so errors surface clearly
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


if __name__ == "__main__":
    main()
