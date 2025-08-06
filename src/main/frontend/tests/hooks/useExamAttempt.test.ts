import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ExamService } from 'Frontend/generated/endpoints';
import { useExamAttempt } from 'Frontend/hooks/useExamAttempt';

// Mock the ExamService
vi.mock('Frontend/generated/endpoints', () => ({
  ExamService: {
    getExamById: vi.fn(),
  },
}));

const mockExamService = ExamService as any;

describe('useExamAttempt', () => {
  const mockExamId = 'exam-123';

  const createMockQuestion = (overrides = {}) => ({
    id: 'question-123',
    questionText: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswers: ['Paris'],
    isMultipleAnswers: false,
    explanation: 'Paris is the capital of France.',
    ...overrides,
  });

  const createMockExam = (overrides = {}) => ({
    id: mockExamId,
    title: 'Test Exam',
    description: 'Test exam description',
    questions: [
      createMockQuestion(),
      createMockQuestion({
        id: 'question-456',
        questionText: 'Which are programming languages?',
        options: ['JavaScript', 'HTML', 'Python', 'CSS'],
        correctAnswers: ['JavaScript', 'Python'],
        isMultipleAnswers: true,
      }),
    ],
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock Math.random for deterministic shuffling tests
    vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with loading state', () => {
      mockExamService.getExamById.mockResolvedValue(createMockExam());

      const { result } = renderHook(() => useExamAttempt(mockExamId));

      expect(result.current.exam).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.currentQuestionIndex).toBe(0);
      expect(result.current.currentQuestion).toBeUndefined();
      expect(result.current.totalQuestions).toBe(0);
    });

    it('should handle undefined examId', async () => {
      const { result } = renderHook(() => useExamAttempt(undefined));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('No exam ID provided');
      expect(result.current.exam).toBeNull();
      expect(mockExamService.getExamById).not.toHaveBeenCalled();
    });

    it('should load and process exam successfully', async () => {
      const mockExam = createMockExam();
      mockExamService.getExamById.mockResolvedValue(mockExam);

      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.exam).toBeTruthy();
      expect(result.current.error).toBeNull();
      expect(result.current.totalQuestions).toBe(2);
      expect(result.current.currentQuestion).toBeDefined();
      expect(mockExamService.getExamById).toHaveBeenCalledWith(mockExamId);
    });

    it('should handle exam not found', async () => {
      mockExamService.getExamById.mockResolvedValue(null);

      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Exam not found');
      expect(result.current.exam).toBeNull();
    });

    it('should handle exam without questions', async () => {
      const examWithoutQuestions = createMockExam({ questions: null });
      mockExamService.getExamById.mockResolvedValue(examWithoutQuestions);

      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Exam not found');
    });

    it('should handle API error', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      mockExamService.getExamById.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load exam. Please try again.');
      expect(result.current.exam).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching exam:', expect.any(Error));
    });
  });

  describe('exam processing and shuffling', () => {
    it('should shuffle questions', async () => {
      // Mock Math.random to return predictable values that will cause shuffling
      vi.mocked(Math.random)
        .mockReturnValueOnce(0.8) // Higher value to ensure shuffling
        .mockReturnValueOnce(0.2)
        .mockReturnValueOnce(0.9);

      const mockExam = createMockExam();
      mockExamService.getExamById.mockResolvedValue(mockExam);

      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.exam?.questions).toBeDefined();
      expect(result.current.exam?.questions).toHaveLength(2);
      // Questions should be shuffled (order may be different)
    });

    it('should shuffle question options', async () => {
      // Mock Math.random for predictable shuffling
      vi.mocked(Math.random).mockReturnValue(0.5); // Consistent value for testing

      const mockExam = createMockExam();
      mockExamService.getExamById.mockResolvedValue(mockExam);

      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Options should be shuffled but still contain all original options
      const firstQuestion = result.current.exam?.questions?.[0];
      expect(firstQuestion?.options).toHaveLength(4);
      expect(firstQuestion?.options).toContain('London');
      expect(firstQuestion?.options).toContain('Berlin');
      expect(firstQuestion?.options).toContain('Paris');
      expect(firstQuestion?.options).toContain('Madrid');
    });

    it('should filter out null questions', async () => {
      const examWithNullQuestions = createMockExam({
        questions: [
          createMockQuestion(),
          null,
          createMockQuestion({ id: 'question-456' }),
          undefined,
          createMockQuestion({ id: 'question-789' }),
        ],
      });
      mockExamService.getExamById.mockResolvedValue(examWithNullQuestions);

      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.totalQuestions).toBe(3);
      expect(result.current.exam?.questions?.every((q) => q != null)).toBe(true);
    });

    it('should handle questions without options', async () => {
      const examWithEmptyOptions = createMockExam({
        questions: [
          createMockQuestion({ options: null }),
          createMockQuestion({ options: undefined }),
          createMockQuestion({ options: [] }),
        ],
      });
      mockExamService.getExamById.mockResolvedValue(examWithEmptyOptions);

      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.exam?.questions?.[0]?.options).toEqual([]);
      expect(result.current.exam?.questions?.[1]?.options).toEqual([]);
      expect(result.current.exam?.questions?.[2]?.options).toEqual([]);
    });
  });

  describe('navigation functionality', () => {
    beforeEach(async () => {
      const mockExam = createMockExam();
      mockExamService.getExamById.mockResolvedValue(mockExam);
    });

    it('should navigate to next question', async () => {
      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentQuestionIndex).toBe(0);
      expect(result.current.canGoNext).toBe(true);

      act(() => {
        result.current.nextQuestion();
      });

      expect(result.current.currentQuestionIndex).toBe(1);
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.canGoPrevious).toBe(true);
    });

    it('should navigate to previous question', async () => {
      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Go to second question first
      act(() => {
        result.current.nextQuestion();
      });

      expect(result.current.currentQuestionIndex).toBe(1);

      // Then go back
      act(() => {
        result.current.previousQuestion();
      });

      expect(result.current.currentQuestionIndex).toBe(0);
    });

    it('should navigate to specific question by index', async () => {
      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.navigateToQuestion(1);
      });

      expect(result.current.currentQuestionIndex).toBe(1);

      act(() => {
        result.current.navigateToQuestion(0);
      });

      expect(result.current.currentQuestionIndex).toBe(0);
    });

    it('should not navigate beyond bounds', async () => {
      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Try to go to previous from first question
      act(() => {
        result.current.previousQuestion();
      });

      expect(result.current.currentQuestionIndex).toBe(0);

      // Go to last question
      act(() => {
        result.current.nextQuestion();
      });

      // Try to go to next from last question
      act(() => {
        result.current.nextQuestion();
      });

      expect(result.current.currentQuestionIndex).toBe(1);
    });

    it('should not navigate to invalid indices', async () => {
      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialIndex = result.current.currentQuestionIndex;

      // Try to navigate to negative index
      act(() => {
        result.current.navigateToQuestion(-1);
      });

      expect(result.current.currentQuestionIndex).toBe(initialIndex);

      // Try to navigate to index beyond array length
      act(() => {
        result.current.navigateToQuestion(10);
      });

      expect(result.current.currentQuestionIndex).toBe(initialIndex);
    });

    it('should handle navigation when exam is null', () => {
      const { result } = renderHook(() => useExamAttempt(undefined));

      expect(() => {
        act(() => {
          result.current.nextQuestion();
          result.current.previousQuestion();
          result.current.navigateToQuestion(1);
        });
      }).not.toThrow();

      expect(result.current.currentQuestionIndex).toBe(0);
    });

    it('should update current question when navigating', async () => {
      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const firstQuestion = result.current.currentQuestion;
      expect(firstQuestion).toBeDefined();

      act(() => {
        result.current.nextQuestion();
      });

      const secondQuestion = result.current.currentQuestion;
      expect(secondQuestion).toBeDefined();
      expect(secondQuestion?.id).not.toBe(firstQuestion?.id);
    });
  });

  describe('computed properties', () => {
    beforeEach(async () => {
      const mockExam = createMockExam();
      mockExamService.getExamById.mockResolvedValue(mockExam);
    });

    it('should calculate navigation capabilities correctly', async () => {
      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // At first question
      expect(result.current.canGoPrevious).toBe(false);
      expect(result.current.canGoNext).toBe(true);

      // Navigate to last question
      act(() => {
        result.current.navigateToQuestion(1);
      });

      expect(result.current.canGoPrevious).toBe(true);
      expect(result.current.canGoNext).toBe(false);
    });

    it('should return correct total questions count', async () => {
      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.totalQuestions).toBe(2);
    });

    it('should handle exam with no questions', async () => {
      const examWithNoQuestions = createMockExam({ questions: [] });
      mockExamService.getExamById.mockResolvedValue(examWithNoQuestions);

      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.totalQuestions).toBe(0);
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.canGoPrevious).toBe(false);
      expect(result.current.currentQuestion).toBeUndefined();
    });

    it('should handle single question exam', async () => {
      const singleQuestionExam = createMockExam({
        questions: [createMockQuestion()],
      });
      mockExamService.getExamById.mockResolvedValue(singleQuestionExam);

      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.totalQuestions).toBe(1);
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.canGoPrevious).toBe(false);
      expect(result.current.currentQuestion).toBeDefined();
    });
  });

  describe('shuffling algorithm', () => {
    it('should properly shuffle arrays (verified by content, not order)', async () => {
      const originalQuestions = [
        createMockQuestion({ id: 'q1', options: ['A', 'B', 'C', 'D'] }),
        createMockQuestion({ id: 'q2', options: ['W', 'X', 'Y', 'Z'] }),
        createMockQuestion({ id: 'q3', options: ['1', '2', '3', '4'] }),
      ];

      const mockExam = createMockExam({ questions: originalQuestions });
      mockExamService.getExamById.mockResolvedValue(mockExam);

      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify questions are still present (even if shuffled)
      expect(result.current.totalQuestions).toBe(3);
      
      // Verify all original question IDs are present
      const resultQuestionIds = result.current.exam?.questions?.map(q => q!.id) || [];
      expect(resultQuestionIds).toContain('q1');
      expect(resultQuestionIds).toContain('q2');
      expect(resultQuestionIds).toContain('q3');

      // Verify options are shuffled but complete
      result.current.exam?.questions?.forEach((question, index) => {
        const originalOptions = originalQuestions.find(q => q.id === question!.id)?.options || [];
        expect(question!.options).toHaveLength(originalOptions.length);
        expect(question!.options).toEqual(expect.arrayContaining(originalOptions));
      });
    });

    it('should not mutate original arrays', async () => {
      const originalQuestions = [
        createMockQuestion({ id: 'q1', options: ['A', 'B', 'C', 'D'] }),
        createMockQuestion({ id: 'q2', options: ['W', 'X', 'Y', 'Z'] }),
      ];

      const mockExam = createMockExam({ questions: originalQuestions });
      mockExamService.getExamById.mockResolvedValue(mockExam);

      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Original exam should not be modified
      expect(mockExam.questions[0].options).toEqual(['A', 'B', 'C', 'D']);
      expect(mockExam.questions[1].options).toEqual(['W', 'X', 'Y', 'Z']);
    });

    it('should handle empty arrays gracefully', async () => {
      const examWithEmptyQuestions = createMockExam({ questions: [] });
      mockExamService.getExamById.mockResolvedValue(examWithEmptyQuestions);

      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.totalQuestions).toBe(0);
      expect(result.current.exam?.questions).toEqual([]);
    });
  });

  describe('examId changes', () => {
    it('should reload exam when examId changes', async () => {
      const firstExam = createMockExam({ id: 'exam-1', title: 'First Exam' });
      const secondExam = createMockExam({ id: 'exam-2', title: 'Second Exam' });

      mockExamService.getExamById.mockResolvedValueOnce(firstExam).mockResolvedValueOnce(secondExam);

      const { result, rerender } = renderHook(({ examId }) => useExamAttempt(examId), {
        initialProps: { examId: 'exam-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.exam?.title).toBe('First Exam');

      // Change examId
      rerender({ examId: 'exam-2' });

      await waitFor(() => {
        expect(result.current.exam?.title).toBe('Second Exam');
      });

      expect(mockExamService.getExamById).toHaveBeenCalledTimes(2);
      expect(mockExamService.getExamById).toHaveBeenLastCalledWith('exam-2');
    });

    it('should reset current question index when exam changes', async () => {
      const firstExam = createMockExam({ id: 'exam-1' });
      const secondExam = createMockExam({ id: 'exam-2' });

      mockExamService.getExamById.mockResolvedValueOnce(firstExam).mockResolvedValueOnce(secondExam);

      const { result, rerender } = renderHook(({ examId }) => useExamAttempt(examId), {
        initialProps: { examId: 'exam-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Navigate to second question
      act(() => {
        result.current.nextQuestion();
      });

      expect(result.current.currentQuestionIndex).toBe(1);

      // Change examId
      rerender({ examId: 'exam-2' });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should reset to first question
      expect(result.current.currentQuestionIndex).toBe(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle component unmount during loading', async () => {
      vi.useFakeTimers();

      let resolveExam: (value: any) => void;
      const examPromise = new Promise((resolve) => {
        resolveExam = resolve;
      });
      mockExamService.getExamById.mockReturnValue(examPromise);

      const { result, unmount } = renderHook(() => useExamAttempt(mockExamId));

      expect(result.current.loading).toBe(true);

      // Unmount before exam loads
      unmount();

      // Resolve promise after unmount
      act(() => {
        resolveExam!(createMockExam());
      });

      // Should not cause errors
      expect(() => {
        vi.advanceTimersByTime(100);
      }).not.toThrow();

      vi.useRealTimers();
    });

    it('should handle navigation with questions containing malformed data', async () => {
      const examWithMalformedQuestions = createMockExam({
        questions: [
          { ...createMockQuestion(), id: null }, // Malformed ID
          createMockQuestion({ options: 'not-an-array' as any }), // Malformed options
          createMockQuestion(), // Valid question
        ],
      });
      mockExamService.getExamById.mockResolvedValue(examWithMalformedQuestions);

      const { result } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still work with whatever questions were processed
      expect(result.current.totalQuestions).toBeGreaterThan(0);
      expect(() => {
        act(() => {
          result.current.nextQuestion();
        });
      }).not.toThrow();
    });

    it('should maintain referential stability of navigation methods', async () => {
      mockExamService.getExamById.mockResolvedValue(createMockExam());

      const { result, rerender } = renderHook(() => useExamAttempt(mockExamId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialMethods = {
        nextQuestion: result.current.nextQuestion,
        previousQuestion: result.current.previousQuestion,
        navigateToQuestion: result.current.navigateToQuestion,
      };

      // Trigger rerender
      rerender();

      expect(result.current.nextQuestion).toBe(initialMethods.nextQuestion);
      expect(result.current.previousQuestion).toBe(initialMethods.previousQuestion);
      expect(result.current.navigateToQuestion).toBe(initialMethods.navigateToQuestion);
    });
  });
});