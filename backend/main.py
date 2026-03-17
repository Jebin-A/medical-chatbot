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

def extract_text(file_bytes, filename):
    if filename.endswith(".pdf"):
        return extract_text_from_bytes(file_bytes)
    elif filename.endswith((".jpg", ".jpeg", ".png")):
        return extract_text_from_image_bytes(file_bytes, filename)
    return ""

@app.post("/analyze")
async def analyze_report(
    file: UploadFile = File(...),
    question: str = Form(default="Analyze this report and explain the findings in simple language."),
    history: str = Form(default="[]")
):
    file_bytes = await file.read()
    filename   = file.filename.lower()
    report_text = extract_text(file_bytes, filename)

    if not report_text.strip():
        return {"error": "Could not extract text from the uploaded file."}

    try:
        chat_history = json.loads(history)
    except:
        chat_history = []

    chat_history.append({"role": "user", "text": question})
    retrieved_context = retrieve_context(query=report_text[:600], n_results=5)
    result = analyze_with_gemini(report_text, retrieved_context, chat_history)

    return {
        "answer":     result.get("analysis", ""),
        "risk_score": result.get("risk_score", 50),
        "risk_level": result.get("risk_level", "Yellow"),
        "values":     result.get("values", [])
    }

@app.post("/compare")
async def compare_reports(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
):
    bytes1 = await file1.read()
    bytes2 = await file2.read()

    text1 = extract_text(bytes1, file1.filename.lower())
    text2 = extract_text(bytes2, file2.filename.lower())

    if not text1 or not text2:
        return {"error": "Could not extract text from one or both files."}

    ctx1 = retrieve_context(query=text1[:600], n_results=3)
    ctx2 = retrieve_context(query=text2[:600], n_results=3)

    question = "Compare these two reports. What improved, what worsened, and what stayed the same? Be specific about values."

    result1 = analyze_with_gemini(text1, ctx1, [{"role": "user", "text": question + "\n\nReport 1:\n" + text1 + "\n\nReport 2:\n" + text2}])
    result2 = analyze_with_gemini(text2, ctx2, [{"role": "user", "text": "Extract all lab values from this report only."}])

    return {
        "report1": result1,
        "report2": result2,
        "comparison": result1.get("analysis", "")
    }