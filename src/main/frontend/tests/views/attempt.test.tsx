import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import {
    render,
    testUtils,
    mockAuthStates,
    setupWindowMocks
} from '../test-utils';
import AttemptView from 'Frontend/views/exams/{examId}/attempt/@index';

// Mock hooks
const mockUseAuth = vi.fn();
const mockUseExamAttempt = vi.fn();
const mockUseAnswerState = vi.fn();
const mockUseExamSubmission = vi.fn();
const mockUseAttemptDialogs = vi.fn();
const mockUseUnsavedChanges = vi.fn();

vi.mock('Frontend/hooks/useAuth.js', () => ({
    useAuth: (...args: any) => mockUseAuth(...args)
}));

vi.mock('Frontend/hooks/useExamAttempt', () => ({
    useExamAttempt: (...args: any) => mockUseExamAttempt(...args)
}));

vi.mock('Frontend/hooks/useAnswerState', () => ({
    useAnswerState: (...args: any) => mockUseAnswerState(...args)
}));

vi.mock('Frontend/hooks/useExamSubmission', () => ({
    useExamSubmission: (...args: any) => mockUseExamSubmission(...args)
}));

vi.mock('Frontend/hooks/useAttemptDialogs', () => ({
    useAttemptDialogs: (...args: any) => mockUseAttemptDialogs(...args)
}));

vi.mock('Frontend/hooks/useUnsavedChanges', () => ({
    useUnsavedChanges: (...args: any) => mockUseUnsavedChanges(...args)
}));

// Mock react-router
vi.mock('react-router', async (importOriginal) => {
    const actual = await importOriginal() as Record<string, any>;
    return {
        ...actual,
        useParams: () => ({ examId: 'test-exam-123' })
    };
});

// Mock components
vi.mock('Frontend/components/AttemptLoadingSkeletons', () => ({
    ExamAttemptSkeleton: () => <div data-testid="exam-attempt-skeleton">Loading exam...</div>,
    ResultsSkeleton: () => <div data-testid="results-skeleton">Loading results...</div>
}));

