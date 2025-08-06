import { useState, useCallback, useMemo } from 'react';
import { Notification } from '@vaadin/react-components';
import { ExamService } from 'Frontend/generated/endpoints';
import type Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';
import { APP_CONFIG } from '../config/constants';

export interface SearchFilters {
  title: string;
  uploadedBy: string;
  tags: string[];
  startDate: string;
  endDate: string;
  minQuestions: number | null;
  maxQuestions: number | null;
  sortBy: string;
}

export type ClientSortOption = 'date' | 'title' | 'author' | 'questions' | 'comments' | 'relevance';

interface ExamSearchState {
  exams: Exam[];
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
  lastFilters: SearchFilters | null;
  sortBy: ClientSortOption;
}

export interface UseExamSearchReturn {
  // State
  exams: Exam[];
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
  resultsCount: number;
  
  // Computed
  sortedExams: Exam[];
  
  // Actions  
  searchExams: (filters: SearchFilters) => Promise<void>;
  clearSearch: () => void;
  sortExams: (sortBy: ClientSortOption) => void;
}

// Client-side sorting function extracted from component
const sortExamsClientSide = (
  examList: Exam[], 
  sortBy: ClientSortOption,
  lastFilters?: SearchFilters | null
): Exam[] => {
  if (!examList || examList.length === 0) {
    return [];
  }

  const sorted = [...examList];

  switch (sortBy) {
    case 'title':
      return sorted.sort((a, b) => {
        const titleA = a.title || '';
        const titleB = b.title || '';
        return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
      });

    case 'author':
      return sorted.sort((a, b) => {
        const authorA = a.uploadedBy || '';
        const authorB = b.uploadedBy || '';
        return authorA.localeCompare(authorB, undefined, { sensitivity: 'base' });
      });

    case 'questions':
      return sorted.sort((a, b) => {
        const countA = a.questions?.length || 0;
        const countB = b.questions?.length || 0;
        return countB - countA; // Descending
      });

    case 'relevance':
      return sorted.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        // Question count factor
        scoreA += (a.questions?.length || 0) * 0.1;
        scoreB += (b.questions?.length || 0) * 0.1;

        // Recency factor
        if (a.uploadedAt && b.uploadedAt) {
          const daysSinceA = (Date.now() - new Date(a.uploadedAt).getTime()) / (1000 * 60 * 60 * 24);
          const daysSinceB = (Date.now() - new Date(b.uploadedAt).getTime()) / (1000 * 60 * 60 * 24);
          scoreA += Math.max(0, 30 - daysSinceA) * 0.1;
          scoreB += Math.max(0, 30 - daysSinceB) * 0.1;
        }

        // Tag match factor
        if (lastFilters?.tags && lastFilters.tags.length > 0) {
          const searchTags = lastFilters.tags.map(tag => tag.toLowerCase());
          const examTagsA = (a.tags || []).map(tag => tag?.toLowerCase()).filter(Boolean);
          const examTagsB = (b.tags || []).map(tag => tag?.toLowerCase()).filter(Boolean);

          const matchesA = searchTags.filter(tag => examTagsA.includes(tag)).length;
          const matchesB = searchTags.filter(tag => examTagsB.includes(tag)).length;

          scoreA += matchesA * 0.3;
          scoreB += matchesB * 0.3;
        }

        return scoreB - scoreA;
      });

    case 'date':
    default:
      return sorted.sort((a, b) => {
        if (!a.uploadedAt && !b.uploadedAt) return 0;
        if (!a.uploadedAt) return 1;
        if (!b.uploadedAt) return -1;
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      });
  }
};

export const useExamSearch = (): UseExamSearchReturn => {
  const [state, setState] = useState<ExamSearchState>({
    exams: [],
    loading: false,
    error: null,
    hasSearched: false,
    lastFilters: null,
    sortBy: 'date',
  });

  const searchExams = useCallback(async (filters: SearchFilters) => {
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      hasSearched: true,
      lastFilters: filters 
    }));

    try {
      const results = await ExamService.searchExams(
        filters.title || '',
        filters.uploadedBy || '',
        filters.tags || [],
        filters.startDate || '',
        filters.endDate || '',
        filters.minQuestions || APP_CONFIG.SEARCH.MIN_QUESTIONS_DEFAULT,
        filters.maxQuestions || APP_CONFIG.SEARCH.MAX_QUESTIONS_DEFAULT,
        filters.sortBy || 'date'
      );

      const validResults = (results || []).filter((exam: Exam | undefined): exam is Exam => 
        exam !== undefined && exam !== null
      );
      
      setState(prev => ({
        ...prev,
        exams: validResults,
        loading: false,
        error: null
      }));

      // Notifications
      if (validResults.length === 0) {
        let message = 'No exams found matching your search criteria';
        if (filters.tags && filters.tags.length > 0) {
          message += ` (searched for tags: ${filters.tags.join(', ')})`;
        }

        Notification.show(message, {
          position: 'top-center',
          duration: APP_CONFIG.TIMING.ERROR_NOTIFICATION_DURATION,
          theme: 'contrast'
        });
      } else {
        let message = `Found ${validResults.length} exam${validResults.length === 1 ? '' : 's'}`;
        if (filters.tags && filters.tags.length > 0) {
          message += ` with tags: ${filters.tags.join(', ')}`;
        }

        Notification.show(message, {
          position: 'top-center',
          duration: APP_CONFIG.TIMING.NOTIFICATION_DURATION,
          theme: 'success'
        });
      }
    } catch (error) {
      console.error('Error in advanced search:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Search failed: ${errorMessage}`
      }));

      Notification.show(`Search failed: ${errorMessage}`, {
        position: 'top-center',
        duration: APP_CONFIG.TIMING.ERROR_NOTIFICATION_DURATION,
        theme: 'error'
      });
    }
  }, []);

  const clearSearch = useCallback(() => {
    setState({
      exams: [],
      loading: false,
      error: null,
      hasSearched: false,
      lastFilters: null,
      sortBy: 'date',
    });

    Notification.show('Search cleared', {
      position: 'top-center',
      duration: APP_CONFIG.TIMING.SUCCESS_NOTIFICATION_DURATION,
      theme: 'contrast'
    });
  }, []);

  const sortExams = useCallback((sortBy: ClientSortOption) => {
    setState(prev => ({ ...prev, sortBy }));

    // Performance feedback with error handling for timers
    if (typeof setTimeout !== 'undefined') {
      setTimeout(() => {
        const sortLabels: Record<ClientSortOption, string> = {
          date: 'Upload Date (Newest First)',
          title: 'Title (A-Z)',
          author: 'Author (A-Z)',
          questions: 'Question Count (Most First)',
          comments: 'Comment Count (Most First)',
          relevance: 'Relevance Score'
        };

        Notification.show(`Sorted by: ${sortLabels[sortBy]}`, {
          position: 'top-center',
          duration: APP_CONFIG.TIMING.SUCCESS_NOTIFICATION_DURATION,
          theme: 'contrast'
        });
      }, APP_CONFIG.TIMING.SHIMMER_ANIMATION_DURATION);
    }
  }, []);

  // Memoized sorted results for performance
  const sortedExams = useMemo(() => {
    return sortExamsClientSide(state.exams, state.sortBy, state.lastFilters);
  }, [state.exams, state.sortBy, state.lastFilters]);

  return {
    exams: state.exams,
    loading: state.loading,
    error: state.error,
    hasSearched: state.hasSearched,
    resultsCount: state.exams.length,
    sortedExams,
    searchExams,
    clearSearch,
    sortExams,
  };
};