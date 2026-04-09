flowchart TD
    A[Giáo viên upload video lịch sử lên hệ thống AI] --> B[AI phân tích nội dung video<br/>trích xuất transcript, mốc thời gian, ý chính]
    B --> C[AI sinh bộ câu hỏi<br/>trắc nghiệm + tự luận]
    C --> D[Giáo viên xem lại câu hỏi]
    D --> E{Câu hỏi đã đạt yêu cầu chưa?}

    E -- Có --> F[Giáo viên xác nhận ghi nhận câu hỏi]
    F --> G[Lưu câu hỏi vào cơ sở dữ liệu]
    G --> H[Kết thúc]

    E -- Chưa --> I[Giáo viên chỉnh sửa thủ công]
    I --> J{Có cần AI sinh lại<br/>hoặc sinh thêm không?}

    J -- Có --> K[Giáo viên gửi yêu cầu sinh lại / sinh thêm]
    K --> B

    J -- Không --> F