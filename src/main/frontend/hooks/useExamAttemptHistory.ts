import { useState, useCallback, useMemo } from 'react';
import type ExamAttempt from 'Frontend/generated/com/howell/examvault/base/domain/ExamAttempt';
import { ExamAttemptService } from 'Frontend/generated/endpoints';

interface UseExamAttemptHistoryReturn {
  // Data state
  attempts: ExamAttempt[];
  selectedAttempt: ExamAttempt | null;

  // Loading states
  isLoading: boolean;
  isError: boolean;
  error: string | null;

  // Actions
  loadExamAttempts: (examId: string) => Promise<void>;
  selectAttempt: (attempt: ExamAttempt) => void;
  clearSelection: () => void;
  clearAttempts: () => void;

  // Computed stats
  stats: {
    totalAttempts: number;
    bestScore: number;
    averageScore: number;
    bestPercentage: number;
    averagePercentage: number;
    lastAttemptDate: string | null;
  };

  // Helper functions for computed values
  getPercentage: (attempt: ExamAttempt) => number;
  getTimeSpent: (attempt: ExamAttempt) => number;
}

export const useExamAttemptHistory = (): UseExamAttemptHistoryReturn => {
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExamAttempts = useCallback(async (examId: string) => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      // Use existing Hilla endpoint for loading exam attempts
      const response = await ExamAttemptService.getMyExamAttemptsByExam(examId);

      // Filter out undefined values and sort attempts by startTime
      const validAttempts = (response || []).filter((attempt): attempt is ExamAttempt => attempt != null);

      const sortedAttempts = validAttempts.sort((a, b) => {
        const timeA = a.startTime ? new Date(a.startTime.toString()).getTime() : 0;
        const timeB = b.startTime ? new Date(b.startTime.toString()).getTime() : 0;
        return timeB - timeA;
      });

      setAttempts(sortedAttempts);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Failed to load exam attempts');
      console.error('Error loading exam attempts:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectAttempt = useCallback((attempt: ExamAttempt) => {
    setSelectedAttempt(attempt);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedAttempt(null);
  }, []);

  const clearAttempts = useCallback(() => {
    setAttempts([]);
    setSelectedAttempt(null);
    setIsError(false);
    setError(null);
  }, []);

  // Helper function to calculate percentage
  const getPercentage = useCallback((attempt: ExamAttempt): number => {
    const totalQuestions = attempt.exam?.questions?.length || 0;
    if (totalQuestions === 0) return 0;
    return Math.round((attempt.numberCorrect / totalQuestions) * 100);
  }, []);

  // Helper function to calculate time spent in seconds
  const getTimeSpent = useCallback((attempt: ExamAttempt): number => {
    if (!attempt.startTime || !attempt.endTime) return 0;
    const start = new Date(attempt.startTime.toString()).getTime();
    const end = new Date(attempt.endTime.toString()).getTime();
    return Math.round((end - start) / 1000); // Convert to seconds
  }, []);

  // Computed statistics
  const stats = useMemo(() => {
    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        bestScore: 0,
        averageScore: 0,
        bestPercentage: 0,
        averagePercentage: 0,
        lastAttemptDate: null,
      };
    }

    const scores = attempts.map((attempt) => attempt.numberCorrect || 0);
    const percentages = attempts.map((attempt) => getPercentage(attempt));

    const bestScore = Math.max(...scores);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const bestPercentage = Math.max(...percentages);
    const averagePercentage = percentages.reduce((sum, perc) => sum + perc, 0) / percentages.length;

    // Get the most recent attempt date (already sorted by startTime DESC)
    const lastAttemptDate = attempts.length > 0 && attempts[0].startTime ? attempts[0].startTime.toString() : null;

    return {
      totalAttempts: attempts.length,
      bestScore: Math.round(bestScore),
      averageScore: Math.round(averageScore * 100) / 100,
      bestPercentage: Math.round(bestPercentage),
      averagePercentage: Math.round(averagePercentage * 100) / 100,
      lastAttemptDate,
    };
  }, [attempts, getPercentage]);

  return {
    attempts,
    selectedAttempt,
    isLoading,
    isError,
    error,
    loadExamAttempts,
    selectAttempt,
    clearSelection,
    clearAttempts,
    stats,
    getPercentage,
    getTimeSpent,
  };
};
