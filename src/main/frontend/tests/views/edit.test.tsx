import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import {
    render,
    testUtils,
    setupWindowMocks
} from '../test-utils';

// Mock hooks
const mockUseAuth = vi.fn();
const mockUseExamForm = vi.fn();
const mockUseEditPageStates = vi.fn();
const mockUsePageMeta = vi.fn();

vi.mock('Frontend/hooks/useAuth', () => ({
    useAuth: (...args: any) => mockUseAuth(...args)
}));

vi.mock('Frontend/hooks/useExamForm', () => ({
    useExamForm: (...args: any) => mockUseExamForm(...args)
}));

vi.mock('Frontend/hooks/useEditPageStates', () => ({
    useEditPageStates: (...args: any) => mockUseEditPageStates(...args)
}));

vi.mock('Frontend/hooks/usePageMeta', () => ({
    usePageMeta: (...args: any) => mockUsePageMeta(...args)
}));

// Mock react-router
vi.mock('react-router', async (importOriginal) => {
    const actual = await importOriginal() as Record<string, any>;
    return {
        ...actual,
        useParams: () => ({ examId: 'test-exam-123' })
    };
});

// FIXED: Mock Vaadin components that don't work well in test environment
vi.mock('@vaadin/react-components', async (importOriginal) => {
    const actual = await importOriginal() as Record<string, any>;
    return {
        ...actual,
        Dialog: ({ opened, headerTitle, children, onOpenedChanged }: any) => {
            // Only render dialog content when opened is true
            if (!opened) return null;
            
            return (
                <div data-testid="dialog" className="dialog-mock">
                    <div className="dialog-header">
                        <h3>{headerTitle}</h3>
                    </div>
                    <div className="dialog-content">
                        {children}
                    </div>
                </div>
            );
        },
        Button: ({ children, onClick, theme, ...props }: any) => (
            <button 
                onClick={onClick} 
                className={theme ? `btn-${theme.replace(' ', '-')}` : 'btn'} 
                {...props}
            >
                {children}
            </button>
        ),
        Icon: ({ icon }: any) => <span data-icon={icon} className="mock-icon" />
    };
});

