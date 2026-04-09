import { useState, useCallback } from "react";
import { Upload, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface VideoUploaderProps {
  onAnalyze: (file: File) => void;
  isAnalyzing: boolean;
}

export function VideoUploader({ onAnalyze, isAnalyzing }: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type.startsWith("video/")) setFile(dropped);
  }, []);

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
          dragOver ? "border-secondary bg-secondary/10" : "border-border hover:border-secondary/60"
        }`}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "video/mp4";
          input.onchange = (e) => {
            const f = (e.target as HTMLInputElement).files?.[0];
            if (f) setFile(f);
          };
          input.click();
        }}
      >
        <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-sm">
          {file ? file.name : "Drag & drop your MP4 video here, or click to browse"}
        </p>
        {file && (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-foreground">
            <Film className="h-4 w-4 text-secondary" />
            <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="gradient-navy rounded-lg p-6 text-center"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              <p className="text-gold text-sm font-medium">
                AI is analyzing the video and generating historical questions...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {file && !isAnalyzing && (
        <Button
          onClick={() => onAnalyze(file)}
          className="w-full gradient-navy text-gold hover:opacity-90 transition-opacity"
          size="lg"
        >
          Analyze with AI
        </Button>
      )}
    </div>
  );
}
