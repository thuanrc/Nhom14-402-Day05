import os
import time
import sys

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
    """Recursively remove surrogate characters from strings/dicts/lists."""
    if isinstance(text, str):
        return text.encode('utf-8', 'ignore').decode('utf-8')
    if isinstance(text, dict):
        return {k: clean_surrogates(v) for k, v in text.items()}
    if isinstance(text, list):
        return [clean_surrogates(i) for i in text]
    return text

def streaming_chatbot(CONTEXT: str) -> None:
    """
    Run an interactive streaming chatbot in the terminal.

    Behaviour:
        - Streams tokens from OpenAI as they arrive (print each chunk).
        - Maintains the last 3 conversation turns in history + a static system prompt.
        - Typing 'quit' or 'exit' ends the loop.
    """
    from openai import OpenAI
    from dotenv import load_dotenv
    
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    client = OpenAI(base_url="https://models.inference.ai.azure.com", api_key=api_key)

    SYSTEM_PROMPT = {
        "role": "system",
        "content": (
            "Bạn là một hệ thống AI thông minh và thân thiện, chuyên hỗ trợ học sinh học tập.\n"
            "Nhiệm vụ của bạn là trả lời các câu hỏi của học sinh dựa trên nội dung (CONTEXT) dưới đây:\n"
            "--- \n"
            f"{CONTEXT}\n"
            "--- \n\n"
            "Quy tắc quan trọng:\n"
            "1. Chỉ trả lời các câu hỏi liên quan hoặc có trong nội dung được cung cấp ở trên.\n"
            "2. Nếu câu hỏi không liên quan, hãy trả lời lịch sự rằng bạn chỉ có thể hỗ trợ các vấn đề trong phạm vi kiến thức này.\n"
            "3. Tuyệt đối không trả lời các câu hỏi nhạy cảm, bạo lực, có nội dung không lành mạnh hoặc ảnh hưởng tiêu cực đến tâm lý học sinh.\n"
            "4. Luôn giữ thái độ tích cực, khuyến khích học sinh và sử dụng ngôn ngữ trong sáng, phù hợp với lứa tuổi."
        )
    }
    
    history = []
    
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
        
        # Add user message to history
        history.append({"role": "user", "content": user_input})

        # Prepare messages for API call (Always include system prompt)
        messages = [SYSTEM_PROMPT] + history
        
        # Sanitize messages to avoid UnicodeEncodeError (surrogates)
        messages = clean_surrogates(messages)

        # Stream response
        print("Assistant: ", end="", flush=True)
        
        stream = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            stream=True
        )
        
        assistant_response = ""
        for chunk in stream:
            try:
                delta = chunk.choices[0].delta.content 
                if delta:
                    assistant_response += delta
                    print(delta, end="", flush=True)
            except:
                continue
        
        print()  # New line after streaming completes
        
        # Add assistant response to history
        history.append({"role": "assistant", "content": assistant_response})
        
        # Trim history to last 3 turns (6 messages)
        history = history[-6:]

    print("Chatbot session ended.")


# ---------------------------------------------------------------------------
# Entry point for manual testing
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # [ACTION] Replace this with your actual content
    CONTEXT = """
    Công ty ABC là một công ty công nghệ đa quốc gia có trụ sở tại Hà Nội.
    Chúng tôi cung cấp các giải pháp về Trí tuệ nhân tạo (AI), Học máy (Machine Learning) và Phát triển phần mềm.
    Thời gian làm việc từ thứ 2 đến thứ 6, từ 8:00 đến 17:00.
    Địa chỉ: 123 Đường Láng, Đống Đa, Hà Nội.
    Số điện thoại: 0123 456 789.
    """

    streaming_chatbot(CONTEXT)
