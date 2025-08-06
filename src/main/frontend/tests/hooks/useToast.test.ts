import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from 'Frontend/hooks/useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with empty toasts array', () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.toasts).toEqual([]);
    });

    it('should provide all required methods', () => {
      const { result } = renderHook(() => useToast());

      expect(typeof result.current.addToast).toBe('function');
      expect(typeof result.current.removeToast).toBe('function');
      expect(typeof result.current.clearAllToasts).toBe('function');
      expect(typeof result.current.showSuccess).toBe('function');
      expect(typeof result.current.showError).toBe('function');
      expect(typeof result.current.showWarning).toBe('function');
      expect(typeof result.current.showInfo).toBe('function');
    });
  });

  describe('addToast functionality', () => {
    it('should add a toast with generated ID', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('success', 'Test message');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        type: 'success',
        message: 'Test message',
        duration: 4000
      });
      expect(result.current.toasts[0].id).toBeTruthy();
    });

    it('should add toast with custom duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('info', 'Custom duration', 2000);
      });

      expect(result.current.toasts[0].duration).toBe(2000);
    });

    it('should generate unique IDs for multiple toasts', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('success', 'First toast');
        result.current.addToast('error', 'Second toast');
      });

      expect(result.current.toasts).toHaveLength(2);
      expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id);
    });

    it('should return the generated toast ID', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        toastId = result.current.addToast('warning', 'Test');
      });

      expect(toastId!).toBeTruthy();
      expect(result.current.toasts[0].id).toBe(toastId!);
    });

    it('should add multiple toasts in order', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('success', 'First');
        result.current.addToast('error', 'Second');
        result.current.addToast('warning', 'Third');
      });

      expect(result.current.toasts).toHaveLength(3);
      expect(result.current.toasts[0].message).toBe('First');
      expect(result.current.toasts[1].message).toBe('Second');
      expect(result.current.toasts[2].message).toBe('Third');
    });
  });

  describe('auto-removal functionality', () => {
    it('should auto-remove toast after specified duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('success', 'Auto remove', 1000);
      });

      expect(result.current.toasts).toHaveLength(1);

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('should auto-remove toast with default duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('success', 'Default duration');
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('should not auto-remove toast with duration 0', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('error', 'Persistent toast', 0);
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.toasts).toHaveLength(1);
    });

    it('should not auto-remove toast with negative duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('warning', 'Negative duration', -1000);
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.toasts).toHaveLength(1);
    });

    it('should handle multiple toasts with different durations', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('success', 'Short', 1000);
        result.current.addToast('error', 'Medium', 2000);
        result.current.addToast('warning', 'Long', 3000);
      });

      expect(result.current.toasts).toHaveLength(3);

      // After 1 second - first toast should be removed
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.toasts).toHaveLength(2);
      expect(result.current.toasts.find(t => t.message === 'Short')).toBeUndefined();

      // After 2 seconds total - second toast should be removed
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts.find(t => t.message === 'Medium')).toBeUndefined();

      // After 3 seconds total - third toast should be removed
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('removeToast functionality', () => {
    it('should remove specific toast by ID', () => {
      const { result } = renderHook(() => useToast());

      let firstId: string, secondId: string;
      act(() => {
        firstId = result.current.addToast('success', 'First');
        secondId = result.current.addToast('error', 'Second');
      });

      expect(result.current.toasts).toHaveLength(2);

      act(() => {
        result.current.removeToast(firstId!);
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].id).toBe(secondId!);
    });

    it('should handle removal of non-existent toast ID gracefully', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('success', 'Existing toast');
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.removeToast('non-existent-id');
      });

      expect(result.current.toasts).toHaveLength(1);
    });

    it('should handle removal from empty toasts array', () => {
      const { result } = renderHook(() => useToast());

      expect(() => {
        act(() => {
          result.current.removeToast('any-id');
        });
      }).not.toThrow();

      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('clearAllToasts functionality', () => {
    it('should clear all toasts', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('success', 'First');
        result.current.addToast('error', 'Second');
        result.current.addToast('warning', 'Third');
      });

      expect(result.current.toasts).toHaveLength(3);

      act(() => {
        result.current.clearAllToasts();
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('should handle clearing empty toasts array', () => {
      const { result } = renderHook(() => useToast());

      expect(() => {
        act(() => {
          result.current.clearAllToasts();
        });
      }).not.toThrow();

      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('convenience methods', () => {
    describe('showSuccess', () => {
      it('should create success toast with default duration', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
          result.current.showSuccess('Success message');
        });

        expect(result.current.toasts[0]).toMatchObject({
          type: 'success',
          message: 'Success message',
          duration: 4000
        });
      });

      it('should create success toast with custom duration', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
          result.current.showSuccess('Success message', 2000);
        });

        expect(result.current.toasts[0].duration).toBe(2000);
      });

      it('should return toast ID', () => {
        const { result } = renderHook(() => useToast());

        let toastId: string;
        act(() => {
          toastId = result.current.showSuccess('Success');
        });

        expect(toastId!).toBeTruthy();
        expect(result.current.toasts[0].id).toBe(toastId!);
      });
    });

    describe('showError', () => {
      it('should create error toast with default duration of 6000ms', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
          result.current.showError('Error message');
        });

        expect(result.current.toasts[0]).toMatchObject({
          type: 'error',
          message: 'Error message',
          duration: 6000
        });
      });

      it('should create error toast with custom duration', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
          result.current.showError('Error message', 3000);
        });

        expect(result.current.toasts[0].duration).toBe(3000);
      });
    });

    describe('showWarning', () => {
      it('should create warning toast with default duration', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
          result.current.showWarning('Warning message');
        });

        expect(result.current.toasts[0]).toMatchObject({
          type: 'warning',
          message: 'Warning message',
          duration: 4000
        });
      });

      it('should create warning toast with custom duration', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
          result.current.showWarning('Warning message', 1500);
        });

        expect(result.current.toasts[0].duration).toBe(1500);
      });
    });

    describe('showInfo', () => {
      it('should create info toast with default duration', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
          result.current.showInfo('Info message');
        });

        expect(result.current.toasts[0]).toMatchObject({
          type: 'info',
          message: 'Info message',
          duration: 4000
        });
      });

      it('should create info toast with custom duration', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
          result.current.showInfo('Info message', 500);
        });

        expect(result.current.toasts[0].duration).toBe(500);
      });
    });
  });

  describe('edge cases and robustness', () => {
    it('should handle very long messages', () => {
      const { result } = renderHook(() => useToast());
      const longMessage = 'A'.repeat(1000);

      act(() => {
        result.current.addToast('info', longMessage);
      });

      expect(result.current.toasts[0].message).toBe(longMessage);
    });

    it('should handle empty messages', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('success', '');
      });

      expect(result.current.toasts[0].message).toBe('');
    });

    it('should handle special characters in messages', () => {
      const { result } = renderHook(() => useToast());
      const specialMessage = 'Message with <tags> & "quotes" and symbols @#$%';

      act(() => {
        result.current.addToast('warning', specialMessage);
      });

      expect(result.current.toasts[0].message).toBe(specialMessage);
    });

    it('should handle rapid consecutive operations', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        // Add many toasts rapidly
        for (let i = 0; i < 10; i++) {
          result.current.addToast('info', `Toast ${i}`);
        }
      });

      expect(result.current.toasts).toHaveLength(10);

      act(() => {
        // Clear all rapidly
        result.current.clearAllToasts();
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('should maintain referential stability of methods', () => {
      const { result, rerender } = renderHook(() => useToast());

      const initialMethods = {
        addToast: result.current.addToast,
        removeToast: result.current.removeToast,
        clearAllToasts: result.current.clearAllToasts,
        showSuccess: result.current.showSuccess,
        showError: result.current.showError,
        showWarning: result.current.showWarning,
        showInfo: result.current.showInfo
      };

      // Trigger rerender
      rerender();

      // Methods should maintain referential equality
      expect(result.current.addToast).toBe(initialMethods.addToast);
      expect(result.current.removeToast).toBe(initialMethods.removeToast);
      expect(result.current.clearAllToasts).toBe(initialMethods.clearAllToasts);
      expect(result.current.showSuccess).toBe(initialMethods.showSuccess);
      expect(result.current.showError).toBe(initialMethods.showError);
      expect(result.current.showWarning).toBe(initialMethods.showWarning);
      expect(result.current.showInfo).toBe(initialMethods.showInfo);
    });

    it('should handle component unmount during auto-removal', () => {
      const { result, unmount } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('success', 'Test', 2000);
      });

      expect(result.current.toasts).toHaveLength(1);

      // Unmount before timer completion
      unmount();

      // Should not throw error when timer tries to remove toast
      expect(() => {
        act(() => {
          vi.advanceTimersByTime(2000);
        });
      }).not.toThrow();
    });
  });
});