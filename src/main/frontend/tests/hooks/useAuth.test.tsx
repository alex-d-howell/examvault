import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { UserService } from 'Frontend/generated/endpoints.js';
import { useAuth, authHook, AuthProvider } from 'Frontend/hooks/useAuth';
import { mockNavigate } from '../setupTests';
import { testUtils } from '../test-utils';

// Mock the UserService
vi.mock('Frontend/generated/endpoints.js', () => ({
  UserService: {
    isAuthenticated: vi.fn(),
    getAuthenticatedUser: vi.fn()
  }
}));

// Mock fetch for logout
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockUserService = UserService as any;

describe('useAuth', () => {
  const mockUser = testUtils.data.createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    
    // Mock sessionStorage
    testUtils.setup.setupWindowMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authHook', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => authHook());

      expect(result.current.authenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.authInitialized).toBe(false);
      expect(result.current.loading).toBe(true);
    });

    it('should check authentication on mount', async () => {
      mockUserService.isAuthenticated.mockResolvedValue(true);
      mockUserService.getAuthenticatedUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => authHook());

      await waitFor(() => {
        expect(result.current.authInitialized).toBe(true);
      });

      expect(result.current.authenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
      expect(mockUserService.isAuthenticated).toHaveBeenCalledTimes(1);
      expect(mockUserService.getAuthenticatedUser).toHaveBeenCalledTimes(1);
    });

    it('should handle unauthenticated state', async () => {
      mockUserService.isAuthenticated.mockResolvedValue(false);

      const { result } = renderHook(() => authHook());

      await waitFor(() => {
        expect(result.current.authInitialized).toBe(true);
      });

      expect(result.current.authenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(mockUserService.getAuthenticatedUser).not.toHaveBeenCalled();
    });

    it('should handle authentication service errors', async () => {
      mockUserService.isAuthenticated.mockRejectedValue(new Error('Auth check failed'));

      const { result } = renderHook(() => authHook());

      await waitFor(() => {
        expect(result.current.authInitialized).toBe(true);
      });

      expect(result.current.authenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle getUserData failure when authenticated', async () => {
      mockUserService.isAuthenticated.mockResolvedValue(true);
      mockUserService.getAuthenticatedUser.mockResolvedValue(null);

      const { result } = renderHook(() => authHook());

      await waitFor(() => {
        expect(result.current.authInitialized).toBe(true);
      });

      expect(result.current.authenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should prevent multiple simultaneous auth checks', async () => {
      mockUserService.isAuthenticated.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(true), 100))
      );
      mockUserService.getAuthenticatedUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => authHook());

      // Call checkAuth multiple times rapidly
      act(() => {
        result.current.checkAuth();
        result.current.checkAuth();
        result.current.checkAuth();
      });

      await waitFor(() => {
        expect(result.current.authInitialized).toBe(true);
      });

      // Should only have been called once due to the ref guard
      expect(mockUserService.isAuthenticated).toHaveBeenCalledTimes(1);
    });
  });

  describe('logout functionality', () => {
    it('should logout with custom redirect path', async () => {
      mockUserService.isAuthenticated.mockResolvedValue(true);
      mockUserService.getAuthenticatedUser.mockResolvedValue(mockUser);
      mockFetch.mockResolvedValue({ ok: true });

      const { result } = renderHook(() => authHook());

      await waitFor(() => {
        expect(result.current.authenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout('/custom-login');
      });

      expect(mockNavigate).toHaveBeenCalledWith('/custom-login', { replace: true });
    });

    it('should handle logout service failure gracefully', async () => {
      mockUserService.isAuthenticated.mockResolvedValue(true);
      mockUserService.getAuthenticatedUser.mockResolvedValue(mockUser);
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      const { result } = renderHook(() => authHook());

      await waitFor(() => {
        expect(result.current.authenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      // Should still clear local state and navigate
      expect(result.current.authenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('should handle network errors during logout', async () => {
      mockUserService.isAuthenticated.mockResolvedValue(true);
      mockUserService.getAuthenticatedUser.mockResolvedValue(mockUser);
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => authHook());

      await waitFor(() => {
        expect(result.current.authenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      // Should still clear state and navigate even on network error
      expect(result.current.authenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('should clear sessionStorage redirectPath on logout', async () => {
      const { sessionStorage } = testUtils.setup.setupWindowMocks();
      mockFetch.mockResolvedValue({ ok: true });

      const { result } = renderHook(() => authHook());

      await act(async () => {
        await result.current.logout();
      });

      expect(sessionStorage.removeItem).toHaveBeenCalledWith('redirectPath');
    });
  });

  describe('refreshUserData functionality', () => {
    it('should refresh user data when authenticated', async () => {
      mockUserService.isAuthenticated.mockResolvedValue(true);
      mockUserService.getAuthenticatedUser
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, name: 'Updated Name' });

      const { result } = renderHook(() => authHook());

      await waitFor(() => {
        expect(result.current.authenticated).toBe(true);
      });

      expect(result.current.user?.name).toBe('Test User');

      await act(async () => {
        await result.current.refreshUserData();
      });

      expect(result.current.user?.name).toBe('Updated Name');
      expect(mockUserService.getAuthenticatedUser).toHaveBeenCalledTimes(2);
    });

    it('should not refresh when not authenticated', async () => {
      mockUserService.isAuthenticated.mockResolvedValue(false);

      const { result } = renderHook(() => authHook());

      await waitFor(() => {
        expect(result.current.authInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.refreshUserData();
      });

      // Should only have been called once during initial auth check
      expect(mockUserService.getAuthenticatedUser).not.toHaveBeenCalled();
    });

    it('should handle null user data during refresh', async () => {
      mockUserService.isAuthenticated.mockResolvedValue(true);
      mockUserService.getAuthenticatedUser
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);

      const { result } = renderHook(() => authHook());

      await waitFor(() => {
        expect(result.current.authenticated).toBe(true);
      });

      await act(async () => {
        await result.current.refreshUserData();
      });

      expect(result.current.user).toBeNull();
    });

    it('should trigger auth recheck on refresh failure', async () => {
      mockUserService.isAuthenticated.mockResolvedValue(true);
      mockUserService.getAuthenticatedUser
        .mockResolvedValueOnce(mockUser)
        .mockRejectedValueOnce(new Error('Refresh failed'));

      const { result } = renderHook(() => authHook());

      await waitFor(() => {
        expect(result.current.authenticated).toBe(true);
      });

      // Mock checkAuth being called again
      mockUserService.isAuthenticated.mockResolvedValue(false);

      await act(async () => {
        await result.current.refreshUserData();
      });

      // checkAuth should be called again due to refresh failure
      await waitFor(() => {
        expect(mockUserService.isAuthenticated).toHaveBeenCalledTimes(2);
      });
    });

    it('should not refresh if auth check is already in progress', async () => {
      mockUserService.isAuthenticated.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(true), 100))
      );
      mockUserService.getAuthenticatedUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => authHook());

      // Try to refresh while initial auth check is still in progress
      act(() => {
        result.current.refreshUserData();
      });

      await waitFor(() => {
        expect(result.current.authInitialized).toBe(true);
      });

      // Should only have been called once (for initial auth check)
      expect(mockUserService.getAuthenticatedUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('AuthProvider context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    it('should provide auth context to child components', async () => {
      mockUserService.isAuthenticated.mockResolvedValue(true);
      mockUserService.getAuthenticatedUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.authInitialized).toBe(true);
      });

      expect(result.current.authenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(typeof result.current.checkAuth).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.refreshUserData).toBe('function');
    });

    it('should maintain consistent auth state across multiple consumers', async () => {
      mockUserService.isAuthenticated.mockResolvedValue(true);
      mockUserService.getAuthenticatedUser.mockResolvedValue(mockUser);

      const { result: result1 } = renderHook(() => useAuth(), { wrapper });
      const { result: result2 } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result1.current.authInitialized).toBe(true);
        expect(result2.current.authInitialized).toBe(true);
      });

      expect(result1.current.authenticated).toBe(result2.current.authenticated);
      expect(result1.current.user).toEqual(result2.current.user);
    });
  });

  describe('loading states', () => {
    it('should manage loading state correctly during auth check', async () => {
      let resolveAuth: (value: boolean) => void;
      const authPromise = new Promise<boolean>(resolve => {
        resolveAuth = resolve;
      });
      mockUserService.isAuthenticated.mockReturnValue(authPromise);

      const { result } = renderHook(() => authHook());

      expect(result.current.loading).toBe(true);
      expect(result.current.authInitialized).toBe(false);

      act(() => {
        resolveAuth!(true);
      });

      mockUserService.getAuthenticatedUser.mockResolvedValue(mockUser);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.authInitialized).toBe(true);
    });

    it('should manage loading state during logout', async () => {
      mockUserService.isAuthenticated.mockResolvedValue(true);
      mockUserService.getAuthenticatedUser.mockResolvedValue(mockUser);
      
      let resolveLogout: (value: Response) => void;
      const logoutPromise = new Promise<Response>(resolve => {
        resolveLogout = resolve;
      });
      mockFetch.mockReturnValue(logoutPromise);

      const { result } = renderHook(() => authHook());

      await waitFor(() => {
        expect(result.current.authenticated).toBe(true);
      });

      let logoutPromiseRef: Promise<void>;
      
      // Start logout and check loading state after React processes the state update
      await act(async () => {
        logoutPromiseRef = result.current.logout();
        // Allow React to process setLoading(true)
        await Promise.resolve();
      });

      // Now loading should be true
      expect(result.current.loading).toBe(true);

      act(() => {
        resolveLogout!({ ok: true } as Response);
      });

      await act(async () => {
        await logoutPromiseRef!;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle multiple rapid checkAuth calls', async () => {
      mockUserService.isAuthenticated.mockResolvedValue(true);
      mockUserService.getAuthenticatedUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => authHook());

      // Call checkAuth multiple times
      act(() => {
        result.current.checkAuth();
        result.current.checkAuth();
        result.current.checkAuth();
      });

      await waitFor(() => {
        expect(result.current.authInitialized).toBe(true);
      });

      // Should only be called once due to the guard
      expect(mockUserService.isAuthenticated).toHaveBeenCalledTimes(1);
    });

    it('should handle component unmount during auth operations', async () => {
      // Use fake timers for this test
      vi.useFakeTimers();

      mockUserService.isAuthenticated.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(true), 100))
      );

      const { result, unmount } = renderHook(() => authHook());

      expect(result.current.loading).toBe(true);

      // Unmount before auth completes
      unmount();

      // Should not throw errors
      expect(() => {
        vi.advanceTimersByTime(100);
      }).not.toThrow();

      // Restore real timers
      vi.useRealTimers();
    });

    it('should handle authInitialized already being true', async () => {
      mockUserService.isAuthenticated.mockResolvedValue(true);
      mockUserService.getAuthenticatedUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => authHook());

      await waitFor(() => {
        expect(result.current.authInitialized).toBe(true);
      });

      const callCount = mockUserService.isAuthenticated.mock.calls.length;

      // Manual checkAuth call when already initialized should still work
      // but the useEffect shouldn't trigger another automatic call
      await act(async () => {
        await result.current.checkAuth();
      });

      // Should have made one additional call (manual checkAuth)
      expect(mockUserService.isAuthenticated).toHaveBeenCalledTimes(callCount + 1);
    });
  });
});