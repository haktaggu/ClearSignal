import os
import json
from dotenv import load_dotenv
from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference

load_dotenv()

credentials = Credentials(
    url=os.environ["WATSONX_URL"],
    api_key=os.environ["WATSONX_API_KEY"]
)

model = ModelInference(
    model_id=os.environ["WATSONX_MODEL_ID"],
    credentials=credentials,
    project_id=os.environ["WATSONX_PROJECT_ID"],
    params={"max_tokens": 700, "temperature": 0.1}
)

SYSTEM_PROMPT = """
You are ClearSignal, an accessible communication
understanding assistant.

Analyze conversations for:
1. Explicit pressure tactics
2. Possible factual contradictions
3. Requests for secrecy
4. Threatening or coercive statements
5. Ambiguous communication

Do not judge someone's intentions, honesty,
personality, or dangerousness.

Return ONLY valid JSON with this structure:

{
  "status": "review_suggested",
  "findings": [
    {
      "type": "possible_contradiction",
      "category": "Fee inconsistency",
      "evidence": "Exact quote from transcript",
      "explanation": "Why it may be concerning",
      "alternative_explanation": "An innocent explanation"
    }
  ],
  "suggested_question": "A neutral question"
}

Use status "no_pattern_detected" if no
specific warning sign is found.

Never invent quotes or missing facts.
"""

def analyze_conversation(history, new_text):
    conversation = {
        "history": history,
        "latest_statement": new_text
    }

    response = model.chat(
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": json.dumps(conversation)
            }
        ]
    )

    content = response["choices"][0]["message"]["content"]

    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        return {
            "status": "analysis_unavailable",
            "findings": [],
            "suggested_question": None,
            "error": "Model returned invalid JSON"
        }

    # Only retain findings supported by exact
    # text in the conversation.
    full_text = "\n".join(history + [new_text])

    verified_findings = []

    for finding in result.get("findings", []):
        if not isinstance(finding, dict):
            continue

        evidence = finding.get("evidence", "")

        if (
            isinstance(evidence, str)
            and evidence.strip()
            and evidence in full_text
        ):
            verified_findings.append(finding)

    return {
        "status": (
            "review_suggested"
            if verified_findings
            else "no_pattern_detected"
        ),
        "findings": verified_findings,
        "suggested_question": result.get(
            "suggested_question"
        )
    }
