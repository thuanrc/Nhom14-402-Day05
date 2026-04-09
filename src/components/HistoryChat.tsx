import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Checkpoint } from "@/types/lesson";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  checkpoints: Checkpoint[];
  lessonTitle?: string;
}

function buildLessonContext(checkpoints: Checkpoint[], title?: string): string {
  let ctx = title ? `Bài học: ${title}\n\n` : "";
  ctx += "Các câu hỏi tương tác trong bài:\n";
  checkpoints.forEach((cp, i) => {
    ctx += `${i + 1}. [${cp.type === "multiple_choice" ? "Trắc nghiệm" : "Tự luận"}] ${cp.question}\n`;
    if (cp.options) ctx += `   Đáp án: ${cp.options.join(", ")}\n`;
    if (cp.correct_answer) ctx += `   Đáp án đúng: ${cp.correct_answer}\n`;
    if (cp.grading_criteria) ctx += `   Tiêu chí: ${cp.grading_criteria}\n`;
  });
  return ctx;
}

export function HistoryChat({ checkpoints, lessonTitle }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Xin chào! 👋 Mình là trợ lý AI của VinSchool. Mình sẽ giúp bạn hiểu sâu hơn nội dung bài giảng đang xem. Hãy hỏi bất cứ điều gì về bài học — mình sẽ giải thích dựa trên nội dung video! 🎓",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  const send = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    // Add empty assistant message for streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const chatMessages = updatedMessages
        .filter((m) => m.content)
        .map((m) => ({ role: m.role, content: m.content }));

      const lessonContext = buildLessonContext(checkpoints, lessonTitle);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lesson-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: chatMessages, lessonContext }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Error ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantText += content;
              setMessages((prev) =>
                prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantText } : m
                )
              );
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      console.error("Chat error:", e);
      toast.error(e.message || "Không thể kết nối AI");
      // Remove empty assistant message on error
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.content) return prev.slice(0, -1);
        return prev;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-lg overflow-hidden bg-card">
      <div className="gradient-navy px-4 py-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-gold" />
        <span className="text-sm font-semibold text-gold">AI Lesson Assistant</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}
          >
            {m.role === "assistant" && (
              <div className="h-7 w-7 rounded-full gradient-navy flex items-center justify-center shrink-0">
                <Bot className="h-3.5 w-3.5 text-gold" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "gradient-navy text-gold"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.content || (
                <span className="animate-pulse text-muted-foreground">Đang suy nghĩ...</span>
              )}
            </div>
            {m.role === "user" && (
              <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <User className="h-3.5 w-3.5 text-secondary-foreground" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="p-3 border-t border-border flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Hỏi về bài học..."
          className="text-sm"
          disabled={isStreaming}
        />
        <Button
          onClick={send}
          size="icon"
          className="gradient-navy text-gold shrink-0"
          disabled={isStreaming || !input.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
