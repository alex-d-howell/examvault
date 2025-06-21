import Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';
import Question from 'Frontend/generated/com/howell/examvault/base/domain/Question';
import { ExamService } from 'Frontend/generated/endpoints';
import { Icon } from "@vaadin/react-components";
import { useState, useCallback, useEffect } from 'react';
import { useParams } from "react-router";
import './attempt.css';

// Define the type for answers state
interface AnswersState {
    [questionId: string]: string;
}

export default function AttemptView() {
    const { examId } = useParams<{ examId: string }>();
    const [exam, setExam] = useState<Exam | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<AnswersState>({});
    const [isExamSubmitted, setIsExamSubmitted] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

                if (fetchedExam) {
                    setExam(fetchedExam);
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

    const handleAnswerChange = useCallback((questionId: string, answer: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    }, []);

    const handleMultipleAnswerChange = useCallback((questionId: string, option: string, checked: boolean) => {
        setAnswers(prev => {
            const currentAnswers = prev[questionId] ? prev[questionId].split(',') : [];
            let newAnswers: string[];

            if (checked) {
                newAnswers = [...currentAnswers, option];
            } else {
                newAnswers = currentAnswers.filter((ans: string) => ans !== option);
            }

            return {
                ...prev,
                [questionId]: newAnswers.join(',')
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
        setIsExamSubmitted(true);
        setShowConfirmDialog(false);
    };

    const getQuestionStatus = (questionId: string) => {
        return answers[questionId] ? 'answered' : 'unanswered';
    };

    const getAnsweredCount = () => {
        return Object.keys(answers).length;
    };

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
                        Your answers have been recorded successfully. You answered {getAnsweredCount()} out of {exam.questions?.length || 0} questions.
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

    // Check if exam and questions exist
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
    const currentAnswer = answers[currentQuestion?.id || ''] || '';

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
                                <div key={index} className="option-item">
                                    {currentQuestion.isMultipleAnswers ? (
                                        <input
                                            type="checkbox"
                                            id={`option-${currentQuestion.id}-${index}`}
                                            checked={currentAnswer.split(',').includes(option || '')}
                                            onChange={(e) => handleMultipleAnswerChange(currentQuestion.id || '', (option || ''), e.target.checked)}
                                            className="option-checkbox"
                                        />
                                    ) : (
                                        <input
                                            type="radio"
                                            id={`option-${currentQuestion.id}-${index}`}
                                            name={`question-${currentQuestion.id}`}
                                            value={option}
                                            checked={currentAnswer === option}
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
        </div>
    );
}