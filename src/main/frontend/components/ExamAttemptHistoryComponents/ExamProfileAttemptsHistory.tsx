import React, { useEffect } from 'react';
import { Icon, Button } from '@vaadin/react-components';
import { useExamAttemptsModal } from 'Frontend/hooks/useExamAttemptModal';
import { ExamAttemptsListModal, ExamAttemptDetailModal } from 'Frontend/components/ExamAttemptHistoryComponents/ExamAttemptHistoryComponents';
import { ExamErrorBoundary } from 'Frontend/components/ErrorBoundaries';

interface ExamAttemptsStatsProps {
    examId: string;
    examTitle: string;
    authenticated: boolean;
}

export const ExamAttemptsStats: React.FC<ExamAttemptsStatsProps> = ({
    examId,
    examTitle,
    authenticated,
}) => {
    const examAttemptsModal = useExamAttemptsModal();

    // Load data when component mounts (for exam detail page)
    useEffect(() => {
        if (authenticated && examId) {
            examAttemptsModal.openAttemptsModal(examId, examTitle);
            // Immediately close the modal but keep the data loaded
            examAttemptsModal.closeModal();
        }
    }, [authenticated, examId, examTitle]);

    const handleViewAttempts = () => {
        examAttemptsModal.openAttemptsModal(examId, examTitle);
    };

    if (!authenticated) {
        return (
            <div className="exam-attempts-section">
                <div className="exam-attempts-header">
                    <h2 className="section-title">
                        <Icon icon="vaadin:chart" className="section-icon" />
                        Attempt History
                    </h2>
                </div>
                <div className="exam-attempts-signin-prompt">
                    <Icon icon="vaadin:info-circle" className="prompt-icon" />
                    <p>Sign in to view your attempt history and track your progress.</p>
                </div>
            </div>
        );
    }

    return (
        <ExamErrorBoundary>
            <div className="exam-attempts-section">
                <div className="exam-attempts-header">
                    <h2 className="section-title">
                        <Icon icon="vaadin:chart" className="section-icon" />
                        Your Attempt History
                    </h2>
                    <Button
                        onClick={handleViewAttempts}
                        theme="tertiary small"
                        className="view-attempts-button"
                    >
                        <Icon icon="vaadin:eye" slot="prefix" />
                        View All Attempts
                    </Button>
                </div>

                {/* Quick stats display */}
                <div className="exam-attempts-quick-stats">
                    {examAttemptsModal.stats.totalAttempts > 0 ? (
                        <div className="quick-stats-grid">
                            <div className="quick-stat-card">
                                <div className="quick-stat-value">{examAttemptsModal.stats.totalAttempts}</div>
                                <div className="quick-stat-label">Attempts</div>
                            </div>
                            <div className="quick-stat-card">
                                <div className="quick-stat-value">{examAttemptsModal.stats.bestPercentage}%</div>
                                <div className="quick-stat-label">Best Score</div>
                            </div>
                            <div className="quick-stat-card">
                                <div className="quick-stat-value">{examAttemptsModal.stats.averagePercentage}%</div>
                                <div className="quick-stat-label">Average</div>
                            </div>
                        </div>
                    ) : (
                        <div className="no-attempts-message">
                            <Icon icon="vaadin:chart-timeline" className="no-attempts-icon" />
                            <p>You haven't attempted this exam yet.</p>
                            <p className="no-attempts-subtext">Your attempt history will appear here after you take the exam.</p>
                        </div>
                    )}
                </div>

                {/* Modals */}
                <ExamAttemptsListModal
                    isOpen={examAttemptsModal.currentView === 'list'}
                    onClose={examAttemptsModal.closeModal}
                    examTitle={examTitle}
                    attempts={examAttemptsModal.attempts}
                    stats={examAttemptsModal.stats}
                    isLoading={examAttemptsModal.isLoading}
                    isError={examAttemptsModal.isError}
                    error={examAttemptsModal.error}
                    onAttemptClick={examAttemptsModal.openDetailModal}
                    getPercentage={examAttemptsModal.getPercentage}
                    getTimeSpent={examAttemptsModal.getTimeSpent}
                />

                <ExamAttemptDetailModal
                    isOpen={examAttemptsModal.currentView === 'detail'}
                    onClose={examAttemptsModal.closeModal}
                    onBack={examAttemptsModal.goBackToList}
                    attempt={examAttemptsModal.selectedAttempt!}
                    examTitle={examTitle}
                    getPercentage={examAttemptsModal.getPercentage}
                    getTimeSpent={examAttemptsModal.getTimeSpent}
                />
            </div>
        </ExamErrorBoundary>
    );
};