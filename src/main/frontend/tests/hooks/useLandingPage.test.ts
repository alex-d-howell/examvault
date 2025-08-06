import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLandingPage } from 'Frontend/hooks/useLandingPage';
import { mockNavigate } from '../setupTests';
import { testUtils } from '../test-utils';

describe('useLandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    testUtils.setup.setupWindowMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const defaultProps = {
    authenticated: false,
    authInitialized: false,
    loading: false,
  };

  describe('loading states', () => {
    it('should show loading when auth is not initialized', () => {
      const { result } = renderHook(() => useLandingPage({
        ...defaultProps,
        authInitialized: false,
        loading: false,
      }));

      expect(result.current.shouldShowLoading).toBe(true);
      expect(result.current.shouldShowLanding).toBe(false);
    });

    it('should show loading when loading is true', () => {
      const { result } = renderHook(() => useLandingPage({
        ...defaultProps,
        authInitialized: true,
        loading: true,
      }));

      expect(result.current.shouldShowLoading).toBe(true);
      expect(result.current.shouldShowLanding).toBe(false);
    });

    it('should show loading when both authInitialized is false and loading is true', () => {
      const { result } = renderHook(() => useLandingPage({
        ...defaultProps,
        authInitialized: false,
        loading: true,
      }));

      expect(result.current.shouldShowLoading).toBe(true);
      expect(result.current.shouldShowLanding).toBe(false);
    });
  });

  describe('landing page display', () => {
    it('should show landing page for unauthenticated user when ready', () => {
      const { result } = renderHook(() => useLandingPage({
        ...defaultProps,
        authenticated: false,
        authInitialized: true,
        loading: false,
      }));

      expect(result.current.shouldShowLoading).toBe(false);
      expect(result.current.shouldShowLanding).toBe(true);
    });

    it('should not show landing page when still loading', () => {
      const { result } = renderHook(() => useLandingPage({
        ...defaultProps,
        authenticated: false,
        authInitialized: true,
        loading: true,
      }));

      expect(result.current.shouldShowLanding).toBe(false);
    });

    it('should not show landing page when auth not initialized', () => {
      const { result } = renderHook(() => useLandingPage({
        ...defaultProps,
        authenticated: false,
        authInitialized: false,
        loading: false,
      }));

      expect(result.current.shouldShowLanding).toBe(false);
    });
  });

  describe('authenticated user redirection', () => {
    it('should redirect authenticated user to home by default', () => {
      renderHook(() => useLandingPage({
        ...defaultProps,
        authenticated: true,
        authInitialized: true,
        loading: false,
      }));

      expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
    });

    it('should redirect to stored redirect path when available', () => {
      // Mock sessionStorage with redirect path
      vi.mocked(sessionStorage.getItem).mockReturnValue('/exams/123');

      renderHook(() => useLandingPage({
        ...defaultProps,
        authenticated: true,
        authInitialized: true,
        loading: false,
      }));

      expect(sessionStorage.getItem).toHaveBeenCalledWith('redirectPath');
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('redirectPath');
      expect(mockNavigate).toHaveBeenCalledWith('/exams/123', { replace: true });
    });

    it('should not redirect to login path from sessionStorage', () => {
      // Mock sessionStorage with login path
      vi.mocked(sessionStorage.getItem).mockReturnValue('/login');

      renderHook(() => useLandingPage({
        ...defaultProps,
        authenticated: true,
        authInitialized: true,
        loading: false,
      }));

      expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
    });

    it('should not redirect to root path from sessionStorage', () => {
      // Mock sessionStorage with root path
      vi.mocked(sessionStorage.getItem).mockReturnValue('/');

      renderHook(() => useLandingPage({
        ...defaultProps,
        authenticated: true,
        authInitialized: true,
        loading: false,
      }));

      expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
    });

    it('should handle null redirect path in sessionStorage', () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue(null);

      renderHook(() => useLandingPage({
        ...defaultProps,
        authenticated: true,
        authInitialized: true,
        loading: false,
      }));

      expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
    });

    it('should handle empty string redirect path in sessionStorage', () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue('');

      renderHook(() => useLandingPage({
        ...defaultProps,
        authenticated: true,
        authInitialized: true,
        loading: false,
      }));

      expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
    });

    it('should not redirect if user is not authenticated', () => {
      renderHook(() => useLandingPage({
        ...defaultProps,
        authenticated: false,
        authInitialized: true,
        loading: false,
      }));

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should not redirect if auth is not initialized', () => {
      renderHook(() => useLandingPage({
        ...defaultProps,
        authenticated: true,
        authInitialized: false,
        loading: false,
      }));

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should not redirect if still loading', () => {
      renderHook(() => useLandingPage({
        ...defaultProps,
        authenticated: true,
        authInitialized: true,
        loading: true,
      }));

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('redirection prevention', () => {
    it('should only redirect once using ref guard', () => {
      const { rerender } = renderHook(
        (props) => useLandingPage(props),
        {
          initialProps: {
            ...defaultProps,
            authenticated: true,
            authInitialized: true,
            loading: false,
          }
        }
      );

      expect(mockNavigate).toHaveBeenCalledTimes(1);

      // Trigger rerender with same props
      rerender({
        authenticated: true,
        authInitialized: true,
        loading: false,
      });

      // Should not redirect again
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid state changes without multiple redirects', () => {
      const { rerender } = renderHook(
        (props) => useLandingPage(props),
        {
          initialProps: {
            ...defaultProps,
            authenticated: false,
            authInitialized: false,
            loading: true,
          }
        }
      );

      expect(mockNavigate).not.toHaveBeenCalled();

      // Rapid state changes
      rerender({
        authenticated: false,
        authInitialized: true,
        loading: true,
      });

      rerender({
        authenticated: true,
        authInitialized: true,
        loading: true,
      });

      rerender({
        authenticated: true,
        authInitialized: true,
        loading: false,
      });

      // Should only redirect once when finally ready
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it('should reset redirect guard when authentication changes to false', () => {
      const { rerender } = renderHook(
        (props) => useLandingPage(props),
        {
          initialProps: {
            ...defaultProps,
            authenticated: true,
            authInitialized: true,
            loading: false,
          }
        }
      );

      expect(mockNavigate).toHaveBeenCalledTimes(1);

      // Change to unauthenticated - this should reset the redirect guard
      rerender({
        authenticated: false,
        authInitialized: true,
        loading: false,
      });

      // Should not redirect for unauthenticated user
      expect(mockNavigate).toHaveBeenCalledTimes(1);

      // Change back to authenticated - should redirect again since guard was reset
      rerender({
        authenticated: true,
        authInitialized: true,
        loading: false,
      });

      // Should redirect again (ref guard should be reset)
      expect(mockNavigate).toHaveBeenCalledTimes(2);
    });
  });

  describe('state transitions', () => {
    it('should handle transition from loading to authenticated', () => {
      const { result, rerender } = renderHook(
        (props) => useLandingPage(props),
        {
          initialProps: {
            ...defaultProps,
            authenticated: false,
            authInitialized: false,
            loading: true,
          }
        }
      );

      expect(result.current.shouldShowLoading).toBe(true);
      expect(result.current.shouldShowLanding).toBe(false);

      // Transition to authenticated
      rerender({
        authenticated: true,
        authInitialized: true,
        loading: false,
      });

      expect(result.current.shouldShowLoading).toBe(false);
      expect(result.current.shouldShowLanding).toBe(false);
      expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
    });

    it('should handle transition from loading to unauthenticated', () => {
      const { result, rerender } = renderHook(
        (props) => useLandingPage(props),
        {
          initialProps: {
            ...defaultProps,
            authenticated: false,
            authInitialized: false,
            loading: true,
          }
        }
      );

      expect(result.current.shouldShowLoading).toBe(true);
      expect(result.current.shouldShowLanding).toBe(false);

      // Transition to unauthenticated
      rerender({
        authenticated: false,
        authInitialized: true,
        loading: false,
      });

      expect(result.current.shouldShowLoading).toBe(false);
      expect(result.current.shouldShowLanding).toBe(true);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle multiple state transitions', () => {
      const { result, rerender } = renderHook(
        (props) => useLandingPage(props),
        {
          initialProps: {
            ...defaultProps,
            authenticated: false,
            authInitialized: false,
            loading: true,
          }
        }
      );

      // Initial loading state
      expect(result.current.shouldShowLoading).toBe(true);
      expect(result.current.shouldShowLanding).toBe(false);

      // Auth initialized but still loading
      rerender({
        authenticated: false,
        authInitialized: true,
        loading: true,
      });

      expect(result.current.shouldShowLoading).toBe(true);
      expect(result.current.shouldShowLanding).toBe(false);

      // Loading complete, unauthenticated
      rerender({
        authenticated: false,
        authInitialized: true,
        loading: false,
      });

      expect(result.current.shouldShowLoading).toBe(false);
      expect(result.current.shouldShowLanding).toBe(true);

      // User becomes authenticated
      rerender({
        authenticated: true,
        authInitialized: true,
        loading: false,
      });

      expect(result.current.shouldShowLoading).toBe(false);
      expect(result.current.shouldShowLanding).toBe(false);
      expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle sessionStorage errors gracefully', async () => {
      // Mock sessionStorage to throw errors
      vi.mocked(sessionStorage.getItem).mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      // Spy on console.warn to verify error handling
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useLandingPage({
          ...defaultProps,
          authenticated: true,
          authInitialized: true,
          loading: false,
        }));
      }).not.toThrow();

      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      // Should still redirect to home as fallback
      expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
      expect(consoleSpy).toHaveBeenCalledWith('SessionStorage error during redirect:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle navigation errors gracefully', async () => {
      // Mock navigate to throw
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation failed');
      });

      // Spy on console methods
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useLandingPage({
          ...defaultProps,
          authenticated: true,
          authInitialized: true,
          loading: false,
        }));
      }).not.toThrow();

      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      // Should have tried to navigate and logged the error
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Navigation failed:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle both sessionStorage and navigation errors', async () => {
      // Mock both to throw errors
      vi.mocked(sessionStorage.getItem).mockImplementation(() => {
        throw new Error('Storage access denied');
      });
      
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation failed');
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useLandingPage({
          ...defaultProps,
          authenticated: true,
          authInitialized: true,
          loading: false,
        }));
      }).not.toThrow();

      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(consoleWarnSpy).toHaveBeenCalledWith('SessionStorage error during redirect:', expect.any(Error));
      expect(consoleErrorSpy).toHaveBeenCalledWith('Navigation failed:', expect.any(Error));
      
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle malformed redirect paths', () => {
      // Test various malformed paths
      const malformedPaths = [
        'not-a-path',
        'javascript:alert("xss")',
        'http://evil.com',
        '../../../etc/passwd',
        'ftp://ftp.example.com'
      ];

      malformedPaths.forEach(path => {
        mockNavigate.mockClear();
        vi.mocked(sessionStorage.getItem).mockReturnValue(path);

        renderHook(() => useLandingPage({
          ...defaultProps,
          authenticated: true,
          authInitialized: true,
          loading: false,
        }));

        // Should redirect to the stored path (no validation in current implementation)
        expect(mockNavigate).toHaveBeenCalledWith(path, { replace: true });
      });
    });

    it('should handle component unmount gracefully', () => {
      const { unmount } = renderHook(() => useLandingPage({
        ...defaultProps,
        authenticated: false,
        authInitialized: true,
        loading: false,
      }));

      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid mount/unmount cycles', () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderHook(() => useLandingPage({
          ...defaultProps,
          authenticated: i % 2 === 0,
          authInitialized: true,
          loading: false,
        }));
        unmount();
      }

      // Should not cause memory leaks or errors
      expect(mockNavigate).toHaveBeenCalledTimes(5); // Only for authenticated states
    });
  });

  describe('return value consistency', () => {
    it('should return consistent boolean values', () => {
      const { result } = renderHook(() => useLandingPage({
        ...defaultProps,
        authenticated: false,
        authInitialized: true,
        loading: false,
      }));

      expect(typeof result.current.shouldShowLoading).toBe('boolean');
      expect(typeof result.current.shouldShowLanding).toBe('boolean');
    });

    it('should ensure only one state is true at a time', () => {
      const testCases = [
        { authenticated: false, authInitialized: false, loading: true },
        { authenticated: false, authInitialized: true, loading: true },
        { authenticated: true, authInitialized: false, loading: true },
        { authenticated: true, authInitialized: true, loading: true },
        { authenticated: false, authInitialized: false, loading: false },
        { authenticated: false, authInitialized: true, loading: false },
        { authenticated: true, authInitialized: false, loading: false },
        { authenticated: true, authInitialized: true, loading: false },
      ];

      testCases.forEach(testCase => {
        const { result } = renderHook(() => useLandingPage(testCase));
        
        // At most one should be true, but both can be false
        const bothTrue = result.current.shouldShowLoading && result.current.shouldShowLanding;
        expect(bothTrue).toBe(false);
      });
    });

    it('should handle all possible boolean combinations', () => {
      const combinations = [
        [false, false, false],
        [false, false, true],
        [false, true, false],
        [false, true, true],
        [true, false, false],
        [true, false, true],
        [true, true, false],
        [true, true, true],
      ];

      combinations.forEach(([authenticated, authInitialized, loading]) => {
        expect(() => {
          renderHook(() => useLandingPage({
            authenticated,
            authInitialized,
            loading,
          }));
        }).not.toThrow();
      });
    });
  });
});