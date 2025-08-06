import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAsyncOperation } from 'Frontend/hooks/useAsyncOperation';

describe('useAsyncOperation', () => {
  beforeEach(() => {
    // Mock console.error to avoid noise in test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useAsyncOperation());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeNull();
      expect(typeof result.current.execute).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('successful operations', () => {
    it('should execute successful operation and return data', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>());
      const mockOperation = vi.fn().mockResolvedValue('success data');

      let operationResult: string | null;
      await act(async () => {
        operationResult = await result.current.execute(mockOperation);
      });

      expect(operationResult!).toBe('success data');
      expect(result.current.data).toBe('success data');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should handle loading state correctly during operation', async () => {
      const { result } = renderHook(() => useAsyncOperation());
      const mockOperation = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('data'), 100))
      );

      let operationPromise: Promise<any>;
      
      // Start the operation and allow React to process state updates
      await act(async () => {
        operationPromise = result.current.execute(mockOperation);
      });

      // Now loading should be true after React has processed the state update
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();

      // Wait for the operation to complete
      await act(async () => {
        await operationPromise!;
      });

      // Verify final state
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe('data');
    });

    it('should handle different data types', async () => {
      // Test with object
      const { result: objectResult } = renderHook(() => useAsyncOperation<{ id: number; name: string }>());
      const objectData = { id: 1, name: 'test' };
      
      await act(async () => {
        await objectResult.current.execute(() => Promise.resolve(objectData));
      });

      expect(objectResult.current.data).toEqual(objectData);

      // Test with array
      const { result: arrayResult } = renderHook(() => useAsyncOperation<number[]>());
      const arrayData = [1, 2, 3];
      
      await act(async () => {
        await arrayResult.current.execute(() => Promise.resolve(arrayData));
      });

      expect(arrayResult.current.data).toEqual(arrayData);

      // Test with boolean
      const { result: boolResult } = renderHook(() => useAsyncOperation<boolean>());
      
      await act(async () => {
        await boolResult.current.execute(() => Promise.resolve(true));
      });

      expect(boolResult.current.data).toBe(true);
    });

    it('should clear previous error on successful operation', async () => {
      const { result } = renderHook(() => useAsyncOperation());

      // First, create an error
      await act(async () => {
        await result.current.execute(() => Promise.reject(new Error('First error')));
      });

      expect(result.current.error).toBe('First error');

      // Then run successful operation
      await act(async () => {
        await result.current.execute(() => Promise.resolve('success'));
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toBe('success');
    });
  });

  describe('error handling', () => {
    it('should handle Error objects correctly', async () => {
      const { result } = renderHook(() => useAsyncOperation());
      const errorMessage = 'Test error message';
      const mockOperation = vi.fn().mockRejectedValue(new Error(errorMessage));

      let operationResult: any;
      await act(async () => {
        operationResult = await result.current.execute(mockOperation);
      });

      expect(operationResult).toBeNull();
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Async operation failed:', expect.any(Error));
    });

    it('should handle non-Error rejections with fallback message', async () => {
      const { result } = renderHook(() => useAsyncOperation());
      const mockOperation = vi.fn().mockRejectedValue('String error');

      await act(async () => {
        await result.current.execute(mockOperation);
      });

      expect(result.current.error).toBe('An unknown error occurred. Please contact support');
      expect(result.current.data).toBeNull();
    });

    it('should handle null/undefined rejections', async () => {
      const { result } = renderHook(() => useAsyncOperation());

      await act(async () => {
        await result.current.execute(() => Promise.reject(null));
      });

      expect(result.current.error).toBe('An unknown error occurred. Please contact support');

      await act(async () => {
        await result.current.execute(() => Promise.reject(undefined));
      });

      expect(result.current.error).toBe('An unknown error occurred. Please contact support');
    });

    it('should handle numeric and boolean rejections', async () => {
      const { result } = renderHook(() => useAsyncOperation());

      await act(async () => {
        await result.current.execute(() => Promise.reject(404));
      });

      expect(result.current.error).toBe('An unknown error occurred. Please contact support');

      await act(async () => {
        await result.current.execute(() => Promise.reject(false));
      });

      expect(result.current.error).toBe('An unknown error occurred. Please contact support');
    });

    it('should clear previous data on error', async () => {
      const { result } = renderHook(() => useAsyncOperation());

      // First successful operation
      await act(async () => {
        await result.current.execute(() => Promise.resolve('previous data'));
      });

      expect(result.current.data).toBe('previous data');

      // Then failed operation
      await act(async () => {
        await result.current.execute(() => Promise.reject(new Error('Failed')));
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('Failed');
    });
  });

  describe('concurrent operations', () => {
    it('should handle multiple concurrent operations correctly', async () => {
      const { result } = renderHook(() => useAsyncOperation());

      const operation1 = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('result1'), 100))
      );
      const operation2 = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('result2'), 50))
      );

      let result1: any, result2: any;
      
      await act(async () => {
        // Start both operations
        const promise1 = result.current.execute(operation1);
        const promise2 = result.current.execute(operation2);

        [result1, result2] = await Promise.all([promise1, promise2]);
      });

      // Both operations should return their respective results
      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
      
      // The last operation to complete (operation1) should set the final state
      expect(result.current.data).toBe('result1');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle concurrent operation where one fails', async () => {
      const { result } = renderHook(() => useAsyncOperation());

      const successOperation = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('success'), 100))
      );
      const failOperation = vi.fn().mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('failed')), 50))
      );

      let successResult: any, failResult: any;
      
      await act(async () => {
        const successPromise = result.current.execute(successOperation);
        const failPromise = result.current.execute(failOperation);

        [successResult, failResult] = await Promise.all([successPromise, failPromise]);
      });

      expect(successResult).toBe('success');
      expect(failResult).toBeNull();
      
      // The last operation (success) should determine final state
      expect(result.current.data).toBe('success');
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('reset functionality', () => {
    it('should reset all state to initial values', async () => {
      const { result } = renderHook(() => useAsyncOperation());

      // Execute an operation to set some state
      await act(async () => {
        await result.current.execute(() => Promise.resolve('test data'));
      });

      expect(result.current.data).toBe('test data');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should reset error state', async () => {
      const { result } = renderHook(() => useAsyncOperation());

      // Create error state
      await act(async () => {
        await result.current.execute(() => Promise.reject(new Error('Test error')));
      });

      expect(result.current.error).toBe('Test error');

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeNull();
    });

    it('should reset loading state', () => {
      const { result } = renderHook(() => useAsyncOperation());

      // Reset should ensure loading is false
      act(() => {
        result.current.reset();
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('edge cases and robustness', () => {
    it('should handle operations that return null or undefined', async () => {
      const { result } = renderHook(() => useAsyncOperation());

      await act(async () => {
        await result.current.execute(() => Promise.resolve(null));
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();

      await act(async () => {
        await result.current.execute(() => Promise.resolve(undefined));
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeNull();
    });

    it('should handle operations that return falsy values', async () => {
      const { result } = renderHook(() => useAsyncOperation());

      await act(async () => {
        await result.current.execute(() => Promise.resolve(0));
      });

      expect(result.current.data).toBe(0);

      await act(async () => {
        await result.current.execute(() => Promise.resolve(''));
      });

      expect(result.current.data).toBe('');

      await act(async () => {
        await result.current.execute(() => Promise.resolve(false));
      });

      expect(result.current.data).toBe(false);
    });

    it('should maintain referential stability of methods', () => {
      const { result, rerender } = renderHook(() => useAsyncOperation());

      const initialExecute = result.current.execute;
      const initialReset = result.current.reset;

      rerender();

      expect(result.current.execute).toBe(initialExecute);
      expect(result.current.reset).toBe(initialReset);
    });

    it('should handle synchronous operations', async () => {
      const { result } = renderHook(() => useAsyncOperation());

      let syncResult: any;
      await act(async () => {
        syncResult = await result.current.execute(() => {
          // Synchronous operation that returns a resolved promise
          return Promise.resolve('sync data');
        });
      });

      expect(syncResult).toBe('sync data');
      expect(result.current.data).toBe('sync data');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle operations that throw synchronously', async () => {
      const { result } = renderHook(() => useAsyncOperation());

      await act(async () => {
        await result.current.execute(() => {
          throw new Error('Synchronous error');
        });
      });

      expect(result.current.error).toBe('Synchronous error');
      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle component unmount during operation', async () => {
      const { result, unmount } = renderHook(() => useAsyncOperation());

      let operationPromise: Promise<any>;
      await act(async () => {
        operationPromise = result.current.execute(
          () => new Promise(resolve => setTimeout(() => resolve('data'), 100))
        );
      });

      // Unmount before operation completes
      unmount();

      // Operation should still complete without errors
      await expect(operationPromise!).resolves.toBe('data');
    });

    it('should handle very large data objects', async () => {
      const { result } = renderHook(() => useAsyncOperation());
      
      const largeObject = {
        data: new Array(1000).fill(0).map((_, i) => ({ id: i, value: `item-${i}` }))
      };

      await act(async () => {
        await result.current.execute(() => Promise.resolve(largeObject));
      });

      expect(result.current.data).toEqual(largeObject);
      expect(result.current.error).toBeNull();
    });
  });

  describe('TypeScript type safety', () => {
    it('should maintain type safety with generic type parameter', async () => {
      interface TestData {
        id: number;
        name: string;
      }

      const { result } = renderHook(() => useAsyncOperation<TestData>());
      const testData: TestData = { id: 1, name: 'test' };

      await act(async () => {
        await result.current.execute(() => Promise.resolve(testData));
      });

      // TypeScript should infer correct type
      expect(result.current.data?.id).toBe(1);
      expect(result.current.data?.name).toBe('test');
    });

    it('should work without explicit type parameter', async () => {
      const { result } = renderHook(() => useAsyncOperation());

      await act(async () => {
        await result.current.execute(() => Promise.resolve('any type'));
      });

      expect(result.current.data).toBe('any type');
    });
  });
});