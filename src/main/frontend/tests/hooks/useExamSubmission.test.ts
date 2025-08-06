import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ExamService } from 'Frontend/generated/endpoints';
import { mockNavigate } from '../setupTests';
import { testUtils } from '../test-utils';
import { useExamSubmission } from 'Frontend/hooks/useExamSubmission';

// Mock the ExamService
vi.mock('Frontend/generated/endpoints', () => ({
  ExamService: {
    submitExamAttempt: vi.fn()
  }
}));

const mockExamService = ExamService as any;

describe('useExamSubmission', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  const createMockExam = (overrides = {}) => ({
    id: 'exam-123',
    title: 'Test Exam',
    description: 'Test exam description',
    questions: [
      {
        id: 'question-1',
        questionText: 'What is React?',
        options: ['Library', 'Framework', 'Language'],
        correctAnswers: ['Library'],
        isMultipleAnswers: false
      },
      {
        id: 'question-2',
        questionText: 'Which are programming languages?',
        options: ['JavaScript', 'HTML', 'Python', 'CSS'],
        correctAnswers: ['JavaScript', 'Python'],
        isMultipleAnswers: true
      }
    ],
    ...overrides
  });

  const createMockExamAttempt = (overrides = {}) => ({
    id: 'attempt-123',
    exam: createMockExam(),
    startTime: '2024-01-01T10:00:00Z',
    endTime: '2024-01-01T10:30:00Z',
    numberCorrect: 1,
    selectedAnswers: [
      {
        questionId: 'question-1',
        answerChoices: ['Library']
      },
      {
        questionId: 'question-2',
        answerChoices: ['JavaScript']
      }
    ],
    ...overrides
  });

  const createAnswersState = (overrides = {}) => ({
    'question-1': ['Library'],
    'question-2': ['JavaScript', 'Python'],
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    testUtils.setup.setupWindowMocks();
    // Spy on console.error to suppress expected error messages during testing
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (consoleSpy) {
      consoleSpy.mockRestore();
    }
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useExamSubmission(true, createMockExam()));

      expect(result.current).toBeDefined();
      expect(result.current.submitting).toBe(false);
      expect(result.current.isExamSubmitted).toBe(false);
      expect(result.current.examAttempt).toBeNull();
      expect(result.current.questionResults).toEqual([]);
      expect(result.current.scorePercentage).toBe(0);
      expect(result.current.showSaveOption).toBe(false);
      expect(result.current.submissionError).toBeNull();
    });

    it('should provide all required methods', () => {
      const { result } = renderHook(() => useExamSubmission(true, createMockExam()));

      expect(result.current).toBeDefined();
      expect(typeof result.current.submitExam).toBe('function');
      expect(typeof result.current.setShowSaveOption).toBe('function');
      expect(typeof result.current.handleSignInToSave).toBe('function');
      expect(typeof result.current.clearSubmissionError).toBe('function');
    });
  });

  describe('submission validation', () => {
    it('should reject submission with empty answers', async () => {
      const { result } = renderHook(() => useExamSubmission(true, createMockExam()));

      await act(async () => {
        await result.current.submitExam({}, 'exam-123', new Date());
      });

      expect(result.current.submissionError).toBe('You must answer at least one question before submitting.');
      expect(result.current.submitting).toBe(false);
      expect(mockExamService.submitExamAttempt).not.toHaveBeenCalled();
    });

    it('should allow submission with at least one answer', async () => {
      const mockAttempt = createMockExamAttempt();
      mockExamService.submitExamAttempt.mockResolvedValue(mockAttempt);

      const { result } = renderHook(() => useExamSubmission(true, createMockExam()));

      const answers = { 'question-1': ['Library'] };
      const startTime = new Date('2024-01-01T10:00:00Z');

      await act(async () => {
        await result.current.submitExam(answers, 'exam-123', startTime);
      });

      expect(result.current.submissionError).toBeNull();
      expect(result.current.isExamSubmitted).toBe(true);
      expect(result.current.examAttempt).toEqual(mockAttempt);
    });
  });

  describe('authenticated user submission', () => {
    it('should submit exam successfully for authenticated user', async () => {
      const mockAttempt = createMockExamAttempt();
      mockExamService.submitExamAttempt.mockResolvedValue(mockAttempt);

      const { result } = renderHook(() => useExamSubmission(true, createMockExam()));

      const answers = createAnswersState();
      const startTime = new Date('2024-01-01T10:00:00Z');

      await act(async () => {
        await result.current.submitExam(answers, 'exam-123', startTime);
      });

      expect(result.current.submitting).toBe(false);
      expect(result.current.isExamSubmitted).toBe(true);
      expect(result.current.examAttempt).toEqual(mockAttempt);
      expect(result.current.submissionError).toBeNull();

      expect(mockExamService.submitExamAttempt).toHaveBeenCalledWith(
        'exam-123',
        '2024-01-01T10:00:00.000Z',
        expect.any(String), // endTime
        [
          {
            questionId: 'question-1',
            answerChoices: ['Library']
          },
          {
            questionId: 'question-2',
            answerChoices: ['JavaScript', 'Python']
          }
        ]
      );
    });

    it('should handle submission API errors', async () => {
      const errorMessage = 'Submission failed';
      mockExamService.submitExamAttempt.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useExamSubmission(true, createMockExam()));

      const answers = createAnswersState();
      const startTime = new Date();

      await act(async () => {
        await result.current.submitExam(answers, 'exam-123', startTime);
      });

      expect(result.current.submitting).toBe(false);
      expect(result.current.isExamSubmitted).toBe(false);
      expect(result.current.submissionError).toBe('Failed to submit exam. Please try again.');
      expect(result.current.examAttempt).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Error submitting exam:', expect.any(Error));
    });

    it('should handle null response from submission', async () => {
      mockExamService.submitExamAttempt.mockResolvedValue(null);

      const { result } = renderHook(() => useExamSubmission(true, createMockExam()));

      const answers = createAnswersState();
      const startTime = new Date();

      await act(async () => {
        await result.current.submitExam(answers, 'exam-123', startTime);
      });

      expect(result.current.examAttempt).toBeNull();
      expect(result.current.isExamSubmitted).toBe(true);
    });

    it('should filter out empty answers before submission', async () => {
      const mockAttempt = createMockExamAttempt();
      mockExamService.submitExamAttempt.mockResolvedValue(mockAttempt);

      const { result } = renderHook(() => useExamSubmission(true, createMockExam()));

      const answersWithEmpty = {
        'question-1': ['Library'],
        'question-2': [], // Empty answers
        'question-3': ['Answer'] // This question doesn't exist but has answers
      };

      await act(async () => {
        await result.current.submitExam(answersWithEmpty, 'exam-123', new Date());
      });

      expect(mockExamService.submitExamAttempt).toHaveBeenCalledWith(
        'exam-123',
        expect.any(String),
        expect.any(String),
        [
          {
            questionId: 'question-1',
            answerChoices: ['Library']
          },
          {
            questionId: 'question-3',
            answerChoices: ['Answer']
          }
        ]
      );
    });

    it('should manage submitting state correctly', async () => {
      // Create a promise that we can control
      let resolveSubmission: (value: any) => void;
      const submissionPromise = new Promise(resolve => {
        resolveSubmission = resolve;
      });
      mockExamService.submitExamAttempt.mockReturnValue(submissionPromise);

      const { result } = renderHook(() => useExamSubmission(true, createMockExam()));
      const answers = createAnswersState();

      // Start submission but don't await it immediately
      act(() => {
        result.current.submitExam(answers, 'exam-123', new Date());
      });

      // Check that submitting is true while submission is in progress
      await waitFor(() => {
        expect(result.current.submitting).toBe(true);
      });

      // Resolve the submission
      act(() => {
        resolveSubmission!(createMockExamAttempt());
      });

      // Wait for submission to complete
      await waitFor(() => {
        expect(result.current.submitting).toBe(false);
      });
    });
  });

  describe('anonymous user flow', () => {
    it('should show save option for unauthenticated user on first submit', async () => {
      const { result } = renderHook(() => useExamSubmission(false, createMockExam()));

      const answers = createAnswersState();

      await act(async () => {
        await result.current.submitExam(answers, 'exam-123', new Date());
      });

      expect(result.current.showSaveOption).toBe(true);
      expect(result.current.isExamSubmitted).toBe(false);
      expect(mockExamService.submitExamAttempt).not.toHaveBeenCalled();
    });

    it('should proceed with submission after showing save option', async () => {
      const mockAttempt = createMockExamAttempt();
      mockExamService.submitExamAttempt.mockResolvedValue(mockAttempt);

      const { result } = renderHook(() => useExamSubmission(false, createMockExam()));

      const answers = createAnswersState();

      // First submission shows save option
      await act(async () => {
        await result.current.submitExam(answers, 'exam-123', new Date());
      });

      expect(result.current.showSaveOption).toBe(true);

      // Second submission proceeds
      await act(async () => {
        await result.current.submitExam(answers, 'exam-123', new Date());
      });

      expect(result.current.showSaveOption).toBe(false);
      expect(result.current.isExamSubmitted).toBe(true);
      expect(mockExamService.submitExamAttempt).toHaveBeenCalled();
    });

    it('should handle sign in to save flow', () => {
      const { result } = renderHook(() => useExamSubmission(false, createMockExam()));

      const answers = createAnswersState();
      const startTime = new Date('2024-01-01T10:00:00Z');
      const currentQuestionIndex = 2;

      act(() => {
        result.current.handleSignInToSave('exam-123', answers, startTime, currentQuestionIndex);
      });

      expect(vi.mocked(sessionStorage.setItem)).toHaveBeenCalledWith(
        'examInProgress',
        JSON.stringify({
          examId: 'exam-123',
          answers,
          startTime: startTime.toISOString(),
          currentQuestionIndex
        })
      );

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should control save option visibility', () => {
      const { result } = renderHook(() => useExamSubmission(false, createMockExam()));

      expect(result.current.showSaveOption).toBe(false);

      act(() => {
        result.current.setShowSaveOption(true);
      });

      expect(result.current.showSaveOption).toBe(true);

      act(() => {
        result.current.setShowSaveOption(false);
      });

      expect(result.current.showSaveOption).toBe(false);
    });
  });

  describe('question results processing', () => {
    it('should calculate question results correctly', async () => {
      const exam = createMockExam();
      const attempt = createMockExamAttempt({
        selectedAnswers: [
          {
            questionId: 'question-1',
            answerChoices: ['Library'] // Correct
          },
          {
            questionId: 'question-2',
            answerChoices: ['JavaScript'] // Partially correct (missing Python)
          }
        ]
      });

      mockExamService.submitExamAttempt.mockResolvedValue(attempt);
      const { result } = renderHook(() => useExamSubmission(true, exam));

      // Trigger submission to set examAttempt
      await act(async () => {
        await result.current.submitExam(createAnswersState(), 'exam-123', new Date());
      });

      const questionResults = result.current.questionResults;

      expect(questionResults).toHaveLength(2);

      // First question - correct
      expect(questionResults[0]).toEqual({
        questionId: 'question-1',
        userAnswer: ['Library'],
        correctAnswer: ['Library'],
        isCorrect: true
      });

      // Second question - incorrect (missing Python)
      expect(questionResults[1]).toEqual({
        questionId: 'question-2',
        userAnswer: ['JavaScript'],
        correctAnswer: ['JavaScript', 'Python'],
        isCorrect: false
      });
    });

    it('should handle question results with no exam attempt', () => {
      const { result } = renderHook(() => useExamSubmission(true, createMockExam()));

      expect(result.current.questionResults).toEqual([]);
    });

    it('should handle question results with no exam', () => {
      const { result } = renderHook(() => useExamSubmission(true, null));

      expect(result.current.questionResults).toEqual([]);
    });

    it('should filter out undefined answer choices', async () => {
      const exam = createMockExam();
      const attempt = createMockExamAttempt({
        selectedAnswers: [
          {
            questionId: 'question-1',
            answerChoices: ['Library', undefined, 'Extra'] // Contains undefined
          }
        ]
      });

      mockExamService.submitExamAttempt.mockResolvedValue(attempt);
      const { result } = renderHook(() => useExamSubmission(true, exam));

      await act(async () => {
        await result.current.submitExam(createAnswersState(), 'exam-123', new Date());
      });

      const questionResults = result.current.questionResults;
      expect(questionResults[0].userAnswer).toEqual(['Library', 'Extra']);
    });

    it('should handle questions without answers', async () => {
      const exam = createMockExam();
      const attempt = createMockExamAttempt({
        selectedAnswers: [
          {
            questionId: 'question-1',
            answerChoices: undefined
          }
        ]
      });

      mockExamService.submitExamAttempt.mockResolvedValue(attempt);
      const { result } = renderHook(() => useExamSubmission(true, exam));

      await act(async () => {
        await result.current.submitExam(createAnswersState(), 'exam-123', new Date());
      });

      const questionResults = result.current.questionResults;
      expect(questionResults[0].userAnswer).toEqual([]);
    });

    it('should handle questions with no correct answers', async () => {
      const examWithNoCorrectAnswers = createMockExam({
        questions: [
          {
            id: 'question-1',
            questionText: 'Test Question',
            options: ['A', 'B', 'C'],
            correctAnswers: undefined
          }
        ]
      });

      const attempt = createMockExamAttempt({
        selectedAnswers: [
          {
            questionId: 'question-1',
            answerChoices: ['A']
          }
        ]
      });

      mockExamService.submitExamAttempt.mockResolvedValue(attempt);
      const { result } = renderHook(() => useExamSubmission(true, examWithNoCorrectAnswers));

      await act(async () => {
        await result.current.submitExam({ 'question-1': ['A'] }, 'exam-123', new Date());
      });

      const questionResults = result.current.questionResults;
      expect(questionResults[0].correctAnswer).toEqual([]);
      expect(questionResults[0].isCorrect).toBe(false);
    });
  });

  describe('score percentage calculation', () => {
    it('should calculate score percentage correctly', async () => {
      const exam = createMockExam(); // 2 questions
      const attempt = createMockExamAttempt({
        numberCorrect: 1
      });

      mockExamService.submitExamAttempt.mockResolvedValue(attempt);
      const { result } = renderHook(() => useExamSubmission(true, exam));

      await act(async () => {
        await result.current.submitExam(createAnswersState(), 'exam-123', new Date());
      });

      expect(result.current.scorePercentage).toBe(50); // 1/2 = 50%
    });

    it('should handle perfect score', async () => {
      const exam = createMockExam();
      const attempt = createMockExamAttempt({
        numberCorrect: 2
      });

      mockExamService.submitExamAttempt.mockResolvedValue(attempt);
      const { result } = renderHook(() => useExamSubmission(true, exam));

      await act(async () => {
        await result.current.submitExam(createAnswersState(), 'exam-123', new Date());
      });

      expect(result.current.scorePercentage).toBe(100);
    });

    it('should handle zero score', async () => {
      const exam = createMockExam();
      const attempt = createMockExamAttempt({
        numberCorrect: 0
      });

      mockExamService.submitExamAttempt.mockResolvedValue(attempt);
      const { result } = renderHook(() => useExamSubmission(true, exam));

      await act(async () => {
        await result.current.submitExam(createAnswersState(), 'exam-123', new Date());
      });

      expect(result.current.scorePercentage).toBe(0);
    });

    it('should handle exam with no questions', async () => {
      const examWithNoQuestions = createMockExam({ questions: [] });
      const attempt = createMockExamAttempt({
        numberCorrect: 0
      });

      mockExamService.submitExamAttempt.mockResolvedValue(attempt);
      const { result } = renderHook(() => useExamSubmission(true, examWithNoQuestions));

      // Empty answers should trigger validation error, not proceed to submission
      await act(async () => {
        await result.current.submitExam({}, 'exam-123', new Date());
      });

      expect(result.current.scorePercentage).toBe(0);
    });

    it('should handle null exam', () => {
      const { result } = renderHook(() => useExamSubmission(true, null));

      expect(result.current.scorePercentage).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should clear submission error', async () => {
      const { result } = renderHook(() => useExamSubmission(true, createMockExam()));

      // First set an error
      await act(async () => {
        await result.current.submitExam({}, 'exam-123', new Date());
      });

      expect(result.current.submissionError).toBeTruthy();

      // Then clear it
      act(() => {
        result.current.clearSubmissionError();
      });

      expect(result.current.submissionError).toBeNull();
    });

    it('should handle submission timeout or network errors', async () => {
      mockExamService.submitExamAttempt.mockRejectedValue(new Error('Network timeout'));

      const { result } = renderHook(() => useExamSubmission(true, createMockExam()));

      await act(async () => {
        await result.current.submitExam(createAnswersState(), 'exam-123', new Date());
      });

      expect(result.current.submissionError).toBe('Failed to submit exam. Please try again.');
      expect(consoleSpy).toHaveBeenCalledWith('Error submitting exam:', expect.any(Error));
    });

    it('should reset error state on new submission attempt', async () => {
      const { result } = renderHook(() => useExamSubmission(true, createMockExam()));

      // First submission fails
      mockExamService.submitExamAttempt.mockRejectedValueOnce(new Error('First error'));

      await act(async () => {
        await result.current.submitExam(createAnswersState(), 'exam-123', new Date());
      });

      expect(result.current.submissionError).toBeTruthy();

      // Second submission succeeds
      mockExamService.submitExamAttempt.mockResolvedValueOnce(createMockExamAttempt());

      await act(async () => {
        await result.current.submitExam(createAnswersState(), 'exam-123', new Date());
      });

      expect(result.current.submissionError).toBeNull();
    });
  });

  describe('edge cases and robustness', () => {
    it('should handle very large answer sets', async () => {
      const largeAnswers = Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [`question-${i}`, [`answer-${i}`]])
      );

      mockExamService.submitExamAttempt.mockResolvedValue(createMockExamAttempt());

      const { result } = renderHook(() => useExamSubmission(true, createMockExam()));

      await act(async () => {
        await result.current.submitExam(largeAnswers, 'exam-123', new Date());
      });

      expect(result.current.isExamSubmitted).toBe(true);
    });

    it('should handle answers with special characters', async () => {
      const specialAnswers = {
        'question-1': ['Answer with <tags> & "quotes" @#$%']
      };

      mockExamService.submitExamAttempt.mockResolvedValue(createMockExamAttempt());

      const { result } = renderHook(() => useExamSubmission(true, createMockExam()));

      await act(async () => {
        await result.current.submitExam(specialAnswers, 'exam-123', new Date());
      });

      expect(mockExamService.submitExamAttempt).toHaveBeenCalledWith(
        'exam-123',
        expect.any(String),
        expect.any(String),
        [
          {
            questionId: 'question-1',
            answerChoices: ['Answer with <tags> & "quotes" @#$%']
          }
        ]
      );
    });

    it('should handle component unmount during submission', async () => {
      let resolveSubmission: (value: any) => void;
      const submissionPromise = new Promise(resolve => {
        resolveSubmission = resolve;
      });
      mockExamService.submitExamAttempt.mockReturnValue(submissionPromise);

      const { result, unmount } = renderHook(() => useExamSubmission(true, createMockExam()));

      act(() => {
        result.current.submitExam(createAnswersState(), 'exam-123', new Date());
      });

      // Unmount before submission completes
      unmount();

      // Resolve promise after unmount - should not cause errors
      act(() => {
        resolveSubmission!(createMockExamAttempt());
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should maintain referential stability of methods', () => {
      const { result, rerender } = renderHook(() => useExamSubmission(true, createMockExam()));

      const initialMethods = {
        submitExam: result.current.submitExam,
        setShowSaveOption: result.current.setShowSaveOption,
        handleSignInToSave: result.current.handleSignInToSave,
        clearSubmissionError: result.current.clearSubmissionError
      };

      // Trigger rerender
      rerender();

      expect(result.current.submitExam).toBe(initialMethods.submitExam);
      expect(result.current.setShowSaveOption).toBe(initialMethods.setShowSaveOption);
      expect(result.current.handleSignInToSave).toBe(initialMethods.handleSignInToSave);
      expect(result.current.clearSubmissionError).toBe(initialMethods.clearSubmissionError);
    });

    it('should handle rapid submission attempts', async () => {
      mockExamService.submitExamAttempt.mockResolvedValue(createMockExamAttempt());

      const { result } = renderHook(() => useExamSubmission(true, createMockExam()));

      const answers = createAnswersState();

      // Multiple rapid submissions - only the first should succeed due to submitting guard
      await act(async () => {
        const promises = [
          result.current.submitExam(answers, 'exam-123', new Date()),
          result.current.submitExam(answers, 'exam-123', new Date()),
          result.current.submitExam(answers, 'exam-123', new Date())
        ];
        await Promise.all(promises);
      });

      expect(result.current.isExamSubmitted).toBe(true);
    });
  });
});