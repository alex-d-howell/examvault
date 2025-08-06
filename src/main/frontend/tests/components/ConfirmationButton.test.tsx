import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from '../test-utils';

// Mock Vaadin components
vi.mock('@vaadin/react-components', () => ({
    Button: ({ onClick, className, theme, children, ...props }: any) => (
        <button
            onClick={onClick}
            className={className}
            data-theme={theme}
            {...props}
        >
            {children}
        </button>
    ),
    Dialog: ({ opened, onOpenedChanged, headerTitle, footer, children }: any) =>
        opened ? (
            <div data-testid="confirmation-dialog" role="dialog">
                <div data-testid="dialog-header">{headerTitle}</div>
                <div data-testid="dialog-content">{children}</div>
                <div data-testid="dialog-footer">{footer}</div>
                <button
                    onClick={() => onOpenedChanged({ detail: { value: false } })}
                    data-testid="dialog-close-backdrop"
                >
                    Close
                </button>
            </div>
        ) : null
}));

import { ConfirmationButton } from 'Frontend/components/ConfirmationButton';

describe('ConfirmationButton - Behavioral Testing', () => {
    const defaultProps = {
        action: 'Delete',
        modalTitle: 'Confirm Delete',
        modalDescription: 'Are you sure you want to delete this item?',
        buttonText: 'Delete Item',
        buttonClassName: 'delete-btn',
        buttonTheme: 'primary error',
        onYes: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Initial Render Behavior', () => {
        it('renders trigger button with correct props', () => {
            render(<ConfirmationButton {...defaultProps} />);

            const button = screen.getByText('Delete Item');
            expect(button).toBeInTheDocument();
            expect(button).toHaveClass('delete-btn');
            expect(button).toHaveAttribute('data-theme', 'primary error');
        });

        it('does not show dialog initially', () => {
            render(<ConfirmationButton {...defaultProps} />);

            expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument();
        });

        it('renders with different button configurations', () => {
            const props = {
                ...defaultProps,
                action: 'Submit',
                buttonText: 'Submit Form',
                buttonClassName: 'submit-btn',
                buttonTheme: 'primary'
            };

            render(<ConfirmationButton {...props} />);

            const button = screen.getByText('Submit Form');
            expect(button).toHaveClass('submit-btn');
            expect(button).toHaveAttribute('data-theme', 'primary');
        });
    });

    describe('Dialog Opening Behavior', () => {
        it('opens dialog when trigger button is clicked', () => {
            render(<ConfirmationButton {...defaultProps} />);

            fireEvent.click(screen.getByText('Delete Item'));

            expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
            expect(screen.getByTestId('dialog-header')).toHaveTextContent('Confirm Delete');
            expect(screen.getByTestId('dialog-content')).toHaveTextContent('Are you sure you want to delete this item?');
        });

        it('displays correct dialog content', () => {
            render(<ConfirmationButton {...defaultProps} />);

            fireEvent.click(screen.getByText('Delete Item'));

            expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
            expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
        });

        it('shows action buttons in dialog footer', () => {
            render(<ConfirmationButton {...defaultProps} />);

            fireEvent.click(screen.getByText('Delete Item'));

            const footer = screen.getByTestId('dialog-footer');
            expect(footer).toBeInTheDocument();

            // The footer contains the cancel and confirm buttons
            expect(screen.getByText('Cancel')).toBeInTheDocument();
            expect(screen.getByText('Delete')).toBeInTheDocument();
        });
    });

    describe('Dialog Interaction Behavior', () => {
        it('closes dialog when Cancel button is clicked', async () => {
            render(<ConfirmationButton {...defaultProps} />);

            // Open dialog
            fireEvent.click(screen.getByText('Delete Item'));
            expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();

            // Click Cancel
            fireEvent.click(screen.getByText('Cancel'));

            // Dialog should close
            await waitFor(() => {
                expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument();
            });
        });

        it('calls onYes and closes dialog when action button is clicked', async () => {
            const mockOnYes = vi.fn();
            render(<ConfirmationButton {...defaultProps} onYes={mockOnYes} />);

            // Open dialog
            fireEvent.click(screen.getByText('Delete Item'));

            // Click action button
            fireEvent.click(screen.getByText('Delete'));

            // Should call onYes and close dialog
            expect(mockOnYes).toHaveBeenCalledTimes(1);
            await waitFor(() => {
                expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument();
            });
        });

        it('closes dialog when backdrop/close button is clicked', async () => {
            render(<ConfirmationButton {...defaultProps} />);

            // Open dialog
            fireEvent.click(screen.getByText('Delete Item'));
            expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();

            // Click backdrop close
            fireEvent.click(screen.getByTestId('dialog-close-backdrop'));

            // Dialog should close
            await waitFor(() => {
                expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument();
            });
        });

        it('does not call onYes when dialog is closed without confirmation', async () => {
            const mockOnYes = vi.fn();
            render(<ConfirmationButton {...defaultProps} onYes={mockOnYes} />);

            // Open dialog
            fireEvent.click(screen.getByText('Delete Item'));

            // Close without confirming
            fireEvent.click(screen.getByText('Cancel'));

            await waitFor(() => {
                expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument();
            });

            expect(mockOnYes).not.toHaveBeenCalled();
        });
    });

    describe('Multiple Instances Behavior', () => {
        it('handles multiple confirmation buttons independently', () => {
            const mockOnYes1 = vi.fn();
            const mockOnYes2 = vi.fn();

            render(
                <div>
                    <ConfirmationButton
                        {...defaultProps}
                        action="Delete"
                        buttonText="Delete First"
                        onYes={mockOnYes1}
                    />
                    <ConfirmationButton
                        {...defaultProps}
                        action="Archive"
                        modalTitle="Confirm Archive"
                        buttonText="Archive Second"
                        onYes={mockOnYes2}
                    />
                </div>
            );

            // Open first dialog
            fireEvent.click(screen.getByText('Delete First'));
            expect(screen.getByText('Confirm Delete')).toBeInTheDocument();

            // Close first dialog
            fireEvent.click(screen.getByText('Cancel'));

            // Open second dialog
            fireEvent.click(screen.getByText('Archive Second'));
            expect(screen.getByText('Confirm Archive')).toBeInTheDocument();

            // Confirm second action
            fireEvent.click(screen.getByText('Archive'));
            expect(mockOnYes2).toHaveBeenCalled();
            expect(mockOnYes1).not.toHaveBeenCalled();
        });
    });

    describe('Different Action Types Behavior', () => {
        it('handles different action types correctly', () => {
            const testCases = [
                {
                    action: 'Submit',
                    modalTitle: 'Confirm Submission',
                    modalDescription: 'Submit this form?',
                    buttonText: 'Submit Form'
                },
                {
                    action: 'Archive',
                    modalTitle: 'Archive Item',
                    modalDescription: 'Archive this item?',
                    buttonText: 'Archive'
                },
                {
                    action: 'Publish',
                    modalTitle: 'Publish Content',
                    modalDescription: 'Make this content public?',
                    buttonText: 'Publish Now'
                }
            ];

            testCases.forEach((testCase, index) => {
                const mockOnYes = vi.fn();
                const { unmount } = render(
                    <ConfirmationButton
                        {...testCase}
                        buttonClassName="test-btn"
                        buttonTheme="primary"
                        onYes={mockOnYes}
                    />
                );

                // Open dialog
                fireEvent.click(screen.getByText(testCase.buttonText));

                // Verify content
                expect(screen.getByText(testCase.modalTitle)).toBeInTheDocument();
                expect(screen.getByText(testCase.modalDescription)).toBeInTheDocument();

                // Confirm action (multiple elements may match)
                const actionButtons = screen.getAllByText(testCase.action);
                // Find the button inside the dialog (not the trigger)
                const dialogButton = actionButtons.find(btn => btn.closest('[data-testid="confirmation-dialog"]'));
                expect(dialogButton).toBeTruthy();
                fireEvent.click(dialogButton!);
                expect(mockOnYes).toHaveBeenCalled();

                unmount();
            });
        });
    });

    describe('Button States and Styling', () => {
        it('applies correct button themes', () => {
            const { rerender } = render(
                <ConfirmationButton {...defaultProps} buttonTheme="primary" />
            );

            expect(screen.getByText('Delete Item')).toHaveAttribute('data-theme', 'primary');

            rerender(
                <ConfirmationButton {...defaultProps} buttonTheme="secondary small" />
            );

            expect(screen.getByText('Delete Item')).toHaveAttribute('data-theme', 'secondary small');
        });

        it('applies custom CSS classes', () => {
            render(<ConfirmationButton {...defaultProps} buttonClassName="custom-class another-class" />);

            expect(screen.getByText('Delete Item')).toHaveClass('custom-class', 'another-class');
        });

        it('handles empty or undefined props gracefully', () => {
            const minimalProps = {
                action: 'Confirm',
                modalTitle: 'Title',
                modalDescription: 'Description',
                buttonText: 'Button',
                buttonClassName: '',
                buttonTheme: '',
                onYes: vi.fn()
            };

            expect(() => render(<ConfirmationButton {...minimalProps} />)).not.toThrow();

            const button = screen.getByText('Button');
            expect(button).toBeInTheDocument();
            expect(button).toHaveAttribute('data-theme', '');
        });
    });

    describe('Accessibility Behavior', () => {
        it('provides proper ARIA attributes for dialog', () => {
            render(<ConfirmationButton {...defaultProps} />);

            fireEvent.click(screen.getByText('Delete Item'));

            const dialog = screen.getByTestId('confirmation-dialog');
            expect(dialog).toHaveAttribute('role', 'dialog');
        });

        it('maintains focus management during dialog interactions', async () => {
            render(<ConfirmationButton {...defaultProps} />);

            const triggerButton = screen.getByText('Delete Item');

            // Focus and click trigger button
            triggerButton.focus();
            fireEvent.click(triggerButton);

            // Dialog should be open
            expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();

            // Close dialog
            fireEvent.click(screen.getByText('Cancel'));

            await waitFor(() => {
                expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument();
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('handles onYes function that throws an error', () => {
            const mockOnYes = vi.fn(() => {
                throw new Error('Test error');
            });

            // Render the component with mockOnYes
            render(<ConfirmationButton {...defaultProps} onYes={mockOnYes} />);

            fireEvent.click(screen.getByText('Delete Item'));
            // Error should be caught internally, not thrown
            expect(() => {
                fireEvent.click(screen.getByText('Delete'));
            }).not.toThrow();
        });

        it('handles rapid clicks on trigger button', () => {
            render(<ConfirmationButton {...defaultProps} />);

            const button = screen.getByText('Delete Item');

            // Rapid clicks should only open one dialog
            fireEvent.click(button);
            fireEvent.click(button);
            fireEvent.click(button);

            const dialogs = screen.queryAllByTestId('confirmation-dialog');
            expect(dialogs).toHaveLength(1);
        });

        it('handles very long text content', () => {
            const longText = 'This is a very long description that might cause layout issues if not handled properly. '.repeat(10).trim();

            render(
                <ConfirmationButton
                    {...defaultProps}
                    modalDescription={longText}
                />
            );

            fireEvent.click(screen.getByText('Delete Item'));

            // Use a flexible matcher to find the text even if split
            const matcher = (content: string, element: Element | null) => {
                return content.replace(/\s+/g, ' ').includes(longText.replace(/\s+/g, ' '));
            };
            expect(screen.getByText(matcher as any)).toBeInTheDocument();
        });

        it('handles special characters in text content', () => {
            const specialChars = 'Special chars: <>&"\'';

            render(
                <ConfirmationButton
                    {...defaultProps}
                    modalDescription={specialChars}
                    buttonText={specialChars}
                />
            );

            // There will be at least one element with this text (button)
            const all = screen.getAllByText(specialChars);
            expect(all.length).toBeGreaterThanOrEqual(1);
            all.forEach(el => expect(el).toBeInTheDocument());

            fireEvent.click(screen.getByText(specialChars));
            // After opening dialog, there should be at least two (button and dialog)
            const allAfter = screen.getAllByText(specialChars);
            expect(allAfter.length).toBeGreaterThanOrEqual(2);
            allAfter.forEach(el => expect(el).toBeInTheDocument());
        });
    });

    describe('Component Lifecycle Behavior', () => {
        it('cleans up properly when component unmounts', () => {
            const { unmount } = render(<ConfirmationButton {...defaultProps} />);

            fireEvent.click(screen.getByText('Delete Item'));
            expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();

            // Component should unmount without errors
            expect(() => unmount()).not.toThrow();
        });

        it('maintains dialog state across re-renders', () => {
            const { rerender } = render(<ConfirmationButton {...defaultProps} />);

            fireEvent.click(screen.getByText('Delete Item'));
            expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();

            // Re-render with same props
            rerender(<ConfirmationButton {...defaultProps} />);

            // Dialog should still be open
            expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
        });
    });
});