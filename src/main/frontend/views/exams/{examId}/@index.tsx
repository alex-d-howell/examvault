import Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';
import Question from 'Frontend/generated/com/howell/examvault/base/domain/Question';
import { ExamService } from 'Frontend/generated/endpoints';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Icon } from '@vaadin/react-components';
import './profile.css';
import { ConfirmationButton } from 'Frontend/components/confirmationButton';

export default function ProfileView() {

    const navigate = useNavigate();
    const { examId } = useParams<{ examId: string }>();
    const [exam, setExam] = useState<Exam | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedQuestions, setExpandedQuestions] = useState(new Set());

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

    const toggleQuestion = (questionId: string) => {
        const newExpanded = new Set(expandedQuestions);
        if (newExpanded.has(questionId)) {
            newExpanded.delete(questionId);
        } else {
            newExpanded.add(questionId);
        }
        setExpandedQuestions(newExpanded);
    };

    const isCorrectAnswer = (option: string, question: Question) => {
    return question.correctAnswers?.includes(option) || false;
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

    if (error) {
        return (
            <div className="loading-container">
                <div className="loading-content">
                    <Icon icon="vaadin:exclamation-circle" className="error-icon"></Icon>
                    <p className="error-text">{error}</p>
                </div>
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="loading-container">
                <div className="loading-content">
                    <Icon icon="vaadin:file-text" className="not-found-icon"></Icon>
                    <p className="not-found-text">Exam not found</p>
                </div>
            </div>
        );
    }

    const totalQuestions = exam.questions?.length || 0;
    const multipleChoiceCount = exam.questions?.filter(q => !q?.isMultipleAnswers).length || 0;
    const multipleAnswerCount = exam.questions?.filter(q => q?.isMultipleAnswers).length || 0;

    return (
        <div className="profile-container">
            <div className="profile-content">
                {/* Header Card */}
                <div className="header-card">
                    <div className="header-gradient">
                        <div className="header-content">
                            <div className="header-info">
                                <h1 className="exam-title">{exam.title}</h1>
                                <div className="meta-info">
                                    <div className="meta-item">
                                        <Icon icon="vaadin:user" className="meta-icon"></Icon>
                                        <span className="meta-text">{exam.uploadedBy}</span>
                                    </div>
                                    <div className="meta-item">
                                        <Icon icon="vaadin:clock" className="meta-icon"></Icon>
                                        <span className="meta-text">{exam.uploadedAt}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="question-counter">
                                <div className="counter-number">{totalQuestions}</div>
                                <div className="counter-label">Questions</div>
                            </div>
                        </div>
                    </div>

                    <div className="description-section">
                        <h2 className="section-title">
                            <Icon icon="vaadin:file-text" className="section-icon"></Icon>
                            Description
                        </h2>
                        <p className="description-text">{exam.description}</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-content">
                            <div className="stat-info">
                                <p className="stat-label">Total Questions</p>
                                <p className="stat-value">{totalQuestions}</p>
                            </div>
                            <div className="stat-icon-container stat-icon-blue">
                                <Icon icon="vaadin:question" className="stat-icon"></Icon>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-content">
                            <div className="stat-info">
                                <p className="stat-label">Single Choice</p>
                                <p className="stat-value">{multipleChoiceCount}</p>
                            </div>
                            <div className="stat-icon-container stat-icon-green">
                                <Icon icon="vaadin:options" className="stat-icon"></Icon>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-content">
                            <div className="stat-info">
                                <p className="stat-label">Multiple Choice</p>
                                <p className="stat-value">{multipleAnswerCount}</p>
                            </div>
                            <div className="stat-icon-container stat-icon-purple">
                                <Icon icon="vaadin:form" className="stat-icon"></Icon>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Questions Section */}
                {exam.questions && exam.questions.length > 0 ? (<>
                    <div className="questions-card">
                        <div className="questions-header">
                            <h2 className="questions-title">
                                <div className="questions-icon-container">
                                    <Icon icon="vaadin:open-book" className="questions-icon"></Icon>
                                </div>
                                Questions ({totalQuestions})
                            </h2>
                        </div>

                        <div className="questions-list">
                            {exam.questions.map((question, index) => {
                                const isExpanded = expandedQuestions.has(question?.id || `question-${index}`);
                                return (
                                    <div key={question?.id || `question-${index}`} className="question-item">
                                        <div
                                            className="question-header"
                                            onClick={() => toggleQuestion(question?.id || `question-${index}`)}
                                        >
                                            <div className="question-main">
                                                <div className="question-number">
                                                    {index + 1}
                                                </div>
                                                <div className="question-content">
                                                    <div className="question-type-container">
                                                        <span className={`question-type ${question?.isMultipleAnswers
                                                            ? 'question-type-multiple'
                                                            : 'question-type-single'
                                                            }`}>
                                                            {question?.isMultipleAnswers ? 'Multiple Answers' : 'Single Answer'}
                                                        </span>
                                                    </div>
                                                    <p className="question-text">{question?.questionText}</p>
                                                </div>
                                            </div>
                                            <div className="expand-icon">
                                                <Icon
                                                    icon={isExpanded ? "vaadin:chevron-down" : "vaadin:chevron-right"}
                                                    className="chevron-icon"
                                                ></Icon>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="question-expanded">
                                                <div className="options-container">
                                                    <div className="options-list">
                                                        {question?.options?.map((option, optIndex) => {
                                                            const isCorrect = isCorrectAnswer(option || '', question);
                                                            return (
                                                                <div
                                                                    key={optIndex}
                                                                    className={`option-item ${isCorrect ? 'option-correct' : 'option-regular'}`}
                                                                >
                                                                    <div className={`option-letter ${isCorrect ? 'option-letter-correct' : 'option-letter-regular'}`}>
                                                                        {String.fromCharCode(65 + optIndex)}
                                                                    </div>
                                                                    <span className={`option-text ${isCorrect ? 'option-text-correct' : 'option-text-regular'}`}>
                                                                        {option}
                                                                    </span>
                                                                    {isCorrect && (
                                                                        <Icon icon="vaadin:check-circle" className="correct-indicator"></Icon>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <ConfirmationButton
                            action="Begin Exam"
                            modalTitle="Attempt Exam"
                            modalDescription={`Are you sure you want to attempt "${exam.title}"?`}
                            buttonText="Attempt Exam"
                            buttonClassName="m-s"
                            buttonTheme="primary"
                            onYes={() => {
                                navigate(`/exams/${exam.id}/attempt`);
                            }}
                        />
                    </div>
                    <div>
                        <ConfirmationButton
                            action="Edit Exam"
                            modalTitle="Edit Exam"
                            modalDescription={`Are you sure you want to modify "${exam.title}"?`}
                            buttonText="Edit Exam"
                            buttonClassName="m-s"
                            buttonTheme="primary"
                            onYes={() => {
                                navigate(`/exams/${exam.id}/edit`);
                            }}
                        />
                    </div>
                </>) : (
                    <div className="no-questions-card">
                        <Icon icon="vaadin:file-text" className="no-questions-icon"></Icon>
                        <p className="no-questions-text">No questions available for this exam.</p>
                    </div>
                )}
            </div>
        </div>
    );
}