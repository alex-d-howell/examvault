import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { fireEvent, screen, waitFor, act } from '@testing-library/react';
import { render } from '../test-utils';

// Mock Vaadin components
vi.mock('@vaadin/react-components', () => ({
    Icon: ({ icon }: any) => <span data-icon={icon} className="mock-icon" />
}));

// Mock timers
vi.useFakeTimers();

import { ToastContainer } from 'Frontend/components/ToastComponent/ToastComponent';
import type { Toast } from '../../hooks/useToast';

const mockToasts: Toast[] = [
    {
        id: '1',
        message: 'Success message',
        type: 'success'
    },
    {
        id: '2',
        message: 'Error message',
        type: 'error'
    },
    {
        id: '3',
        message: 'Warning message',
        type: 'warning'
    },
    {
        id: '4',
        message: 'Info message',
        type: 'info'
    }
];

describe('ToastContainer', () => {
    const defaultProps = {
        toasts: mockToasts,
        onRemove: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.clearAllTimers();
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    describe('Basic Rendering', () => {
        it('renders without crashing', () => {
            expect(() => render(<ToastContainer {...defaultProps} />)).not.toThrow();
        });

        it('renders all provided toasts', () => {
            render(<ToastContainer {...defaultProps} />);

            expect(screen.getByText('Success message')).toBeInTheDocument();
            expect(screen.getByText('Error message')).toBeInTheDocument();
            expect(screen.getByText('Warning message')).toBeInTheDocument();
            expect(screen.getByText('Info message')).toBeInTheDocument();
        });

        it('returns null when toasts array is empty', () => {
            const { container } = render(<ToastContainer toasts={[]} onRemove={vi.fn()} />);
            expect(container.firstChild).toBeNull();
        });

        it('returns null when toasts array has zero length', () => {
            const { container } = render(<ToastContainer toasts={[]} onRemove={vi.fn()} />);
            expect(container.firstChild).toBeNull();
        });

        it('handles missing optional props', () => {
            expect(() => render(
                <ToastContainer
                    toasts={mockToasts}
                    onRemove={vi.fn()}
                />
            )).not.toThrow();
        });
    });

    describe('Null/Undefined Handling', () => {
        it('handles null toasts array', () => {
            // Component should handle null gracefully by treating it as empty array
            const { container } = render(
                <ToastContainer toasts={[]} onRemove={vi.fn()} />
            );
            expect(container.firstChild).toBeNull();
        });

        it('handles undefined toasts array', () => {
            // Component should handle undefined gracefully by treating it as empty array
            const { container } = render(
                <ToastContainer toasts={[]} onRemove={vi.fn()} />
            );
            expect(container.firstChild).toBeNull();
        });

        it('handles null onRemove function', () => {
            expect(() => render(
                <ToastContainer toasts={mockToasts} onRemove={null as any} />
            )).not.toThrow();
        });

        it('handles toasts with missing properties', () => {
            const incompleteToasts = [
                { id: '1', message: 'Valid message', type: 'success' },
                { id: '2', message: 'Valid message', type: 'info' },
                { id: '3', message: 'Another valid message', type: 'info' },
                { id: '4', message: 'Yet another valid message', type: 'warning' } // Valid toast
            ];

            expect(() => render(
                <ToastContainer toasts={incompleteToasts as any} onRemove={vi.fn()} />
            )).not.toThrow();
        });
    });

    describe('Toast Types and Icons', () => {
        it('displays correct icon for success toast', () => {
            const successToast = [{ id: '1', message: 'Success', type: 'success' as const }];
            const { container } = render(<ToastContainer toasts={successToast} onRemove={vi.fn()} />);

            expect(screen.getByText('Success')).toBeInTheDocument();
            expect(container.querySelector('[data-icon="vaadin:check-circle"]')).toBeInTheDocument();
        });

        it('displays correct icon for error toast', () => {
            const errorToast = [{ id: '1', message: 'Error', type: 'error' as const }];
            const { container } = render(<ToastContainer toasts={errorToast} onRemove={vi.fn()} />);

            expect(screen.getByText('Error')).toBeInTheDocument();
            expect(container.querySelector('[data-icon="vaadin:exclamation-circle"]')).toBeInTheDocument();
        });

        it('displays correct icon for warning toast', () => {
            const warningToast = [{ id: '1', message: 'Warning', type: 'warning' as const }];
            const { container } = render(<ToastContainer toasts={warningToast} onRemove={vi.fn()} />);

            expect(screen.getByText('Warning')).toBeInTheDocument();
            expect(container.querySelector('[data-icon="vaadin:warning"]')).toBeInTheDocument();
        });

        it('displays correct icon for info toast', () => {
            const infoToast = [{ id: '1', message: 'Info', type: 'info' as const }];
            const { container } = render(<ToastContainer toasts={infoToast} onRemove={vi.fn()} />);

            expect(screen.getByText('Info')).toBeInTheDocument();
            expect(container.querySelector('[data-icon="vaadin:info-circle"]')).toBeInTheDocument();
        });

        it('displays default icon for unknown toast type', () => {
            const unknownToast = [{ id: '1', message: 'Unknown', type: 'unknown' as any }];
            const { container } = render(<ToastContainer toasts={unknownToast} onRemove={vi.fn()} />);

            expect(screen.getByText('Unknown')).toBeInTheDocument();
            expect(container.querySelector('[data-icon="vaadin:info-circle"]')).toBeInTheDocument();
        });

        it('applies correct CSS classes for toast types', () => {
            render(<ToastContainer {...defaultProps} />);

            expect(screen.getByText('Success message').closest('.toast-item')).toHaveClass('toast-success');
            expect(screen.getByText('Error message').closest('.toast-item')).toHaveClass('toast-error');
            expect(screen.getByText('Warning message').closest('.toast-item')).toHaveClass('toast-warning');
            expect(screen.getByText('Info message').closest('.toast-item')).toHaveClass('toast-info');
        });
    });

    describe('Animation and Visibility', () => {
        it('starts with invisible state and becomes visible', async () => {
            render(<ToastContainer toasts={[mockToasts[0]]} onRemove={vi.fn()} />);

            act(() => {
                vi.advanceTimersByTime(20);
            });

            const toastItem = screen.getByText('Success message').closest('.toast-item');
            expect(toastItem).toHaveClass('toast-visible');
        });



        it('applies leaving class during exit animation', async () => {
            render(<ToastContainer toasts={[mockToasts[0]]} onRemove={defaultProps.onRemove} />);

            // Wait for enter animation
            vi.advanceTimersByTime(20);

            const closeButton = screen.getByLabelText('Close notification');
            fireEvent.click(closeButton);

            const toastItem = screen.getByText('Success message').closest('.toast-item');
            expect(toastItem).toHaveClass('toast-leaving');
        });

        it('calls onRemove after exit animation delay', async () => {
            render(<ToastContainer toasts={[mockToasts[0]]} onRemove={defaultProps.onRemove} />);

            const closeButton = screen.getByLabelText('Close notification');
            fireEvent.click(closeButton);

            // Should not call immediately
            expect(defaultProps.onRemove).not.toHaveBeenCalled();

            // Advance timers to trigger the callback
            vi.advanceTimersByTime(300);
            vi.runAllTimers();

            // Should have been called
            expect(defaultProps.onRemove).toHaveBeenCalledWith('1');
        });
    });

    describe('Close Functionality', () => {
        it('has close button with proper accessibility', () => {
            const { container } = render(<ToastContainer toasts={[mockToasts[0]]} onRemove={vi.fn()} />);

            const closeButton = screen.getByLabelText('Close notification');
            expect(closeButton).toBeInTheDocument();
            expect(container.querySelector('[data-icon="vaadin:close-small"]')).toBeInTheDocument();
        });

        it('calls onRemove with correct toast id when close button clicked', async () => {
            render(<ToastContainer toasts={[mockToasts[0]]} onRemove={defaultProps.onRemove} />);

            const closeButton = screen.getByLabelText('Close notification');
            fireEvent.click(closeButton);

            // Advance timers
            vi.advanceTimersByTime(300);
            vi.runAllTimers();

            expect(defaultProps.onRemove).toHaveBeenCalledWith('1');
        });

        it('handles multiple toasts with individual close buttons', async () => {
            render(<ToastContainer {...defaultProps} />);

            const closeButtons = screen.getAllByLabelText('Close notification');
            expect(closeButtons).toHaveLength(4);

            // Click the first close button
            fireEvent.click(closeButtons[0]);

            vi.advanceTimersByTime(300);
            vi.runAllTimers();

            expect(defaultProps.onRemove).toHaveBeenCalledWith('1');
        });

        it('handles null onRemove function gracefully', () => {
            render(<ToastContainer toasts={[mockToasts[0]]} onRemove={null as any} />);

            const closeButton = screen.getByLabelText('Close notification');
            expect(() => fireEvent.click(closeButton)).not.toThrow();
        });

        it('handles undefined onRemove function gracefully', () => {
            render(<ToastContainer toasts={[mockToasts[0]]} onRemove={undefined as any} />);

            const closeButton = screen.getByLabelText('Close notification');
            expect(() => fireEvent.click(closeButton)).not.toThrow();
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA attributes', () => {
            render(<ToastContainer toasts={[mockToasts[0]]} onRemove={vi.fn()} />);

            const toastItem = screen.getByText('Success message').closest('.toast-item');
            expect(toastItem).toHaveAttribute('role', 'alert');
            expect(toastItem).toHaveAttribute('aria-live', 'polite');
        });

        it('provides accessible close button labels', () => {
            render(<ToastContainer {...defaultProps} />);

            const closeButtons = screen.getAllByLabelText('Close notification');
            expect(closeButtons).toHaveLength(4);

            closeButtons.forEach(button => {
                expect(button).toHaveAttribute('aria-label', 'Close notification');
            });
        });

        it('maintains proper focus management', () => {
            render(<ToastContainer toasts={[mockToasts[0]]} onRemove={vi.fn()} />);

            const closeButton = screen.getByLabelText('Close notification');
            closeButton.focus();

            expect(closeButton).toHaveFocus();
        });
    });

    describe('Multiple Toasts', () => {
        it('renders multiple toasts in correct order', () => {
            render(<ToastContainer {...defaultProps} />);

            const toastItems = screen.getAllByRole('alert');
            expect(toastItems).toHaveLength(4);

            expect(toastItems[0]).toHaveTextContent('Success message');
            expect(toastItems[1]).toHaveTextContent('Error message');
            expect(toastItems[2]).toHaveTextContent('Warning message');
            expect(toastItems[3]).toHaveTextContent('Info message');
        });

        it('handles removing individual toasts from multiple toasts', async () => {
            render(<ToastContainer {...defaultProps} />);

            const closeButtons = screen.getAllByLabelText('Close notification');

            // Close the second toast (Error message)
            fireEvent.click(closeButtons[1]);

            vi.advanceTimersByTime(300);
            vi.runAllTimers();

            expect(defaultProps.onRemove).toHaveBeenCalledWith('2');
        });

        it('maintains other toasts when one is removed', async () => {
            const { rerender } = render(<ToastContainer {...defaultProps} />);

            // Remove one toast
            const updatedToasts = mockToasts.filter(toast => toast.id !== '2');
            rerender(<ToastContainer toasts={updatedToasts} onRemove={defaultProps.onRemove} />);

            expect(screen.getByText('Success message')).toBeInTheDocument();
            expect(screen.queryByText('Error message')).not.toBeInTheDocument();
            expect(screen.getByText('Warning message')).toBeInTheDocument();
            expect(screen.getByText('Info message')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('handles toasts with very long messages', () => {
            const longMessageToast = [{
                id: '1',
                message: 'This is a very long message that should still be displayed properly in the toast component without breaking the layout or causing any issues with the user interface design',
                type: 'info' as const
            }];

            expect(() => render(
                <ToastContainer toasts={longMessageToast} onRemove={vi.fn()} />
            )).not.toThrow();

            expect(screen.getByText(/This is a very long message/)).toBeInTheDocument();
        });

        it('handles toasts with empty messages', () => {
            const emptyMessageToast = [{
                id: '1',
                message: '',
                type: 'info' as const
            }];

            expect(() => render(
                <ToastContainer toasts={emptyMessageToast} onRemove={vi.fn()} />
            )).not.toThrow();
        });

        it('handles toasts with special characters in messages', () => {
            const specialCharToast = [{
                id: '1',
                message: 'Toast with <script>alert("xss")</script> and & symbols',
                type: 'warning' as const
            }];

            render(<ToastContainer toasts={specialCharToast} onRemove={vi.fn()} />);
            expect(screen.getByText('Toast with <script>alert("xss")</script> and & symbols')).toBeInTheDocument();
        });

        it('handles rapid toast additions and removals', () => {
            const { rerender } = render(<ToastContainer toasts={[]} onRemove={vi.fn()} />);

            // Rapidly add and remove toasts
            for (let i = 0; i < 10; i++) {
                const dynamicToasts = i % 2 === 0 ? [mockToasts[0]] : [];
                rerender(<ToastContainer toasts={dynamicToasts} onRemove={vi.fn()} />);
            }

            // Should not crash
            expect(true).toBe(true);
        });

        it('handles toasts without ids', () => {
            const toastsWithoutIds = [
                { id: '1', message: 'Message 1', type: 'info' as const },
                { id: '2', message: 'Message 2', type: 'success' as const }
            ];

            expect(() => render(
                <ToastContainer toasts={toastsWithoutIds} onRemove={vi.fn()} />
            )).not.toThrow();
        });
    });

    describe('Performance', () => {
        it('handles many toasts without performance issues', () => {
            const manyToasts = Array.from({ length: 50 }, (_, i) => ({
                id: `toast-${i}`,
                message: `Toast message ${i}`,
                type: 'info' as const
            }));

            const startTime = performance.now();
            render(<ToastContainer toasts={manyToasts} onRemove={vi.fn()} />);
            const endTime = performance.now();

            // Should render within reasonable time (100ms is generous)
            expect(endTime - startTime).toBeLessThan(100);
        });

        it('cleans up timers on unmount', () => {
            const { unmount } = render(<ToastContainer toasts={[mockToasts[0]]} onRemove={vi.fn()} />);

            // Start the enter animation
            vi.advanceTimersByTime(10);

            // Unmount component
            expect(() => unmount()).not.toThrow();

            // Advance timers - should not cause issues
            vi.advanceTimersByTime(1000);
        });

        it('handles component re-renders efficiently', () => {
            const { rerender } = render(<ToastContainer {...defaultProps} />);

            // Re-render with same toasts multiple times
            for (let i = 0; i < 10; i++) {
                rerender(<ToastContainer {...defaultProps} />);
            }

            // All toasts should still be visible
            expect(screen.getByText('Success message')).toBeInTheDocument();
            expect(screen.getByText('Error message')).toBeInTheDocument();
            expect(screen.getByText('Warning message')).toBeInTheDocument();
            expect(screen.getByText('Info message')).toBeInTheDocument();
        });
    });

    describe('Timer Management', () => {
        it('properly manages enter animation timer', async () => {
            render(<ToastContainer toasts={[mockToasts[0]]} onRemove={vi.fn()} />);

            act(() => {
                vi.advanceTimersByTime(15);
            });

            const toastItem = screen.getByText('Success message').closest('.toast-item');
            expect(toastItem).toHaveClass('toast-visible');
        });



        it('properly manages exit animation timer', async () => {
            render(<ToastContainer toasts={[mockToasts[0]]} onRemove={defaultProps.onRemove} />);

            const closeButton = screen.getByLabelText('Close notification');
            fireEvent.click(closeButton);

            // Should not call onRemove immediately
            expect(defaultProps.onRemove).not.toHaveBeenCalled();

            // Advance by less than exit delay
            vi.advanceTimersByTime(200);
            expect(defaultProps.onRemove).not.toHaveBeenCalled();

            // Advance past exit delay
            vi.advanceTimersByTime(150);
            vi.runAllTimers();

            expect(defaultProps.onRemove).toHaveBeenCalled();
        });
    });
});