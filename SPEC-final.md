# SPEC — AI Product Hackathon

**Nhóm:** 14 — Nhóm mười bốn 402
**Track:** ☐ VinFast · ☐ Vinmec · ☑ VinUni-VinSchool · ☐ XanhSM · ☐ Open
**Problem statement (1 câu):** *Học sinh cảm thấy nhàm chán, thiếu tương tác khi học qua video thụ động (đặc biệt là môn Lịch sử); AI tự động phân tích video, chèn các điểm dừng chứa câu hỏi tương tác và chấm điểm, đưa ra giải thích câu trả lời ngay lập tức, đồng thời cung cấp chatbot RAG để học sinh giải đáp thắc mắc trong lúc xem.*

---

## 1. AI Product Canvas

|   | Value | Trust | Feasibility |
|---|-------|-------|-------------|
| **Câu hỏi** | User nào? Pain gì? AI giải gì? | Khi AI sai thì sao? User sửa bằng cách nào? | Cost/latency bao nhiêu? Risk chính? |
| **Trả lời** | *Học sinh THCS/THPT chán nản với video học thụ động. AI phân tích video Lịch sử, sinh câu hỏi tự luận & TNQ tại các mốc thời gian, chấm điểm real-time, và cung cấp chatbot RAG để hỏi đáp ngay trong bài học.* | *AI sinh câu hỏi lạc đề hoặc chấm sai câu trả lời tự luận → Giáo viên review, chỉnh sửa/xóa câu hỏi trước khi học sinh xem. Chatbot bị hallucination → Guardrails giới hạn trong ngữ cảnh video.* | *~$0.05/phút video phân tích (offline), ~$0.005/tương tác chấm điểm. Latency chấm <1s. Risk: AI tạo câu hỏi lan man, không bám sát trọng tâm môn Lịch sử.* |

**Automation hay augmentation?** ☐ Automation · ☑ Augmentation
Justify: *Augmentation — AI tự động sinh câu hỏi và chấm điểm, nhưng giáo viên kiểm duyệt trước nội dung. Học sinh nhận phản hồi tức thì nhưng vẫn có cơ chế báo cáo và giáo viên có thể can thiệp.*

**Learning signal:**

1. User correction đi vào đâu? *Ghi nhận vào Dashboard quản lý của giáo viên — giáo viên duyệt, sửa/xóa câu hỏi và đáp án. Correction log dùng để fine-tune model sinh câu hỏi.*
2. Product thu signal gì để biết tốt lên hay tệ đi? *Tỷ lệ học sinh trả lời đúng câu hỏi do AI tạo, tỷ lệ bấm "Báo cáo lỗi", tỷ lệ xem hết video (Completion Rate), và số lần giáo viên phải sửa câu hỏi.*
3. Data thuộc loại nào? ☐ User-specific · ☑ Domain-specific · ☐ Real-time · ☑ Human-judgment · ☐ Khác: ___
   Có marginal value không? (Model đã biết cái này chưa?) *Có — LLM umum thiếu khả năng phân tích chính xác trọng tâm sư phạm của video Lịch sử Việt Nam. Dữ liệu phản hồi học sinh và chỉnh sửa của giáo viên giúp model sinh câu hỏi sát chương trình học hơn.*

---

## 2. User Stories — 4 paths

Mỗi feature chính = 1 bảng. AI trả lời xong → chuyện gì xảy ra?

### Feature 1: Giáo viên upload video → AI sinh câu hỏi → Giáo viên review

**Trigger:** *Giáo viên upload video Lịch sử → AI phân tích và tự động sinh các mốc câu hỏi (tự luận + trắc nghiệm) → Giáo viên review trên Dashboard.*

| Path | Câu hỏi thiết kế | Mô tả |
|------|-------------------|-------|
| Happy — AI đúng, tự tin | User thấy gì? Flow kết thúc ra sao? | *AI sinh cặp câu hỏi – đáp án phù hợp trọng tâm bài giảng. Giáo viên không cần chỉnh sửa, nhấn "Lưu" và publish cho học sinh.* |
| Low-confidence — AI không chắc | System báo "không chắc" bằng cách nào? User quyết thế nào? | *AI đánh dấu câu hỏi có confidence thấp (ví dụ <70%) bằng cảnh báo màu cam. Giáo viên xem lại, chỉnh sửa nội dung hoặc xóa.* |
| Failure — AI sai | User biết AI sai bằng cách nào? Recover ra sao? | *Câu hỏi lạc đề, sai kiến thức hoặc thời điểm hỏi không phù hợp. Giáo viên sửa/xóa trực tiếp trên Dashboard. AI ghi nhận correction để cải thiện lần sau.* |
| Correction — user sửa | User sửa bằng cách nào? Data đó đi vào đâu? | *Giáo viên chỉnh sửa hoặc tạo câu hỏi thủ công thay thế. Correction log lưu vào DB, dùng làm training data để fine-tune model sinh câu hỏi.* |

