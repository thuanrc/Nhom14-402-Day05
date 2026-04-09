from rag_utils import RAGManager
import os

def test_rag():
    rag = RAGManager()
    
    # Create a dummy KB for testing
    kb_content = """
    Lịch sử công ty: Thành lập năm 2015.
    Địa chỉ: 123 Đường Láng, Hà Nội.
    Dịch vụ: AI, Machine Learning.
    """
    with open("test_kb.txt", "w", encoding="utf-8") as f:
        f.write(kb_content)
    
    print("Testing index building...")
    rag.build_index("test_kb.txt")
    
    query = "Công ty ở đâu?"
    print(f"Query: {query}")
    result = rag.retrieve(query)
    print(f"Retrieved Context:\n{result}")
    
    if "123 Đường Láng" in result:
        print("Verification SUCCESS: Retrieval works.")
    else:
        print("Verification FAILED: Content not found.")
    
    # Clean up
    if os.path.exists("test_kb.txt"):
        os.remove("test_kb.txt")

if __name__ == "__main__":
    try:
        test_rag()
    except Exception as e:
        print(f"Test failed with error: {e}")
        print("Note: This failure might be due to missing dependencies (faiss, openai) in this environment.")
