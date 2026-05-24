import re
from urllib.parse import urlparse

SUSPICIOUS_TLDS = {"zip", "mov", "tk", "top", "xyz", "click", "gq"}
DANGEROUS_EXTENSIONS = {".exe", ".scr", ".js", ".vbs", ".iso", ".lnk", ".hta", ".ps1", ".bat", ".cmd"}
URGENCY_TERMS = {"urgent", "immediately", "final notice", "suspended", "expires today", "wire transfer"}
CREDENTIAL_TERMS = {"password", "mfa", "verify account", "login", "credential", "reset your account"}


def detect_urls(urls: list[str]) -> int:
    count = 0
    for url in urls:
        parsed = urlparse(url)
        host = parsed.hostname or ""
        tld = host.rsplit(".", 1)[-1]
        if "@" in url or re.search(r"\d+\.\d+\.\d+\.\d+", host) or tld in SUSPICIOUS_TLDS:
            count += 1
        if len(host.split(".")) > 4:
            count += 1
    return count


def attachment_risk(attachments) -> float:
    if not attachments:
        return 0.0
    risky = 0
    for attachment in attachments:
        lower = attachment.name.lower()
        if any(lower.endswith(ext) for ext in DANGEROUS_EXTENSIONS):
            risky += 1
        if attachment.size > 20_000_000:
            risky += 0.5
    return min(1.0, risky / max(1, len(attachments)))


def contains_any(text: str, terms: set[str]) -> bool:
    lower = text.lower()
    return any(term in lower for term in terms)


def heuristic_probability(text: str, malicious_urls: int, attachment_score: float) -> float:
    score = 0.05
    score += 0.25 if contains_any(text, URGENCY_TERMS) else 0
    score += 0.30 if contains_any(text, CREDENTIAL_TERMS) else 0
    score += min(0.25, malicious_urls * 0.12)
    score += attachment_score * 0.20
    score += 0.10 if re.search(r"gift card|crypto|invoice|payment", text, re.I) else 0
    return min(0.99, score)