### Feature 2: Học sinh xem video → AI chèn câu hỏi → Chấm điểm, giải thích real-time

**Trigger:** *Học sinh mở video → Tới mốc thời gian → Video tạm dừng, hiện câu hỏi → Học sinh trả lời → AI chấm điểm ngay lập tức.*

| Path | Câu hỏi thiết kế | Mô tả |
|------|-------------------|-------|
| Happy — AI đúng, tự tin | User thấy gì? Flow kết thúc ra sao? | *Học sinh trả lời đúng → AI chấm điểm, hiển thị giải thích ngắn, video tiếp tục phát. Học sinh thấy tiến trình và điểm số tăng.* |
| Low-confidence — AI không chắc | System báo "không chắc" bằng cách nào? User quyết thế nào? | *AI không tự tin khi chấm câu trả lời tự luận → Hiển thị "Câu trả lời của em đang được xử lý" → Gửi về giáo viên đánh giá sau, học sinh vẫn xem tiếp.* |
| Failure — AI sai | User biết AI sai bằng cách nào? Recover ra sao? | *AI chấm sai hoặc đưa giải thích không chính xác → Học sinh bấm "Báo cáo lỗi" → Giáo viên xem lại và điều chỉnh đáp án trên Dashboard.* |
| Correction — user sửa | User sửa bằng cách nào? Data đó đi vào đâu? | *Giáo viên xem lại báo cáo, điều chỉnh đáp án/chấm điểm. Correction log lưu vào DB để cải thiện model chấm điểm.* |

### Feature 3: Chatbot RAG hỏi đáp Lịch sử trong lúc xem video

**Trigger:** *Học sinh thắc mắc trong lúc xem video → Mở chatbot → Hỏi câu hỏi liên quan → AI RAG tra cứu từ dữ liệu video và trả lời.*

| Path | Câu hỏi thiết kế | Mô tả |
|------|-------------------|-------|
| Happy — AI đúng, tự tin | User thấy gì? Flow kết thúc ra sao? | *Chatbot trả lời chính xác dựa trên nội dung video và kiến thức Lịch sử. Học sinh hiểu bài sâu hơn, tiếp tục xem video.* |
| Low-confidence — AI không chắc | System báo "không chắc" bằng cách nào? User quyết thế nào? | *AI không tìm thấy thông tin liên quan trong video → Trả lời: "Câu hỏi này hơi ngoài phạm vi bài học, em thử hỏi giáo viên nhé!"* |
| Failure — AI sai | User biết AI sai bằng cách nào? Recover ra sao? | *Chatbot hallucination, trả lời sai kiến thức Lịch sử → Học sinh bấm "Báo cáo sai" → Báo cáo gửi về giáo viên/admin để review.* |
| Correction — user sửa | User sửa bằng cách nào? Data đó đi vào đâu? | *Giáo viên/admin xem báo cáo, thêm fact-check hoặc chặn câu hỏi tương tự. Correction log dùng để cải thiện RAG pipeline.* |

---

## 3. Eval metrics + threshold

**Optimize precision hay recall?** ☑ Precision · ☐ Recall
Tại sao? *Lịch sử yêu cầu sự chính xác tuyệt đối. Bảo vệ học sinh khỏi kiến thức sai (bịa sự kiện, sai ngày tháng) quan trọng hơn việc AI trả lời được mọi câu hỏi. Precision thấp → học sinh tiếp thu thông tin sai lệch → hậu quả nghiêm trọng về giáo dục.*
Nếu sai ngược lại thì chuyện gì xảy ra? *Nếu chọn precision nhưng low recall → AI từ chối trả lời nhiều câu hỏi hợp lệ → học sinh thất vọng, giảm Engagement Rate và Completion Rate.*

| Metric | Threshold | Red flag (dừng khi) |
|--------|-----------|---------------------|
| *Factuality Rate (Độ chính xác lịch sử của Chatbot & câu hỏi)* | *≥98%* | *<95% trong 1 tuần* |
| *Interaction Rate (Tỉ lệ học sinh trả lời câu hỏi khi video dừng)* | *≥70%* | *<50% trong 2 tuần* |
| *Task Completion Rate (Tỷ lệ học sinh xem hết video)* | *≥75%* | *<60% trong 2 tuần* |
| *Teacher Correction Rate (Tỉ lệ câu hỏi giáo viên phải sửa)* | *<15%* | *>30% trong 1 tuần* |

