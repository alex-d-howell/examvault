import { Icon, Button } from "@vaadin/react-components";
import { useState } from 'react';
import { useParams } from "react-router";
import { useAuth } from 'Frontend/hooks/useAuth.js';
import { useExamAttempt } from 'Frontend/hooks/useExamAttempt';
import { useAnswerState } from 'Frontend/hooks/useAnswerState';
import { useExamSubmission } from 'Frontend/hooks/useExamSubmission';
import { useAttemptDialogs } from 'Frontend/hooks/useAttemptDialogs';
import { useUnsavedChanges } from 'Frontend/hooks/useUnsavedChanges';


import './attempt.css';
import { ExamAttemptSkeleton, ResultsSkeleton } from "Frontend/components/AttemptLoadingSkeletons";
import { ExamErrorBoundary, PageErrorBoundary } from "Frontend/components/ErrorBoundaries";

export default function AttemptView() {
    const { examId } = useParams<{ examId: string }>();
    const { authenticated, user } = useAuth();
    const [startTime] = useState(new Date());
    const [showDetailedResults, setShowDetailedResults] = useState(false);
    const {
        exam, loading, error, currentQuestionIndex, currentQuestion,
        navigateToQuestion, nextQuestion, previousQuestion, totalQuestions,
        canGoNext, canGoPrevious
    } = useExamAttempt(examId);

    const {
        answers, handleAnswerChange, handleMultipleAnswerChange,
        getQuestionStatus, getAnsweredCount, getCurrentAnswer, canSubmit
    } = useAnswerState(exam);

    const {
        submitting, isExamSubmitted, examAttempt, questionResults, scorePercentage,
        submitExam, showSaveOption, setShowSaveOption, handleSignInToSave,
        submissionError
    } = useExamSubmission(authenticated, exam);

    const {
        showConfirmDialog, showLeaveDialog, openConfirmDialog, closeConfirmDialog,
        pendingNavigation, setPendingNavigation, handleConfirmSubmit,
        handleConfirmLeave, handleCancelLeave
    } = useAttemptDialogs();

    const { hasUnsavedChanges } = useUnsavedChanges({
        hasChanges: Object.values(answers).some(answer => answer && answer.length > 0),
        isSubmitted: isExamSubmitted,
        onNavigationAttempt: (url) => {
            setPendingNavigation(url || null);
            // Note: We'd need to connect this to the dialog opening logic
        }
    });

    const handleSubmit = async () => {
        if (!examId || !canSubmit) return;
        await submitExam(answers, examId, startTime);
    };

    // Loading state
    if (loading) {
        return <ExamAttemptSkeleton />;
    }

    // Error state
    if (!exam || error) {
        return (
            <div className="loading-container">
                <div className="loading-content">
                    <Icon icon="vaadin:exclamation-circle" className="error-icon"></Icon>
                    <p className="error-text">{error || "Exam not found"}</p>
                </div>
            </div>
        );
    }

    // Results view
    if (isExamSubmitted) {
        return (
            <PageErrorBoundary>
                {submitting ? (
                    <ResultsSkeleton />
                ) : (
                    <div className="exam-submitted-container">
                        <div className="exam-submitted-card">
                            <Icon icon="vaadin:check-circle" className="exam-submitted-icon"></Icon>
                            <h2 className="exam-submitted-title">Exam Complete!</h2>

                            <div className="exam-results">
                                <h3 className="exam-title-result">{exam.title}</h3>

                                {/* Score Summary */}
                                <ExamErrorBoundary>
                                    <div className="score-summary">
                                        <div className="score-display">
                                            <div className="score-number">
                                                {examAttempt?.numberCorrect || 0} / {totalQuestions}
                                            </div>
                                            <div className="score-percentage">
                                                {scorePercentage}%
                                            </div>
                                        </div>

                                        <div className="score-breakdown">
                                            <div className="breakdown-item correct">
                                                <Icon icon="vaadin:check" className="breakdown-icon" />
                                                <span>{examAttempt?.numberCorrect || 0} Correct</span>
                                            </div>
                                            <div className="breakdown-item incorrect">
                                                <Icon icon="vaadin:close" className="breakdown-icon" />
                                                <span>{totalQuestions - (examAttempt?.numberCorrect || 0)} Incorrect</span>
                                            </div>
                                        </div>
                                    </div>
                                </ExamErrorBoundary>

                                {/* Toggle Detailed Results */}
                                <div className="results-toggle">
                                    <Button
                                        onClick={() => setShowDetailedResults(!showDetailedResults)}
                                        theme="tertiary"
                                        className="toggle-details-btn"
                                    >
                                        <Icon
                                            icon={showDetailedResults ? "vaadin:chevron-up" : "vaadin:chevron-down"}
                                            className="toggle-icon"
                                        />
                                        {showDetailedResults ? 'Hide' : 'Show'} Question Details
                                    </Button>
                                </div>

                                {/* Detailed Results */}
                                {showDetailedResults && (
                                    <ExamErrorBoundary>
                                        <div className="detailed-results">
                                            <h4 className="detailed-results-title">Question-by-Question Results</h4>
                                            <div className="questions-results-list">
                                                {questionResults.map((result, index) => (
                                                    <div key={result.questionId} className={`question-result ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                                                        <div className="question-result-header">
                                                            <div className="question-number">Question {index + 1}</div>
                                                            <div className={`result-indicator ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                                                                <Icon
                                                                    icon={result.isCorrect ? "vaadin:check-circle" : "vaadin:close-circle"}
                                                                    className="result-icon"
                                                                />
                                                                <span>{result.isCorrect ? 'Correct' : 'Incorrect'}</span>
                                                            </div>
                                                        </div>

                                                        <div className="question-text-result">
                                                            {exam.questions?.[index]?.questionText}
                                                        </div>

                                                        <div className="answers-comparison">
                                                            <div className="user-answer">
                                                                <strong>Your Answer:</strong>
                                                                <div className="answer-choices">
                                                                    {result.userAnswer.length > 0 ? (
                                                                        result.userAnswer.map((answer, i) => (
                                                                            <span key={i} className={`answer-choice ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                                                                                {answer}
                                                                            </span>
                                                                        ))
                                                                    ) : (
                                                                        <span className="no-answer">No answer provided</span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {!result.isCorrect && (
                                                                <div className="correct-answer">
                                                                    <strong>Correct Answer:</strong>
                                                                    <div className="answer-choices">
                                                                        {result.correctAnswer.map((answer, i) => (
                                                                            <span key={i} className="answer-choice correct">
                                                                                {answer}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </ExamErrorBoundary>
                                )}

                                {/* Authentication Status */}
                                {authenticated ? (
                                    <p className="save-status success">✓ Results saved to your account</p>
                                ) : (
                                    <div className="sign-in-prompt">
                                        <p className="prompt-text">Want to track your progress and save your results?</p>
                                        <Button onClick={() => handleSignInToSave(examId!, answers, startTime, currentQuestionIndex)} theme="primary">
                                            Sign In with Google
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="result-actions">
                                <Button onClick={() => window.location.href = '/exams'} theme="secondary">
                                    Browse More Exams
                                </Button>
                                <Button onClick={() => window.location.reload()} theme="primary">
                                    Retake Exam
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </PageErrorBoundary>
        );
    }

    // Main exam interface
    const currentAnswer = getCurrentAnswer(currentQuestion?.id || '');

    return (
        <PageErrorBoundary>
            <div className="exam-container">
                {/* Header */}
                <ExamErrorBoundary>
                    <div className="exam-header">
                        <div className="exam-header-content">
                            <div className="exam-header-info">
                                <div>
                                    <h1 className="exam-title">{exam.title}</h1>
                                    <p className="exam-description">{exam.description}</p>
                                    <div className={`auth-status ${authenticated ? 'authenticated' : ''}`}>
                                        <Icon icon={authenticated ? "vaadin:check-circle" : "vaadin:info-circle"} />
                                        <span>
                                            {authenticated
                                                ? `Signed in as ${user?.name} - results will be saved`
                                                : 'Taking as anonymous user. Sign in to save results.'
                                            }
                                        </span>
                                    </div>
                                </div>
                                <div className="exam-header-controls">
                                    <button
                                        onClick={openConfirmDialog}
                                        className="submit-button"
                                        disabled={submitting || !canSubmit}
                                    >
                                        <Icon icon="vaadin:upload" className="submit-icon"></Icon>
                                        <span>{submitting ? 'Submitting...' : 'Submit Exam'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </ExamErrorBoundary>

                <div className="exam-content">
                    {/* Sidebar */}
                    <ExamErrorBoundary>
                        <div className="sidebar">
                            <div className="navigation-panel">
                                <h3 className="navigation-title">Question Navigation</h3>
                                <div className="progress-text">
                                    Progress: {getAnsweredCount()}/{totalQuestions} answered
                                </div>
                                <div className="question-grid">
                                    {exam.questions?.map((question, index) => (
                                        <button
                                            key={question?.id || index}
                                            onClick={() => navigateToQuestion(index)}
                                            className={`question-button ${index === currentQuestionIndex ? 'question-button-current' :
                                                    getQuestionStatus(question?.id || '') === 'answered' ? 'question-button-answered' :
                                                        'question-button-unanswered'
                                                }`}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ExamErrorBoundary>

                    {/* Main Question Area */}
                    <ExamErrorBoundary>
                        <div className="main-content">
                            <div className="question-panel">
                                <div className="question-header">
                                    <div className="question-counter">
                                        Question {currentQuestionIndex + 1} of {totalQuestions}
                                    </div>
                                    {currentQuestion?.isMultipleAnswers && (
                                        <div className="multiple-answers-badge">Multiple answers allowed</div>
                                    )}
                                </div>

                                <h2 className="question-text">{currentQuestion?.questionText}</h2>

                                <div className="options-container">
                                    {currentQuestion?.options?.map((option, index) => (
                                        <div key={`${currentQuestion.id}-${index}`} className="option-item">
                                            {currentQuestion.isMultipleAnswers ? (
                                                <input
                                                    type="checkbox"
                                                    id={`option-${currentQuestion.id}-${index}`}
                                                    checked={currentAnswer.includes(option || '')}
                                                    onChange={(e) => handleMultipleAnswerChange(
                                                        currentQuestion.id || '',
                                                        option || '',
                                                        e.target.checked
                                                    )}
                                                    className="option-checkbox"
                                                />
                                            ) : (
                                                <input
                                                    type="radio"
                                                    id={`option-${currentQuestion.id}-${index}`}
                                                    name={`question-${currentQuestion.id}`}
                                                    value={option || ''}
                                                    checked={currentAnswer.includes(option || '')}
                                                    onChange={(e) => handleAnswerChange(currentQuestion.id || '', e.target.value)}
                                                    className="option-radio"
                                                />
                                            )}
                                            <label htmlFor={`option-${currentQuestion.id}-${index}`} className="option-label">
                                                {option}
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                {/* Navigation */}
                                <div className="navigation-controls">
                                    <button
                                        onClick={previousQuestion}
                                        disabled={!canGoPrevious}
                                        className="nav-button nav-button-secondary"
                                    >
                                        <Icon icon="vaadin:arrow-left" className="nav-icon"></Icon>
                                        <span>Previous</span>
                                    </button>
                                    <button
                                        onClick={nextQuestion}
                                        disabled={!canGoNext}
                                        className="nav-button nav-button-primary"
                                    >
                                        <span>Next</span>
                                        <Icon icon="vaadin:arrow-right" className="nav-icon"></Icon>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </ExamErrorBoundary>
                </div>

                {/* Dialogs */}
                {showSaveOption && !authenticated && (
                    <div className="dialog-overlay">
                        <div className="dialog-content">
                            <div className="dialog-header">
                                <Icon icon="vaadin:question-circle" className="dialog-info-icon"></Icon>
                                <h3 className="dialog-title">Ready to Submit?</h3>
                            </div>
                            <p className="dialog-text">
                                You can complete this exam as an anonymous user, or sign in to save your results.
                            </p>
                            <div className="dialog-actions">
                                <Button
                                    onClick={() => handleSignInToSave(examId!, answers, startTime, currentQuestionIndex)}
                                    theme="primary"
                                >
                                    Sign In and Save Results
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowSaveOption(false);
                                        handleSubmit();
                                    }}
                                    theme="secondary"
                                >
                                    Continue Anonymously
                                </Button>
                                <Button onClick={() => setShowSaveOption(false)} theme="tertiary">
                                    Back to Exam
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {showConfirmDialog && (
                    <div className="dialog-overlay">
                        <div className="dialog-content">
                            <div className="dialog-header">
                                <Icon icon="vaadin:warning" className="dialog-warning-icon"></Icon>
                                <h3 className="dialog-title">Submit Exam?</h3>
                            </div>
                            <p className="dialog-text">
                                Are you sure you want to submit your exam? This action cannot be undone.
                            </p>
                            <p className="dialog-subtext">
                                You have answered {getAnsweredCount()} out of {totalQuestions} questions.
                            </p>
                            <div className="dialog-actions">
                                <button onClick={closeConfirmDialog} className="dialog-button-secondary">
                                    Continue Exam
                                </button>
                                <button
                                    onClick={() => handleConfirmSubmit(handleSubmit)}
                                    className="dialog-button-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Exam'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showLeaveDialog && (
                    <div className="dialog-overlay">
                        <div className="dialog-content">
                            <div className="dialog-header">
                                <Icon icon="vaadin:warning" className="dialog-warning-icon"></Icon>
                                <h3 className="dialog-title">Leave Page?</h3>
                            </div>
                            <p className="dialog-text">
                                You have unsaved changes. Are you sure you want to leave this page?
                            </p>
                            <div className="dialog-actions">
                                <button onClick={handleCancelLeave} className="dialog-button-secondary">
                                    Stay on Page
                                </button>
                                <button onClick={handleConfirmLeave} className="dialog-button-primary">
                                    Leave Page
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageErrorBoundary>
    );
}