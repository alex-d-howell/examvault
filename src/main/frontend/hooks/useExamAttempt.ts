import { useState, useEffect, useCallback, useMemo } from 'react';
import { ExamService } from 'Frontend/generated/endpoints';
import type Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';
import type Question from 'Frontend/generated/com/howell/examvault/base/domain/Question';

interface UseExamAttemptReturn {
  // Core exam state
  exam: Exam | null;
  loading: boolean;
  error: string | null;

  // Question navigation
  currentQuestionIndex: number;
  currentQuestion: Question | undefined;
  setCurrentQuestionIndex: (index: number) => void;

  // Navigation helpers
  navigateToQuestion: (index: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;

  // Exam metadata
  totalQuestions: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export const useExamAttempt = (examId: string | undefined): UseExamAttemptReturn => {
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Utility function to shuffle array
  const shuffleArray = useCallback(<T>(array: T[]): T[] => {
    const newArray = [...array];
    let currentIndex = newArray.length;
    let randomIndex: number;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
    }

    return newArray;
  }, []);

  // Load and process exam
  useEffect(() => {
    const fetchExam = async () => {
      if (!examId) {
        setError('No exam ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const fetchedExam = await ExamService.getExamById(examId);

        if (fetchedExam && fetchedExam.questions) {
          // Process exam: shuffle questions and options
          const processedExam = {
            ...fetchedExam,
            questions: shuffleArray([...fetchedExam.questions.filter((q) => q != null)]).map((question) => ({
              ...question,
              options: question?.options ? shuffleArray([...question.options]) : [],
            })),
          };

          setExam(processedExam);
        } else {
          setError('Exam not found');
        }
      } catch (err) {
        console.error('Error fetching exam:', err);
        setError('Failed to load exam. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId, shuffleArray]);

  // Navigation functions
  const navigateToQuestion = useCallback(
    (index: number) => {
      if (exam?.questions && index >= 0 && index < exam.questions.length) {
        setCurrentQuestionIndex(index);
      }
    },
    [exam?.questions]
  );

  const nextQuestion = useCallback(() => {
    if (exam?.questions && currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }, [exam?.questions, currentQuestionIndex]);

  const previousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }, [currentQuestionIndex]);

  // Computed values
  const currentQuestion = useMemo(() => {
    return exam?.questions?.[currentQuestionIndex];
  }, [exam?.questions, currentQuestionIndex]);

  const totalQuestions = useMemo(() => {
    return exam?.questions?.length || 0;
  }, [exam?.questions]);

  const canGoNext = useMemo(() => {
    return currentQuestionIndex < totalQuestions - 1;
  }, [currentQuestionIndex, totalQuestions]);

  const canGoPrevious = useMemo(() => {
    return currentQuestionIndex > 0;
  }, [currentQuestionIndex]);

  return {
    // Core exam state
    exam,
    loading,
    error,

    // Question navigation
    currentQuestionIndex,
    currentQuestion,
    setCurrentQuestionIndex,

    // Navigation helpers
    navigateToQuestion,
    nextQuestion,
    previousQuestion,

    // Exam metadata
    totalQuestions,
    canGoNext,
    canGoPrevious,
  };
};
