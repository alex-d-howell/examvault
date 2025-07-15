import Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';
import Question from 'Frontend/generated/com/howell/examvault/base/domain/Question';
import { ExamService } from 'Frontend/generated/endpoints';
import { Icon, Button } from "@vaadin/react-components";
import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from "react-router";
import { useAuth } from 'Frontend/hooks/useAuth.js';
import './attempt.css';
import ExamAttempt from 'Frontend/generated/com/howell/examvault/base/domain/ExamAttempt';
import Answer from 'Frontend/generated/com/howell/examvault/base/domain/Answer';

// Define the type for answers state - always using arrays
interface AnswersState {
    [questionId: string]: string[];
}

// Interface for question results in detailed view
interface QuestionResult {
    questionId: string;
    userAnswer: string[];
    correctAnswer: string[];
    isCorrect: boolean;
}

export default function AttemptView() {
    const { examId } = useParams<{ examId: string }>();
    const { authenticated, user } = useAuth();
    const navigate = useNavigate();
    
    const [exam, setExam] = useState<Exam | null>(null);
    const [examAttempt, setExamAttempt] = useState<ExamAttempt | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<AnswersState>({});
    const [isExamSubmitted, setIsExamSubmitted] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);
    const [showSaveOption, setShowSaveOption] = useState(false);
    const [saveAttempt, setSaveAttempt] = useState(authenticated);
    const [submitting, setSubmitting] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
    const [startTime] = useState(new Date());
    const [showDetailedResults, setShowDetailedResults] = useState(false);

    // Update saveAttempt when authentication status changes
    useEffect(() => {
        setSaveAttempt(authenticated);
    }, [authenticated]);

    // Function to get question results using existing ExamAttempt structure
    const getQuestionResults = (): QuestionResult[] => {
        if (!examAttempt?.selectedAnswers || !exam?.questions) {
            return [];
        }
        
        // Create a map of user answers by questionId
        const userAnswersMap = new Map<string, string[]>();
        examAttempt.selectedAnswers.forEach((answer) => {
            if (answer?.questionId) {
                // Filter out undefined values from answerChoices
                const cleanAnswerChoices = (answer.answerChoices || []).filter((choice): choice is string => choice !== undefined);
                userAnswersMap.set(answer.questionId, cleanAnswerChoices);
            }
        });
        
        // Build question results by comparing user answers with correct answers
        return exam.questions.map((question) => {
            if (!question?.id) return null;
            
            const userAnswer = userAnswersMap.get(question.id) || [];
            const correctAnswer = (question.correctAnswers || []).filter((answer): answer is string => answer !== undefined);
            
            // Check if answer is correct (same length and contains all correct answers)
            const isCorrect = userAnswer.length === correctAnswer.length && 
                             correctAnswer.every(correct => userAnswer.includes(correct));
            
            return {
                questionId: question.id,
                userAnswer,
                correctAnswer,
                isCorrect
            };
        }).filter(result => result !== null) as QuestionResult[];
    };

    // Check if user has made any changes (answered any questions)
    const hasUnsavedChanges = () => {
        return !isExamSubmitted && Object.values(answers).some(answer => answer && answer.length > 0);
    };

    // Handle beforeunload event for browser navigation
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (hasUnsavedChanges()) {
                const message = 'You have unsaved changes. Are you sure you want to leave?';
                event.preventDefault();
                event.returnValue = message; // For older browsers
                return message;
            }
            return undefined; // Explicitly return undefined when no unsaved changes
        };

        // Add event listener
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [answers, isExamSubmitted]);

    // Handle internal navigation (back/forward buttons, link clicks)
    useEffect(() => {
        let isNavigating = false;

        const handlePopState = (event: PopStateEvent) => {
            if (hasUnsavedChanges() && !isNavigating) {
                event.preventDefault();
                // Push current state back to prevent navigation
                window.history.pushState(null, document.title, window.location.href);
                setShowLeaveDialog(true);
            }
        };

        // Listen for back/forward button clicks
        window.addEventListener('popstate', handlePopState);

        // Intercept all link clicks
        const handleLinkClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const link = target.closest('a');
            
            if (link && hasUnsavedChanges() && !isNavigating) {
                event.preventDefault();
                event.stopPropagation();
                setPendingNavigation(link.href);
                setShowLeaveDialog(true);
            }
        };

        document.addEventListener('click', handleLinkClick, true);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            document.removeEventListener('click', handleLinkClick, true);
            isNavigating = false;
        };
    }, [hasUnsavedChanges]);

    // Handle confirmed navigation
    const handleConfirmLeave = () => {
        setShowLeaveDialog(false);
        
        if (pendingNavigation) {
            // Navigate to the clicked link
            window.location.href = pendingNavigation;
        } else {
            // Handle back navigation
            window.history.back();
        }
        
        setPendingNavigation(null);
    };

    // Handle cancelled navigation
    const handleCancelLeave = () => {
        setShowLeaveDialog(false);
        setPendingNavigation(null);
    };

    useEffect(() => {
        const fetchExam = async () => {
            console.log('Exam ID from params:', examId);
            if (!examId) {
                setError('No exam ID provided');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                console.log('Fetching exam with ID:', examId);

                // Fetch the exam using the ExamService
                const fetchedExam = await ExamService.getExamById(examId);
                console.log('Fetched Exam:', fetchedExam);

                if (fetchedExam && fetchedExam.questions) {
                    // Create a new exam object with shuffled questions and options
                    const processedExam = {
                        ...fetchedExam,
                        questions: shuffleArray([...fetchedExam.questions.filter(q => q != null)])
                            .map(question => ({
                                ...question,
                                options: question?.options ? shuffleArray([...question.options]) : []
                            }))
                    };
                    setExam(processedExam);

                    // Initialize answers state with empty arrays for all questions
                    const initialAnswers: AnswersState = {};
                    processedExam.questions.forEach((question) => {
                        if (question?.id) {
                            initialAnswers[question.id] = [];
                        }
                    });
                    setAnswers(initialAnswers);
                } else {
                    setError('Exam not found');
                }

            } catch (err) {
                console.error('Error fetching exam:', err);
                setError('Failed to load exam. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchExam();
    }, [examId]);

    // For single answer questions (radio buttons) - now using arrays too
    const handleAnswerChange = useCallback((questionId: string, answer: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: [answer] // Always store as array, even for single answers
        }));
    }, []);

    // Updated for multiple answer questions (checkboxes)
    const handleMultipleAnswerChange = useCallback((questionId: string, option: string, checked: boolean) => {
        setAnswers(prev => {
            const currentAnswers = prev[questionId] || [];
            let newAnswers: string[];

            if (checked) {
                newAnswers = [...currentAnswers, option];
            } else {
                newAnswers = currentAnswers.filter((ans: string) => ans !== option);
            }

            return {
                ...prev,
                [questionId]: newAnswers
            };
        });
    }, []);

    const navigateToQuestion = (index: number) => {
        setCurrentQuestionIndex(index);
    };

    const nextQuestion = () => {
        if (exam?.questions && currentQuestionIndex < exam.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const previousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleSignInToSave = () => {
        // Store current exam state for restoration after login
        sessionStorage.setItem('examInProgress', JSON.stringify({
            examId,
            answers,
            startTime: startTime.toISOString(),
            currentQuestionIndex
        }));
        navigate('/login');
    };

    const handleSubmitExam = async () => {
        if (Object.keys(answers).length === 0) {
            setError('You must answer at least one question before submitting.');
            return;
        }

        // For anonymous users, show save option first
        if (!authenticated && !showSaveOption) {
            setShowSaveOption(true);
            setShowConfirmDialog(false);
            return;
        }

        setSubmitting(true);
        setShowConfirmDialog(false);
        setShowSaveOption(false);

        try {
            console.log('Raw answers:', answers);
            console.log('Save attempt preference:', saveAttempt);
            console.log('User authenticated:', authenticated);

            // Convert answers to the format expected by the backend
            const answersList = Object.entries(answers)
                .filter(([_, answerArray]) => answerArray.length > 0) // Only include answered questions
                .map(([questionId, answerArray]) => {
                    return {
                        questionId: questionId,
                        answerChoices: answerArray
                    };
                }) as Answer[];

            console.log('Formatted answers for submission:', answersList);

            const endTime = new Date();

            // Use the simpler 4-parameter method - backend will handle save logic internally
            const result = await ExamService.submitExamAttempt(
                examId!,
                startTime.toISOString(), 
                endTime.toISOString(), 
                answersList
            );

            setExamAttempt(result || null);
            setIsExamSubmitted(true);
            
            console.log('Exam submitted successfully');
            console.log('Exam Attempt:', result);
            console.log('Results saved:', authenticated); // Will be saved if user is authenticated

        } catch (err) {
            console.error('Error submitting exam:', err);
            setError('Failed to submit exam. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const getQuestionStatus = (questionId: string) => {
        const answer = answers[questionId];
        return answer && answer.length > 0 ? 'answered' : 'unanswered';
    };

    const getAnsweredCount = () => {
        return Object.values(answers).filter(answer => answer && answer.length > 0).length;
    };

    function shuffleArray<T>(array: T[]): T[] {
        const newArray = [...array]; // Create a copy to avoid mutation
        let currentIndex = newArray.length;
        let randomIndex: number;

        // While there remain elements to shuffle.
        while (currentIndex !== 0) {
            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [newArray[currentIndex], newArray[randomIndex]] = [
                newArray[randomIndex],
                newArray[currentIndex],
            ];
        }

        return newArray;
    }

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Loading Exam Details...</p>
                </div>
            </div>
        );
    }

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

    if (isExamSubmitted) {
        const scorePercentage = ((examAttempt?.numberCorrect || 0) / (exam.questions?.length || 1)) * 100;
        const questionResults = getQuestionResults();
        
        return (
            <div className="exam-submitted-container">
                <div className="exam-submitted-card">
                    <Icon icon="vaadin:check-circle" className="exam-submitted-icon"></Icon>
                    <h2 className="exam-submitted-title">Exam Complete!</h2>
                    
                    <div className="exam-results">
                        <h3 className="exam-title-result">{exam.title}</h3>
                        
                        {/* Score Summary */}
                        <div className="score-summary">
                            <div className="score-display">
                                <div className="score-number">
                                    {examAttempt?.numberCorrect || 0} / {exam.questions?.length || 0}
                                </div>
                                <div className="score-percentage">
                                    {Math.round(scorePercentage)}%
                                </div>
                            </div>
                            
                            <div className="score-breakdown">
                                <div className="breakdown-item correct">
                                    <Icon icon="vaadin:check" className="breakdown-icon" />
                                    <span>{examAttempt?.numberCorrect || 0} Correct</span>
                                </div>
                                <div className="breakdown-item incorrect">
                                    <Icon icon="vaadin:close" className="breakdown-icon" />
                                    <span>{(exam.questions?.length || 0) - (examAttempt?.numberCorrect || 0)} Incorrect</span>
                                </div>
                            </div>
                        </div>

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
                            <div className="detailed-results">
                                <h4 className="detailed-results-title">Question-by-Question Results</h4>
                                <div className="questions-results-list">
                                    {exam.questions?.map((question, index) => {
                                        const questionResult = questionResults.find(r => r.questionId === question?.id);
                                        const userAnswer = questionResult?.userAnswer || [];
                                        const correctAnswer = questionResult?.correctAnswer || [];
                                        const isCorrect = questionResult?.isCorrect || false;
                                        
                                        return (
                                            <div key={question?.id || index} className={`question-result ${isCorrect ? 'correct' : 'incorrect'}`}>
                                                <div className="question-result-header">
                                                    <div className="question-number">
                                                        Question {index + 1}
                                                    </div>
                                                    <div className={`result-indicator ${isCorrect ? 'correct' : 'incorrect'}`}>
                                                        <Icon 
                                                            icon={isCorrect ? "vaadin:check-circle" : "vaadin:close-circle"} 
                                                            className="result-icon"
                                                        />
                                                        <span>{isCorrect ? 'Correct' : 'Incorrect'}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="question-text-result">
                                                    {question?.questionText}
                                                </div>
                                                
                                                {/* Show explanation if available */}
                                                {question?.explanation && (
                                                    <div className="question-explanation">
                                                        <strong>Explanation:</strong>
                                                        <p>{question.explanation}</p>
                                                    </div>
                                                )}
                                                
                                                <div className="answers-comparison">
                                                    <div className="user-answer">
                                                        <strong>Your Answer:</strong>
                                                        <div className="answer-choices">
                                                            {userAnswer.length > 0 ? (
                                                                userAnswer.map((answer, i) => (
                                                                    <span key={i} className={`answer-choice ${isCorrect ? 'correct' : 'incorrect'}`}>
                                                                        {answer}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="no-answer">No answer provided</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {!isCorrect && correctAnswer.length > 0 && (
                                                        <div className="correct-answer">
                                                            <strong>Correct Answer:</strong>
                                                            <div className="answer-choices">
                                                                {correctAnswer.map((answer, i) => (
                                                                    <span key={i} className="answer-choice correct">
                                                                        {answer}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Authentication Status */}
                        {authenticated && (
                            <p className="save-status success">
                                ✓ Results saved to your account
                            </p>
                        )}
                        
                        {!authenticated && (
                            <div className="sign-in-prompt">
                                <p className="prompt-text">
                                    Want to track your progress and save your results?
                                </p>
                                <Button 
                                    onClick={() => navigate('/login')}
                                    theme="primary"
                                >
                                    Sign In with Google
                                </Button>
                            </div>
                        )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="result-actions">
                        <Button
                            onClick={() => navigate('/exams')}
                            theme="secondary"
                        >
                            Browse More Exams
                        </Button>
                        <Button
                            onClick={() => window.location.reload()}
                            theme="primary"
                        >
                            Retake Exam
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Check if exam questions exist
    if (!exam.questions || exam.questions.length === 0) {
        return (
            <div className="loading-container">
                <div className="loading-content">
                    <Icon icon="vaadin:exclamation-circle" className="error-icon"></Icon>
                    <p className="error-text">No questions available for this exam.</p>
                </div>
            </div>
        );
    }

    const currentQuestion = exam.questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion?.id || ''] || []; // Provide default empty array

    // Should not happen if the exam is properly structured...
    if (!currentQuestion) {
        return (
            <div className="loading-container">
                <div className="loading-content">
                    <Icon icon="vaadin:exclamation-circle" className="error-icon"></Icon>
                    <p className="error-text">There was an error loading this question...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="exam-container">
            {/* Header */}
            <div className="exam-header">
                <div className="exam-header-content">
                    <div className="exam-header-info">
                        <div>
                            <h1 className="exam-title">{exam.title}</h1>
                            <p className="exam-description">{exam.description}</p>
                            {!authenticated && (
                                <div className="auth-status">
                                    <Icon icon="vaadin:info-circle" />
                                    <span>Taking as anonymous user. </span>
                                    <button 
                                        onClick={() => navigate('/login')}
                                        className="inline-link"
                                    >
                                        Sign in
                                    </button>
                                    <span> to save results.</span>
                                </div>
                            )}
                            {authenticated && (
                                <div className="auth-status authenticated">
                                    <Icon icon="vaadin:check-circle" />
                                    <span>Signed in as {user?.name} - results will be saved</span>
                                </div>
                            )}
                        </div>
                        <div className="exam-header-controls">
                            <button
                                onClick={() => setShowConfirmDialog(true)}
                                className="submit-button"
                                disabled={submitting}
                            >
                                <Icon icon="vaadin:upload" className="submit-icon"></Icon>
                                <span>{submitting ? 'Submitting...' : 'Submit Exam'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="exam-content">
                {/* Question Navigation Sidebar */}
                <div className="sidebar">
                    <div className="navigation-panel">
                        <h3 className="navigation-title">Question Navigation</h3>
                        <div className="progress-text">
                            Progress: {getAnsweredCount()}/{exam.questions.length} answered
                        </div>
                        <div className="question-grid">
                            {exam.questions.map((question: Question | undefined, index: number) => (
                                <button
                                    key={question?.id || index}
                                    onClick={() => navigateToQuestion(index)}
                                    className={`question-button ${index === currentQuestionIndex
                                        ? 'question-button-current'
                                        : getQuestionStatus(question?.id || '') === 'answered'
                                            ? 'question-button-answered'
                                            : 'question-button-unanswered'
                                        }`}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>
                        <div className="legend">
                            <div className="legend-item">
                                <div className="legend-current"></div>
                                <span>Current</span>
                            </div>
                            <div className="legend-item">
                                <div className="legend-answered"></div>
                                <span>Answered</span>
                            </div>
                            <div className="legend-item">
                                <div className="legend-unanswered"></div>
                                <span>Not answered</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Question Area */}
                <div className="main-content">
                    <div className="question-panel">
                        <div className="question-header">
                            <div className="question-counter">
                                Question {currentQuestionIndex + 1} of {exam.questions.length}
                            </div>
                            {currentQuestion.isMultipleAnswers && (
                                <div className="multiple-answers-badge">
                                    Multiple answers allowed
                                </div>
                            )}
                        </div>

                        <h2 className="question-text">
                            {currentQuestion.questionText}
                        </h2>

                        <div className="options-container">
                            {currentQuestion.options?.map((option: string | undefined, index: number) => (
                                <div key={`${currentQuestion.id}-${index}`} className="option-item">
                                    {currentQuestion.isMultipleAnswers ? (
                                        <input
                                            type="checkbox"
                                            id={`option-${currentQuestion.id}-${index}`}
                                            checked={currentAnswer.includes(option || '')}
                                            onChange={(e) => handleMultipleAnswerChange(currentQuestion.id || '', (option || ''), e.target.checked)}
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
                                    <label
                                        htmlFor={`option-${currentQuestion.id}-${index}`}
                                        className="option-label"
                                    >
                                        {option}
                                    </label>
                                </div>
                            ))}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="navigation-controls">
                            <button
                                onClick={previousQuestion}
                                disabled={currentQuestionIndex === 0}
                                className="nav-button nav-button-secondary"
                            >
                                <Icon icon="vaadin:arrow-left" className="nav-icon"></Icon>
                                <span>Previous</span>
                            </button>
                            <button
                                onClick={nextQuestion}
                                disabled={currentQuestionIndex === exam.questions.length - 1}
                                className="nav-button nav-button-primary"
                            >
                                <span>Next</span>
                                <Icon icon="vaadin:arrow-right" className="nav-icon"></Icon>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Option Dialog for Anonymous Users */}
            {showSaveOption && !authenticated && (
                <div className="dialog-overlay">
                    <div className="dialog-content">
                        <div className="dialog-header">
                            <Icon icon="vaadin:question-circle" className="dialog-info-icon"></Icon>
                            <h3 className="dialog-title">Ready to Submit?</h3>
                        </div>
                        <p className="dialog-text">
                            You can complete this exam as an anonymous user, or sign in to save your results and track your progress.
                        </p>
                        <div className="dialog-actions">
                            <Button 
                                onClick={handleSignInToSave}
                                theme="primary"
                                className="dialog-button-primary"
                            >
                                Sign In and Save Results
                            </Button>
                            <Button 
                                onClick={() => {
                                    setSaveAttempt(false);
                                    setShowSaveOption(false);
                                    handleSubmitExam();
                                }}
                                theme="secondary"
                                className="dialog-button-secondary"
                            >
                                Continue Anonymously
                            </Button>
                            <Button 
                                onClick={() => setShowSaveOption(false)}
                                theme="tertiary"
                                className="dialog-button-tertiary"
                            >
                                Back to Exam
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
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
                            You have answered {getAnsweredCount()} out of {exam.questions.length} questions.
                        </p>
                        {authenticated && (
                            <p className="dialog-subtext">
                                Your results will be saved to your account.
                            </p>
                        )}
                        {!authenticated && (
                            <p className="dialog-subtext">
                                Results will not be saved. Sign in to track your progress.
                            </p>
                        )}
                        <div className="dialog-actions">
                            <button
                                onClick={() => setShowConfirmDialog(false)}
                                className="dialog-button-secondary"
                            >
                                Continue Exam
                            </button>
                            <button
                                onClick={handleSubmitExam}
                                className="dialog-button-primary"
                                disabled={submitting}
                            >
                                {submitting ? 'Submitting...' : 'Submit Exam'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Page Confirmation Dialog */}
            {showLeaveDialog && (
                <div className="dialog-overlay">
                    <div className="dialog-content">
                        <div className="dialog-header">
                            <Icon icon="vaadin:warning" className="dialog-warning-icon"></Icon>
                            <h3 className="dialog-title">Leave Page?</h3>
                        </div>
                        <p className="dialog-text">
                            You have unsaved changes to your exam. Are you sure you want to leave this page?
                        </p>
                        <p className="dialog-subtext">
                            Your progress will be lost if you leave without submitting.
                        </p>
                        <div className="dialog-actions">
                            <button
                                onClick={handleCancelLeave}
                                className="dialog-button-secondary"
                            >
                                Stay on Page
                            </button>
                            <button
                                onClick={handleConfirmLeave}
                                className="dialog-button-primary"
                            >
                                Leave Page
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}