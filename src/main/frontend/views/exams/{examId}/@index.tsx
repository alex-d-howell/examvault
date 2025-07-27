import { useParams, useNavigate } from 'react-router';
import { Icon, Button, TextArea } from '@vaadin/react-components';
import { useAuth } from 'Frontend/hooks/useAuth.js';
import { useExamDetail } from 'Frontend/hooks/useExamDetail';
import { useComments } from 'Frontend/hooks/useComments';
import { useToast } from 'Frontend/hooks/useToast';
import { StarRating } from 'Frontend/components/StarRatingComponent/StarRatingComponent';
import { ToastContainer } from 'Frontend/components/ToastComponent/ToastComponent';
import { ConfirmationButton } from 'Frontend/components/ConfirmationButton';
import { TagDisplay } from 'Frontend/components/TagComponents/TagsComponents';
import { ExamErrorBoundary, PageErrorBoundary } from 'Frontend/components/ErrorBoundaries';
import { ExamAttemptsStats } from 'Frontend/components/ExamAttemptHistoryComponents/ExamProfileAttemptsHistory';
import './profile.css';


export default function ExamDetailView() {
    const { examId } = useParams<{ examId: string }>();
    const navigate = useNavigate();
    const { authenticated, user } = useAuth();

    // Toast notification system
    const { toasts, removeToast, showSuccess, showError } = useToast();

    const {
        exam, loading, error, canEdit, checkingPermissions,
        expandedQuestions, toggleQuestion, isCorrectAnswer,
        handleTagClick, navigateToAttempt, navigateToEdit,
        examStats, selectedTags
    } = useExamDetail(examId, authenticated);

    const {
        comments, commentText, setCommentText, commentRating, setCommentRating,
        submittingComment, handleSubmitComment,
        editingCommentId, editCommentText, setEditCommentText,
        editCommentRating, setEditCommentRating, startEditingComment,
        cancelEditingComment, handleUpdateComment, handleDeleteComment,
        canUserEditComment, formatDate, ratingStats
    } = useComments(examId, authenticated, user?.email, { showSuccess, showError });

    // Loading state
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

    // Error state
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

    // Exam not found
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

    return (
        <PageErrorBoundary>
            <div className="profile-container">
                <div className="profile-content">
                    {/* Header Card */}
                    <ExamErrorBoundary>
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
                                                <span className="meta-text">{exam.uploadedAt ? String(exam.uploadedAt) : ''}</span>
                                            </div>
                                            {ratingStats.hasRatings && (
                                                <div className="meta-item">
                                                    <Icon icon="vaadin:star" className="meta-icon"></Icon>
                                                    <span className="meta-text">
                                                        {ratingStats.averageRating?.toFixed(1)} ({ratingStats.ratingCount} rating{ratingStats.ratingCount !== 1 ? 's' : ''})
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="question-counter">
                                        <div className="counter-number">{examStats.totalQuestions}</div>
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

                                {selectedTags.length > 0 && (
                                    <div className="exam-tags-section">
                                        <h3 className="tags-title">
                                            <Icon icon="vaadin:tags" className="tags-icon"></Icon>
                                            Tags
                                        </h3>
                                        <TagDisplay
                                            tags={selectedTags}
                                            onTagClick={handleTagClick}
                                            className="exam-tags-display"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </ExamErrorBoundary>

                    {/* Stats Grid */}
                    <ExamErrorBoundary>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-content">
                                    <div className="stat-info">
                                        <p className="stat-label">Total Questions</p>
                                        <p className="stat-value">{examStats.totalQuestions}</p>
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
                                        <p className="stat-value">{examStats.multipleChoiceCount}</p>
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
                                        <p className="stat-value">{examStats.multipleAnswerCount}</p>
                                    </div>
                                    <div className="stat-icon-container stat-icon-purple">
                                        <Icon icon="vaadin:form" className="stat-icon"></Icon>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ExamErrorBoundary>
                    <ExamErrorBoundary>
                        <ExamAttemptsStats
                            examId={examId!}
                            examTitle={exam?.title || 'Exam'}
                            authenticated={authenticated}
                        />
                    </ExamErrorBoundary>
                    {/* Questions Section */}
                    {exam.questions && exam.questions.length > 0 && (
                        <ExamErrorBoundary>
                            <div className="questions-card">
                                <div className="questions-header">
                                    <h2 className="questions-title">
                                        <div className="questions-icon-container">
                                            <Icon icon="vaadin:open-book" className="questions-icon"></Icon>
                                        </div>
                                        Questions ({examStats.totalQuestions})
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
                                                        <div className="question-number">{index + 1}</div>
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

                                                            {question?.explanation && (
                                                                <div className="explanation-indicator">
                                                                    <Icon icon="vaadin:info-circle" className="explanation-indicator-icon" />
                                                                    <span>Additional explanation available</span>
                                                                </div>
                                                            )}
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

                                                        {question?.explanation && (
                                                            <div className="question-explanation">
                                                                <div className="explanation-header">
                                                                    <Icon icon="vaadin:info-circle" className="explanation-header-icon" />
                                                                    <h4 className="explanation-title">Explanation</h4>
                                                                </div>
                                                                <div className="explanation-content">
                                                                    {question.explanation.split('\n').map((paragraph, paragraphIndex) => (
                                                                        <p key={paragraphIndex} className="explanation-paragraph">
                                                                            {paragraph}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </ExamErrorBoundary>
                    )}

                    {/* Comments Section */}
                    <ExamErrorBoundary>
                        <div className="comments-section">
                            <div className="comments-header">
                                <h2 className="comments-title">
                                    <Icon icon="vaadin:comments" className="comments-icon"></Icon>
                                    Comments & Ratings ({comments.length})
                                </h2>
                            </div>

                            {/* Add Comment Form */}
                            <div className="add-comment-form">
                                <h3 className="form-title">
                                    {authenticated ? 'Add Your Comment' : 'Sign in to add comments'}
                                </h3>

                                {authenticated ? (
                                    <>
                                        <div className="comment-form-content">
                                            <TextArea
                                                label="Your Comment"
                                                value={commentText}
                                                onValueChanged={(e) => setCommentText(e.detail.value)}
                                                placeholder="Share your thoughts about this exam..."
                                                maxlength={1000}
                                                helperText={`${commentText.length}/1000 characters`}
                                                className="comment-textarea"
                                            />

                                            <div className="rating-section">
                                                <label className="rating-label">Optional Rating:</label>
                                                <StarRating
                                                    rating={commentRating}
                                                    onRatingChange={setCommentRating}
                                                    size="medium"
                                                    disabled={false}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-actions">
                                            <Button
                                                onClick={handleSubmitComment}
                                                disabled={Boolean(submittingComment || !commentText.trim())}
                                                theme="primary"
                                            >
                                                {submittingComment ? 'Adding...' : 'Add Comment'}
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="sign-in-prompt">
                                        <p>You need to be signed in to add comments and ratings.</p>
                                        <Button onClick={() => navigate('/login')} theme="primary">
                                            Sign In
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Comments List */}
                            <div className="comments-list">
                                {comments.length > 0 ? (
                                    comments.map((comment, index) => {
                                        const commentIdStr = comment.id ? comment.id.toString() : '';
                                        const hasRating = typeof comment.examRating === 'number' && comment.examRating > 0;
                                        const canEditThisComment = canUserEditComment(comment) && commentIdStr;

                                        return (
                                            <div key={commentIdStr || `comment-${index}`} className="comment-item">
                                                <div className="comment-header">
                                                    <div className="comment-author">
                                                        <Icon icon="vaadin:user" className="author-icon" />
                                                        <span className="author-name">{comment.userEmail}</span>
                                                        {hasRating && (
                                                            <div className="comment-rating">
                                                                <StarRating
                                                                    rating={comment.examRating}
                                                                    onRatingChange={() => { }}
                                                                    disabled={true}
                                                                    size="small"
                                                                    showClearButton={false}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="comment-meta">
                                                        <span className="comment-date">{formatDate(comment.dateCreated ? String(comment.dateCreated) : undefined)}</span>
                                                        {canEditThisComment && (
                                                            <div className="comment-actions">
                                                                <Button
                                                                    onClick={() => startEditingComment(comment)}
                                                                    theme="tertiary small"
                                                                    className="edit-comment-btn"
                                                                >
                                                                    <Icon icon="vaadin:edit" slot="prefix" />
                                                                    Edit
                                                                </Button>
                                                                <ConfirmationButton
                                                                    action="Delete"
                                                                    modalTitle="Delete Comment"
                                                                    modalDescription="Are you sure you want to delete this comment? This action cannot be undone."
                                                                    buttonText="Delete"
                                                                    buttonClassName="delete-comment-btn"
                                                                    buttonTheme="tertiary small error"
                                                                    onYes={() => handleDeleteComment(commentIdStr)}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="comment-content">
                                                    {editingCommentId === commentIdStr ? (
                                                        <div className="edit-comment-form">
                                                            <TextArea
                                                                value={editCommentText}
                                                                onValueChanged={(e) => setEditCommentText(e.detail.value)}
                                                                maxlength={1000}
                                                                className="edit-textarea"
                                                            />
                                                            <div className="edit-rating-section">
                                                                <label className="rating-label">Rating:</label>
                                                                <StarRating
                                                                    rating={editCommentRating}
                                                                    onRatingChange={setEditCommentRating}
                                                                    size="small"
                                                                    disabled={false}
                                                                />
                                                            </div>
                                                            <div className="edit-actions">
                                                                <Button
                                                                    onClick={() => handleUpdateComment(commentIdStr)}
                                                                    theme="primary small"
                                                                    disabled={Boolean(!editCommentText.trim())}
                                                                >
                                                                    Save
                                                                </Button>
                                                                <Button
                                                                    onClick={cancelEditingComment}
                                                                    theme="tertiary small"
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="comment-text">{comment.commentString}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="no-comments">
                                        <Icon icon="vaadin:comment-o" className="no-comments-icon" />
                                        <p>No comments yet. Be the first to share your thoughts!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ExamErrorBoundary>

                    {/* Action Buttons */}
                    <ExamErrorBoundary>
                        <div className="exam-actions">
                            <ConfirmationButton
                                action="Begin Exam"
                                modalTitle="Attempt Exam"
                                modalDescription={`Are you sure you want to attempt "${exam.title}"?`}
                                buttonText="Attempt Exam"
                                buttonClassName="m-s"
                                buttonTheme="primary"
                                onYes={navigateToAttempt}
                            />

                            {authenticated && canEdit && (
                                <ConfirmationButton
                                    action="Edit Exam"
                                    modalTitle="Edit Exam"
                                    modalDescription={`Are you sure you want to modify "${exam.title}"?`}
                                    buttonText="Edit Exam"
                                    buttonClassName="m-s edit-button"
                                    buttonTheme="secondary"
                                    onYes={navigateToEdit}
                                />
                            )}

                            {authenticated && !canEdit && !checkingPermissions && (
                                <div className="no-edit-message">
                                    <Icon icon="vaadin:info-circle" className="info-icon"></Icon>
                                    <span>Only the exam creator can edit this exam</span>
                                </div>
                            )}

                            {!authenticated && (
                                <div className="sign-in-prompt">
                                    <Icon icon="vaadin:user" className="info-icon"></Icon>
                                    <span>Sign in to edit exams you've created</span>
                                </div>
                            )}
                        </div>
                    </ExamErrorBoundary>
                </div>

                {/* Toast Notifications */}
                <ToastContainer
                    toasts={toasts}
                    onRemove={removeToast}
                />
            </div>
        </PageErrorBoundary>
    );
}