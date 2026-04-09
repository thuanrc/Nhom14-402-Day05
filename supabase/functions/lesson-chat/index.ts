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
    const { messages, lessonContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Bạn là trợ lý AI học tập của VinSchool. Nhiệm vụ DUY NHẤT của bạn là giúp học sinh hiểu nội dung bài giảng video đang xem.

Ngữ cảnh bài học:
${lessonContext}

QUY TẮC NGHIÊM NGẶT:
1. CHỈ trả lời dựa trên nội dung bài học được cung cấp ở trên. KHÔNG BỊA ĐẶT bất kỳ thông tin nào.
2. Nếu câu hỏi NGOÀI phạm vi nội dung bài học, trả lời: "Câu hỏi này nằm ngoài phạm vi bài học hiện tại. Mình chỉ có thể giải thích nội dung trong video thôi nhé! 📚"
3. KHÔNG trả lời các câu hỏi không liên quan đến bài học (toán, khoa học, chuyện cá nhân, v.v.)
4. Nếu không chắc chắn thông tin có trong bài học hay không, hãy từ chối và hướng học sinh xem lại video.
5. Trả lời bằng tiếng Việt, ngắn gọn (tối đa 3-4 câu), dễ hiểu.
6. Sử dụng ví dụ minh hoạ CHỈ từ nội dung bài học.
7. Khuyến khích học sinh suy nghĩ và đặt thêm câu hỏi về bài học.`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("lesson-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
