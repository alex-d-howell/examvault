import Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';
import Question from 'Frontend/generated/com/howell/examvault/base/domain/Question';
import { ExamService } from 'Frontend/generated/endpoints';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import './profile.css';

export default function ProfileView() {
    const { examId } = useParams<{ examId: string }>();
    const [exam, setExam] = useState<Exam | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedQuestions, setExpandedQuestions] = useState(new Set<string>());

    useEffect(() => {
        if (examId) {
            ExamService.getExamById(examId)
                .then(value => { setExam((value ?? null)) })
                .finally(() => setLoading(false));
        }
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

    const getCorrectAnswers = (question: Question) => {
        if (question.isMultipleAnswers) {
            return question.correctAnswer?.split(',').map(answer => answer.trim());
        }
        return [question.correctAnswer];
    };

    const isCorrectAnswer = (option: string, question: Question) => {
        const correctAnswers = getCorrectAnswers(question);
        return correctAnswers?.includes(option);
    };

    if (loading) {
        return (
            <div className='loadingContainer'>
                <div className="loadingContent">
                    <div className="spinner"></div>
                    <p className="loadingText">Loading Exam Details...</p>
                </div>
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="loadingContainer">
                <div className="loadingContent">
                    <p className="notFoundText">Exam not found</p>
                </div>
            </div>
        );
    }

    const totalQuestions = exam.questions?.length || 0;

    return (
        <div className="container">
            <div className="maxWidth">
                {/* Header Card */}
                <div className="headerCard">
                    <div className="headerContent">
                        <div className="headerInfo">
                            <h1 className="title">{exam.title}</h1>
                            <div className="metaInfo">
                                <div className="metaItem">

                                    <span>{exam.uploadedBy}</span>
                                </div>
                                <div className="metaItem">

                                    <span>{exam.uploadedAt}</span>
                                </div>
                            </div>
                        </div>
                        <div className="questionCount">
                            <div className="countNumber">{totalQuestions}</div>
                            <div className="countLabel">Questions</div>
                        </div>
                    </div>

                    <div className="descriptionSection">
                        <h2 className="sectionTitle">
                            Description
                        </h2>
                        <p className="description">{exam.description}</p>
                    </div>
                </div>

                {/* Questions Section */}
                {exam.questions && exam.questions.length > 0 ? (
                    <div className="questionsCard">
                        <div className="questionsHeader">
                            <h2 className="sectionTitle">

                                Questions ({totalQuestions})
                            </h2>
                        </div>

                        <div>
                            {exam.questions.map((question, index) => {

                                const isExpanded = expandedQuestions.has((question?.id ?? ""));
                                return (
                                    <div key={question?.id} className="questionItem">
                                        <div
                                            className="questionHeader"
                                            onClick={() => toggleQuestion((question?.id ?? ""))}
                                        >
                                            <div className="questionContent">
                                                <div className="questionNumber">
                                                    {index + 1}
                                                </div>
                                                <div className="questionDetails">
                                                    <div className="questionMeta">
                                                        <span className="questionType">

                                                        </span>
                                                    </div>
                                                    <p className="questionText">{question?.questionText}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="questionExpanded">
                                                
                                                    <div className="optionsContainer">
                                                        <h4 className="optionsTitle">
                                                            {question!.isMultipleAnswers ? 'Options (Multiple answers possible):' : 'Options:'}
                                                        </h4>
                                                        <ul className="optionsList">
                                                            {question!.options!.map((option, optIndex) => (
                                                                <li key={optIndex} className={
                                                                    `optionItem ${isCorrectAnswer(option!, question!) ? "correctOption" : ""}`
                                                                }>
                                                                    <span className={`optionLetter ${isCorrectAnswer(option!, question!) ? "correctOptionLetter" : ""}`}>
                                                                        {String.fromCharCode(65 + optIndex)}
                                                                    </span>
                                                                    <span className={`${
                                                                        isCorrectAnswer(option!, question!) ? "correctOptionText" : "optionText"}`}>
                                                                        {option}
                                                                    </span>
                                                                    {isCorrectAnswer(option!, question!) && (
                                                                        <p></p>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="noQuestionsCard">
                        <p className="noQuestionsText">No questions available for this exam.</p>
                    </div>
                )}

                {/* Summary Stats */}
                <div className="statsGrid">
                    <div className="statCard">
                        <div className="statContent">
                            <div>
                                <p className="statLabel">Total Questions</p>
                                <p className="statValue">{totalQuestions}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}