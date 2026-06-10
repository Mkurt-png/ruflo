---
name: ask
description: Universal all-in-one agent — research, code, test, audit, git in one entry point
---

# /ask — Universal Agent

The Universal Agent combines every specialised Claude role (researcher, coder,
tester, reviewer, architect, security auditor, devops) into one always-on agent
driven by an agentic loop.

## Invocation

From this Claude Code session, ask normally — I (Claude Code) will route the
task and use the right tools.

From the terminal, run it standalone:

```bash
python -m src.ai_agent ask "<task description>"
python -m src.ai_agent ask "<task>" --quiet     # only show final answer
```

## Capabilities

| Capability  | Tools                                                 |
| ----------- | ----------------------------------------------------- |
| Research    | `read_file`, `search_code`, `find_files`, `fetch_url` |
| Code        | `write_file`, `edit_file`, `execute_python`           |
| Operate     | `execute_command`, `git_command` (read-only)          |
| Security    | `security_scan` (static, zero-cost)                   |
| Output      | `write_output` (terminates the loop)                  |

## Examples

```bash
# Research
python -m src.ai_agent ask "How does the security agent block CRITICAL findings?"

# Code
python -m src.ai_agent ask "Add a --json flag to the scan subcommand"

# Audit
python -m src.ai_agent ask "Find and fix any SQL injection patterns in src/"

# Plan
python -m src.ai_agent ask "Design a CLI for batch-scanning a whole repo"
```

## Safety

The agent layer blocks:

- Destructive shell (`rm -rf /`, `mkfs`, `dd`, fork bombs, pipe-to-shell)
- Reading/writing/editing `.env`, `*.pem`, `*.key`, `id_rsa`, `credentials.json`
- Git write commands (commit, push, reset) — must go through `execute_command`
  after explicit user approval

The post-edit security hook (`.claude/hooks/post-edit-security.py`) runs on
every file write and **blocks CRITICAL findings** via exit code 2.

## Programmatic Use

```python
from src.ai_agent import UniversalAgent

agent = UniversalAgent()
result = agent.run("Summarise the architecture in src/ai_agent/")
print(result.answer)
print(f"Tokens: {result.input_tokens} in / {result.output_tokens} out")
```