vi.mock('Frontend/components/ErrorBoundaries', () => ({
    ExamErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    PageErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('./attempt.css', () => ({}));

describe('AttemptView - Behavioral Testing', () => {
    const createMockExamAttemptState = (overrides = {}) => ({
        exam: testUtils.data.createMockExam({
            questions: [
                testUtils.data.createMockQuestion({
                    id: 'q1',
                    questionText: 'Test Question 1',
                    options: ['Option A', 'Option B', 'Option C'],
                    correctAnswer: ['Option A'],
                    isMultipleAnswers: false
                }),
                testUtils.data.createMockQuestion({
                    id: 'q2',
                    questionText: 'Test Question 2',
                    options: ['Option X', 'Option Y'],
                    correctAnswer: ['Option X', 'Option Y'],
                    isMultipleAnswers: true
                })
            ]
        }),
        loading: false,
        error: null,
        currentQuestionIndex: 0,
        currentQuestion: testUtils.data.createMockQuestion({
            id: 'q1',
            questionText: 'Test Question 1',
            options: ['Option A', 'Option B', 'Option C'],
            correctAnswer: ['Option A'],
            isMultipleAnswers: false
        }),
        navigateToQuestion: vi.fn(),
        nextQuestion: vi.fn(),
        previousQuestion: vi.fn(),
        totalQuestions: 2,
        canGoNext: true,
        canGoPrevious: false,
        ...overrides
    });

    const createMockAnswerState = (overrides = {}) => ({
        answers: { 'q1': ['Option A'], 'q2': [] },
        handleAnswerChange: vi.fn(),
        handleMultipleAnswerChange: vi.fn(),
        getQuestionStatus: vi.fn((id) => id === 'q1' ? 'answered' : 'unanswered'),
        getAnsweredCount: vi.fn(() => 1),
        getCurrentAnswer: vi.fn((id) => id === 'q1' ? ['Option A'] : []),
        canSubmit: true,
        ...overrides
    });

    const createMockSubmissionState = (overrides = {}) => ({
        submitting: false,
        isExamSubmitted: false,
        examAttempt: null,
        questionResults: [],
        scorePercentage: 0,
        submitExam: vi.fn(),
        showSaveOption: false,
        setShowSaveOption: vi.fn(),
        handleSignInToSave: vi.fn(),
        ...overrides
    });

    const createMockDialogsState = (overrides = {}) => ({
        showConfirmDialog: false,
        showLeaveDialog: false,
        openConfirmDialog: vi.fn(),
        closeConfirmDialog: vi.fn(),
        setPendingNavigation: vi.fn(),
        handleConfirmSubmit: vi.fn(),
        handleConfirmLeave: vi.fn(),
        handleCancelLeave: vi.fn(),
        ...overrides
    });

    beforeEach(() => {
        vi.clearAllMocks();
        setupWindowMocks();

        // Default states
        mockUseAuth.mockReturnValue(testUtils.hooks.createMockAuthHook());
        mockUseExamAttempt.mockReturnValue(createMockExamAttemptState());
        mockUseAnswerState.mockReturnValue(createMockAnswerState());
        mockUseExamSubmission.mockReturnValue(createMockSubmissionState());
        mockUseAttemptDialogs.mockReturnValue(createMockDialogsState());
        mockUseUnsavedChanges.mockReturnValue({});
    });

    describe('Loading and Error States', () => {
        it('shows loading skeleton when exam is loading', () => {
            mockUseExamAttempt.mockReturnValue(
                createMockExamAttemptState({ loading: true })
            );

            render(<AttemptView />);

            expect(screen.getByTestId('exam-attempt-skeleton')).toBeInTheDocument();
            expect(screen.queryByText('Test Question 1')).not.toBeInTheDocument();
        });

        it('shows error message when exam fails to load', () => {
            mockUseExamAttempt.mockReturnValue(
                createMockExamAttemptState({
                    loading: false,
                    exam: null,
                    error: 'Failed to load exam'
                })
            );

            render(<AttemptView />);

            expect(screen.getByText('Failed to load exam')).toBeInTheDocument();
        });

        it('shows exam not found message when exam is null with no error', () => {
            mockUseExamAttempt.mockReturnValue(
                createMockExamAttemptState({
                    loading: false,
                    exam: null,
                    error: null
                })
            );

            render(<AttemptView />);

            expect(screen.getByText('Exam not found')).toBeInTheDocument();
        });
    });

    describe('Exam Header Behavior', () => {
        it('displays exam title and description', () => {
            const mockExam = testUtils.data.createMockExam({
                title: 'Advanced Mathematics',
                description: 'Test your calculus knowledge'
            });

            mockUseExamAttempt.mockReturnValue(
                createMockExamAttemptState({ exam: mockExam })
            );

            render(<AttemptView />);

            expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument();
            expect(screen.getByText('Test your calculus knowledge')).toBeInTheDocument();
        });

        it('shows authenticated user status', () => {
            const mockUser = testUtils.data.createMockUser({ name: 'John Doe' });
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.authenticated, { user: mockUser })
            );

            render(<AttemptView />);

            expect(screen.getByText(/Signed in as John Doe - results will be saved/)).toBeInTheDocument();
        });

        it('shows anonymous user status', () => {
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.notAuthenticated)
            );

            render(<AttemptView />);

            expect(screen.getByText(/Taking as anonymous user. Sign in to save results./)).toBeInTheDocument();
        });

        it('calls openConfirmDialog when Submit Exam button is clicked', () => {
            const mockOpenConfirmDialog = vi.fn();
            mockUseAttemptDialogs.mockReturnValue(
                createMockDialogsState({ openConfirmDialog: mockOpenConfirmDialog })
            );

            render(<AttemptView />);

            // Use getAllByRole for robust button selection
            const submitButtons = screen.getAllByRole('button', { name: /submit exam/i });
            const button = submitButtons[0];
            if (!button) throw new Error('Submit Exam button not found');
            fireEvent.click(button);

            expect(mockOpenConfirmDialog).toHaveBeenCalled();
        });

        it('disables submit button when canSubmit is false', () => {
            mockUseAnswerState.mockReturnValue(
                createMockAnswerState({ canSubmit: false })
            );

            render(<AttemptView />);

            // Use getAllByRole for robust button selection
            const submitButtons = screen.getAllByRole('button', { name: /submit exam/i });
            const button = submitButtons[0];
            if (!button) throw new Error('Submit Exam button not found');
            expect(button).toBeDisabled();
        });

        it('shows submitting state', () => {
            mockUseExamSubmission.mockReturnValue(
                createMockSubmissionState({ submitting: true })
            );

            render(<AttemptView />);

            expect(screen.getByText('Submitting...')).toBeInTheDocument();
        });
    });

    describe('Sidebar Navigation Behavior', () => {
        it('displays question navigation grid', () => {
            render(<AttemptView />);

            expect(screen.getByText('Question Navigation')).toBeInTheDocument();
            expect(screen.getByText('Progress: 1/2 answered')).toBeInTheDocument();
        });

        it('shows question buttons with correct states', () => {
            render(<AttemptView />);

            const questionButtons = screen.getAllByRole('button').filter(btn =>
                btn.textContent === '1' || btn.textContent === '2'
            );

            expect(questionButtons).toHaveLength(2);
            expect(questionButtons[0]).toHaveClass('question-button-current');
        });

        it('calls navigateToQuestion when question button is clicked', () => {
            const mockNavigateToQuestion = vi.fn();
            mockUseExamAttempt.mockReturnValue(
                createMockExamAttemptState({ navigateToQuestion: mockNavigateToQuestion })
            );

            render(<AttemptView />);

            const question2Button = screen.getByText('2');
            fireEvent.click(question2Button);

            expect(mockNavigateToQuestion).toHaveBeenCalledWith(1);
        });
    });

    describe('Question Display Behavior', () => {
        it('displays current question with counter', () => {
            render(<AttemptView />);

            expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
            expect(screen.getByText('Test Question 1')).toBeInTheDocument();
        });

        it('shows multiple answers badge for multiple choice questions', () => {
            const multipleChoiceQuestion = testUtils.data.createMockQuestion({
                isMultipleAnswers: true
            });

            mockUseExamAttempt.mockReturnValue(
                createMockExamAttemptState({
                    currentQuestion: multipleChoiceQuestion
                })
            );

            render(<AttemptView />);

            expect(screen.getByText('Multiple answers allowed')).toBeInTheDocument();
        });

        it('does not show multiple answers badge for single choice questions', () => {
            render(<AttemptView />);

            expect(screen.queryByText('Multiple answers allowed')).not.toBeInTheDocument();
        });

        it('displays question options', () => {
            render(<AttemptView />);

            expect(screen.getByText('Option A')).toBeInTheDocument();
            expect(screen.getByText('Option B')).toBeInTheDocument();
            expect(screen.getByText('Option C')).toBeInTheDocument();
        });
    });

    describe('Answer Selection Behavior', () => {
        it('renders radio buttons for single choice questions', () => {
            render(<AttemptView />);

            const radioButtons = screen.getAllByRole('radio');
            expect(radioButtons.length).toBeGreaterThan(0);

            const checkboxes = screen.queryAllByRole('checkbox');
            expect(checkboxes).toHaveLength(0);
        });

        it('renders checkboxes for multiple choice questions', () => {
            const multipleChoiceQuestion = testUtils.data.createMockQuestion({
                isMultipleAnswers: true,
                options: ['Option X', 'Option Y']
            });

            mockUseExamAttempt.mockReturnValue(
                createMockExamAttemptState({
                    currentQuestion: multipleChoiceQuestion
                })
            );

            render(<AttemptView />);

            const checkboxes = screen.getAllByRole('checkbox');
            expect(checkboxes.length).toBeGreaterThan(0);
        });

        it('calls handleAnswerChange for radio button selection', () => {
            const mockHandleAnswerChange = vi.fn();
            mockUseAnswerState.mockReturnValue(
                createMockAnswerState({ handleAnswerChange: mockHandleAnswerChange })
            );

            render(<AttemptView />);

            const radioButton = screen.getByDisplayValue('Option B');
            fireEvent.click(radioButton);

            expect(mockHandleAnswerChange).toHaveBeenCalledWith('q1', 'Option B');
        });

        it('calls handleMultipleAnswerChange for checkbox selection', () => {
            const mockHandleMultipleAnswerChange = vi.fn();
            const multipleChoiceQuestion = testUtils.data.createMockQuestion({
                id: 'q2',
                isMultipleAnswers: true,
                options: ['Option X', 'Option Y']
            });

            mockUseAnswerState.mockReturnValue(
                createMockAnswerState({ handleMultipleAnswerChange: mockHandleMultipleAnswerChange })
            );

            mockUseExamAttempt.mockReturnValue(
                createMockExamAttemptState({
                    currentQuestion: multipleChoiceQuestion
                })
            );

            render(<AttemptView />);

            // Use getByLabelText for checkboxes
            const checkbox = screen.getByLabelText('Option X');
            fireEvent.click(checkbox);

            expect(mockHandleMultipleAnswerChange).toHaveBeenCalledWith('q2', 'Option X', true);
        });

        it('shows previously selected answers', () => {
            mockUseAnswerState.mockReturnValue(
                createMockAnswerState({
                    getCurrentAnswer: vi.fn(() => ['Option A'])
                })
            );

            render(<AttemptView />);

            const selectedRadio = screen.getByDisplayValue('Option A');
            expect(selectedRadio).toBeChecked();
        });
    });

    describe('Question Navigation Controls', () => {
        it('renders Previous and Next buttons', () => {
            render(<AttemptView />);

            expect(screen.getByText('Previous')).toBeInTheDocument();
            expect(screen.getByText('Next')).toBeInTheDocument();
        });

        it('disables Previous button when canGoPrevious is false', () => {
            mockUseExamAttempt.mockReturnValue(
                createMockExamAttemptState({ canGoPrevious: false })
            );

            render(<AttemptView />);

            // Use getAllByRole for robust button selection
            const prevButtons = screen.getAllByRole('button', { name: /previous/i });
            const button = prevButtons[0];
            if (!button) throw new Error('Previous button not found');
            expect(button).toBeDisabled();
        });

        it('disables Next button when canGoNext is false', () => {
            mockUseExamAttempt.mockReturnValue(
                createMockExamAttemptState({ canGoNext: false })
            );

            render(<AttemptView />);

            // Use getAllByRole for robust button selection
            const nextButtons = screen.getAllByRole('button', { name: /next/i });
            const button = nextButtons[0];
            if (!button) throw new Error('Next button not found');
            expect(button).toBeDisabled();
        });

        it('calls previousQuestion when Previous button is clicked', () => {
            const mockPreviousQuestion = vi.fn();
            mockUseExamAttempt.mockReturnValue(
                createMockExamAttemptState({
                    previousQuestion: mockPreviousQuestion,
                    canGoPrevious: true
                })
            );

            render(<AttemptView />);

            fireEvent.click(screen.getByText('Previous'));

            expect(mockPreviousQuestion).toHaveBeenCalled();
        });

        it('calls nextQuestion when Next button is clicked', () => {
            const mockNextQuestion = vi.fn();
            mockUseExamAttempt.mockReturnValue(
                createMockExamAttemptState({ nextQuestion: mockNextQuestion })
            );

            render(<AttemptView />);

            fireEvent.click(screen.getByText('Next'));

            expect(mockNextQuestion).toHaveBeenCalled();
        });
    });

    describe('Save Option Dialog Behavior', () => {
        it('shows save option dialog when showSaveOption is true and user not authenticated', () => {
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.notAuthenticated)
            );

            mockUseExamSubmission.mockReturnValue(
                createMockSubmissionState({ showSaveOption: true })
            );

            render(<AttemptView />);

            expect(screen.getByText('Ready to Submit?')).toBeInTheDocument();
            expect(screen.getByText('Sign In and Save Results')).toBeInTheDocument();
            expect(screen.getByText('Continue Anonymously')).toBeInTheDocument();
        });

        it('does not show save option dialog when user is authenticated', () => {
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.authenticated)
            );

            mockUseExamSubmission.mockReturnValue(
                createMockSubmissionState({ showSaveOption: true })
            );

            render(<AttemptView />);

            expect(screen.queryByText('Ready to Submit?')).not.toBeInTheDocument();
        });

        it('calls handleSignInToSave when Sign In button is clicked', () => {
            const mockHandleSignInToSave = vi.fn();
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.notAuthenticated)
            );

            mockUseExamSubmission.mockReturnValue(
                createMockSubmissionState({
                    showSaveOption: true,
                    handleSignInToSave: mockHandleSignInToSave
                })
            );

            render(<AttemptView />);

            fireEvent.click(screen.getByText('Sign In and Save Results'));

            expect(mockHandleSignInToSave).toHaveBeenCalled();
        });

        it('hides dialog and submits when Continue Anonymously is clicked', () => {
            const mockSetShowSaveOption = vi.fn();
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.notAuthenticated)
            );

            mockUseExamSubmission.mockReturnValue(
                createMockSubmissionState({
                    showSaveOption: true,
                    setShowSaveOption: mockSetShowSaveOption
                })
            );

            render(<AttemptView />);

            fireEvent.click(screen.getByText('Continue Anonymously'));

            expect(mockSetShowSaveOption).toHaveBeenCalledWith(false);
        });

        it('hides dialog when Back to Exam is clicked', () => {
            const mockSetShowSaveOption = vi.fn();
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.notAuthenticated)
            );

            mockUseExamSubmission.mockReturnValue(
                createMockSubmissionState({
                    showSaveOption: true,
                    setShowSaveOption: mockSetShowSaveOption
                })
            );

            render(<AttemptView />);

            fireEvent.click(screen.getByText('Back to Exam'));

            expect(mockSetShowSaveOption).toHaveBeenCalledWith(false);
        });
    });

    describe('Confirm Submit Dialog Behavior', () => {
        it('shows confirm dialog when showConfirmDialog is true', () => {
            mockUseAttemptDialogs.mockReturnValue(
                createMockDialogsState({ showConfirmDialog: true })
            );

            render(<AttemptView />);

            expect(screen.getByText('Submit Exam?')).toBeInTheDocument();
            expect(screen.getByText('Are you sure you want to submit your exam? This action cannot be undone.')).toBeInTheDocument();
        });

        it('displays answered count in confirm dialog', () => {
            mockUseAttemptDialogs.mockReturnValue(
                createMockDialogsState({ showConfirmDialog: true })
            );

            mockUseAnswerState.mockReturnValue(
                createMockAnswerState({ getAnsweredCount: vi.fn(() => 1) })
            );

            render(<AttemptView />);

            expect(screen.getByText('You have answered 1 out of 2 questions.')).toBeInTheDocument();
        });

        it('calls closeConfirmDialog when Continue Exam is clicked', () => {
            const mockCloseConfirmDialog = vi.fn();
            mockUseAttemptDialogs.mockReturnValue(
                createMockDialogsState({
                    showConfirmDialog: true,
                    closeConfirmDialog: mockCloseConfirmDialog
                })
            );

            render(<AttemptView />);

            fireEvent.click(screen.getByText('Continue Exam'));

            expect(mockCloseConfirmDialog).toHaveBeenCalled();
        });

        it('calls handleConfirmSubmit when Submit Exam is clicked in dialog', () => {
            const mockHandleConfirmSubmit = vi.fn();
            mockUseAttemptDialogs.mockReturnValue(
                createMockDialogsState({
                    showConfirmDialog: true,
                    handleConfirmSubmit: mockHandleConfirmSubmit
                })
            );

            render(<AttemptView />);

            // Find all elements with 'Submit Exam' text
            const submitButtons = screen.getAllByText('Submit Exam');
            // Find the dialog button (should have class 'dialog-button-primary')
            const dialogButton = submitButtons.find(el => el.tagName === 'BUTTON' && el.className.includes('dialog-button-primary'));
            fireEvent.click(dialogButton!);

            expect(mockHandleConfirmSubmit).toHaveBeenCalled();
        });
    });

    describe('Leave Page Dialog Behavior', () => {
        it('shows leave dialog when showLeaveDialog is true', () => {
            mockUseAttemptDialogs.mockReturnValue(
                createMockDialogsState({ showLeaveDialog: true })
            );

            render(<AttemptView />);

            expect(screen.getByText('Leave Page?')).toBeInTheDocument();
            expect(screen.getByText('You have unsaved changes. Are you sure you want to leave this page?')).toBeInTheDocument();
        });

        it('calls handleCancelLeave when Stay on Page is clicked', () => {
            const mockHandleCancelLeave = vi.fn();
            mockUseAttemptDialogs.mockReturnValue(
                createMockDialogsState({
                    showLeaveDialog: true,
                    handleCancelLeave: mockHandleCancelLeave
                })
            );

            render(<AttemptView />);

            fireEvent.click(screen.getByText('Stay on Page'));

            expect(mockHandleCancelLeave).toHaveBeenCalled();
        });

        it('calls handleConfirmLeave when Leave Page is clicked', () => {
            const mockHandleConfirmLeave = vi.fn();
            mockUseAttemptDialogs.mockReturnValue(
                createMockDialogsState({
                    showLeaveDialog: true,
                    handleConfirmLeave: mockHandleConfirmLeave
                })
            );

            render(<AttemptView />);

            fireEvent.click(screen.getByText('Leave Page'));

            expect(mockHandleConfirmLeave).toHaveBeenCalled();
        });
    });

    describe('Results Display Behavior', () => {
        it('shows results skeleton when submitting', () => {
            mockUseExamSubmission.mockReturnValue(
                createMockSubmissionState({
                    isExamSubmitted: true,
                    submitting: true
                })
            );

            render(<AttemptView />);

            expect(screen.getByTestId('results-skeleton')).toBeInTheDocument();
        });

        it('displays exam completion message when submitted', () => {
            const mockExamAttempt = testUtils.data.createMockExamAttempt({
                numberCorrect: 8,
                totalQuestions: 10
            });

            mockUseExamSubmission.mockReturnValue(
                createMockSubmissionState({
                    isExamSubmitted: true,
                    submitting: false,
                    examAttempt: mockExamAttempt,
                    scorePercentage: 80
                })
            );

            render(<AttemptView />);

            expect(screen.getByText('Exam Complete!')).toBeInTheDocument();
            expect(screen.getByText('8 / 2')).toBeInTheDocument(); // totalQuestions from mock
            expect(screen.getByText('80%')).toBeInTheDocument();
        });

        it('shows save status for authenticated users', () => {
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.authenticated)
            );

            mockUseExamSubmission.mockReturnValue(
                createMockSubmissionState({
                    isExamSubmitted: true,
                    submitting: false
                })
            );

            render(<AttemptView />);

            expect(screen.getByText('✓ Results saved to your account')).toBeInTheDocument();
        });

        it('shows sign-in prompt for anonymous users', () => {
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.notAuthenticated)
            );

            mockUseExamSubmission.mockReturnValue(
                createMockSubmissionState({
                    isExamSubmitted: true,
                    submitting: false
                })
            );

            render(<AttemptView />);

            expect(screen.getByText('Want to track your progress and save your results?')).toBeInTheDocument();
            expect(screen.getByText('Sign In with Google')).toBeInTheDocument();
        });

        it('shows action buttons in results view', () => {
            mockUseExamSubmission.mockReturnValue(
                createMockSubmissionState({
                    isExamSubmitted: true,
                    submitting: false
                })
            );

            render(<AttemptView />);

            expect(screen.getByText('Browse More Exams')).toBeInTheDocument();
            expect(screen.getByText('Retake Exam')).toBeInTheDocument();
        });
    });

    describe('Hook Integration Behavior', () => {
        it('calls useExamAttempt with examId', () => {
            render(<AttemptView />);

            expect(mockUseExamAttempt).toHaveBeenCalledWith('test-exam-123');
        });

        it('calls useAnswerState with exam data', () => {
            const mockExam = testUtils.data.createMockExam();
            mockUseExamAttempt.mockReturnValue(
                createMockExamAttemptState({ exam: mockExam })
            );

            render(<AttemptView />);

            expect(mockUseAnswerState).toHaveBeenCalledWith(mockExam);
        });

        it('calls useExamSubmission with auth and exam data', () => {
            const mockExam = testUtils.data.createMockExam();
            mockUseExamAttempt.mockReturnValue(
                createMockExamAttemptState({ exam: mockExam })
            );

            render(<AttemptView />);

            expect(mockUseExamSubmission).toHaveBeenCalledWith(true, mockExam);
        });

        it('calls useUnsavedChanges with appropriate parameters', () => {
            const mockAnswers = { 'q1': ['Option A'], 'q2': [] };
            mockUseAnswerState.mockReturnValue(
                createMockAnswerState({ answers: mockAnswers })
            );

            render(<AttemptView />);

            expect(mockUseUnsavedChanges).toHaveBeenCalledWith({
                hasChanges: true, // because q1 has an answer
                isSubmitted: false,
                onNavigationAttempt: expect.any(Function)
            });
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('handles missing examId gracefully', () => {
            vi.doMock('react-router', async (importOriginal) => {
                const actual = await importOriginal() as Record<string, any>;
                return {
                    ...actual,
                    useParams: () => ({ examId: undefined })
                };
            });

            expect(() => render(<AttemptView />)).not.toThrow();
        });

        it('handles questions without options', () => {
            const questionWithoutOptions = testUtils.data.createMockQuestion({
                options: []
            });

            mockUseExamAttempt.mockReturnValue(
                createMockExamAttemptState({
                    currentQuestion: questionWithoutOptions
                })
            );

            expect(() => render(<AttemptView />)).not.toThrow();
        });

        it('handles malformed question data', () => {
            mockUseExamAttempt.mockReturnValue(
                createMockExamAttemptState({
                    currentQuestion: null
                })
            );

            expect(() => render(<AttemptView />)).not.toThrow();
        });

        it('handles submission failures gracefully', () => {
            mockUseExamSubmission.mockReturnValue(
                createMockSubmissionState({
                    submitting: false,
                    isExamSubmitted: false,
                    examAttempt: null
                })
            );

            expect(() => render(<AttemptView />)).not.toThrow();
        });
    });
});