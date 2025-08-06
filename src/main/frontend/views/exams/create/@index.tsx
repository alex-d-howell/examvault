import { useNavigate } from 'react-router';
import { Icon } from '@vaadin/react-components';
import { useAuth } from 'Frontend/hooks/useAuth';
import { useExamForm } from 'Frontend/hooks/useExamForm';

import { usePageMeta } from 'Frontend/hooks/usePageMeta';
import { ROUTES } from 'Frontend/config/constants';
import { PageErrorBoundary } from 'Frontend/components/ErrorBoundaries';

import './create.css';
import { useExamFormStates } from 'Frontend/hooks/useExamFormStates';
import { ExamDetailsForm, QuestionBuilderForm, QuestionsList } from 'Frontend/components/ExamFormComponents';

export default function CreateView() {
  const { authenticated, user, authInitialized, loading } = useAuth();
  const navigate = useNavigate();

  usePageMeta({ title: 'Create Exam', description: 'Create a new practice exam' });

  const examFormState = useExamForm({
    mode: 'create',
    authenticated,
    authInitialized,
    authLoading: loading
  });

  const { loadingComponent, authComponent } = useExamFormStates({
    authInitialized,
    loading,
    authenticated,
    onSignIn: () => navigate(ROUTES.LOGIN)
  });

  // Early returns for loading/auth states
  if (loadingComponent) return loadingComponent;
  if (authComponent) return authComponent;

  const {
    // Exam state
    exam, updateExamField, updateTags,
    // Question builder
    questionText, setQuestionText, options, addOption, removeOption, updateOption,
    correctAnswer, handleSingleCorrectAnswer, toggleMultipleCorrectAnswer,
    isMultipleAnswers, setIsMultipleAnswers, explanation, setExplanation,
    // Question management  
    addQuestion, startEditQuestion, removeQuestion, cancelEdit,
    editingQuestionIndex, isEditMode,
    // Validation
    isQuestionValid, isExamValid, validationErrors,
    submissionStage, submitMessage, submitExam
  } = examFormState;

  // Add null safety
  const safeExam = exam || { questions: [] };
  const safeValidationErrors = validationErrors || {};

  return (
    <PageErrorBoundary>
      <div className="exam-create-container">
        {/* Header */}
        <div className="create-header">
          <h1>Create New Exam</h1>
          {user && (
            <div className="user-info">
              <Icon icon="vaadin:user" />
              <span>Creating as {user.name}</span>
            </div>
          )}
        </div>

        {/* Exam Details Form */}
        <ExamDetailsForm
          exam={safeExam}
          validationErrors={safeValidationErrors}
          updateExamField={updateExamField}
          updateTags={updateTags}
        />

        {/* Question Builder Form */}
        <QuestionBuilderForm
          isEditMode={isEditMode}
          editingQuestionIndex={editingQuestionIndex}
          questionText={questionText}
          setQuestionText={setQuestionText}
          validationErrors={safeValidationErrors}
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
          exam={safeExam}
          editingQuestionIndex={editingQuestionIndex}
          startEditQuestion={startEditQuestion}
          removeQuestion={removeQuestion}
          isEditMode={isEditMode}
        />

        {/* Submit Section */}
        <div className="submit-section">
          {submitMessage && (
            <div className={`message ${submitMessage.type}`}>
              <Icon
                icon={submitMessage.type === 'success' ? 'vaadin:check-circle' :
                  submitMessage.type === 'warning' ? 'vaadin:warning' : 'vaadin:exclamation-circle'}
              />
              {submitMessage.text}
            </div>
          )}

          {safeValidationErrors.general && (
            <div className="validation-summary">
              <Icon icon="vaadin:exclamation-circle" />
              {safeValidationErrors.general}
            </div>
          )}

          <button
            onClick={submitExam}
            disabled={!isExamValid || isEditMode || submissionStage !== 'idle'}
            className={`btn-submit ${(isExamValid && !isEditMode && submissionStage !== 'navigating') ? 'enabled' : 'disabled'}`}
            type="button"
          >
            {submissionStage === 'saving' ? (
              <>
                <div className="spinner"></div>
                Creating Exam...
              </>
            ) : submissionStage === 'success' ? (
              <>
                <Icon className='submit-check success-pulse' icon="vaadin:check" />
                Exam Created!
              </>
            ) : submissionStage === 'navigating' ? (
              <>
                <Icon className='submit-check navigate-bounce' icon="vaadin:arrow-right" />
                Opening Exam...
              </>
            ) : (
              <>
                <Icon className='submit-check' icon="vaadin:check-circle-o" />
                Create Exam
              </>
            )}
          </button>

          {!isExamValid && !safeValidationErrors.general && (
            <div className="disabled-reason">
              <Icon icon="vaadin:info-circle" />
              {isEditMode ? 'Complete or cancel the current edit before submitting' :
                !safeExam.questions?.length ? 'Add at least one question to create the exam' :
                  safeValidationErrors.title ? 'Fix exam title to continue' :
                    safeValidationErrors.description ? 'Fix exam description to continue' :
                      'Complete all required fields to create exam'}
            </div>
          )}
        </div>
      </div>
    </PageErrorBoundary>
  );
}