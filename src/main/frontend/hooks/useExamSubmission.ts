import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ExamService } from 'Frontend/generated/endpoints';
import type Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';
import type ExamAttempt from 'Frontend/generated/com/howell/examvault/base/domain/ExamAttempt';
import type Answer from 'Frontend/generated/com/howell/examvault/base/domain/Answer';

interface AnswersState {
  [questionId: string]: string[];
}

// Interface for question results in detailed view
interface QuestionResult {
  questionId: string;
  userAnswer: string[];
  correctAnswer: string[];
  isCorrect: boolean;
}

interface UseExamSubmissionReturn {
  // Submission state
  submitting: boolean;
  isExamSubmitted: boolean;
  examAttempt: ExamAttempt | null;

  // Results processing
  questionResults: QuestionResult[];
  scorePercentage: number;

  // Submission actions
  submitExam: (answers: AnswersState, examId: string, startTime: Date) => Promise<void>;

  // Anonymous user flow
  showSaveOption: boolean;
  setShowSaveOption: (show: boolean) => void;
  handleSignInToSave: (examId: string, answers: AnswersState, startTime: Date, currentQuestionIndex: number) => void;

  // Error handling
  submissionError: string | null;
  clearSubmissionError: () => void;
}

export const useExamSubmission = (authenticated: boolean, exam: Exam | null): UseExamSubmissionReturn => {
  const navigate = useNavigate();

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [isExamSubmitted, setIsExamSubmitted] = useState(false);
  const [examAttempt, setExamAttempt] = useState<ExamAttempt | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Anonymous user flow
  const [showSaveOption, setShowSaveOption] = useState(false);

  // Clear submission error
  const clearSubmissionError = useCallback(() => {
    setSubmissionError(null);
  }, []);

  // Handle sign in to save for anonymous users
  const handleSignInToSave = useCallback(
    (examId: string, answers: AnswersState, startTime: Date, currentQuestionIndex: number) => {
      // Store current exam state for restoration after login
      sessionStorage.setItem(
        'examInProgress',
        JSON.stringify({
          examId,
          answers,
          startTime: startTime.toISOString(),
          currentQuestionIndex,
        })
      );
      navigate('/login');
    },
    [navigate]
  );

  // Main submission function
  const submitExam = useCallback(
    async (answers: AnswersState, examId: string, startTime: Date) => {
      // Validation
      if (Object.keys(answers).length === 0) {
        setSubmissionError('You must answer at least one question before submitting.');
        return;
      }

      // For anonymous users, show save option first
      if (!authenticated && !showSaveOption) {
        setShowSaveOption(true);
        return;
      }

      setSubmitting(true);
      setSubmissionError(null);
      setShowSaveOption(false);

      try {
        // Convert answers to the format expected by the backend
        const answersList = Object.entries(answers)
          .filter(([_, answerArray]) => answerArray.length > 0) // Only include answered questions
          .map(([questionId, answerArray]) => {
            return {
              questionId: questionId,
              answerChoices: answerArray,
            };
          }) as Answer[];

        const endTime = new Date();

        // Submit exam attempt using the 4-parameter method
        const result = await ExamService.submitExamAttempt(
          examId,
          startTime.toISOString(),
          endTime.toISOString(),
          answersList
        );

        setExamAttempt(result || null);
        setIsExamSubmitted(true);
      } catch (err) {
        console.error('Error submitting exam:', err);
        setSubmissionError('Failed to submit exam. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [authenticated, showSaveOption]
  );

  // Process question results using existing ExamAttempt structure
  const questionResults = useMemo((): QuestionResult[] => {
    if (!examAttempt?.selectedAnswers || !exam?.questions) {
      return [];
    }

    // Create a map of user answers by questionId
    const userAnswersMap = new Map<string, string[]>();
    examAttempt.selectedAnswers.forEach((answer) => {
      if (answer?.questionId) {
        // Filter out undefined values from answerChoices
        const cleanAnswerChoices = (answer.answerChoices || []).filter(
          (choice): choice is string => choice !== undefined
        );
        userAnswersMap.set(answer.questionId, cleanAnswerChoices);
      }
    });

    // Build question results by comparing user answers with correct answers
    return exam.questions
      .map((question) => {
        if (!question?.id) return null;

        const userAnswer = userAnswersMap.get(question.id) || [];
        const correctAnswer = (question.correctAnswers || []).filter(
          (answer): answer is string => answer !== undefined
        );

        // Check if answer is correct (same length and contains all correct answers)
        const isCorrect =
          userAnswer.length === correctAnswer.length && correctAnswer.every((correct) => userAnswer.includes(correct));

        return {
          questionId: question.id,
          userAnswer,
          correctAnswer,
          isCorrect,
        };
      })
      .filter((result) => result !== null) as QuestionResult[];
  }, [examAttempt?.selectedAnswers, exam?.questions]);

  // Calculate score percentage
  const scorePercentage = useMemo(() => {
    const totalQuestions = exam?.questions?.length || 1;
    const correctCount = examAttempt?.numberCorrect || 0;
    return Math.round((correctCount / totalQuestions) * 100);
  }, [examAttempt?.numberCorrect, exam?.questions?.length]);

  return {
    // Submission state
    submitting,
    isExamSubmitted,
    examAttempt,

    // Results processing
    questionResults,
    scorePercentage,

    // Submission actions
    submitExam,

    // Anonymous user flow
    showSaveOption,
    setShowSaveOption,
    handleSignInToSave,

    // Error handling
    submissionError,
    clearSubmissionError,
  };
};
