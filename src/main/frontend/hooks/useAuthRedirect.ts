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
  isProtectedRoute 
}: UseAuthRedirectProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (authInitialized && !loading && !authenticated && isProtectedRoute && currentPath !== '/login') {
      sessionStorage.setItem('redirectPath', currentPath);
      navigate('/login', { replace: true });
    }
  }, [authenticated, authInitialized, loading, currentPath, isProtectedRoute, navigate]);
};