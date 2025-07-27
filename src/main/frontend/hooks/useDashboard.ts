import { useState, useEffect } from 'react';
import { ExamService } from 'Frontend/generated/endpoints.js';

interface UseDashboardReturn {
  recentExams: any[];
  myExams: any[];
  loadingData: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const useDashboard = (
  authenticated: boolean,
  authInitialized: boolean,
  loading: boolean
): UseDashboardReturn => {
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [myExams, setMyExams] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserData = async () => {
    if (!authenticated) return;

    setLoadingData(true);
    setError(null);

    try {
      const [allExams, userExams] = await Promise.all([ExamService.getRecentExams(7), ExamService.getMyExams()]);

      const recent = allExams?.slice(-6).reverse();
      setRecentExams(recent || []);
      setMyExams(userExams || []);
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
    recentExams,
    myExams,
    loadingData,
    error,
    refreshData: loadUserData,
  };
};
