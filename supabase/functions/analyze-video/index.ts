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
    const formData = await req.formData();
    const videoFile = formData.get("video") as File | null;
    const durationStr = formData.get("duration") as string | null;
    const title = formData.get("title") as string || "Untitled";

    if (!videoFile) {
      return new Response(JSON.stringify({ error: "No video file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const duration = durationStr ? parseFloat(durationStr) : 200;

    // Convert video to base64 for Gemini multimodal
    const videoBytes = await videoFile.arrayBuffer();
    const base64Video = btoa(
      new Uint8Array(videoBytes).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    const mimeType = videoFile.type || "video/mp4";

    const systemPrompt = `Bạn là AI giáo dục chuyên phân tích video bài giảng. Nhiệm vụ:

1. Xem video và hiểu nội dung bài giảng
2. Tạo 4-6 câu hỏi tương tác (checkpoint) phân bố đều trong video
3. Mỗi checkpoint phải gắn với nội dung thực tế tại thời điểm đó trong video
4. Xen kẽ giữa câu hỏi trắc nghiệm (multiple_choice) và tự luận (essay)

Video dài ${Math.round(duration)} giây. Tên bài: "${title}".

Trả về JSON array với format:
[
  {
    "id": "cp1",
    "timestamp_seconds": <số giây>,
    "type": "multiple_choice" hoặc "essay",
    "question": "<câu hỏi bằng tiếng Việt>",
    "options": ["<option1>", "<option2>", "<option3>"] (chỉ cho multiple_choice),
    "correct_answer": "<đáp án đúng>" (chỉ cho multiple_choice),
    "grading_criteria": "<tiêu chí chấm điểm>" (chỉ cho essay)
  }
]

QUAN TRỌNG:
- Câu hỏi PHẢI dựa trên nội dung thực tế trong video
- timestamp_seconds phải nằm trong khoảng 0 đến ${Math.round(duration)}
- Phân bố đều các checkpoint trong video
- Đáp án trắc nghiệm phải có 3 lựa chọn
- Tiêu chí chấm essay phải cụ thể, rõ ràng
- CHỈ trả về JSON array, không có text khác`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Video}`,
                },
              },
              {
                type: "text",
                text: "Hãy phân tích video này và tạo các câu hỏi tương tác checkpoint.",
              },
            ],
          },
        ],
        stream: false,
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
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: `AI analysis failed: ${t}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", content);
      return new Response(JSON.stringify({ error: "AI did not return valid checkpoints" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const checkpoints = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ checkpoints }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-video error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
