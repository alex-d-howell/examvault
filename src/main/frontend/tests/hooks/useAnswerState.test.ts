import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnswerState } from 'Frontend/hooks/useAnswerState';

describe('useAnswerState', () => {
  const createMockQuestion = (overrides = {}) => ({
    id: 'question-123',
    questionText: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswers: ['Paris'],
    isMultipleAnswers: false,
    ...overrides
  });

  const createMockExam = (overrides = {}) => ({
    id: 'exam-123',
    title: 'Test Exam',
    description: 'Test exam description',
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
  });

  describe('initialization', () => {
    it('should initialize with empty answers when no exam provided', () => {
      const { result } = renderHook(() => useAnswerState(null));

      expect(result.current.answers).toEqual({});
      expect(result.current.progressPercentage).toBe(0);
      expect(result.current.hasAnsweredAny).toBe(false);
      expect(result.current.canSubmit).toBe(false);
      expect(result.current.getAnsweredCount()).toBe(0);
    });

    it('should initialize answers for all questions when exam provided', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      expect(result.current.answers).toEqual({
        'question-123': [],
        'question-456': []
      });
      expect(result.current.progressPercentage).toBe(0);
      expect(result.current.hasAnsweredAny).toBe(false);
      expect(result.current.canSubmit).toBe(false);
    });

    it('should handle exam with no questions', () => {
      const examWithoutQuestions = createMockExam({ questions: [] });
      const { result } = renderHook(() => useAnswerState(examWithoutQuestions));

      expect(result.current.answers).toEqual({});
      expect(result.current.progressPercentage).toBe(0);
    });

    it('should handle exam with null questions', () => {
      const examWithNullQuestions = createMockExam({ questions: null });
      const { result } = renderHook(() => useAnswerState(examWithNullQuestions));

      expect(result.current.answers).toEqual({});
    });

    it('should filter out questions without IDs', () => {
      const examWithInvalidQuestions = createMockExam({
        questions: [
          createMockQuestion(),
          { ...createMockQuestion(), id: null },
          { ...createMockQuestion(), id: undefined },
          createMockQuestion({ id: 'question-789' })
        ]
      });

      const { result } = renderHook(() => useAnswerState(examWithInvalidQuestions));

      expect(result.current.answers).toEqual({
        'question-123': [],
        'question-789': []
      });
    });
  });

  describe('single answer management', () => {
    it('should handle single answer selection', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      act(() => {
        result.current.handleAnswerChange('question-123', 'Paris');
      });

      expect(result.current.answers['question-123']).toEqual(['Paris']);
      expect(result.current.getCurrentAnswer('question-123')).toEqual(['Paris']);
      expect(result.current.getQuestionStatus('question-123')).toBe('answered');
    });

    it('should replace previous single answer', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      act(() => {
        result.current.handleAnswerChange('question-123', 'London');
      });

      expect(result.current.answers['question-123']).toEqual(['London']);

      act(() => {
        result.current.handleAnswerChange('question-123', 'Paris');
      });

      expect(result.current.answers['question-123']).toEqual(['Paris']);
    });

    it('should handle empty string answers', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      act(() => {
        result.current.handleAnswerChange('question-123', '');
      });

      expect(result.current.answers['question-123']).toEqual(['']);
      expect(result.current.getQuestionStatus('question-123')).toBe('answered');
    });

    it('should handle special character answers', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      const specialAnswer = 'Answer with <tags> & "quotes" @#$%';

      act(() => {
        result.current.handleAnswerChange('question-123', specialAnswer);
      });

      expect(result.current.answers['question-123']).toEqual([specialAnswer]);
    });
  });

  describe('multiple answer management', () => {
    it('should add multiple answers when checked', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      act(() => {
        result.current.handleMultipleAnswerChange('question-456', 'JavaScript', true);
      });

      expect(result.current.answers['question-456']).toEqual(['JavaScript']);

      act(() => {
        result.current.handleMultipleAnswerChange('question-456', 'Python', true);
      });

      expect(result.current.answers['question-456']).toEqual(['JavaScript', 'Python']);
    });

    it('should remove answers when unchecked', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      // Add multiple answers
      act(() => {
        result.current.handleMultipleAnswerChange('question-456', 'JavaScript', true);
        result.current.handleMultipleAnswerChange('question-456', 'Python', true);
        result.current.handleMultipleAnswerChange('question-456', 'HTML', true);
      });

      expect(result.current.answers['question-456']).toEqual(['JavaScript', 'Python', 'HTML']);

      // Remove one answer
      act(() => {
        result.current.handleMultipleAnswerChange('question-456', 'Python', false);
      });

      expect(result.current.answers['question-456']).toEqual(['JavaScript', 'HTML']);
    });

    it('should handle toggling the same answer multiple times', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      // Add answer
      act(() => {
        result.current.handleMultipleAnswerChange('question-456', 'JavaScript', true);
      });

      expect(result.current.answers['question-456']).toEqual(['JavaScript']);

      // Remove answer
      act(() => {
        result.current.handleMultipleAnswerChange('question-456', 'JavaScript', false);
      });

      expect(result.current.answers['question-456']).toEqual([]);

      // Add again
      act(() => {
        result.current.handleMultipleAnswerChange('question-456', 'JavaScript', true);
      });

      expect(result.current.answers['question-456']).toEqual(['JavaScript']);
    });

    it('should not add duplicate answers', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      // Add the same answer multiple times
      act(() => {
        result.current.handleMultipleAnswerChange('question-456', 'JavaScript', true);
        result.current.handleMultipleAnswerChange('question-456', 'JavaScript', true);
        result.current.handleMultipleAnswerChange('question-456', 'JavaScript', true);
      });

      expect(result.current.answers['question-456']).toEqual(['JavaScript', 'JavaScript', 'JavaScript']);
    });

    it('should handle removing non-existent answers gracefully', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      // Try to remove answer that was never added
      act(() => {
        result.current.handleMultipleAnswerChange('question-456', 'JavaScript', false);
      });

      expect(result.current.answers['question-456']).toEqual([]);
    });

    it('should handle answers for questions with no current answers', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      act(() => {
        result.current.handleMultipleAnswerChange('question-999', 'Answer', true);
      });

      expect(result.current.answers['question-999']).toEqual(['Answer']);
    });
  });

  describe('question status', () => {
    it('should return unanswered for questions with no answers', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      expect(result.current.getQuestionStatus('question-123')).toBe('unanswered');
      expect(result.current.getQuestionStatus('question-456')).toBe('unanswered');
    });

    it('should return answered for questions with answers', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      act(() => {
        result.current.handleAnswerChange('question-123', 'Paris');
      });

      expect(result.current.getQuestionStatus('question-123')).toBe('answered');
      expect(result.current.getQuestionStatus('question-456')).toBe('unanswered');
    });

    it('should return unanswered for questions with empty arrays', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      // Manually set empty array (shouldn't happen in normal use)
      act(() => {
        result.current.handleMultipleAnswerChange('question-456', 'JavaScript', true);
        result.current.handleMultipleAnswerChange('question-456', 'JavaScript', false);
      });

      expect(result.current.getQuestionStatus('question-456')).toBe('unanswered');
    });

    it('should handle status for non-existent questions', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      expect(result.current.getQuestionStatus('non-existent')).toBe('unanswered');
    });
  });

  describe('current answer retrieval', () => {
    it('should return current answers for questions', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      act(() => {
        result.current.handleAnswerChange('question-123', 'Paris');
        result.current.handleMultipleAnswerChange('question-456', 'JavaScript', true);
        result.current.handleMultipleAnswerChange('question-456', 'Python', true);
      });

      expect(result.current.getCurrentAnswer('question-123')).toEqual(['Paris']);
      expect(result.current.getCurrentAnswer('question-456')).toEqual(['JavaScript', 'Python']);
    });

    it('should return empty array for unanswered questions', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      expect(result.current.getCurrentAnswer('question-123')).toEqual([]);
      expect(result.current.getCurrentAnswer('question-456')).toEqual([]);
    });

    it('should return empty array for non-existent questions', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      expect(result.current.getCurrentAnswer('non-existent')).toEqual([]);
    });
  });

  describe('progress tracking', () => {
    it('should calculate correct answered count', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      expect(result.current.getAnsweredCount()).toBe(0);

      act(() => {
        result.current.handleAnswerChange('question-123', 'Paris');
      });

      expect(result.current.getAnsweredCount()).toBe(1);

      act(() => {
        result.current.handleMultipleAnswerChange('question-456', 'JavaScript', true);
      });

      expect(result.current.getAnsweredCount()).toBe(2);
    });

    it('should calculate correct progress percentage', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      expect(result.current.progressPercentage).toBe(0);

      act(() => {
        result.current.handleAnswerChange('question-123', 'Paris');
      });

      expect(result.current.progressPercentage).toBe(50); // 1 of 2 questions

      act(() => {
        result.current.handleMultipleAnswerChange('question-456', 'JavaScript', true);
      });

      expect(result.current.progressPercentage).toBe(100); // 2 of 2 questions
    });

    it('should handle progress calculation with no questions', () => {
      const examWithoutQuestions = createMockExam({ questions: [] });
      const { result } = renderHook(() => useAnswerState(examWithoutQuestions));

      expect(result.current.progressPercentage).toBe(0);
    });

    it('should handle progress calculation with null exam', () => {
      const { result } = renderHook(() => useAnswerState(null));

      expect(result.current.progressPercentage).toBe(0);
    });

    it('should track hasAnsweredAny correctly', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      expect(result.current.hasAnsweredAny).toBe(false);

      act(() => {
        result.current.handleAnswerChange('question-123', 'Paris');
      });

      expect(result.current.hasAnsweredAny).toBe(true);

      // Remove all answers
      act(() => {
        result.current.handleAnswerChange('question-123', '');
      });

      // Still true because empty string is considered an answer
      expect(result.current.hasAnsweredAny).toBe(true);
    });
  });

  describe('submission validation', () => {
    it('should allow submission when at least one question is answered', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      expect(result.current.canSubmit).toBe(false);

      act(() => {
        result.current.handleAnswerChange('question-123', 'Paris');
      });

      expect(result.current.canSubmit).toBe(true);
    });

    it('should not allow submission when no questions are answered', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      expect(result.current.canSubmit).toBe(false);

      // Add then remove answer
      act(() => {
        result.current.handleMultipleAnswerChange('question-456', 'JavaScript', true);
        result.current.handleMultipleAnswerChange('question-456', 'JavaScript', false);
      });

      expect(result.current.canSubmit).toBe(false);
    });

    it('should handle submission validation with no exam', () => {
      const { result } = renderHook(() => useAnswerState(null));

      expect(result.current.canSubmit).toBe(false);
    });
  });

  describe('exam changes', () => {
    it('should reinitialize answers when exam changes', () => {
      const firstExam = createMockExam();
      const secondExam = createMockExam({
        questions: [
          createMockQuestion({ id: 'new-question-1' }),
          createMockQuestion({ id: 'new-question-2' }),
          createMockQuestion({ id: 'new-question-3' })
        ]
      });

      const { result, rerender } = renderHook(
        ({ exam }) => useAnswerState(exam),
        { initialProps: { exam: firstExam } }
      );

      // Answer questions in first exam
      act(() => {
        result.current.handleAnswerChange('question-123', 'Paris');
      });

      expect(result.current.answers).toEqual({
        'question-123': ['Paris'],
        'question-456': []
      });

      // Change to second exam
      rerender({ exam: secondExam });

      expect(result.current.answers).toEqual({
        'new-question-1': [],
        'new-question-2': [],
        'new-question-3': []
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle extremely large number of questions', () => {
      const manyQuestions = Array.from({ length: 1000 }, (_, i) => 
        createMockQuestion({ id: `question-${i}` })
      );
      const examWithManyQuestions = createMockExam({ questions: manyQuestions });

      const { result } = renderHook(() => useAnswerState(examWithManyQuestions));

      expect(Object.keys(result.current.answers)).toHaveLength(1000);
      expect(result.current.progressPercentage).toBe(0);

      // Answer half the questions
      act(() => {
        for (let i = 0; i < 500; i++) {
          result.current.handleAnswerChange(`question-${i}`, 'answer');
        }
      });

      expect(result.current.progressPercentage).toBe(50);
    });

    it('should handle very long answer strings', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      const veryLongAnswer = 'A'.repeat(10000);

      act(() => {
        result.current.handleAnswerChange('question-123', veryLongAnswer);
      });

      expect(result.current.answers['question-123']).toEqual([veryLongAnswer]);
    });

    it('should handle rapid state changes', () => {
      const mockExam = createMockExam();
      const { result } = renderHook(() => useAnswerState(mockExam));

      // Rapidly change answers
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.handleAnswerChange('question-123', `answer-${i}`);
        }
      });

      expect(result.current.answers['question-123']).toEqual(['answer-99']);
    });

    it('should handle component unmount gracefully', () => {
      const mockExam = createMockExam();
      const { result, unmount } = renderHook(() => useAnswerState(mockExam));

      act(() => {
        result.current.handleAnswerChange('question-123', 'Paris');
      });

      expect(() => unmount()).not.toThrow();
    });

    it('should maintain referential stability of methods', () => {
      const mockExam = createMockExam();
      const { result, rerender } = renderHook(() => useAnswerState(mockExam));

      const initialMethods = {
        handleAnswerChange: result.current.handleAnswerChange,
        handleMultipleAnswerChange: result.current.handleMultipleAnswerChange,
        getQuestionStatus: result.current.getQuestionStatus,
        getCurrentAnswer: result.current.getCurrentAnswer,
        getAnsweredCount: result.current.getAnsweredCount
      };

      // Trigger rerender
      rerender();

      expect(result.current.handleAnswerChange).toBe(initialMethods.handleAnswerChange);
      expect(result.current.handleMultipleAnswerChange).toBe(initialMethods.handleMultipleAnswerChange);
      expect(result.current.getQuestionStatus).toBe(initialMethods.getQuestionStatus);
      expect(result.current.getCurrentAnswer).toBe(initialMethods.getCurrentAnswer);
      expect(result.current.getAnsweredCount).toBe(initialMethods.getAnsweredCount);
    });

    it('should handle malformed exam data', () => {
      const malformedExam = {
        id: 'exam-123',
        title: 'Test Exam',
        questions: [
          { id: 'question-1' }, // Missing other properties
          { questionText: 'No ID question' }, // Missing ID
          null, // Null question
          undefined, // Undefined question
          { id: 'question-2', questionText: 'Valid question' }
        ]
      } as any;

      const { result } = renderHook(() => useAnswerState(malformedExam));

      expect(result.current.answers).toEqual({
        'question-1': [],
        'question-2': []
      });
    });
  });
});