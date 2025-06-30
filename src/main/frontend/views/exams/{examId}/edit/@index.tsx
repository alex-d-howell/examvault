import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import type Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';
import { ExamService } from 'Frontend/generated/endpoints';
import { Button, Dialog, Icon } from "@vaadin/react-components";
import './edit.css';

interface SubmitMessage {
    type: 'success' | 'error' | 'info';
    text: string;
}

export default function EditView() {
    const { examId } = useParams<{ examId: string }>();
    const navigate = useNavigate();

    // Initialize exam with proper Exam model structure
    const [exam, setExam] = useState<Exam>({
        title: '',
        description: '',
        questions: []
    });

    const [originalExam, setOriginalExam] = useState<Exam | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [questionText, setQuestionText] = useState<string>('');
    const [options, setOptions] = useState<string[]>(['', '']); // Start with at least 2 options
    const [correctAnswer, setCorrectAnswer] = useState<string[]>([]); // Now always an array
    const [isMultipleAnswers, setIsMultipleAnswers] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [submitMessage, setSubmitMessage] = useState<SubmitMessage | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    // Editing states
    const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);

    // Validation states
    const [isQuestionValid, setIsQuestionValid] = useState<boolean>(false);
    const [isExamValid, setIsExamValid] = useState<boolean>(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

    // Load exam data on component mount
    useEffect(() => {
        const loadExam = async () => {
            if (!examId) {
                setLoadError('No exam ID provided');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const loadedExam = await ExamService.getExamById(examId);

                if (loadedExam) {
                    setExam(loadedExam);
                    setOriginalExam(JSON.parse(JSON.stringify(loadedExam))); // Deep copy for comparison
                } else {
                    setLoadError('Exam not found');
                }
            } catch (error) {
                console.error('Error loading exam:', error);
                setLoadError('Failed to load exam. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        loadExam();
    }, [examId]);

    // Check for unsaved changes
    useEffect(() => {
        if (originalExam && exam) {
            const hasChanges = JSON.stringify(originalExam) !== JSON.stringify(exam);
            setHasUnsavedChanges(hasChanges);
        }
    }, [exam, originalExam]);

    // Update validation when state changes
    useEffect(() => {
        const hasValidOptions = options.length >= 2 && options.every(opt => opt?.trim());
        const hasValidAnswer = correctAnswer.length > 0 &&
            correctAnswer.every(answer => options.includes(answer));

        const questionValid = Boolean(questionText.trim() && hasValidOptions && hasValidAnswer);
        setIsQuestionValid(questionValid);
    }, [questionText, options, correctAnswer, isMultipleAnswers]);

    useEffect(() => {
        const examValid = Boolean(
            exam.title?.trim() &&
            exam.description?.trim() &&
            exam.questions &&
            exam.questions.length > 0
        );
        setIsExamValid(examValid && !isSubmitting);
    }, [exam, isSubmitting]);

    const addOption = (): void => {
        setOptions([...options, '']);
    };

    const removeOption = (index: number): void => {
        if (options.length > 2) { // Keep at least 2 options
            const removedOption = options[index];
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);

            // Remove from correctAnswer if it was selected
            setCorrectAnswer(prev => prev.filter(answer => answer !== removedOption));
        }
    };

    const updateOption = (index: number, value: string): void => {
        const oldValue = options[index];
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);

        // Update correctAnswer if it contained the old value
        setCorrectAnswer(prev =>
            prev.map(answer => answer === oldValue ? value : answer)
        );
    };

    // Handle correct answer selection for single answer questions
    const handleSingleCorrectAnswer = (option: string): void => {
        setCorrectAnswer([option]);
    };

    // Handle correct answer selection for multiple answer questions
    const toggleMultipleCorrectAnswer = (option: string): void => {
        setCorrectAnswer(prev =>
            prev.includes(option)
                ? prev.filter(answer => answer !== option)
                : [...prev, option]
        );
    };

    // Reset question form to initial state
    const resetQuestionForm = (): void => {
        setQuestionText('');
        setOptions(['', '']);
        setCorrectAnswer([]);
        setIsMultipleAnswers(false);
        setIsEditMode(false);
        setEditingQuestionIndex(null);
    };

    // Start editing a question
    const startEditQuestion = (questionIndex: number): void => {
        const question = exam.questions?.[questionIndex];
        if (!question) return;

        setQuestionText(question.questionText || '');
        setOptions(question.options ? question.options.filter((opt): opt is string => opt != null) : ['', '']);
        setCorrectAnswer(question.correctAnswers ? question.correctAnswers.filter((ans): ans is string => ans != null) : []);
        setIsMultipleAnswers(question.isMultipleAnswers || false);
        setEditingQuestionIndex(questionIndex);
        setIsEditMode(true);

        // Scroll to question builder
        document.querySelector('.exam-section:nth-child(3)')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    // Cancel editing and reset form
    const cancelEdit = (): void => {
        resetQuestionForm();
    };

    const addQuestion = (): void => {
        if (!isQuestionValid) return;

        const question = {
            questionText: questionText,
            options: [...options],
            correctAnswers: [...correctAnswer],
            isMultipleAnswers: isMultipleAnswers
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
    };

    // Remove question from exam
    const removeQuestion = (questionIndex: number): void => {
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
    };

    // Save exam changes
    const saveExam = async (): Promise<void> => {
        if (!isExamValid) return;

        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            console.log('Saving exam:', exam);
            await ExamService.updateExam(exam);

            setSubmitMessage({ type: 'success', text: 'Exam updated successfully!' });

            // Update original exam to reflect saved state
            setOriginalExam(JSON.parse(JSON.stringify(exam)));
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error('Error updating exam:', error);
            setSubmitMessage({
                type: 'error',
                text: 'Failed to update exam. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Cancel all changes and revert to original
    const cancelAllChanges = (): void => {
        if (originalExam) {
            setExam(JSON.parse(JSON.stringify(originalExam)));
            resetQuestionForm();
            setHasUnsavedChanges(false);
            setSubmitMessage({ type: 'info', text: 'All changes have been reverted.' });
        }
    };

    // Navigate back to exam detail view
    const goBack = (): void => {
        if (hasUnsavedChanges) {
            setIsDialogOpen(true);
        } else {
            navigate(-1); // Go back to previous page
        }
    };

    // Handle confirm leave
    const handleConfirmLeave = (): void => {
        setIsDialogOpen(false);
        navigate(-1);
    };

    // Handle cancel
    const handleCancel = (): void => {
        setIsDialogOpen(false);
    };

    if (isLoading) {
        return (
            <div className="exam-edit-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading exam...</p>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="exam-edit-container">
                <div className="error-state">
                    <Icon icon="vaadin:exclamation-circle" className="error-icon" />
                    <h2>Error Loading Exam</h2>
                    <p>{loadError}</p>
                    <button onClick={goBack} className="btn-secondary">
                        Go Back
                    </button>
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
                        Back
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