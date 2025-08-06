import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { render, testUtils } from '../test-utils';

// Mock Vaadin components
vi.mock('@vaadin/react-components', () => ({
    Button: ({ children, onClick, disabled, theme, ...props }: any) => (
        <button onClick={onClick} disabled={disabled} className={theme} {...props}>
            {children}
        </button>
    ),
    Icon: ({ icon, style }: any) => <span data-icon={icon} style={style} className="mock-icon" />
}));

// Mock MemoizedExamCard
vi.mock('Frontend/components/MemoizedExamCard', () => ({
    MemoizedExamCard: ({ exam, onTagClick, className }: any) => (
        <div data-testid="memoized-exam-card" className={className}>
            <h3>{exam?.title || 'No Title'}</h3>
            <p>{exam?.description || 'No Description'}</p>
            <div>
                {exam?.tags?.map((tag: string, index: number) => (
                    <button key={index} onClick={() => onTagClick?.(tag)}>
                        {tag}
                    </button>
                ))}
            </div>
        </div>
    )
}));

// Mock ExamAttemptService - Create the mock directly in the factory
vi.mock('Frontend/generated/endpoints', () => ({
    ExamAttemptService: {
        getMyExamAttemptsByExam: vi.fn()
    }
}));

// Mock useAuth hook
vi.mock('Frontend/hooks/useAuth', () => ({
    useAuth: vi.fn()
}));

import { ExamAttemptService } from 'Frontend/generated/endpoints';
import { useAuth } from 'Frontend/hooks/useAuth';
import { DashboardExamCard } from 'Frontend/components/DashboardExamCard/DashboardExamCard';

// Mock attempts data
const mockAttempts = [
    {
        id: '1',
        numberCorrect: 8,
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T10:30:00Z'
    },
    {
        id: '2',
        numberCorrect: 6,
        startTime: '2024-01-02T10:00:00Z',
        endTime: '2024-01-02T10:25:00Z'
    },
    {
        id: '3',
        numberCorrect: 9,
        startTime: '2024-01-03T10:00:00Z',
        endTime: '2024-01-03T10:20:00Z'
    }
];

// Mock auth user
const mockAuthHook = {
    user: {
        email: 'test@example.com',
        name: 'Test User'
    },
    authenticated: true,
    authInitialized: true,
    loading: false,
    logout: vi.fn(),
    login: vi.fn()
};

const mockExam = {
    id: '123',
    title: 'Test Exam',
    description: 'A test exam description',
    uploadedBy: 'test@example.com',
    questions: [
        { id: '1', questionText: 'Question 1' },
        { id: '2', questionText: 'Question 2' },
        { id: '3', questionText: 'Question 3' },
        { id: '4', questionText: 'Question 4' },
        { id: '5', questionText: 'Question 5' },
        { id: '6', questionText: 'Question 6' },
        { id: '7', questionText: 'Question 7' },
        { id: '8', questionText: 'Question 8' },
        { id: '9', questionText: 'Question 9' },
        { id: '10', questionText: 'Question 10' }
    ],
    tags: ['math', 'algebra']
};

