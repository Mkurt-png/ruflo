"""Static security analysis tools — no external dependencies required."""

from __future__ import annotations

import ast
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


# ── Result types ───────────────────────────────────────────────────────────


@dataclass
class Finding:
    severity: str          # CRITICAL | HIGH | MEDIUM | LOW | INFO
    category: str          # e.g. "Secret", "Malware", "Injection"
    rule: str              # short rule ID
    message: str
    line: Optional[int] = None
    snippet: Optional[str] = None

    def __str__(self) -> str:
        loc = f" (line {self.line})" if self.line else ""
        snip = f"\n    → {self.snippet}" if self.snippet else ""
        return f"[{self.severity}] {self.category}/{self.rule}{loc}: {self.message}{snip}"


@dataclass
class ScanResult:
    path: str
    findings: list[Finding] = field(default_factory=list)
    scanned: bool = True
    error: Optional[str] = None

    @property
    def is_clean(self) -> bool:
        return not any(
            f.severity in ("CRITICAL", "HIGH") for f in self.findings
        )

    def summary(self) -> str:
        if self.error:
            return f"SCAN ERROR: {self.error}"
        counts: dict[str, int] = {}
        for f in self.findings:
            counts[f.severity] = counts.get(f.severity, 0) + 1
        if not counts:
            return "✅ CLEAN — no issues found"
        parts = [f"{v} {k}" for k, v in sorted(counts.items())]
        badge = "🔴" if "CRITICAL" in counts or "HIGH" in counts else "🟡"
        return f"{badge} {', '.join(parts)} issue(s) found"


# ── Pattern databases ──────────────────────────────────────────────────────

# Regex patterns for hardcoded secrets
_SECRET_PATTERNS: list[tuple[str, str, str]] = [
    ("Secret", "HARDCODED_API_KEY",
     r'(?i)(api[_-]?key|apikey)\s*[=:]\s*["\']([A-Za-z0-9_\-]{20,})["\']'),
    ("Secret", "HARDCODED_SECRET",
     r'(?i)(secret[_-]?key|secret)\s*[=:]\s*["\']([A-Za-z0-9_\-+/]{16,})["\']'),
    ("Secret", "HARDCODED_PASSWORD",
     r'(?i)(password|passwd|pwd)\s*[=:]\s*["\']([^"\']{6,})["\']'),
    ("Secret", "AWS_ACCESS_KEY",
     r'AKIA[0-9A-Z]{16}'),
    ("Secret", "GITHUB_TOKEN",
     r'gh[pousr]_[A-Za-z0-9_]{36,}'),
    ("Secret", "ANTHROPIC_KEY",
     r'sk-ant-[A-Za-z0-9\-_]{40,}'),
    ("Secret", "OPENAI_KEY",
     r'sk-[A-Za-z0-9]{48}'),
    ("Secret", "PRIVATE_KEY_BLOCK",
     r'-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    ("Secret", "JWT_TOKEN",
     r'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'),
    ("Secret", "DATABASE_URL",
     r'(?i)(db_url|database_url|connection_string)\s*[=:]\s*["\'][^"\']{10,}["\']'),
]

# Patterns indicative of malware / obfuscation  # nosec
_MALWARE_PATTERNS: list[tuple[str, str, str, str]] = [  # nosec
    ("CRITICAL", "Malware", "BASE64_EXEC",  # nosec
     r'(?i)(exec|eval)\s*\(\s*(base64\.b64decode|__import__)\s*\('),  # nosec
    ("CRITICAL", "Malware", "REVERSE_SHELL",  # nosec
     r'(?i)(socket\.connect|subprocess\.Popen|os\.system)\s*\(.*?(bash|sh|cmd|powershell)'),  # nosec
    ("CRITICAL", "Malware", "CRYPTO_MINER",  # nosec
     r'(?i)(xmrig|monero|stratum\+tcp|mining\.pool|coinhive)'),  # nosec
    ("HIGH",     "Malware", "OBFUSCATED_EXEC",  # nosec
     r'(?i)exec\s*\(\s*["\'][^"\']{200,}["\']'),  # nosec
    ("HIGH",     "Malware", "DYNAMIC_IMPORT",  # nosec
     r'__import__\s*\(\s*(chr\s*\(|"[^"]{1,40}"\s*\+)'),  # nosec
    ("HIGH",     "Malware", "ENV_EXFIL",  # nosec
     r'(?i)(os\.environ|getenv).{0,60}(requests\.(get|post)|urllib|http\.client)'),  # nosec
    ("HIGH",     "Malware", "KEYLOGGER",  # nosec
     r'(?i)(pynput|keyboard\.on_press|GetAsyncKeyState|SetWindowsHookEx)'),  # nosec
    ("MEDIUM",   "Malware", "SUSPICIOUS_DOWNLOAD",  # nosec
     r'(?i)(urllib\.request\.urlretrieve|requests\.get).{0,60}(\.exe|\.sh|\.bat|\.ps1)'),  # nosec
]

