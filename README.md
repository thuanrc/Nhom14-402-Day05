# Nền tảng Video Học Tập Tương tác Tích hợp AI

> **Hackathon Sản phẩm AI — Track VinUni-VinSchool**

---

## Nhóm 14 — Nhóm mười bốn 402

| MSSV | Họ tên |
|------|--------|
| 2A202600125 | Mai Đức Thuận | 
| 2A202600065 | Hoàng Hiệp | 
| 2A202600016 | Nghĩa | 
| 2A202600318 | Trần Trung Hiếu | 

**File Spec nhóm:** [SPEC-final.md](SPEC-final.md)

---

## Mô tả

Dự án giải quyết vấn đề học sinh thụ động, dễ chán khi xem video Lịch sử. Giải pháp dùng AI để biến video xem thụ động thành trải nghiệm học chủ động:

- **GV tải video lên** → AI tự động phân tích và tạo các câu hỏi tương tác (trắc nghiệm + tự luận) tại các mốc thời gian quan trọng
- **HS xem video** → video tự dừng ở các câu hỏi, HS trả lời và nhận phản hồi/chấm điểm ngay lập tức từ AI
- **Chatbot RAG** → HS có thể hỏi đáp về nội dung bài học bất kỳ lúc nào

---

## Công nghệ

- **Frontend:** React 18 + TypeScript, Vite, React Router, shadcn/ui, Tailwind CSS, Framer Motion
- **Backend:** Supabase (Edge Functions, Database, Auth)
- **AI Edge Functions:** `analyze-video` (phân tích video), `grade-answer` (chấm tự luận), `lesson-chat` (chatbot RAG)
- **Test:** Vitest (unit), Playwright (E2E)

---

## Cài đặt

```bash
# install lib
npm install

# run dev
npm run dev

# Build
npm run build

# Test
npm run test

```

---

## Cấu trúc thư mục

```
src/
├── components/       # UI components (VideoUploader, CheckpointEditor, InteractiveVideoPlayer, HistoryChat...)
├── pages/            # Các trang chính (Index, TeacherStudio, StudentView)
├── store/            # Quản lý state (lessonStore.ts)
├── types/            # TypeScript interfaces
└── integrations/     # Supabase client

supabase/functions/
├── analyze-video/    # AI phân tích video, tạo checkpoint
├── grade-answer/     # AI chấm bài tự luận
└── lesson-chat/      # Chatbot RAG (SSE streaming)
```

---


