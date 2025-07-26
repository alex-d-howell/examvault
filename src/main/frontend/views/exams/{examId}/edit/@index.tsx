import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import type Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';
import { ExamService } from 'Frontend/generated/endpoints';
import { Button, Dialog, Icon } from "@vaadin/react-components";
import { useAuth } from 'Frontend/hooks/useAuth.js';
import './edit.css';
import { TagInput } from 'Frontend/components/tagComponents/tagsComponents';

interface SubmitMessage {
    type: 'success' | 'error' | 'info';
    text: string;
}

export default function EditView() {
    const { examId } = useParams<{ examId: string }>();
    const { authenticated, authInitialized, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Combine loading states to reduce layout shifts
    const [loadingState, setLoadingState] = useState<{
        isLoading: boolean;
        checkingAuth: boolean;
        checkingPermissions: boolean;
        error: string | null;
    }>({
        isLoading: true,
        checkingAuth: true,
        checkingPermissions: false,
        error: null
    });

    // Initialize exam with proper Exam model structure
    const [exam, setExam] = useState<Exam>({
        title: '',
        description: '',
        questions: [],
        tags: []
    });

    const [originalExam, setOriginalExam] = useState<Exam | null>(null);
    const [canEdit, setCanEdit] = useState<boolean>(false);

    const [questionText, setQuestionText] = useState<string>('');
    const [options, setOptions] = useState<string[]>(['', '']); // Start with at least 2 options
    const [correctAnswer, setCorrectAnswer] = useState<string[]>([]); // Now always an array
    const [isMultipleAnswers, setIsMultipleAnswers] = useState<boolean>(false);
    const [explanation, setExplanation] = useState<string>(''); // New explanation field
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [submitMessage, setSubmitMessage] = useState<SubmitMessage | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    // Editing states
    const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);

    // Memoize expensive computations
    const hasUnsavedChanges = useMemo(() => {
        if (!originalExam || !exam) return false;
        return JSON.stringify(originalExam) !== JSON.stringify(exam);
    }, [originalExam, exam]);

    // Memoize selectedTags to prevent unnecessary re-renders of TagInput
    const selectedTags = useMemo(() => {
        return (exam.tags || []).filter((tag): tag is string => tag != null && tag !== undefined);
    }, [exam.tags]);

    // Memoized callback for tag changes to prevent infinite loops
    const handleTagsChange = useCallback((tags: string[]) => {
        setExam(prev => ({ ...prev, tags }));
    }, []);

    const isQuestionValid = useMemo(() => {
        const hasValidOptions = options.length >= 2 && options.every(opt => opt?.trim());
        const hasValidAnswer = correctAnswer.length > 0 &&
            correctAnswer.every(answer => options.includes(answer));

        return Boolean(questionText.trim() && hasValidOptions && hasValidAnswer);
    }, [questionText, options, correctAnswer]);

    const isExamValid = useMemo(() => {
        return Boolean(
            exam.title?.trim() &&
            exam.description?.trim() &&
            exam.questions &&
            exam.questions.length > 0
        ) && !isSubmitting;
    }, [exam.title, exam.description, exam.questions, isSubmitting]);

    // Combine auth and permission checking into single effect
    useEffect(() => {
        const initializeEdit = async () => {
            // Wait for auth to initialize
            if (!authInitialized || authLoading) {
                setLoadingState(prev => ({ ...prev, checkingAuth: true }));
                return;
            }

            // Check authentication
            if (!authenticated) {
                sessionStorage.setItem('redirectPath', `/exams/${examId}/edit`);
                navigate('/login');
                return;
            }

            if (!examId) {
                setLoadingState({
                    isLoading: false,
                    checkingAuth: false,
                    checkingPermissions: false,
                    error: 'No exam ID provided'
                });
                return;
            }

            try {
                setLoadingState(prev => ({ 
                    ...prev, 
                    checkingAuth: false, 
                    checkingPermissions: true,
                    error: null 
                }));

                // Check permissions and load exam in parallel
                const [canModify, loadedExam] = await Promise.all([
                    ExamService.canUserModifyExam(examId),
                    ExamService.getExamById(examId)
                ]);

                if (!canModify) {
                    setLoadingState({
                        isLoading: false,
                        checkingAuth: false,
                        checkingPermissions: false,
                        error: 'You do not have permission to edit this exam. Only the exam creator can make changes.'
                    });
                    return;
                }

                if (!loadedExam) {
                    setLoadingState({
                        isLoading: false,
                        checkingAuth: false,
                        checkingPermissions: false,
                        error: 'Exam not found'
                    });
                    return;
                }

                // Ensure tags array exists
                if (!loadedExam.tags) {
                    loadedExam.tags = [];
                }

                setExam(loadedExam);
                setOriginalExam(JSON.parse(JSON.stringify(loadedExam))); // Deep copy for comparison
                setCanEdit(true);
                setLoadingState({
                    isLoading: false,
                    checkingAuth: false,
                    checkingPermissions: false,
                    error: null
                });

            } catch (error) {
                console.error('Error during initialization:', error);
                setLoadingState({
                    isLoading: false,
                    checkingAuth: false,
                    checkingPermissions: false,
                    error: 'Failed to load exam or verify permissions. Please try again.'
                });
            }
        };

        initializeEdit();
    }, [authenticated, authInitialized, authLoading, examId, navigate]);

    // Debounced callbacks to prevent rapid state changes
    const addOption = useCallback((): void => {
        setOptions(prev => [...prev, '']);
    }, []);

    const removeOption = useCallback((index: number): void => {
        if (options.length > 2) { // Keep at least 2 options
            const removedOption = options[index];
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);

            // Remove from correctAnswer if it was selected
            setCorrectAnswer(prev => prev.filter(answer => answer !== removedOption));
        }
    }, [options]);

    const updateOption = useCallback((index: number, value: string): void => {
        const oldValue = options[index];
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);

        // Update correctAnswer if it contained the old value
        setCorrectAnswer(prev =>
            prev.map(answer => answer === oldValue ? value : answer)
        );
    }, [options]);

    // Handle correct answer selection for single answer questions
    const handleSingleCorrectAnswer = useCallback((option: string): void => {
        setCorrectAnswer([option]);
    }, []);

    // Handle correct answer selection for multiple answer questions
    const toggleMultipleCorrectAnswer = useCallback((option: string): void => {
        setCorrectAnswer(prev =>
            prev.includes(option)
                ? prev.filter(answer => answer !== option)
                : [...prev, option]
        );
    }, []);

    // Reset question form to initial state
    const resetQuestionForm = useCallback((): void => {
        setQuestionText('');
        setOptions(['', '']);
        setCorrectAnswer([]);
        setIsMultipleAnswers(false);
        setExplanation(''); // Reset explanation field
        setIsEditMode(false);
        setEditingQuestionIndex(null);
    }, []);

    // Start editing a question
    const startEditQuestion = useCallback((questionIndex: number): void => {
        const question = exam.questions?.[questionIndex];
        if (!question) return;

        setQuestionText(question.questionText || '');
        setOptions(question.options ? question.options.filter((opt): opt is string => opt != null) : ['', '']);
        setCorrectAnswer(question.correctAnswers ? question.correctAnswers.filter((ans): ans is string => ans != null) : []);
        setIsMultipleAnswers(question.isMultipleAnswers || false);
        setExplanation(question.explanation || ''); // Load explanation for editing
        setEditingQuestionIndex(questionIndex);
        setIsEditMode(true);

        // Scroll to question builder with a small delay to prevent jumpiness
        setTimeout(() => {
            document.querySelector('.exam-section:nth-child(3)')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    }, [exam.questions]);

    // Cancel editing and reset form
    const cancelEdit = useCallback((): void => {
        resetQuestionForm();
    }, [resetQuestionForm]);

    const addQuestion = useCallback((): void => {
        if (!isQuestionValid) return;

        const question = {
            questionText: questionText,
            options: [...options],
            correctAnswers: [...correctAnswer],
            isMultipleAnswers: isMultipleAnswers,
            explanation: explanation.trim() || undefined, // Only include explanation if it has content
        };

        if (isEditMode && editingQuestionIndex !== null) {
            // Update existing question
            setExam(prev => {
                const updatedQuestions = [...(prev.questions || [])];
                updatedQuestions[editingQuestionIndex] = question;
                return {
                    ...prev,
                    questions: updatedQuestions
                };
            });
        } else {
            // Add new question
            setExam(prev => ({
                ...prev,
                questions: [...(prev.questions || []), question]
            }));
        }

        // Reset question form
        resetQuestionForm();
    }, [isQuestionValid, questionText, options, correctAnswer, isMultipleAnswers, explanation, isEditMode, editingQuestionIndex, resetQuestionForm]);

    // Remove question from exam
    const removeQuestion = useCallback((questionIndex: number): void => {
        setExam(prev => ({
            ...prev,
            questions: prev.questions?.filter((_, index) => index !== questionIndex) || []
        }));

        // If we're editing the question being removed, cancel edit
        if (editingQuestionIndex === questionIndex) {
            cancelEdit();
        } else if (editingQuestionIndex !== null && editingQuestionIndex > questionIndex) {
            // Adjust editing index if a question before the edited one was removed
            setEditingQuestionIndex(editingQuestionIndex - 1);
        }
    }, [editingQuestionIndex, cancelEdit]);

    // Save exam changes
    const saveExam = useCallback(async (): Promise<void> => {
        if (!isExamValid) return;

        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            await ExamService.updateExam(exam);

            setSubmitMessage({ type: 'success', text: 'Exam updated successfully!' });

            // Update original exam to reflect saved state
            setOriginalExam(JSON.parse(JSON.stringify(exam)));
        } catch (error: any) {
            console.error('Error updating exam:', error);
            
            let errorMessage = 'Failed to update exam. Please try again.';
            if (error.message && error.message.includes('You can only update exams you created')) {
                errorMessage = 'You do not have permission to edit this exam.';
            }
            
            setSubmitMessage({
                type: 'error',
                text: errorMessage
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [isExamValid, exam]);

    // Cancel all changes and revert to original
    const cancelAllChanges = useCallback((): void => {
        if (originalExam) {
            setExam(JSON.parse(JSON.stringify(originalExam)));
            resetQuestionForm();
            setSubmitMessage({ type: 'info', text: 'All changes have been reverted.' });
        }
    }, [originalExam, resetQuestionForm]);

    // Navigate back to exam detail view
    const goBack = useCallback((): void => {
        if (hasUnsavedChanges) {
            setIsDialogOpen(true);
        } else {
            navigate(`/exams/${examId}`); // Go back to exam detail page
        }
    }, [hasUnsavedChanges, navigate, examId]);

    // Handle confirm leave
    const handleConfirmLeave = useCallback((): void => {
        setIsDialogOpen(false);
        navigate(`/exams/${examId}`);
    }, [navigate, examId]);

    // Handle cancel
    const handleCancel = useCallback((): void => {
        setIsDialogOpen(false);
    }, []);

    // Show loading while checking auth and permissions
    if (loadingState.checkingAuth || loadingState.checkingPermissions || loadingState.isLoading) {
        return (
            <div className="exam-edit-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>
                        {loadingState.checkingAuth 
                            ? 'Checking authentication...' 
                            : loadingState.checkingPermissions 
                                ? 'Verifying edit permissions...' 
                                : 'Loading exam...'}
                    </p>
                </div>
            </div>
        );
    }

    if (loadingState.error) {
        return (
            <div className="exam-edit-container">
                <div className="error-state">
                    <Icon icon="vaadin:exclamation-circle" className="error-icon" />
                    <h2>Access Denied</h2>
                    <p>{loadingState.error}</p>
                    <div className="error-actions">
                        <button onClick={() => navigate('/exams')} className="btn-primary">
                            Browse Exams
                        </button>
                        {examId && (
                            <button 
                                onClick={() => navigate(`/exams/${examId}`)} 
                                className="btn-secondary"
                            >
                                View Exam Details
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="exam-edit-container">
            <div className="page-header">
                <div className="header-content">
                    <button onClick={goBack} className="back-btn">
                        <Icon icon="vaadin:arrow-left" />
                        Back to Exam
                    </button>
                    <h1>Edit Exam</h1>
                    {hasUnsavedChanges && (
                        <span className="unsaved-indicator">
                            <Icon icon="vaadin:circle" />
                            Unsaved changes
                        </span>
                    )}
                </div>
            </div>

            {/* Exam Details */}
            <div className="exam-section">
                <h2>Exam Details</h2>

                <div className="form-group">
                    <label className="form-label">
                        Exam Title
                    </label>
                    <input
                        type="text"
                        value={exam.title || ''}
                        onChange={(e) => setExam(prev => ({ ...prev, title: e.target.value }))}
                        className="form-input"
                        placeholder="Enter exam title..."
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">
                        Description
                    </label>
                    <textarea
                        value={exam.description || ''}
                        onChange={(e) => setExam(prev => ({ ...prev, description: e.target.value }))}
                        className="form-textarea"
                        rows={3}
                        placeholder="Enter exam description..."
                    />
                </div>

                {/* Tags Section - Using fixed component */}
                <TagInput
                    selectedTags={selectedTags}
                    onTagsChange={handleTagsChange}
                    label="Tags (Optional)"
                    hint="Add tags to help others find your exam. Press Enter to add a tag."
                    maxTags={10}
                />
            </div>

            {/* Question Builder */}
            <div className="exam-section">
                <h2>
                    {isEditMode ? 'Edit Question' : 'Add New Question'}
                    {isEditMode && editingQuestionIndex !== null && (
                        <span className="edit-indicator"> (Question {editingQuestionIndex + 1})</span>
                    )}
                </h2>

                <div className="form-group">
                    <label className="form-label">
                        Question Text
                    </label>
                    <textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        className="form-textarea"
                        rows={2}
                        placeholder="Enter your question..."
                    />
                </div>

                <div className="form-group">
                    <div className="option-header">
                        <label className="form-label">
                            Answer Options
                        </label>
                        <button
                            onClick={addOption}
                            className="add-option-btn"
                            type="button"
                        >
                            + Add Option
                        </button>
                    </div>

                    {options.map((option, index) => (
                        <div key={index} className="option-row">
                            <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(index, e.target.value)}
                                className="option-input"
                                placeholder={`Option ${index + 1}...`}
                            />

                            {!isMultipleAnswers && (
                                <input
                                    type="radio"
                                    name="correctAnswer"
                                    checked={correctAnswer.includes(option)}
                                    onChange={() => handleSingleCorrectAnswer(option)}
                                    className="radio-input"
                                />
                            )}

                            {isMultipleAnswers && (
                                <input
                                    type="checkbox"
                                    checked={correctAnswer.includes(option)}
                                    onChange={() => toggleMultipleCorrectAnswer(option)}
                                    className="checkbox-input"
                                />
                            )}

                            {options.length > 2 && (
                                <button
                                    onClick={() => removeOption(index)}
                                    className="remove-btn"
                                    type="button"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="form-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={isMultipleAnswers}
                            onChange={(e) => {
                                setIsMultipleAnswers(e.target.checked);
                                setCorrectAnswer([]);
                            }}
                        />
                        <span>Allow multiple correct answers</span>
                    </label>
                </div>

                {/* New Explanation Field */}
                <div className="form-group">
                    <label className="form-label">
                        Explanation (Optional)
                        <span className="form-label-hint">Provide additional context or detailed explanation for this question</span>
                    </label>
                    <textarea
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        className="form-textarea explanation-textarea"
                        rows={3}
                        placeholder="Enter detailed explanation, background information, or context that will help learners understand this question better..."
                        maxLength={1000}
                    />
                    <div className="character-counter">
                        {explanation.length}/1000 characters
                    </div>
                </div>

                <div className="question-actions">
                    <button
                        onClick={addQuestion}
                        disabled={!isQuestionValid}
                        className={`btn-primary ${isQuestionValid ? 'enabled' : 'disabled'}`}
                        type="button"
                    >
                        {isEditMode ? 'Update Question' : 'Add Question to Exam'}
                    </button>

                    {isEditMode && (
                        <button
                            onClick={cancelEdit}
                            className="btn-secondary"
                            type="button"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>
            </div>

            {/* Questions List */}
            {exam.questions && exam.questions.length > 0 && (
                <div className="exam-section">
                    <h2>Questions ({exam.questions.length})</h2>

                    {exam.questions.map((question, index) => (
                        <div
                            key={index}
                            className={`question-card ${editingQuestionIndex === index ? 'editing' : ''}`}
                        >
                            <div className="question-header">
                                <h3>Question {index + 1}</h3>
                                <div className="question-actions">
                                    <button
                                        onClick={() => startEditQuestion(index)}
                                        className="edit-btn"
                                        type="button"
                                        disabled={isEditMode && editingQuestionIndex !== index}
                                    >
                                        <Icon icon="vaadin:edit" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => removeQuestion(index)}
                                        className="remove-btn"
                                        type="button"
                                        disabled={isEditMode && editingQuestionIndex === index}
                                    >
                                        <Icon icon="vaadin:trash" />
                                        Remove
                                    </button>
                                </div>
                            </div>

                            <p className="question-text">{question?.questionText}</p>

                            <div className="question-options">
                                <div className="question-type">
                                    Type: {question?.isMultipleAnswers ? 'Multiple Answers' : 'Single Answer'}
                                </div>
                                <div>Options:</div>
                                <ul>
                                    {question?.options?.map((opt, optIndex) => {
                                        // Check if this option is a correct answer
                                        const isCorrect = question.correctAnswers?.includes(opt) || false;
                                        return (
                                            <li key={index + "-" + optIndex} className={isCorrect ? 'correct' : ''}>
                                                {opt}
                                                {isCorrect && <Icon icon="vaadin:check" className="correct-icon" />}
                                            </li>
                                        );
                                    })}
                                </ul>
                                
                                {/* Display explanation if available */}
                                {question?.explanation && (
                                    <div className="question-explanation-preview">
                                        <div className="explanation-label">
                                            <Icon icon="vaadin:info-circle" className="explanation-icon" />
                                            <span>Explanation:</span>
                                        </div>
                                        <p className="explanation-text">{question.explanation}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Submit Section */}
            <div className="submit-section">
                {submitMessage && (
                    <div className={`message ${submitMessage.type}`}>
                        {submitMessage.text}
                    </div>
                )}

                <div className="action-buttons">
                    <button
                        onClick={saveExam}
                        disabled={!isExamValid || isEditMode || !hasUnsavedChanges}
                        className={`btn-submit ${(isExamValid && !isEditMode && hasUnsavedChanges) ? 'enabled' : 'disabled'}`}
                        type="button"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="spinner"></div>
                                Saving Changes...
                            </>
                        ) : (
                            <>
                                <Icon className='submit-check' icon="vaadin:check-circle-o" />
                                Save Changes
                            </>
                        )}
                    </button>

                    {hasUnsavedChanges && (
                        <button
                            onClick={cancelAllChanges}
                            className="btn-cancel"
                            type="button"
                            disabled={isSubmitting || isEditMode}
                        >
                            <Icon icon="vaadin:refresh" />
                            Revert All Changes
                        </button>
                    )}
                </div>

                {isEditMode && (
                    <p className="edit-warning">
                        <Icon icon="vaadin:info-circle" />
                        Complete or cancel the current edit before saving the exam.
                    </p>
                )}

                {!hasUnsavedChanges && !isEditMode && (
                    <p className="no-changes-info">
                        <Icon icon="vaadin:check-circle" />
                        No unsaved changes
                    </p>
                )}
            </div>
            
            <Dialog
                opened={isDialogOpen}
                headerTitle="Unsaved Changes"
                onOpenedChanged={(e) => setIsDialogOpen(e.detail.value)}
            >
                <div>
                    You have unsaved changes. Are you sure you want to leave?
                </div>
                <div>
                    <Button theme="tertiary" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button theme="primary error" onClick={handleConfirmLeave}>
                        Leave
                    </Button>
                </div>
            </Dialog>
        </div>
    );
}