# OWASP / injection patterns
_INJECTION_PATTERNS: list[tuple[str, str, str, str]] = [
    ("HIGH",   "Injection", "SQL_FSTRING",
     r'(?i)(execute|cursor\.execute)\s*\(\s*f["\'].*?(select|insert|update|delete|drop)'),
    ("HIGH",   "Injection", "SQL_FORMAT",
     r'(?i)(execute|cursor\.execute)\s*\(\s*["\'].*?%\s*\('),
    ("HIGH",   "Injection", "CMD_INJECTION",
     r'(?i)(os\.system|subprocess\.call|subprocess\.run|Popen)\s*\(\s*(f["\']|["\']%|.*?\+)'),
    ("HIGH",   "Injection", "PATH_TRAVERSAL",
     r'(?i)open\s*\(\s*.*?(request\.|user_input|form\[|args\[|params\[)'),
    ("MEDIUM", "Injection", "XSS_UNESCAPED",
     r'(?i)(render_template_string|Markup\s*\(|mark_safe\s*\()\s*\(?\s*[^)]*?(request\.|user)'),
    ("MEDIUM", "Injection", "PICKLE_LOAD",
     r'(?i)pickle\.(load|loads)\s*\('),
    ("MEDIUM", "Injection", "YAML_UNSAFE",
     r'(?i)yaml\.load\s*\([^,)]+\)(?!\s*,\s*Loader\s*=\s*yaml\.SafeLoader)'),
    ("LOW",    "Injection", "XML_EXTERNAL",
     r'(?i)(parseString|parse)\s*\(.+?\)\s*#.*?(lxml|expat)'),
]

# Dangerous Python builtins / functions
_DANGEROUS_BUILTINS: set[str] = {
    "eval", "exec", "compile", "__import__", "open",
    "breakpoint", "input",  # input() in Python 3 is safe but flag in servers
}


# ── Scanners ───────────────────────────────────────────────────────────────


