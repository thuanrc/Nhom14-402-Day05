import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { VideoUploader } from "@/components/VideoUploader";
import { CheckpointEditor } from "@/components/CheckpointEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmLesson, getSampleLesson, getConfirmedLessons, removeLesson } from "@/store/lessonStore";
import { toast } from "sonner";
import { Checkpoint, LessonData } from "@/types/lesson";
import { CheckCircle, BookOpen, Trash2, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { AppNavBar } from "@/components/AppNavBar";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TeacherStudio() {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [checkpoints, setCheckpoints] = useState<Checkpoint[] | null>(null);
  const [confirmed, setConfirmed] = useState<LessonData[]>(getConfirmedLessons());
  const [editingLesson, setEditingLesson] = useState<LessonData | null>(null);

  const handleAnalyze = async (file: File) => {
    setVideoFile(file);
    setLessonTitle(file.name.replace(/\.[^.]+$/, ""));
    setIsAnalyzing(true);

    try {
      // Get video duration
      const duration = await new Promise<number>((resolve) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          resolve(video.duration);
          URL.revokeObjectURL(video.src);
        };
        video.onerror = () => resolve(200);
        video.src = URL.createObjectURL(file);
      });

      const formData = new FormData();
      formData.append("video", file);
      formData.append("duration", String(duration));
      formData.append("title", file.name.replace(/\.[^.]+$/, ""));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-video`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Error ${response.status}`);
      }

      const data = await response.json();
      setCheckpoints(data.checkpoints);
      toast.success("AI đã phân tích video thành công!");
    } catch (e: any) {
      console.error("Analyze error:", e);
      toast.error(e.message || "Không thể phân tích video. Đang dùng câu hỏi mẫu.");
      const sample = getSampleLesson();
      setCheckpoints(sample.checkpoints);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmAndPublish = () => {
    if (!checkpoints) return;
    const videoUrl = editingLesson?.video_url || (videoFile ? URL.createObjectURL(videoFile) : "");
    const lesson: LessonData = {
      id: editingLesson?.id || `lesson-${Date.now()}`,
      title: lessonTitle || videoFile?.name || "Bài học mới",
      video_url: videoUrl,
      video_file: editingLesson?.video_file || videoFile || undefined,
      checkpoints,
    };
    confirmLesson(lesson);
    setConfirmed(getConfirmedLessons());
    resetForm();
    navigate("/student");
  };

  const resetForm = () => {
    setCheckpoints(null);
    setVideoFile(null);
    setLessonTitle("");
    setEditingLesson(null);
  };

  const handleEdit = (lesson: LessonData) => {
    setEditingLesson(lesson);
    setLessonTitle(lesson.title || "");
    setCheckpoints([...lesson.checkpoints]);
    setVideoFile(null);
  };

  const handleDelete = (id: string) => {
    removeLesson(id);
    setConfirmed(getConfirmedLessons());
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavBar />

      <main className="max-w-3xl mx-auto p-6 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-bold text-foreground mb-1">Lesson Builder</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Upload video và AI sẽ tạo câu hỏi tương tác. Chỉnh sửa rồi xác nhận để học sinh có thể sử dụng.
          </p>
          {!editingLesson && (
            <VideoUploader onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
          )}
        </motion.div>

        {checkpoints && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {editingLesson && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Pencil className="h-4 w-4" />
                Đang chỉnh sửa: <span className="font-medium text-foreground">{editingLesson.title}</span>
                <Button variant="ghost" size="sm" onClick={resetForm} className="ml-auto text-xs">
                  Huỷ
                </Button>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Tên bài học</Label>
              <Input
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="Nhập tên bài học..."
              />
            </div>

            <CheckpointEditor checkpoints={checkpoints} onChange={setCheckpoints} />

            <Button
              onClick={handleConfirmAndPublish}
              size="lg"
              className="w-full gradient-navy text-gold hover:opacity-90 transition-opacity"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {editingLesson ? "Cập nhật & Xuất bản" : "Xác nhận & Xuất bản cho học sinh"}
            </Button>
          </motion.div>
        )}

        {confirmed.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-secondary" />
              Bài học đã xác nhận ({confirmed.length})
            </h3>
            {confirmed.map((l) => (
              <Card key={l.id} className="p-4 flex items-center justify-between border-border">
                <div>
                  <p className="font-medium text-foreground text-sm">{l.title}</p>
                  <p className="text-xs text-muted-foreground">{l.checkpoints.length} checkpoints</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(l)}>
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xoá bài học?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bài học "{l.title}" sẽ bị xoá và học sinh không thể truy cập nữa.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Huỷ</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(l.id!)} className="bg-destructive text-destructive-foreground">
                          Xoá
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <div className="flex items-center gap-1 text-success text-xs ml-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
