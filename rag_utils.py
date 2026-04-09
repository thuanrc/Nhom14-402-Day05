import os
import faiss
import numpy as np
import pandas as pd
import pickle
import hashlib
from openai import OpenAI
from dotenv import load_dotenv
from rank_bm25 import BM25Okapi

load_dotenv()

class RAGManager:
    def __init__(self, base_url="https://models.inference.ai.azure.com", model_name="text-embedding-3-small", index_dir="data"):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(base_url=base_url, api_key=self.api_key)
        self.model_name = model_name
        self.index_dir = index_dir
        
        self.index = None
        self.bm25 = None
        self.chunks = [] # List of strings
        
        if not os.path.exists(self.index_dir):
            os.makedirs(self.index_dir)

    def _get_file_hash(self, file_path):
        """Calculate SHA256 hash of a file to detect changes."""
        hasher = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hasher.update(chunk)
        return hasher.hexdigest()

    def chunk_text(self, text, chunk_size=300, overlap=50):
        """Clean and chunk text."""
        # Pre-clean surrogates
        text = text.encode('utf-8', 'ignore').decode('utf-8')
        
        paragraphs = text.split('\n\n')
        final_chunks = []
        for p in paragraphs:
            p = p.strip()
            if not p:
                continue
            if len(p) > chunk_size:
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

    def save_index(self, file_hash):
        """Save FAISS index and metadata to disk."""
        faiss.write_index(self.index, os.path.join(self.index_dir, "index.faiss"))
        metadata = {
            "chunks": self.chunks,
            "hash": file_hash,
            "bm25": self.bm25
        }
        with open(os.path.join(self.index_dir, "metadata.pkl"), "wb") as f:
            pickle.dump(metadata, f)
        print("Index và Metadata đã được lưu xuống đĩa.")

    def load_index(self):
        """Load FAISS index and metadata from disk."""
        index_path = os.path.join(self.index_dir, "index.faiss")
        meta_path = os.path.join(self.index_dir, "metadata.pkl")
        
        if os.path.exists(index_path) and os.path.exists(meta_path):
            self.index = faiss.read_index(index_path)
            with open(meta_path, "rb") as f:
                metadata = pickle.load(f)
                self.chunks = metadata["chunks"]
                self.bm25 = metadata["bm25"]
            return metadata["hash"]
        return None

    def build_index(self, file_path, force=False):
        """Build or Load index with change detection."""
        if not os.path.exists(file_path):
            print(f"Warning: {file_path} not found.")
            return

        current_hash = self._get_file_hash(file_path)
        cached_hash = self.load_index()

        if not force and cached_hash == current_hash:
            print("Đã tải Index từ bộ nhớ đệm (Không có thay đổi trong file tài liệu).")
            return

        print("Đang xây dựng lại Index (File có thay đổi hoặc xây dựng lần đầu)...")
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        self.chunks = self.chunk_text(content)
        if not self.chunks:
            return

        # 1. FAISS Build
        embeddings = self.get_embeddings(self.chunks)
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(embeddings)

        # 2. BM25 Build
        tokenized_chunks = [c.lower().split() for c in self.chunks]
        self.bm25 = BM25Okapi(tokenized_chunks)

        # 3. Save
        self.save_index(current_hash)
        print(f"RAG Index hoàn tất với {len(self.chunks)} chunks.")

    def hybrid_search(self, query, top_k=5):
        """Combine FAISS and BM25 using simple RRF (Reciprocal Rank Fusion)."""
        if self.index is None or self.bm25 is None or not self.chunks:
            return []

        # Vector Search
        query_embedding = self.get_embeddings([query])
        _, v_indices = self.index.search(query_embedding, top_k * 2) # Get more candidates
        v_results = v_indices[0].tolist()

        # BM25 Search
        tokenized_query = query.lower().split()
        bm25_scores = self.bm25.get_scores(tokenized_query)
        b_indices = np.argsort(bm25_scores)[::-1][:top_k * 2].tolist()

        # Reciprocal Rank Fusion (RRF)
        # score = 1 / (rank + k)
        scores = {}
        for rank, idx in enumerate(v_results):
            if idx == -1: continue
            scores[idx] = scores.get(idx, 0) + 1 / (rank + 60)
        
        for rank, idx in enumerate(b_indices):
            scores[idx] = scores.get(idx, 0) + 1 / (rank + 60)

        # Sort by RRF score
        sorted_indices = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)[:top_k]
        
        # Return chunks with their IDs for citation
        return [{"id": i+1, "text": self.chunks[i]} for i in sorted_indices]

    def retrieve(self, query, top_k=3):
        """Compatible wrapper for retrieve, returns formatted text with citations."""
        results = self.hybrid_search(query, top_k)
        formatted = []
        for res in results:
            formatted.append(f"[Nguồn {res['id']}]: {res['text']}")
        return "\n---\n".join(formatted)
