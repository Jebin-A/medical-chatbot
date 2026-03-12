import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """You are MediScan AI, a helpful medical report assistant.

You have been given a patient's medical report. Answer all questions based on this report.
For each response:
- Reference specific values from the report
- Use StatPearls knowledge for clinical context
- Explain in simple language the patient can understand
- Use ⚠️ WARNING for anything urgent
- Always end with: Please consult a doctor for diagnosis and treatment."""

def analyze_with_gemini(report_text: str, retrieved_context: str, chat_history: list) -> str:
    # Build full context as the first user message
    first_message = f"""Here is the patient's medical report and relevant medical knowledge.

===== PATIENT REPORT =====
{report_text}

===== RELEVANT MEDICAL KNOWLEDGE (StatPearls) =====
{retrieved_context}

Please analyze this report and answer all follow-up questions based on it."""

    # Build conversation history for Gemini
    contents = []

    # Add report context as first exchange
    contents.append(types.Content(
        role="user",
        parts=[types.Part(text=first_message)]
    ))
    contents.append(types.Content(
        role="model",
        parts=[types.Part(text="I have reviewed the patient's medical report and the relevant StatPearls knowledge. I'm ready to answer your questions about it.")]
    ))

    # Add actual chat history
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
    return response.text