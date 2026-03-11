import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

CHROMA_DIR = "../chroma_db"

def get_collection():
    client   = chromadb.PersistentClient(path=CHROMA_DIR)
    embed_fn = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    return client.get_collection(
        name="medical_knowledge", embedding_function=embed_fn)

def retrieve_context(query: str, n_results: int = 5) -> str:
    try:
        collection = get_collection()
        results    = collection.query(query_texts=[query], n_results=n_results)
        docs    = results["documents"][0]
        sources = [m["source"] for m in results["metadatas"][0]]
        context = ""
        for doc, src in zip(docs, sources):
            context += f"[From: {src}]\n{doc}\n" + "-"*40 + "\n"
        return context
    except Exception as e:
        return f"Knowledge base not available: {str(e)}"