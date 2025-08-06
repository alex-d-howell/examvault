import React from 'react';
import type ExamAttempt from 'Frontend/generated/com/howell/examvault/base/domain/ExamAttempt';
import './ExamAttemptHistoryComponents.css';

interface ExamAttemptsListModalProps {
    isOpen: boolean;
    onClose: () => void;
    examTitle: string;
    attempts: ExamAttempt[];
    stats: {
        totalAttempts: number;
        bestScore: number;
        averageScore: number;
        bestPercentage: number;
        averagePercentage: number;
        lastAttemptDate: string | null;
    };
    isLoading: boolean;
    isError: boolean;
    error: string | null;
    onAttemptClick: (attempt: ExamAttempt) => void;
    getPercentage: (attempt: ExamAttempt) => number;
    getTimeSpent: (attempt: ExamAttempt) => number;
}

export const ExamAttemptsListModal: React.FC<ExamAttemptsListModalProps> = ({
    isOpen,
    onClose,
    examTitle,
    attempts,
    stats,
    isLoading,
    isError,
    error,
    onAttemptClick,
    getPercentage,
    getTimeSpent,
}) => {
    if (!isOpen) return null;

    const formatDate = (instant?: any) => {
        if (!instant) return 'Unknown date';
        try {
            const date = new Date(instant.toString());
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return 'Invalid date';
        }
    };

    const formatTimeSpent = (seconds: number) => {
        if (seconds === 0) return '0s';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (minutes === 0) {
            return `${remainingSeconds}s`;
        }
        return `${minutes}m ${remainingSeconds}s`;
    };

    const getTotalQuestions = (attempt: ExamAttempt): number => {
        return attempt.exam?.questions?.length || 0;
    };

    return (
        <div className="exam-attempts-modal-overlay" onClick={onClose}>
            <div className="exam-attempts-modal" onClick={(e) => e.stopPropagation()}>
                <div className="exam-attempts-modal-header">
                    <h2 className="exam-attempts-modal-title">
                        Attempt History: {examTitle}
                    </h2>
                    <button className="exam-attempts-modal-close" onClick={onClose}>
                        X
                    </button>
                </div>

                <div className="exam-attempts-modal-content">
                    {isLoading && (
                        <div className="exam-attempts-loading">
                            <div className="exam-attempts-loading-spinner"></div>
                            <span>Loading attempts...</span>
                        </div>
                    )}

                    {isError && (
                        <div className="exam-attempts-error">
                            <div>
                                <h3>Error Loading Attempts</h3>
                                <p>{error || 'Failed to load exam attempts'}</p>
                            </div>
                        </div>
                    )}

                    {!isLoading && !isError && (
                        <>
                            {/* Summary Statistics */}
                            <div className="exam-attempts-stats">
                                <div className="exam-attempts-stats-grid">
                                    <div className="exam-attempts-stat-card">
                                        <div className="exam-attempts-stat-value">{stats.totalAttempts}</div>
                                        <div className="exam-attempts-stat-label">Total Attempts</div>
                                    </div>
                                    <div className="exam-attempts-stat-card">
                                        <div className="exam-attempts-stat-value">{stats.bestPercentage}%</div>
                                        <div className="exam-attempts-stat-label">Best Score</div>
                                    </div>
                                    <div className="exam-attempts-stat-card">
                                        <div className="exam-attempts-stat-value">{stats.averagePercentage}%</div>
                                        <div className="exam-attempts-stat-label">Average Score</div>
                                    </div>
                                </div>
                            </div>

                            {/* Attempts List */}
                            {attempts.length === 0 ? (
                                <div className="exam-attempts-empty">
                                    <h3>No Attempts Yet...</h3>
                                    <p>You haven't attempted this exam yet.</p>
                                </div>
                            ) : (
                                <div className="exam-attempts-list">
                                    <h3 className="exam-attempts-list-title">Recent Attempts</h3>
                                    {attempts.map((attempt, index) => {
                                        const percentage = getPercentage(attempt);
                                        const timeSpent = getTimeSpent(attempt);
                                        const totalQuestions = getTotalQuestions(attempt);

                                        return (
                                            <div
                                                key={attempt.id?.toString() || `attempt-${index}`}
                                                className="exam-attempt-item"
                                                onClick={() => onAttemptClick(attempt)}
                                            >
                                                <div className="exam-attempt-item-header">
                                                    <div className="exam-attempt-item-number">
                                                        Attempt #{attempts.length - index}
                                                    </div>
                                                    <div className="exam-attempt-item-score-badge">
                                                        {percentage}%
                                                    </div>
                                                </div>

                                                <div className="exam-attempt-item-content">
                                                    <div className="exam-attempt-item-score">
                                                        <span className="exam-attempt-score-value">{percentage}%</span>
                                                        <span className="exam-attempt-score-details">
                                                            ({attempt.numberCorrect || 0}/{totalQuestions} correct)
                                                        </span>
                                                    </div>

                                                    <div className="exam-attempt-item-meta">
                                                        <div className="exam-attempt-item-date">
                                                            {formatDate(attempt.startTime)}
                                                        </div>
                                                        <div className="exam-attempt-item-time">
                                                            Time: {formatTimeSpent(timeSpent)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="exam-attempt-item-arrow">→</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

interface ExamAttemptDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    attempt: ExamAttempt;
    examTitle: string;
    getPercentage: (attempt: ExamAttempt) => number;
    getTimeSpent: (attempt: ExamAttempt) => number;
}

export const ExamAttemptDetailModal: React.FC<ExamAttemptDetailModalProps> = ({
    isOpen,
    onClose,
    onBack,
    attempt,
    examTitle,
    getPercentage,
    getTimeSpent,
}) => {
    if (!isOpen || !attempt) return null;

    const formatDate = (instant?: any) => {
        if (!instant) return 'Unknown date';
        try {
            const date = new Date(instant.toString());
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return 'Invalid date';
        }
    };

    const formatTimeSpent = (seconds: number) => {
        if (seconds === 0) return '0s';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${remainingSeconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${remainingSeconds}s`;
    };

    const percentage = getPercentage(attempt);
    const timeSpent = getTimeSpent(attempt);
    const totalQuestions = attempt.exam?.questions?.length || 0;

    return (
        <div className="exam-attempts-modal-overlay" onClick={onClose}>
            <div className="exam-attempts-modal exam-attempts-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="exam-attempts-modal-header">
                    <button className="exam-attempts-back-button" onClick={onBack}>
                        Back
                    </button>
                    <h2 className="exam-attempts-modal-title">
                        Attempt Details: {examTitle}
                    </h2>
                    <button className="exam-attempts-modal-close" onClick={onClose}>
                        X
                    </button>
                </div>

                <div className="exam-attempts-modal-content">
                    {/* Attempt Summary */}
                    <div className="exam-attempt-summary">
                        <div className="exam-attempt-summary-header">
                            <div className="exam-attempt-summary-score">
                                {percentage}%
                            </div>
                        </div>

                        <div className="exam-attempt-summary-details">
                            <div className="exam-attempt-summary-grid">
                                <div className="exam-attempt-summary-item">
                                    <span className="label">Score:</span>
                                    <span className="value">{attempt.numberCorrect || 0}/{totalQuestions} correct</span>
                                </div>
                                <div className="exam-attempt-summary-item">
                                    <span className="label">Time Taken:</span>
                                    <span className="value">{formatTimeSpent(timeSpent)}</span>
                                </div>
                                <div className="exam-attempt-summary-item">
                                    <span className="label">Started:</span>
                                    <span className="value">{formatDate(attempt.startTime)}</span>
                                </div>
                                <div className="exam-attempt-summary-item">
                                    <span className="label">Completed:</span>
                                    <span className="value">{formatDate(attempt.endTime)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Question Review */}
                    <div className="exam-attempt-questions">
                        <h3 className="exam-attempt-questions-title">Question Review</h3>

                        {!attempt.selectedAnswers || attempt.selectedAnswers.length === 0 ? (
                            <div className="exam-attempts-empty">
                                <h4>No Detailed Results</h4>
                                <p>Detailed question-by-question results are not available for this attempt.</p>
                            </div>
                        ) : (
                            <div className="exam-attempt-questions-note">
                                <p><strong>Note:</strong> This shows your selected answers. Detailed question analysis with correct answers and explanations would require additional implementation to map your Answer entities to the original questions.</p>

                                <div className="selected-answers-list">
                                    {attempt.selectedAnswers.map((answer, index) => (
                                        <div key={answer?.id?.toString() || `answer-${index}`} className="selected-answer-item">
                                            <div className="answer-header">
                                                <span className="answer-number">Answer {index + 1}</span>
                                            </div>
                                            <div className="answer-content">
                                                <p><strong>Question ID:</strong> {answer?.questionId?.toString() || 'Unknown'}</p>
                                                <p><strong>Selected:</strong> {answer?.answerChoices?.join(', ') || 'No selection'}</p>
                                                {answer?.isCorrect !== undefined && (
                                                    <p className={`answer-result ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                                                        <strong>Result:</strong> {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};