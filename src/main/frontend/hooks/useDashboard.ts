import { useState, useEffect } from 'react';
import { ExamService, ExamAttemptService } from 'Frontend/generated/endpoints.js';
import type Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';
import type ExamAttempt from 'Frontend/generated/com/howell/examvault/base/domain/ExamAttempt';

interface UseDashboardReturn {
  myExams: Exam[];
  myAttempts: ExamAttempt[];
  dashboardStats: {
    totalExamsCreated: number;
    totalAttempts: number;
    uniqueExamsTaken: number;
    recentActivity: number;
    studyStreak: number;
  };
  loadingData: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const useDashboard = (
  authenticated: boolean,
  authInitialized: boolean,
  loading: boolean
): UseDashboardReturn => {
  const [myExams, setMyExams] = useState<Exam[]>([]);
  const [myAttempts, setMyAttempts] = useState<ExamAttempt[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalExamsCreated: 0,
    totalAttempts: 0,
    uniqueExamsTaken: 0,
    recentActivity: 0,
    studyStreak: 0,
  });
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateDashboardStats = (
    userExams: Exam[], 
    allAttempts: ExamAttempt[]
  ) => {
    const totalExamsCreated = userExams.length;
    const totalAttempts = allAttempts.length;
    
    // Calculate unique exams the user has attempted
    const uniqueExamIds = new Set(
      allAttempts
        .map(attempt => attempt.exam?.id)
        .filter(id => id != null)
    );
    const uniqueExamsTaken = uniqueExamIds.size;

    // Calculate recent activity (attempts in last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentActivity = allAttempts.filter(attempt => 
      attempt.endTime && new Date(attempt.endTime) > weekAgo
    ).length;

    // Calculate study streak (consecutive days with attempts)
    const studyStreak = calculateStudyStreak(allAttempts);

    return {
      totalExamsCreated,
      totalAttempts,
      uniqueExamsTaken,
      recentActivity,
      studyStreak,
    };
  };

  const calculateStudyStreak = (attempts: ExamAttempt[]): number => {
    if (attempts.length === 0) return 0;

    // Group attempts by date
    const attemptDates = attempts
      .filter(attempt => attempt.endTime)
      .map(attempt => {
        const date = new Date(attempt.endTime!);
        return date.toDateString();
      })
      .filter((date, index, array) => array.indexOf(date) === index) // Remove duplicates
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Sort desc

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const dateString of attemptDates) {
      const attemptDate = new Date(dateString);
      const daysDiff = Math.floor((currentDate.getTime() - attemptDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff === streak + 1) {
        // Allow for yesterday if today hasn't been completed yet
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const loadUserData = async () => {
    if (!authenticated) return;

    setLoadingData(true);
    setError(null);

    try {
      const [userExams, userAttempts] = await Promise.all([
        ExamService.getMyExams(),
        ExamAttemptService.getMyExamAttempts() // Load ALL user attempts, not just recent
      ]);

      // Filter out undefined values to ensure type safety
      const filteredExams = (userExams || []).filter((exam): exam is Exam => exam != null);
      const filteredAttempts = (userAttempts || []).filter((attempt): attempt is ExamAttempt => attempt != null);

      setMyExams(filteredExams);
      setMyAttempts(filteredAttempts);

      // Calculate dashboard statistics
      const stats = calculateDashboardStats(filteredExams, filteredAttempts);
      setDashboardStats(stats);

    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (authenticated && authInitialized && !loading) {
      loadUserData();
    }
  }, [authenticated, authInitialized, loading]);

  return {
    myExams,
    myAttempts,
    dashboardStats,
    loadingData,
    error,
    refreshData: loadUserData,
  };
};