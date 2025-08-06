import { Icon } from '@vaadin/react-components';
import { TagInput } from 'Frontend/components/TagComponents/TagsComponents';
import { APP_CONFIG } from 'Frontend/config/constants';

const Skeleton: React.FC<{
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
    className?: string;
}> = ({
    width = '100%',
    height = '1rem',
    borderRadius = 'var(--radius-md)',
    className = ''
}) => (
        <div
            className={`skeleton ${className}`}
            style={{
                width,
                height,
                borderRadius,
                backgroundColor: 'var(--color-gray-200)',
            }}
        />
    );

export const LoadingStateComponent = ({ message }: { message: string }) => (
    <div className="exam-create-container">
        <div className="loading-state">
            <div className="spinner"></div>
            <p>{message}</p>
        </div>
    </div>
);

export const AuthRequiredComponent = ({ onSignIn }: { onSignIn: () => void }) => (
    <div className="exam-create-container">
        <div className="auth-required">
            <Icon icon="vaadin:lock" className="auth-icon" />
            <h2>Authentication Required</h2>
            <p>You need to be signed in to create exams.</p>
            <button onClick={onSignIn} className="btn-primary enabled">
                Sign In
            </button>
        </div>
    </div>
);

export const ExamFormSkeleton = () => (
    <div className="exam-create-container">
        <div className="create-header">
            <Skeleton height="2rem" width="300px" className="mb-lg" />
        </div>

        <div className="exam-section">
            <Skeleton height="1.5rem" width="150px" className="mb-lg" />
            <div className="form-group">
                <Skeleton height="1rem" width="100px" className="mb-sm" />
                <Skeleton height="3rem" width="100%" className="mb-lg" />
            </div>
            <div className="form-group">
                <Skeleton height="1rem" width="120px" className="mb-sm" />
                <Skeleton height="4rem" width="100%" className="mb-lg" />
            </div>
        </div>
    </div>
);

export const ExamDetailsForm = ({
    exam,
    validationErrors,
    updateExamField,
    updateTags
}: any) => {
    // Safe defaults for null/undefined props
    const safeExam = exam || {};
    const safeValidationErrors = validationErrors || {};
    const safeUpdateExamField = updateExamField || (() => {});
    const safeUpdateTags = updateTags || (() => {});

    return (
        <div className="exam-section">
            <h2>Exam Details</h2>
            <div className="form-group">
                <label className="form-label">Exam Title *</label>
                <input
                    type="text"
                    value={safeExam.title || ''}
                    onChange={(e) => safeUpdateExamField('title', e.target.value)}
                    className={`form-input ${safeValidationErrors.title ? 'error' : ''}`}
                    placeholder="Enter exam title..."
                />
                {safeValidationErrors.title && (
                    <div className="error-message">
                        <Icon icon="vaadin:exclamation-circle" />
                        {safeValidationErrors.title}
                    </div>
                )}
            </div>

            <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                    value={safeExam.description || ''}
                    onChange={(e) => safeUpdateExamField('description', e.target.value)}
                    className={`form-textarea ${safeValidationErrors.description ? 'error' : ''}`}
                    rows={3}
                    placeholder="Enter exam description..."
                />
                {safeValidationErrors.description && (
                    <div className="error-message">
                        <Icon icon="vaadin:exclamation-circle" />
                        {safeValidationErrors.description}
                    </div>
                )}
            </div>

            <TagInput
                selectedTags={safeExam.tags?.filter((tag: any): tag is string => tag != null) || []}
                onTagsChange={safeUpdateTags}
                label="Tags (Optional)"
                hint="Add tags to help others find your exam. Press Enter to add a tag."
                maxTags={APP_CONFIG?.FORMS?.MAX_TAGS_COUNT || 10}
            />
        </div>
    );
};

