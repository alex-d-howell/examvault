import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useExamSearch } from 'Frontend/hooks/useExamSearch';
import { ExamService } from 'Frontend/generated/endpoints';
import { Notification } from '@vaadin/react-components';

// Mock the ExamService
vi.mock('Frontend/generated/endpoints', () => ({
  ExamService: {
    searchExams: vi.fn(),
  },
}));

// Mock Vaadin notifications
vi.mock('@vaadin/react-components', () => ({
  Notification: {
    show: vi.fn(),
  },
}));

// Mock APP_CONFIG
vi.mock('../config/constants', () => ({
  APP_CONFIG: {
    SEARCH: {
      MIN_QUESTIONS_DEFAULT: 1,
      MAX_QUESTIONS_DEFAULT: 99999,
    },
    TIMING: {
      NOTIFICATION_DURATION: 3000,
      SUCCESS_NOTIFICATION_DURATION: 1500,
      ERROR_NOTIFICATION_DURATION: 4000,
      SHIMMER_ANIMATION_DURATION: 10,
    }
  }
}));

const mockExamService = ExamService as any;
const mockNotification = Notification as any;

describe('useExamSearch', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  const createMockExam = (overrides = {}) => ({
    id: 'exam-123',
    title: 'Test Exam',
    description: 'Test exam description',
    uploadedBy: 'Test Author',
    uploadedAt: '2024-01-01T00:00:00Z',
    tags: ['javascript', 'react'],
    questions: [{ id: 'q1' }, { id: 'q2' }],
    ...overrides,
  });

  const createSearchFilters = (overrides = {}) => ({
    title: '',
    uploadedBy: '',
    tags: [],
    startDate: '',
    endDate: '',
    minQuestions: null,
    maxQuestions: null,
    sortBy: 'date',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for expected error scenarios
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (consoleSpy) {
      consoleSpy.mockRestore();
    }
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useExamSearch());

      expect(result.current.exams).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasSearched).toBe(false);
      expect(result.current.resultsCount).toBe(0);
      expect(result.current.sortedExams).toEqual([]);
    });

    it('should provide all required methods', () => {
      const { result } = renderHook(() => useExamSearch());

      expect(typeof result.current.searchExams).toBe('function');
      expect(typeof result.current.clearSearch).toBe('function');
      expect(typeof result.current.sortExams).toBe('function');
    });
  });

  describe('search functionality', () => {
    it('should perform basic search successfully', async () => {
      const mockExams = [createMockExam(), createMockExam({ id: 'exam-456' })];
      mockExamService.searchExams.mockResolvedValue(mockExams);

      const { result } = renderHook(() => useExamSearch());

      const searchFilters = createSearchFilters({ title: 'test' });

      await act(async () => {
        await result.current.searchExams(searchFilters);
      });

      expect(result.current.exams).toEqual(mockExams);
      expect(result.current.hasSearched).toBe(true);
      expect(result.current.resultsCount).toBe(2);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle search with all filter parameters', async () => {
      const mockExams = [createMockExam()];
      mockExamService.searchExams.mockResolvedValue(mockExams);

      const { result } = renderHook(() => useExamSearch());

      const searchFilters = createSearchFilters({
        title: 'Test',
        uploadedBy: 'Author',
        tags: ['javascript', 'react'],
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        minQuestions: 5,
        maxQuestions: 20,
        sortBy: 'title',
      });

      await act(async () => {
        await result.current.searchExams(searchFilters);
      });

      expect(mockExamService.searchExams).toHaveBeenCalledWith(
        'Test',
        'Author',
        ['javascript', 'react'],
        '2024-01-01',
        '2024-12-31',
        5,
        20,
        'title'
      );
    });

    it('should handle empty search parameters with defaults', async () => {
      mockExamService.searchExams.mockResolvedValue([]);

      const { result } = renderHook(() => useExamSearch());

      const searchFilters = createSearchFilters();

      await act(async () => {
        await result.current.searchExams(searchFilters);
      });

      expect(mockExamService.searchExams).toHaveBeenCalledWith(
        '',
        '',
        [],
        '',
        '',
        1, // Default min questions from APP_CONFIG
        99999, // Default max questions from APP_CONFIG
        'date'
      );
    });

    it('should filter out undefined results', async () => {
      const mockExamsWithUndefined = [createMockExam(), undefined, createMockExam({ id: 'exam-456' }), null];
      mockExamService.searchExams.mockResolvedValue(mockExamsWithUndefined);

      const { result } = renderHook(() => useExamSearch());

      await act(async () => {
        await result.current.searchExams(createSearchFilters());
      });

      expect(result.current.exams).toHaveLength(2);
      expect(result.current.exams.every((exam) => exam !== undefined)).toBe(true);
    });

    it('should show success notification with results', async () => {
      const mockExams = [createMockExam(), createMockExam({ id: 'exam-456' })];
      mockExamService.searchExams.mockResolvedValue(mockExams);

      const { result } = renderHook(() => useExamSearch());

      await act(async () => {
        await result.current.searchExams(createSearchFilters());
      });

      expect(mockNotification.show).toHaveBeenCalledWith(
        'Found 2 exams',
        expect.objectContaining({
          position: 'top-center',
          theme: 'success',
        })
      );
    });

    it('should show notification with tags when searching by tags', async () => {
      const mockExams = [createMockExam()];
      mockExamService.searchExams.mockResolvedValue(mockExams);

      const { result } = renderHook(() => useExamSearch());

      const searchFilters = createSearchFilters({
        tags: ['javascript', 'react'],
      });

      await act(async () => {
        await result.current.searchExams(searchFilters);
      });

      expect(mockNotification.show).toHaveBeenCalledWith(
        'Found 1 exam with tags: javascript, react',
        expect.objectContaining({
          theme: 'success',
        })
      );
    });

    it('should show no results notification', async () => {
      mockExamService.searchExams.mockResolvedValue([]);

      const { result } = renderHook(() => useExamSearch());

      await act(async () => {
        await result.current.searchExams(createSearchFilters());
      });

      expect(mockNotification.show).toHaveBeenCalledWith(
        'No exams found matching your search criteria',
        expect.objectContaining({
          theme: 'contrast',
        })
      );
    });

    it('should show no results notification with tags', async () => {
      mockExamService.searchExams.mockResolvedValue([]);

      const { result } = renderHook(() => useExamSearch());

      const searchFilters = createSearchFilters({
        tags: ['nonexistent'],
      });

      await act(async () => {
        await result.current.searchExams(searchFilters);
      });

      expect(mockNotification.show).toHaveBeenCalledWith(
        'No exams found matching your search criteria (searched for tags: nonexistent)',
        expect.objectContaining({
          theme: 'contrast',
        })
      );
    });

    it('should handle search errors', async () => {
      const errorMessage = 'Search failed';
      mockExamService.searchExams.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useExamSearch());

      await act(async () => {
        await result.current.searchExams(createSearchFilters());
      });

      expect(result.current.error).toBe(`Search failed: ${errorMessage}`);
      expect(result.current.loading).toBe(false);

      expect(mockNotification.show).toHaveBeenCalledWith(
        `Search failed: ${errorMessage}`,
        expect.objectContaining({
          theme: 'error',
        })
      );
    });

    it('should handle non-Error rejections', async () => {
      mockExamService.searchExams.mockRejectedValue('String error');

      const { result } = renderHook(() => useExamSearch());

      await act(async () => {
        await result.current.searchExams(createSearchFilters());
      });

      expect(result.current.error).toBe('Search failed: Unknown error');
    });
  });

  describe('clear search functionality', () => {
    it('should clear search results and state', async () => {
      // First perform a search
      const mockExams = [createMockExam()];
      mockExamService.searchExams.mockResolvedValue(mockExams);

      const { result } = renderHook(() => useExamSearch());

      await act(async () => {
        await result.current.searchExams(createSearchFilters());
      });

      expect(result.current.hasSearched).toBe(true);
      expect(result.current.exams).toHaveLength(1);

      // Then clear search
      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.exams).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasSearched).toBe(false);
      expect(result.current.resultsCount).toBe(0);
    });

    it('should show clear notification', () => {
      const { result } = renderHook(() => useExamSearch());

      act(() => {
        result.current.clearSearch();
      });

      expect(mockNotification.show).toHaveBeenCalledWith(
        'Search cleared',
        expect.objectContaining({
          theme: 'contrast',
        })
      );
    });

    it('should reset sort to default', () => {
      const { result } = renderHook(() => useExamSearch());

      act(() => {
        result.current.clearSearch();
      });

      // Should be back to default sort
      expect(result.current.sortedExams).toEqual([]);
    });
  });

  describe('sorting functionality', () => {
    const createExamsForSorting = () => [
      createMockExam({
        id: 'exam-1',
        title: 'Zebra Exam',
        uploadedBy: 'Alice',
        uploadedAt: '2024-01-01T00:00:00Z',
        questions: [{ id: 'q1' }], // 1 question
        tags: ['javascript'],
      }),
      createMockExam({
        id: 'exam-2',
        title: 'Alpha Exam',
        uploadedBy: 'Charlie',
        uploadedAt: '2024-01-03T00:00:00Z',
        questions: [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }], // 3 questions
        tags: ['react'],
      }),
      createMockExam({
        id: 'exam-3',
        title: 'Beta Exam',
        uploadedBy: 'Bob',
        uploadedAt: '2024-01-02T00:00:00Z',
        questions: [{ id: 'q1' }, { id: 'q2' }], // 2 questions
        tags: ['vue'],
      }),
    ];

    it('should sort by date (newest first) by default', async () => {
      const mockExams = createExamsForSorting();
      mockExamService.searchExams.mockResolvedValue(mockExams);

      const { result } = renderHook(() => useExamSearch());

      await act(async () => {
        await result.current.searchExams(createSearchFilters());
      });

      const sorted = result.current.sortedExams;
      expect(sorted[0].id).toBe('exam-2'); // 2024-01-03
      expect(sorted[1].id).toBe('exam-3'); // 2024-01-02
      expect(sorted[2].id).toBe('exam-1'); // 2024-01-01
    });

    it('should sort by title alphabetically', async () => {
      const mockExams = createExamsForSorting();
      mockExamService.searchExams.mockResolvedValue(mockExams);

      const { result } = renderHook(() => useExamSearch());

      await act(async () => {
        await result.current.searchExams(createSearchFilters());
      });

      expect(result.current.exams).toHaveLength(3);

      act(() => {
        result.current.sortExams('title');
      });

      const sorted = result.current.sortedExams;
      expect(sorted[0].title).toBe('Alpha Exam');
      expect(sorted[1].title).toBe('Beta Exam');
      expect(sorted[2].title).toBe('Zebra Exam');
    });

    it('should sort by author alphabetically', async () => {
      const mockExams = createExamsForSorting();
      mockExamService.searchExams.mockResolvedValue(mockExams);

      const { result } = renderHook(() => useExamSearch());

      await act(async () => {
        await result.current.searchExams(createSearchFilters());
      });

      expect(result.current.exams).toHaveLength(3);

      act(() => {
        result.current.sortExams('author');
      });

      const sorted = result.current.sortedExams;
      expect(sorted[0].uploadedBy).toBe('Alice');
      expect(sorted[1].uploadedBy).toBe('Bob');
      expect(sorted[2].uploadedBy).toBe('Charlie');
    });

    it('should sort by question count (descending)', async () => {
      const mockExams = createExamsForSorting();
      mockExamService.searchExams.mockResolvedValue(mockExams);

      const { result } = renderHook(() => useExamSearch());

      await act(async () => {
        await result.current.searchExams(createSearchFilters());
      });

      expect(result.current.exams).toHaveLength(3);

      act(() => {
        result.current.sortExams('questions');
      });

      const sorted = result.current.sortedExams;
      expect(sorted[0].questions).toHaveLength(3); // exam-2
      expect(sorted[1].questions).toHaveLength(2); // exam-3
      expect(sorted[2].questions).toHaveLength(1); // exam-1
    });

    it('should sort by relevance with tag matching', async () => {
      const mockExams = createExamsForSorting();
      mockExamService.searchExams.mockResolvedValue(mockExams);

      const { result } = renderHook(() => useExamSearch());

      // Search with specific tags to affect relevance scoring
      await act(async () => {
        await result.current.searchExams(
          createSearchFilters({
            tags: ['javascript'],
          })
        );
      });

      expect(result.current.exams).toHaveLength(3);

      act(() => {
        result.current.sortExams('relevance');
      });

      const sorted = result.current.sortedExams;
      // Exam with 'javascript' tag should score higher
      expect(sorted[0].tags).toContain('javascript');
    });

    it('should show sort notification', async () => {
      vi.useFakeTimers();

      const mockExams = createExamsForSorting();
      mockExamService.searchExams.mockResolvedValue(mockExams);

      const { result } = renderHook(() => useExamSearch());

      await act(async () => {
        await result.current.searchExams(createSearchFilters());
      });

      expect(result.current.exams).toHaveLength(3);

      act(() => {
        result.current.sortExams('title');
      });

      // Advance timers to trigger notification
      act(() => {
        vi.advanceTimersByTime(10); // APP_CONFIG.TIMING.SHIMMER_ANIMATION_DURATION
      });

      expect(mockNotification.show).toHaveBeenCalledWith(
        'Sorted by: Title (A-Z)',
        expect.objectContaining({
          theme: 'contrast',
        })
      );

      vi.useRealTimers();
    });

    it('should handle sorting with empty results', () => {
      const { result } = renderHook(() => useExamSearch());

      act(() => {
        result.current.sortExams('title');
      });

      expect(result.current.sortedExams).toEqual([]);
    });

    it('should handle sorting with null/undefined values', async () => {
      const mockExamsWithNulls = [
        createMockExam({ title: null, uploadedBy: undefined, uploadedAt: null }),
        createMockExam({ title: 'Valid Title', uploadedBy: 'Valid Author' }),
      ];
      mockExamService.searchExams.mockResolvedValue(mockExamsWithNulls);

      const { result } = renderHook(() => useExamSearch());

      await act(async () => {
        await result.current.searchExams(createSearchFilters());
      });

      expect(result.current.exams).toHaveLength(2);

      // Should not throw when sorting
      expect(() => {
        act(() => {
          result.current.sortExams('title');
          result.current.sortExams('author');
          result.current.sortExams('date');
        });
      }).not.toThrow();
    });
  });

  describe('memoization and performance', () => {
    it('should memoize sorted results', async () => {
      const mockExams = [createMockExam()];
      mockExamService.searchExams.mockResolvedValue(mockExams);

      const { result, rerender } = renderHook(() => useExamSearch());

      await act(async () => {
        await result.current.searchExams(createSearchFilters());
      });

      expect(result.current.exams).toHaveLength(1);

      const firstSortedResults = result.current.sortedExams;

      // Rerender without changing sort
      rerender();

      // Should return same reference (memoized)
      expect(result.current.sortedExams).toBe(firstSortedResults);
    });

    it('should recalculate sorted results when sort changes', async () => {
      const mockExams = [createMockExam()];
      mockExamService.searchExams.mockResolvedValue(mockExams);

      const { result } = renderHook(() => useExamSearch());

      await act(async () => {
        await result.current.searchExams(createSearchFilters());
      });

      expect(result.current.exams).toHaveLength(1);

      const dateSortedResults = result.current.sortedExams;

      act(() => {
        result.current.sortExams('title');
      });

      const titleSortedResults = result.current.sortedExams;

      // Should be different references
      expect(titleSortedResults).not.toBe(dateSortedResults);
    });

    it('should recalculate sorted results when exams change', async () => {
      const firstExams = [createMockExam()];
      const secondExams = [createMockExam(), createMockExam({ id: 'exam-456' })];

      mockExamService.searchExams.mockResolvedValueOnce(firstExams).mockResolvedValueOnce(secondExams);

      const { result } = renderHook(() => useExamSearch());

      await act(async () => {
        await result.current.searchExams(createSearchFilters());
      });

      expect(result.current.exams).toHaveLength(1);

      const firstResults = result.current.sortedExams;

      await act(async () => {
        await result.current.searchExams(createSearchFilters());
      });

      expect(result.current.exams).toHaveLength(2);

      const secondResults = result.current.sortedExams;

      expect(secondResults).not.toBe(firstResults);
      expect(secondResults).toHaveLength(2);
    });
  });

  describe('loading state integration', () => {
    it('should reflect async operation loading state', async () => {
      let resolveSearch: (value: any) => void;
      const searchPromise = new Promise((resolve) => {
        resolveSearch = resolve;
      });
      mockExamService.searchExams.mockReturnValue(searchPromise);

      const { result } = renderHook(() => useExamSearch());

      act(() => {
        result.current.searchExams(createSearchFilters());
      });

      // Should be loading immediately
      expect(result.current.loading).toBe(true);

      // Resolve the search
      act(() => {
        resolveSearch!([]);
      });

      // Wait for loading to complete
      await act(async () => {
        await searchPromise;
      });

      expect(result.current.loading).toBe(false);
    });

    it('should combine internal and async loading states', async () => {
      const { result } = renderHook(() => useExamSearch());

      // Mock loading state during search
      let resolveSearch: (value: any) => void;
      const searchPromise = new Promise((resolve) => {
        resolveSearch = resolve;
      });
      mockExamService.searchExams.mockReturnValue(searchPromise);

      let searchCallPromise: Promise<void>;
      act(() => {
        searchCallPromise = result.current.searchExams(createSearchFilters());
      });

      // Should be loading immediately
      expect(result.current.loading).toBe(true);

      act(() => {
        resolveSearch!([]);
      });

      await act(async () => {
        await searchCallPromise!;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle component unmount during search', async () => {
      let resolveSearch: (value: any) => void;
      const searchPromise = new Promise((resolve) => {
        resolveSearch = resolve;
      });
      mockExamService.searchExams.mockReturnValue(searchPromise);

      const { result, unmount } = renderHook(() => useExamSearch());

      act(() => {
        result.current.searchExams(createSearchFilters());
      });

      // Unmount before search completes
      unmount();

      // Resolve promise after unmount - should not cause errors
      act(() => {
        resolveSearch!([]);
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle very large result sets', async () => {
      const manyExams = Array.from({ length: 1000 }, (_, i) =>
        createMockExam({
          id: `exam-${i}`,
          title: `Exam ${i}`,
          uploadedAt: new Date(2024, 0, (i % 365) + 1).toISOString(),
        })
      );

      mockExamService.searchExams.mockResolvedValue(manyExams);

      const { result } = renderHook(() => useExamSearch());

      await act(async () => {
        await result.current.searchExams(createSearchFilters());
      });

      expect(result.current.exams).toHaveLength(1000);
      expect(result.current.resultsCount).toBe(1000);

      // Sorting should still work
      act(() => {
        result.current.sortExams('title');
      });

      expect(result.current.sortedExams[0].title).toBe('Exam 0');
    });

    it('should handle rapid search calls', async () => {
      mockExamService.searchExams.mockResolvedValue([]);

      const { result } = renderHook(() => useExamSearch());

      // Make multiple rapid searches
      await act(async () => {
        const promises = [
          result.current.searchExams(createSearchFilters({ title: 'Search 1' })),
          result.current.searchExams(createSearchFilters({ title: 'Search 2' })),
          result.current.searchExams(createSearchFilters({ title: 'Search 3' })),
        ];
        await Promise.all(promises);
      });

      expect(result.current.hasSearched).toBe(true);
    });

    it('should handle special characters in search terms', async () => {
      mockExamService.searchExams.mockResolvedValue([]);

      const { result } = renderHook(() => useExamSearch());

      const specialFilters = createSearchFilters({
        title: 'Search with <tags> & "quotes" @#$%',
        uploadedBy: 'Author with symbols !@#',
      });

      await act(async () => {
        await result.current.searchExams(specialFilters);
      });

      expect(mockExamService.searchExams).toHaveBeenCalledWith(
        'Search with <tags> & "quotes" @#$%',
        'Author with symbols !@#',
        [],
        '',
        '',
        1, // APP_CONFIG defaults
        99999, // APP_CONFIG defaults
        'date'
      );
    });

    it('should maintain referential stability of methods', () => {
      const { result, rerender } = renderHook(() => useExamSearch());

      const initialMethods = {
        searchExams: result.current.searchExams,
        clearSearch: result.current.clearSearch,
        sortExams: result.current.sortExams,
      };

      // Trigger rerender
      rerender();

      expect(result.current.searchExams).toBe(initialMethods.searchExams);
      expect(result.current.clearSearch).toBe(initialMethods.clearSearch);
      expect(result.current.sortExams).toBe(initialMethods.sortExams);
    });
  });
});