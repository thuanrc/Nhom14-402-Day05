export interface Checkpoint {
  id: string;
  timestamp_seconds: number;
  type: "multiple_choice" | "essay";
  question: string;
  options?: string[];
  correct_answer?: string;
  grading_criteria?: string;
}

export interface LessonData {
  id?: string;
  title?: string;
  video_url: string;
  video_file?: File;
  checkpoints: Checkpoint[];
}
