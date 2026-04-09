import { useRef, useState, useEffect, useCallback } from "react";
import { Checkpoint } from "@/types/lesson";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Play, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Props {
  videoUrl: string;
  checkpoints: Checkpoint[];
}

export function InteractiveVideoPlayer({ videoUrl, checkpoints }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [essayText, setEssayText] = useState("");
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [checking, setChecking] = useState(false);
  const maxAllowedTime = useRef(0);

  const sortedCheckpoints = [...checkpoints].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);

  const fetchAIExplanation = async (cp: Checkpoint, studentAnswer: string) => {
    setLoadingExplanation(true);
    setAiExplanation(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/grade-answer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            question: cp.question,
            studentAnswer,
            correctAnswer: cp.correct_answer,
            options: cp.options,
            gradingCriteria: cp.grading_criteria,
            type: cp.type,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const data = await response.json();
      setAiExplanation(data.explanation);
    } catch (e: any) {
      console.error("AI explanation error:", e);
      toast.error("Không thể lấy giải thích từ AI");
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || activeCheckpoint) return;

    const nextUnanswered = sortedCheckpoints.find((cp) => !answeredIds.has(cp.id));
    if (nextUnanswered && video.currentTime > nextUnanswered.timestamp_seconds) {
      video.currentTime = nextUnanswered.timestamp_seconds;
    }

    if (video.currentTime > maxAllowedTime.current) {
      maxAllowedTime.current = video.currentTime;
    }

    for (const cp of sortedCheckpoints) {
      if (answeredIds.has(cp.id)) continue;
      if (Math.abs(video.currentTime - cp.timestamp_seconds) < 0.5) {
        video.pause();
        setActiveCheckpoint(cp);
        setFeedback(null);
        setAiExplanation(null);
        setSelectedOption(null);
        setEssayText("");
        break;
      }
    }
  }, [activeCheckpoint, answeredIds, sortedCheckpoints]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [handleTimeUpdate]);

  const handleSeeking = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextUnanswered = sortedCheckpoints.find((cp) => !answeredIds.has(cp.id));
    if (nextUnanswered && video.currentTime > nextUnanswered.timestamp_seconds) {
      video.currentTime = nextUnanswered.timestamp_seconds;
    }
  };

  const submitMC = () => {
    if (!activeCheckpoint || !selectedOption) return;
    const correct = selectedOption === activeCheckpoint.correct_answer;
    setFeedback({
      correct,
      message: correct ? "Chính xác! 🎉" : `Chưa đúng. Đáp án đúng: ${activeCheckpoint.correct_answer}`,
    });
    fetchAIExplanation(activeCheckpoint, selectedOption);
  };

  const submitEssay = () => {
    if (!activeCheckpoint || !essayText.trim()) return;
    setChecking(true);
    // Just show a quick initial feedback, then let AI handle the real grading
    setFeedback({
      correct: true,
      message: "Đã nhận câu trả lời! AI đang phân tích...",
    });
    setChecking(false);
    fetchAIExplanation(activeCheckpoint, essayText);
  };

  const continueVideo = () => {
    if (activeCheckpoint) {
      setAnsweredIds((prev) => new Set(prev).add(activeCheckpoint.id));
    }
    setActiveCheckpoint(null);
    setFeedback(null);
    setAiExplanation(null);
    videoRef.current?.play();
  };

  return (
    <div className="space-y-3">
      <div className="relative rounded-lg overflow-hidden bg-foreground/5 aspect-video">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            controls
            onSeeking={handleSeeking}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            <div className="text-center">
              <Play className="h-12 w-12 mx-auto mb-2 text-secondary" />
              <p>No video uploaded. Using demo mode.</p>
              <Button
                className="mt-3 gradient-navy text-gold"
                size="sm"
                onClick={() => {
                  const firstUnanswered = sortedCheckpoints.find((cp) => !answeredIds.has(cp.id));
                  if (firstUnanswered) {
                    setActiveCheckpoint(firstUnanswered);
                    setFeedback(null);
                    setAiExplanation(null);
                    setSelectedOption(null);
                    setEssayText("");
                  }
                }}
              >
                Simulate Next Checkpoint
              </Button>
            </div>
          </div>
        )}

        <AnimatePresence>
          {activeCheckpoint && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="absolute inset-0 z-10 flex items-end justify-center p-3 sm:p-5"
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

              <div className="relative w-full max-w-xl rounded-xl bg-card/95 backdrop-blur border border-border shadow-2xl p-4 sm:p-5 space-y-3 max-h-[85%] overflow-y-auto">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
                  <p className="font-medium text-foreground text-sm sm:text-base">{activeCheckpoint.question}</p>
                </div>

                {activeCheckpoint.type === "multiple_choice" && (
                  <div className="space-y-2">
                    {activeCheckpoint.options?.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => !feedback && setSelectedOption(opt)}
                        className={`w-full text-left px-3 py-2.5 rounded-md border transition-colors text-sm ${
                          selectedOption === opt
                            ? "border-secondary bg-secondary/10 text-foreground"
                            : "border-border hover:border-secondary/40 text-foreground"
                        } ${feedback ? "pointer-events-none" : ""}`}
                      >
                        {opt}
                      </button>
                    ))}
                    {!feedback && (
                      <Button onClick={submitMC} disabled={!selectedOption} className="gradient-navy text-gold w-full" size="sm">
                        Gửi câu trả lời
                      </Button>
                    )}
                  </div>
                )}

                {activeCheckpoint.type === "essay" && !feedback && (
                  <div className="space-y-2">
                    <Textarea
                      value={essayText}
                      onChange={(e) => setEssayText(e.target.value)}
                      placeholder="Viết câu trả lời của bạn..."
                      rows={2}
                      className="text-sm"
                    />
                    {checking ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="h-3.5 w-3.5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                        AI đang chấm điểm...
                      </div>
                    ) : (
                      <Button onClick={submitEssay} disabled={!essayText.trim()} className="gradient-navy text-gold w-full" size="sm">
                        Gửi câu trả lời
                      </Button>
                    )}
                  </div>
                )}

                {feedback && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                    <div
                      className={`flex items-start gap-2 p-2.5 rounded-md text-sm ${
                        feedback.correct ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <p className="text-xs sm:text-sm">{feedback.message}</p>
                    </div>

                    {/* AI Explanation */}
                    {loadingExplanation && (
                      <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 text-xs text-muted-foreground">
                        <Sparkles className="h-4 w-4 animate-pulse text-secondary" />
                        AI đang tạo giải thích chi tiết...
                      </div>
                    )}
                    {aiExplanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="p-3 rounded-md bg-muted/50 border border-border space-y-1"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-medium text-secondary">
                          <Sparkles className="h-3.5 w-3.5" />
                          Giải thích từ AI
                        </div>
                        <p className="text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {aiExplanation}
                        </p>
                      </motion.div>
                    )}

                    <Button onClick={continueVideo} className="gradient-navy text-gold w-full" size="sm">
                      <Play className="h-3.5 w-3.5 mr-1" /> Tiếp tục xem
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-1.5">
        {sortedCheckpoints.map((cp) => (
          <div
            key={cp.id}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              answeredIds.has(cp.id) ? "bg-success" : activeCheckpoint?.id === cp.id ? "bg-secondary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
