**Nhóm:** 14 \- Nhóm mười bốn 402 **Track:** ☑ VinUni-VinSchool 

Thành viên \- chia việc:

- 2A202600125 - Mai Đức Thuận \- eval metrics \+ threshold  
- 2A202600065 - Hoàng Hiệp \- AI Product Canvas \+ Problem Define  
- 2A202600016 - Nghĩa \- Top 3 failures model \+ ROI 3 kịch bản  
- 2A202600318 \- Trần Trung Hiếu \- User stories \- 4 path

**Problem statement (1 câu):** Học sinh thiếu tương tác, cảm thấy nhàm chán khi học qua video thụ động, đặc biệt là các môn hay như lịch sử; AI tự động phân tích video để đặt câu hỏi tương tác, để học sinh phải trả lời và nhận đánh giá ngay trong khi xem video.

---

## **1\. AI Product Canvas**

|  | Value | Trust | Feasibility |
| ----- | ----- | ----- | ----- |
| **Câu hỏi** | User nào? Pain gì? AI giải gì? | Khi AI sai thì sao? User sửa bằng cách nào? | Cost/latency bao nhiêu? Risk chính? |
| **Trả lời** | *Học sinh chán nản với video thụ động. AI tự động phân tích video, sinh ra các điểm dừng chứa câu hỏi tương tác và chấm điểm câu trả lời ngay lập tức để giữ sự tập trung.* | *AI sinh câu hỏi lạc đề hoặc chấm sai câu trả lời tự luận \-\> Có người kiểm duyệt trước các câu hỏi trước khi cho học sinh xem.* | *\~$0.05/phút video để phân tích (offline) và \~$0.005/tương tác chấm điểm. Latency chấm \<1s. Risk: AI tạo câu hỏi lan man, không bám sát trọng tâm môn học (ví dụ lịch sử)* |

**Automation hay augmentation?** ☐ Automation · ☑ Augmentation 

Justify: Augmentation. Hệ thống tự động hóa khâu tạo câu hỏi thô từ video, nhưng vai trò chính là tăng cường (augment) trải nghiệm học tập của học sinh và giúp giáo viên tiết kiệm thời gian soạn bài giảng tương tác.

**Learning signal:**

1. User correction đi vào đâu? Ghi nhận vào Dashboard quản lý của giáo viên để giáo viên duyệt lại câu hỏi/đáp án.  
2. Product thu signal gì để biết tốt lên hay tệ đi? Tỷ lệ học sinh trả lời đúng câu hỏi do AI tạo ra, tỷ lệ bấm "Báo cáo lỗi", và tỷ lệ xem hết video (Completion Rate).  
3. Data thuộc loại nào? ☐ User-specific · ☑ Domain-specific · ☐ Real-time · ☑ Human-judgment · ☐ Khác: \_\_\_   
4. Có marginal value không? (Model đã biết cái này chưa?) Có. Các mô hình LLM chung thường thiếu khả năng phân tích chính xác trọng tâm sư phạm của video Lịch sử Việt Nam. Dữ liệu từ phản hồi của học sinh và chỉnh sửa của giáo viên sẽ giúp model sinh câu hỏi sát với chương trình học hơn.

---

## **2\. User Stories \- 4 paths**

### ***Hỏi đáp Lịch sử thời gian thực, giáo viên sẽ là người kiểm duyệt các nội dung do AI tạo ra trước khi cho học sinh xem.***

| Path | Câu hỏi thiết kế | Mô tả |
| ----- | ----- | ----- |
| AI đúng | User thấy gì ? | Nếu cặp câu hỏi \- đáp án phù hợp, giáo viên không làm gì thêm. |
| AI không chắc | Hệ thống làm gì ? | Nếu cặp câu hỏi \- đáp án nào AI không tự tin, cảnh báo để giáo viên thấy và sửa / xóa. |
| AI sai | User sửa thế nào ? | Nếu nội dung câu hỏi / thời điểm hỏi không phù hợp, giáo viên sẽ sửa / xóa. AI sẽ ghi nhận và học từ correction này. |
| User mất niềm tin | Gỡ thế nào ? | Sau nhiều lần AI tạo câu hỏi sai, giáo viên muốn tự tạo câu hỏi \- đáp án mà không cần nhờ đến AI. Có chức năng tắt auto Q\&A, thêm Q\&A thủ công. |

---

## **3\. Eval metrics \+ threshold**

**Optimize precision hay recall?** ☑ Precision · ☐ Recall Tại sao? *Lịch sử yêu cầu sự chính xác tuyệt đối. Việc bảo vệ học sinh khỏi kiến thức sai (bịa sử) quan trọng hơn việc AI có thể trả lời mọi câu hỏi.* *Nếu AI có Recall cao nhưng Precision thấp, nó sẽ cung cấp thông tin sai lệch lịch sử (bịa sự kiện, sai ngày tháng), gây hậu quả nghiêm trọng về mặt giáo dục.*

| Metric | Threshold | 
| ----- | ----- | 
| *Factuality Rate (Độ chính xác lịch sử của Chatbot)* |  *98%* |  
| *Interaction Rate (Tỉ lệ câu hỏi được học sinh trả lời)* |  *70%* |  
| *Task Completion Rate (Tỷ lệ xem hết video)* | *75%* |  

Xuất sang Trang tính  
---

## **4\. Top 3 failure modes**

| \# | Trigger | Hậu quả | Mitigation |
| ----- | ----- | ----- | ----- |
| 1 | *Học sinh hỏi ngoài lề vấn đề Video.* | *Chatbot bịa kiến thức, hallucination hoặc nói về những vấn đề ngoài lề bài giảng.* | *Đảm bảo LLM tập trung vào vấn đề chính, Guardrails để từ chối trả lời các câu hỏi ngoài lề.* |
| 2 | *Chatbot nói sai kiến thức dẫn tới học sinh hiểu sai bản chất* | *Học sinh nắm sai kiến thức trong khi tưởng mình hiểu.* | *Giới hạn Chatbot gen kiến thức được nhắc tới trong Video, không nói ngoài lề* |
| 3 | *Hệ thống đứt mạng hoặc Latency của RAG LLM quá cao (\>5s).* | *Trẻ mất kiên nhẫn, thoát khỏi bài học làm tụt Completion Rate.* | *Cache các câu hỏi phổ biến. UI hiển thị "AI đang lật sách Lịch sử..." để điều hướng tâm lý.* |

---

## **5\. ROI 3 kịch bản**

|  | Conservative | Realistic | Optimistic |
| ----- | ----- | ----- | ----- |
| **Assumption** | *Áp dụng 1 khối lớp, 100 HS dùng, 60% thích* | *Áp dụng khối THCS, 500 HS dùng, 80% thích* | *Áp dụng toàn trường, 2000 HS, 90% thích* |
| **Cost** | *$10/ngày (API Inference \+ DB)* | *$30/ngày* | *$100/ngày* |
| **Benefit** | *Học sinh hiểu sâu bài hơn 15%* | *Giảm 50% thời gian GV soạn bài tập tương tác* | *Trở thành USP tuyển sinh, tạo thư viện số độc quyền* |
| **Net** | *Đạt mục tiêu sư phạm cơ bản* | *Tối ưu hóa nguồn lực rõ rệt cho nhà trường* | *Sinh lời gián tiếp qua thương hiệu và retention* |

