import os
from google import genai
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """
You are MediScan AI, a helpful medical report assistant.

You will receive:
1. A patient's lab or medical report
2. Relevant knowledge from StatPearls (peer-reviewed)
3. The patient's question

Your response must:
- Summarize the report in 2-3 lines
- List abnormal values with simple explanations
- Use StatPearls context for clinical accuracy
- Suggest practical lifestyle or follow-up steps
- Use WARNING for anything urgent
- End with: Please consult a doctor for diagnosis and treatment.
"""

def analyze_with_gemini(report_text: str, retrieved_context: str, user_question: str) -> str:
    prompt = f"""
{SYSTEM_PROMPT}

===== PATIENT REPORT =====
{report_text}

===== STATPEARLS KNOWLEDGE =====
{retrieved_context}

===== PATIENT QUESTION =====
{user_question}

Provide your full analysis:
"""
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return response.text