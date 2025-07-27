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
}: any) => (
    <div className="exam-section">
        <h2>Exam Details</h2>
        <div className="form-group">
            <label className="form-label">Exam Title *</label>
            <input
                type="text"
                value={exam.title || ''}
                onChange={(e) => updateExamField('title', e.target.value)}
                className={`form-input ${validationErrors.title ? 'error' : ''}`}
                placeholder="Enter exam title..."
            />
            {validationErrors.title && (
                <div className="error-message">
                    <Icon icon="vaadin:exclamation-circle" />
                    {validationErrors.title}
                </div>
            )}
        </div>

        <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
                value={exam.description || ''}
                onChange={(e) => updateExamField('description', e.target.value)}
                className={`form-textarea ${validationErrors.description ? 'error' : ''}`}
                rows={3}
                placeholder="Enter exam description..."
            />
            {validationErrors.description && (
                <div className="error-message">
                    <Icon icon="vaadin:exclamation-circle" />
                    {validationErrors.description}
                </div>
            )}
        </div>

        <TagInput
            selectedTags={exam.tags?.filter((tag: any): tag is string => tag != null) || []}
            onTagsChange={updateTags}
            label="Tags (Optional)"
            hint="Add tags to help others find your exam. Press Enter to add a tag."
            maxTags={APP_CONFIG.FORMS.MAX_TAGS_COUNT}
        />
    </div>
);

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
}: any) => (
    <div className="exam-section">
        <h2>
            {isEditMode ? 'Edit Question' : 'Add Question'}
            {isEditMode && editingQuestionIndex !== null && (
                <span className="edit-indicator"> (Question {editingQuestionIndex + 1})</span>
            )}
        </h2>

        {/* Question Text */}
        <div className="form-group">
            <label className="form-label">Question Text *</label>
            <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className={`form-textarea ${validationErrors.questionText ? 'error' : ''}`}
                rows={2}
                placeholder="Enter your question..."
            />
            {validationErrors.questionText && (
                <div className="error-message">
                    <Icon icon="vaadin:exclamation-circle" />
                    {validationErrors.questionText}
                </div>
            )}
        </div>

        {/* Options */}
        <div className="form-group">
            <div className="option-header">
                <label className="form-label">Answer Options *</label>
                <button
                    onClick={addOption}
                    className="add-option-btn"
                    type="button"
                    disabled={options.length >= APP_CONFIG.FORMS.MAX_OPTIONS_COUNT}
                >
                    + Add Option {options.length >= APP_CONFIG.FORMS.MAX_OPTIONS_COUNT && `(Max ${APP_CONFIG.FORMS.MAX_OPTIONS_COUNT})`}
                </button>
            </div>

            {options.map((option: string, index: number) => (
                <div key={index} className="option-row">
                    <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        className={`option-input ${validationErrors.options ? 'error' : ''}`}
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

                    {options.length > APP_CONFIG.FORMS.MIN_OPTIONS_COUNT && (
                        <button onClick={() => removeOption(index)} className="remove-btn" type="button">
                            Remove
                        </button>
                    )}
                </div>
            ))}

            {validationErrors.options && (
                <div className="error-message">
                    <Icon icon="vaadin:exclamation-circle" />
                    {validationErrors.options}
                </div>
            )}
        </div>

        {/* Multiple Answers Checkbox */}
        <div className="form-group">
            <label className="checkbox-label">
                <input
                    type="checkbox"
                    checked={isMultipleAnswers}
                    onChange={(e) => setIsMultipleAnswers(e.target.checked)}
                />
                <span>Allow multiple correct answers</span>
            </label>
        </div>

        {validationErrors.correctAnswer && (
            <div className="error-message">
                <Icon icon="vaadin:exclamation-circle" />
                {validationErrors.correctAnswer}
            </div>
        )}

        {/* Explanation */}
        <div className="form-group">
            <label className="form-label">
                Explanation (Optional)
                <span className="form-label-hint">Provide additional context for this question</span>
            </label>
            <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="form-textarea explanation-textarea"
                rows={3}
                placeholder="Enter detailed explanation..."
                maxLength={APP_CONFIG.FORMS.MAX_EXPLANATION_LENGTH}
            />
            <div className="character-counter">
                {explanation.length}/{APP_CONFIG.FORMS.MAX_EXPLANATION_LENGTH} characters
            </div>
        </div>

        {/* Action Buttons */}
        <div className="question-actions">
            <button
                onClick={addQuestion}
                disabled={!isQuestionValid}
                className={`btn-primary ${isQuestionValid ? 'enabled' : 'disabled'}`}
                type="button"
            >
                {isEditMode ? 'Update Question' : 'Add Question to Exam'}
            </button>

            {!isQuestionValid && (
                <div className="disabled-reason">
                    <Icon icon="vaadin:info-circle" />
                    {validationErrors.questionText || validationErrors.options || validationErrors.correctAnswer || 'Complete all required fields to add question'}
                </div>
            )}

            {isEditMode && (
                <button onClick={cancelEdit} className="btn-secondary" type="button">
                    Cancel Edit
                </button>
            )}
        </div>
    </div>
);

export const QuestionsList = ({
    exam,
    editingQuestionIndex,
    startEditQuestion,
    removeQuestion,
    isEditMode
}: any) => {
    if (!exam.questions?.length) return null;

    return (
        <div className="exam-section">
            <h2>Questions ({exam.questions.length})</h2>
            {exam.questions.map((question: any, index: number) => (
                <div key={index} className={`question-card ${editingQuestionIndex === index ? 'editing' : ''}`}>
                    <div className="question-header">
                        <h3>Question {index + 1}</h3>
                        <div className="question-actions">
                            <button
                                onClick={() => startEditQuestion(index)}
                                className="edit-btn"
                                disabled={isEditMode && editingQuestionIndex !== index}
                            >
                                <Icon icon="vaadin:edit" /> Edit
                            </button>
                            <button
                                onClick={() => removeQuestion(index)}
                                className="remove-btn"
                                disabled={isEditMode && editingQuestionIndex === index}
                            >
                                <Icon icon="vaadin:trash" /> Remove
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
                            {question?.options?.map((opt: string, optIndex: number) => {
                                const isCorrect = question.correctAnswers?.includes(opt) || false;
                                return (
                                    <li key={`${index}-${optIndex}`} className={isCorrect ? 'correct' : ''}>
                                        {opt}
                                        {isCorrect && <Icon icon="vaadin:check" className="correct-icon" />}
                                    </li>
                                );
                            })}
                        </ul>

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
    );
};