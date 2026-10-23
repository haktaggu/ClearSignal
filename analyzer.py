
import re

WARNING_PATTERNS = {
    "Urgency pressure": [
        r"\bright now\b",
        r"\bimmediately\b",
        r"\bno time to think\b"
    ],
    "Secrecy pressure": [
        r"\bdon't tell anyone\b",
        r"\bkeep this secret\b"
    ],
    "Restricted communication": [
        r"\byou cannot call anyone\b",
        r"\bdon't contact anyone\b"
    ]
}

def analyze_conversation(history, new_text):
    findings = []

    # Detect simple warning phrases
    for category, patterns in WARNING_PATTERNS.items():
        for pattern in patterns:
            match = re.search(pattern, new_text, re.I)
            if match:
                findings.append({
                    "type": "warning_sign",
                    "category": category,
                    "evidence": match.group(0)
                })
                break

    # Very simple contradiction demonstration
    previous = " ".join(history).lower()
    current = new_text.lower()

    if (
        "no extra fees" in previous
        or "no additional fees" in previous
    ) and re.search(
        r"\b(pay|processing fee|additional fee)\b",
        current
    ):
        findings.append({
            "type": "possible_contradiction",
            "category": "Fee inconsistency",
            "evidence": new_text,
            "explanation": (
                "An earlier statement mentioned no extra "
                "fees, but the new statement mentions "
                "a possible payment."
            )
        })

    return {
        "transcript": new_text,
        "findings": findings,
        "status": (
            "review_suggested" if findings
            else "no_pattern_detected"
        )
    }
