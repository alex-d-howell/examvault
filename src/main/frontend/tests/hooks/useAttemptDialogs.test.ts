import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAttemptDialogs } from 'Frontend/hooks/useAttemptDialogs';

describe('useAttemptDialogs', () => {
  let originalLocation: typeof window.location;
  let originalHistory: typeof window.history;
  let mockLocation: any;
  let mockHistory: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Store original values
    originalLocation = window.location;
    originalHistory = window.history;

    // Create fresh mocks for each test with proper href tracking
    let currentHref = 'http://localhost:3000/exams/123/attempt';
    
    mockLocation = {
      get href() { return currentHref; },
      set href(value: string) { currentHref = value; },
      assign: vi.fn((url: string) => { currentHref = url; }),
      replace: vi.fn((url: string) => { currentHref = url; }),
      reload: vi.fn(),
      toString: vi.fn(() => currentHref),
    };

    mockHistory = {
      back: vi.fn(),
      forward: vi.fn(),
      go: vi.fn(),
      pushState: vi.fn(),
      replaceState: vi.fn(),
      length: 1,
      scrollRestoration: 'auto' as ScrollRestoration,
      state: null,
    };

    // Mock window.location and window.history
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'history', {
      value: mockHistory,
      writable: true,
      configurable: true,
    });

    // Mock console.error to avoid noise in test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'history', {
      value: originalHistory,
      writable: true,
      configurable: true,
    });

    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'history', {
      value: originalHistory,
      writable: true,
      configurable: true,
    });

    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with all dialogs closed and no pending navigation', () => {
      const { result } = renderHook(() => useAttemptDialogs());

      expect(result.current).not.toBeNull();
      expect(result.current.showConfirmDialog).toBe(false);
      expect(result.current.showLeaveDialog).toBe(false);
      expect(result.current.pendingNavigation).toBeNull();
    });

    it('should provide all required methods', () => {
      const { result } = renderHook(() => useAttemptDialogs());

      expect(result.current).not.toBeNull();
      expect(typeof result.current.openConfirmDialog).toBe('function');
      expect(typeof result.current.closeConfirmDialog).toBe('function');
      expect(typeof result.current.openLeaveDialog).toBe('function');
      expect(typeof result.current.closeLeaveDialog).toBe('function');
      expect(typeof result.current.setPendingNavigation).toBe('function');
      expect(typeof result.current.handleConfirmSubmit).toBe('function');
      expect(typeof result.current.handleConfirmLeave).toBe('function');
      expect(typeof result.current.handleCancelLeave).toBe('function');
    });
  });

  describe('confirm dialog management', () => {
    it('should open and close confirm dialog', () => {
      const { result } = renderHook(() => useAttemptDialogs());

      expect(result.current).not.toBeNull();

      act(() => {
        result.current.openConfirmDialog();
      });

      expect(result.current.showConfirmDialog).toBe(true);

      act(() => {
        result.current.closeConfirmDialog();
      });

      expect(result.current.showConfirmDialog).toBe(false);
    });
  });

  describe('leave dialog management', () => {
    it('should open and close leave dialog', () => {
      const { result } = renderHook(() => useAttemptDialogs());

      expect(result.current).not.toBeNull();

      act(() => {
        result.current.openLeaveDialog();
      });

      expect(result.current.showLeaveDialog).toBe(true);

      act(() => {
        result.current.closeLeaveDialog();
      });

      expect(result.current.showLeaveDialog).toBe(false);
    });
  });

  describe('pending navigation management', () => {
    it('should set and clear pending navigation URL', () => {
      const { result } = renderHook(() => useAttemptDialogs());

      expect(result.current).not.toBeNull();

      const testUrl = 'http://example.com/test';

      act(() => {
        result.current.setPendingNavigation(testUrl);
      });

      expect(result.current.pendingNavigation).toBe(testUrl);

      act(() => {
        result.current.setPendingNavigation(null);
      });

      expect(result.current.pendingNavigation).toBeNull();
    });
  });

  describe('confirm submission handler', () => {
    it('should close confirm dialog and execute submit function', async () => {
      const { result } = renderHook(() => useAttemptDialogs());
      
      expect(result.current).not.toBeNull();
      
      const mockSubmitFn = vi.fn().mockResolvedValue(undefined);

      act(() => {
        result.current.openConfirmDialog();
      });

      expect(result.current.showConfirmDialog).toBe(true);

      await act(async () => {
        await result.current.handleConfirmSubmit(mockSubmitFn);
      });

      expect(result.current.showConfirmDialog).toBe(false);
      expect(mockSubmitFn).toHaveBeenCalledTimes(1);
    });

    it('should handle submit function errors gracefully', async () => {
      const { result } = renderHook(() => useAttemptDialogs());
      
      expect(result.current).not.toBeNull();
      
      const mockSubmitFn = vi.fn().mockRejectedValue(new Error('Submit failed'));

      act(() => {
        result.current.openConfirmDialog();
      });

      await act(async () => {
        await result.current.handleConfirmSubmit(mockSubmitFn);
      });

      expect(result.current.showConfirmDialog).toBe(false);
      expect(mockSubmitFn).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('Submit function failed:', expect.any(Error));
    });
  });

  describe('confirm leave handler', () => {
    it('should close leave dialog and navigate to pending URL', () => {
      const { result } = renderHook(() => useAttemptDialogs());

      expect(result.current).not.toBeNull();

      const testUrl = 'http://example.com/target';

      act(() => {
        result.current.setPendingNavigation(testUrl);
        result.current.openLeaveDialog();
      });

      expect(result.current.showLeaveDialog).toBe(true);
      expect(result.current.pendingNavigation).toBe(testUrl);

      act(() => {
        result.current.handleConfirmLeave();
      });

      expect(result.current.showLeaveDialog).toBe(false);
      expect(result.current.pendingNavigation).toBeNull();
      expect(mockLocation.href).toBe(testUrl);
    });
  });

  describe('cancel leave handler', () => {
    it('should close leave dialog and clear pending navigation', () => {
      const { result } = renderHook(() => useAttemptDialogs());

      expect(result.current).not.toBeNull();

      const testUrl = 'http://example.com/target';

      act(() => {
        result.current.setPendingNavigation(testUrl);
        result.current.openLeaveDialog();
      });

      expect(result.current.showLeaveDialog).toBe(true);
      expect(result.current.pendingNavigation).toBe(testUrl);

      act(() => {
        result.current.handleCancelLeave();
      });

      expect(result.current.showLeaveDialog).toBe(false);
      expect(result.current.pendingNavigation).toBeNull();
      // Should not navigate - href should remain unchanged
      expect(mockLocation.href).toBe('http://localhost:3000/exams/123/attempt');
      expect(mockHistory.back).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle window.location assignment errors gracefully', () => {
      // Override the mock for this specific test
      let currentHref = 'http://localhost:3000/exams/123/attempt';
      const throwingLocation = {
        get href() { return currentHref; },
        set href(value: string) {
          throw new Error('Navigation failed');
        },
        assign: vi.fn(),
        replace: vi.fn(),
        reload: vi.fn(),
        toString: vi.fn(() => currentHref),
      };

      Object.defineProperty(window, 'location', {
        value: throwingLocation,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useAttemptDialogs());

      expect(result.current).not.toBeNull();

      act(() => {
        result.current.setPendingNavigation('http://example.com/test');
      });

      expect(() => {
        act(() => {
          result.current.handleConfirmLeave();
        });
      }).not.toThrow();

      expect(console.error).toHaveBeenCalledWith('Navigation failed:', expect.any(Error));
    });

    it('should handle window.history.back errors gracefully', () => {
      // Override the mock for this specific test
      const throwingHistory = {
        ...mockHistory,
        back: vi.fn(() => {
          throw new Error('History back failed');
        }),
      };

      Object.defineProperty(window, 'history', {
        value: throwingHistory,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useAttemptDialogs());

      expect(result.current).not.toBeNull();

      expect(() => {
        act(() => {
          result.current.handleConfirmLeave();
        });
      }).not.toThrow();

      expect(throwingHistory.back).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('Navigation failed:', expect.any(Error));
    });

    it('should handle component unmount gracefully', () => {
      const { result, unmount } = renderHook(() => useAttemptDialogs());

      expect(result.current).not.toBeNull();

      act(() => {
        result.current.openConfirmDialog();
        result.current.openLeaveDialog();
        result.current.setPendingNavigation('http://example.com/test');
      });

      expect(() => unmount()).not.toThrow();
    });
  });
});