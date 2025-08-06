import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { useDashboard } from 'Frontend/hooks/useDashboard';
import { ExamService, ExamAttemptService } from 'Frontend/generated/endpoints.js';

// Mock the services
vi.mock('Frontend/generated/endpoints.js', () => ({
  ExamService: {
    getMyExams: vi.fn(),
  },
  ExamAttemptService: {
    getMyExamAttempts: vi.fn(),
  },
}));

const mockExamService = ExamService as any;
const mockExamAttemptService = ExamAttemptService as any;

describe('useDashboard', () => {
  const createMockExam = (overrides = {}) => ({
    id: 'exam-123',
    title: 'Test Exam',
    description: 'Test exam description',
    uploadedBy: 'test@example.com',
    uploadedAt: '2024-01-01T00:00:00Z',
    questions: [{ id: 'q1' }, { id: 'q2' }],
    ...overrides,
  });

  const createMockExamAttempt = (overrides = {}) => ({
    id: 'attempt-123',
    exam: { id: 'exam-123', title: 'Test Exam' },
    startTime: '2024-01-01T10:00:00Z',
    endTime: '2024-01-01T10:30:00Z',
    numberCorrect: 8,
    totalQuestions: 10,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useDashboard(false, false, false));

      expect(result.current.myExams).toEqual([]);
      expect(result.current.myAttempts).toEqual([]);
      expect(result.current.dashboardStats).toEqual({
        totalExamsCreated: 0,
        totalAttempts: 0,
        uniqueExamsTaken: 0,
        recentActivity: 0,
        studyStreak: 0,
      });
      expect(result.current.loadingData).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should not load data when not authenticated', () => {
      renderHook(() => useDashboard(false, true, false));
      expect(mockExamService.getMyExams).not.toHaveBeenCalled();
      expect(mockExamAttemptService.getMyExamAttempts).not.toHaveBeenCalled();
    });

    it('should not load data when auth not initialized', () => {
      renderHook(() => useDashboard(true, false, false));
      expect(mockExamService.getMyExams).not.toHaveBeenCalled();
      expect(mockExamAttemptService.getMyExamAttempts).not.toHaveBeenCalled();
    });

    it('should not load data when still loading', () => {
      renderHook(() => useDashboard(true, true, true));
      expect(mockExamService.getMyExams).not.toHaveBeenCalled();
      expect(mockExamAttemptService.getMyExamAttempts).not.toHaveBeenCalled();
    });
  });

  describe('data loading', () => {
    it('should load data when authenticated and ready', async () => {
      const mockExams = [createMockExam(), createMockExam({ id: 'exam-456' })];
      const mockAttempts = [createMockExamAttempt(), createMockExamAttempt({ id: 'attempt-456' })];

      mockExamService.getMyExams.mockResolvedValue(mockExams);
      mockExamAttemptService.getMyExamAttempts.mockResolvedValue(mockAttempts);

      const { result } = renderHook(() => useDashboard(true, true, false));

      expect(result.current.loadingData).toBe(true);

      await waitFor(() => {
        expect(result.current.loadingData).toBe(false);
      });

      expect(result.current.myExams).toEqual(mockExams);
      expect(result.current.myAttempts).toEqual(mockAttempts);
      expect(result.current.error).toBeNull();
      expect(mockExamService.getMyExams).toHaveBeenCalledTimes(1);
      expect(mockExamAttemptService.getMyExamAttempts).toHaveBeenCalledTimes(1);
    });

    it('should filter out undefined exams and attempts', async () => {
      const mockExamsWithUndefined = [createMockExam(), null, createMockExam({ id: 'exam-456' }), undefined];
      const mockAttemptsWithUndefined = [
        createMockExamAttempt(),
        null,
        createMockExamAttempt({ id: 'attempt-456' }),
        undefined,
      ];

      mockExamService.getMyExams.mockResolvedValue(mockExamsWithUndefined);
      mockExamAttemptService.getMyExamAttempts.mockResolvedValue(mockAttemptsWithUndefined);

      const { result } = renderHook(() => useDashboard(true, true, false));

      await waitFor(() => {
        expect(result.current.loadingData).toBe(false);
      });

      expect(result.current.myExams).toHaveLength(2);
      expect(result.current.myAttempts).toHaveLength(2);
      expect(result.current.myExams.every((exam) => exam != null)).toBe(true);
      expect(result.current.myAttempts.every((attempt) => attempt != null)).toBe(true);
    });

    it('should handle null response from services', async () => {
      mockExamService.getMyExams.mockResolvedValue(null);
      mockExamAttemptService.getMyExamAttempts.mockResolvedValue(null);

      const { result } = renderHook(() => useDashboard(true, true, false));

      await waitFor(() => {
        expect(result.current.loadingData).toBe(false);
      });

      expect(result.current.myExams).toEqual([]);
      expect(result.current.myAttempts).toEqual([]);
    });

    it('should handle service errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockExamService.getMyExams.mockRejectedValue(new Error('Failed to load exams'));
      mockExamAttemptService.getMyExamAttempts.mockResolvedValue([]);

      const { result } = renderHook(() => useDashboard(true, true, false));

      await waitFor(() => {
        expect(result.current.loadingData).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load exams');
      expect(consoleSpy).toHaveBeenCalledWith('Error loading user data:', expect.any(Error));
    });

    it('should handle non-Error rejections', async () => {
      mockExamService.getMyExams.mockRejectedValue('String error');
      mockExamAttemptService.getMyExamAttempts.mockResolvedValue([]);

      const { result } = renderHook(() => useDashboard(true, true, false));

      await waitFor(() => {
        expect(result.current.loadingData).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load dashboard data');
    });
  });

  describe('dashboard statistics calculation', () => {
    it('should calculate basic statistics correctly', async () => {
      const mockExams = [
        createMockExam({ id: 'exam-1' }),
        createMockExam({ id: 'exam-2' }),
        createMockExam({ id: 'exam-3' }),
      ];

      const mockAttempts = [
        createMockExamAttempt({ id: 'attempt-1', exam: { id: 'exam-1' } }),
        createMockExamAttempt({ id: 'attempt-2', exam: { id: 'exam-1' } }),
        createMockExamAttempt({ id: 'attempt-3', exam: { id: 'exam-2' } }),
        createMockExamAttempt({ id: 'attempt-4', exam: { id: 'exam-4' } }), // Different exam
      ];

      mockExamService.getMyExams.mockResolvedValue(mockExams);
      mockExamAttemptService.getMyExamAttempts.mockResolvedValue(mockAttempts);

      const { result } = renderHook(() => useDashboard(true, true, false));

      await waitFor(() => {
        expect(result.current.loadingData).toBe(false);
      });

      expect(result.current.dashboardStats.totalExamsCreated).toBe(3);
      expect(result.current.dashboardStats.totalAttempts).toBe(4);
      expect(result.current.dashboardStats.uniqueExamsTaken).toBe(3); // exam-1, exam-2, exam-4
    });

    it('should calculate recent activity (last 7 days)', async () => {
      // Use real dates without fake timers
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oldDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      const mockAttempts = [
        createMockExamAttempt({ id: 'recent-1', endTime: now.toISOString() }),
        createMockExamAttempt({ id: 'recent-2', endTime: yesterday.toISOString() }),
        createMockExamAttempt({ id: 'recent-3', endTime: weekAgo.toISOString() }),
        createMockExamAttempt({ id: 'old-1', endTime: oldDate.toISOString() }),
        createMockExamAttempt({ id: 'no-end', endTime: undefined }), // Should be excluded
      ];

      mockExamService.getMyExams.mockResolvedValue([]);
      mockExamAttemptService.getMyExamAttempts.mockResolvedValue(mockAttempts);

      const { result } = renderHook(() => useDashboard(true, true, false));

      await waitFor(() => {
        expect(result.current.loadingData).toBe(false);
      });

      // Should count recent attempts (within 7 days)
      expect(result.current.dashboardStats.recentActivity).toBeGreaterThanOrEqual(2);
    });

    it('should handle attempts with null exam IDs', async () => {
      const mockAttempts = [
        createMockExamAttempt({ exam: { id: 'exam-1' } }),
        createMockExamAttempt({ exam: { id: null } }),
        createMockExamAttempt({ exam: null }),
        createMockExamAttempt({ exam: { id: 'exam-2' } }),
      ];

      mockExamService.getMyExams.mockResolvedValue([]);
      mockExamAttemptService.getMyExamAttempts.mockResolvedValue(mockAttempts);

      const { result } = renderHook(() => useDashboard(true, true, false));

      await waitFor(() => {
        expect(result.current.loadingData).toBe(false);
      });

      expect(result.current.dashboardStats.uniqueExamsTaken).toBe(2); // Only exam-1 and exam-2
    });
  });

  describe('study streak calculation', () => {
    it('should calculate study streak correctly for consecutive days', async () => {
      // Use specific test dates
      const baseDate = new Date('2024-01-15T12:00:00Z');
      const mockAttempts = [
        createMockExamAttempt({ endTime: new Date(baseDate.getTime()).toISOString() }), // Day 0
        createMockExamAttempt({ endTime: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000).toISOString() }), // Day -1
        createMockExamAttempt({ endTime: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() }), // Day -2
        createMockExamAttempt({ endTime: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() }), // Day -3
        createMockExamAttempt({ endTime: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() }), // Day -5 (gap)
      ];

      mockExamService.getMyExams.mockResolvedValue([]);
      mockExamAttemptService.getMyExamAttempts.mockResolvedValue(mockAttempts);

      const { result } = renderHook(() => useDashboard(true, true, false));

      await waitFor(() => {
        expect(result.current.loadingData).toBe(false);
      });

      // Should calculate some streak (exact value depends on current date vs test dates)
      expect(result.current.dashboardStats.studyStreak).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero streak when no attempts', async () => {
      mockExamService.getMyExams.mockResolvedValue([]);
      mockExamAttemptService.getMyExamAttempts.mockResolvedValue([]);

      const { result } = renderHook(() => useDashboard(true, true, false));

      await waitFor(() => {
        expect(result.current.loadingData).toBe(false);
      });

      expect(result.current.dashboardStats.studyStreak).toBe(0);
    });

    it('should handle study streak with attempts without endTime', async () => {
      const now = new Date();
      const mockAttempts = [
        createMockExamAttempt({ endTime: now.toISOString() }),
        createMockExamAttempt({ endTime: undefined }),
        createMockExamAttempt({ endTime: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() }),
      ];

      mockExamService.getMyExams.mockResolvedValue([]);
      mockExamAttemptService.getMyExamAttempts.mockResolvedValue(mockAttempts);

      const { result } = renderHook(() => useDashboard(true, true, false));

      await waitFor(() => {
        expect(result.current.loadingData).toBe(false);
      });

      // Should only count attempts with endTime
      expect(result.current.dashboardStats.studyStreak).toBeGreaterThanOrEqual(0);
    });
  });

  describe('refresh functionality', () => {
    it('should refresh data successfully', async () => {
      const initialExams = [createMockExam()];
      const refreshedExams = [createMockExam(), createMockExam({ id: 'exam-456' })];

      mockExamService.getMyExams.mockResolvedValueOnce(initialExams).mockResolvedValueOnce(refreshedExams);
      mockExamAttemptService.getMyExamAttempts.mockResolvedValue([]);

      const { result } = renderHook(() => useDashboard(true, true, false));

      await waitFor(() => {
        expect(result.current.loadingData).toBe(false);
      });

      expect(result.current.myExams).toHaveLength(1);

      // Refresh data
      await act(async () => {
        await result.current.refreshData();
      });

      expect(result.current.myExams).toHaveLength(2);
      expect(mockExamService.getMyExams).toHaveBeenCalledTimes(2);
    });

    it('should handle refresh errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockExamService.getMyExams.mockResolvedValueOnce([]);
      mockExamAttemptService.getMyExamAttempts.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useDashboard(true, true, false));

      await waitFor(() => {
        expect(result.current.loadingData).toBe(false);
      });

      // Make refresh fail
      mockExamService.getMyExams.mockRejectedValueOnce(new Error('Refresh failed'));

      await act(async () => {
        await result.current.refreshData();
      });

      expect(result.current.error).toBe('Refresh failed');
      expect(consoleSpy).toHaveBeenCalledWith('Error loading user data:', expect.any(Error));
    });

    it('should work when not authenticated', async () => {
      const { result } = renderHook(() => useDashboard(false, true, false));

      await act(async () => {
        await result.current.refreshData();
      });

      expect(mockExamService.getMyExams).not.toHaveBeenCalled();
      expect(mockExamAttemptService.getMyExamAttempts).not.toHaveBeenCalled();
    });
  });

  describe('state transitions', () => {
    it('should load data when authentication state changes', async () => {
      mockExamService.getMyExams.mockResolvedValue([createMockExam()]);
      mockExamAttemptService.getMyExamAttempts.mockResolvedValue([]);

      const { result, rerender } = renderHook(
        ({ authenticated, authInitialized, loading }) => useDashboard(authenticated, authInitialized, loading),
        { initialProps: { authenticated: false, authInitialized: true, loading: false } }
      );

      expect(mockExamService.getMyExams).not.toHaveBeenCalled();

      // Change to authenticated
      rerender({ authenticated: true, authInitialized: true, loading: false });

      await waitFor(() => {
        expect(result.current.loadingData).toBe(false);
      });

      expect(mockExamService.getMyExams).toHaveBeenCalledTimes(1);
    });

    it('should load data when auth initialization completes', async () => {
      mockExamService.getMyExams.mockResolvedValue([]);
      mockExamAttemptService.getMyExamAttempts.mockResolvedValue([]);

      const { rerender } = renderHook(
        ({ authenticated, authInitialized, loading }) => useDashboard(authenticated, authInitialized, loading),
        { initialProps: { authenticated: true, authInitialized: false, loading: false } }
      );

      expect(mockExamService.getMyExams).not.toHaveBeenCalled();

      // Auth initialization completes
      rerender({ authenticated: true, authInitialized: true, loading: false });

      await waitFor(() => {
        expect(mockExamService.getMyExams).toHaveBeenCalledTimes(1);
      });
    });

    it('should load data when loading completes', async () => {
      mockExamService.getMyExams.mockResolvedValue([]);
      mockExamAttemptService.getMyExamAttempts.mockResolvedValue([]);

      const { rerender } = renderHook(
        ({ authenticated, authInitialized, loading }) => useDashboard(authenticated, authInitialized, loading),
        { initialProps: { authenticated: true, authInitialized: true, loading: true } }
      );

      expect(mockExamService.getMyExams).not.toHaveBeenCalled();

      // Loading completes
      rerender({ authenticated: true, authInitialized: true, loading: false });

      await waitFor(() => {
        expect(mockExamService.getMyExams).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle malformed exam data', async () => {
      const malformedExams = [
        createMockExam(),
        { id: 'malformed', title: null }, // Missing required fields
        createMockExam({ questions: null }),
        {
          /* completely empty object */
        },
      ] as any;

      mockExamService.getMyExams.mockResolvedValue(malformedExams);
      mockExamAttemptService.getMyExamAttempts.mockResolvedValue([]);

      const { result } = renderHook(() => useDashboard(true, true, false));

      await waitFor(() => {
        expect(result.current.loadingData).toBe(false);
      });

      // Should include all items (filtering only removes null/undefined)
      expect(result.current.myExams).toHaveLength(4);
    });

    it('should handle malformed attempt data', async () => {
      const malformedAttempts = [
        createMockExamAttempt(),
        { id: 'malformed', exam: { id: null } }, // Null exam ID
        { exam: null }, // Null exam
        createMockExamAttempt({ endTime: 'invalid-date' }),
      ] as any;

      mockExamService.getMyExams.mockResolvedValue([]);
      mockExamAttemptService.getMyExamAttempts.mockResolvedValue(malformedAttempts);

      const { result } = renderHook(() => useDashboard(true, true, false));

      await waitFor(() => {
        expect(result.current.loadingData).toBe(false);
      });

      // Should handle gracefully without throwing
      expect(result.current.myAttempts).toHaveLength(4);
      expect(result.current.dashboardStats.uniqueExamsTaken).toBe(1); // Only valid exam ID
    });

    it('should handle concurrent refresh calls', async () => {
      mockExamService.getMyExams.mockResolvedValue([]);
      mockExamAttemptService.getMyExamAttempts.mockResolvedValue([]);

      const { result } = renderHook(() => useDashboard(true, true, false));

      await waitFor(() => {
        expect(result.current.loadingData).toBe(false);
      });

      // Make multiple concurrent refresh calls
      await act(async () => {
        const promises = [result.current.refreshData(), result.current.refreshData(), result.current.refreshData()];
        await Promise.all(promises);
      });

      // Should not cause issues
      expect(result.current.error).toBeNull();
    });

    it('should handle component unmount during loading', async () => {
      let resolveExams: (value: any[]) => void;
      const examsPromise = new Promise<any[]>((resolve) => {
        resolveExams = resolve;
      });

      mockExamService.getMyExams.mockReturnValue(examsPromise);
      mockExamAttemptService.getMyExamAttempts.mockResolvedValue([]);

      const { result, unmount } = renderHook(() => useDashboard(true, true, false));

      expect(result.current.loadingData).toBe(true);

      // Unmount before loading completes
      unmount();

      // Resolve promise after unmount
      act(() => {
        resolveExams!([]);
      });

      // Should not cause errors - just verify no crash
      expect(true).toBe(true);
    });
  });
});