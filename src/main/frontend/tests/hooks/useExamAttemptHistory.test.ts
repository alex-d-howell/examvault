import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useExamAttemptHistory } from 'Frontend/hooks/useExamAttemptHistory';
import { ExamAttemptService } from 'Frontend/generated/endpoints';

// Mock the ExamAttemptService
vi.mock('Frontend/generated/endpoints', () => ({
  ExamAttemptService: {
    getMyExamAttemptsByExam: vi.fn()
  }
}));

const mockExamAttemptService = ExamAttemptService as any;

describe('useExamAttemptHistory', () => {
  const createMockExamAttempt = (overrides = {}) => ({
    id: 'attempt-123',
    exam: {
      id: 'exam-123',
      title: 'Test Exam',
      questions: Array.from({ length: 10 }, (_, i) => ({ id: `q${i}` }))
    },
    startTime: '2024-01-01T10:00:00Z',
    endTime: '2024-01-01T10:30:00Z',
    numberCorrect: 8,
    selectedAnswers: [],
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useExamAttemptHistory());

      expect(result.current.attempts).toEqual([]);
      expect(result.current.selectedAttempt).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.stats).toEqual({
        totalAttempts: 0,
        bestScore: 0,
        averageScore: 0,
        bestPercentage: 0,
        averagePercentage: 0,
        lastAttemptDate: null
      });
    });

    it('should provide all required methods', () => {
      const { result } = renderHook(() => useExamAttemptHistory());

      expect(typeof result.current.loadExamAttempts).toBe('function');
      expect(typeof result.current.selectAttempt).toBe('function');
      expect(typeof result.current.clearSelection).toBe('function');
      expect(typeof result.current.clearAttempts).toBe('function');
      expect(typeof result.current.getPercentage).toBe('function');
      expect(typeof result.current.getTimeSpent).toBe('function');
    });
  });

  describe('loading exam attempts', () => {
    it('should load exam attempts successfully', async () => {
      const mockAttempts = [
        createMockExamAttempt({ id: 'attempt-1', startTime: '2024-01-01T10:00:00Z' }),
        createMockExamAttempt({ id: 'attempt-2', startTime: '2024-01-02T10:00:00Z' }),
        createMockExamAttempt({ id: 'attempt-3', startTime: '2024-01-03T10:00:00Z' })
      ];

      mockExamAttemptService.getMyExamAttemptsByExam.mockResolvedValue(mockAttempts);

      const { result } = renderHook(() => useExamAttemptHistory());

      act(() => {
        result.current.loadExamAttempts('exam-123');
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isError).toBe(false);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.attempts).toHaveLength(3);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockExamAttemptService.getMyExamAttemptsByExam).toHaveBeenCalledWith('exam-123');
    });

    it('should sort attempts by startTime in descending order', async () => {
      const mockAttempts = [
        createMockExamAttempt({ id: 'attempt-1', startTime: '2024-01-01T10:00:00Z' }),
        createMockExamAttempt({ id: 'attempt-2', startTime: '2024-01-03T10:00:00Z' }),
        createMockExamAttempt({ id: 'attempt-3', startTime: '2024-01-02T10:00:00Z' })
      ];

      mockExamAttemptService.getMyExamAttemptsByExam.mockResolvedValue(mockAttempts);

      const { result } = renderHook(() => useExamAttemptHistory());

      await act(async () => {
        await result.current.loadExamAttempts('exam-123');
      });

      // Should be sorted by startTime descending (newest first)
      expect(result.current.attempts[0].id).toBe('attempt-2'); // 2024-01-03
      expect(result.current.attempts[1].id).toBe('attempt-3'); // 2024-01-02
      expect(result.current.attempts[2].id).toBe('attempt-1'); // 2024-01-01
    });

    it('should filter out undefined attempts', async () => {
      const mockAttemptsWithUndefined = [
        createMockExamAttempt({ id: 'attempt-1' }),
        null,
        createMockExamAttempt({ id: 'attempt-2' }),
        undefined,
        createMockExamAttempt({ id: 'attempt-3' })
      ];

      mockExamAttemptService.getMyExamAttemptsByExam.mockResolvedValue(mockAttemptsWithUndefined);

      const { result } = renderHook(() => useExamAttemptHistory());

      await act(async () => {
        await result.current.loadExamAttempts('exam-123');
      });

      expect(result.current.attempts).toHaveLength(3);
      expect(result.current.attempts.every(attempt => attempt != null)).toBe(true);
    });

    it('should handle null response from service', async () => {
      mockExamAttemptService.getMyExamAttemptsByExam.mockResolvedValue(null);

      const { result } = renderHook(() => useExamAttemptHistory());

      await act(async () => {
        await result.current.loadExamAttempts('exam-123');
      });

      expect(result.current.attempts).toEqual([]);
      expect(result.current.isError).toBe(false);
    });

    it('should handle empty response from service', async () => {
      mockExamAttemptService.getMyExamAttemptsByExam.mockResolvedValue([]);

      const { result } = renderHook(() => useExamAttemptHistory());

      await act(async () => {
        await result.current.loadExamAttempts('exam-123');
      });

      expect(result.current.attempts).toEqual([]);
      expect(result.current.isError).toBe(false);
    });

    it('should handle API errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const errorMessage = 'Failed to load attempts';
      mockExamAttemptService.getMyExamAttemptsByExam.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useExamAttemptHistory());

      await act(async () => {
        await result.current.loadExamAttempts('exam-123');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.attempts).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading exam attempts:', expect.any(Error));
    });

    it('should handle non-Error rejections', async () => {
      mockExamAttemptService.getMyExamAttemptsByExam.mockRejectedValue('String error');

      const { result } = renderHook(() => useExamAttemptHistory());

      await act(async () => {
        await result.current.loadExamAttempts('exam-123');
      });

      expect(result.current.error).toBe('Failed to load exam attempts');
    });

    it('should handle attempts without startTime', async () => {
      const mockAttempts = [
        createMockExamAttempt({ id: 'attempt-1', startTime: '2024-01-01T10:00:00Z' }),
        createMockExamAttempt({ id: 'attempt-2', startTime: undefined }),
        createMockExamAttempt({ id: 'attempt-3', startTime: null })
      ];

      mockExamAttemptService.getMyExamAttemptsByExam.mockResolvedValue(mockAttempts);

      const { result } = renderHook(() => useExamAttemptHistory());

      await act(async () => {
        await result.current.loadExamAttempts('exam-123');
      });

      expect(result.current.attempts).toHaveLength(3);
      // Should handle sorting gracefully even with null/undefined times
      expect(result.current.attempts[0].id).toBe('attempt-1'); // Has valid time, should be first
    });
  });

  describe('attempt selection', () => {
    it('should select an attempt', () => {
      const { result } = renderHook(() => useExamAttemptHistory());
      const mockAttempt = createMockExamAttempt();

      act(() => {
        result.current.selectAttempt(mockAttempt);
      });

      expect(result.current.selectedAttempt).toEqual(mockAttempt);
    });

    it('should replace previously selected attempt', () => {
      const { result } = renderHook(() => useExamAttemptHistory());
      const firstAttempt = createMockExamAttempt({ id: 'attempt-1' });
      const secondAttempt = createMockExamAttempt({ id: 'attempt-2' });

      act(() => {
        result.current.selectAttempt(firstAttempt);
      });

      expect(result.current.selectedAttempt).toEqual(firstAttempt);

      act(() => {
        result.current.selectAttempt(secondAttempt);
      });

      expect(result.current.selectedAttempt).toEqual(secondAttempt);
    });

    it('should clear selection', () => {
      const { result } = renderHook(() => useExamAttemptHistory());
      const mockAttempt = createMockExamAttempt();

      act(() => {
        result.current.selectAttempt(mockAttempt);
      });

      expect(result.current.selectedAttempt).toEqual(mockAttempt);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedAttempt).toBeNull();
    });

    it('should handle clearing when no selection exists', () => {
      const { result } = renderHook(() => useExamAttemptHistory());

      expect(result.current.selectedAttempt).toBeNull();

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedAttempt).toBeNull();
    });
  });

  describe('clear attempts', () => {
    it('should clear all attempts and selection', async () => {
      const mockAttempts = [createMockExamAttempt()];
      mockExamAttemptService.getMyExamAttemptsByExam.mockResolvedValue(mockAttempts);

      const { result } = renderHook(() => useExamAttemptHistory());

      // Load attempts and select one
      await act(async () => {
        await result.current.loadExamAttempts('exam-123');
      });

      act(() => {
        result.current.selectAttempt(mockAttempts[0]);
      });

      expect(result.current.attempts).toHaveLength(1);
      expect(result.current.selectedAttempt).not.toBeNull();

      // Clear everything
      act(() => {
        result.current.clearAttempts();
      });

      expect(result.current.attempts).toEqual([]);
      expect(result.current.selectedAttempt).toBeNull();
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should clear error state', async () => {
      mockExamAttemptService.getMyExamAttemptsByExam.mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useExamAttemptHistory());

      await act(async () => {
        await result.current.loadExamAttempts('exam-123');
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe('Failed');

      act(() => {
        result.current.clearAttempts();
      });

      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('percentage calculation', () => {
    it('should calculate percentage correctly', () => {
      const { result } = renderHook(() => useExamAttemptHistory());

      const attempt = createMockExamAttempt({
        numberCorrect: 8,
        exam: {
          questions: Array.from({ length: 10 }, (_, i) => ({ id: `q${i}` }))
        }
      });

      const percentage = result.current.getPercentage(attempt);
      expect(percentage).toBe(80); // 8/10 * 100 = 80%
    });

    it('should handle perfect score', () => {
      const { result } = renderHook(() => useExamAttemptHistory());

      const attempt = createMockExamAttempt({
        numberCorrect: 10,
        exam: {
          questions: Array.from({ length: 10 }, (_, i) => ({ id: `q${i}` }))
        }
      });

      const percentage = result.current.getPercentage(attempt);
      expect(percentage).toBe(100);
    });

    it('should handle zero score', () => {
      const { result } = renderHook(() => useExamAttemptHistory());

      const attempt = createMockExamAttempt({
        numberCorrect: 0,
        exam: {
          questions: Array.from({ length: 10 }, (_, i) => ({ id: `q${i}` }))
        }
      });

      const percentage = result.current.getPercentage(attempt);
      expect(percentage).toBe(0);
    });

    it('should handle exam with no questions', () => {
      const { result } = renderHook(() => useExamAttemptHistory());

      const attempt = createMockExamAttempt({
        numberCorrect: 5,
        exam: { questions: [] }
      });

      const percentage = result.current.getPercentage(attempt);
      expect(percentage).toBe(0);
    });

    it('should handle exam with null questions', () => {
      const { result } = renderHook(() => useExamAttemptHistory());

      const attempt = createMockExamAttempt({
        numberCorrect: 5,
        exam: { questions: null }
      });

      const percentage = result.current.getPercentage(attempt);
      expect(percentage).toBe(0);
    });

    it('should handle attempt with null exam', () => {
      const { result } = renderHook(() => useExamAttemptHistory());

      const attempt = createMockExamAttempt({
        numberCorrect: 5,
        exam: null
      });

      const percentage = result.current.getPercentage(attempt);
      expect(percentage).toBe(0);
    });

    it('should round percentage correctly', () => {
      const { result } = renderHook(() => useExamAttemptHistory());

      const attempt = createMockExamAttempt({
        numberCorrect: 7,
        exam: {
          questions: Array.from({ length: 9 }, (_, i) => ({ id: `q${i}` }))
        }
      });

      const percentage = result.current.getPercentage(attempt);
      expect(percentage).toBe(78); // 7/9 * 100 = 77.77... rounded to 78
    });
  });

  describe('time spent calculation', () => {
    it('should calculate time spent in seconds', () => {
      const { result } = renderHook(() => useExamAttemptHistory());

      const attempt = createMockExamAttempt({
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T10:30:00Z'
      });

      const timeSpent = result.current.getTimeSpent(attempt);
      expect(timeSpent).toBe(1800); // 30 minutes = 1800 seconds
    });

    it('should handle different time formats', () => {
      const { result } = renderHook(() => useExamAttemptHistory());

      const attempt = createMockExamAttempt({
        startTime: '2024-01-01T10:00:00.000Z',
        endTime: '2024-01-01T10:05:30.500Z'
      });

      const timeSpent = result.current.getTimeSpent(attempt);
      expect(timeSpent).toBe(331); // 5 minutes 30.5 seconds = 330.5 seconds, rounded to 331
    });

    it('should handle missing start time', () => {
      const { result } = renderHook(() => useExamAttemptHistory());

      const attempt = createMockExamAttempt({
        startTime: undefined,
        endTime: '2024-01-01T10:30:00Z'
      });

      const timeSpent = result.current.getTimeSpent(attempt);
      expect(timeSpent).toBe(0);
    });

    it('should handle missing end time', () => {
      const { result } = renderHook(() => useExamAttemptHistory());

      const attempt = createMockExamAttempt({
        startTime: '2024-01-01T10:00:00Z',
        endTime: undefined
      });

      const timeSpent = result.current.getTimeSpent(attempt);
      expect(timeSpent).toBe(0);
    });

    it('should handle both times missing', () => {
      const { result } = renderHook(() => useExamAttemptHistory());

      const attempt = createMockExamAttempt({
        startTime: undefined,
        endTime: undefined
      });

      const timeSpent = result.current.getTimeSpent(attempt);
      expect(timeSpent).toBe(0);
    });

    it('should handle very short durations', () => {
      const { result } = renderHook(() => useExamAttemptHistory());

      const attempt = createMockExamAttempt({
        startTime: '2024-01-01T10:00:00.000Z',
        endTime: '2024-01-01T10:00:00.500Z'
      });

      const timeSpent = result.current.getTimeSpent(attempt);
      expect(timeSpent).toBe(1); // 0.5 seconds rounded to 1
    });

    it('should handle very long durations', () => {
      const { result } = renderHook(() => useExamAttemptHistory());

      const attempt = createMockExamAttempt({
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-02T10:00:00Z' // 24 hours later
      });

      const timeSpent = result.current.getTimeSpent(attempt);
      expect(timeSpent).toBe(86400); // 24 hours = 86400 seconds
    });
  });

  describe('statistics calculation', () => {
    it('should calculate stats with multiple attempts', async () => {
      const mockAttempts = [
        createMockExamAttempt({ 
          numberCorrect: 8, 
          startTime: '2024-01-03T10:00:00Z',
          exam: { questions: Array.from({ length: 10 }, (_, i) => ({ id: `q${i}` })) }
        }),
        createMockExamAttempt({ 
          numberCorrect: 6, 
          startTime: '2024-01-02T10:00:00Z',
          exam: { questions: Array.from({ length: 10 }, (_, i) => ({ id: `q${i}` })) }
        }),
        createMockExamAttempt({ 
          numberCorrect: 10, 
          startTime: '2024-01-01T10:00:00Z',
          exam: { questions: Array.from({ length: 10 }, (_, i) => ({ id: `q${i}` })) }
        })
      ];

      mockExamAttemptService.getMyExamAttemptsByExam.mockResolvedValue(mockAttempts);

      const { result } = renderHook(() => useExamAttemptHistory());

      await act(async () => {
        await result.current.loadExamAttempts('exam-123');
      });

      expect(result.current.stats).toEqual({
        totalAttempts: 3,
        bestScore: 10,
        averageScore: 8, // (8 + 6 + 10) / 3 = 8
        bestPercentage: 100, // 10/10 = 100%
        averagePercentage: 80, // (80 + 60 + 100) / 3 = 80
        lastAttemptDate: '2024-01-03T10:00:00Z' // Most recent (after sorting)
      });
    });

    it('should handle stats with no attempts', () => {
      const { result } = renderHook(() => useExamAttemptHistory());

      expect(result.current.stats).toEqual({
        totalAttempts: 0,
        bestScore: 0,
        averageScore: 0,
        bestPercentage: 0,
        averagePercentage: 0,
        lastAttemptDate: null
      });
    });

    it('should handle single attempt', async () => {
      const mockAttempts = [
        createMockExamAttempt({ 
          numberCorrect: 7, 
          startTime: '2024-01-01T10:00:00Z',
          exam: { questions: Array.from({ length: 10 }, (_, i) => ({ id: `q${i}` })) }
        })
      ];

      mockExamAttemptService.getMyExamAttemptsByExam.mockResolvedValue(mockAttempts);

      const { result } = renderHook(() => useExamAttemptHistory());

      await act(async () => {
        await result.current.loadExamAttempts('exam-123');
      });

      expect(result.current.stats).toEqual({
        totalAttempts: 1,
        bestScore: 7,
        averageScore: 7,
        bestPercentage: 70,
        averagePercentage: 70,
        lastAttemptDate: '2024-01-01T10:00:00Z'
      });
    });

    it('should handle attempts with missing data', async () => {
      const mockAttempts = [
        createMockExamAttempt({ 
          numberCorrect: undefined, 
          startTime: '2024-01-01T10:00:00Z',
          exam: { questions: Array.from({ length: 10 }, (_, i) => ({ id: `q${i}` })) }
        }),
        createMockExamAttempt({ 
          numberCorrect: 5, 
          startTime: undefined,
          exam: { questions: Array.from({ length: 10 }, (_, i) => ({ id: `q${i}` })) }
        })
      ];

      mockExamAttemptService.getMyExamAttemptsByExam.mockResolvedValue(mockAttempts);

      const { result } = renderHook(() => useExamAttemptHistory());

      await act(async () => {
        await result.current.loadExamAttempts('exam-123');
      });

      // Should handle gracefully
      expect(result.current.stats.totalAttempts).toBe(2);
      expect(result.current.stats.bestScore).toBe(5); // Only valid score
      expect(result.current.stats.lastAttemptDate).toBe('2024-01-01T10:00:00Z'); // Only valid date
    });

    it('should round average scores correctly', async () => {
      const mockAttempts = [
        createMockExamAttempt({ 
          numberCorrect: 7, 
          exam: { questions: Array.from({ length: 10 }, (_, i) => ({ id: `q${i}` })) }
        }),
        createMockExamAttempt({ 
          numberCorrect: 8, 
          exam: { questions: Array.from({ length: 10 }, (_, i) => ({ id: `q${i}` })) }
        })
      ];

      mockExamAttemptService.getMyExamAttemptsByExam.mockResolvedValue(mockAttempts);

      const { result } = renderHook(() => useExamAttemptHistory());

      await act(async () => {
        await result.current.loadExamAttempts('exam-123');
      });

      expect(result.current.stats.averageScore).toBe(7.5); // (7 + 8) / 2 = 7.5
      expect(result.current.stats.averagePercentage).toBe(75); // (70 + 80) / 2 = 75
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle component unmount during loading', async () => {
      let resolveAttempts: (value: any[]) => void;
      const attemptsPromise = new Promise<any[]>(resolve => {
        resolveAttempts = resolve;
      });

      mockExamAttemptService.getMyExamAttemptsByExam.mockReturnValue(attemptsPromise);

      const { result, unmount } = renderHook(() => useExamAttemptHistory());

      act(() => {
        result.current.loadExamAttempts('exam-123');
      });

      expect(result.current.isLoading).toBe(true);

      // Unmount before loading completes
      unmount();

      // Resolve promise after unmount
      act(() => {
        resolveAttempts!([]);
      });

      // Should not cause errors - just test that unmount doesn't throw
      expect(true).toBe(true); // Test passes if no errors thrown
    });

    it('should maintain referential stability of methods', () => {
      const { result, rerender } = renderHook(() => useExamAttemptHistory());

      const initialMethods = {
        loadExamAttempts: result.current.loadExamAttempts,
        selectAttempt: result.current.selectAttempt,
        clearSelection: result.current.clearSelection,
        clearAttempts: result.current.clearAttempts,
        getPercentage: result.current.getPercentage,
        getTimeSpent: result.current.getTimeSpent
      };

      // Trigger rerender
      rerender();

      expect(result.current.loadExamAttempts).toBe(initialMethods.loadExamAttempts);
      expect(result.current.selectAttempt).toBe(initialMethods.selectAttempt);
      expect(result.current.clearSelection).toBe(initialMethods.clearSelection);
      expect(result.current.clearAttempts).toBe(initialMethods.clearAttempts);
      expect(result.current.getPercentage).toBe(initialMethods.getPercentage);
      expect(result.current.getTimeSpent).toBe(initialMethods.getTimeSpent);
    });

    it('should handle very large datasets', async () => {
      const manyAttempts = Array.from({ length: 1000 }, (_, i) => 
        createMockExamAttempt({ 
          id: `attempt-${i}`,
          numberCorrect: Math.floor(Math.random() * 10),
          startTime: new Date(2024, 0, 1, 10, i % 60).toISOString(),
          exam: { questions: Array.from({ length: 10 }, (_, j) => ({ id: `q${j}` })) }
        })
      );

      mockExamAttemptService.getMyExamAttemptsByExam.mockResolvedValue(manyAttempts);

      const { result } = renderHook(() => useExamAttemptHistory());

      await act(async () => {
        await result.current.loadExamAttempts('exam-123');
      });

      expect(result.current.attempts).toHaveLength(1000);
      expect(result.current.stats.totalAttempts).toBe(1000);
      expect(result.current.isError).toBe(false);
    });

    it('should handle malformed date strings', () => {
      const { result } = renderHook(() => useExamAttemptHistory());

      const attempt = createMockExamAttempt({
        startTime: 'invalid-date',
        endTime: 'also-invalid'
      });

      const timeSpent = result.current.getTimeSpent(attempt);
      expect(timeSpent).toBe(0); // Should handle gracefully
    });

    it('should handle concurrent load attempts calls', async () => {
      mockExamAttemptService.getMyExamAttemptsByExam.mockResolvedValue([]);

      const { result } = renderHook(() => useExamAttemptHistory());

      // Make multiple concurrent calls
      await act(async () => {
        const promises = [
          result.current.loadExamAttempts('exam-1'),
          result.current.loadExamAttempts('exam-2'),
          result.current.loadExamAttempts('exam-3')
        ];
        await Promise.all(promises);
      });

      // Should not cause issues
      expect(result.current.isError).toBe(false);
      expect(mockExamAttemptService.getMyExamAttemptsByExam).toHaveBeenCalledTimes(3);
    });
  });
});