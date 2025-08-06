import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from '../test-utils';

import { ExamErrorBoundary, SearchErrorBoundary, PageErrorBoundary } from 'Frontend/components/ErrorBoundaries';
import React, { useEffect, useState } from 'react';

// Test component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean; errorMessage?: string }> = ({ 
    shouldThrow, 
    errorMessage = 'Test error' 
}) => {
    if (shouldThrow) {
        throw new Error(errorMessage);
    }
    return <div data-testid="working-component">Component works!</div>;
};

describe('ErrorBoundaries - Behavioral Testing', () => {
    let consoleSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        // Suppress console.error during tests to avoid noise
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    describe('ExamErrorBoundary Behavior', () => {
        it('renders children when no error occurs', () => {
            render(
                <ExamErrorBoundary>
                    <ThrowError shouldThrow={false} />
                </ExamErrorBoundary>
            );

            expect(screen.getByTestId('working-component')).toBeInTheDocument();
            expect(screen.getByText('Component works!')).toBeInTheDocument();
        });

        it('catches and displays error when child component throws', () => {
            render(
                <ExamErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ExamErrorBoundary>
            );

            expect(screen.queryByTestId('working-component')).not.toBeInTheDocument();
            expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
            expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
        });

        it('displays retry button with correct retry count', () => {
            render(
                <ExamErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ExamErrorBoundary>
            );

            const retryButton = screen.getByText(/Try Again \(3 left\)/);
            expect(retryButton).toBeInTheDocument();
        });

        it('displays refresh page button', () => {
            render(
                <ExamErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ExamErrorBoundary>
            );

            expect(screen.getByText('Refresh Page')).toBeInTheDocument();
        });

        it('decrements retry count when retry button is clicked', async () => {
            let shouldThrow = true;
            const TestComponent = () => <ThrowError shouldThrow={shouldThrow} />;

            render(
                <ExamErrorBoundary>
                    <TestComponent />
                </ExamErrorBoundary>
            );

            // First retry attempt
            fireEvent.click(screen.getByText(/Try Again \(3 left\)/));
            
            // Wait for the retry count to update and check for 2 left
            await waitFor(() => {
                expect(screen.getByText(/Try Again \(2 left\)/)).toBeInTheDocument();
            });

            // Second retry attempt
            fireEvent.click(screen.getByText(/Try Again \(2 left\)/));
            await waitFor(() => {
                expect(screen.getByText(/Try Again \(1 left\)/)).toBeInTheDocument();
            });
        });

        it('hides retry button when max retries reached', async () => {
            render(
                <ExamErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ExamErrorBoundary>
            );

            // Use up all retries
            fireEvent.click(screen.getByText(/Try Again \(3 left\)/));
            await waitFor(() => {
                expect(screen.getByText(/Try Again \(2 left\)/)).toBeInTheDocument();
            });
            
            fireEvent.click(screen.getByText(/Try Again \(2 left\)/));
            await waitFor(() => {
                expect(screen.getByText(/Try Again \(1 left\)/)).toBeInTheDocument();
            });
            
            fireEvent.click(screen.getByText(/Try Again \(1 left\)/));

            // Should not show retry button anymore
            await waitFor(() => {
                expect(screen.queryByText(/Try Again/)).not.toBeInTheDocument();
            });
            expect(screen.getByText('Refresh Page')).toBeInTheDocument();
        });

        it('successfully recovers when error is resolved on retry', async () => {
            let shouldThrow = true;
            const TestComponent = () => <ThrowError shouldThrow={shouldThrow} />;

            render(
                <ExamErrorBoundary>
                    <TestComponent />
                </ExamErrorBoundary>
            );

            // Component should be in error state
            expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

            // Fix the error
            shouldThrow = false;

            // Retry should recover
            fireEvent.click(screen.getByText(/Try Again \(3 left\)/));

            // Should show the working component again
            await waitFor(() => {
                expect(screen.getByTestId('working-component')).toBeInTheDocument();
            });
            expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
        });

        it('renders custom fallback when provided', () => {
            const customFallback = <div data-testid="custom-fallback">Custom error message</div>;

            render(
                <ExamErrorBoundary fallback={customFallback}>
                    <ThrowError shouldThrow={true} />
                </ExamErrorBoundary>
            );

            expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
            expect(screen.getByText('Custom error message')).toBeInTheDocument();
            expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
        });
    });

    describe('SearchErrorBoundary Behavior', () => {
        it('renders children when no error occurs', () => {
            render(
                <SearchErrorBoundary>
                    <ThrowError shouldThrow={false} />
                </SearchErrorBoundary>
            );

            expect(screen.getByTestId('working-component')).toBeInTheDocument();
        });

        it('catches errors and calls onError callback', () => {
            const mockOnError = vi.fn();

            render(
                <SearchErrorBoundary onError={mockOnError}>
                    <ThrowError shouldThrow={true} errorMessage="Search failed" />
                </SearchErrorBoundary>
            );

            expect(mockOnError).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Search failed' }),
                expect.any(Object)
            );
        });

        it('has different max retries (2) compared to default', () => {
            render(
                <SearchErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </SearchErrorBoundary>
            );

            expect(screen.getByText(/Try Again \(2 left\)/)).toBeInTheDocument();
        });

        it('exhausts retries faster due to lower max retries', async () => {
            render(
                <SearchErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </SearchErrorBoundary>
            );

            // First retry
            fireEvent.click(screen.getByText(/Try Again \(2 left\)/));
            await waitFor(() => {
                expect(screen.getByText(/Try Again \(1 left\)/)).toBeInTheDocument();
            });

            // Second retry
            fireEvent.click(screen.getByText(/Try Again \(1 left\)/));

            // Should be out of retries
            await waitFor(() => {
                expect(screen.queryByText(/Try Again/)).not.toBeInTheDocument();
            });
        });
    });

    describe('PageErrorBoundary Behavior', () => {
        it('renders children when no error occurs', () => {
            render(
                <PageErrorBoundary>
                    <ThrowError shouldThrow={false} />
                </PageErrorBoundary>
            );

            expect(screen.getByTestId('working-component')).toBeInTheDocument();
        });

        it('has limited retries (1) for page-level errors', () => {
            render(
                <PageErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </PageErrorBoundary>
            );

            expect(screen.getByText(/Try Again \(1 left\)/)).toBeInTheDocument();
        });

        it('removes retry button after single retry', async () => {
            render(
                <PageErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </PageErrorBoundary>
            );

            fireEvent.click(screen.getByText(/Try Again \(1 left\)/));

            await waitFor(() => {
                expect(screen.queryByText(/Try Again/)).not.toBeInTheDocument();
            });
            expect(screen.getByText('Refresh Page')).toBeInTheDocument();
        });
    });

    describe('Error Information Display', () => {
        it('displays error styling and emoji', () => {
            render(
                <ExamErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ExamErrorBoundary>
            );

            // Check for the error emoji
            expect(screen.getByText('😵')).toBeInTheDocument();
            
            // Check for error styling elements
            expect(screen.getByText('Oops! Something went wrong')).toHaveStyle({
                color: '#dc2626'
            });
        });

        it('logs error information to console', () => {
            render(
                <ExamErrorBoundary>
                    <ThrowError shouldThrow={true} errorMessage="Detailed error message" />
                </ExamErrorBoundary>
            );

            expect(consoleSpy).toHaveBeenCalledWith(
                'Error Boundary caught an error:',
                expect.objectContaining({ message: 'Detailed error message' }),
                expect.any(Object)
            );
        });
    });

    describe('Button Interactions', () => {
        it('calls window.location.reload when Refresh Page is clicked', () => {
            const mockReload = vi.fn();
            Object.defineProperty(window, 'location', {
                value: { reload: mockReload },
                writable: true
            });

            render(
                <ExamErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ExamErrorBoundary>
            );

            fireEvent.click(screen.getByText('Refresh Page'));

            expect(mockReload).toHaveBeenCalled();
        });

        it('handles button clicks without throwing additional errors', () => {
            render(
                <ExamErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ExamErrorBoundary>
            );

            // These should not throw
            expect(() => {
                fireEvent.click(screen.getByText(/Try Again/));
                fireEvent.click(screen.getByText('Refresh Page'));
            }).not.toThrow();
        });
    });

    describe('Nested Error Boundaries', () => {
        it('handles nested error boundaries correctly', () => {
            render(
                <PageErrorBoundary>
                    <ExamErrorBoundary>
                        <ThrowError shouldThrow={true} />
                    </ExamErrorBoundary>
                </PageErrorBoundary>
            );

            // Inner boundary should catch the error
            expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
            expect(screen.getByText(/Try Again \(3 left\)/)).toBeInTheDocument(); // ExamErrorBoundary default
        });

        it('outer boundary catches errors from inner boundary', () => {
            const ProblematicBoundary = () => {
                throw new Error('Boundary itself failed');
            };

            render(
                <PageErrorBoundary>
                    <ProblematicBoundary />
                </PageErrorBoundary>
            );

            expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
            expect(screen.getByText(/Try Again \(1 left\)/)).toBeInTheDocument(); // PageErrorBoundary default
        });
    });

    describe('Different Error Types', () => {
        it('handles different error types and messages', () => {
            const errorTypes = [
                new Error('Standard error'),
                new TypeError('Type error'),
                new ReferenceError('Reference error'),
                { message: 'Custom error object', name: 'CustomError' }
            ];

            errorTypes.forEach((error) => {
                const ThrowSpecificError = () => {
                    throw error;
                };

                const { unmount } = render(
                    <ExamErrorBoundary>
                        <ThrowSpecificError />
                    </ExamErrorBoundary>
                );

                expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
                
                unmount();
            });
        });

        it('handles errors with very long messages', () => {
            const longMessage = 'This is a very long error message that should be handled gracefully by the error boundary component without breaking the layout or causing additional issues'.repeat(3);

            render(
                <ExamErrorBoundary>
                    <ThrowError shouldThrow={true} errorMessage={longMessage} />
                </ExamErrorBoundary>
            );

            expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
        });
    });

    describe('Component Lifecycle and Memory Management', () => {
        it('cleans up properly when unmounted', () => {
            const { unmount } = render(
                <ExamErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ExamErrorBoundary>
            );

            expect(() => unmount()).not.toThrow();
        });

        it('handles rapid error recovery attempts', async () => {
            // Fixed: Use a more controlled approach for error toggling
            let triggerError = true;
            
            const FluctuatingComponent = () => {
                if (triggerError) {
                    throw new Error('Intermittent error');
                }
                return <div data-testid="recovered-component">Recovered!</div>;
            };

            render(
                <ExamErrorBoundary>
                    <FluctuatingComponent />
                </ExamErrorBoundary>
            );

            // Should be in error state
            expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

            // Fix the error before retry
            triggerError = false;

            // First retry should succeed
            fireEvent.click(screen.getByText(/Try Again \(3 left\)/));
            
            await waitFor(() => {
                expect(screen.getByTestId('recovered-component')).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility and User Experience', () => {
        it('provides accessible error messaging', () => {
            render(
                <ExamErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ExamErrorBoundary>
            );

            // Error message should be prominent and readable
            const errorMessage = screen.getByText('Oops! Something went wrong');
            expect(errorMessage).toBeInTheDocument();
            
            // Buttons should be accessible
            const retryButton = screen.getByText(/Try Again/);
            const refreshButton = screen.getByText('Refresh Page');
            
            expect(retryButton).toBeInTheDocument();
            expect(refreshButton).toBeInTheDocument();
        });

        it('maintains consistent styling across different boundary types', () => {
            const boundaryTypes = [ExamErrorBoundary, SearchErrorBoundary, PageErrorBoundary];

            boundaryTypes.forEach((Boundary) => {
                const { unmount } = render(
                    <Boundary>
                        <ThrowError shouldThrow={true} />
                    </Boundary>
                );

                expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
                
                unmount();
            });
        });
    });

    describe('Error Recovery Patterns', () => {
        it('successfully recovers and maintains retry state across child re-renders', async () => {
            let shouldThrow = true;
            const ToggleErrorComponent = () => <ThrowError shouldThrow={shouldThrow} />;

            const { rerender } = render(
                <ExamErrorBoundary>
                    <ToggleErrorComponent />
                </ExamErrorBoundary>
            );

            // Component in error state - should show 3 retries
            expect(screen.getByText(/Try Again \(3 left\)/)).toBeInTheDocument();

            // Use one retry
            fireEvent.click(screen.getByText(/Try Again \(3 left\)/));
            
            // Should now show 2 retries left
            await waitFor(() => {
                expect(screen.getByText(/Try Again \(2 left\)/)).toBeInTheDocument();
            });

            // Fix the error and retry
            shouldThrow = false;
            fireEvent.click(screen.getByText(/Try Again \(2 left\)/));

            // Should be recovered
            await waitFor(() => {
                expect(screen.getByTestId('working-component')).toBeInTheDocument();
            });

            // Break it again by re-rendering with error
            shouldThrow = true;
            rerender(
                <ExamErrorBoundary>
                    <ToggleErrorComponent />
                </ExamErrorBoundary>
            );

            // Error boundary should maintain its retry state (1 retry left)
            // because the boundary itself wasn't unmounted
            await waitFor(() => {
                expect(screen.getByText(/Try Again \(1 left\)/)).toBeInTheDocument();
            });
        });

        it('resets retry count when error boundary is unmounted and remounted', async () => {
            let shouldThrow = true;
            const ToggleErrorComponent = () => <ThrowError shouldThrow={shouldThrow} />;

            // First mount
            const { unmount } = render(
                <ExamErrorBoundary>
                    <ToggleErrorComponent />
                </ExamErrorBoundary>
            );

            // Use up some retries
            fireEvent.click(screen.getByText(/Try Again \(3 left\)/));
            await waitFor(() => {
                expect(screen.getByText(/Try Again \(2 left\)/)).toBeInTheDocument();
            });

            // Unmount the entire boundary
            unmount();

            // Remount with error - should have fresh retry count
            render(
                <ExamErrorBoundary>
                    <ToggleErrorComponent />
                </ExamErrorBoundary>
            );

            // Should start with fresh retry count (3 retries)
            expect(screen.getByText(/Try Again \(3 left\)/)).toBeInTheDocument();
        });
    });
});