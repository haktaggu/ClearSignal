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
  "tone": "contradict",
  "intensity": 0.85,
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

Choose tone from only these values:
- "contradict" for a supported factual contradiction.
- "sly" for supported pressure, secrecy, or manipulative language.
- "anger" for supported threatening, coercive, or clearly angry language.
- "neutral" when no specific warning sign is found.

Use an intensity from 0.0 to 1.0. Use a low intensity for
neutral and a higher intensity only when the evidence supports it.
Do not use "joking" or "sarcasm" because text alone cannot
reliably determine vocal delivery.

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

    valid_tones = {"neutral", "sly", "contradict", "anger"}
    model_tone = result.get("tone")
    model_intensity = result.get("intensity")

    if not verified_findings:
        tone = "neutral"
        intensity = 0.2
    else:
        tone = model_tone if model_tone in valid_tones else "neutral"
        intensity = (
            model_intensity
            if isinstance(model_intensity, (int, float))
            and 0.0 <= model_intensity <= 1.0
            else 0.7
        )

    return {
        "status": (
            "review_suggested"
            if verified_findings
            else "no_pattern_detected"
        ),
        "tone": tone,
        "intensity": intensity,
        "findings": verified_findings,
        "suggested_question": result.get(
            "suggested_question"
        )
    }

def translate_to_spanish(text: str) -> str:
    response = model.chat(
        messages=[
            {
                "role": "system",
                "content": (
                    "Translate the user's text into natural Spanish. "
                    "Return only the translation. "
                    "Do not add explanations or quotation marks."
                ),
            },
            {
                "role": "user",
                "content": text,
            },
        ]
    )

    return response["choices"][0]["message"]["content"].strip()
