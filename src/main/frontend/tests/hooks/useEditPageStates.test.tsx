import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { render, screen, cleanup } from '@testing-library/react';
import { useEditPageStates } from 'Frontend/hooks/useEditPageStates';

// Mock Vaadin Icon component
vi.mock('@vaadin/react-components', () => ({
  Icon: ({ icon, className }: { icon: string; className: string }) => (
    <span data-testid="icon" data-icon={icon} className={className}>
      Icon
    </span>
  )
}));

describe('useEditPageStates', () => {
  const defaultLoadingState = {
    isLoading: false,
    checkingAuth: false,
    checkingPermissions: false,
    error: null as string | null
  };

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/exams'
      },
      writable: true
    });
  });

  describe('loading component', () => {
    it('should return loading component when checking auth', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          checkingAuth: true
        }
      }));

      expect(result.current.loadingComponent).toBeTruthy();
      expect(result.current.errorComponent).toBeNull();
    });

    it('should return loading component when checking permissions', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          checkingPermissions: true
        }
      }));

      expect(result.current.loadingComponent).toBeTruthy();
      expect(result.current.errorComponent).toBeNull();
    });

    it('should return loading component when isLoading is true', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          isLoading: true
        }
      }));

      expect(result.current.loadingComponent).toBeTruthy();
      expect(result.current.errorComponent).toBeNull();
    });

    it('should return loading component when multiple loading states are true', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          isLoading: true,
          checkingAuth: true,
          checkingPermissions: true,
          error: null
        }
      }));

      expect(result.current.loadingComponent).toBeTruthy();
      expect(result.current.errorComponent).toBeNull();
    });

    it('should return null loading component when no loading states are active', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: defaultLoadingState
      }));

      expect(result.current.loadingComponent).toBeNull();
    });

    it('should render loading component with correct structure', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          isLoading: true
        }
      }));

      const loadingComponent = result.current.loadingComponent;
      expect(loadingComponent).toBeTruthy();

      render(loadingComponent!);

      expect(screen.getByText('Loading exam...')).toBeInTheDocument();
      expect(screen.getByText('Loading exam...')).toBeInTheDocument();
      expect(document.querySelector('.spinner')).toBeInTheDocument();
      expect(document.querySelector('.exam-edit-container')).toBeInTheDocument();
    });

    it('should show different loading messages based on state', () => {
      // Test checking auth message
      const { result: authResult } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          checkingAuth: true
        }
      }));

      render(authResult.current.loadingComponent!);
      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();

      cleanup();

      // Test checking permissions message
      const { result: permResult } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          checkingPermissions: true
        }
      }));

      render(permResult.current.loadingComponent!);
      expect(screen.getByText('Verifying edit permissions...')).toBeInTheDocument();
    });

    it('should prioritize auth checking message over permissions', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          isLoading: false,
          checkingAuth: true,
          checkingPermissions: true,
          error: null
        }
      }));

      render(result.current.loadingComponent!);
      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
      expect(screen.queryByText('Verifying edit permissions...')).not.toBeInTheDocument();
    });

    it('should prioritize permissions checking message over loading', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          isLoading: true,
          checkingAuth: false,
          checkingPermissions: true,
          error: null
        }
      }));

      render(result.current.loadingComponent!);
      expect(screen.getByText('Verifying edit permissions...')).toBeInTheDocument();
      expect(screen.queryByText('Loading exam...')).not.toBeInTheDocument();
    });
  });

  describe('error component', () => {
    it('should return error component when error exists', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          error: 'Access denied'
        }
      }));

      expect(result.current.errorComponent).toBeTruthy();
      expect(result.current.loadingComponent).toBeNull();
    });

    it('should return null error component when no error', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: defaultLoadingState
      }));

      expect(result.current.errorComponent).toBeNull();
    });

    it('should render error component with correct structure', () => {
      const errorMessage = 'You do not have permission to edit this exam';
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          error: errorMessage
        }
      }));

      const errorComponent = result.current.errorComponent;
      expect(errorComponent).toBeTruthy();

      render(errorComponent!);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toHaveAttribute('data-icon', 'vaadin:exclamation-circle');
      expect(screen.getByTestId('icon')).toHaveClass('error-icon');
    });

    it('should render browse exams button', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          error: 'Access denied'
        }
      }));

      render(result.current.errorComponent!);

      const browseButton = screen.getByRole('button', { name: 'Browse Exams' });
      expect(browseButton).toBeInTheDocument();
      expect(browseButton).toHaveClass('btn-primary');
    });

    it('should render view exam details button when examId provided', () => {
      const examId = 'exam-123';
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          error: 'Access denied'
        },
        examId
      }));

      render(result.current.errorComponent!);

      const viewButton = screen.getByRole('button', { name: 'View Exam Details' });
      expect(viewButton).toBeInTheDocument();
      expect(viewButton).toHaveClass('btn-secondary');
    });

    it('should not render view exam details button when no examId', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          error: 'Access denied'
        }
      }));

      render(result.current.errorComponent!);

      expect(screen.queryByRole('button', { name: 'View Exam Details' })).not.toBeInTheDocument();
    });

    it('should handle empty examId', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          error: 'Access denied'
        },
        examId: ''
      }));

      render(result.current.errorComponent!);

      expect(screen.queryByRole('button', { name: 'View Exam Details' })).not.toBeInTheDocument();
    });

    it('should handle whitespace-only examId', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          error: 'Access denied'
        },
        examId: '   \n\t  '
      }));

      render(result.current.errorComponent!);

      expect(screen.queryByRole('button', { name: 'View Exam Details' })).not.toBeInTheDocument();
    });

    it('should handle button clicks correctly', () => {
      // Mock window.location.href assignment
      const mockLocationAssignment = vi.fn();
      const mockLocation = {
        href: 'http://localhost:3000/current-page'
      };
      
      Object.defineProperty(mockLocation, 'href', {
        set: (url: string) => {
          mockLocationAssignment(url);
        },
        get: () => 'http://localhost:3000/current-page'
      });

      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true
      });

      const examId = 'exam-123';
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          error: 'Access denied'
        },
        examId
      }));

      render(result.current.errorComponent!);

      // Test browse exams button
      const browseButton = screen.getByRole('button', { name: 'Browse Exams' });
      browseButton.click();
      expect(mockLocationAssignment).toHaveBeenCalledWith('/exams');

      // Test view exam details button
      const viewButton = screen.getByRole('button', { name: 'View Exam Details' });
      viewButton.click();
      expect(mockLocationAssignment).toHaveBeenCalledWith(`/exams/${examId}`);
    });

    it('should handle different error messages', () => {
      const longErrorMessage = 'This is a very long error message that explains in detail what went wrong and why the user cannot edit this exam. It might wrap to multiple lines.';
      
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          error: longErrorMessage
        }
      }));

      render(result.current.errorComponent!);

      expect(screen.getByText(longErrorMessage)).toBeInTheDocument();
    });

    it('should handle special characters in error message', () => {
      const specialErrorMessage = 'Error with <tags> & "quotes" @#$%';
      
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          error: specialErrorMessage
        }
      }));

      render(result.current.errorComponent!);

      expect(screen.getByText(specialErrorMessage)).toBeInTheDocument();
    });
  });

  describe('state combinations', () => {
    it('should prioritize error over loading states', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          isLoading: true,
          checkingAuth: true,
          checkingPermissions: true,
          error: 'Access denied'
        }
      }));

      expect(result.current.errorComponent).toBeTruthy();
      expect(result.current.loadingComponent).toBeNull();
    });

    it('should handle error without loading states', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          isLoading: false,
          checkingAuth: false,
          checkingPermissions: false,
          error: 'Access denied'
        }
      }));

      expect(result.current.errorComponent).toBeTruthy();
      expect(result.current.loadingComponent).toBeNull();
    });

    it('should return both null when no loading or error', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: defaultLoadingState
      }));

      expect(result.current.loadingComponent).toBeNull();
      expect(result.current.errorComponent).toBeNull();
    });
  });

  describe('prop updates', () => {
    it('should update components when loading state changes', () => {
      const { result, rerender } = renderHook(
        (props) => useEditPageStates(props),
        {
          initialProps: {
            loadingState: defaultLoadingState
          }
        }
      );

      expect(result.current.loadingComponent).toBeNull();
      expect(result.current.errorComponent).toBeNull();

      // Change to loading state
      rerender({
        loadingState: {
          ...defaultLoadingState,
          isLoading: true
        }
      });

      expect(result.current.loadingComponent).toBeTruthy();
      expect(result.current.errorComponent).toBeNull();

      // Change to error state
      rerender({
        loadingState: {
          ...defaultLoadingState,
          error: 'Error occurred'
        }
      });

      expect(result.current.loadingComponent).toBeNull();
      expect(result.current.errorComponent).toBeTruthy();
    });

    it('should update examId in error component', () => {
      type HookProps = {
        loadingState: {
          isLoading: boolean;
          checkingAuth: boolean;
          checkingPermissions: boolean;
          error: string | null;
        };
        examId?: string;
      };

      const { result, rerender } = renderHook(
        (props: HookProps) => useEditPageStates(props),
        {
          initialProps: {
            loadingState: {
              ...defaultLoadingState,
              error: 'Access denied'
            }
          } as HookProps
        }
      );

      // First render without examId
      const { unmount: unmount1 } = render(result.current.errorComponent!);
      expect(screen.queryByRole('button', { name: 'View Exam Details' })).not.toBeInTheDocument();
      unmount1();

      // Add examId and rerender hook
      rerender({
        loadingState: {
          ...defaultLoadingState,
          error: 'Access denied'
        },
        examId: 'exam-123'
      } as HookProps);

      // Render the new component with examId
      render(result.current.errorComponent!);
      expect(screen.getByRole('button', { name: 'View Exam Details' })).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined examId', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          error: 'Access denied'
        },
        examId: undefined
      }));

      render(result.current.errorComponent!);
      expect(screen.queryByRole('button', { name: 'View Exam Details' })).not.toBeInTheDocument();
    });

    it('should handle null error', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          error: null
        }
      }));

      expect(result.current.errorComponent).toBeNull();
    });

    it('should handle empty error string', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          error: ''
        }
      }));

      // Empty string should be treated as falsy (no error component)
      expect(result.current.errorComponent).toBeNull();
    });

    it('should handle whitespace-only error string', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          error: '   \n\t  '
        }
      }));

      // Whitespace-only string should be treated as falsy (no error component)
      expect(result.current.errorComponent).toBeNull();
    });

    it('should handle very long examId', () => {
      const longExamId = 'exam-' + 'a'.repeat(1000);
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          error: 'Access denied'
        },
        examId: longExamId
      }));

      render(result.current.errorComponent!);
      const viewButton = screen.getByRole('button', { name: 'View Exam Details' });
      expect(viewButton).toBeInTheDocument();
    });

    it('should handle special characters in examId', () => {
      const specialExamId = 'exam-<>&"\'';
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          error: 'Access denied'
        },
        examId: specialExamId
      }));

      render(result.current.errorComponent!);
      const viewButton = screen.getByRole('button', { name: 'View Exam Details' });
      expect(viewButton).toBeInTheDocument();
    });

    it('should handle rapid prop changes', () => {
      const { result, rerender } = renderHook(
        (props) => useEditPageStates(props),
        {
          initialProps: {
            loadingState: defaultLoadingState
          }
        }
      );

      // Rapid changes
      const states = [
        { loadingState: { ...defaultLoadingState, isLoading: true } },
        { loadingState: { ...defaultLoadingState, checkingAuth: true } },
        { loadingState: { ...defaultLoadingState, checkingPermissions: true } },
        { loadingState: { ...defaultLoadingState, error: 'Error' } },
        { loadingState: defaultLoadingState }
      ];

      states.forEach(state => {
        rerender(state);
      });

      // Should end up with both components null
      expect(result.current.loadingComponent).toBeNull();
      expect(result.current.errorComponent).toBeNull();
    });

    it('should show loading when error is whitespace-only', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          isLoading: true,
          error: '   \n\t  '
        }
      }));

      // Whitespace-only error should be ignored, loading should show
      expect(result.current.loadingComponent).toBeTruthy();
      expect(result.current.errorComponent).toBeNull();
    });
  });

  describe('component structure and styling', () => {
    it('should apply correct CSS classes to loading component', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          isLoading: true
        }
      }));

      render(result.current.loadingComponent!);

      const container = document.querySelector('.exam-edit-container');
      expect(container).toBeInTheDocument();
      
      const loadingState = document.querySelector('.loading-state');
      expect(loadingState).toBeInTheDocument();

      const spinner = document.querySelector('.spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply correct CSS classes to error component', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          error: 'Error'
        }
      }));

      render(result.current.errorComponent!);

      const container = document.querySelector('.exam-edit-container');
      expect(container).toBeInTheDocument();
      
      const errorState = document.querySelector('.error-state');
      expect(errorState).toBeInTheDocument();

      const errorActions = document.querySelector('.error-actions');
      expect(errorActions).toBeInTheDocument();
    });

    it('should render icon with correct props', () => {
      const { result } = renderHook(() => useEditPageStates({
        loadingState: {
          ...defaultLoadingState,
          error: 'Error'
        }
      }));

      render(result.current.errorComponent!);

      const icon = screen.getByTestId('icon');
      expect(icon).toHaveAttribute('data-icon', 'vaadin:exclamation-circle');
      expect(icon).toHaveClass('error-icon');
    });
  });
});