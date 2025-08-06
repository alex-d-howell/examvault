import { useState, useCallback, useMemo, useEffect } from 'react';
import type Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';

// Define the type for answers state - always using arrays
interface AnswersState {
  [questionId: string]: string[];
}

interface UseAnswerStateReturn {
  // Answer state
  answers: AnswersState;

  // Answer management
  handleAnswerChange: (questionId: string, answer: string) => void;
  handleMultipleAnswerChange: (questionId: string, option: string, checked: boolean) => void;

  // Answer utilities
  getQuestionStatus: (questionId: string) => 'answered' | 'unanswered';
  getAnsweredCount: () => number;
  getCurrentAnswer: (questionId: string) => string[];

  // Progress tracking
  progressPercentage: number;
  hasAnsweredAny: boolean;

  // Validation
  canSubmit: boolean;
}

export const useAnswerState = (exam: Exam | null): UseAnswerStateReturn => {
  const [answers, setAnswers] = useState<AnswersState>({});

  // Init answers when exam loads
  useEffect(() => {
    if (exam?.questions) {
      const initialAnswers: AnswersState = {};
      exam.questions.forEach((question) => {
        if (question?.id) {
          initialAnswers[question.id] = [];
        }
      });
      setAnswers(initialAnswers);
    }
  }, [exam?.questions]);

  // Handle single answer questions
  const handleAnswerChange = useCallback((questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: [answer], // Always store as array, even for single answers
    }));
  }, []);

  // Handle multiple answer questions
  const handleMultipleAnswerChange = useCallback((questionId: string, option: string, checked: boolean) => {
    setAnswers((prev) => {
      const currentAnswers = prev[questionId] || [];
      let newAnswers: string[];

      if (checked) {
        newAnswers = [...currentAnswers, option];
      } else {
        newAnswers = currentAnswers.filter((ans: string) => ans !== option);
      }

      return {
        ...prev,
        [questionId]: newAnswers,
      };
    });
  }, []);

  // Get status of a specific question
  const getQuestionStatus = useCallback(
    (questionId: string): 'answered' | 'unanswered' => {
      const answer = answers[questionId];
      return answer && answer.length > 0 ? 'answered' : 'unanswered';
    },
    [answers]
  );

  // Get current answer for a question
  const getCurrentAnswer = useCallback(
    (questionId: string): string[] => {
      return answers[questionId] || [];
    },
    [answers]
  );

  // Count answered questions
  const getAnsweredCount = useCallback(() => {
    return Object.values(answers).filter((answer) => answer && answer.length > 0).length;
  }, [answers]);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    const totalQuestions = exam?.questions?.length || 0;
    if (totalQuestions === 0) return 0;

    const answeredCount = Object.values(answers).filter((answer) => answer && answer.length > 0).length;
    return Math.round((answeredCount / totalQuestions) * 100);
  }, [answers, exam?.questions?.length]);

  // Check if any questions have been answered
  const hasAnsweredAny = useMemo(() => {
    return Object.values(answers).some((answer) => answer && answer.length > 0);
  }, [answers]);

  // Basic validation for submission
  const canSubmit = useMemo(() => {
    // Can submit if at least one question is answered
    return hasAnsweredAny;
  }, [hasAnsweredAny]);

  return {
    // Answer state
    answers,

    // Answer management
    handleAnswerChange,
    handleMultipleAnswerChange,

    // Answer utilities
    getQuestionStatus,
    getAnsweredCount,
    getCurrentAnswer,

    // Progress tracking
    progressPercentage,
    hasAnsweredAny,

    // Validation
    canSubmit,
  };
};
