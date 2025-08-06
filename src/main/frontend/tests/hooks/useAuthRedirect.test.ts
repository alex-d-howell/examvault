import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useAuthRedirect } from 'Frontend/hooks/useAuthRedirect';
import { mockNavigate } from '../setupTests';

// Mock sessionStorage
const mockSessionStorage = {
  setItem: vi.fn(),
  getItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
};

// Mock console.warn to avoid noise in tests
const mockConsoleWarn = vi.fn();

describe('useAuthRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    
    // Setup sessionStorage mock
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    });
    
    // Mock console.warn
    vi.spyOn(console, 'warn').mockImplementation(mockConsoleWarn);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const defaultProps = {
    authenticated: false,
    authInitialized: true,
    loading: false,
    currentPath: '/protected-page',
    isProtectedRoute: true,
  };

  describe('redirect logic', () => {
    it('should redirect unauthenticated user from protected route to login', () => {
      renderHook(() => useAuthRedirect(defaultProps));

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('redirectPath', '/protected-page');
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('should not redirect if user is authenticated', () => {
      renderHook(() =>
        useAuthRedirect({
          ...defaultProps,
          authenticated: true,
        })
      );

      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should not redirect if auth is not initialized', () => {
      renderHook(() =>
        useAuthRedirect({
          ...defaultProps,
          authInitialized: false,
        })
      );

      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should not redirect if loading', () => {
      renderHook(() =>
        useAuthRedirect({
          ...defaultProps,
          loading: true,
        })
      );

      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should not redirect if route is not protected', () => {
      renderHook(() =>
        useAuthRedirect({
          ...defaultProps,
          isProtectedRoute: false,
        })
      );

      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should not redirect if already on login page', () => {
      renderHook(() =>
        useAuthRedirect({
          ...defaultProps,
          currentPath: '/login',
        })
      );

      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('redirect path storage', () => {
    it('should store current path in sessionStorage before redirecting', () => {
      const currentPath = '/dashboard';

      renderHook(() =>
        useAuthRedirect({
          ...defaultProps,
          currentPath,
        })
      );

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('redirectPath', currentPath);
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('should store complex paths with query parameters', () => {
      const currentPath = '/exams/123?tab=details&section=questions';

      renderHook(() =>
        useAuthRedirect({
          ...defaultProps,
          currentPath,
        })
      );

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('redirectPath', currentPath);
    });

    it('should store paths with hash fragments', () => {
      const currentPath = '/profile#settings';

      renderHook(() =>
        useAuthRedirect({
          ...defaultProps,
          currentPath,
        })
      );

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('redirectPath', currentPath);
    });

    it('should handle root path', () => {
      const currentPath = '/';

      renderHook(() =>
        useAuthRedirect({
          ...defaultProps,
          currentPath,
          isProtectedRoute: true,
        })
      );

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('redirectPath', '/');
    });
  });

  describe('state changes and re-evaluation', () => {
    it('should redirect when authentication state changes from loading to unauthenticated', () => {
      const { rerender } = renderHook((props) => useAuthRedirect(props), {
        initialProps: {
          ...defaultProps,
          authInitialized: false,
          loading: true,
        },
      });

      // Initially no redirect because loading
      expect(mockNavigate).not.toHaveBeenCalled();

      // Change to authenticated and initialized
      rerender({
        ...defaultProps,
        authenticated: false,
        authInitialized: true,
        loading: false,
      });

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('should not redirect when authentication state changes to authenticated', () => {
      const { rerender } = renderHook((props) => useAuthRedirect(props), {
        initialProps: {
          ...defaultProps,
          authInitialized: false,
          loading: true,
        },
      });

      // Change to authenticated
      rerender({
        ...defaultProps,
        authenticated: true,
        authInitialized: true,
        loading: false,
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should redirect when navigating to protected route while unauthenticated', () => {
      const { rerender } = renderHook((props) => useAuthRedirect(props), {
        initialProps: {
          ...defaultProps,
          currentPath: '/public-page',
          isProtectedRoute: false,
        },
      });

      // Initially no redirect for public route
      expect(mockNavigate).not.toHaveBeenCalled();

      // Navigate to protected route
      rerender({
        ...defaultProps,
        currentPath: '/protected-page',
        isProtectedRoute: true,
      });

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('should handle rapid state changes', () => {
      const { rerender } = renderHook((props) => useAuthRedirect(props), {
        initialProps: {
          ...defaultProps,
          loading: true,
        },
      });

      // Rapid state changes
      rerender({ ...defaultProps, loading: false, authInitialized: false });
      rerender({ ...defaultProps, loading: false, authInitialized: true, authenticated: true });
      rerender({ ...defaultProps, loading: false, authInitialized: true, authenticated: false });

      // Should only redirect once when finally unauthenticated
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  describe('edge cases', () => {
    it('should handle undefined currentPath', () => {
      expect(() => {
        renderHook(() =>
          useAuthRedirect({
            ...defaultProps,
            currentPath: undefined as any,
          })
        );
      }).not.toThrow();

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('redirectPath', undefined);
    });

    it('should handle empty currentPath', () => {
      renderHook(() =>
        useAuthRedirect({
          ...defaultProps,
          currentPath: '',
        })
      );

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('redirectPath', '');
    });

    it('should handle special characters in path', () => {
      const specialPath = '/path/with spaces/and#hash?query=value&other=test';

      renderHook(() =>
        useAuthRedirect({
          ...defaultProps,
          currentPath: specialPath,
        })
      );

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('redirectPath', specialPath);
    });

    it('should handle sessionStorage errors gracefully', () => {
      // Mock sessionStorage to throw
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => {
        renderHook(() => useAuthRedirect(defaultProps));
      }).not.toThrow();

      // Should still attempt to navigate even if storage fails
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Failed to save redirect path to sessionStorage:',
        expect.any(Error)
      );
    });

    it('should handle navigation errors gracefully', () => {
      // Mock navigate to throw
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation failed');
      });

      expect(() => {
        renderHook(() => useAuthRedirect(defaultProps));
      }).not.toThrow();

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('redirectPath', '/protected-page');
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Failed to navigate to login:',
        expect.any(Error)
      );
    });
  });

  describe('dependency array behavior', () => {
    it('should re-evaluate when authenticated changes', () => {
      const { rerender } = renderHook((props) => useAuthRedirect(props), {
        initialProps: { ...defaultProps, authenticated: true },
      });

      expect(mockNavigate).not.toHaveBeenCalled();

      rerender({ ...defaultProps, authenticated: false });

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('should re-evaluate when authInitialized changes', () => {
      const { rerender } = renderHook((props) => useAuthRedirect(props), {
        initialProps: { ...defaultProps, authInitialized: false },
      });

      expect(mockNavigate).not.toHaveBeenCalled();

      rerender({ ...defaultProps, authInitialized: true });

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('should re-evaluate when loading changes', () => {
      const { rerender } = renderHook((props) => useAuthRedirect(props), {
        initialProps: { ...defaultProps, loading: true },
      });

      expect(mockNavigate).not.toHaveBeenCalled();

      rerender({ ...defaultProps, loading: false });

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('should re-evaluate when currentPath changes', () => {
      const { rerender } = renderHook((props) => useAuthRedirect(props), {
        initialProps: {
          ...defaultProps,
          currentPath: '/login', // Start on login page
        },
      });

      expect(mockNavigate).not.toHaveBeenCalled();

      rerender({ ...defaultProps, currentPath: '/protected' });

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('should re-evaluate when isProtectedRoute changes', () => {
      const { rerender } = renderHook((props) => useAuthRedirect(props), {
        initialProps: { ...defaultProps, isProtectedRoute: false },
      });

      expect(mockNavigate).not.toHaveBeenCalled();

      rerender({ ...defaultProps, isProtectedRoute: true });

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  describe('multiple condition combinations', () => {
    const testCases = [
      {
        name: 'authenticated user on protected route - no redirect',
        props: { ...defaultProps, authenticated: true },
        shouldRedirect: false,
      },
      {
        name: 'authenticated user on public route - no redirect',
        props: { ...defaultProps, authenticated: true, isProtectedRoute: false },
        shouldRedirect: false,
      },
      {
        name: 'unauthenticated user on public route - no redirect',
        props: { ...defaultProps, isProtectedRoute: false },
        shouldRedirect: false,
      },
      {
        name: 'unauthenticated user on protected route while loading - no redirect',
        props: { ...defaultProps, loading: true },
        shouldRedirect: false,
      },
      {
        name: 'unauthenticated user on protected route before auth init - no redirect',
        props: { ...defaultProps, authInitialized: false },
        shouldRedirect: false,
      },
      {
        name: 'unauthenticated user already on login - no redirect',
        props: { ...defaultProps, currentPath: '/login' },
        shouldRedirect: false,
      },
      {
        name: 'unauthenticated user on protected route when ready - redirect',
        props: defaultProps,
        shouldRedirect: true,
      },
    ];

    testCases.forEach(({ name, props, shouldRedirect }) => {
      it(name, () => {
        renderHook(() => useAuthRedirect(props));

        if (shouldRedirect) {
          expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
          expect(mockSessionStorage.setItem).toHaveBeenCalledWith('redirectPath', props.currentPath);
        } else {
          expect(mockNavigate).not.toHaveBeenCalled();
          expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
        }
      });
    });
  });

  describe('component lifecycle', () => {
    it('should handle unmount without errors', () => {
      const { unmount } = renderHook(() => useAuthRedirect(defaultProps));

      expect(() => unmount()).not.toThrow();
    });

    it('should not cause memory leaks with rapid remounts', () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderHook(() => useAuthRedirect(defaultProps));
        unmount();
      }

      // Should not accumulate effects or cause issues
      expect(mockNavigate).toHaveBeenCalledTimes(10);
    });
  });
});