---

## 4. Top 3 failure modes

*Liệt kê cách product có thể fail — không phải list features.*

| # | Trigger | Hậu quả | Mitigation |
|---|---------|---------|------------|
| 1 | *Học sinh hỏi câu ngoài lề nội dung video* | *Chatbot hallucination, bịa kiến thức hoặc trả lời sai sự thật lịch sử* | *Guardrails: giới hạn scope trả lời trong ngữ cảnh video + kiến thức Lịch sử đã được kiểm duyệt. Detect out-of-scope → từ chối khéo và gợi ý hỏi giáo viên.* |
| 2 | *AI chấm sai câu trả lời tự luận, học sinh hiểu sai bản chất* | *Học sinh nắm sai kiến thức nhưng tưởng mình đúng, ảnh hưởng lâu dài đến kết quả học tập* | *Giới hạn AI chỉ chấm dựa trên đáp án mẫu do giáo viên duyệt. Câu trả lời self-learning có confidence thấp → gửi giáo viên đánh giá sau. Hiển thị disclaimer "Đang chấm tự động, kết quả có thể cần xác nhận".* |
| 3 | *Hệ thống đứt mạng hoặc Latency RAG/LLM quá cao (>5s)* | *Học sinh mất kiên nhẫn, thoát bài học → tụt Completion Rate* | *Cache các câu hỏi phổ biến. UI hiển thị loading thân thiện ("AI đang lật sách Lịch sử..."). Fallback sang đáp án TNQ nếu tự luận timeout.* |

---

## 5. ROI 3 kịch bản

|   | Conservative | Realistic | Optimistic |
|---|-------------|-----------|------------|
| **Assumption** | *Áp dụng 1 khối lớp, 100 HS dùng, 60% thích* | *Áp dụng khối THCS, 500 HS dùng, 80% thích* | *Áp dụng toàn trường, 2000 HS, 90% thích* |
| **Cost** | *$10/ngày (API Inference + DB)* | *$30/ngày* | *$100/ngày* |
| **Benefit** | *Học sinh hiểu sâu bài hơn 15%* | *Giảm 50% thời gian GV soạn bài tập tương tác* | *Trở thành USP tuyển sinh, tạo thư viện số độc quyền* |
| **Net** | *Đạt mục tiêu sư phạm cơ bản* | *Tối ưu hóa nguồn lực rõ rệt cho nhà trường* | *Sinh lời gián tiếp qua thương hiệu và retention* |

**Kill criteria:** *Completion Rate <60% sau 1 tháng triển khai thử nghiệm, hoặc Teacher Correction Rate >30% (tức AI sinh quá nhiều câu hỏi sai, giáo viên mất nhiều thời gian sửa hơn là tự soạn).*

---

## 6. Mini AI spec (1 trang)

**Product:** AI-Enhanced Video Learning — biến video học thụ động thành trải nghiệm tương tác 2 chiều cho môn Lịch sử.

**Cho ai:** 
- *Giáo viên:* Upload video, review câu hỏi AI sinh, publish bài học, theo dõi tiến trình học sinh trên Dashboard.
- *Học sinh:* Xem video, trả lời câu hỏi tại các mốc dừng, nhận chấm điểm & giải thích real-time, hỏi đáp với chatbot RAG ngay trong bài học.

**AI làm gì (Augmentation):**
1. *Phân tích video tự động:* Trích xuất nội dung, xác định các mốc thời gian quan trọng, sinh câu hỏi tự luận & trắc nghiệm.
2. *Chấm điểm real-time:* Đánh giá câu trả lời học sinh, đưa giải thích ngắn, tiếp tục phát video.
3. *Chatbot RAG:* Trả lời thắc mắc của học sinh dựa trên nội dung video + cơ sở kiến thức Lịch sử đã kiểm duyệt.

**Quality:** Optimize **Precision** (Factuality Rate ≥98%). Lịch sử không cho phép sai lệch về sự kiện, ngày tháng. Interaction Rate ≥70%, Completion Rate ≥75%.

**Risk chính:** 
- AI hallucination → sinh câu hỏi sai kiến thức hoặc chatbot trả lời ngoài scope.
- AI chấm sai câu trả lời tự luận → học sinh hiểu sai.
- Latency cao → học sinh mất kiên nhẫn.

**Data flywheel:** Giáo viên sửa/xóa câu hỏi AI sinh + học sinh báo cáo lỗi → correction log lưu vào DB → fine-tune model sinh câu hỏi & chấm điểm → model ngày càng sát chương trình học và chính xác hơn. Completion Rate và Interaction Rate tăng theo thời gian sử dụng.

