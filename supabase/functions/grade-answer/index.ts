import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, studentAnswer, correctAnswer, options, gradingCriteria, type } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt: string;

    if (type === "multiple_choice") {
      systemPrompt = `Bạn là giáo viên AI của VinSchool. Học sinh vừa trả lời một câu hỏi trắc nghiệm.

Câu hỏi: ${question}
Các lựa chọn: ${options?.join(", ")}
Đáp án đúng: ${correctAnswer}
Học sinh chọn: ${studentAnswer}

Hãy giải thích ngắn gọn (3-4 câu) bằng tiếng Việt:
- Tại sao đáp án đúng là "${correctAnswer}"
- Nếu học sinh chọn sai, giải thích tại sao lựa chọn "${studentAnswer}" không đúng
- Cung cấp kiến thức bổ sung liên quan

Giữ giọng văn thân thiện, khích lệ học sinh.`;
    } else {
      systemPrompt = `Bạn là giáo viên AI của VinSchool. Học sinh vừa trả lời một câu hỏi tự luận.

Câu hỏi: ${question}
Tiêu chí chấm điểm: ${gradingCriteria}
Câu trả lời của học sinh: ${studentAnswer}

Hãy đánh giá câu trả lời (3-5 câu) bằng tiếng Việt:
- Những điểm học sinh trả lời đúng/tốt
- Những điểm còn thiếu hoặc chưa chính xác
- Gợi ý cách cải thiện câu trả lời
- Cho điểm trên thang 10

Giữ giọng văn thân thiện, khích lệ học sinh. KHÔNG bịa đặt thông tin ngoài phạm vi câu hỏi.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Hãy giải thích cho em." },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content || "Không thể tạo giải thích.";

    return new Response(JSON.stringify({ explanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("grade-answer error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
