import { useState, useEffect } from "react";

// データの型定義
interface Question {
  id: number;
  text: string;
  totalAttempts: number;
  correctAttempts: number;
  hasWrongAttempt: boolean;
}

const STORAGE_KEY = "quiz_app_data";

export function useListQuestions() {
  const [data, setData] = useState<Question[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setData(JSON.parse(saved));
  }, []);
  return { data, isLoading: false };
}

export function useGetStats() {
  const { data: questions } = useListQuestions();
  const stats = {
    totalQuestions: questions.length,
    totalAttempts: questions.reduce((acc, q) => acc + q.totalAttempts, 0),
    correctAttempts: questions.reduce((acc, q) => acc + q.correctAttempts, 0),
  };
  return { data: stats, isLoading: false };
}

export function useDeleteQuestion({ mutation }: any = {}) {
  return {
    mutate: ({ id }: { id: number }) => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const questions = JSON.parse(saved) as Question[];
        const filtered = questions.filter((q) => q.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        if (mutation?.onSuccess) mutation.onSuccess();
        window.location.reload(); // 画面を更新
      }
    },
  };
}

export function useResetQuestionStats({ mutation }: any = {}) {
  return {
    mutate: ({ id }: { id: number }) => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const questions = JSON.parse(saved) as Question[];
        const updated = questions.map((q) =>
          q.id === id ? { ...q, totalAttempts: 0, correctAttempts: 0, hasWrongAttempt: false } : q
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        if (mutation?.onSuccess) mutation.onSuccess();
        window.location.reload();
      }
    },
  };
}
