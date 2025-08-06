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
const mockUseExamForm = vi.fn();
const mockUseExamFormStates = vi.fn();
const mockUsePageMeta = vi.fn();

vi.mock('Frontend/hooks/useAuth', () => ({
    useAuth: (...args: any) => mockUseAuth(...args)
}));

vi.mock('Frontend/hooks/useExamForm', () => ({
    useExamForm: (...args: any) => mockUseExamForm(...args)
}));

vi.mock('Frontend/hooks/useExamFormStates', () => ({
    useExamFormStates: (...args: any) => mockUseExamFormStates(...args)
}));

vi.mock('Frontend/hooks/usePageMeta', () => ({
    usePageMeta: (...args: any) => mockUsePageMeta(...args)
}));

// Mock react-router
vi.mock('react-router', async (importOriginal) => {
    const actual = await importOriginal() as Record<string, any>;
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

// Mock constants
vi.mock('Frontend/config/constants', () => ({
    ROUTES: {
        LOGIN: '/login',
        HOME: '/home'
    }
}));

// Mock components
vi.mock('Frontend/components/ErrorBoundaries', () => ({
    PageErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// FIXED: More robust mock components with better null safety
vi.mock('Frontend/components/ExamFormComponents', () => ({
    ExamDetailsForm: ({ exam, updateExamField, updateTags, validationErrors }: any) => (
        <div data-testid="exam-details-form">
            <input
                data-testid="exam-title-input"
                value={exam?.title || ''}
                onChange={(e) => updateExamField && updateExamField('title', e.target.value)}
                placeholder="Exam title"
            />
            <input
                data-testid="exam-description-input"
                value={exam?.description || ''}
                onChange={(e) => updateExamField && updateExamField('description', e.target.value)}
                placeholder="Exam description"
            />
            <button onClick={() => updateTags && updateTags(['test-tag'])}>Add Tag</button>
            {validationErrors?.title && <div data-testid="title-error">{validationErrors.title}</div>}
            {validationErrors?.description && <div data-testid="description-error">{validationErrors.description}</div>}
        </div>
    ),
    QuestionBuilderForm: ({
        isEditMode, questionText, setQuestionText, addQuestion, cancelEdit,
        isQuestionValid, options = [], addOption, correctAnswer = [], handleSingleCorrectAnswer,
        isMultipleAnswers, setIsMultipleAnswers, explanation, setExplanation
    }: any) => (
        <div data-testid="question-builder-form">
            <input
                data-testid="question-text-input"
                value={questionText || ''}
                onChange={(e) => {
                    if (setQuestionText) {
                        setQuestionText(e.target.value);
                    }
                }}
                placeholder="Question text"
            />
            <button onClick={() => addOption && addOption()}>Add Option</button>
            <input
                data-testid="explanation-input"
                value={explanation || ''}
                onChange={(e) => setExplanation && setExplanation(e.target.value)}
                placeholder="Explanation (optional)"
            />
            <input
                type="checkbox"
                data-testid="multiple-answers-checkbox"
                checked={isMultipleAnswers || false}
                onChange={(e) => setIsMultipleAnswers && setIsMultipleAnswers(e.target.checked)}
            />
            {options.map((option: string, index: number) => (
                <div key={index} data-testid={`option-${index}`}>
                    <input value={option} readOnly />
                    <button onClick={() => handleSingleCorrectAnswer && handleSingleCorrectAnswer(option)}>
                        {correctAnswer.includes(option) ? 'Correct' : 'Select'}
                    </button>
                </div>
            ))}
            <button
                onClick={() => addQuestion && addQuestion()}
                disabled={!isQuestionValid}
                data-testid="add-question-btn"
            >
                {isEditMode ? 'Update Question' : 'Add Question'}
            </button>
            {isEditMode && (
                <button onClick={() => cancelEdit && cancelEdit()} data-testid="cancel-edit-btn">
                    Cancel Edit
                </button>
            )}
        </div>
    ),
    QuestionsList: ({ exam, startEditQuestion, removeQuestion, editingQuestionIndex }: any) => (
        <div data-testid="questions-list">
            {(exam?.questions || []).map((question: any, index: number) => (
                <div key={index} data-testid={`question-item-${index}`}>
                    <span>{question.questionText}</span>
                    <button
                        onClick={() => startEditQuestion && startEditQuestion(index)}
                        disabled={editingQuestionIndex !== null}
                    >
                        Edit
                    </button>
                    <button onClick={() => removeQuestion && removeQuestion(index)}>Remove</button>
                </div>
            ))}
        </div>
    )
}));

vi.mock('./create.css', () => ({}));

import CreateView from 'Frontend/views/exams/create/@index';

describe('CreateView - Behavioral Testing', () => {
    const createMockExamFormState = (overrides = {}) => ({
        exam: testUtils.data.createMockExam({
            title: '',
            description: '',
            questions: []
        }),
        updateExamField: vi.fn(),
        updateTags: vi.fn(),
        questionText: '',
        setQuestionText: vi.fn(),
        options: ['Option A', 'Option B'],
        addOption: vi.fn(),
        removeOption: vi.fn(),
        updateOption: vi.fn(),
        correctAnswer: ['Option A'],
        handleSingleCorrectAnswer: vi.fn(),
        toggleMultipleCorrectAnswer: vi.fn(),
        isMultipleAnswers: false,
        setIsMultipleAnswers: vi.fn(),
        explanation: '',
        setExplanation: vi.fn(),
        addQuestion: vi.fn(),
        startEditQuestion: vi.fn(),
        removeQuestion: vi.fn(),
        cancelEdit: vi.fn(),
        editingQuestionIndex: null,
        isEditMode: false,
        isQuestionValid: true,
        isExamValid: false,
        validationErrors: {},
        isSubmitting: false,
        submissionStage: 'idle',
        submitMessage: null,
        submitExam: vi.fn(),
        ...overrides
    });

    const createMockFormStatesResult = (overrides = {}) => ({
        loadingComponent: null,
        authComponent: null,
        ...overrides
    });

    beforeEach(() => {
        vi.clearAllMocks();
        setupWindowMocks();

        // Default states
        mockUseAuth.mockReturnValue(testUtils.hooks.createMockAuthHook());
        mockUseExamForm.mockReturnValue(createMockExamFormState());
        mockUseExamFormStates.mockReturnValue(createMockFormStatesResult());
    });

    describe('Authentication and Loading States', () => {
        it('shows loading component when provided by useExamFormStates', () => {
            mockUseExamFormStates.mockReturnValue(
                createMockFormStatesResult({
                    loadingComponent: <div data-testid="loading-state">Loading...</div>
                })
            );

            render(<CreateView />);

            expect(screen.getByTestId('loading-state')).toBeInTheDocument();
            expect(screen.queryByText('Create New Exam')).not.toBeInTheDocument();
        });

        it('shows auth component when provided by useExamFormStates', () => {
            mockUseExamFormStates.mockReturnValue(
                createMockFormStatesResult({
                    authComponent: <div data-testid="auth-required">Please sign in</div>
                })
            );

            render(<CreateView />);

            expect(screen.getByTestId('auth-required')).toBeInTheDocument();
            expect(screen.queryByText('Create New Exam')).not.toBeInTheDocument();
        });

        it('calls useExamFormStates with correct parameters', () => {
            const authState = testUtils.hooks.createMockAuthHook();
            mockUseAuth.mockReturnValue(authState);

            render(<CreateView />);

            expect(mockUseExamFormStates).toHaveBeenCalledWith({
                authInitialized: true,
                loading: false,
                authenticated: true,
                onSignIn: expect.any(Function)
            });
        });

        it('calls useExamForm with correct parameters', () => {
            const authState = testUtils.hooks.createMockAuthHook();
            mockUseAuth.mockReturnValue(authState);

            render(<CreateView />);

            expect(mockUseExamForm).toHaveBeenCalledWith({
                mode: 'create',
                authenticated: true,
                authInitialized: true,
                authLoading: false
            });
        });

        it('calls usePageMeta with correct parameters', () => {
            render(<CreateView />);

            expect(mockUsePageMeta).toHaveBeenCalledWith({
                title: 'Create Exam',
                description: 'Create a new practice exam'
            });
        });

        it('navigates to login when onSignIn is called', () => {
            render(<CreateView />);

            // Get the onSignIn function that was passed to useExamFormStates
            const onSignInCall = mockUseExamFormStates.mock.calls[0][0];
            onSignInCall.onSignIn();

            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
    });

    describe('Header Display Behavior', () => {
        it('displays create exam header', () => {
            render(<CreateView />);

            expect(screen.getByText('Create New Exam')).toBeInTheDocument();
        });

        it('displays user information when user is present', () => {
            const mockUser = testUtils.data.createMockUser({ name: 'John Doe' });
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.authenticated, { user: mockUser })
            );

            render(<CreateView />);

            expect(screen.getByText('Creating as John Doe')).toBeInTheDocument();
        });

        it('does not display user info when user is null', () => {
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.authenticated, { user: null })
            );

            render(<CreateView />);

            expect(screen.queryByText(/Creating as/)).not.toBeInTheDocument();
        });
    });

    describe('Exam Details Form Behavior', () => {
        it('renders exam details form', () => {
            render(<CreateView />);

            expect(screen.getByTestId('exam-details-form')).toBeInTheDocument();
            expect(screen.getByTestId('exam-title-input')).toBeInTheDocument();
            expect(screen.getByTestId('exam-description-input')).toBeInTheDocument();
        });

        it('calls updateExamField when title is changed', () => {
            const mockUpdateExamField = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ updateExamField: mockUpdateExamField })
            );

            render(<CreateView />);

            const titleInput = screen.getByTestId('exam-title-input');
            fireEvent.change(titleInput, { target: { value: 'New Exam Title' } });

            expect(mockUpdateExamField).toHaveBeenCalledWith('title', 'New Exam Title');
        });

        it('calls updateExamField when description is changed', () => {
            const mockUpdateExamField = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ updateExamField: mockUpdateExamField })
            );

            render(<CreateView />);

            const descriptionInput = screen.getByTestId('exam-description-input');
            fireEvent.change(descriptionInput, { target: { value: 'New exam description' } });

            expect(mockUpdateExamField).toHaveBeenCalledWith('description', 'New exam description');
        });

        it('calls updateTags when tag is added', () => {
            const mockUpdateTags = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ updateTags: mockUpdateTags })
            );

            render(<CreateView />);

            fireEvent.click(screen.getByText('Add Tag'));

            expect(mockUpdateTags).toHaveBeenCalledWith(['test-tag']);
        });

        it('displays validation errors for exam fields', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    validationErrors: {
                        title: 'Title is required',
                        description: 'Description is required'
                    }
                })
            );

            render(<CreateView />);

            expect(screen.getByTestId('title-error')).toHaveTextContent('Title is required');
            expect(screen.getByTestId('description-error')).toHaveTextContent('Description is required');
        });
    });

    describe('Question Builder Form Behavior', () => {
        it('renders question builder form', () => {
            render(<CreateView />);

            expect(screen.getByTestId('question-builder-form')).toBeInTheDocument();
            expect(screen.getByTestId('question-text-input')).toBeInTheDocument();
            expect(screen.getByTestId('explanation-input')).toBeInTheDocument();
        });

        it('calls setQuestionText when question text is changed', () => {
            const mockSetQuestionText = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ setQuestionText: mockSetQuestionText })
            );

            render(<CreateView />);

            const questionInput = screen.getByTestId('question-text-input');
            fireEvent.change(questionInput, { target: { value: 'What is 2 + 2?' } });

            expect(mockSetQuestionText).toHaveBeenCalledWith('What is 2 + 2?');
        });

        it('calls setExplanation when explanation is changed', () => {
            const mockSetExplanation = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ setExplanation: mockSetExplanation })
            );

            render(<CreateView />);

            const explanationInput = screen.getByTestId('explanation-input');
            fireEvent.change(explanationInput, { target: { value: 'Basic addition' } });

            expect(mockSetExplanation).toHaveBeenCalledWith('Basic addition');
        });

        it('calls setIsMultipleAnswers when checkbox is toggled', () => {
            const mockSetIsMultipleAnswers = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ setIsMultipleAnswers: mockSetIsMultipleAnswers })
            );

            render(<CreateView />);

            const checkbox = screen.getByTestId('multiple-answers-checkbox');
            fireEvent.click(checkbox);

            expect(mockSetIsMultipleAnswers).toHaveBeenCalledWith(true);
        });

        it('calls addOption when Add Option button is clicked', () => {
            const mockAddOption = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ addOption: mockAddOption })
            );

            render(<CreateView />);

            fireEvent.click(screen.getByText('Add Option'));

            expect(mockAddOption).toHaveBeenCalled();
        });

        it('displays question options with correct states', () => {
            render(<CreateView />);

            expect(screen.getByTestId('option-0')).toBeInTheDocument();
            expect(screen.getByTestId('option-1')).toBeInTheDocument();
            expect(screen.getByText('Correct')).toBeInTheDocument(); // Option A is marked correct
            expect(screen.getByText('Select')).toBeInTheDocument(); // Option B is not selected
        });

        it('calls handleSingleCorrectAnswer when option is selected', () => {
            const mockHandleSingleCorrectAnswer = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ handleSingleCorrectAnswer: mockHandleSingleCorrectAnswer })
            );

            render(<CreateView />);

            fireEvent.click(screen.getByText('Select'));

            expect(mockHandleSingleCorrectAnswer).toHaveBeenCalledWith('Option B');
        });

        it('calls addQuestion when Add Question button is clicked', () => {
            const mockAddQuestion = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ addQuestion: mockAddQuestion })
            );

            render(<CreateView />);

            fireEvent.click(screen.getByTestId('add-question-btn'));

            expect(mockAddQuestion).toHaveBeenCalled();
        });

        it('disables Add Question button when question is invalid', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ isQuestionValid: false })
            );

            render(<CreateView />);

            expect(screen.getByTestId('add-question-btn')).toBeDisabled();
        });

        it('shows Update Question text when in edit mode', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    isEditMode: true,
                    editingQuestionIndex: 0
                })
            );

            render(<CreateView />);

            expect(screen.getByText('Update Question')).toBeInTheDocument();
        });

        it('shows Cancel Edit button when in edit mode', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    isEditMode: true,
                    editingQuestionIndex: 0
                })
            );

            render(<CreateView />);

            expect(screen.getByTestId('cancel-edit-btn')).toBeInTheDocument();
        });

        it('calls cancelEdit when Cancel Edit button is clicked', () => {
            const mockCancelEdit = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    isEditMode: true,
                    editingQuestionIndex: 0,
                    cancelEdit: mockCancelEdit
                })
            );

            render(<CreateView />);

            fireEvent.click(screen.getByTestId('cancel-edit-btn'));

            expect(mockCancelEdit).toHaveBeenCalled();
        });
    });

    describe('Questions List Behavior', () => {
        it('renders questions list when exam has questions', () => {
            const mockExam = testUtils.data.createMockExam({
                questions: [
                    { id: 'q1', questionText: 'Question 1', options: [], correctAnswer: [], isMultipleAnswers: false },
                    { id: 'q2', questionText: 'Question 2', options: [], correctAnswer: [], isMultipleAnswers: false }
                ]
            });

            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ exam: mockExam })
            );

            render(<CreateView />);

            expect(screen.getByTestId('questions-list')).toBeInTheDocument();
            expect(screen.getByTestId('question-item-0')).toBeInTheDocument();
            expect(screen.getByTestId('question-item-1')).toBeInTheDocument();
            expect(screen.getByText('Question 1')).toBeInTheDocument();
            expect(screen.getByText('Question 2')).toBeInTheDocument();
        });

        it('calls startEditQuestion when Edit button is clicked', () => {
            const mockStartEditQuestion = vi.fn();
            const mockExam = testUtils.data.createMockExam({
                questions: [
                    { id: 'q1', questionText: 'Question 1', options: [], correctAnswer: [], isMultipleAnswers: false }
                ]
            });

            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    exam: mockExam,
                    startEditQuestion: mockStartEditQuestion
                })
            );

            render(<CreateView />);

            fireEvent.click(screen.getByText('Edit'));

            expect(mockStartEditQuestion).toHaveBeenCalledWith(0);
        });

        it('calls removeQuestion when Remove button is clicked', () => {
            const mockRemoveQuestion = vi.fn();
            const mockExam = testUtils.data.createMockExam({
                questions: [
                    { id: 'q1', questionText: 'Question 1', options: [], correctAnswer: [], isMultipleAnswers: false }
                ]
            });

            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    exam: mockExam,
                    removeQuestion: mockRemoveQuestion
                })
            );

            render(<CreateView />);

            fireEvent.click(screen.getByText('Remove'));

            expect(mockRemoveQuestion).toHaveBeenCalledWith(0);
        });

        it('disables Edit button when editing another question', () => {
            const mockExam = testUtils.data.createMockExam({
                questions: [
                    { id: 'q1', questionText: 'Question 1', options: [], correctAnswer: [], isMultipleAnswers: false },
                    { id: 'q2', questionText: 'Question 2', options: [], correctAnswer: [], isMultipleAnswers: false }
                ]
            });

            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    exam: mockExam,
                    editingQuestionIndex: 0
                })
            );

            render(<CreateView />);

            const editButtons = screen.getAllByText('Edit');
            expect(editButtons[1]).toBeDisabled(); // Second Edit button should be disabled
        });
    });

    describe('Submit Section Behavior', () => {
        it('renders submit section with Create Exam button', () => {
            render(<CreateView />);

            expect(screen.getByText('Create Exam')).toBeInTheDocument();
        });

        it('calls submitExam when Create Exam button is clicked', () => {
            const mockSubmitExam = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    submitExam: mockSubmitExam,
                    isExamValid: true
                })
            );

            render(<CreateView />);

            fireEvent.click(screen.getByText('Create Exam'));

            expect(mockSubmitExam).toHaveBeenCalled();
        });

        it('disables submit button when exam is invalid', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ isExamValid: false })
            );

            render(<CreateView />);

            expect(screen.getByText('Create Exam')).toBeDisabled();
        });

        it('disables submit button when in edit mode', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    isExamValid: true,
                    isEditMode: true
                })
            );

            render(<CreateView />);

            expect(screen.getByText('Create Exam')).toBeDisabled();
        });

        it('disables submit button when not in idle state', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    isExamValid: true,
                    submissionStage: 'saving'
                })
            );

            render(<CreateView />);

            expect(screen.getByText('Creating Exam...')).toBeInTheDocument();
            expect(screen.getByText('Creating Exam...')).toBeDisabled();
        });

        it('shows different button states based on submission stage', () => {
            // Test saving state
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ submissionStage: 'saving' })
            );

            const { rerender } = render(<CreateView />);
            expect(screen.getByText('Creating Exam...')).toBeInTheDocument();

            // Test success state
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ submissionStage: 'success' })
            );
            rerender(<CreateView />);
            expect(screen.getByText('Exam Created!')).toBeInTheDocument();

            // Test navigating state
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ submissionStage: 'navigating' })
            );
            rerender(<CreateView />);
            expect(screen.getByText('Opening Exam...')).toBeInTheDocument();
        });

        it('displays submit message when present', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    submitMessage: { type: 'success', text: 'Exam created successfully!' }
                })
            );

            render(<CreateView />);

            expect(screen.getByText('Exam created successfully!')).toBeInTheDocument();
        });

        it('displays validation error when present', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    validationErrors: { general: 'Please fix all validation errors' }
                })
            );

            render(<CreateView />);

            expect(screen.getByText('Please fix all validation errors')).toBeInTheDocument();
        });

        it('shows appropriate disabled reason text based on state', () => {
            // Test edit mode
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    isExamValid: false,
                    isEditMode: true
                })
            );

            const { rerender } = render(<CreateView />);
            expect(screen.getByText('Complete or cancel the current edit before submitting')).toBeInTheDocument();

            // Test no questions
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    isExamValid: false,
                    isEditMode: false,
                    exam: testUtils.data.createMockExam({ questions: [] })
                })
            );
            rerender(<CreateView />);
            expect(screen.getByText('Add at least one question to create the exam')).toBeInTheDocument();

            // Test title validation
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    isExamValid: false,
                    isEditMode: false,
                    exam: testUtils.data.createMockExam({ questions: [{}] }),
                    validationErrors: { title: 'Title required' }
                })
            );
            rerender(<CreateView />);
            expect(screen.getByText('Fix exam title to continue')).toBeInTheDocument();

            // Test description validation
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    isExamValid: false,
                    isEditMode: false,
                    exam: testUtils.data.createMockExam({ questions: [{}] }),
                    validationErrors: { description: 'Description required' }
                })
            );
            rerender(<CreateView />);
            expect(screen.getByText('Fix exam description to continue')).toBeInTheDocument();

            // Test general case
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    isExamValid: false,
                    isEditMode: false,
                    exam: testUtils.data.createMockExam({ questions: [{}] }),
                    validationErrors: {}
                })
            );
            rerender(<CreateView />);
            expect(screen.getByText('Complete all required fields to create exam')).toBeInTheDocument();
        });
    });

    describe('Form Validation Behavior', () => {
        it('enables submit when exam is valid', () => {
            const mockExam = testUtils.data.createMockExam({
                title: 'Valid Title',
                description: 'Valid Description',
                questions: [testUtils.data.createMockQuestion()]
            });

            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    exam: mockExam,
                    isExamValid: true,
                    submissionStage: 'idle'
                })
            );

            render(<CreateView />);

            const submitButton = screen.getByText('Create Exam');
            expect(submitButton).not.toBeDisabled();
            expect(submitButton).toHaveClass('enabled');
        });

        it('disables submit when exam is invalid', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    isExamValid: false
                })
            );

            render(<CreateView />);

            const submitButton = screen.getByText('Create Exam');
            expect(submitButton).toBeDisabled();
            expect(submitButton).toHaveClass('disabled');
        });

        it('shows spinner during submission', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    submissionStage: 'saving'
                })
            );

            render(<CreateView />);

            // Check for spinner class
            const spinnerElement = document.querySelector('.spinner');
            expect(spinnerElement).toBeInTheDocument();
        });
    });

    describe('Integration and Workflow Behavior', () => {
        // FIXED: More robust integration test
        it('supports complete exam creation workflow', () => {
            const mockUpdateExamField = vi.fn();
            const mockSetQuestionText = vi.fn();
            const mockAddQuestion = vi.fn();
            const mockSubmitExam = vi.fn();

            const mockExam = testUtils.data.createMockExam({
                title: 'Math Exam',
                description: 'Basic math questions',
                questions: []
            });

            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    exam: mockExam,
                    updateExamField: mockUpdateExamField,
                    setQuestionText: mockSetQuestionText,
                    addQuestion: mockAddQuestion,
                    submitExam: mockSubmitExam,
                    questionText: '', // Start with empty text
                    isQuestionValid: true,
                    isExamValid: false
                })
            );

            render(<CreateView />);

            // Step 1: Update exam title
            fireEvent.change(screen.getByTestId('exam-title-input'), {
                target: { value: 'Updated Math Exam' }
            });
            expect(mockUpdateExamField).toHaveBeenCalledWith('title', 'Updated Math Exam');

            // Step 2: Add question text
            const questionInput = screen.getByTestId('question-text-input');
            fireEvent.change(questionInput, {
                target: { value: 'What is 2+2?' }
            });
            
            // The mock function should have been called
            expect(mockSetQuestionText).toHaveBeenCalledWith('What is 2+2?');

            // Step 3: Add question
            fireEvent.click(screen.getByTestId('add-question-btn'));
            expect(mockAddQuestion).toHaveBeenCalled();
        });

        it('handles question editing workflow', () => {
            const mockStartEditQuestion = vi.fn();
            const mockCancelEdit = vi.fn();

            const mockExam = testUtils.data.createMockExam({
                questions: [
                    testUtils.data.createMockQuestion({ questionText: 'Original question' })
                ]
            });

            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    exam: mockExam,
                    startEditQuestion: mockStartEditQuestion,
                    cancelEdit: mockCancelEdit,
                    isEditMode: false
                })
            );

            const { rerender } = render(<CreateView />);

            // Start editing
            fireEvent.click(screen.getByText('Edit'));
            expect(mockStartEditQuestion).toHaveBeenCalledWith(0);

            // Simulate edit mode
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    exam: mockExam,
                    startEditQuestion: mockStartEditQuestion,
                    cancelEdit: mockCancelEdit,
                    isEditMode: true,
                    editingQuestionIndex: 0
                })
            );

            rerender(<CreateView />);

            // Cancel editing
            fireEvent.click(screen.getByTestId('cancel-edit-btn'));
            expect(mockCancelEdit).toHaveBeenCalled();
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('handles missing user gracefully', () => {
            mockUseAuth.mockReturnValue(
                testUtils.hooks.createMockAuthHook(mockAuthStates.authenticated, { user: null })
            );

            expect(() => render(<CreateView />)).not.toThrow();
        });

        // FIXED: Better null safety test
        it('handles empty exam data gracefully', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ 
                    exam: null,
                    validationErrors: {} // Provide empty object instead of null
                })
            );

            expect(() => render(<CreateView />)).not.toThrow();
            
            // Should still render the main structure
            expect(screen.getByText('Create New Exam')).toBeInTheDocument();
        });

        it('handles hook failures gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            mockUseExamForm.mockImplementation(() => {
                throw new Error('Form hook failed');
            });

            expect(() => render(<CreateView />)).toThrow('Form hook failed');

            consoleSpy.mockRestore();
        });

        // FIXED: Better validation errors test
        it('handles malformed validation errors gracefully', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    validationErrors: null,
                    exam: testUtils.data.createMockExam() // Provide valid exam
                })
            );

            expect(() => render(<CreateView />)).not.toThrow();
            
            // Should still render without crashing
            expect(screen.getByText('Create New Exam')).toBeInTheDocument();
        });

        it('handles undefined submission stage gracefully', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    submissionStage: undefined
                })
            );

            expect(() => render(<CreateView />)).not.toThrow();
        });
    });

    describe('Accessibility and UX Behavior', () => {
        it('maintains proper form structure', () => {
            render(<CreateView />);

            expect(screen.getByTestId('exam-details-form')).toBeInTheDocument();
            expect(screen.getByTestId('question-builder-form')).toBeInTheDocument();
            expect(screen.getByTestId('questions-list')).toBeInTheDocument();
        });

        it('provides clear feedback during submission', () => {
            const stages = ['saving', 'success', 'navigating'];
            const expectedTexts = ['Creating Exam...', 'Exam Created!', 'Opening Exam...'];

            stages.forEach((stage, index) => {
                mockUseExamForm.mockReturnValue(
                    createMockExamFormState({ submissionStage: stage })
                );

                const { unmount } = render(<CreateView />);
                expect(screen.getByText(expectedTexts[index])).toBeInTheDocument();
                unmount();
            });
        });

        it('provides helpful validation messages', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    isExamValid: false,
                    exam: testUtils.data.createMockExam({ questions: [] })
                })
            );

            render(<CreateView />);

            expect(screen.getByText('Add at least one question to create the exam')).toBeInTheDocument();
        });

        it('disables form elements appropriately during submission', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    submissionStage: 'saving',
                    isExamValid: true
                })
            );

            render(<CreateView />);

            expect(screen.getByText('Creating Exam...')).toBeDisabled();
        });
    });
});