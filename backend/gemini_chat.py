import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """You are MediScan AI, a helpful medical report assistant.

You have been given a patient's medical report. For EVERY response, you must return a JSON object with this exact structure:

{
  "analysis": "your full text analysis here in markdown format",
  "risk_score": <integer 0-100>,
  "risk_level": "<Green|Yellow|Red>",
  "values": [
    {"name": "<test name>", "value": "<numeric value>", "unit": "<unit>", "status": "<Normal|High|Low>", "normal_range": "<range>"},
    ...
  ]
}

Rules:
- risk_score: 85-100 = Green (all normal), 50-84 = Yellow (some abnormal), 0-49 = Red (urgent attention)
- values: extract every measurable lab value from the report
- analysis: full markdown explanation with simple language, ⚠️ WARNING for urgent items
- Always end analysis with: Please consult a doctor for diagnosis and treatment.
- Return ONLY the JSON object, no extra text, no markdown code fences."""

def analyze_with_gemini(report_text: str, retrieved_context: str, chat_history: list) -> dict:
    first_message = f"""Here is the patient's medical report and relevant medical knowledge.

===== PATIENT REPORT =====
{report_text}

===== RELEVANT MEDICAL KNOWLEDGE (StatPearls) =====
{retrieved_context}

Please analyze this report and answer all follow-up questions based on it."""

    contents = []
    contents.append(types.Content(
        role="user",
        parts=[types.Part(text=first_message)]
    ))
    contents.append(types.Content(
        role="model",
        parts=[types.Part(text='{"analysis": "I have reviewed the report. Ready for questions.", "risk_score": 0, "risk_level": "Green", "values": []}')]
    ))

    for msg in chat_history:
        role = "user" if msg["role"] == "user" else "model"
        contents.append(types.Content(
            role=role,
            parts=[types.Part(text=msg["text"])]
        ))

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
        contents=contents
    )

    raw = response.text.strip()
    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        return json.loads(raw)
    except Exception:
        # Fallback if JSON parsing fails
        return {
            "analysis": raw,
            "risk_score": 50,
            "risk_level": "Yellow",
            "values": []
        }