import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExamAttemptsModal } from 'Frontend/hooks/useExamAttemptModal';
import { testUtils } from '../test-utils';
import type ExamAttempt from 'Frontend/generated/com/howell/examvault/base/domain/ExamAttempt';

// Use test-utils for creating mock data, but adapt to domain object structure
const createMockExamAttempt = (overrides = {}): ExamAttempt => {
  const baseAttempt = testUtils.data.createMockExamAttempt(overrides);
  const baseExam = testUtils.data.createMockExam();
  
  // Convert from API/DTO structure to domain object structure
  return {
    id: baseAttempt.id,
    exam: {
      id: baseAttempt.examId || baseExam.id,
      title: baseAttempt.examTitle || baseExam.title,
      questions: baseExam.questions || Array.from({ length: 10 }, (_, i) => ({ id: `q${i}` })),
    },
    startTime: baseAttempt.completedAt || '2024-01-01T10:00:00Z',
    endTime: baseAttempt.completedAt || '2024-01-01T10:30:00Z',
    numberCorrect: baseAttempt.correctAnswers || 8,
    selectedAnswers: [],
    ...overrides,
  } as ExamAttempt;
};

// Create mock functions - these will be assigned to the mock hook
const mockLoadExamAttempts = vi.fn();
const mockSelectAttempt = vi.fn();
const mockClearSelection = vi.fn();
const mockClearAttempts = vi.fn();
const mockGetPercentage = vi.fn();
const mockGetTimeSpent = vi.fn();

// Create a mock hook factory
const createMockExamAttemptHistoryHook = (overrides = {}) => ({
  attempts: [],
  selectedAttempt: null,
  isLoading: false,
  isError: false,
  error: null,
  stats: {
    totalAttempts: 0,
    bestScore: 0,
    averageScore: 0,
    bestPercentage: 0,
    averagePercentage: 0,
    lastAttemptDate: null,
  },
  loadExamAttempts: mockLoadExamAttempts,
  selectAttempt: mockSelectAttempt,
  clearSelection: mockClearSelection,
  clearAttempts: mockClearAttempts,
  getPercentage: mockGetPercentage,
  getTimeSpent: mockGetTimeSpent,
  ...overrides,
});

// Mock with the correct path - this needs to match the import in useExamAttemptModal.ts
vi.mock('Frontend/hooks/useExamAttemptHistory', () => ({
  useExamAttemptHistory: vi.fn(),
}));

// Get the mocked function to control its return value
const { useExamAttemptHistory } = await import('Frontend/hooks/useExamAttemptHistory');
const mockUseExamAttemptHistory = useExamAttemptHistory as any;

