import Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';
import Question from 'Frontend/generated/com/howell/examvault/base/domain/Question';
import { ExamService } from 'Frontend/generated/endpoints';
import { Icon } from "@vaadin/react-components";
import { useState, useCallback, useEffect } from 'react';
import { useParams } from "react-router";
import './attempt.css';
import ExamAttempt from 'Frontend/generated/com/howell/examvault/base/domain/ExamAttempt';
import Answer from 'Frontend/generated/com/howell/examvault/base/domain/Answer';

// Define the type for answers state - always using arrays
interface AnswersState {
    [questionId: string]: string[];
}

export default function AttemptView() {
    const { examId } = useParams<{ examId: string }>();
    const [exam, setExam] = useState<Exam | null>(null);
    const [examAttempt, setExamAttempt] = useState<ExamAttempt | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<AnswersState>({});
    const [isExamSubmitted, setIsExamSubmitted] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

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

    // Handle beforeunload event for browser navigation (refresh, close tab, etc.)
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (hasUnsavedChanges()) {
                const message = 'You have unsaved changes. Are you sure you want to leave?';
                event.preventDefault();
                event.returnValue = message;
                return message;
            }
            return undefined;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [answers, isExamSubmitted]);

    // Handle internal navigation (back/forward buttons, link clicks)
    useEffect(() => {
        let isNavigating = false;

        const handleBeforeNavigation = () => {
            if (hasUnsavedChanges() && !isNavigating) {
                isNavigating = true;
                setShowLeaveDialog(true);
                return false; // Prevent navigation
            }
            return true; // Allow navigation
        };

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

    const handleSubmitExam = () => {
        if (Object.keys(answers).length === 0) {
            setError('You must answer at least one question before submitting.');
            return;
        }

        console.log('Raw answers:', answers);

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

        // Submit the exam answers
        ExamService.submitExamAttempt(examId, new Date().getTime().toString(), new Date().getTime().toString(), answersList)
            .then((result) => {
                setExamAttempt(result || null);
                console.log('Exam submitted successfully');
                console.log('Exam Attempt:', result);
            })
            .catch((err: any) => {
                console.error('Error submitting exam:', err);
                setError('Failed to submit exam. Please try again.');
            });

        setIsExamSubmitted(true);
        setShowConfirmDialog(false);
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
        return (
            <div className="exam-submitted-container">
                <div className="exam-submitted-card">
                    <Icon icon="vaadin:check-circle" className="exam-submitted-icon"></Icon>
                    <h2 className="exam-submitted-title">Exam Submitted!</h2>
                    <p className="exam-submitted-text">
                        {`Your exam "${exam.title}" has been successfully submitted.`}
                        {`Score: ${((examAttempt?.numberCorrect || 0) / (exam.questions?.length || 0)) * 100}%`}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="exam-submitted-button"
                    >
                        Return to Dashboard
                    </button>
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
                        </div>
                        <div className="exam-header-controls">
                            <button
                                onClick={() => setShowConfirmDialog(true)}
                                className="submit-button"
                            >
                                <Icon icon="vaadin:upload" className="submit-icon"></Icon>
                                <span>Submit Exam</span>
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
                            >
                                Submit Exam
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