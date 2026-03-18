import { parseQuestionText } from "@/lib/utils";
import { Fragment, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { AttemptResult } from "@workspace/api-client-react";

interface BlankRendererProps {
  text: string;
  mode: "preview" | "interactive";
  onAnswersChange?: (answers: string[]) => void;
  result?: AttemptResult | null;
}

export function BlankRenderer({ text, mode, onAnswersChange, result }: BlankRendererProps) {
  const segments = parseQuestionText(text);
  const blankCount = Math.max(0, segments.length - 1);
  
  const [answers, setAnswers] = useState<string[]>(Array(blankCount).fill(""));

  useEffect(() => {
    // Reset answers when text changes (e.g. next question)
    setAnswers(Array(blankCount).fill(""));
  }, [text, blankCount]);

  const handleInputChange = (index: number, val: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = val;
    setAnswers(newAnswers);
    onAnswersChange?.(newAnswers);
  };

  return (
    <div className="text-lg md:text-xl leading-relaxed text-foreground font-medium">
      {segments.map((segment, idx) => (
        <Fragment key={idx}>
          {segment}
          {idx < segments.length - 1 && (
            <span className="inline-block relative">
              {mode === "preview" ? (
                <span className="inline-block min-w-[60px] border-b-2 border-primary/30 mx-1 px-2 text-primary/40 text-center">
                  空欄
                </span>
              ) : (
                <span className="relative inline-block">
                  <input
                    type="text"
                    value={answers[idx] || ""}
                    onChange={(e) => handleInputChange(idx, e.target.value)}
                    disabled={!!result}
                    placeholder="回答..."
                    style={{ width: `${Math.max(6, (answers[idx] || "").length + 2)}ch` }}
                    className={cn(
                      "blank-input",
                      result && result.perAnswerCorrect[idx] && "blank-input-correct",
                      result && !result.perAnswerCorrect[idx] && "blank-input-wrong"
                    )}
                  />
                  {/* Show correct answer below if wrong */}
                  {result && !result.perAnswerCorrect[idx] && (
                    <span className="absolute left-0 -bottom-6 w-full text-center text-sm font-bold text-success animate-in fade-in slide-in-from-top-2">
                      {result.correctAnswers[idx]}
                    </span>
                  )}
                </span>
              )}
            </span>
          )}
        </Fragment>
      ))}
    </div>
  );
}
