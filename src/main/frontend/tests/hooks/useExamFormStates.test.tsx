import { fireEvent, renderHook, screen, cleanup } from '@testing-library/react';
import { useExamFormStates } from 'Frontend/hooks/useExamFormStates';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '../test-utils';
import React from 'react';

describe('useExamFormStates', () => {
  let mockOnSignIn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSignIn = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('loadingComponent', () => {
    it('should return loading component when authInitialized is false', () => {
      const { result } = renderHook(() =>
        useExamFormStates({
          authInitialized: false,
          loading: false,
          authenticated: false,
          onSignIn: mockOnSignIn,
        })
      );

      expect(result.current.loadingComponent).not.toBeNull();
      expect(result.current.authComponent).toBeNull();
    });

    it('should return loading component when loading is true', () => {
      const { result } = renderHook(() =>
        useExamFormStates({
          authInitialized: true,
          loading: true,
          authenticated: false,
          onSignIn: mockOnSignIn,
        })
      );

      expect(result.current.loadingComponent).not.toBeNull();
      expect(result.current.authComponent).toBeNull();
    });

    it('should return loading component when both authInitialized is false and loading is true', () => {
      const { result } = renderHook(() =>
        useExamFormStates({
          authInitialized: false,
          loading: true,
          authenticated: false,
          onSignIn: mockOnSignIn,
        })
      );

      expect(result.current.loadingComponent).not.toBeNull();
      expect(result.current.authComponent).toBeNull();
    });

    it('should not return loading component when authInitialized is true and loading is false', () => {
      const { result } = renderHook(() =>
        useExamFormStates({
          authInitialized: true,
          loading: false,
          authenticated: false,
          onSignIn: mockOnSignIn,
        })
      );

      expect(result.current.loadingComponent).toBeNull();
    });

    it('should render loading component with correct structure and content', () => {
      const { result } = renderHook(() =>
        useExamFormStates({
          authInitialized: false,
          loading: false,
          authenticated: false,
          onSignIn: mockOnSignIn,
        })
      );

      const loadingComponent = result.current.loadingComponent;
      expect(loadingComponent).not.toBeNull();

      // Render the component to test its structure
      render(<div>{loadingComponent}</div>);

      // Use more basic assertions that don't require jest-dom
      expect(screen.getByText('Loading...')).toBeTruthy();
      expect(document.querySelector('.exam-create-container')).toBeTruthy();
      expect(document.querySelector('.loading-state')).toBeTruthy();
      expect(document.querySelector('.spinner')).toBeTruthy();
    });
  });

  describe('authComponent', () => {
    it('should return auth component when not authenticated, authInitialized is true, and not loading', () => {
      const { result } = renderHook(() =>
        useExamFormStates({
          authInitialized: true,
          loading: false,
          authenticated: false,
          onSignIn: mockOnSignIn,
        })
      );

      expect(result.current.authComponent).not.toBeNull();
      expect(result.current.loadingComponent).toBeNull();
    });

    it('should not return auth component when authenticated', () => {
      const { result } = renderHook(() =>
        useExamFormStates({
          authInitialized: true,
          loading: false,
          authenticated: true,
          onSignIn: mockOnSignIn,
        })
      );

      expect(result.current.authComponent).toBeNull();
      expect(result.current.loadingComponent).toBeNull();
    });

    it('should not return auth component when authInitialized is false', () => {
      const { result } = renderHook(() =>
        useExamFormStates({
          authInitialized: false,
          loading: false,
          authenticated: false,
          onSignIn: mockOnSignIn,
        })
      );

      expect(result.current.authComponent).toBeNull();
      // Loading component should be returned instead
      expect(result.current.loadingComponent).not.toBeNull();
    });

    it('should not return auth component when loading is true', () => {
      const { result } = renderHook(() =>
        useExamFormStates({
          authInitialized: true,
          loading: true,
          authenticated: false,
          onSignIn: mockOnSignIn,
        })
      );

      expect(result.current.authComponent).toBeNull();
      // Loading component should be returned instead
      expect(result.current.loadingComponent).not.toBeNull();
    });

    it('should render auth component with correct structure and content', () => {
      const { result } = renderHook(() =>
        useExamFormStates({
          authInitialized: true,
          loading: false,
          authenticated: false,
          onSignIn: mockOnSignIn,
        })
      );

      const authComponent = result.current.authComponent;
      expect(authComponent).not.toBeNull();

      // Render the component to test its structure
      render(<div>{authComponent}</div>);

      // Use more basic assertions
      expect(screen.getByText('Authentication Required')).toBeTruthy();
      expect(screen.getByText('You need to be signed in to create exams.')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeTruthy();
      expect(document.querySelector('.exam-create-container')).toBeTruthy();
      expect(document.querySelector('.auth-required')).toBeTruthy();
      expect(document.querySelector('.auth-icon')).toBeTruthy();
    });

    it('should call onSignIn when Sign In button is clicked', () => {
      const { result } = renderHook(() =>
        useExamFormStates({
          authInitialized: true,
          loading: false,
          authenticated: false,
          onSignIn: mockOnSignIn,
        })
      );

      const authComponent = result.current.authComponent;
      render(<div>{authComponent}</div>);

      const signInButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(signInButton);

      expect(mockOnSignIn).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases and combinations', () => {
    it('should return both components as null when authenticated', () => {
      const { result } = renderHook(() =>
        useExamFormStates({
          authInitialized: true,
          loading: false,
          authenticated: true,
          onSignIn: mockOnSignIn,
        })
      );

      expect(result.current.loadingComponent).toBeNull();
      expect(result.current.authComponent).toBeNull();
    });

    it('should prioritize loading component over auth component', () => {
      const { result } = renderHook(() =>
        useExamFormStates({
          authInitialized: true,
          loading: true,
          authenticated: false,
          onSignIn: mockOnSignIn,
        })
      );

      expect(result.current.loadingComponent).not.toBeNull();
      expect(result.current.authComponent).toBeNull();
    });

    it('should handle multiple re-renders with different states', () => {
      const { result, rerender } = renderHook(
        (props) => useExamFormStates(props),
        {
          initialProps: {
            authInitialized: false,
            loading: true,
            authenticated: false,
            onSignIn: mockOnSignIn,
          },
        }
      );

      // Initial state: loading
      expect(result.current.loadingComponent).not.toBeNull();
      expect(result.current.authComponent).toBeNull();

      // Auth initialized, still loading
      rerender({
        authInitialized: true,
        loading: true,
        authenticated: false,
        onSignIn: mockOnSignIn,
      });

      expect(result.current.loadingComponent).not.toBeNull();
      expect(result.current.authComponent).toBeNull();

      // Loading finished, not authenticated
      rerender({
        authInitialized: true,
        loading: false,
        authenticated: false,
        onSignIn: mockOnSignIn,
      });

      expect(result.current.loadingComponent).toBeNull();
      expect(result.current.authComponent).not.toBeNull();

      // User authenticated
      rerender({
        authInitialized: true,
        loading: false,
        authenticated: true,
        onSignIn: mockOnSignIn,
      });

      expect(result.current.loadingComponent).toBeNull();
      expect(result.current.authComponent).toBeNull();
    });
  });

  describe('component accessibility', () => {
    it('should have accessible auth component structure', () => {
      const { result } = renderHook(() =>
        useExamFormStates({
          authInitialized: true,
          loading: false,
          authenticated: false,
          onSignIn: mockOnSignIn,
        })
      );

      render(<div>{result.current.authComponent}</div>);

      // Check for semantic elements - use basic assertions
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeTruthy();
      expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
      
      // Check button has correct classes for styling
      const signInButton = screen.getByRole('button', { name: 'Sign In' });
      expect(signInButton.classList.contains('btn-primary')).toBe(true);
      expect(signInButton.classList.contains('enabled')).toBe(true);
    });

    it('should have proper loading state structure', () => {
      const { result } = renderHook(() =>
        useExamFormStates({
          authInitialized: false,
          loading: false,
          authenticated: false,
          onSignIn: mockOnSignIn,
        })
      );

      render(<div>{result.current.loadingComponent}</div>);

      // Check loading message is present
      expect(screen.getByText('Loading...')).toBeTruthy();
      
      // Check container structure
      const container = document.querySelector('.exam-create-container');
      expect(container).toBeTruthy();
      expect(container?.querySelector('.loading-state')).toBeTruthy();
      expect(container?.querySelector('.spinner')).toBeTruthy();
    });
  });

  describe('integration with test utilities', () => {
    it('should work with predefined auth states from test utils', () => {
      // Using the mockAuthStates pattern from test-utils
      const authStates = {
        notAuthenticated: {
          authenticated: false,
          authInitialized: true,
          loading: false
        },
        authenticated: {
          authenticated: true,
          authInitialized: true,
          loading: false
        },
        loading: {
          authenticated: false,
          authInitialized: false,
          loading: true
        }
      };

      // Test not authenticated state
      const { result: notAuthResult } = renderHook(() =>
        useExamFormStates({
          ...authStates.notAuthenticated,
          onSignIn: mockOnSignIn,
        })
      );

      expect(notAuthResult.current.authComponent).not.toBeNull();
      expect(notAuthResult.current.loadingComponent).toBeNull();

      // Test authenticated state
      const { result: authResult } = renderHook(() =>
        useExamFormStates({
          ...authStates.authenticated,
          onSignIn: mockOnSignIn,
        })
      );

      expect(authResult.current.authComponent).toBeNull();
      expect(authResult.current.loadingComponent).toBeNull();

      // Test loading state
      const { result: loadingResult } = renderHook(() =>
        useExamFormStates({
          ...authStates.loading,
          onSignIn: mockOnSignIn,
        })
      );

      expect(loadingResult.current.authComponent).toBeNull();
      expect(loadingResult.current.loadingComponent).not.toBeNull();
    });
  });

  describe('component content validation', () => {
    it('should render correct JSX structure for loading component', () => {
      const { result } = renderHook(() =>
        useExamFormStates({
          authInitialized: false,
          loading: false,
          authenticated: false,
          onSignIn: mockOnSignIn,
        })
      );

      const loadingComponent = result.current.loadingComponent;
      expect(loadingComponent).not.toBeNull();
      
      // Test that it's a valid React element
      expect(React.isValidElement(loadingComponent)).toBe(true);
    });

    it('should render correct JSX structure for auth component', () => {
      const { result } = renderHook(() =>
        useExamFormStates({
          authInitialized: true,
          loading: false,
          authenticated: false,
          onSignIn: mockOnSignIn,
        })
      );

      const authComponent = result.current.authComponent;
      expect(authComponent).not.toBeNull();
      
      // Test that it's a valid React element
      expect(React.isValidElement(authComponent)).toBe(true);
    });

    it('should return null for both components when authenticated', () => {
      const { result } = renderHook(() =>
        useExamFormStates({
          authInitialized: true,
          loading: false,
          authenticated: true,
          onSignIn: mockOnSignIn,
        })
      );

      expect(result.current.loadingComponent).toBeNull();
      expect(result.current.authComponent).toBeNull();
    });
  });
});