export const QuestionBuilderForm = ({
    isEditMode,
    editingQuestionIndex,
    questionText,
    setQuestionText,
    validationErrors,
    options,
    addOption,
    updateOption,
    removeOption,
    isMultipleAnswers,
    setIsMultipleAnswers,
    correctAnswer,
    handleSingleCorrectAnswer,
    toggleMultipleCorrectAnswer,
    explanation,
    setExplanation,
    isQuestionValid,
    addQuestion,
    cancelEdit
}: any) => {
    // Safe defaults for null/undefined props
    const safeOptions = options || [];
    const safeCorrectAnswer = correctAnswer || [];
    const safeValidationErrors = validationErrors || {};
    const safeQuestionText = questionText || '';
    const safeExplanation = explanation || '';
    const safeIsEditMode = isEditMode || false;
    const safeIsMultipleAnswers = isMultipleAnswers || false;
    const safeIsQuestionValid = isQuestionValid || false;

    // Safe function defaults
    const safeSetQuestionText = setQuestionText || (() => {});
    const safeAddOption = addOption || (() => {});
    const safeUpdateOption = updateOption || (() => {});
    const safeRemoveOption = removeOption || (() => {});
    const safeSetIsMultipleAnswers = setIsMultipleAnswers || (() => {});
    const safeHandleSingleCorrectAnswer = handleSingleCorrectAnswer || (() => {});
    const safeToggleMultipleCorrectAnswer = toggleMultipleCorrectAnswer || (() => {});
    const safeSetExplanation = setExplanation || (() => {});
    const safeAddQuestion = addQuestion || (() => {});
    const safeCancelEdit = cancelEdit || (() => {});

    const maxOptionsCount = APP_CONFIG?.FORMS?.MAX_OPTIONS_COUNT || 6;
    const minOptionsCount = APP_CONFIG?.FORMS?.MIN_OPTIONS_COUNT || 2;
    const maxExplanationLength = APP_CONFIG?.FORMS?.MAX_EXPLANATION_LENGTH || 500;

    return (
        <div className="exam-section">
            <h2>
                {safeIsEditMode ? 'Edit Question' : 'Add Question'}
                {safeIsEditMode && editingQuestionIndex !== null && (
                    <span className="edit-indicator"> (Question {editingQuestionIndex + 1})</span>
                )}
            </h2>

            {/* Question Text */}
            <div className="form-group">
                <label className="form-label">Question Text *</label>
                <textarea
                    value={safeQuestionText}
                    onChange={(e) => safeSetQuestionText(e.target.value)}
                    className={`form-textarea ${safeValidationErrors.questionText ? 'error' : ''}`}
                    rows={2}
                    placeholder="Enter your question..."
                />
                {safeValidationErrors.questionText && (
                    <div className="error-message">
                        <Icon icon="vaadin:exclamation-circle" />
                        {safeValidationErrors.questionText}
                    </div>
                )}
            </div>

            {/* Options */}
            <div className="form-group">
                <div className="option-header">
                    <label className="form-label">Answer Options *</label>
                    <button
                        onClick={safeAddOption}
                        className="add-option-btn"
                        type="button"
                        disabled={safeOptions.length >= maxOptionsCount}
                    >
                        + Add Option {safeOptions.length >= maxOptionsCount && `(Max ${maxOptionsCount})`}
                    </button>
                </div>

                {safeOptions.map((option: string, index: number) => (
                    <div key={index} className="option-row">
                        <input
                            type="text"
                            value={option || ''}
                            onChange={(e) => safeUpdateOption(index, e.target.value)}
                            className={`option-input ${safeValidationErrors.options ? 'error' : ''}`}
                            placeholder={`Option ${index + 1}...`}
                        />

                        {!safeIsMultipleAnswers && (
                            <input
                                type="radio"
                                name="correctAnswer"
                                checked={safeCorrectAnswer.includes(option)}
                                onChange={() => safeHandleSingleCorrectAnswer(option)}
                                className="radio-input"
                            />
                        )}

                        {safeIsMultipleAnswers && (
                            <input
                                type="checkbox"
                                checked={safeCorrectAnswer.includes(option)}
                                onChange={() => safeToggleMultipleCorrectAnswer(option)}
                                className="checkbox-input"
                            />
                        )}

                        {safeOptions.length > minOptionsCount && (
                            <button onClick={() => safeRemoveOption(index)} className="remove-btn" type="button">
                                Remove
                            </button>
                        )}
                    </div>
                ))}

                {safeValidationErrors.options && (
                    <div className="error-message">
                        <Icon icon="vaadin:exclamation-circle" />
                        {safeValidationErrors.options}
                    </div>
                )}
            </div>

            {/* Multiple Answers Checkbox */}
            <div className="form-group">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={safeIsMultipleAnswers}
                        onChange={(e) => safeSetIsMultipleAnswers(e.target.checked)}
                    />
                    <span>Allow multiple correct answers</span>
                </label>
            </div>

            {safeValidationErrors.correctAnswer && (
                <div className="error-message">
                    <Icon icon="vaadin:exclamation-circle" />
                    {safeValidationErrors.correctAnswer}
                </div>
            )}

            {/* Explanation */}
            <div className="form-group">
                <label className="form-label">
                    Explanation (Optional)
                    <span className="form-label-hint">Provide additional context for this question</span>
                </label>
                <textarea
                    value={safeExplanation}
                    onChange={(e) => safeSetExplanation(e.target.value)}
                    className="form-textarea explanation-textarea"
                    rows={3}
                    placeholder="Enter detailed explanation..."
                    maxLength={maxExplanationLength}
                />
                <div className="character-counter">
                    {safeExplanation.length}/{maxExplanationLength} characters
                </div>
            </div>

            {/* Action Buttons */}
            <div className="question-actions">
                <button
                    onClick={safeAddQuestion}
                    disabled={!safeIsQuestionValid}
                    className={`btn-primary ${safeIsQuestionValid ? 'enabled' : 'disabled'}`}
                    type="button"
                >
                    {safeIsEditMode ? 'Update Question' : 'Add Question to Exam'}
                </button>

                {!safeIsQuestionValid && (
                    <div className="disabled-reason">
                        <Icon icon="vaadin:info-circle" />
                        {safeValidationErrors.questionText || safeValidationErrors.options || safeValidationErrors.correctAnswer || 'Complete all required fields to add question'}
                    </div>
                )}

                {safeIsEditMode && (
                    <button onClick={safeCancelEdit} className="btn-secondary" type="button">
                        Cancel Edit
                    </button>
                )}
            </div>
        </div>
    );
};

