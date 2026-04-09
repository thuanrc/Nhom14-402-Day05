import { Checkpoint } from "@/types/lesson";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  checkpoints: Checkpoint[];
  onChange: (cps: Checkpoint[]) => void;
}

export function CheckpointEditor({ checkpoints, onChange }: Props) {
  const update = (id: string, patch: Partial<Checkpoint>) => {
    onChange(checkpoints.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const remove = (id: string) => onChange(checkpoints.filter((c) => c.id !== id));

  const add = () => {
    onChange([
      ...checkpoints,
      {
        id: `cp${Date.now()}`,
        timestamp_seconds: 0,
        type: "multiple_choice",
        question: "",
        options: ["", "", ""],
        correct_answer: "",
      },
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Interaction Checkpoints</h3>
        <Button variant="outline" size="sm" onClick={add}>
          <Plus className="h-4 w-4 mr-1" /> Add Checkpoint
        </Button>
      </div>

      {checkpoints.map((cp, i) => (
        <motion.div
          key={cp.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className="p-5 space-y-4 border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium text-foreground">Checkpoint {i + 1}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(cp.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Timestamp (seconds)</Label>
                <Input
                  type="number"
                  value={cp.timestamp_seconds}
                  onChange={(e) => update(cp.id, { timestamp_seconds: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Question Type</Label>
                <div className="flex gap-1 mt-1">
                  {(["multiple_choice", "essay"] as const).map((t) => (
                    <Button
                      key={t}
                      size="sm"
                      variant={cp.type === t ? "default" : "outline"}
                      className={cp.type === t ? "gradient-navy text-gold" : ""}
                      onClick={() => {
                        const patch: Partial<Checkpoint> = { type: t };
                        if (t === "multiple_choice") {
                          patch.options = cp.options?.length ? cp.options : ["", "", ""];
                          patch.correct_answer = cp.correct_answer || "";
                          patch.grading_criteria = undefined;
                        } else {
                          patch.grading_criteria = cp.grading_criteria || "";
                          patch.options = undefined;
                          patch.correct_answer = undefined;
                        }
                        update(cp.id, patch);
                      }}
                    >
                      {t === "multiple_choice" ? "Multiple Choice" : "Essay"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Question</Label>
              <Textarea
                value={cp.question}
                onChange={(e) => update(cp.id, { question: e.target.value })}
                rows={2}
              />
            </div>

            {cp.type === "multiple_choice" && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Options</Label>
                {cp.options?.map((opt, oi) => (
                  <Input
                    key={oi}
                    value={opt}
                    placeholder={`Option ${oi + 1}`}
                    onChange={(e) => {
                      const newOpts = [...(cp.options || [])];
                      newOpts[oi] = e.target.value;
                      update(cp.id, { options: newOpts });
                    }}
                  />
                ))}
                <div>
                  <Label className="text-xs text-muted-foreground">Correct Answer</Label>
                  <Input
                    value={cp.correct_answer || ""}
                    onChange={(e) => update(cp.id, { correct_answer: e.target.value })}
                  />
                </div>
              </div>
            )}

            {cp.type === "essay" && (
              <div>
                <Label className="text-xs text-muted-foreground">Grading Criteria / Keywords</Label>
                <Textarea
                  value={cp.grading_criteria || ""}
                  onChange={(e) => update(cp.id, { grading_criteria: e.target.value })}
                  rows={2}
                />
              </div>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
