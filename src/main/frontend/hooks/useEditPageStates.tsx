import { Icon } from '@vaadin/react-components';

interface LoadingState {
  isLoading: boolean;
  checkingAuth: boolean;
  checkingPermissions: boolean;
  error: string | null;
}

interface UseEditPageStatesProps {
  loadingState: LoadingState;
  examId?: string;
}

export const useEditPageStates = ({ loadingState, examId }: UseEditPageStatesProps) => {
  // Error takes priority over loading states
  const hasError = loadingState.error && loadingState.error.trim() !== '';
  const hasLoadingState = loadingState.checkingAuth || loadingState.checkingPermissions || loadingState.isLoading;

  const loadingComponent = !hasError && hasLoadingState ? (
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
  ) : null;

  const errorComponent = hasError ? (
    <div className="exam-edit-container">
      <div className="error-state">
        <Icon icon="vaadin:exclamation-circle" className="error-icon" />
        <h2>Access Denied</h2>
        <p>{loadingState.error}</p>
        <div className="error-actions">
          <button onClick={() => (window.location.href = '/exams')} className="btn-primary">
            Browse Exams
          </button>
          {examId && examId.trim() !== '' && (
            <button onClick={() => (window.location.href = `/exams/${examId}`)} className="btn-secondary">
              View Exam Details
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return { loadingComponent, errorComponent };
};