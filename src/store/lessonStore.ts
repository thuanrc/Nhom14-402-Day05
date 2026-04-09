import { LessonData } from "@/types/lesson";

// Sample checkpoints for a 3:20 (200s) video about Vietnamese history
const SAMPLE_CHECKPOINTS_200S = [
  {
    id: "cp1",
    timestamp_seconds: 30,
    type: "multiple_choice" as const,
    question: "Trận Bạch Đằng năm 938 do ai chỉ huy?",
    options: ["Lý Thường Kiệt", "Ngô Quyền", "Trần Hưng Đạo"],
    correct_answer: "Ngô Quyền",
  },
  {
    id: "cp2",
    timestamp_seconds: 70,
    type: "essay" as const,
    question: "Mô tả chiến thuật cọc gỗ trên sông Bạch Đằng và vai trò của thủy triều trong trận đánh.",
    grading_criteria:
      "Học sinh cần đề cập đến việc Ngô Quyền cho đóng cọc gỗ bịt sắt nhọn dưới lòng sông, lợi dụng thủy triều rút để cọc lộ ra đâm thủng thuyền địch quân Nam Hán.",
  },
  {
    id: "cp3",
    timestamp_seconds: 120,
    type: "multiple_choice" as const,
    question: "Quân xâm lược nào bị đánh bại trong trận Bạch Đằng năm 938?",
    options: ["Quân Mông Cổ", "Quân Nam Hán", "Quân nhà Tống"],
    correct_answer: "Quân Nam Hán",
  },
  {
    id: "cp4",
    timestamp_seconds: 160,
    type: "essay" as const,
    question: "Chiến thắng Bạch Đằng năm 938 có ý nghĩa lịch sử gì đối với dân tộc Việt Nam?",
    grading_criteria:
      "Học sinh cần nêu được rằng chiến thắng này chấm dứt hơn 1000 năm Bắc thuộc, mở ra thời kỳ độc lập tự chủ lâu dài cho dân tộc Việt Nam.",
  },
];

// Pending lessons (uploaded but not confirmed by teacher)
let pendingLessons: LessonData[] = [];

// Confirmed lessons (teacher approved, visible to students)
let confirmedLessons: LessonData[] = [];

// Current selected lesson for student view
let currentLesson: LessonData | null = null;

export function getLesson(): LessonData | null {
  return currentLesson;
}

export function setCurrentLesson(data: LessonData) {
  currentLesson = data;
}

// Add a lesson to pending (after AI analysis, before teacher confirm)
export function addPendingLesson(data: LessonData) {
  if (!pendingLessons.find((l) => l.id === data.id)) {
    pendingLessons.push(data);
  }
}

// Teacher confirms a lesson -> moves from pending to confirmed
export function confirmLesson(data: LessonData) {
  pendingLessons = pendingLessons.filter((l) => l.id !== data.id);
  const existing = confirmedLessons.findIndex((l) => l.id === data.id);
  if (existing >= 0) {
    confirmedLessons[existing] = data;
  } else {
    confirmedLessons.push(data);
  }
  currentLesson = data;
}

// Legacy alias
export function setLesson(data: LessonData) {
  confirmLesson(data);
}

export function getPendingLessons(): LessonData[] {
  return [...pendingLessons];
}

export function getConfirmedLessons(): LessonData[] {
  return [...confirmedLessons];
}

// Students can only see confirmed lessons
export function getAllAvailableLessons(): LessonData[] {
  return [...confirmedLessons];
}

// Return sample checkpoints for a ~200s video
export function getSampleLesson(): LessonData {
  return {
    id: `lesson-sample-${Date.now()}`,
    title: "Bài học mẫu - Video đã upload",
    video_url: "",
    checkpoints: JSON.parse(JSON.stringify(SAMPLE_CHECKPOINTS_200S)),
  };
}

export function removeLesson(id: string) {
  confirmedLessons = confirmedLessons.filter((l) => l.id !== id);
  if (currentLesson?.id === id) currentLesson = null;
}

export function getSampleLessons(): LessonData[] {
  return [];
}
