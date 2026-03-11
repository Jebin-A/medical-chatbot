from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from extract import extract_text_from_bytes
from rag import retrieve_context
from gemini_chat import analyze_with_gemini
import os

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
    question: str = Form(default="Analyze this report and explain the findings in simple language.")
):
    file_bytes  = await file.read()
    report_text = extract_text_from_bytes(file_bytes)

    if not report_text.strip():
        return {"error": "Could not extract text from the uploaded file."}

    rag_query         = report_text[:600]
    retrieved_context = retrieve_context(query=rag_query, n_results=5)
    answer            = analyze_with_gemini(report_text, retrieved_context, question)

    return {"answer": answer}
