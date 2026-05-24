import json
import os
from openai import OpenAI


def analyze_with_openai(email_text: str) -> dict | None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    client = OpenAI(api_key=api_key)
    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "Return compact JSON with keys probability, suspicious_intent, tone_manipulation, summary for phishing analysis."
            },
            {"role": "user", "content": email_text[:12000]}
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
    )
    try:
        data = json.loads(response.choices[0].message.content)
        data["model"] = model
        return data
    except Exception:
        return None
