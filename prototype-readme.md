# Prototype — AI-Enhanced Video Learning (Lịch sử)

## Mô tả
Nền tảng học video tương tác cho môn Lịch sử: giáo viên upload video bài giảng,
AI tự động phân tích nội dung, chèn các điểm dừng chứa câu hỏi tương tác,
chấm điểm ngay sau khi học sinh trả lời, giải thích kết quả, và cung cấp chatbot RAG
để học sinh hỏi đáp ngay trong lúc xem.

## Level: Mock prototype
- UI build bằng Nextjs
- 1 flow chính chạy thật với Gemini API:
  **upload/transcript video → AI sinh câu hỏi → học sinh trả lời → nhận chấm điểm + giải thích**
- Chatbot RAG ở mức demo prototype:
  **hỏi câu liên quan đến bài học → AI trả lời trong scope nội dung video**

## Links
- Prototype: prototype
- Video demo (backup): [Movies & TV 2026-04-09 22-36-03.mp4](https://drive.google.com/file/d/1YcEaBU4nvribPW73-EafSFYrhpy96eXk/view?usp=sharing)

## Tools
- UI: HTML/CSS/JS hoặc Claude Artifacts
- AI: Google Gemini 2.0 Flash (via Google AI Studio) / OpenAI API Whisper
- Prompt:
  - system prompt cho **question generation**
  - system prompt cho **answer grading**
  - system prompt cho **RAG chatbot**

## Phân công
| Thành viên | Phần | Output |
|-----------|------|--------|
| Hiệp | Project coordinator + developer | Development plan + web application |
| Nghĩa | Agent developer | Video transcription + Question generator |
| Hiếu | RAG + spec-final.md | AI trả lời trong scope nội dung video |
| Thuận| chatbot + viết spec-final.md | spec-final.md |