describe('useExamAttemptsModal', () => {
  beforeEach(() => {
    // Clear all mock calls
    vi.clearAllMocks();
    
    // Reset mock function return values
    mockGetPercentage.mockReturnValue(80);
    mockGetTimeSpent.mockReturnValue(1800);
    mockLoadExamAttempts.mockResolvedValue(undefined);
    
    // Set default mock return value
    mockUseExamAttemptHistory.mockReturnValue(createMockExamAttemptHistoryHook());
  });

  describe('initialization', () => {
    it('should initialize with closed modal state', () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      expect(result.current.currentView).toBe('closed');
      expect(result.current.currentExamId).toBeNull();
      expect(result.current.currentExamTitle).toBeNull();
    });

    it('should provide all required methods and data', () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      // Modal actions
      expect(typeof result.current.openAttemptsModal).toBe('function');
      expect(typeof result.current.openDetailModal).toBe('function');
      expect(typeof result.current.goBackToList).toBe('function');
      expect(typeof result.current.closeModal).toBe('function');

      // Data from useExamAttemptHistory
      expect(Array.isArray(result.current.attempts)).toBe(true);
      expect(result.current.selectedAttempt).toBeNull();
      expect(typeof result.current.isLoading).toBe('boolean');
      expect(typeof result.current.isError).toBe('boolean');
      expect(typeof result.current.stats).toBe('object');

      // Helper functions
      expect(typeof result.current.getPercentage).toBe('function');
      expect(typeof result.current.getTimeSpent).toBe('function');
    });

    it('should inherit data from useExamAttemptHistory hook', () => {
      const mockAttempts = [createMockExamAttempt()];
      const mockStats = {
        totalAttempts: 5,
        bestScore: 10,
        averageScore: 8,
        bestPercentage: 100,
        averagePercentage: 80,
        lastAttemptDate: '2024-01-01T10:00:00Z',
      };

      // Update the mock to return specific data
      mockUseExamAttemptHistory.mockReturnValue(createMockExamAttemptHistoryHook({
        attempts: mockAttempts,
        stats: mockStats,
        isLoading: true,
      }));

      const { result } = renderHook(() => useExamAttemptsModal());

      expect(result.current.attempts).toEqual(mockAttempts);
      expect(result.current.stats).toEqual(mockStats);
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('opening attempts modal', () => {
    it('should open attempts modal and load data', async () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      const examId = 'exam-123';
      const examTitle = 'Test Exam';

      await act(async () => {
        await result.current.openAttemptsModal(examId, examTitle);
      });

      expect(result.current.currentView).toBe('list');
      expect(result.current.currentExamId).toBe(examId);
      expect(result.current.currentExamTitle).toBe(examTitle);
      expect(mockLoadExamAttempts).toHaveBeenCalledWith(examId);
    });

    it('should handle loading data errors during modal open', async () => {
      mockLoadExamAttempts.mockRejectedValue(new Error('Load failed'));

      const { result } = renderHook(() => useExamAttemptsModal());

      // Expect the function to reject with the error
      await act(async () => {
        await expect(result.current.openAttemptsModal('exam-123', 'Test Exam')).rejects.toThrow('Load failed');
      });

      // Modal should still be opened even if data loading fails
      // because the state is set before the await call
      expect(result.current.currentView).toBe('list');
      expect(result.current.currentExamId).toBe('exam-123');
      expect(result.current.currentExamTitle).toBe('Test Exam');
    });

    it('should handle empty exam title', async () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      await act(async () => {
        await result.current.openAttemptsModal('exam-123', '');
      });

      expect(result.current.currentExamTitle).toBe('');
    });

    it('should handle special characters in exam title', async () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      const specialTitle = 'Exam with <tags> & "quotes" @#$%';

      await act(async () => {
        await result.current.openAttemptsModal('exam-123', specialTitle);
      });

      expect(result.current.currentExamTitle).toBe(specialTitle);
    });

    it('should handle very long exam titles', async () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      const longTitle = 'A'.repeat(1000);

      await act(async () => {
        await result.current.openAttemptsModal('exam-123', longTitle);
      });

      expect(result.current.currentExamTitle).toBe(longTitle);
    });
  });

  describe('opening detail modal', () => {
    it('should open detail modal and select attempt', () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      const mockAttempt = createMockExamAttempt();

      act(() => {
        result.current.openDetailModal(mockAttempt);
      });

      expect(result.current.currentView).toBe('detail');
      expect(mockSelectAttempt).toHaveBeenCalledWith(mockAttempt);
    });

    it('should work from any current view', async () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      // First open the list modal
      await act(async () => {
        await result.current.openAttemptsModal('exam-123', 'Test Exam');
      });

      expect(result.current.currentView).toBe('list');

      // Then open detail modal
      const mockAttempt = createMockExamAttempt();

      act(() => {
        result.current.openDetailModal(mockAttempt);
      });

      expect(result.current.currentView).toBe('detail');
    });

    it('should handle attempt with missing data', () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      const incompleteAttempt = {
        id: 'attempt-123',
        // Missing other properties
      } as any;

      act(() => {
        result.current.openDetailModal(incompleteAttempt);
      });

      expect(result.current.currentView).toBe('detail');
      expect(mockSelectAttempt).toHaveBeenCalledWith(incompleteAttempt);
    });
  });

  describe('navigation between views', () => {
    it('should go back to list from detail view', async () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      // Open modal and go to detail view
      await act(async () => {
        await result.current.openAttemptsModal('exam-123', 'Test Exam');
      });

      const mockAttempt = createMockExamAttempt();
      act(() => {
        result.current.openDetailModal(mockAttempt);
      });

      expect(result.current.currentView).toBe('detail');

      // Go back to list
      act(() => {
        result.current.goBackToList();
      });

      expect(result.current.currentView).toBe('list');
      expect(mockClearSelection).toHaveBeenCalled();
    });

    it('should work when going back from list view', () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      // Already on list view
      act(() => {
        result.current.goBackToList();
      });

      expect(result.current.currentView).toBe('list');
      expect(mockClearSelection).toHaveBeenCalled();
    });

    it('should work when going back from closed view', () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      // Modal is closed
      expect(result.current.currentView).toBe('closed');

      act(() => {
        result.current.goBackToList();
      });

      expect(result.current.currentView).toBe('list');
    });
  });

  describe('closing modal', () => {
    it('should close modal and reset all state', async () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      // Open modal first
      await act(async () => {
        await result.current.openAttemptsModal('exam-123', 'Test Exam');
      });

      expect(result.current.currentView).toBe('list');
      expect(result.current.currentExamId).toBe('exam-123');
      expect(result.current.currentExamTitle).toBe('Test Exam');

      // Close modal
      act(() => {
        result.current.closeModal();
      });

      expect(result.current.currentView).toBe('closed');
      expect(result.current.currentExamId).toBeNull();
      expect(result.current.currentExamTitle).toBeNull();
      expect(mockClearAttempts).toHaveBeenCalled();
    });

    it('should close modal from detail view', async () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      // Open modal and go to detail view
      await act(async () => {
        await result.current.openAttemptsModal('exam-123', 'Test Exam');
      });

      const mockAttempt = createMockExamAttempt();
      act(() => {
        result.current.openDetailModal(mockAttempt);
      });

      expect(result.current.currentView).toBe('detail');

      // Close modal
      act(() => {
        result.current.closeModal();
      });

      expect(result.current.currentView).toBe('closed');
      expect(result.current.currentExamId).toBeNull();
      expect(result.current.currentExamTitle).toBeNull();
    });

    it('should work when modal is already closed', () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      expect(result.current.currentView).toBe('closed');

      act(() => {
        result.current.closeModal();
      });

      expect(result.current.currentView).toBe('closed');
      expect(mockClearAttempts).toHaveBeenCalled();
    });
  });

  describe('view state combinations', () => {
    it('should handle rapid view changes', async () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      const mockAttempt = createMockExamAttempt();

      // Rapid state changes
      await act(async () => {
        await result.current.openAttemptsModal('exam-123', 'Test Exam');
      });

      act(() => {
        result.current.openDetailModal(mockAttempt);
        result.current.goBackToList();
        result.current.openDetailModal(mockAttempt);
        result.current.closeModal();
      });

      expect(result.current.currentView).toBe('closed');
    });

    it('should handle opening multiple exams sequentially', async () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      // Open first exam
      await act(async () => {
        await result.current.openAttemptsModal('exam-1', 'First Exam');
      });

      expect(result.current.currentExamId).toBe('exam-1');
      expect(result.current.currentExamTitle).toBe('First Exam');

      // Open second exam (should replace first)
      await act(async () => {
        await result.current.openAttemptsModal('exam-2', 'Second Exam');
      });

      expect(result.current.currentExamId).toBe('exam-2');
      expect(result.current.currentExamTitle).toBe('Second Exam');
      expect(mockLoadExamAttempts).toHaveBeenCalledTimes(2);
    });

    it('should handle all view transitions', async () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      const mockAttempt = createMockExamAttempt();

      // closed -> list
      await act(async () => {
        await result.current.openAttemptsModal('exam-123', 'Test Exam');
      });
      expect(result.current.currentView).toBe('list');

      // list -> detail
      act(() => {
        result.current.openDetailModal(mockAttempt);
      });
      expect(result.current.currentView).toBe('detail');

      // detail -> list
      act(() => {
        result.current.goBackToList();
      });
      expect(result.current.currentView).toBe('list');

      // list -> closed
      act(() => {
        result.current.closeModal();
      });
      expect(result.current.currentView).toBe('closed');
    });
  });

  describe('data integration with useExamAttemptHistory', () => {
    it('should pass through loading state correctly', () => {
      mockUseExamAttemptHistory.mockReturnValue(createMockExamAttemptHistoryHook({
        isLoading: true,
        isError: false,
      }));

      const { result } = renderHook(() => useExamAttemptsModal());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isError).toBe(false);
    });

    it('should pass through error state correctly', () => {
      mockUseExamAttemptHistory.mockReturnValue(createMockExamAttemptHistoryHook({
        isLoading: false,
        isError: true,
        error: 'Failed to load',
      }));

      const { result } = renderHook(() => useExamAttemptsModal());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe('Failed to load');
    });

    it('should pass through attempts data correctly', () => {
      // Use array creation pattern similar to testUtils.data.createTestDataCollections
      const mockAttempts = Array.from({ length: 2 }, (_, i) => 
        createMockExamAttempt({ id: `attempt-${i + 1}` })
      );

      mockUseExamAttemptHistory.mockReturnValue(createMockExamAttemptHistoryHook({
        attempts: mockAttempts,
      }));

      const { result } = renderHook(() => useExamAttemptsModal());

      expect(result.current.attempts).toEqual(mockAttempts);
    });

    it('should pass through selected attempt correctly', () => {
      const mockAttempt = createMockExamAttempt();
      
      mockUseExamAttemptHistory.mockReturnValue(createMockExamAttemptHistoryHook({
        selectedAttempt: mockAttempt,
      }));

      const { result } = renderHook(() => useExamAttemptsModal());

      expect(result.current.selectedAttempt).toEqual(mockAttempt);
    });

    it('should pass through stats correctly', () => {
      const mockStats = {
        totalAttempts: 10,
        bestScore: 9,
        averageScore: 7.5,
        bestPercentage: 90,
        averagePercentage: 75,
        lastAttemptDate: '2024-01-01T10:00:00Z',
      };

      mockUseExamAttemptHistory.mockReturnValue(createMockExamAttemptHistoryHook({
        stats: mockStats,
      }));

      const { result } = renderHook(() => useExamAttemptsModal());

      expect(result.current.stats).toEqual(mockStats);
    });

    it('should pass through helper functions correctly', () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      const mockAttempt = createMockExamAttempt();

      // Test getPercentage
      const percentage = result.current.getPercentage(mockAttempt);
      expect(percentage).toBe(80);
      expect(mockGetPercentage).toHaveBeenCalledWith(mockAttempt);

      // Test getTimeSpent
      const timeSpent = result.current.getTimeSpent(mockAttempt);
      expect(timeSpent).toBe(1800);
      expect(mockGetTimeSpent).toHaveBeenCalledWith(mockAttempt);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null exam ID', async () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      await act(async () => {
        await result.current.openAttemptsModal(null as any, 'Test Exam');
      });

      expect(result.current.currentExamId).toBeNull();
      expect(mockLoadExamAttempts).toHaveBeenCalledWith(null);
    });

    it('should handle undefined exam title', async () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      await act(async () => {
        await result.current.openAttemptsModal('exam-123', undefined as any);
      });

      expect(result.current.currentExamTitle).toBeUndefined();
    });

    it('should handle null attempt in detail modal', () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      act(() => {
        result.current.openDetailModal(null as any);
      });

      expect(result.current.currentView).toBe('detail');
      expect(mockSelectAttempt).toHaveBeenCalledWith(null);
    });

    it('should handle component unmount gracefully', async () => {
      const { result, unmount } = renderHook(() => useExamAttemptsModal());

      await act(async () => {
        await result.current.openAttemptsModal('exam-123', 'Test Exam');
      });

      expect(() => unmount()).not.toThrow();
    });

    it('should handle attempting to open detail modal when closed', () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      const mockAttempt = createMockExamAttempt();

      expect(result.current.currentView).toBe('closed');

      act(() => {
        result.current.openDetailModal(mockAttempt);
      });

      expect(result.current.currentView).toBe('detail');
      expect(mockSelectAttempt).toHaveBeenCalledWith(mockAttempt);
    });

    it('should handle concurrent modal operations', async () => {
      const { result } = renderHook(() => useExamAttemptsModal());

      const mockAttempt = createMockExamAttempt();

      // Concurrent operations
      await act(async () => {
        const promises = [
          result.current.openAttemptsModal('exam-1', 'Exam 1'),
          result.current.openAttemptsModal('exam-2', 'Exam 2'),
        ];
        await Promise.all(promises);

        result.current.openDetailModal(mockAttempt);
        result.current.goBackToList();
        result.current.closeModal();
      });

      expect(result.current.currentView).toBe('closed');
    });
  });
});