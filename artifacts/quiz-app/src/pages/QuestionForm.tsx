import { useState, useEffect, useCallback } from "react";
import { useCreateQuestion } from "@/hooks/useLocalStorageQuiz";
import { Link, useLocation, useParams } from "wouter";
import { Layout } from "@/components/Layout";
import { BlankRenderer } from "@/components/BlankRenderer";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const BLANK = "___";

function countBlanks(text: string) {
  return (text.match(/___/g) || []).length;
}

function toStorageFormat(text: string, answers: string[]): string {
  let idx = 0;
  return text.replace(/___/g, () => {
    const ans = answers[idx] ?? "";
    idx++;
    return `{{${ans}}}`;
  });
}

function fromStorageFormat(stored: string): { text: string; answers: string[] } {
  const answers: string[] = [];
  const text = stored.replace(/\{\{([^}]*)\}\}/g, (_match, ans) => {
    answers.push(ans);
    return "___";
  });
  return { text, answers };
}

function autoTitle(text: string): string {
  const clean = text.replace(/___/g, "＿");
  return clean.length > 50 ? clean.slice(0, 50) + "…" : clean;
}

export default function QuestionForm() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const numericId = id ? parseInt(id, 10) : 0;

  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: existingQuestion, isLoading: isFetching } = useGetQuestion(numericId, {
    query: { queryKey: getGetQuestionQueryKey(numericId), enabled: isEditing },
  });

  const [questionText, setQuestionText] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [textError, setTextError] = useState("");
  const [answerErrors, setAnswerErrors] = useState<string[]>([]);

  const blankCount = countBlanks(questionText);

  const syncAnswers = useCallback((text: string, prevAnswers: string[]) => {
    const count = countBlanks(text);
    if (count > prevAnswers.length) {
      return [...prevAnswers, ...Array(count - prevAnswers.length).fill("")];
    } else {
      return prevAnswers.slice(0, count);
    }
  }, []);

  useEffect(() => {
    if (existingQuestion) {
      const { text, answers: extractedAnswers } = fromStorageFormat(existingQuestion.text);
      setQuestionText(text);
      setAnswers(extractedAnswers);
    }
  }, [existingQuestion]);

  const handleTextChange = (val: string) => {
    setQuestionText(val);
    setAnswers((prev) => syncAnswers(val, prev));
    setTextError("");
  };

  const handleAnswerChange = (idx: number, val: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
    setAnswerErrors((prev) => {
      const next = [...prev];
      next[idx] = "";
      return next;
    });
  };

  const createMutation = useCreateQuestion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListQuestionsQueryKey() });
        setLocation("/");
      },
    },
  });

  const updateMutation = useUpdateQuestion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListQuestionsQueryKey() });
        setLocation("/");
      },
    },
  });

  const validate = () => {
    let valid = true;
    if (!questionText.trim()) {
      setTextError("問題文を入力してください");
      valid = false;
    } else if (blankCount === 0) {
      setTextError("___ を最低1つ入力してください");
      valid = false;
    } else {
      setTextError("");
    }

    const errs = answers.map((a, i) => {
      if (!a.trim()) return `①②③...の${i + 1}番目の回答を入力してください`;
      return "";
    });
    setAnswerErrors(errs);
    if (errs.some(Boolean)) valid = false;

    return valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const storedText = toStorageFormat(questionText, answers);
    const title = autoTitle(questionText);

    if (isEditing) {
      updateMutation.mutate({ id: numericId, data: { title, text: storedText } });
    } else {
      createMutation.mutate({ data: { title, text: storedText } });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isFetching) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto w-full space-y-8">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">
            {isEditing ? "問題を編集" : "新しい問題を作成"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question text field */}
          <div className="bg-card p-6 md:p-8 rounded-3xl border border-border shadow-sm space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">問題文</label>
              <p className="text-xs text-muted-foreground">
                穴埋めにしたい箇所を <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">___</code>（アンダースコア3つ）と記述します
              </p>
              <textarea
                value={questionText}
                onChange={(e) => handleTextChange(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-foreground resize-y"
                placeholder={"例）___はSRAMに比べ、データ容量の大きいメモリを___作ることができる"}
              />
              {textError && (
                <p className="text-destructive text-sm font-medium">{textError}</p>
              )}
            </div>

            {/* Answer fields */}
            {blankCount > 0 && (
              <div className="space-y-3 pt-2 border-t border-border">
                <label className="text-sm font-bold text-foreground">
                  回答欄
                  <span className="ml-2 text-xs text-muted-foreground font-normal">（穴の順番に入力）</span>
                </label>
                <div className="space-y-2">
                  {Array.from({ length: blankCount }).map((_, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-sm font-bold text-primary w-6 shrink-0">
                        {CIRCLED[idx] ?? `${idx + 1}.`}
                      </span>
                      <input
                        type="text"
                        value={answers[idx] ?? ""}
                        onChange={(e) => handleAnswerChange(idx, e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-foreground"
                        placeholder={`${idx + 1}番目の正解`}
                      />
                      {answerErrors[idx] && (
                        <p className="text-destructive text-xs font-medium">{answerErrors[idx]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Preview */}
          {questionText && blankCount > 0 && (
            <div className="bg-primary/5 p-6 md:p-8 rounded-3xl border border-primary/20 space-y-4">
              <h3 className="text-xs font-bold text-primary/60 tracking-widest uppercase">プレビュー</h3>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/10">
                <BlankRenderer
                  text={toStorageFormat(questionText, answers.map(() => "answer"))}
                  mode="preview"
                />
              </div>
              {answers.filter(Boolean).length > 0 && (
                <div className="text-sm text-primary/70 font-medium space-x-3">
                  {answers.map((a, i) =>
                    a ? (
                      <span key={i}>
                        {CIRCLED[i] ?? `${i + 1}.`}
                        {a}
                      </span>
                    ) : null
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isEditing ? "更新を保存" : "問題を登録"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
