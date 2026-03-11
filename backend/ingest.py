import os
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from extract import extract_text_from_path

KNOWLEDGE_BASE_DIR = "../knowledge_base/statpearls"
CHROMA_DIR         = "../chroma_db"
CHUNK_SIZE         = 800
CHUNK_OVERLAP      = 100

def chunk_text(text: str, source: str) -> list:
    chunks = []
    start  = 0
    index  = 0
    while start < len(text):
        end   = start + CHUNK_SIZE
        chunk = text[start:end]
        if chunk.strip():
            chunks.append({
                "id":     f"{source}_chunk_{index}",
                "text":   chunk,
                "source": source
            })
        start  = end - CHUNK_OVERLAP
        index += 1
    return chunks

def ingest_all():
    client   = chromadb.PersistentClient(path=CHROMA_DIR)
    embed_fn = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    collection = client.get_or_create_collection(
        name="medical_knowledge", embedding_function=embed_fn)
    pdf_files = [f for f in os.listdir(KNOWLEDGE_BASE_DIR) if f.endswith(".pdf")]
    if not pdf_files:
        print("No PDFs found! Add PDFs to knowledge_base/statpearls/")
        return
    print(f"Found {len(pdf_files)} PDF(s). Starting ingestion...")
    for pdf_file in pdf_files:
        path = os.path.join(KNOWLEDGE_BASE_DIR, pdf_file)
        print(f"  Processing: {pdf_file}")
        full_text = extract_text_from_path(path)
        chunks    = chunk_text(full_text, source=pdf_file)
        for i in range(0, len(chunks), 50):
            batch = chunks[i:i+50]
            collection.upsert(
                ids=[c["id"] for c in batch],
                documents=[c["text"] for c in batch],
                metadatas=[{"source": c["source"]} for c in batch])
        print(f"  Done: {len(chunks)} chunks stored")
    print(f"Ingestion complete! Total: {collection.count()} chunks")

if __name__ == "__main__":
    ingest_all()