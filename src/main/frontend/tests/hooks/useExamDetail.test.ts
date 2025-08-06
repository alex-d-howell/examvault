import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ExamService } from 'Frontend/generated/endpoints';
import { useExamDetail } from 'Frontend/hooks/useExamDetail';
import { mockNavigate } from '../setupTests';

// Mock the ExamService
vi.mock('Frontend/generated/endpoints', () => ({
  ExamService: {
    getExamById: vi.fn(),
    canUserModifyExam: vi.fn()
  }
}));

const mockExamService = ExamService as any;

describe('useExamDetail', () => {
  const mockExamId = 'exam-123';

  const createMockQuestion = (overrides = {}) => ({
    id: 'question-123',
    questionText: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswers: ['Paris'],
    isMultipleAnswers: false,
    explanation: 'Paris is the capital of France.',
    ...overrides
  });

  const createMockExam = (overrides = {}) => ({
    id: mockExamId,
    title: 'Test Exam',
    description: 'Test exam description',
    uploadedBy: 'Test Author',
    uploadedAt: '2024-01-01T00:00:00Z',
    tags: ['javascript', 'react', 'testing'],
    questions: [
      createMockQuestion(),
      createMockQuestion({ 
        id: 'question-456', 
        questionText: 'Which are programming languages?',
        options: ['JavaScript', 'HTML', 'Python', 'CSS'],
        correctAnswers: ['JavaScript', 'Python'],
        isMultipleAnswers: true
      })
    ],
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers(); // Clean up any fake timers
  });

  describe('initialization', () => {
    it('should initialize with loading states', () => {
      mockExamService.getExamById.mockResolvedValue(createMockExam());
      mockExamService.canUserModifyExam.mockResolvedValue(false);

      const { result } = renderHook(() => useExamDetail(mockExamId, true));

      expect(result.current.exam).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.canEdit).toBe(false);
      expect(result.current.checkingPermissions).toBe(true);
      expect(result.current.expandedQuestions).toEqual(new Set());
    });

    it('should handle undefined examId', async () => {
      const { result } = renderHook(() => useExamDetail(undefined, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('No exam ID provided');
      expect(result.current.exam).toBeNull();
      expect(result.current.checkingPermissions).toBe(false);
      expect(mockExamService.getExamById).not.toHaveBeenCalled();
      expect(mockExamService.canUserModifyExam).not.toHaveBeenCalled();
    });

    it('should load exam and check permissions when authenticated', async () => {
      const mockExam = createMockExam();
      mockExamService.getExamById.mockResolvedValue(mockExam);
      mockExamService.canUserModifyExam.mockResolvedValue(true);

      const { result } = renderHook(() => useExamDetail(mockExamId, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.exam).toEqual(mockExam);
      expect(result.current.error).toBeNull();
      expect(result.current.canEdit).toBe(true);
      expect(result.current.checkingPermissions).toBe(false);
      expect(mockExamService.getExamById).toHaveBeenCalledWith(mockExamId);
      expect(mockExamService.canUserModifyExam).toHaveBeenCalledWith(mockExamId);
    });

    it('should load exam without checking permissions when not authenticated', async () => {
      const mockExam = createMockExam();
      mockExamService.getExamById.mockResolvedValue(mockExam);

      const { result } = renderHook(() => useExamDetail(mockExamId, false));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.exam).toEqual(mockExam);
      expect(result.current.canEdit).toBe(false);
      expect(result.current.checkingPermissions).toBe(false);
      expect(mockExamService.getExamById).toHaveBeenCalledWith(mockExamId);
      expect(mockExamService.canUserModifyExam).not.toHaveBeenCalled();
    });

    it('should handle exam not found', async () => {
      mockExamService.getExamById.mockResolvedValue(null);

      const { result } = renderHook(() => useExamDetail(mockExamId, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Exam not found');
      expect(result.current.exam).toBeNull();
      expect(result.current.canEdit).toBe(false);
    });

    it('should handle exam fetch error', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      mockExamService.getExamById.mockRejectedValue(new Error('Fetch failed'));

      const { result } = renderHook(() => useExamDetail(mockExamId, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load exam. Please try again.');
      expect(result.current.exam).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching exam:', expect.any(Error));
    });

    it('should handle permission check error', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const mockExam = createMockExam();
      mockExamService.getExamById.mockResolvedValue(mockExam);
      mockExamService.canUserModifyExam.mockRejectedValue(new Error('Permission check failed'));

      const { result } = renderHook(() => useExamDetail(mockExamId, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.exam).toEqual(mockExam);
      expect(result.current.canEdit).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error checking edit permissions:', expect.any(Error));
    });
  });

  describe('question management', () => {
    beforeEach(async () => {
      const mockExam = createMockExam();
      mockExamService.getExamById.mockResolvedValue(mockExam);
      mockExamService.canUserModifyExam.mockResolvedValue(false);
    });

    it('should toggle question expansion', async () => {
      const { result } = renderHook(() => useExamDetail(mockExamId, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const questionId = 'question-123';

      // Expand question
      act(() => {
        result.current.toggleQuestion(questionId);
      });

      expect(result.current.expandedQuestions.has(questionId)).toBe(true);

      // Collapse question
      act(() => {
        result.current.toggleQuestion(questionId);
      });

      expect(result.current.expandedQuestions.has(questionId)).toBe(false);
    });

    it('should handle multiple expanded questions', async () => {
      const { result } = renderHook(() => useExamDetail(mockExamId, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const questionId1 = 'question-123';
      const questionId2 = 'question-456';

      // Expand both questions in separate act calls
      act(() => {
        result.current.toggleQuestion(questionId1);
      });

      act(() => {
        result.current.toggleQuestion(questionId2);
      });

      expect(result.current.expandedQuestions.has(questionId1)).toBe(true);
      expect(result.current.expandedQuestions.has(questionId2)).toBe(true);

      // Collapse first question
      act(() => {
        result.current.toggleQuestion(questionId1);
      });

      expect(result.current.expandedQuestions.has(questionId1)).toBe(false);
      expect(result.current.expandedQuestions.has(questionId2)).toBe(true);
    });

    it('should identify correct answers', async () => {
      const { result } = renderHook(() => useExamDetail(mockExamId, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const question = createMockQuestion({
        correctAnswers: ['Paris', 'London']
      });

      expect(result.current.isCorrectAnswer('Paris', question)).toBe(true);
      expect(result.current.isCorrectAnswer('London', question)).toBe(true);
      expect(result.current.isCorrectAnswer('Berlin', question)).toBe(false);
      expect(result.current.isCorrectAnswer('Madrid', question)).toBe(false);
    });

    it('should handle question with no correct answers', async () => {
      const { result } = renderHook(() => useExamDetail(mockExamId, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const question = createMockQuestion({
        correctAnswers: undefined
      });

      expect(result.current.isCorrectAnswer('Paris', question)).toBe(false);
      expect(result.current.isCorrectAnswer('London', question)).toBe(false);
    });

    it('should handle question with empty correct answers array', async () => {
      const { result } = renderHook(() => useExamDetail(mockExamId, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const question = createMockQuestion({
        correctAnswers: []
      });

      expect(result.current.isCorrectAnswer('Paris', question)).toBe(false);
    });
  });

  describe('navigation helpers', () => {
    beforeEach(async () => {
      const mockExam = createMockExam();
      mockExamService.getExamById.mockResolvedValue(mockExam);
      mockExamService.canUserModifyExam.mockResolvedValue(false);
    });

    it('should navigate to exam search with tag filter', async () => {
      const { result } = renderHook(() => useExamDetail(mockExamId, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleTagClick('javascript');
      });

      expect(mockNavigate).toHaveBeenCalledWith('/exams', {
        state: { searchTags: ['javascript'] }
      });
    });

    it('should navigate to exam attempt page', async () => {
      const { result } = renderHook(() => useExamDetail(mockExamId, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.navigateToAttempt();
      });

      expect(mockNavigate).toHaveBeenCalledWith(`/exams/${mockExamId}/attempt`);
    });

    it('should navigate to exam edit page', async () => {
      const { result } = renderHook(() => useExamDetail(mockExamId, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.navigateToEdit();
      });

      expect(mockNavigate).toHaveBeenCalledWith(`/exams/${mockExamId}/edit`);
    });

    it('should handle navigation when exam has no ID', async () => {
      const examWithoutId = createMockExam({ id: undefined });
      mockExamService.getExamById.mockResolvedValue(examWithoutId);

      const { result } = renderHook(() => useExamDetail(mockExamId, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.navigateToAttempt();
        result.current.navigateToEdit();
      });

      // Should not navigate if exam has no ID
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('computed properties', () => {
    it('should calculate exam statistics', async () => {
      const mockExam = createMockExam({
        questions: [
          createMockQuestion({ isMultipleAnswers: false }),
          createMockQuestion({ isMultipleAnswers: false }),
          createMockQuestion({ isMultipleAnswers: true }),
          createMockQuestion({ isMultipleAnswers: true }),
          createMockQuestion({ isMultipleAnswers: false })
        ]
      });
      mockExamService.getExamById.mockResolvedValue(mockExam);

      const { result } = renderHook(() => useExamDetail(mockExamId, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.examStats.totalQuestions).toBe(5);
      expect(result.current.examStats.multipleChoiceCount).toBe(3);
      expect(result.current.examStats.multipleAnswerCount).toBe(2);
    });

    it('should handle exam with no questions', async () => {
      const mockExam = createMockExam({ questions: null });
      mockExamService.getExamById.mockResolvedValue(mockExam);

      const { result } = renderHook(() => useExamDetail(mockExamId, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.examStats.totalQuestions).toBe(0);
      expect(result.current.examStats.multipleChoiceCount).toBe(0);
      expect(result.current.examStats.multipleAnswerCount).toBe(0);
    });

    it('should handle exam with empty questions array', async () => {
      const mockExam = createMockExam({ questions: [] });
      mockExamService.getExamById.mockResolvedValue(mockExam);

      const { result } = renderHook(() => useExamDetail(mockExamId, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.examStats.totalQuestions).toBe(0);
      expect(result.current.examStats.multipleChoiceCount).toBe(0);
      expect(result.current.examStats.multipleAnswerCount).toBe(0);
    });

    it('should filter and process selected tags', async () => {
      const mockExam = createMockExam({
        tags: ['javascript', null, 'react', undefined, 'testing', '']
      });
      mockExamService.getExamById.mockResolvedValue(mockExam);

      const { result } = renderHook(() => useExamDetail(mockExamId, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.selectedTags).toEqual(['javascript', 'react', 'testing', '']);
    });

    it('should handle exam with no tags', async () => {
      const mockExam = createMockExam({ tags: null });
      mockExamService.getExamById.mockResolvedValue(mockExam);

      const { result } = renderHook(() => useExamDetail(mockExamId, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.selectedTags).toEqual([]);
    });

    it('should handle exam with empty tags array', async () => {
      const mockExam = createMockExam({ tags: [] });
      mockExamService.getExamById.mockResolvedValue(mockExam);

      const { result } = renderHook(() => useExamDetail(mockExamId, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.selectedTags).toEqual([]);
    });
  });

  describe('authentication state changes', () => {
    it('should recheck permissions when authentication changes', async () => {
      const mockExam = createMockExam();
      mockExamService.getExamById.mockResolvedValue(mockExam);
      mockExamService.canUserModifyExam.mockResolvedValue(true);

      const { result, rerender } = renderHook(
        ({ authenticated }) => useExamDetail(mockExamId, authenticated),
        { initialProps: { authenticated: false } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canEdit).toBe(false);
      expect(mockExamService.canUserModifyExam).not.toHaveBeenCalled();

      // Change to authenticated
      rerender({ authenticated: true });

      await waitFor(() => {
        expect(result.current.checkingPermissions).toBe(false);
      });

      expect(result.current.canEdit).toBe(true);
      expect(mockExamService.canUserModifyExam).toHaveBeenCalledWith(mockExamId);
    });

    it('should reset edit permissions when becoming unauthenticated', async () => {
      const mockExam = createMockExam();
      mockExamService.getExamById.mockResolvedValue(mockExam);
      mockExamService.canUserModifyExam.mockResolvedValue(true);

      const { result, rerender } = renderHook(
        ({ authenticated }) => useExamDetail(mockExamId, authenticated),
        { initialProps: { authenticated: true } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canEdit).toBe(true);

      // Change to unauthenticated
      rerender({ authenticated: false });

      await waitFor(() => {
        expect(result.current.checkingPermissions).toBe(false);
      });

      expect(result.current.canEdit).toBe(false);
    });
  });

  describe('examId changes', () => {
    it('should reload exam when examId changes', async () => {
      const firstExam = createMockExam({ id: 'exam-1', title: 'First Exam' });
      const secondExam = createMockExam({ id: 'exam-2', title: 'Second Exam' });

      mockExamService.getExamById
        .mockResolvedValueOnce(firstExam)
        .mockResolvedValueOnce(secondExam);
      mockExamService.canUserModifyExam.mockResolvedValue(false);

      const { result, rerender } = renderHook(
        ({ examId }) => useExamDetail(examId, true),
        { initialProps: { examId: 'exam-1' } }
      );

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

    it('should reset expanded questions when exam changes', async () => {
      const firstExam = createMockExam({ id: 'exam-1' });
      const secondExam = createMockExam({ id: 'exam-2' });

      mockExamService.getExamById
        .mockResolvedValueOnce(firstExam)
        .mockResolvedValueOnce(secondExam);
      mockExamService.canUserModifyExam.mockResolvedValue(false);

      const { result, rerender } = renderHook(
        ({ examId }) => useExamDetail(examId, true),
        { initialProps: { examId: 'exam-1' } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Expand a question
      act(() => {
        result.current.toggleQuestion('question-123');
      });

      expect(result.current.expandedQuestions.has('question-123')).toBe(true);

      // Change examId - this should trigger the useEffect that resets state
      rerender({ examId: 'exam-2' });

      // Wait for the new exam to load completely
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.exam?.id).toBe('exam-2');
      });

      // Expanded questions should be reset when the effect runs
      // The hook should reset expanded questions when examId changes
      // If this test is still failing, it means the hook needs to be updated
      // to reset expandedQuestions in the useEffect when examId changes
      expect(result.current.expandedQuestions.size).toBe(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle component unmount during loading', async () => {
      vi.useFakeTimers(); // Enable fake timers for this test
      
      let resolveExam: (value: any) => void;
      const examPromise = new Promise(resolve => {
        resolveExam = resolve;
      });
      mockExamService.getExamById.mockReturnValue(examPromise);

      const { result, unmount } = renderHook(() => useExamDetail(mockExamId, true));

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
    });

    it('should handle malformed question data', async () => {
      const examWithMalformedQuestions = createMockExam({
        questions: [
          { ...createMockQuestion(), isMultipleAnswers: null }, // Malformed property
          createMockQuestion({ correctAnswers: 'not-an-array' as any }), // Malformed answers
          createMockQuestion() // Valid question
        ]
      });
      mockExamService.getExamById.mockResolvedValue(examWithMalformedQuestions);

      const { result } = renderHook(() => useExamDetail(mockExamId, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should handle malformed data gracefully
      expect(() => {
        result.current.examStats.totalQuestions;
        result.current.examStats.multipleChoiceCount;
        result.current.examStats.multipleAnswerCount;
      }).not.toThrow();
    });

    it('should maintain referential stability of methods', async () => {
      mockExamService.getExamById.mockResolvedValue(createMockExam());
      mockExamService.canUserModifyExam.mockResolvedValue(false);

      const { result, rerender } = renderHook(() => useExamDetail(mockExamId, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialMethods = {
        toggleQuestion: result.current.toggleQuestion,
        isCorrectAnswer: result.current.isCorrectAnswer,
        handleTagClick: result.current.handleTagClick,
        navigateToAttempt: result.current.navigateToAttempt,
        navigateToEdit: result.current.navigateToEdit
      };

      // Trigger rerender
      rerender();

      expect(result.current.toggleQuestion).toBe(initialMethods.toggleQuestion);
      expect(result.current.isCorrectAnswer).toBe(initialMethods.isCorrectAnswer);
      expect(result.current.handleTagClick).toBe(initialMethods.handleTagClick);
      expect(result.current.navigateToAttempt).toBe(initialMethods.navigateToAttempt);
      expect(result.current.navigateToEdit).toBe(initialMethods.navigateToEdit);
    });

    it('should handle simultaneous authentication and examId changes', async () => {
      const mockExam = createMockExam();
      mockExamService.getExamById.mockResolvedValue(mockExam);
      mockExamService.canUserModifyExam.mockResolvedValue(true);

      const { result, rerender } = renderHook(
        ({ examId, authenticated }) => useExamDetail(examId, authenticated),
        { initialProps: { examId: 'exam-1', authenticated: false } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Change both examId and authentication simultaneously
      rerender({ examId: 'exam-2', authenticated: true });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.checkingPermissions).toBe(false);
      });

      expect(result.current.canEdit).toBe(true);
      expect(mockExamService.getExamById).toHaveBeenCalledWith('exam-2');
      expect(mockExamService.canUserModifyExam).toHaveBeenCalledWith('exam-2');
    });
  });
});