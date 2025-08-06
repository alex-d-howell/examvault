import { Icon } from '@vaadin/react-components';

interface UseExamFormStatesProps {
  authInitialized: boolean;
  loading: boolean;
  authenticated: boolean;
  onSignIn: () => void;
}

export const useExamFormStates = ({ authInitialized, loading, authenticated, onSignIn }: UseExamFormStatesProps) => {
  const loadingComponent =
    !authInitialized || loading ? (
      <div className="exam-create-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    ) : null;

  const authComponent =
    !authenticated && authInitialized && !loading ? (
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
    ) : null;

  return {
    loadingComponent,
    authComponent,
  };
};
