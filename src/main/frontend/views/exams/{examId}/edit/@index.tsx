import { useParams } from 'react-router';
import { Button, Dialog, Icon } from "@vaadin/react-components";
import { useAuth } from 'Frontend/hooks/useAuth';
import { useExamForm } from 'Frontend/hooks/useExamForm';
import { useEditPageStates } from 'Frontend/hooks/useEditPageStates';
import { usePageMeta } from 'Frontend/hooks/usePageMeta';
import { PageErrorBoundary } from 'Frontend/components/ErrorBoundaries';

import './edit.css';
import { ExamDetailsForm, QuestionBuilderForm, QuestionsList } from 'Frontend/components/ExamFormComponents';

export default function EditView() {
    const { examId } = useParams<{ examId: string }>();
    const { authenticated, authInitialized, loading: authLoading } = useAuth();

    usePageMeta({ title: 'Edit Exam', description: 'Edit your exam details and questions' });

    const examFormState = useExamForm({
        mode: 'edit',
        examId,
        authenticated,
        authInitialized,
        authLoading
    });

    const { loadingComponent, errorComponent } = useEditPageStates({
        loadingState: examFormState.loadingState,
        examId
    });

    // Early returns for loading/error states
    if (loadingComponent) return loadingComponent;
    if (errorComponent) return errorComponent;

    const {
        // Exam state
        exam, hasUnsavedChanges, updateExamField, updateTags,
        // Question builder state
        questionText, setQuestionText, options, addOption, removeOption, updateOption,
        correctAnswer, handleSingleCorrectAnswer, toggleMultipleCorrectAnswer,
        isMultipleAnswers, setIsMultipleAnswers, explanation, setExplanation,
        // Question management
        addQuestion, startEditQuestion, removeQuestion, cancelEdit,
        editingQuestionIndex, isEditMode,
        // Validation
        isQuestionValid, isExamValid, validationErrors,
        // Submission
        isSubmitting, submitMessage, submitExam, cancelAllChanges,
        // Navigation
        goBack, isDialogOpen, handleConfirmLeave, handleCancelLeave
    } = examFormState;

    return (
        <PageErrorBoundary>
            <div className="exam-edit-container">
                {/* Page Header */}
                <EditPageHeader
                    onGoBack={goBack}
                    hasUnsavedChanges={hasUnsavedChanges}
                />

                {/* Exam Details Form */}
                <ExamDetailsForm
                    exam={exam}
                    validationErrors={validationErrors}
                    updateExamField={updateExamField}
                    updateTags={updateTags}
                />

                {/* Question Builder Form */}
                <QuestionBuilderForm
                    isEditMode={isEditMode}
                    editingQuestionIndex={editingQuestionIndex}
                    questionText={questionText}
                    setQuestionText={setQuestionText}
                    validationErrors={validationErrors}
                    options={options}
                    addOption={addOption}
                    updateOption={updateOption}
                    removeOption={removeOption}
                    isMultipleAnswers={isMultipleAnswers}
                    setIsMultipleAnswers={setIsMultipleAnswers}
                    correctAnswer={correctAnswer}
                    handleSingleCorrectAnswer={handleSingleCorrectAnswer}
                    toggleMultipleCorrectAnswer={toggleMultipleCorrectAnswer}
                    explanation={explanation}
                    setExplanation={setExplanation}
                    isQuestionValid={isQuestionValid}
                    addQuestion={addQuestion}
                    cancelEdit={cancelEdit}
                />

                {/* Questions List */}
                <QuestionsList
                    exam={exam}
                    editingQuestionIndex={editingQuestionIndex}
                    startEditQuestion={startEditQuestion}
                    removeQuestion={removeQuestion}
                    isEditMode={isEditMode}
                />

                {/* Submit Section */}
                <EditSubmitSection
                    submitMessage={submitMessage}
                    validationErrors={validationErrors}
                    isExamValid={isExamValid}
                    isEditMode={isEditMode}
                    hasUnsavedChanges={hasUnsavedChanges}
                    isSubmitting={isSubmitting}
                    onSubmit={submitExam}
                    onCancelChanges={cancelAllChanges}
                />

                {/* Unsaved Changes Dialog */}
                <Dialog
                    opened={isDialogOpen}
                    headerTitle="Unsaved Changes"
                    onOpenedChanged={(e) => !e.detail.value && handleCancelLeave()}
                >
                    <div>You have unsaved changes. Are you sure you want to leave?</div>
                    <div>
                        <Button theme="tertiary" onClick={handleCancelLeave}>Cancel</Button>
                        <Button theme="primary error" onClick={handleConfirmLeave}>Leave</Button>
                    </div>
                </Dialog>
            </div>
        </PageErrorBoundary>
    );
}

const EditPageHeader = ({ onGoBack, hasUnsavedChanges }: {
    onGoBack: () => void;
    hasUnsavedChanges: boolean;
}) => (
    <div className="page-header">
        <div className="header-content">
            <button onClick={onGoBack} className="back-btn">
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
);

const EditSubmitSection = ({
    submitMessage,
    validationErrors,
    isExamValid,
    isEditMode,
    hasUnsavedChanges,
    isSubmitting,
    onSubmit,
    onCancelChanges
}: {
    submitMessage: any;
    validationErrors: any;
    isExamValid: boolean;
    isEditMode: boolean;
    hasUnsavedChanges: boolean;
    isSubmitting: boolean;
    onSubmit: () => void;
    onCancelChanges: () => void;
}) => (
    <div className="submit-section">
        {submitMessage && (
            <div className={`message ${submitMessage.type}`}>
                <Icon
                    icon={submitMessage.type === 'success' ? 'vaadin:check-circle' :
                        submitMessage.type === 'info' ? 'vaadin:info-circle' : 'vaadin:exclamation-circle'}
                />
                {submitMessage.text}
            </div>
        )}

        {validationErrors.general && (
            <div className="validation-summary">
                <Icon icon="vaadin:exclamation-circle" />
                {validationErrors.general}
            </div>
        )}

        <div className="action-buttons">
            <button
                onClick={onSubmit}
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
                    onClick={onCancelChanges}
                    className="btn-cancel"
                    type="button"
                    disabled={isSubmitting || isEditMode}
                >
                    <Icon icon="vaadin:refresh" />
                    Revert All Changes
                </button>
            )}
        </div>

        {!isExamValid && !validationErrors.general && (
            <div className="disabled-reason">
                <Icon icon="vaadin:info-circle" />
                {isEditMode ? 'Complete or cancel the current edit before saving' :
                    !hasUnsavedChanges ? 'No changes to save' :
                        validationErrors.title ? 'Fix exam title to continue' :
                            validationErrors.description ? 'Fix exam description to continue' :
                                'Complete all required fields to save changes'}
            </div>
        )}

        {!hasUnsavedChanges && !isEditMode && (
            <p className="no-changes-info">
                <Icon icon="vaadin:check-circle" />
                No unsaved changes
            </p>
        )}
    </div>
);