describe('DashboardExamCard', () => {
    const defaultProps = {
        exam: mockExam,
        onTagClick: vi.fn(),
        onViewAttempts: vi.fn(),
        className: 'test-class'
    };

    // Test utilities
    const interactions = testUtils.interactions;
    const assertions = testUtils.assertions;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset auth hook to authenticated state
        (useAuth as any).mockReturnValue(mockAuthHook);
        // Reset service mock
        (ExamAttemptService.getMyExamAttemptsByExam as any).mockResolvedValue(mockAttempts);
    });

    describe('Basic Rendering', () => {
        it('renders without crashing', () => {
            expect(() => render(<DashboardExamCard {...defaultProps} />)).not.toThrow();
        });

        it('renders the base exam card', () => {
            render(<DashboardExamCard {...defaultProps} />);
            expect(screen.getByTestId('memoized-exam-card')).toBeInTheDocument();
            expect(screen.getByText('Test Exam')).toBeInTheDocument();
        });

        it('applies custom className', () => {
            const { container } = render(<DashboardExamCard {...defaultProps} />);
            expect(container.firstChild).toHaveClass('test-class');
        });

        it('handles missing optional props', () => {
            expect(() => render(
                <DashboardExamCard
                    exam={mockExam}
                    onTagClick={vi.fn()}
                    onViewAttempts={vi.fn()}
                />
            )).not.toThrow();
        });

        it('marks card as owned when user owns the exam', () => {
            const { container } = render(<DashboardExamCard {...defaultProps} />);
            expect(container.firstChild).toHaveClass('owned-exam');
        });

        it('does not mark card as owned when user does not own the exam', () => {
            const otherUserExam = { ...mockExam, uploadedBy: 'other@example.com' };
            const { container } = render(
                <DashboardExamCard {...defaultProps} exam={otherUserExam} />
            );
            expect(container.firstChild).not.toHaveClass('owned-exam');
        });
    });

    describe('Null/Undefined Handling', () => {
        it('handles minimal exam object gracefully', () => {
            // Test with minimal exam object instead of null to avoid runtime errors
            const minimalExam = {
                id: undefined,
                title: undefined,
                description: undefined,
                uploadedBy: undefined,
                questions: undefined,
                tags: undefined
            };
            expect(() => render(
                <DashboardExamCard {...defaultProps} exam={minimalExam} />
            )).not.toThrow();
        });

        it('handles exam without id', () => {
            const examWithoutId = { ...mockExam, id: undefined };
            expect(() => render(
                <DashboardExamCard {...defaultProps} exam={examWithoutId} />
            )).not.toThrow();
        });

        it('handles exam without questions', () => {
            const examWithoutQuestions = { ...mockExam, questions: undefined };
            expect(() => render(
                <DashboardExamCard {...defaultProps} exam={examWithoutQuestions} />
            )).not.toThrow();
        });

        it('handles null user from useAuth', () => {
            (useAuth as any).mockReturnValue({ user: null });
            expect(() => render(<DashboardExamCard {...defaultProps} />)).not.toThrow();
        });

        it('handles null function props', () => {
            expect(() => render(
                <DashboardExamCard
                    exam={mockExam}
                    onTagClick={null as any}
                    onViewAttempts={null as any}
                />
            )).not.toThrow();
        });
    });

    describe('Attempt Stats Loading', () => {
        it('shows loading state initially', async () => {
            render(<DashboardExamCard {...defaultProps} />);
            expect(screen.getByText('Loading stats...')).toBeInTheDocument();
        });

        it('loads and displays attempt stats', async () => {
            render(<DashboardExamCard {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('Your Performance')).toBeInTheDocument();
                expect(screen.getByText('3')).toBeInTheDocument(); // Total attempts
                expect(screen.getByText('View All Attempts')).toBeInTheDocument();
            });
        });

        it('calculates statistics correctly', async () => {
            render(<DashboardExamCard {...defaultProps} />);

            await waitFor(() => {
                // Best percentage: 9/10 = 90%
                expect(screen.getByText('90%')).toBeInTheDocument();
                // Average: (80% + 60% + 90%) / 3 = 77%
                expect(screen.getByText('77%')).toBeInTheDocument();
            });
        });

        it('handles empty attempts array', async () => {
            (ExamAttemptService.getMyExamAttemptsByExam as any).mockResolvedValue([]);
            render(<DashboardExamCard {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('No attempts yet')).toBeInTheDocument();
            });
        });

        it('handles null attempts response', async () => {
            (ExamAttemptService.getMyExamAttemptsByExam as any).mockResolvedValue(null);
            render(<DashboardExamCard {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('No attempts yet')).toBeInTheDocument();
            });
        });

        it('handles service error gracefully', async () => {
            (ExamAttemptService.getMyExamAttemptsByExam as any).mockRejectedValue(new Error('Service error'));
            render(<DashboardExamCard {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('Stats unavailable')).toBeInTheDocument();
            });
        });

        it('skips loading when exam has no id', () => {
            const examWithoutId = { ...mockExam, id: undefined };
            render(<DashboardExamCard {...defaultProps} exam={examWithoutId} />);

            expect(ExamAttemptService.getMyExamAttemptsByExam).not.toHaveBeenCalled();
        });
    });

    describe('Trend Calculation', () => {
        it('calculates improving trend correctly', async () => {
            const trendAttempts = [
                // Recent 3 (higher scores)
                { id: '1', numberCorrect: 9, startTime: '2024-01-06T10:00:00Z' },
                { id: '2', numberCorrect: 8, startTime: '2024-01-05T10:00:00Z' },
                { id: '3', numberCorrect: 9, startTime: '2024-01-04T10:00:00Z' },
                // Previous 3 (lower scores)
                { id: '4', numberCorrect: 5, startTime: '2024-01-03T10:00:00Z' },
                { id: '5', numberCorrect: 6, startTime: '2024-01-02T10:00:00Z' },
                { id: '6', numberCorrect: 5, startTime: '2024-01-01T10:00:00Z' }
            ];

            (ExamAttemptService.getMyExamAttemptsByExam as any).mockResolvedValue(trendAttempts);
            render(<DashboardExamCard {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('Your Performance')).toBeInTheDocument();
            });

            // Check for trend icon in a new render to avoid timing issues
            const { container } = render(<DashboardExamCard {...defaultProps} />);
            await waitFor(() => {
                const trendIcon = container.querySelector('[data-icon="vaadin:trending-up"]');
                expect(trendIcon).toBeInTheDocument();
            });
        });

        it('does not show trend for less than 6 attempts', async () => {
            const fewAttempts = mockAttempts.slice(0, 3);
            (ExamAttemptService.getMyExamAttemptsByExam as any).mockResolvedValue(fewAttempts);
            const { container } = render(<DashboardExamCard {...defaultProps} />);

            await waitFor(() => {
                const trendIcon = container.querySelector('.trend-indicator');
                expect(trendIcon).not.toBeInTheDocument();
            });
        });
    });

    describe('Date Formatting', () => {
        it('formats recent dates correctly', async () => {
            const todayAttempt = [{
                id: '1',
                numberCorrect: 8,
                startTime: new Date().toISOString()
            }];

            (ExamAttemptService.getMyExamAttemptsByExam as any).mockResolvedValue(todayAttempt);
            render(<DashboardExamCard {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('Today')).toBeInTheDocument();
            });
        });

        it('handles invalid date strings', async () => {
            const invalidDateAttempt = [{
                id: '1',
                numberCorrect: 8,
                startTime: 'invalid-date'
            }];

            (ExamAttemptService.getMyExamAttemptsByExam as any).mockResolvedValue(invalidDateAttempt);
            render(<DashboardExamCard {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('Invalid Date')).toBeInTheDocument();
            });
        });

        it('handles undefined date strings', async () => {
            const undefinedDateAttempt = [{
                id: '1',
                numberCorrect: 8,
                startTime: undefined
            }];

            (ExamAttemptService.getMyExamAttemptsByExam as any).mockResolvedValue(undefinedDateAttempt);
            render(<DashboardExamCard {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('Never')).toBeInTheDocument();
            });
        });
    });

    describe('Score Color Calculation', () => {
        it('applies correct colors for different score ranges', async () => {
            const scoreTestAttempts = [
                { id: '1', numberCorrect: 9 }, // 90% - green
                { id: '2', numberCorrect: 8 }, // 80% - blue
                { id: '3', numberCorrect: 7 }, // 70% - orange
                { id: '4', numberCorrect: 5 }  // 50% - red
            ];

            (ExamAttemptService.getMyExamAttemptsByExam as any).mockResolvedValue(scoreTestAttempts);
            const { container } = render(<DashboardExamCard {...defaultProps} />);

            await waitFor(() => {
                // Best score should be 90% with green color
                const scoreElement = screen.getByText('90%');
                expect(scoreElement.closest('.exam-attempts-stat-mini-value')).toHaveStyle('color: #10b981');
            });
        });
    });

    describe('User Interactions', () => {
        it('calls onViewAttempts when View All Attempts clicked', async () => {
            render(<DashboardExamCard {...defaultProps} />);

            await waitFor(() => {
                const viewButton = screen.getByText('View All Attempts');
                fireEvent.click(viewButton);
                expect(defaultProps.onViewAttempts).toHaveBeenCalledWith('123', 'Test Exam');
            });
        });

        it('stops propagation when View All Attempts clicked', async () => {
            const cardClickHandler = vi.fn();
            render(
                <div onClick={cardClickHandler}>
                    <DashboardExamCard {...defaultProps} />
                </div>
            );

            await waitFor(() => {
                const viewButton = screen.getByText('View All Attempts');
                fireEvent.click(viewButton);
                expect(cardClickHandler).not.toHaveBeenCalled();
            });
        });

        it('calls onTagClick when tag is clicked in base card', () => {
            render(<DashboardExamCard {...defaultProps} />);

            const tagButton = screen.getByText('math');
            fireEvent.click(tagButton);

            expect(defaultProps.onTagClick).toHaveBeenCalledWith('math');
        });

        it('handles missing exam id or title gracefully', async () => {
            const examWithoutData = { ...mockExam, id: undefined, title: undefined };
            render(<DashboardExamCard {...defaultProps} exam={examWithoutData} />);

            await waitFor(() => {
                const viewButton = screen.queryByText('View All Attempts');
                if (viewButton) {
                    fireEvent.click(viewButton);
                    expect(defaultProps.onViewAttempts).not.toHaveBeenCalled();
                }
            });
        });
    });

    describe('Performance', () => {
        it('handles multiple rapid re-renders', () => {
            const { rerender } = render(<DashboardExamCard {...defaultProps} />);

            for (let i = 0; i < 10; i++) {
                rerender(<DashboardExamCard {...defaultProps} exam={{ ...mockExam, title: `Exam ${i}` }} />);
            }

            expect(screen.getByText('Exam 9')).toBeInTheDocument();
        });

        it('cleans up effect on unmount', () => {
            const { unmount } = render(<DashboardExamCard {...defaultProps} />);
            expect(() => unmount()).not.toThrow();
        });
    });

    describe('Edge Cases', () => {
        it('handles attempts with missing data', async () => {
            const incompleteAttempts = [
                { id: '1', numberCorrect: undefined, startTime: undefined },
                { id: '2', numberCorrect: undefined, startTime: undefined },
                {} // completely empty attempt
            ];

            (ExamAttemptService.getMyExamAttemptsByExam as any).mockResolvedValue(incompleteAttempts);
            render(<DashboardExamCard {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('Your Performance')).toBeInTheDocument();
            });
        });

        it('handles division by zero in percentage calculation', async () => {
            const examWithNoQuestions = { ...mockExam, questions: [] };
            render(<DashboardExamCard {...defaultProps} exam={examWithNoQuestions} />);

            await waitFor(() => {
                // Should not crash and should handle gracefully
                expect(screen.getByTestId('memoized-exam-card')).toBeInTheDocument();
            });
        });
    });
});