def _scan_with_patterns(
    lines: list[str],
    patterns: list[tuple],
    severity_index: Optional[int] = None,
) -> list[Finding]:
    findings: list[Finding] = []
    for i, line in enumerate(lines, start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if "# nosec" in line:  # inline suppression (Bandit-compatible)
            continue
        for entry in patterns:
            if len(entry) == 3:
                category, rule, pattern = entry
                severity = "HIGH"
            else:
                severity, category, rule, pattern = entry

            if severity_index is not None:
                severity = entry[severity_index]

            if re.search(pattern, line):
                findings.append(Finding(
                    severity=severity,
                    category=category,
                    rule=rule,
                    message=f"Pattern '{rule}' matched",
                    line=i,
                    snippet=stripped[:120],
                ))
    return findings


def scan_secrets(lines: list[str]) -> list[Finding]:
    findings: list[Finding] = []
    for i, line in enumerate(lines, start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if "# nosec" in line:
            continue
        for category, rule, pattern in _SECRET_PATTERNS:
            if re.search(pattern, line):
                # Redact the matched secret value from the snippet
                safe_snippet = re.sub(
                    r'(["\'])([A-Za-z0-9_\-+/=]{8,})(["\'])',
                    r'\1***REDACTED***\3',
                    stripped[:120],
                )
                findings.append(Finding(
                    severity="CRITICAL",
                    category=category,
                    rule=rule,
                    message="Possible hardcoded credential or secret",
                    line=i,
                    snippet=safe_snippet,
                ))
    return findings


def scan_malware(lines: list[str]) -> list[Finding]:
    return _scan_with_patterns(lines, _MALWARE_PATTERNS)  # type: ignore[arg-type]


def scan_injections(lines: list[str]) -> list[Finding]:
    return _scan_with_patterns(lines, _INJECTION_PATTERNS)  # type: ignore[arg-type]


def scan_ast(source: str, path: str) -> list[Finding]:
    """AST-based analysis for dangerous patterns (Python only)."""
    findings: list[Finding] = []
    try:
        tree = ast.parse(source)
    except SyntaxError as exc:
        return [Finding(
            severity="INFO",
            category="Parse",
            rule="SYNTAX_ERROR",
            message=f"Could not parse file: {exc}",
        )]

    for node in ast.walk(tree):
        # Dangerous builtins called directly
        if isinstance(node, ast.Call):
            func = node.func
            name: Optional[str] = None
            if isinstance(func, ast.Name):
                name = func.id
            elif isinstance(func, ast.Attribute):
                name = func.attr

            if name in ("eval", "exec", "compile"):
                findings.append(Finding(
                    severity="HIGH",
                    category="Dangerous",
                    rule="EVAL_EXEC",
                    message=f"Use of '{name}()' can execute arbitrary code",
                    line=node.lineno,
                ))

        # assert statements (disabled in optimized mode)
        if isinstance(node, ast.Assert):
            findings.append(Finding(
                severity="LOW",
                category="Reliability",
                rule="ASSERT_USED",
                message="assert statements are removed when Python runs with -O",
                line=node.lineno,
            ))

        # Broad exception silencing
        if isinstance(node, ast.ExceptHandler):
            if node.type is None:
                findings.append(Finding(
                    severity="LOW",
                    category="Reliability",
                    rule="BARE_EXCEPT",
                    message="Bare 'except:' swallows all exceptions including KeyboardInterrupt",
                    line=node.lineno,
                ))

    return findings


def scan_dependencies(path: str) -> list[Finding]:
    """Check requirements files for obviously insecure pinning."""
    findings: list[Finding] = []
    p = Path(path)
    if p.name not in ("requirements.txt", "requirements-dev.txt", "Pipfile"):
        return findings

    lines = p.read_text(encoding="utf-8").splitlines()
    for i, line in enumerate(lines, start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        # Unpinned package
        if "==" not in stripped and ">=" not in stripped and not stripped.startswith("-"):
            findings.append(Finding(
                severity="LOW",
                category="Dependency",
                rule="UNPINNED_DEP",
                message=f"Dependency '{stripped}' is not version-pinned",
                line=i,
                snippet=stripped,
            ))
    return findings


# ── Top-level scanner ──────────────────────────────────────────────────────

# Extensions to analyse
_TEXT_EXTENSIONS = {
    ".py", ".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs",
    ".sh", ".bash", ".env", ".yaml", ".yml", ".json",
    ".php", ".rb", ".go", ".java", ".cs", ".cpp", ".c",
    ".html", ".htm", ".sql",
}

_MAX_FILE_SIZE = 1_000_000  # 1 MB — skip larger files


def scan_file(path: str) -> ScanResult:
    """Full security scan of a single file."""
    result = ScanResult(path=path)
    p = Path(path)

    if not p.exists():
        result.error = "file not found"
        result.scanned = False
        return result

    if not p.is_file():
        result.error = "not a regular file"
        result.scanned = False
        return result

    if p.suffix.lower() not in _TEXT_EXTENSIONS:
        result.scanned = False
        result.error = "skipped (unsupported extension)"
        return result

    try:
        size = p.stat().st_size
        if size > _MAX_FILE_SIZE:
            result.scanned = False
            result.error = f"skipped (file too large: {size // 1024} KB)"
            return result

        source = p.read_text(encoding="utf-8", errors="replace")
        lines = source.splitlines()

        result.findings.extend(scan_secrets(lines))
        result.findings.extend(scan_malware(lines))
        result.findings.extend(scan_injections(lines))

        if p.suffix == ".py":
            result.findings.extend(scan_ast(source, path))

        result.findings.extend(scan_dependencies(path))

    except Exception as exc:
        result.error = str(exc)
        result.scanned = False

    return result


def scan_report(path: str) -> str:
    """Return a human-readable security report for a file."""
    result = scan_file(path)
    lines = [f"Security scan: {result.path}", result.summary()]
    if result.findings:
        lines.append("")
        for f in sorted(result.findings, key=lambda x: x.line or 0):
            lines.append(str(f))
    return "\n".join(lines)


def scan_report_json(path: str) -> str:
    """Return a JSON security report for programmatic use."""
    result = scan_file(path)
    data = {
        "path": result.path,
        "clean": result.is_clean,
        "summary": result.summary(),
        "findings": [
            {
                "severity": f.severity,
                "category": f.category,
                "rule": f.rule,
                "message": f.message,
                "line": f.line,
                "snippet": f.snippet,
            }
            for f in result.findings
        ],
    }
    return json.dumps(data, indent=2)
