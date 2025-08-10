import { useState, useCallback } from 'react';
import { useExamAttemptHistory } from './useExamAttemptHistory';
import type ExamAttempt from 'Frontend/generated/com/howell/examvault/base/domain/ExamAttempt';

type ModalView = 'closed' | 'list' | 'detail';

interface UseExamAttemptsModalReturn {
  // Modal state
  currentView: ModalView;
  currentExamId: string | null;
  currentExamTitle: string | null;

  // Modal actions
  openAttemptsModal: (examId: string, examTitle: string) => Promise<void>;
  openDetailModal: (attempt: ExamAttempt) => void;
  goBackToList: () => void;
  closeModal: () => void;

  // Data from useExamAttemptHistory
  attempts: ExamAttempt[];
  selectedAttempt: ExamAttempt | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  stats: {
    totalAttempts: number;
    bestScore: number;
    averageScore: number;
    bestPercentage: number;
    averagePercentage: number;
    lastAttemptDate: string | null;
  };

  // Helper functions
  getPercentage: (attempt: ExamAttempt) => number;
  getTimeSpent: (attempt: ExamAttempt) => number;
}

export const useExamAttemptsModal = (): UseExamAttemptsModalReturn => {
  const [currentView, setCurrentView] = useState<ModalView>('closed');
  const [currentExamId, setCurrentExamId] = useState<string | null>(null);
  const [currentExamTitle, setCurrentExamTitle] = useState<string | null>(null);

  const examAttemptHistoryHook = useExamAttemptHistory();

  const openAttemptsModal = useCallback(
    async (examId: string, examTitle: string) => {
      setCurrentExamId(examId);
      setCurrentExamTitle(examTitle);
      setCurrentView('list');

      // Load the attempts data
      await examAttemptHistoryHook.loadExamAttempts(examId);
    },
    [examAttemptHistoryHook]
  );

  const openDetailModal = useCallback(
    (attempt: ExamAttempt) => {
      examAttemptHistoryHook.selectAttempt(attempt);
      setCurrentView('detail');
    },
    [examAttemptHistoryHook]
  );

  const goBackToList = useCallback(() => {
    examAttemptHistoryHook.clearSelection();
    setCurrentView('list');
  }, [examAttemptHistoryHook]);

  const closeModal = useCallback(() => {
    setCurrentView('closed');
    setCurrentExamId(null);
    setCurrentExamTitle(null);
  }, [examAttemptHistoryHook]);

  return {
    // Modal state
    currentView,
    currentExamId,
    currentExamTitle,

    // Modal actions
    openAttemptsModal,
    openDetailModal,
    goBackToList,
    closeModal,

    // Data from useExamAttemptHistory
    attempts: examAttemptHistoryHook.attempts,
    selectedAttempt: examAttemptHistoryHook.selectedAttempt,
    isLoading: examAttemptHistoryHook.isLoading,
    isError: examAttemptHistoryHook.isError,
    error: examAttemptHistoryHook.error,
    stats: examAttemptHistoryHook.stats,

    // Helper functions
    getPercentage: examAttemptHistoryHook.getPercentage,
    getTimeSpent: examAttemptHistoryHook.getTimeSpent,
  };
};
