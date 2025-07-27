import { useState, useCallback } from 'react';

interface UseAsyncOperationReturn<T> {
  execute: (operation: () => Promise<T>) => Promise<T | null>;
  loading: boolean;
  error: string | null;
  data: T | null;
  reset: () => void;
}

export const useAsyncOperation = <T = any>(): UseAsyncOperationReturn<T> => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await operation();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Async operation failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { execute, loading, error, data, reset };
};