// Mock components
vi.mock('Frontend/components/ErrorBoundaries', () => ({
    PageErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('Frontend/components/ExamFormComponents', () => ({
    ExamDetailsForm: ({ exam, updateExamField, updateTags, validationErrors }: any) => (
        <div data-testid="exam-details-form">
            <input
                data-testid="exam-title-input"
                value={exam?.title || ''}
                onChange={(e) => updateExamField('title', e.target.value)}
                placeholder="Exam title"
            />
            <input
                data-testid="exam-description-input"
                value={exam?.description || ''}
                onChange={(e) => updateExamField('description', e.target.value)}
                placeholder="Exam description"
            />
            <button onClick={() => updateTags(['test-tag'])}>Add Tag</button>
            {validationErrors?.title && <div data-testid="title-error">{validationErrors.title}</div>}
        </div>
    ),
    QuestionBuilderForm: ({
        isEditMode, questionText, setQuestionText, addQuestion, cancelEdit,
        isQuestionValid, options, addOption, correctAnswer, handleSingleCorrectAnswer
    }: any) => (
        <div data-testid="question-builder-form">
            <input
                data-testid="question-text-input"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Question text"
            />
            <button onClick={addOption}>Add Option</button>
            {options.map((option: string, index: number) => (
                <div key={index} data-testid={`option-${index}`}>
                    <input value={option} readOnly />
                    <button onClick={() => handleSingleCorrectAnswer(option)}>
                        {correctAnswer.includes(option) ? 'Correct' : 'Select'}
                    </button>
                </div>
            ))}
            <button
                onClick={addQuestion}
                disabled={!isQuestionValid}
                data-testid="add-question-btn"
            >
                {isEditMode ? 'Update Question' : 'Add Question'}
            </button>
            {isEditMode && (
                <button onClick={cancelEdit} data-testid="cancel-edit-btn">
                    Cancel Edit
                </button>
            )}
        </div>
    ),
    QuestionsList: ({ exam, startEditQuestion, removeQuestion, editingQuestionIndex }: any) => (
        <div data-testid="questions-list">
            {exam?.questions?.map((question: any, index: number) => (
                <div key={index} data-testid={`question-item-${index}`}>
                    <span>{question.questionText}</span>
                    <button
                        onClick={() => startEditQuestion(index)}
                        disabled={editingQuestionIndex !== null}
                    >
                        Edit
                    </button>
                    <button onClick={() => removeQuestion(index)}>Remove</button>
                </div>
            ))}
        </div>
    )
}));

vi.mock('./edit.css', () => ({}));

import EditView from 'Frontend/views/exams/{examId}/edit/@index';

describe('EditView - Behavioral Testing', () => {
    const createMockExamFormState = (overrides = {}) => ({
        exam: testUtils.data.createMockExam(),
        hasUnsavedChanges: false,
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
        isExamValid: true,
        validationErrors: {},
        isSubmitting: false,
        submitMessage: null,
        submitExam: vi.fn(),
        cancelAllChanges: vi.fn(),
        goBack: vi.fn(),
        isDialogOpen: false,
        handleConfirmLeave: vi.fn(),
        handleCancelLeave: vi.fn(),
        ...overrides
    });

    beforeEach(() => {
        vi.clearAllMocks();
        setupWindowMocks();

        // Default auth state
        mockUseAuth.mockReturnValue(testUtils.hooks.createMockAuthHook());

        // Default form state
        mockUseExamForm.mockReturnValue(createMockExamFormState());

        // Default page states
        mockUseEditPageStates.mockReturnValue({
            loadingComponent: null,
            errorComponent: null
        });
    });

    describe('Authentication and Loading States', () => {
        it('shows loading component when provided by useEditPageStates', () => {
            mockUseEditPageStates.mockReturnValue({
                loadingComponent: <div data-testid="loading-state">Loading exam...</div>,
                errorComponent: null
            });

            render(<EditView />);

            expect(screen.getByTestId('loading-state')).toBeInTheDocument();
            expect(screen.queryByText('Edit Exam')).not.toBeInTheDocument();
        });

        it('shows error component when provided by useEditPageStates', () => {
            mockUseEditPageStates.mockReturnValue({
                loadingComponent: null,
                errorComponent: <div data-testid="error-state">Error loading exam</div>
            });

            render(<EditView />);

            expect(screen.getByTestId('error-state')).toBeInTheDocument();
            expect(screen.queryByText('Edit Exam')).not.toBeInTheDocument();
        });

        it('calls useExamForm with correct parameters', () => {
            const authState = testUtils.hooks.createMockAuthHook();
            mockUseAuth.mockReturnValue(authState);

            render(<EditView />);

            expect(mockUseExamForm).toHaveBeenCalledWith({
                mode: 'edit',
                examId: 'test-exam-123',
                authenticated: true,
                authInitialized: true,
                authLoading: false
            });
        });

        it('calls usePageMeta with correct parameters', () => {
            render(<EditView />);

            expect(mockUsePageMeta).toHaveBeenCalledWith({
                title: 'Edit Exam',
                description: 'Edit your exam details and questions'
            });
        });
    });

    describe('Page Header Behavior', () => {
        it('renders page header with back button', () => {
            render(<EditView />);

            expect(screen.getByText('Edit Exam')).toBeInTheDocument();
            expect(screen.getByText('Back to Exam')).toBeInTheDocument();
        });

        it('shows unsaved changes indicator when hasUnsavedChanges is true', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ hasUnsavedChanges: true })
            );

            render(<EditView />);

            expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
        });

        it('does not show unsaved changes indicator when hasUnsavedChanges is false', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ hasUnsavedChanges: false })
            );

            render(<EditView />);

            expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
        });

        it('calls goBack when back button is clicked', () => {
            const mockGoBack = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ goBack: mockGoBack })
            );

            render(<EditView />);

            fireEvent.click(screen.getByText('Back to Exam'));

            expect(mockGoBack).toHaveBeenCalled();
        });
    });

    describe('Exam Details Form Behavior', () => {
        it('renders exam details form with current exam data', () => {
            const mockExam = testUtils.data.createMockExam({
                title: 'Test Exam Title',
                description: 'Test exam description'
            });

            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ exam: mockExam })
            );

            render(<EditView />);

            expect(screen.getByTestId('exam-details-form')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Test Exam Title')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Test exam description')).toBeInTheDocument();
        });

        it('calls updateExamField when exam title is changed', () => {
            const mockUpdateExamField = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ updateExamField: mockUpdateExamField })
            );

            render(<EditView />);

            const titleInput = screen.getByTestId('exam-title-input');
            fireEvent.change(titleInput, { target: { value: 'New Title' } });

            expect(mockUpdateExamField).toHaveBeenCalledWith('title', 'New Title');
        });

        it('calls updateTags when tag is added', () => {
            const mockUpdateTags = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ updateTags: mockUpdateTags })
            );

            render(<EditView />);

            fireEvent.click(screen.getByText('Add Tag'));

            expect(mockUpdateTags).toHaveBeenCalledWith(['test-tag']);
        });

        it('displays validation errors for exam fields', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    validationErrors: { title: 'Title is required' }
                })
            );

            render(<EditView />);

            expect(screen.getByTestId('title-error')).toHaveTextContent('Title is required');
        });
    });

    describe('Question Builder Form Behavior', () => {
        it('renders question builder form', () => {
            render(<EditView />);

            expect(screen.getByTestId('question-builder-form')).toBeInTheDocument();
            expect(screen.getByTestId('question-text-input')).toBeInTheDocument();
            expect(screen.getByText('Add Option')).toBeInTheDocument();
        });

        it('calls setQuestionText when question text is changed', () => {
            const mockSetQuestionText = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ setQuestionText: mockSetQuestionText })
            );

            render(<EditView />);

            const questionInput = screen.getByTestId('question-text-input');
            fireEvent.change(questionInput, { target: { value: 'New question?' } });

            expect(mockSetQuestionText).toHaveBeenCalledWith('New question?');
        });

        it('calls addOption when Add Option button is clicked', () => {
            const mockAddOption = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ addOption: mockAddOption })
            );

            render(<EditView />);

            fireEvent.click(screen.getByText('Add Option'));

            expect(mockAddOption).toHaveBeenCalled();
        });

        it('calls handleSingleCorrectAnswer when option is selected as correct', () => {
            const mockHandleSingleCorrectAnswer = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ handleSingleCorrectAnswer: mockHandleSingleCorrectAnswer })
            );

            render(<EditView />);

            fireEvent.click(screen.getByText('Select'));

            expect(mockHandleSingleCorrectAnswer).toHaveBeenCalledWith('Option B');
        });

        it('calls addQuestion when Add Question button is clicked', () => {
            const mockAddQuestion = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ addQuestion: mockAddQuestion })
            );

            render(<EditView />);

            fireEvent.click(screen.getByTestId('add-question-btn'));

            expect(mockAddQuestion).toHaveBeenCalled();
        });

        it('disables Add Question button when question is invalid', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ isQuestionValid: false })
            );

            render(<EditView />);

            expect(screen.getByTestId('add-question-btn')).toBeDisabled();
        });

        it('shows Update Question text when in edit mode', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    isEditMode: true,
                    editingQuestionIndex: 0
                })
            );

            render(<EditView />);

            expect(screen.getByText('Update Question')).toBeInTheDocument();
        });

        it('shows Cancel Edit button when in edit mode', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    isEditMode: true,
                    editingQuestionIndex: 0
                })
            );

            render(<EditView />);

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

            render(<EditView />);

            fireEvent.click(screen.getByTestId('cancel-edit-btn'));

            expect(mockCancelEdit).toHaveBeenCalled();
        });
    });

    describe('Questions List Behavior', () => {
        it('renders questions list with exam questions', () => {
            const mockExam = testUtils.data.createMockExam({
                questions: [
                    { id: 'q1', questionText: 'Question 1', options: [], correctAnswer: [], isMultipleAnswers: false },
                    { id: 'q2', questionText: 'Question 2', options: [], correctAnswer: [], isMultipleAnswers: false }
                ]
            });

            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ exam: mockExam })
            );

            render(<EditView />);

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

            render(<EditView />);

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

            render(<EditView />);

            fireEvent.click(screen.getByText('Remove'));

            expect(mockRemoveQuestion).toHaveBeenCalledWith(0);
        });
    });

    describe('Submit Section Behavior', () => {
        it('renders submit section with save button', () => {
            render(<EditView />);

            expect(screen.getByText('Save Changes')).toBeInTheDocument();
        });

        it('calls submitExam when Save Changes button is clicked', () => {
            const mockSubmitExam = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    submitExam: mockSubmitExam,
                    hasUnsavedChanges: true
                })
            );

            render(<EditView />);

            fireEvent.click(screen.getByText('Save Changes'));

            expect(mockSubmitExam).toHaveBeenCalled();
        });

        it('disables submit button when exam is invalid', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    isExamValid: false,
                    hasUnsavedChanges: true
                })
            );

            render(<EditView />);

            expect(screen.getByText('Save Changes')).toBeDisabled();
        });

        it('disables submit button when in edit mode', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    isEditMode: true,
                    hasUnsavedChanges: true
                })
            );

            render(<EditView />);

            expect(screen.getByText('Save Changes')).toBeDisabled();
        });

        it('disables submit button when no unsaved changes', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ hasUnsavedChanges: false })
            );

            render(<EditView />);

            expect(screen.getByText('Save Changes')).toBeDisabled();
        });

        it('shows saving state when submitting', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    isSubmitting: true,
                    hasUnsavedChanges: true
                })
            );

            render(<EditView />);

            expect(screen.getByText('Saving Changes...')).toBeInTheDocument();
        });

        it('shows Revert All Changes button when hasUnsavedChanges is true', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ hasUnsavedChanges: true })
            );

            render(<EditView />);

            expect(screen.getByText('Revert All Changes')).toBeInTheDocument();
        });

        it('calls cancelAllChanges when Revert All Changes button is clicked', () => {
            const mockCancelAllChanges = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    hasUnsavedChanges: true,
                    cancelAllChanges: mockCancelAllChanges
                })
            );

            render(<EditView />);

            fireEvent.click(screen.getByText('Revert All Changes'));

            expect(mockCancelAllChanges).toHaveBeenCalled();
        });

        it('displays submit message when present', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    submitMessage: { type: 'success', text: 'Changes saved successfully!' }
                })
            );

            render(<EditView />);

            expect(screen.getByText('Changes saved successfully!')).toBeInTheDocument();
        });

        it('displays validation error when present', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    validationErrors: { general: 'Please fix all validation errors' }
                })
            );

            render(<EditView />);

            expect(screen.getByText('Please fix all validation errors')).toBeInTheDocument();
        });

        it('shows appropriate disabled reason text', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    isExamValid: false,
                    isEditMode: true
                })
            );

            render(<EditView />);

            expect(screen.getByText('Complete or cancel the current edit before saving')).toBeInTheDocument();
        });

        it('shows no changes info when no unsaved changes', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    hasUnsavedChanges: false,
                    isEditMode: false
                })
            );

            render(<EditView />);

            expect(screen.getByText('No unsaved changes')).toBeInTheDocument();
        });
    });

    // FIXED: Updated dialog tests with proper mocks
    describe('Unsaved Changes Dialog Behavior', () => {
        it('does not show dialog when isDialogOpen is false', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ isDialogOpen: false })
            );

            render(<EditView />);

            expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
            expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
        });

        it('shows dialog when isDialogOpen is true', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({ isDialogOpen: true })
            );

            render(<EditView />);

            expect(screen.getByTestId('dialog')).toBeInTheDocument();
            expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
            expect(screen.getByText('You have unsaved changes. Are you sure you want to leave?')).toBeInTheDocument();
        });

        it('calls handleCancelLeave when Cancel button is clicked', () => {
            const mockHandleCancelLeave = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    isDialogOpen: true,
                    handleCancelLeave: mockHandleCancelLeave
                })
            );

            render(<EditView />);

            fireEvent.click(screen.getByText('Cancel'));

            expect(mockHandleCancelLeave).toHaveBeenCalled();
        });

        it('calls handleConfirmLeave when Leave button is clicked', () => {
            const mockHandleConfirmLeave = vi.fn();
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    isDialogOpen: true,
                    handleConfirmLeave: mockHandleConfirmLeave
                })
            );

            render(<EditView />);

            fireEvent.click(screen.getByText('Leave'));

            expect(mockHandleConfirmLeave).toHaveBeenCalled();
        });
    });

    describe('Error Handling Behavior', () => {
        it('handles missing examId gracefully', () => {
            // Mock useParams to return undefined examId
            vi.doMock('react-router', async (importOriginal) => {
                const actual = await importOriginal() as Record<string, any>;
                return {
                    ...actual,
                    useParams: () => ({ examId: undefined })
                };
            });

            expect(() => render(<EditView />)).not.toThrow();
        });

        it('handles examForm hook failures gracefully', () => {
            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    exam: null,
                    validationErrors: { general: 'Failed to load exam' }
                })
            );

            expect(() => render(<EditView />)).not.toThrow();
            expect(screen.getByText('Failed to load exam')).toBeInTheDocument();
        });
    });

    describe('Integration Behavior', () => {
        it('properly coordinates between form components', async () => {
            const mockAddQuestion = vi.fn();
            const mockStartEditQuestion = vi.fn();

            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    addQuestion: mockAddQuestion,
                    startEditQuestion: mockStartEditQuestion,
                    questionText: 'New question text',
                    isQuestionValid: true
                })
            );

            render(<EditView />);

            // Add a question
            fireEvent.click(screen.getByTestId('add-question-btn'));
            expect(mockAddQuestion).toHaveBeenCalled();

            // Then try to edit it
            fireEvent.click(screen.getByText('Edit'));
            expect(mockStartEditQuestion).toHaveBeenCalled();
        });

        it('maintains form state consistency across interactions', () => {
            const mockExam = testUtils.data.createMockExam();
            const mockUpdateExamField = vi.fn();

            mockUseExamForm.mockReturnValue(
                createMockExamFormState({
                    exam: mockExam,
                    updateExamField: mockUpdateExamField,
                    hasUnsavedChanges: true
                })
            );

            render(<EditView />);

            // Update exam field
            fireEvent.change(screen.getByTestId('exam-title-input'), {
                target: { value: 'Updated Title' }
            });

            expect(mockUpdateExamField).toHaveBeenCalledWith('title', 'Updated Title');
            expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
        });
    });
});