export const QuestionsList = ({
    exam,
    editingQuestionIndex,
    startEditQuestion,
    removeQuestion,
    isEditMode
}: any) => {
    // Safe defaults for null/undefined props
    const safeExam = exam || {};
    const safeQuestions = safeExam.questions || [];
    const safeStartEditQuestion = startEditQuestion || (() => {});
    const safeRemoveQuestion = removeQuestion || (() => {});
    const safeIsEditMode = isEditMode || false;

    if (!safeQuestions.length) return null;

    return (
        <div className="exam-section">
            <h2>Questions ({safeQuestions.length})</h2>
            {safeQuestions.map((question: any, index: number) => {
                // Safe defaults for question properties
                const safeQuestion = question || {};
                
                return (
                    <div key={index} className={`question-card ${editingQuestionIndex === index ? 'editing' : ''}`}>
                        <div className="question-header">
                            <h3>Question {index + 1}</h3>
                            <div className="question-actions">
                                <button
                                    onClick={() => safeStartEditQuestion(index)}
                                    className="edit-btn"
                                    disabled={safeIsEditMode && editingQuestionIndex !== index}
                                >
                                    <Icon icon="vaadin:edit" /> Edit
                                </button>
                                <button
                                    onClick={() => safeRemoveQuestion(index)}
                                    className="remove-btn"
                                    disabled={safeIsEditMode && editingQuestionIndex === index}
                                >
                                    <Icon icon="vaadin:trash" /> Remove
                                </button>
                            </div>
                        </div>

                        <p className="question-text">{safeQuestion.questionText || 'No question text'}</p>
                        <div className="question-options">
                            <div className="question-type">
                                Type: {safeQuestion.isMultipleAnswers ? 'Multiple Answers' : 'Single Answer'}
                            </div>
                            <div>Options:</div>
                            <ul>
                                {(safeQuestion.options || []).map((opt: string, optIndex: number) => {
                                    const isCorrect = (safeQuestion.correctAnswers || safeQuestion.correctAnswer || []).includes(opt);
                                    return (
                                        <li key={`${index}-${optIndex}`} className={isCorrect ? 'correct' : ''}>
                                            {opt || 'Empty option'}
                                            {isCorrect && <Icon icon="vaadin:check" className="correct-icon" />}
                                        </li>
                                    );
                                })}
                            </ul>

                            {safeQuestion.explanation && (
                                <div className="question-explanation-preview">
                                    <div className="explanation-label">
                                        <Icon icon="vaadin:info-circle" className="explanation-icon" />
                                        <span>Explanation:</span>
                                    </div>
                                    <p className="explanation-text">{safeQuestion.explanation}</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};