import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';

interface UseLandingPageProps {
  authenticated: boolean;
  authInitialized: boolean;
  loading: boolean;
}

interface UseLandingPageReturn {
  shouldShowLoading: boolean;
  shouldShowLanding: boolean;
}

export const useLandingPage = ({
  authenticated,
  authInitialized,
  loading,
}: UseLandingPageProps): UseLandingPageReturn => {
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (authInitialized && !loading && authenticated && !hasRedirected.current) {
      hasRedirected.current = true;

      const redirectPath = sessionStorage.getItem('redirectPath');
      if (redirectPath && redirectPath !== '/login' && redirectPath !== '/') {
        sessionStorage.removeItem('redirectPath');
        navigate(redirectPath, { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    }
  }, [authenticated, authInitialized, loading, navigate]);

  const shouldShowLoading = !authInitialized || loading;
  const shouldShowLanding = authInitialized && !loading && !authenticated;

  return {
    shouldShowLoading,
    shouldShowLanding,
  };
};
