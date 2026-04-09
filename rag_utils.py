import os
import faiss
import numpy as np
import pandas as pd
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class RAGManager:
    def __init__(self, base_url="https://models.inference.ai.azure.com", model_name="text-embedding-3-small"):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(base_url=base_url, api_key=self.api_key)
        self.model_name = model_name
        self.index = None
        self.chunks = []

    def chunk_text(self, text, chunk_size=300, overlap=50):
        """Simple paragraph-based chunking with size limit."""
        paragraphs = text.split('\n\n')
        final_chunks = []
        for p in paragraphs:
            p = p.strip()
            if not p:
                continue
            if len(p) > chunk_size:
                # Simple split if too long (could be improved)
                for i in range(0, len(p), chunk_size - overlap):
                    final_chunks.append(p[i:i + chunk_size])
            else:
                final_chunks.append(p)
        return final_chunks

    def get_embeddings(self, texts):
        """Fetch embeddings from OpenAI."""
        response = self.client.embeddings.create(
            input=texts,
            model=self.model_name
        )
        return np.array([item.embedding for item in response.data]).astype('float32')

    def build_index(self, file_path):
        """Read file, chunk it, embed it, and build FAISS index."""
        if not os.path.exists(file_path):
            print(f"Warning: {file_path} not found.")
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read().encode('utf-8', 'ignore').decode('utf-8')

        self.chunks = self.chunk_text(content)
        if not self.chunks:
            return

        embeddings = self.get_embeddings(self.chunks)
        dimension = embeddings.shape[1]
        
        # Build IndexFlatL2 (dot product/cosine would be IndexFlatIP but L2 is fine for small scale)
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(embeddings)
        print(f"RAQ Index built with {len(self.chunks)} chunks.")

    def retrieve(self, query, top_k=3):
        """Retrieve most relevant chunks for a query."""
        if self.index is None or not self.chunks:
            return ""

        query_embedding = self.get_embeddings([query])
        distances, indices = self.index.search(query_embedding, top_k)
        
        relevant_chunks = [self.chunks[i] for i in indices[0] if i != -1]
        return "\n---\n".join(relevant_chunks)
