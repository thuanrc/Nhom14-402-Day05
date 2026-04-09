# Context-Restricted AI Chatbot

Một chatbot thông minh được xây dựng bằng Python và OpenAI, có khả năng học và trả lời các câu hỏi dựa trên một nội dung (context) cụ thể được cung cấp trước, đồng thời từ chối các câu hỏi không liên quan.

## ✨ Tính năng chính
- **Advanced RAG (Retrieval-Augmented Generation)**: Truy xuất thông tin thông minh từ file kiến thức lớn (`knowledge_base.txt`).
- **Hybrid Search**: Kết hợp Vector Search (FAISS) và Keyword Search (BM25) để tìm kiếm chính xác tuyệt đối.
- **Contextual Query Re-writing**: Tự động tái cấu trúc câu hỏi dựa trên lịch sử hội thoại để hiểu ngữ cảnh.
- **LLM Reranking**: Sử dụng AI để tái xếp hạng các tài liệu tìm được, đảm bảo độ chính xác cao nhất.
- **Streaming Response**: Hiển thị câu trả lời dạng dòng chảy (real-time).
- **Source Citations**: Tự động trích dẫn nguồn thông tin [Nguồn X] và hiển thị nội dung tham khảo minh bạch.
- **Persistence**: Lưu trữ Index xuống đĩa cứng để khởi động tức thì và tiết kiệm chi phí API.

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

### Cập nhật kiến thức cho Chatbot
Thay vì chỉnh sửa code, bạn chỉ cần cập nhật nội dung vào file:
- **[knowledge_base.txt](file:///d:/Documents/AI/assignments/Nhom14-402-Day05/knowledge_base.txt)**

Sau khi bạn thay đổi file này, hệ thống sẽ tự động phát hiện và xây dựng lại cơ sở dữ liệu (Index) trong lần chạy tiếp theo.

### Chạy ứng dụng
1. **Kích hoạt môi trường ảo:**
   - Windows (PowerShell): `.\venv\Scripts\Activate.ps1`
   - Linux/WSL: `source venv/bin/activate`

2. **Khởi chạy Chatbot:**
   ```bash
   python chatbot.py
   ```

## 📂 Cấu trúc thư mục
- `chatbot.py`: Logic xử lý hội thoại, Reranking và hiển thị.
- `rag_utils.py`: Quản lý Indexing, Persistence và Hybrid Search.
- `knowledge_base.txt`: Cơ dữ liệu tri thức của chatbot.
- `evaluate_rag.py`: Script đánh giá chất lượng phản hồi của RAG.
- `data/`: Thư mục lưu trữ bộ chỉ mục (Index) đã được xử lý.
- `requirements.txt`: Danh sách các thư viện hỗ trợ.
- `.env`: Lưu trữ API Key bảo mật.

## ⚖️ Giấy phép
Dự án được phát triển cho mục đích học tập và nghiên cứu AI.
