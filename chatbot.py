import os
import time
import sys
from rag_utils import RAGManager

# Ensure terminal output supports UTF-8 for Vietnamese characters
if sys.stdout.encoding.lower() != 'utf-8':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    else:
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ---------------------------------------------------------------------------
# Streaming chatbot with conversation history
# ---------------------------------------------------------------------------
def clean_surrogates(text):
    """Recursively remove surrogate characters from strings/dicts/lists/None."""
    if text is None:
        return None
    if isinstance(text, str):
        return text.encode('utf-8', 'ignore').decode('utf-8')
    if isinstance(text, dict):
        return {k: clean_surrogates(v) for k, v in text.items()}
    if isinstance(text, list):
        return [clean_surrogates(i) for i in text]
    return text

def contextualize_query(client, user_input, history):
    """
    Rewrite the user's query to be a standalone question based on history.
    """
    if not history:
        return clean_surrogates(user_input)

    # Prepare historical context (last 4 messages for brevity)
    context_str = ""
    for msg in history[-4:]:
        role = "Học sinh" if msg["role"] == "user" else "AI"
        context_str += f"{role}: {msg['content']}\n"

    prompt = (
        "Dựa vào lịch sử hội thoại dưới đây, hãy viết lại câu hỏi cuối cùng của học sinh thành một câu hỏi độc lập, "
        "đầy đủ ý nghĩa để có thể dùng để tìm kiếm thông tin.\n"
        "Yêu cầu:\n"
        "- KHÔNG trả lời câu hỏi, CHỈ viết lại câu hỏi.\n"
        "- Giữ nguyên ngôn ngữ (Tiếng Việt).\n"
        "- Nếu câu hỏi đã đủ ý nghĩa, hãy giữ nguyên.\n\n"
        f"Lịch sử hội thoại:\n{context_str}\n"
        f"Câu hỏi mới nhất: {user_input}\n\n"
        "Câu hỏi độc lập:"
    )

    # Clean the prompt before sending
    prompt = clean_surrogates(prompt)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )
    return clean_surrogates(response.choices[0].message.content.strip())

def streaming_chatbot(rag_manager: RAGManager) -> None:
    """
    Run an interactive streaming chatbot in the terminal using RAG.
    """
    from openai import OpenAI
    from dotenv import load_dotenv
    
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    client = OpenAI(base_url="https://models.inference.ai.azure.com", api_key=api_key)

    def get_system_prompt(retrieved_context):
        return {
            "role": "system",
            "content": (
                "Bạn là 'AI Support Assistant' - một chuyên gia hỗ trợ thông minh, thân thiện và chuyên nghiệp.\n"
                "Nhiệm vụ của bạn là giải đáp thắc mắc dựa trên NGỮ CẢNH (CONTEXT) được cung cấp dưới đây.\n\n"
                "--- NGỮ CẢNH ---\n"
                f"{retrieved_context}\n"
                "-----------------\n\n"
                "QUY TẮC PHẢN HỒI:\n"
                "1. CHỈ sử dụng thông tin trong NGỮ CẢNH để trả lời. Nếu không tìm thấy thông tin, hãy trả lời: "
                "'Rất tiếc, tôi không có thông tin về vấn đề này trong cơ sở dữ liệu. Bạn có thể hỏi về [gợi ý một vài chủ đề có trong ngữ cảnh] không?'\n"
                "2. Nếu câu hỏi mang tính chào hỏi hoặc xã giao, hãy đáp lại một cách thân thiện và mời họ đặt câu hỏi về kiến thức.\n"
                "3. Trình bày câu trả lời rõ ràng, sử dụng gạch đầu dòng nếu cần thiết.\n"
                "4. Tuyệt đối KHÔNG trả lời các nội dung nhạy cảm, chính trị, bạo lực hoặc không lành mạnh.\n"
                "5. Luôn giữ thái độ tích cực và khuyến khích."
            )
        }
    
    history = []
    
    print("--- Chatbot RAG đã sẵn sàng! (Gõ 'quit' để thoát) ---")
    
    while True:
        try:
            print("You: ", end="", flush=True)
            line = sys.stdin.readline()
            if not line:
                break
            user_input = line.strip()
        except UnicodeDecodeError:
            print("\nError: Invalid character in input. Please try again.")
            continue
        
        if user_input.lower() in ['quit', 'exit']:
            break
        
        if not user_input:
            continue
        
        # Step 1: Contextualize user query (Memory Enhancement)
        standalone_query = contextualize_query(client, user_input, history)
        
        # Step 2: Retrieve relevant chunks (RAG)
        retrieved_context = rag_manager.retrieve(standalone_query)

        # Step 3: Prepare messages with Dynamic System Prompt
        SYSTEM_PROMPT = get_system_prompt(retrieved_context)
        messages = [SYSTEM_PROMPT] + history + [{"role": "user", "content": user_input}]
        
        # Sanitize messages
        messages = clean_surrogates(messages)

        # Stream response
        print(f"Assistant: ", end="", flush=True)
        # (Optional: print standalone query for debugging)
        # print(f"[{standalone_query}] ", end="", flush=True)
        
        stream = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            stream=True
        )
        
        assistant_response = ""
        for chunk in stream:
            try:
                if chunk.choices and chunk.choices[0].delta.content:
                    delta = chunk.choices[0].delta.content
                    assistant_response += delta
                    print(delta, end="", flush=True)
            except:
                continue
        
        print()
        
        # Add to history
        history.append({"role": "user", "content": user_input})
        history.append({"role": "assistant", "content": assistant_response})
        
        # Trim history (keep more history now as we use contextualization)
        history = history[-10:]

    print("Chatbot session ended.")


# ---------------------------------------------------------------------------
# Entry point for manual testing
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # Initialize RAG Manager
    rag = RAGManager()
    
    # Path to knowledge base
    KB_FILE = "knowledge_base.txt"
    
    # Build index if file exists
    if os.path.exists(KB_FILE):
        print(f"Bắt đầu xây dựng cơ sở dữ liệu từ {KB_FILE}...")
        rag.build_index(KB_FILE)
    else:
        print(f"Cảnh báo: Không tìm thấy file {KB_FILE}. Chatbot sẽ chạy không có dữ liệu RAG.")

    streaming_chatbot(rag)
