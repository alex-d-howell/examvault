import { useEffect } from 'react';
import { useNavigate } from 'react-router';

interface UseAuthRedirectProps {
  authenticated: boolean;
  authInitialized: boolean;
  loading: boolean;
  currentPath: string;
  isProtectedRoute: boolean;
}

export const useAuthRedirect = ({
  authenticated,
  authInitialized,
  loading,
  currentPath,
  isProtectedRoute,
}: UseAuthRedirectProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (authInitialized && !loading && !authenticated && isProtectedRoute && currentPath !== '/login') {
      try {
        sessionStorage.setItem('redirectPath', currentPath);
      } catch (error) {
        // Handle sessionStorage errors gracefully (e.g., quota exceeded, disabled)
        console.warn('Failed to save redirect path to sessionStorage:', error);
      }
      
      try {
        navigate('/login', { replace: true });
      } catch (error) {
        // Handle navigation errors gracefully
        console.warn('Failed to navigate to login:', error);
      }
    }
  }, [authenticated, authInitialized, loading, currentPath, isProtectedRoute, navigate]);
};