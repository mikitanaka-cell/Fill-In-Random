import { useState, useEffect } from "react";

interface Question {
  id: number;
  text: string;
  totalAttempts: number;
  correctAttempts: number;
  hasWrongAttempt: boolean;
}

const STORAGE_KEY = "quiz_app_data";

// 共通：データの読み出し
const getStored = (): Question[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

export function useListQuestions() {
  const [data, setData] = useState<Question[]>([]);
  useEffect(() => { setData(getStored()); }, []);
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

// 追加：新規作成
export function useCreateQuestion({ mutation }: any = {}) {
  return {
    mutate: (newQuestion: { text: string }) => {
      const questions = getStored();
      const newItem = {
        ...newQuestion,
        id: Date.now(),
        totalAttempts: 0,
        correctAttempts: 0,
        hasWrongAttempt: false
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...questions, newItem]));
      if (mutation?.onSuccess) mutation.onSuccess();
    }
  };
}

// 追加：回答の記録
export function useSubmitAttempt({ mutation }: any = {}) {
  return {
    mutate: ({ id, isCorrect }: { id: number; isCorrect: boolean }) => {
      const questions = getStored();
      const updated = questions.map((q) => {
        if (q.id === id) {
          return {
            ...q,
            totalAttempts: q.totalAttempts + 1,
            correctAttempts: isCorrect ? q.correctAttempts + 1 : q.correctAttempts,
            hasWrongAttempt: !isCorrect || q.hasWrongAttempt
          };
        }
        return q;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      if (mutation?.onSuccess) mutation.onSuccess();
    }
  };
}

export function useDeleteQuestion({ mutation }: any = {}) {
  return {
    mutate: ({ id }: { id: number }) => {
      const questions = getStored().filter((q) => q.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
      if (mutation?.onSuccess) mutation.onSuccess();
      window.location.reload();
    },
  };
}

export function useResetQuestionStats({ mutation }: any = {}) {
  return {
    mutate: ({ id }: { id: number }) => {
      const questions = getStored().map((q) =>
        q.id === id ? { ...q, totalAttempts: 0, correctAttempts: 0, hasWrongAttempt: false } : q
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
      if (mutation?.onSuccess) mutation.onSuccess();
      window.location.reload();
    },
  };
}
