import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import {
    render,
    testUtils,
    mockAuthStates,
    setupWindowMocks
} from '../test-utils';


import { mockNavigate } from '../setupTests';

// Mock hooks
const mockUseAuth = vi.fn();
const mockUseDashboard = vi.fn();
const mockUsePageMeta = vi.fn();
const mockUseAuthRedirect = vi.fn();
const mockUseExamAttemptsModal = vi.fn();

vi.mock('Frontend/hooks/useAuth', () => ({
    useAuth: (...args: any) => mockUseAuth(...args)
}));

vi.mock('Frontend/hooks/useDashboard', () => ({
    useDashboard: (...args: any) => mockUseDashboard(...args)
}));

vi.mock('Frontend/hooks/usePageMeta', () => ({
    usePageMeta: (...args: any) => mockUsePageMeta(...args)
}));

vi.mock('Frontend/hooks/useAuthRedirect', () => ({
    useAuthRedirect: (...args: any) => mockUseAuthRedirect(...args)
}));

vi.mock('Frontend/hooks/useExamAttemptModal', () => ({
    useExamAttemptsModal: (...args: any) => mockUseExamAttemptsModal(...args)
}));

// Mock components to focus on behavior
vi.mock('Frontend/components/ErrorBoundaries', () => ({
    PageErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('Frontend/components/ExamAttemptHistoryComponents/ExamAttemptHistoryComponents', () => ({
    ExamAttemptDetailModal: ({ isOpen, onClose }: any) =>
        isOpen ? <div data-testid="detail-modal"><button onClick={onClose}>Close</button></div> : null,
    ExamAttemptsListModal: ({ isOpen, onClose }: any) =>
        isOpen ? <div data-testid="list-modal"><button onClick={onClose}>Close</button></div> : null
}));

vi.mock('Frontend/components/DashboardExamCard/DashboardExamCard', () => ({
    DashboardExamCard: ({ exam, onTagClick, onViewAttempts }: any) => (
        <div data-testid={`exam-${exam.id}`}>
            <h3>{exam.title}</h3>
            <button onClick={() => onTagClick('test-tag')}>Tag</button>
            <button onClick={() => onViewAttempts(exam.id, exam.title)}>View Attempts</button>
        </div>
    )
}));

vi.mock('Frontend/components/MyAttemptsComponent/MyAttemptsComponent', () => ({
    MyAttempts: ({ attempts, onTagClick }: any) => (
        <div data-testid="my-attempts">
            {attempts.map((attempt: any, index: number) => (
                <div key={index}>
                    <span>{attempt.examTitle}</span>
                    <button onClick={() => onTagClick('attempt-tag')}>Attempt Tag</button>
                </div>
            ))}
        </div>
    )
}));

vi.mock('./home.css', () => ({}));

import HomeView from 'Frontend/views/home';

describe('HomeView - Behavioral Testing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupWindowMocks();

        // Default mocks
        mockUseAuth.mockReturnValue(testUtils.hooks.createMockAuthHook());
        mockUseDashboard.mockReturnValue(testUtils.hooks.createMockDashboardHook());
        mockUseExamAttemptsModal.mockReturnValue({
            currentView: null,
            openAttemptsModal: vi.fn(),
            closeModal: vi.fn(),
            getPercentage: vi.fn(),
            getTimeSpent: vi.fn()
        });
    });

    describe('Authentication Flow Behavior', () => {
        it('shows loading state during auth initialization', () => {
            mockUseAuth.mockReturnValue(testUtils.hooks.createMockAuthHook(mockAuthStates.loading));

            render(<HomeView />);

            testUtils.assertions.expectLoadingState(screen.getByText(/loading dashboard/i));
        });

        it('shows loading state during auth loading', () => {
            mockUseAuth.mockReturnValue(testUtils.hooks.createMockAuthHook(mockAuthStates.authLoading));

            render(<HomeView />);

            testUtils.assertions.expectLoadingState(screen.getByText(/loading dashboard/i));
        });

        it('redirects unauthenticated users', () => {
            mockUseAuth.mockReturnValue(testUtils.hooks.createMockAuthHook(mockAuthStates.notAuthenticated));

            render(<HomeView />);

            expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
        });

        it('calls useAuthRedirect with correct parameters', () => {
            const authState = testUtils.hooks.createMockAuthHook();
            mockUseAuth.mockReturnValue(authState);

            render(<HomeView />);

            expect(mockUseAuthRedirect).toHaveBeenCalled();
            const call = mockUseAuthRedirect.mock.calls[0];
            if (!call || call.length === 0 || call[0] === undefined) {
                // eslint-disable-next-line no-console
                console.error('mockUseAuthRedirect actual calls:', JSON.stringify(mockUseAuthRedirect.mock.calls));
                throw new Error('mockUseAuthRedirect was called with no arguments. See console for actual calls.');
            }
            expect(call[0]).toEqual(
                expect.objectContaining({
                    authenticated: true,
                    authInitialized: true,
                    loading: false,
                    currentPath: '/home',
                    isProtectedRoute: true
                })
            );
        });
    });

    describe('Dashboard Data Loading Behavior', () => {
        it('calls useDashboard with auth parameters', () => {
            const authState = testUtils.hooks.createMockAuthHook();
            mockUseAuth.mockReturnValue(authState);

            render(<HomeView />);

            expect(mockUseDashboard).toHaveBeenCalled();
            const call = mockUseDashboard.mock.calls[0];
            if (!call || call.length !== 3) {
                // eslint-disable-next-line no-console
                console.error('mockUseDashboard actual calls:', JSON.stringify(mockUseDashboard.mock.calls));
                throw new Error('mockUseDashboard was called with wrong arguments. See console for actual calls.');
            }
            expect(call).toEqual([true, true, false]);
        });

        it('handles dashboard loading state', () => {
            mockUseDashboard.mockReturnValue(testUtils.hooks.createMockDashboardHook({ loadingData: true }));

            const { container } = render(<HomeView />);

            // Should render loading skeleton or similar loading indicator
            // Instead of looking for 'loading' text, check for skeleton element
            expect(container.querySelector('.loading-skeleton')).toBeInTheDocument();
        });

        it('renders dashboard when data is loaded', () => {
            const mockUser = testUtils.data.createMockUser({ name: 'John Doe' });
            mockUseAuth.mockReturnValue(testUtils.hooks.createMockAuthHook(mockAuthStates.authenticated, { user: mockUser }));

            render(<HomeView />);

            expect(screen.getByText('Welcome back, John! 🎯')).toBeInTheDocument();
        });
    });

    describe('Navigation Behavior', () => {
        it('navigates to exam creation when Create Exam clicked', () => {
            render(<HomeView />);

            testUtils.interactions.clickButton(/create exam/i);

            testUtils.assertions.expectNavigation(mockNavigate, '/exams/create');
        });

        it('navigates to exams browse when Browse Exams clicked', () => {
            render(<HomeView />);

            testUtils.interactions.clickButton(/browse exams/i);

            testUtils.assertions.expectNavigation(mockNavigate, '/exams');
        });

        it('navigates when Create New button clicked in exams section', () => {
            render(<HomeView />);

            const createNewButton = screen.getByRole('button', { name: /create new/i });
            fireEvent.click(createNewButton);

            testUtils.assertions.expectNavigation(mockNavigate, '/exams/create');
        });

        it('navigates to filtered exams when View All clicked', () => {
            const manyExams = Array.from({ length: 6 }, (_, i) =>
                testUtils.data.createMockExam({ id: `exam-${i}` })
            );

            mockUseDashboard.mockReturnValue(
                testUtils.hooks.createMockDashboardHook({ myExams: manyExams })
            );

            render(<HomeView />);

            testUtils.interactions.clickButton(/view all.*exams/i);

            testUtils.assertions.expectNavigation(mockNavigate, '/exams?filter=mine');
        });

        it('navigates to attempts page when View All attempts clicked', () => {
            const manyAttempts = Array.from({ length: 6 }, (_, i) =>
                testUtils.data.createMockExamAttempt({ id: `attempt-${i}` })
            );

            mockUseDashboard.mockReturnValue(
                testUtils.hooks.createMockDashboardHook({ myAttempts: manyAttempts })
            );

            render(<HomeView />);

            testUtils.interactions.clickButton(/view all/i);

            testUtils.assertions.expectNavigation(mockNavigate, '/attempts');
        });
    });

    describe('Tag Click Behavior', () => {
        it('navigates to filtered exams when exam tag clicked', () => {
            render(<HomeView />);

            fireEvent.click(screen.getByText('Tag'));

            testUtils.assertions.expectNavigation(mockNavigate, '/exams?tag=test-tag');
        });

        it('navigates to filtered exams when attempt tag clicked', () => {
            render(<HomeView />);

            fireEvent.click(screen.getByText('Attempt Tag'));

            testUtils.assertions.expectNavigation(mockNavigate, '/exams?tag=attempt-tag');
        });
    });

    describe('Exam Attempts Modal Behavior', () => {
        it('opens attempts modal when View Attempts clicked', () => {
            const mockOpenModal = vi.fn();
            mockUseExamAttemptsModal.mockReturnValue({
                currentView: null,
                openAttemptsModal: mockOpenModal,
                closeModal: vi.fn(),
                getPercentage: vi.fn(),
                getTimeSpent: vi.fn()
            });

            render(<HomeView />);

            fireEvent.click(screen.getByText('View Attempts'));

            expect(mockOpenModal).toHaveBeenCalledWith('exam-123', 'Test Exam');
        });

        it('shows list modal when currentView is list', () => {
            mockUseExamAttemptsModal.mockReturnValue({
                currentView: 'list',
                closeModal: vi.fn(),
                getPercentage: vi.fn(),
                getTimeSpent: vi.fn()
            });

            render(<HomeView />);

            expect(screen.getByTestId('list-modal')).toBeInTheDocument();
        });

        it('shows detail modal when currentView is detail', () => {
            mockUseExamAttemptsModal.mockReturnValue({
                currentView: 'detail',
                selectedAttempt: testUtils.data.createMockExamAttempt(),
                closeModal: vi.fn(),
                getPercentage: vi.fn(),
                getTimeSpent: vi.fn()
            });

            render(<HomeView />);

            expect(screen.getByTestId('detail-modal')).toBeInTheDocument();
        });

        it('closes modal when close button clicked', () => {
            const mockCloseModal = vi.fn();
            mockUseExamAttemptsModal.mockReturnValue({
                currentView: 'list',
                closeModal: mockCloseModal,
                getPercentage: vi.fn(),
                getTimeSpent: vi.fn()
            });

            render(<HomeView />);

            fireEvent.click(screen.getByText('Close'));

            expect(mockCloseModal).toHaveBeenCalled();
        });
    });

    describe('Conditional Rendering Behavior', () => {
        it('shows exams section only when user has created exams', () => {
            mockUseDashboard.mockReturnValue(
                testUtils.hooks.createMockDashboardHook({ myExams: [] })
            );

            render(<HomeView />);

            expect(screen.queryByText(/your exams/i)).not.toBeInTheDocument();
        });

        it('always shows attempts section regardless of attempts count', () => {
            mockUseDashboard.mockReturnValue(
                testUtils.hooks.createMockDashboardHook({ myAttempts: [] })
            );

            render(<HomeView />);

            expect(screen.getByText(/my attempts/i)).toBeInTheDocument();
        });

        it('limits displayed exams to 4', () => {
            const manyExams = Array.from({ length: 10 }, (_, i) =>
                testUtils.data.createMockExam({ id: `exam-${i}` })
            );

            mockUseDashboard.mockReturnValue(
                testUtils.hooks.createMockDashboardHook({ myExams: manyExams })
            );

            render(<HomeView />);

            // Should only show first 4 exams
            expect(screen.getByTestId('exam-exam-0')).toBeInTheDocument();
            expect(screen.getByTestId('exam-exam-3')).toBeInTheDocument();
            expect(screen.queryByTestId('exam-exam-4')).not.toBeInTheDocument();
        });
    });

    describe('User Experience Behavior', () => {
        it('calls usePageMeta with dashboard title', () => {
            render(<HomeView />);

            expect(mockUsePageMeta).toHaveBeenCalled();
            const call = mockUsePageMeta.mock.calls[0];
            if (!call || call.length === 0 || call[0] === undefined) {
                // eslint-disable-next-line no-console
                console.error('mockUsePageMeta actual calls:', JSON.stringify(mockUsePageMeta.mock.calls));
                throw new Error('mockUsePageMeta was called with no arguments. See console for actual calls.');
            }
            expect(call[0]).toEqual(
                expect.objectContaining({
                    title: 'Dashboard',
                    description: 'Your personal exam dashboard'
                })
            );
        });

        it('extracts first name from full user name', () => {
            const mockUser = testUtils.data.createMockUser({ name: 'John William Doe' });
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.authenticated, { user: mockUser })
            );

            render(<HomeView />);

            expect(screen.getByText('Welcome back, John! 🎯')).toBeInTheDocument();
        });

        it('handles missing user data gracefully', () => {
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.authenticated, { user: null })
            );

            expect(() => render(<HomeView />)).not.toThrow();
        });
    });

    describe('Statistics Display Behavior', () => {
        it('displays correct statistics from dashboard data', () => {
            const customStats = testUtils.data.createMockDashboardStats({
                totalExamsCreated: 15,
                uniqueExamsTaken: 25,
                totalAttempts: 50,
                recentActivity: 8,
                studyStreak: 12
            });

            mockUseDashboard.mockReturnValue(
                testUtils.hooks.createMockDashboardHook({ dashboardStats: customStats })
            );

            render(<HomeView />);
            // Use getAllByText to avoid ambiguity if multiple elements have the same text
            expect(screen.getAllByText('15').length).toBeGreaterThanOrEqual(1); // Created exams
            expect(screen.getAllByText('25').length).toBeGreaterThanOrEqual(1); // Attempted exams
            expect(screen.getAllByText('50').length).toBeGreaterThanOrEqual(1); // Total attempts
            expect(screen.getByText('8 this week')).toBeInTheDocument(); // Recent activity
            expect(screen.getAllByText('12').length).toBeGreaterThanOrEqual(1); // Study streak
        });

        it('shows motivational message for active study streak', () => {
            const statsWithStreak = testUtils.data.createMockDashboardStats({ studyStreak: 5 });
            mockUseDashboard.mockReturnValue(
                testUtils.hooks.createMockDashboardHook({ dashboardStats: statsWithStreak })
            );

            render(<HomeView />);

            expect(screen.getByText('Keep it up!')).toBeInTheDocument();
        });

        it('shows encouragement message for zero study streak', () => {
            const statsNoStreak = testUtils.data.createMockDashboardStats({ studyStreak: 0 });
            mockUseDashboard.mockReturnValue(
                testUtils.hooks.createMockDashboardHook({ dashboardStats: statsNoStreak })
            );

            render(<HomeView />);

            expect(screen.getByText('Start today!')).toBeInTheDocument();
        });
    });
});