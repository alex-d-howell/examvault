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

  // Reset redirect guard when user becomes unauthenticated
  useEffect(() => {
    if (!authenticated) {
      hasRedirected.current = false;
    }
  }, [authenticated]);

  useEffect(() => {
    if (authInitialized && !loading && authenticated && !hasRedirected.current) {
      hasRedirected.current = true;

      // Wrap everything in try-catch to prevent uncaught errors
      const performRedirect = async () => {
        try {
          let redirectPath: string | null = null;
          
          try {
            redirectPath = sessionStorage.getItem('redirectPath');
            if (redirectPath && redirectPath !== '/login' && redirectPath !== '/') {
              sessionStorage.removeItem('redirectPath');
            } else {
              redirectPath = null;
            }
          } catch (sessionError) {
            console.warn('SessionStorage error during redirect:', sessionError);
            redirectPath = null;
          }

          try {
            navigate(redirectPath || '/home', { replace: true });
          } catch (navError) {
            console.error('Navigation failed:', navError);
            // Don't re-throw to prevent uncaught errors
          }
        } catch (error) {
          console.error('Unexpected error during redirect:', error);
        }
      };

      performRedirect();
    }
  }, [authenticated, authInitialized, loading, navigate]);

  const shouldShowLoading = !authInitialized || loading;
  const shouldShowLanding = authInitialized && !loading && !authenticated;

  return {
    shouldShowLoading,
    shouldShowLanding,
  };
};