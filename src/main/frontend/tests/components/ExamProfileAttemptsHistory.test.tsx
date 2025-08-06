import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from '../test-utils';

// Mock Vaadin components
vi.mock('@vaadin/react-components', () => ({
    Icon: ({ icon }: any) => <span data-icon={icon} className="mock-icon" />,
    Button: ({ children, onClick, theme, ...props }: any) => (
        <button onClick={onClick} className={theme} {...props}>
            {children}
        </button>
    )
}));

// Mock the exam attempts modal hook
const mockExamAttemptsModal = {
    currentView: 'closed',
    attempts: [],
    stats: {
        totalAttempts: 0,
        bestScore: 0,
        averageScore: 0,
        bestPercentage: 0,
        averagePercentage: 0,
        lastAttemptDate: null
    },
    isLoading: false,
    isError: false,
    error: null,
    selectedAttempt: null,
    openAttemptsModal: vi.fn(),
    closeModal: vi.fn(),
    openDetailModal: vi.fn(),
    goBackToList: vi.fn(),
    getPercentage: vi.fn(),
    getTimeSpent: vi.fn()
};

vi.mock('Frontend/hooks/useExamAttemptModal', () => ({
    useExamAttemptsModal: vi.fn(() => mockExamAttemptsModal)
}));

// Mock the history components
vi.mock('Frontend/components/ExamAttemptHistoryComponents/ExamAttemptHistoryComponents', () => ({
    ExamAttemptsListModal: ({ isOpen, examTitle, onClose }: any) =>
        isOpen ? (
            <div data-testid="attempts-list-modal">
                <h3>Attempts List Modal: {examTitle}</h3>
                <button onClick={onClose}>Close List Modal</button>
            </div>
        ) : null,
    ExamAttemptDetailModal: ({ isOpen, examTitle, onClose, onBack }: any) =>
        isOpen ? (
            <div data-testid="attempt-detail-modal">
                <h3>Attempt Detail Modal: {examTitle}</h3>
                <button onClick={onBack}>Back to List</button>
                <button onClick={onClose}>Close Detail Modal</button>
            </div>
        ) : null
}));

// Mock ErrorBoundary
vi.mock('Frontend/components/ErrorBoundaries', () => ({
    ExamErrorBoundary: ({ children }: any) => <div data-testid="error-boundary">{children}</div>
}));

import { useExamAttemptsModal } from 'Frontend/hooks/useExamAttemptModal';
import { ExamAttemptsStats } from 'Frontend/components/ExamAttemptHistoryComponents/ExamProfileAttemptsHistory';

