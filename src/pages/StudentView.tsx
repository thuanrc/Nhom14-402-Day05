import { useEffect, useState } from "react";
import { getAllAvailableLessons, setCurrentLesson, getLesson } from "@/store/lessonStore";
import { InteractiveVideoPlayer } from "@/components/InteractiveVideoPlayer";
import { HistoryChat } from "@/components/HistoryChat";
import { AppNavBar } from "@/components/AppNavBar";
import { LessonData } from "@/types/lesson";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StudentView() {
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<LessonData | null>(null);

  useEffect(() => {
    const all = getAllAvailableLessons();
    setLessons(all);
    // If there's already a current lesson (from publish), use it
    const current = getLesson();
    if (current) {
      setSelectedLesson(current);
    } else if (all.length > 0) {
      setSelectedLesson(all[0]);
    }
  }, []);

  const handleSelect = (id: string) => {
    const lesson = lessons.find((l) => (l.id || l.title) === id);
    if (lesson) {
      setSelectedLesson(lesson);
      setCurrentLesson(lesson);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavBar />

      <div className="px-4 pt-4 pb-2 max-w-7xl mx-auto w-full">
        <Select
          value={selectedLesson?.id || selectedLesson?.title || ""}
          onValueChange={handleSelect}
        >
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Select a lesson to study..." />
          </SelectTrigger>
          <SelectContent>
            {lessons.map((l) => (
              <SelectItem key={l.id || l.title} value={l.id || l.title || ""}>
                {l.title || "Untitled Lesson"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedLesson ? (
        <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0 max-w-7xl mx-auto w-full">
          <div className="lg:w-[70%] space-y-4">
            <InteractiveVideoPlayer
              key={selectedLesson.id || selectedLesson.title}
              videoUrl={selectedLesson.video_url}
              checkpoints={selectedLesson.checkpoints}
            />
          </div>
          <div className="lg:w-[30%] min-h-[400px] lg:min-h-0">
            <HistoryChat checkpoints={selectedLesson.checkpoints} lessonTitle={selectedLesson.title} />
          </div>
        </main>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          No lessons available. Ask your teacher to publish a lesson.
        </div>
      )}
    </div>
  );
}
