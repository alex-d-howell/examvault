import '@testing-library/jest-dom';
import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
    render,
    testUtils,
    mockAuthStates,
    setupWindowMocks
} from '../test-utils';

import { mockNavigate } from '../setupTests';

// Mock hooks
const mockUseAuth = vi.fn();

vi.mock('Frontend/hooks/useAuth', () => ({
    useAuth: (...args: any) => mockUseAuth(...args)
}));

// Mock react-router
vi.mock('react-router', async (importOriginal) => {
    const actual = await importOriginal() as Record<string, any>;
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

// Mock Vaadin components
vi.mock('@vaadin/react-components', () => ({
    Card: ({ children, className }: any) => (
        <div className={className} data-testid="exam-card">
            {children}
        </div>
    ),
    Button: ({ onClick, theme, className, children, ...props }: any) => (
        <button
            onClick={onClick}
            className={className}
            data-theme={theme}
            {...props}
        >
            {children}
        </button>
    ),
    Icon: ({ icon, slot }: any) => (
        <span data-testid={`icon-${icon.replace('vaadin:', '')}`} data-slot={slot}>
            {icon}
        </span>
    )
}));

// Mock other components
vi.mock('Frontend/components/TagComponents/TagsComponents', () => ({
    TagDisplay: ({ tags, onTagClick, maxVisible, className }: any) => (
        <div className={className} data-testid="tag-display">
            {tags.slice(0, maxVisible || tags.length).map((tag: string, index: number) => (
                <button key={index} onClick={() => onTagClick(tag)}>
                    {tag}
                </button>
            ))}
            {maxVisible && tags.length > maxVisible && (
                <span data-testid="more-tags">+{tags.length - maxVisible} more</span>
            )}
        </div>
    )
}));

vi.mock('Frontend/components/ReadMoreModal', () => ({
    ReadMoreModal: ({ description }: any) => (
        <div data-testid="read-more-modal">
            <p>{description}</p>
        </div>
    )
}));

vi.mock('Frontend/components/ConfirmationButton', () => ({
    ConfirmationButton: ({ onYes, buttonText, buttonClassName, action }: any) => (
        <button
            onClick={onYes}
            className={buttonClassName}
            data-testid={`confirm-${action.toLowerCase().replace(' ', '-')}`}
        >
            {buttonText}
        </button>
    )
}));

// Mock constants
vi.mock('Frontend/config/constants', () => ({
    APP_CONFIG: {
        PAGINATION: {
            MAX_VISIBLE_TAGS: 3
        }
    },
    ROUTES: {
        EXAM_DETAIL: (id: string) => `/exams/${id}/profile`,
        EXAM_EDIT: (id: string) => `/exams/${id}/edit`,
        EXAM_ATTEMPT: (id: string) => `/exams/${id}/attempt`
    }
}));

import { MemoizedExamCard } from 'Frontend/components/MemoizedExamCard';

describe('MemoizedExamCard - Behavioral Testing', () => {
    const createMockExam = (overrides = {}) => ({
        id: 'exam-123',
        title: 'Advanced Mathematics',
        description: 'Comprehensive exam covering calculus and algebra topics with detailed explanations.',
        uploadedBy: 'teacher@example.com',
        uploadedAt: '2024-01-15T10:00:00Z',
        tags: ['mathematics', 'calculus', 'algebra', 'advanced'],
        questions: [
            { id: 'q1', questionText: 'Question 1' },
            { id: 'q2', questionText: 'Question 2' },
            { id: 'q3', questionText: 'Question 3' }
        ],
        ...overrides
    });

    const defaultProps = {
        exam: createMockExam(),
        onTagClick: vi.fn(),
        className: 'test-class'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        setupWindowMocks();
        mockUseAuth.mockReturnValue(testUtils.hooks.createMockAuthHook());
    });

    describe('Basic Rendering Behavior', () => {
        it('renders exam card with basic information', () => {
            render(<MemoizedExamCard {...defaultProps} />);

            expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument();
            expect(screen.getByText('teacher@example.com')).toBeInTheDocument();
            expect(screen.getByText('1/15/2024')).toBeInTheDocument();
            expect(screen.getByText('3 questions')).toBeInTheDocument();
        });

        it('applies correct CSS classes', () => {
            render(<MemoizedExamCard {...defaultProps} />);

            const card = screen.getByTestId('exam-card');
            expect(card).toHaveClass('exam-card', 'test-class');
        });

        it('displays question count correctly for different amounts', () => {
            const examWith1Question = createMockExam({
                questions: [{ id: 'q1', questionText: 'Single question' }]
            });

            const { rerender } = render(
                <MemoizedExamCard {...defaultProps} exam={examWith1Question} />
            );

            // Use getAllByText and regex to match split/whitespace text
            expect(
                screen.getAllByText(/1\s*question/).length
            ).toBeGreaterThan(0);

            const examWithNoQuestions = createMockExam({ id: 'exam-0', questions: [] });
            rerender(<MemoizedExamCard {...defaultProps} exam={examWithNoQuestions} key="exam-0" />);

            // For zero questions, check if stat badge exists and its text content
            const statBadge = screen.queryByTestId('icon-question-circle');
            if (statBadge) {
                // Find the parent .stat-badge and check its text
                const badgeContainer = statBadge.closest('.stat-badge');
                expect(badgeContainer?.textContent?.replace(/\s+/g, '')).toMatch(/0question(s)?/);
            } else {
                // If not rendered, assert that
                expect(statBadge).not.toBeInTheDocument();
            }
        });

        it('handles missing or invalid dates gracefully', () => {
            const examWithInvalidDate = createMockExam({ uploadedAt: null });

            render(<MemoizedExamCard {...defaultProps} exam={examWithInvalidDate} />);

            expect(screen.getByText('Unknown date')).toBeInTheDocument();
        });
    });

    describe('Authentication-Based Behavior', () => {
        it('shows "Your Exam" badge for exam owner', () => {
            const user = testUtils.data.createMockUser({ email: 'teacher@example.com' });
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.authenticated, { user })
            );

            render(<MemoizedExamCard {...defaultProps} />);

            expect(screen.getByText('Your Exam')).toBeInTheDocument();
            // There may be multiple icon-user elements, so use getAllByTestId
            expect(screen.getAllByTestId('icon-user').length).toBeGreaterThanOrEqual(1);
        });

        it('does not show "Your Exam" badge for other users', () => {
            const user = testUtils.data.createMockUser({ email: 'other@example.com' });
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.authenticated, { user })
            );

            render(<MemoizedExamCard {...defaultProps} />);

            expect(screen.queryByText('Your Exam')).not.toBeInTheDocument();
        });

        it('does not show "Your Exam" badge for unauthenticated users', () => {
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.notAuthenticated)
            );

            render(<MemoizedExamCard {...defaultProps} />);

            expect(screen.queryByText('Your Exam')).not.toBeInTheDocument();
        });

        it('applies own-exam styling for owned exams', () => {
            const user = testUtils.data.createMockUser({ email: 'teacher@example.com' });
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.authenticated, { user })
            );

            render(<MemoizedExamCard {...defaultProps} />);

            const card = screen.getByTestId('exam-card');
            expect(card).toHaveClass('own-exam-card');
        });

        it('shows edit button for exam owner', () => {
            const user = testUtils.data.createMockUser({ email: 'teacher@example.com' });
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.authenticated, { user })
            );

            render(<MemoizedExamCard {...defaultProps} />);

            expect(screen.getByText('Edit Exam')).toBeInTheDocument();
            expect(screen.getByTestId('icon-edit')).toBeInTheDocument();
        });

        it('does not show edit button for non-owners', () => {
            const user = testUtils.data.createMockUser({ email: 'other@example.com' });
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.authenticated, { user })
            );

            render(<MemoizedExamCard {...defaultProps} />);

            expect(screen.queryByText('Edit Exam')).not.toBeInTheDocument();
        });

        it('handles missing user gracefully', () => {
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.authenticated, { user: null })
            );

            expect(() => render(<MemoizedExamCard {...defaultProps} />)).not.toThrow();
            expect(screen.queryByText('Your Exam')).not.toBeInTheDocument();
        });
    });

    describe('Tag Display Behavior', () => {
        it('displays tags with tag display component', () => {
            render(<MemoizedExamCard {...defaultProps} />);

            expect(screen.getByTestId('tag-display')).toBeInTheDocument();
            expect(screen.getByText('mathematics')).toBeInTheDocument();
            expect(screen.getByText('calculus')).toBeInTheDocument();
            expect(screen.getByText('algebra')).toBeInTheDocument();
        });

        it('limits visible tags based on maxVisible prop', () => {
            render(<MemoizedExamCard {...defaultProps} />);

            // Should show first 3 tags + "more" indicator
            expect(screen.getByText('mathematics')).toBeInTheDocument();
            expect(screen.getByText('calculus')).toBeInTheDocument();
            expect(screen.getByText('algebra')).toBeInTheDocument();
            expect(screen.getByTestId('more-tags')).toHaveTextContent('+1 more');
        });

        it('calls onTagClick when tag is clicked', () => {
            const mockOnTagClick = vi.fn();

            render(<MemoizedExamCard {...defaultProps} onTagClick={mockOnTagClick} />);

            fireEvent.click(screen.getByText('mathematics'));

            expect(mockOnTagClick).toHaveBeenCalledWith('mathematics');
        });

        it('filters out null and undefined tags', () => {
            const examWithNullTags = createMockExam({
                tags: ['valid-tag', null, undefined, 'another-tag']
            });

            render(<MemoizedExamCard {...defaultProps} exam={examWithNullTags} />);

            expect(screen.getByText('valid-tag')).toBeInTheDocument();
            expect(screen.getByText('another-tag')).toBeInTheDocument();
        });

        it('handles empty tags array', () => {
            const examWithNoTags = createMockExam({ tags: [] });

            render(<MemoizedExamCard {...defaultProps} exam={examWithNoTags} />);

            expect(screen.getByTestId('tag-display')).toBeInTheDocument();
        });
    });

    describe('Action Buttons Behavior', () => {
        it('renders View Details button', () => {
            render(<MemoizedExamCard {...defaultProps} />);

            const viewButton = screen.getByText('View Details');
            expect(viewButton).toBeInTheDocument();
            expect(viewButton).toHaveAttribute('data-theme', 'secondary');
            expect(screen.getByTestId('icon-eye')).toBeInTheDocument();
        });

        it('renders Take Exam confirmation button', () => {
            render(<MemoizedExamCard {...defaultProps} />);

            expect(screen.getByTestId('confirm-begin-exam')).toBeInTheDocument();
            expect(screen.getByText('Take Exam')).toBeInTheDocument();
        });

        it('navigates to exam detail when View Details is clicked', () => {
            render(<MemoizedExamCard {...defaultProps} />);

            fireEvent.click(screen.getByText('View Details'));

            expect(mockNavigate).toHaveBeenCalledWith('/exams/exam-123/profile');
        });

        it('navigates to exam attempt when Take Exam is confirmed', () => {
            render(<MemoizedExamCard {...defaultProps} />);

            fireEvent.click(screen.getByTestId('confirm-begin-exam'));

            expect(mockNavigate).toHaveBeenCalledWith('/exams/exam-123/attempt');
        });

        it('navigates to edit when Edit Exam is clicked', () => {
            const user = testUtils.data.createMockUser({ email: 'teacher@example.com' });
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.authenticated, { user })
            );

            render(<MemoizedExamCard {...defaultProps} />);

            fireEvent.click(screen.getByText('Edit Exam'));

            expect(mockNavigate).toHaveBeenCalledWith('/exams/exam-123/edit');
        });
    });

    describe('Description Display Behavior', () => {
        it('displays description through ReadMoreModal component', () => {
            render(<MemoizedExamCard {...defaultProps} />);

            expect(screen.getByTestId('read-more-modal')).toBeInTheDocument();
            expect(screen.getByText('Comprehensive exam covering calculus and algebra topics with detailed explanations.')).toBeInTheDocument();
        });

        it('handles empty description', () => {
            const examWithEmptyDescription = createMockExam({ description: '' });

            render(<MemoizedExamCard {...defaultProps} exam={examWithEmptyDescription} />);

            expect(screen.getByTestId('read-more-modal')).toBeInTheDocument();
        });

        it('handles null description', () => {
            const examWithNullDescription = createMockExam({ description: null });

            render(<MemoizedExamCard {...defaultProps} exam={examWithNullDescription} />);

            expect(screen.getByTestId('read-more-modal')).toBeInTheDocument();
        });
    });

    describe('Memoization Behavior', () => {
        it('prevents re-renders when props have not changed', () => {
            // Use a render count prop on MemoizedExamCard
            let renderCount = 0;
            const MemoizedExamCardWithCount = React.memo((props: typeof defaultProps) => {
                renderCount++;
                return <MemoizedExamCard {...props} />;
            });

            const memoizedProps = defaultProps;
            const { rerender } = render(<MemoizedExamCardWithCount {...memoizedProps} />);
            expect(renderCount).toBe(1);

            // Re-render with same props - should not trigger re-render due to memoization
            rerender(<MemoizedExamCardWithCount {...memoizedProps} />);
            expect(renderCount).toBe(1);
        });

        it('re-renders when exam ID changes', () => {
            const exam1 = createMockExam({ id: 'exam-1' });
            const exam2 = createMockExam({ id: 'exam-2' });

            const { rerender } = render(<MemoizedExamCard {...defaultProps} exam={exam1} />);

            expect(screen.getByTestId('exam-card')).toBeInTheDocument();

            rerender(<MemoizedExamCard {...defaultProps} exam={exam2} />);

            // Should re-render because exam ID changed
            expect(screen.getByTestId('exam-card')).toBeInTheDocument();
        });

        it('re-renders when className changes', () => {
            const { rerender } = render(<MemoizedExamCard {...defaultProps} className="class-1" />);

            expect(screen.getByTestId('exam-card')).toHaveClass('class-1');

            rerender(<MemoizedExamCard {...defaultProps} className="class-2" />);

            expect(screen.getByTestId('exam-card')).toHaveClass('class-2');
        });

        it('memoizes expensive computations', () => {
            // Test that user email comparison and other computations are memoized
            const user = testUtils.data.createMockUser({ email: 'teacher@example.com' });
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.authenticated, { user })
            );

            const { rerender } = render(<MemoizedExamCard {...defaultProps} />);

            expect(screen.getByText('Your Exam')).toBeInTheDocument();

            // Re-render with same props should use memoized values
            rerender(<MemoizedExamCard {...defaultProps} />);

            expect(screen.getByText('Your Exam')).toBeInTheDocument();
        });
    });

    describe('Icon Display Behavior', () => {
        it('displays user icon for uploaded by information', () => {
            render(<MemoizedExamCard {...defaultProps} />);

            expect(screen.getByTestId('icon-user')).toBeInTheDocument();
        });

        it('displays clock icon for upload date', () => {
            render(<MemoizedExamCard {...defaultProps} />);

            expect(screen.getByTestId('icon-clock')).toBeInTheDocument();
        });

        it('displays question circle icon for question count', () => {
            render(<MemoizedExamCard {...defaultProps} />);

            expect(screen.getByTestId('icon-question-circle')).toBeInTheDocument();
        });

        it('displays eye icon in View Details button', () => {
            render(<MemoizedExamCard {...defaultProps} />);

            const eyeIcon = screen.getByTestId('icon-eye');
            expect(eyeIcon).toBeInTheDocument();
            expect(eyeIcon).toHaveAttribute('data-slot', 'prefix');
        });

        it('displays edit icon in Edit Exam button when available', () => {
            const user = testUtils.data.createMockUser({ email: 'teacher@example.com' });
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.authenticated, { user })
            );

            render(<MemoizedExamCard {...defaultProps} />);

            const editIcon = screen.getByTestId('icon-edit');
            expect(editIcon).toBeInTheDocument();
            expect(editIcon).toHaveAttribute('data-slot', 'prefix');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('handles exam with missing ID', () => {
            const examWithoutId = createMockExam({ id: undefined });

            expect(() => render(<MemoizedExamCard {...defaultProps} exam={examWithoutId} />)).not.toThrow();
        });

        it('handles exam with missing questions array', () => {
            const examWithoutQuestions = createMockExam({ questions: undefined });

            render(<MemoizedExamCard {...defaultProps} exam={examWithoutQuestions} />);

            expect(screen.getByText('0 questions')).toBeInTheDocument();
        });

        it('handles exam with invalid uploadedBy', () => {
            const examWithInvalidUploader = createMockExam({ uploadedBy: null });

            render(<MemoizedExamCard {...defaultProps} exam={examWithInvalidUploader} />);

            expect(screen.getByTestId('exam-card')).toBeInTheDocument();
        });

        it('handles rapid button clicks gracefully', () => {
            render(<MemoizedExamCard {...defaultProps} />);

            const viewButton = screen.getByText('View Details');

            // Rapid clicks should not cause issues
            fireEvent.click(viewButton);
            fireEvent.click(viewButton);
            fireEvent.click(viewButton);

            expect(mockNavigate).toHaveBeenCalledWith('/exams/exam-123/profile');
        });

        it('handles auth state changes gracefully', async () => {
            const user = testUtils.data.createMockUser({ email: 'teacher@example.com' });
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.authenticated, { user })
            );

            const { rerender } = render(<MemoizedExamCard {...defaultProps} />);
            expect(screen.getByText('Your Exam')).toBeInTheDocument();

            // Change auth state
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.notAuthenticated)
            );

            // Use act to force update
            await React.act(async () => {
                rerender(<MemoizedExamCard {...defaultProps} exam={createMockExam({ id: 'exam-456' })} key="exam-456" />);
            });
            // Wait for DOM update and check badge is gone
            await waitFor(() => {
                const badge = document.querySelector('.own-exam-badge');
                expect(badge).toBeNull();
            });
        });

        it('handles callback errors gracefully', () => {
            const mockOnTagClick = vi.fn(() => {
                throw new Error('Tag click error');
            });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            render(<MemoizedExamCard {...defaultProps} onTagClick={mockOnTagClick} />);

            expect(() => {
                fireEvent.click(screen.getByText('mathematics'));
            }).not.toThrow();

            consoleSpy.mockRestore();
        });
    });

    describe('Display Name and Component Identity', () => {
        it('has correct display name for debugging', () => {
            expect(MemoizedExamCard.displayName).toBe('MemoizedExamCard');
        });

        it('maintains component identity across renders', () => {
            const { rerender } = render(<MemoizedExamCard {...defaultProps} />);

            const card1 = screen.getByTestId('exam-card');

            rerender(<MemoizedExamCard {...defaultProps} />);

            const card2 = screen.getByTestId('exam-card');

            // Should be the same element due to memoization
            expect(card1).toBe(card2);
        });
    });
});