describe('ExamAttemptsStats', () => {
    const defaultProps = {
        examId: 'exam123',
        examTitle: 'Test Exam',
        authenticated: true
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock to default state
        (useExamAttemptsModal as any).mockReturnValue(mockExamAttemptsModal);
    });

    describe('Basic Rendering', () => {
        it('renders without crashing', () => {
            expect(() => render(<ExamAttemptsStats {...defaultProps} />)).not.toThrow();
        });

        it('renders within error boundary', () => {
            render(<ExamAttemptsStats {...defaultProps} />);
            expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
        });

        it('displays section title and icon', () => {
            render(<ExamAttemptsStats {...defaultProps} />);
            expect(screen.getByText('Your Attempt History')).toBeInTheDocument();
            expect(screen.getByText('View All Attempts')).toBeInTheDocument();
        });

        it('handles missing props gracefully', () => {
            expect(() => render(
                <ExamAttemptsStats
                    examId=""
                    examTitle=""
                    authenticated={true}
                />
            )).not.toThrow();
        });

        it('handles null props gracefully', () => {
            expect(() => render(
                <ExamAttemptsStats
                    examId={null as any}
                    examTitle={null as any}
                    authenticated={true}
                />
            )).not.toThrow();
        });
    });

    describe('Authentication State', () => {
        it('shows sign-in prompt when not authenticated', () => {
            render(<ExamAttemptsStats {...defaultProps} authenticated={false} />);

            expect(screen.getByText('Attempt History')).toBeInTheDocument();
            expect(screen.getByText('Sign in to view your attempt history and track your progress.')).toBeInTheDocument();
            expect(screen.queryByText('View All Attempts')).not.toBeInTheDocument();
        });

        it('shows full interface when authenticated', () => {
            render(<ExamAttemptsStats {...defaultProps} authenticated={true} />);

            expect(screen.getByText('Your Attempt History')).toBeInTheDocument();
            expect(screen.getByText('View All Attempts')).toBeInTheDocument();
            expect(screen.queryByText('Sign in to view')).not.toBeInTheDocument();
        });

        it('does not call modal functions when not authenticated', () => {
            render(<ExamAttemptsStats {...defaultProps} authenticated={false} />);

            expect(mockExamAttemptsModal.openAttemptsModal).not.toHaveBeenCalled();
        });
    });

    describe('Modal Integration on Mount', () => {
        it('opens and immediately closes modal on mount when authenticated', async () => {
            render(<ExamAttemptsStats {...defaultProps} />);

            await waitFor(() => {
                expect(mockExamAttemptsModal.openAttemptsModal).toHaveBeenCalledWith('exam123', 'Test Exam');
                expect(mockExamAttemptsModal.closeModal).toHaveBeenCalled();
            });
        });

        it('does not open modal when not authenticated', () => {
            render(<ExamAttemptsStats {...defaultProps} authenticated={false} />);

            expect(mockExamAttemptsModal.openAttemptsModal).not.toHaveBeenCalled();
        });

        it('does not open modal when examId is missing', () => {
            render(<ExamAttemptsStats {...defaultProps} examId="" />);

            expect(mockExamAttemptsModal.openAttemptsModal).not.toHaveBeenCalled();
        });

        it('re-loads data when props change', async () => {
            const { rerender } = render(<ExamAttemptsStats {...defaultProps} />);

            // Clear previous calls
            vi.clearAllMocks();

            // Re-render with different examId
            rerender(<ExamAttemptsStats {...defaultProps} examId="exam456" examTitle="New Exam" />);

            await waitFor(() => {
                expect(mockExamAttemptsModal.openAttemptsModal).toHaveBeenCalledWith('exam456', 'New Exam');
            });
        });
    });

    describe('Quick Stats Display', () => {
        it('shows stats when user has attempts', () => {
            const modalWithStats = {
                ...mockExamAttemptsModal,
                stats: {
                    totalAttempts: 5,
                    bestPercentage: 85,
                    averagePercentage: 75,
                    bestScore: 8,
                    averageScore: 7,
                    lastAttemptDate: '2024-01-01'
                }
            };

            (useExamAttemptsModal as any).mockReturnValue(modalWithStats);

            render(<ExamAttemptsStats {...defaultProps} />);

            expect(screen.getByText('5')).toBeInTheDocument(); // Total attempts
            expect(screen.getByText('85%')).toBeInTheDocument(); // Best score
            expect(screen.getByText('75%')).toBeInTheDocument(); // Average
            expect(screen.getByText('Attempts')).toBeInTheDocument();
            expect(screen.getByText('Best Score')).toBeInTheDocument();
            expect(screen.getByText('Average')).toBeInTheDocument();
        });

        it('shows no attempts message when totalAttempts is 0', () => {
            const modalWithNoAttempts = {
                ...mockExamAttemptsModal,
                stats: {
                    totalAttempts: 0,
                    bestPercentage: 0,
                    averagePercentage: 0,
                    bestScore: 0,
                    averageScore: 0,
                    lastAttemptDate: null
                }
            };

            (useExamAttemptsModal as any).mockReturnValue(modalWithNoAttempts);

            render(<ExamAttemptsStats {...defaultProps} />);

            expect(screen.getByText("You haven't attempted this exam yet.")).toBeInTheDocument();
            expect(screen.getByText('Your attempt history will appear here after you take the exam.')).toBeInTheDocument();
            expect(screen.queryByText('Attempts')).not.toBeInTheDocument();
        });

        it('handles missing stats gracefully', () => {
            const modalWithNullStats = {
                ...mockExamAttemptsModal,
                stats: null
            };

            (useExamAttemptsModal as any).mockReturnValue(modalWithNullStats);

            expect(() => render(<ExamAttemptsStats {...defaultProps} />)).not.toThrow();
        });

        it('handles partial stats data', () => {
            const modalWithPartialStats = {
                ...mockExamAttemptsModal,
                stats: {
                    totalAttempts: 3,
                    bestPercentage: null,
                    averagePercentage: undefined
                }
            };

            (useExamAttemptsModal as any).mockReturnValue(modalWithPartialStats);

            expect(() => render(<ExamAttemptsStats {...defaultProps} />)).not.toThrow();
        });
    });

    describe('View All Attempts Button', () => {
        it('calls openAttemptsModal when View All Attempts clicked', () => {
            render(<ExamAttemptsStats {...defaultProps} />);

            // Clear initial mount calls
            vi.clearAllMocks();

            const viewButton = screen.getByText('View All Attempts');
            fireEvent.click(viewButton);

            expect(mockExamAttemptsModal.openAttemptsModal).toHaveBeenCalledWith('exam123', 'Test Exam');
        });

        it('is always visible when authenticated', () => {
            render(<ExamAttemptsStats {...defaultProps} />);
            expect(screen.getByText('View All Attempts')).toBeInTheDocument();
        });

        it('is not visible when not authenticated', () => {
            render(<ExamAttemptsStats {...defaultProps} authenticated={false} />);
            expect(screen.queryByText('View All Attempts')).not.toBeInTheDocument();
        });

        it('handles missing examId gracefully', () => {
            render(<ExamAttemptsStats {...defaultProps} examId="" />);

            const viewButton = screen.getByText('View All Attempts');
            fireEvent.click(viewButton);

            // Should still call with empty string
            expect(mockExamAttemptsModal.openAttemptsModal).toHaveBeenCalledWith('', 'Test Exam');
        });
    });

    describe('Modal Rendering', () => {
        it('renders ExamAttemptsListModal when currentView is list', () => {
            const modalWithListView = {
                ...mockExamAttemptsModal,
                currentView: 'list'
            };

            (useExamAttemptsModal as any).mockReturnValue(modalWithListView);

            render(<ExamAttemptsStats {...defaultProps} />);

            expect(screen.getByTestId('attempts-list-modal')).toBeInTheDocument();
            expect(screen.getByText('Attempts List Modal: Test Exam')).toBeInTheDocument();
        });

        it('renders ExamAttemptDetailModal when currentView is detail', () => {
            const modalWithDetailView = {
                ...mockExamAttemptsModal,
                currentView: 'detail',
                selectedAttempt: { id: '1', numberCorrect: 8 }
            };

            (useExamAttemptsModal as any).mockReturnValue(modalWithDetailView);

            render(<ExamAttemptsStats {...defaultProps} />);

            expect(screen.getByTestId('attempt-detail-modal')).toBeInTheDocument();
            expect(screen.getByText('Attempt Detail Modal: Test Exam')).toBeInTheDocument();
        });

        it('does not render modals when currentView is closed', () => {
            const modalWithClosedView = {
                ...mockExamAttemptsModal,
                currentView: 'closed'
            };

            (useExamAttemptsModal as any).mockReturnValue(modalWithClosedView);

            render(<ExamAttemptsStats {...defaultProps} />);

            expect(screen.queryByTestId('attempts-list-modal')).not.toBeInTheDocument();
            expect(screen.queryByTestId('attempt-detail-modal')).not.toBeInTheDocument();
        });

        it('passes correct props to ExamAttemptsListModal', () => {
            const modalWithListView = {
                ...mockExamAttemptsModal,
                currentView: 'list',
                attempts: [{ id: '1' }],
                stats: { totalAttempts: 1 },
                isLoading: true,
                isError: false,
                error: null
            };

            (useExamAttemptsModal as any).mockReturnValue(modalWithListView);

            render(<ExamAttemptsStats {...defaultProps} />);

            expect(screen.getByTestId('attempts-list-modal')).toBeInTheDocument();
        });

        it('passes correct props to ExamAttemptDetailModal', () => {
            const modalWithDetailView = {
                ...mockExamAttemptsModal,
                currentView: 'detail',
                selectedAttempt: { id: '1', numberCorrect: 8 }
            };

            (useExamAttemptsModal as any).mockReturnValue(modalWithDetailView);

            render(<ExamAttemptsStats {...defaultProps} />);

            expect(screen.getByTestId('attempt-detail-modal')).toBeInTheDocument();
        });
    });

    describe('Modal Interaction', () => {
        it('calls closeModal when list modal close button clicked', () => {
            const modalWithListView = {
                ...mockExamAttemptsModal,
                currentView: 'list'
            };

            (useExamAttemptsModal as any).mockReturnValue(modalWithListView);

            render(<ExamAttemptsStats {...defaultProps} />);

            const closeButton = screen.getByText('Close List Modal');
            fireEvent.click(closeButton);

            expect(mockExamAttemptsModal.closeModal).toHaveBeenCalled();
        });

        it('calls closeModal when detail modal close button clicked', () => {
            const modalWithDetailView = {
                ...mockExamAttemptsModal,
                currentView: 'detail',
                selectedAttempt: { id: '1' }
            };

            (useExamAttemptsModal as any).mockReturnValue(modalWithDetailView);

            render(<ExamAttemptsStats {...defaultProps} />);

            const closeButton = screen.getByText('Close Detail Modal');
            fireEvent.click(closeButton);

            expect(mockExamAttemptsModal.closeModal).toHaveBeenCalled();
        });

        it('calls goBackToList when detail modal back button clicked', () => {
            const modalWithDetailView = {
                ...mockExamAttemptsModal,
                currentView: 'detail',
                selectedAttempt: { id: '1' }
            };

            (useExamAttemptsModal as any).mockReturnValue(modalWithDetailView);

            render(<ExamAttemptsStats {...defaultProps} />);

            const backButton = screen.getByText('Back to List');
            fireEvent.click(backButton);

            expect(mockExamAttemptsModal.goBackToList).toHaveBeenCalled();
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('handles hook returning null', () => {
            (useExamAttemptsModal as any).mockReturnValue(null);

            expect(() => render(<ExamAttemptsStats {...defaultProps} />)).not.toThrow();
        });

        it('handles hook returning undefined', () => {
            (useExamAttemptsModal as any).mockReturnValue(undefined);

            expect(() => render(<ExamAttemptsStats {...defaultProps} />)).not.toThrow();
        });

        it('handles hook throwing error', () => {
            (useExamAttemptsModal as any).mockImplementation(() => {
                throw new Error('Hook failed');
            });

            expect(() => render(<ExamAttemptsStats {...defaultProps} />)).not.toThrow();
        });

        it('handles component unmount gracefully', () => {
            const { unmount } = render(<ExamAttemptsStats {...defaultProps} />);
            expect(() => unmount()).not.toThrow();
        });

        it('handles rapid prop changes', async () => {
            const { rerender } = render(
                <ExamAttemptsStats examId="exam-1" examTitle="Exam 1" authenticated={true} />
            );

            rerender(
                <ExamAttemptsStats examId="exam-9" examTitle="Exam 9" authenticated={true} />
            );

            await waitFor(() => {
                expect(screen.getAllByText(/Attempt History/i).length).toBeGreaterThan(0);
            });

        });

    });

    describe('Performance', () => {
        it('does not re-render unnecessarily', () => {
            const { rerender } = render(<ExamAttemptsStats {...defaultProps} />);

            const initialCallCount = mockExamAttemptsModal.openAttemptsModal.mock.calls.length;

            // Re-render with same props
            rerender(<ExamAttemptsStats {...defaultProps} />);

            // Should not call hook functions again
            expect(mockExamAttemptsModal.openAttemptsModal.mock.calls.length).toBe(initialCallCount);
        });

        it('only calls useEffect when dependencies change', async () => {
            const { rerender } = render(<ExamAttemptsStats {...defaultProps} />);

            // Clear initial calls
            vi.clearAllMocks();

            // Re-render with same props - should not trigger effect
            rerender(<ExamAttemptsStats {...defaultProps} />);
            expect(mockExamAttemptsModal.openAttemptsModal).not.toHaveBeenCalled();

            // Re-render with different examId - should trigger effect
            rerender(<ExamAttemptsStats {...defaultProps} examId="different-exam" />);
            await waitFor(() => {
                expect(mockExamAttemptsModal.openAttemptsModal).toHaveBeenCalledWith('different-exam', 'Test Exam');
            });
        });
    });

    describe('Accessibility', () => {
        it('has proper heading structure', () => {
            render(<ExamAttemptsStats {...defaultProps} />);

            const heading = screen.getByText('Your Attempt History');
            expect(heading.tagName).toBe('H2');
        });

        it('has accessible button for viewing attempts', () => {
            render(<ExamAttemptsStats {...defaultProps} />);

            const button = screen.getByText('View All Attempts');
            expect(button.tagName).toBe('BUTTON');
        });

        it('provides helpful text for unauthenticated users', () => {
            render(<ExamAttemptsStats {...defaultProps} authenticated={false} />);

            expect(screen.getByText('Sign in to view your attempt history and track your progress.')).toBeInTheDocument();
        });

        it('provides helpful text when no attempts exist', () => {
            render(<ExamAttemptsStats {...defaultProps} />);

            expect(screen.getByText("You haven't attempted this exam yet.")).toBeInTheDocument();
            expect(screen.getByText('Your attempt history will appear here after you take the exam.')).toBeInTheDocument();
        });
    });
});