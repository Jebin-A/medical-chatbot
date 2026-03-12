from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from extract import extract_text_from_bytes, extract_text_from_image_bytes
from rag import retrieve_context
from gemini_chat import analyze_with_gemini
import json

app = FastAPI(title="MediScan AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="../frontend"), name="static")

@app.get("/")
def root():
    return FileResponse("../frontend/index.html")

@app.post("/analyze")
async def analyze_report(
    file: UploadFile = File(...),
    question: str = Form(default="Analyze this report and explain the findings in simple language."),
    history: str = Form(default="[]")
):
    file_bytes = await file.read()
    filename   = file.filename.lower()

    # Extract text
    if filename.endswith(".pdf"):
        report_text = extract_text_from_bytes(file_bytes)
    elif filename.endswith((".jpg", ".jpeg", ".png")):
        report_text = extract_text_from_image_bytes(file_bytes, filename)
    else:
        return {"error": "Unsupported file type. Upload a PDF, JPG, or PNG."}

    if not report_text.strip():
        return {"error": "Could not extract text from the uploaded file."}

    # Parse chat history
    try:
        chat_history = json.loads(history)
    except:
        chat_history = []

    # Add current question to history
    chat_history.append({"role": "user", "text": question})

    # Retrieve RAG context
    retrieved_context = retrieve_context(query=report_text[:600], n_results=5)

    # Get Gemini response
    answer = analyze_with_gemini(report_text, retrieved_context, chat_history)

    return {"answer": answer}