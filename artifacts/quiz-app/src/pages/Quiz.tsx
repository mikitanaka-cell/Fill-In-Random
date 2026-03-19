import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useListQuestions, useSubmitAttempt } from "@/hooks/useLocalStorageQuiz";
import { Layout } from "@/components/Layout";
import { BlankRenderer } from "@/components/BlankRenderer";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, ArrowLeft, Check, X, Award, Home as HomeIcon } from "lucide-react";
import type { Question, AttemptResult } from "@workspace/api-client-react";
import confetti from "canvas-confetti";
import { useQueryClient } from "@tanstack/react-query";

export default function Quiz() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const queryClient = useQueryClient();
  const isWrongOnly = search.includes("mode=wrong");

  const listParams = { wrongOnly: isWrongOnly ? true : undefined };
  const { data: questions, isLoading } = useListQuestions(
    listParams,
    { query: { queryKey: getListQuestionsQueryKey(listParams), refetchOnWindowFocus: false } }
  );

  const submitMutation = useSubmitAttempt({
    mutation: {
      onSuccess: () => {
        // Invalidate in background to keep stats fresh for when we return home
        queryClient.invalidateQueries({ queryKey: getListQuestionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
      }
    }
  });

  // Quiz State
  const [shuffled, setShuffled] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswers, setCurrentAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<AttemptResult | null>(null);
  
  // Session Stats
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (questions && shuffled.length === 0) {
      // Shuffle array logic
      const array = [...questions];
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      setShuffled(array);
    }
  }, [questions]);

  const currentQ = shuffled[currentIndex];

  const handleSubmit = () => {
    if (!currentQ || submitMutation.isPending) return;
    
    // Fill empty strings for unanswered blanks just in case
    const blankCount = (currentQ.text.match(/\{\{[^}]+\}\}/g) || []).length;
    const paddedAnswers = Array(blankCount).fill("").map((_, i) => currentAnswers[i] || "");

    submitMutation.mutate(
      { id: currentQ.id, data: { answers: paddedAnswers } },
      {
        onSuccess: (data) => {
          setResult(data);
          if (data.correct) setSessionCorrect(prev => prev + 1);
        }
      }
    );
  };

  const handleNext = () => {
    if (currentIndex < shuffled.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentAnswers([]);
      setResult(null);
    } else {
      setIsFinished(true);
      if (sessionCorrect === shuffled.length && shuffled.length > 0) {
        triggerConfetti();
      }
    }
  };

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#48BB78', '#0F4C81']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#48BB78', '#0F4C81']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">問題を準備しています...</p>
        </div>
      </Layout>
    );
  }

  if (shuffled.length === 0) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto w-full text-center py-20 bg-card rounded-3xl border border-border shadow-sm">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-4">対象の問題がありません</h2>
          <p className="text-muted-foreground mb-8">
            {isWrongOnly ? "正答率80%未満の問題は現在ありません。" : "問題が登録されていません。"}
          </p>
          <button 
            onClick={() => setLocation('/')}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </Layout>
    );
  }

  if (isFinished) {
    const isPerfect = sessionCorrect === shuffled.length;
    return (
      <Layout>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto w-full text-center py-16 px-6 bg-card rounded-3xl border border-border shadow-xl relative overflow-hidden"
        >
          {isPerfect && <div className="absolute inset-0 bg-success/5 pointer-events-none" />}
          
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ${isPerfect ? 'bg-success text-white' : 'bg-primary/10 text-primary'}`}>
            <Award className="w-12 h-12" />
          </div>
          
          <h2 className="text-3xl font-display font-bold mb-2">セッション完了</h2>
          <p className="text-muted-foreground mb-8">お疲れ様でした！今回の結果です。</p>
          
          <div className="inline-flex items-end gap-2 mb-10">
            <span className="text-6xl font-display font-bold text-foreground">{sessionCorrect}</span>
            <span className="text-2xl text-muted-foreground mb-1">/ {shuffled.length}</span>
            <span className="text-lg text-muted-foreground mb-1.5 ml-2 font-medium">正解</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => setLocation('/')}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition-colors w-full sm:w-auto justify-center"
            >
              <HomeIcon className="w-5 h-5" /> ホームに戻る
            </button>
            <button 
              onClick={() => {
                window.location.reload(); // Simple way to reset state and refetch
              }}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-xl w-full sm:w-auto justify-center transition-all"
            >
              <ArrowLeft className="w-5 h-5" /> もう一度挑戦
            </button>
          </div>
        </motion.div>
      </Layout>
    );
  }

  // Active Question Render
  const isAnsweredAll = currentAnswers.filter(a => a.trim() !== "").length === (currentQ.text.match(/\{\{[^}]+\}\}/g) || []).length;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto w-full flex flex-col min-h-[60vh]">
        
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setLocation('/')}
            className="p-2 rounded-full hover:bg-black/5 transition-colors text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="text-sm font-bold text-muted-foreground bg-black/5 px-4 py-1.5 rounded-full">
              Q {currentIndex + 1} / {shuffled.length}
            </div>
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            <div className="bg-card p-8 md:p-12 rounded-[2rem] border border-border shadow-sm flex-1 flex flex-col relative overflow-hidden">
              
              {result && (
                <div className={`absolute top-0 left-0 w-full h-2 ${result.correct ? 'bg-success' : 'bg-destructive'}`} />
              )}

              <h3 className="text-sm font-bold text-primary mb-6 tracking-wider">{currentQ.title}</h3>
              
              <div className="mb-12">
                <BlankRenderer 
                  text={currentQ.text} 
                  mode="interactive" 
                  onAnswersChange={setCurrentAnswers}
                  result={result}
                />
              </div>

              {/* Feedback Area */}
              <div className="mt-auto">
                <AnimatePresence>
                  {result && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-6 rounded-2xl flex items-start gap-4 mb-6 ${
                        result.correct ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'
                      }`}
                    >
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${result.correct ? 'bg-success text-white' : 'bg-destructive text-white'}`}>
                        {result.correct ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className={`font-bold text-lg ${result.correct ? 'text-success' : 'text-destructive'}`}>
                          {result.correct ? "正解！" : "不正解..."}
                        </p>
                        {!result.correct && (
                          <p className="text-sm text-destructive/80 mt-1 font-medium">
                            赤字の正解を確認して、次に進んでください。
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-end">
                  {!result ? (
                    <button
                      onClick={handleSubmit}
                      disabled={!isAnsweredAll || submitMutation.isPending}
                      className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                      回答する
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      autoFocus
                      className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold bg-foreground text-background shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                    >
                      次の問題へ <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        </AnimatePresence>
        
      </div>
    </Layout>
  );
}
