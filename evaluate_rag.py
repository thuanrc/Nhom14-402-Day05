import os
from openai import OpenAI
from rag_utils import RAGManager
from chatbot import contextualize_query, rerank_chunks
from dotenv import load_dotenv

load_dotenv()

def evaluate_rag():
    client = OpenAI(base_url="https://models.inference.ai.azure.com", api_key=os.getenv("OPENAI_API_KEY"))
    rag = RAGManager()
    rag.build_index("knowledge_base.txt")

    test_cases = [
        {
            "question": "Công ty ABC có trụ sở ở đâu?",
            "expected_info": "123 Đường Láng, Đống Đa, Hà Nội"
        },
        {
            "question": "Thời gian làm việc của công ty như thế nào?",
            "expected_info": "thứ 2 đến thứ 6, 8:00 đến 17:00"
        },
        {
            "question": "Công ty có cung cấp dịch vụ AI không?",
            "expected_info": "Có, chatbot, trợ lý ảo, hệ thống gợi ý..."
        }
    ]

    print(f"{'='*50}")
    print(f"BẮT ĐẦU ĐÁNH GIÁ RAG")
    print(f"{'='*50}\n")

    for i, case in enumerate(test_cases):
        print(f"Test Case {i+1}: {case['question']}")
        
        # Simulate RAG pipeline
        standalone = contextualize_query(client, case['question'], [])
        candidates = rag.hybrid_search(standalone, top_k=10)
        context = rerank_chunks(client, standalone, candidates)
        
        # Get AI Answer
        prompt = (
            "Dựa vào ngữ cảnh dưới đây, hãy trả lời câu hỏi.\n"
            f"Ngữ cảnh: {context}\n"
            f"Câu hỏi: {case['question']}"
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        answer = response.choices[0].message.content
        
        # LLM Judge
        eval_prompt = (
            "Bạn là một kiểm soát viên chất lượng định lượng.\n"
            f"Câu hỏi: {case['question']}\n"
            f"Thông tin mong đợi: {case['expected_info']}\n"
            f"Câu trả lời của AI: {answer}\n\n"
            "Hãy đánh giá câu trả lời trên thang điểm 1-10 dựa trên: \n"
            "1. Độ chính xác so với thông tin mong đợi.\n"
            "2. Có trích dẫn nguồn không (ví dụ [Nguồn N]).\n\n"
            "Trả về kết quả theo định dạng:\n"
            "Score: [Điểm/10]\n"
            "Reason: [Lý giải ngắn gọn]"
        )
        
        eval_resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": eval_prompt}]
        )
        print(f"AI Answer: {answer[:100]}...")
        print(f"Evaluation: {eval_resp.choices[0].message.content}")
        print(f"{'-'*50}\n")

if __name__ == "__main__":
    evaluate_rag()
