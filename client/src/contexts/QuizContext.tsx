/*
 * QuizContext.tsx — Global quiz state management
 * Design: Election Broadcast Dashboard
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { QuizState, QuizQuestion, AnswerRecord, QuizMode } from "@/lib/types";

interface QuizContextType {
  state: QuizState | null;
  startQuiz: (mode: QuizMode, questions: QuizQuestion[], modeId?: string, modeName?: string) => void;
  recordAnswer: (record: AnswerRecord) => void;
  nextQuestion: () => void;
  resetQuiz: () => void;
  getMissedDistrictIds: () => string[];
}

const QuizContext = createContext<QuizContextType | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QuizState | null>(null);

  const startQuiz = useCallback(
    (mode: QuizMode, questions: QuizQuestion[], modeId?: string, modeName?: string) => {
      setState({
        mode,
        modeId,
        modeName,
        questions,
        currentIndex: 0,
        answers: [],
        score: 0,
      });
    },
    []
  );

  const recordAnswer = useCallback((record: AnswerRecord) => {
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        answers: [...prev.answers, record],
        score: prev.score + (record.result.is_correct ? 1 : 0),
      };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev;
      return { ...prev, currentIndex: prev.currentIndex + 1 };
    });
  }, []);

  const resetQuiz = useCallback(() => {
    setState(null);
  }, []);

  const getMissedDistrictIds = useCallback(() => {
    if (!state) return [];
    return state.answers
      .filter((a) => !a.result.is_correct)
      .map((a) => a.question.district.id);
  }, [state]);

  return (
    <QuizContext.Provider
      value={{ state, startQuiz, recordAnswer, nextQuestion, resetQuiz, getMissedDistrictIds }}
    >
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used within QuizProvider");
  return ctx;
}
