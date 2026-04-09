# Context-Restricted AI Chatbot

Một chatbot thông minh được xây dựng bằng Python và OpenAI, có khả năng học và trả lời các câu hỏi dựa trên một nội dung (context) cụ thể được cung cấp trước, đồng thời từ chối các câu hỏi không liên quan.

## ✨ Tính năng chính
- **Knowledge-Based**: Chỉ trả lời dựa trên nội dung được cấu hình trong code.
- **Out-of-scope Protection**: Tự động nhận diện và từ chối các câu hỏi nằm ngoài phạm vi kiến thức được cấp.
- **Streaming Response**: Hiển thị câu trả lời dưới dạng dòng chảy (streaming) tương tự ChatGPT.
- **Robust Encoding**: Hỗ trợ hiển thị tiếng Việt chuẩn trên Windows terminal thông qua việc xử lý Unicode và surrogates.
- **Conversation History**: Ghi nhớ ngữ cảnh hội thoại gần nhất (3 lượt gần nhất).

## 🚀 Hướng dẫn cài đặt

### 1. Chuẩn bị
- Python 3.8 trở lên.
- Một OpenAI API Key (hoặc API tương thích).

### 2. Thiết lập môi trường
```powershell
# Tạo môi trường ảo
python -m venv venv

# Kích hoạt (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Cài đặt thư viện
pip install -r requirements.txt
```

### 3. Cấu hình biến môi trường
Tạo hoặc chỉnh sửa file `.env` ở thư mục gốc:
```text
OPENAI_API_KEY=your_api_key_here
```

## 🛠 Cách sử dụng

### Thay đổi nội dung Chatbot học
Mở file `chatbot.py` và tìm đến khối `if __name__ == "__main__":` ở cuối file để thay đổi biến `CONTEXT`:

```python
if __name__ == "__main__":
    CONTEXT = """
    Dán nội dung bạn muốn chatbot trả lời vào đây...
    """
    streaming_chatbot(CONTEXT)
```

### Chạy ứng dụng
Mở terminal và chạy lệnh:
```powershell
chcp 65001
python chatbot.py
```

## 📂 Cấu trúc thư mục
- `chatbot.py`: Code logic chính của chatbot.
- `requirements.txt`: Danh sách các thư viện phụ thuộc.
- `.env`: Lưu trữ API Key bảo mật.
- `README.md`: Hướng dẫn này.

## ⚖️ Giấy phép
Dự án được phát triển cho mục đích học tập và nghiên cứu AI.
