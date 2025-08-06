import { useState, useCallback, useRef, useReducer } from 'react';

interface UseAsyncOperationReturn<T> {
  execute: (operation: () => Promise<T>) => Promise<T | null>;
  loading: boolean;
  error: string | null;
  data: T | null;
  reset: () => void;
}

interface AsyncState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

type AsyncAction<T> = 
  | { type: 'START' }
  | { type: 'SUCCESS'; data: T }
  | { type: 'ERROR'; error: string }
  | { type: 'FINISH_LOADING' }
  | { type: 'RESET' };

function asyncReducer<T>(state: AsyncState<T>, action: AsyncAction<T>): AsyncState<T> {
  switch (action.type) {
    case 'START':
      return { ...state, loading: true, error: null };
    case 'SUCCESS':
      return { ...state, data: action.data, error: null };
    case 'ERROR':
      return { ...state, error: action.error, data: null };
    case 'FINISH_LOADING':
      return { ...state, loading: false };
    case 'RESET':
      return { loading: false, error: null, data: null };
    default:
      return state;
  }
}

export const useAsyncOperation = <T = any>(): UseAsyncOperationReturn<T> => {
  const [state, dispatch] = useReducer(asyncReducer<T>, {
    loading: false,
    error: null,
    data: null,
  });
  
  const runningOperationsRef = useRef(0);

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    // Increment running operations and start loading
    runningOperationsRef.current++;
    dispatch({ type: 'START' });
    
    try {
      const result = await operation();
      dispatch({ type: 'SUCCESS', data: result });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred. Please contact support';
      dispatch({ type: 'ERROR', error: errorMessage });
      console.error('Async operation failed:', err);
      return null;
    } finally {
      // Decrement running operations counter
      runningOperationsRef.current--;
      
      // Only finish loading if no operations are running
      if (runningOperationsRef.current <= 0) {
        runningOperationsRef.current = 0; // Ensure it doesn't go negative
        dispatch({ type: 'FINISH_LOADING' });
      }
    }
  }, []);

  const reset = useCallback(() => {
    runningOperationsRef.current = 0;
    dispatch({ type: 'RESET' });
  }, []);

  return { 
    execute, 
    loading: state.loading, 
    error: state.error, 
    data: state.data, 
    reset 
  };
};