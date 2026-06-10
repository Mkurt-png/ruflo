"""AI agent package.

Primary entry point: `UniversalAgent` — combines researcher, coder, tester,
reviewer, architect, security auditor, and devops capabilities in one agent.
The `AutonomousAgent` is the legacy 4-tool implementation kept for compatibility.
"""

from .agent import AgentResult, AutonomousAgent
from .security_agent import SecurityAgent, SecurityVerdict
from .security_tools import scan_file, scan_report
from .universal_agent import UniversalAgent

__all__ = [
    "UniversalAgent",      # all-in-one (primary)
    "AutonomousAgent",     # legacy
    "AgentResult",
    "SecurityAgent",
    "SecurityVerdict",
    "scan_file",
    "scan_report",
]
