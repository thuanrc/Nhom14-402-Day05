flowchart TD
    A[Học sinh đang xem video và phát sinh thắc mắc] --> B[Học sinh gửi câu hỏi cho chatbot]
    B --> C[AI tiếp nhận câu hỏi]
    C --> D[AI phân tích ngữ cảnh<br/>nội dung video + câu hỏi của học sinh]
    D --> E[AI sinh câu trả lời]
    E --> F[Hiển thị câu trả lời cho học sinh]

    F --> G{Học sinh đã hiểu chưa?}
    G -- Rồi --> H[Tiếp tục học / xem video]
    G -- Chưa --> I[Học sinh hỏi tiếp hoặc yêu cầu giải thích đơn giản hơn]
    I --> C