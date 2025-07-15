import Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';
import Question from 'Frontend/generated/com/howell/examvault/base/domain/Question';
import Comment from 'Frontend/generated/com/howell/examvault/base/domain/Comment';
import { ExamService, CommentService } from 'Frontend/generated/endpoints';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Icon, Button, TextArea } from '@vaadin/react-components';
import './profile.css';
import { ConfirmationButton } from 'Frontend/components/confirmationButton';
import { useAuth } from 'Frontend/hooks/useAuth.js';
import { TagDisplay } from 'Frontend/components/tagComponents/tagsComponents';

export default function ProfileView() {

    const navigate = useNavigate();
    const { examId } = useParams<{ examId: string }>();
    const { authenticated, user } = useAuth();
    const [exam, setExam] = useState<Exam | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedQuestions, setExpandedQuestions] = useState(new Set());
    const [canEdit, setCanEdit] = useState(false);
    const [checkingPermissions, setCheckingPermissions] = useState(true);

    // Comment form state
    const [commentText, setCommentText] = useState('');
    const [commentRating, setCommentRating] = useState<number | null>(null);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [commentError, setCommentError] = useState<string | null>(null);

    // Edit comment state
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentText, setEditCommentText] = useState('');
    const [editCommentRating, setEditCommentRating] = useState<number | null>(null);

    useEffect(() => {
        const fetchExamAndPermissions = async () => {
            console.log('Exam ID from params:', examId);
            if (!examId) {
                setError('No exam ID provided');
                setLoading(false);
                setCheckingPermissions(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                console.log('Fetching exam with ID:', examId);

                // Fetch the exam and comments
                const [fetchedExam, fetchedComments] = await Promise.all([
                    ExamService.getExamById(examId),
                    CommentService.getExamComments(examId)
                ]);

                console.log('Fetched Exam:', fetchedExam);
                console.log('Fetched Comments:', fetchedComments);

                if (fetchedExam) {
                    setExam(fetchedExam);
                    // Filter out any undefined comments
                    setComments((fetchedComments || []).filter((comment): comment is Comment => comment !== undefined));
                    
                    // Check if user can edit this exam (only if authenticated)
                    if (authenticated && examId) {
                        try {
                            const canModify = await ExamService.canUserModifyExam(examId);
                            setCanEdit(canModify);
                            console.log('User can edit exam:', canModify);
                        } catch (permError) {
                            console.error('Error checking edit permissions:', permError);
                            setCanEdit(false);
                        }
                    } else {
                        setCanEdit(false);
                    }
                } else {
                    setError('Exam not found');
                }

            } catch (err) {
                console.error('Error fetching exam:', err);
                setError('Failed to load exam. Please try again.');
            } finally {
                setLoading(false);
                setCheckingPermissions(false);
            }
        };

        fetchExamAndPermissions();
    }, [examId, authenticated]);

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

    // Handle tag click to search for similar exams
    const handleTagClick = (tag: string) => {
        // Navigate to exams page with tag filter
        navigate('/exams', { state: { searchTags: [tag] } });
    };

    // Rating component
    const StarRating = ({ 
        rating, 
        onRatingChange, 
        disabled = false, 
        size = 'medium' 
    }: { 
        rating: number | null; 
        onRatingChange: (rating: number | null) => void; 
        disabled?: boolean;
        size?: 'small' | 'medium' | 'large';
    }) => {
        const sizeClass = size === 'small' ? 'star-small' : size === 'large' ? 'star-large' : 'star-medium';
        
        // Debug logging for StarRating
        if (disabled) {
            console.log('StarRating disabled component:', { rating, disabled, shouldRender: rating && rating > 0 });
        }
        
        // Don't render anything if rating is 0, null, or undefined and this is a disabled (display-only) component
        if (disabled && (!rating || rating <= 0)) {
            return null;
        }
        
        return (
            <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={`star-button ${sizeClass} ${rating && rating >= star ? 'star-filled' : 'star-empty'}`}
                        onClick={() => !disabled && onRatingChange(rating === star ? null : star)}
                        disabled={Boolean(disabled)}
                    >
                        <Icon icon={rating && rating >= star ? "vaadin:star" : "vaadin:star-o"} />
                    </button>
                ))}
                {rating && rating > 0 && (
                    <button
                        type="button"
                        className="clear-rating"
                        onClick={() => !disabled && onRatingChange(null)}
                        disabled={Boolean(disabled)}
                        title="Clear rating"
                    >
                        <Icon icon="vaadin:close-small" />
                    </button>
                )}
            </div>
        );
    };

    // Submit new comment
    const handleSubmitComment = async () => {
        if (!authenticated) {
            setCommentError('You must be signed in to add comments');
            return;
        }

        if (!commentText.trim()) {
            setCommentError('Comment text is required');
            return;
        }

        if (!examId) return;

        setSubmittingComment(true);
        setCommentError(null);

        try {
            const newComment = await CommentService.addComment(
                examId, 
                commentText.trim(), 
                commentRating ?? undefined
            );

            console.log('New comment created:', newComment);

            // Add the new comment to the list if it has an ID, otherwise refresh the whole list
            if (newComment && newComment.id) {
                setComments(prev => [...prev, newComment]);
            } else {
                console.warn('Comment created but no ID returned, refreshing comments list');
                // Refresh the entire comments list
                try {
                    const refreshedComments = await CommentService.getExamComments(examId);
                    setComments((refreshedComments || []).filter((comment): comment is Comment => comment !== undefined));
                } catch (refreshError) {
                    console.error('Error refreshing comments:', refreshError);
                }
            }
            
            // Reset form
            setCommentText('');
            setCommentRating(null);
            
        } catch (error: any) {
            console.error('Error adding comment:', error);
            setCommentError(error.message || 'Failed to add comment');
        } finally {
            setSubmittingComment(false);
        }
    };

    // Start editing a comment
    const startEditingComment = (comment: Comment) => {
        const commentIdStr = comment.id ? comment.id.toString() : '';
        console.log('Starting edit for comment:', comment.id, 'converted to:', commentIdStr);
        console.log('Comment examRating:', comment.examRating, 'type:', typeof comment.examRating);
        
        if (!commentIdStr) {
            console.error('Cannot edit comment: missing ID', comment);
            return;
        }
        
        setEditingCommentId(commentIdStr);
        setEditCommentText(comment.commentString || '');
        // Only set rating if it's > 0, otherwise leave as null
        const ratingToEdit = (comment.examRating && comment.examRating > 0) ? comment.examRating : null;
        console.log('Setting edit rating to:', ratingToEdit);
        setEditCommentRating(ratingToEdit);
    };

    // Cancel editing
    const cancelEditingComment = () => {
        setEditingCommentId(null);
        setEditCommentText('');
        setEditCommentRating(null);
    };

    // Update comment
    const handleUpdateComment = async (commentId: string) => {
        if (!editCommentText.trim()) {
            return;
        }

        if (!examId || !commentId) {
            console.error('Missing examId or commentId:', { examId, commentId });
            return;
        }

        console.log('Updating comment:', { examId, commentId, text: editCommentText, rating: editCommentRating });

        try {
            const updatedComment = await CommentService.updateComment(
                examId,
                commentId,
                editCommentText.trim(),
                editCommentRating ?? undefined
            );

            // Update the comment in the list
            if (updatedComment) {
                setComments(prev => prev.map(comment => 
                    comment.id && comment.id.toString() === commentId ? updatedComment : comment
                ).filter((comment): comment is Comment => comment !== undefined));
            }

            // Reset edit state
            cancelEditingComment();
            
        } catch (error: any) {
            console.error('Error updating comment:', error);
            // You might want to show an error message here
        }
    };

    // Delete comment
    const handleDeleteComment = async (commentId: string) => {
        if (!examId || !commentId) {
            console.error('Missing examId or commentId:', { examId, commentId });
            return;
        }

        console.log('Deleting comment:', { examId, commentId });

        try {
            await CommentService.deleteComment(examId, commentId);

            // Remove the comment from the list
            setComments(prev => prev.filter((comment): comment is Comment => 
                comment !== undefined && comment.id !== undefined && comment.id?.toString() !== commentId
            ));
            
        } catch (error: any) {
            console.error('Error deleting comment:', error);
            // You might want to show an error message here
        }
    };

    // Check if user can edit a specific comment
    const canUserEditComment = (comment: Comment): boolean => {
        return authenticated && user !== undefined && comment.userEmail === user!.email;
    };

    // Format date for display
    const formatDate = (dateString: string | undefined): string => {
        if (!dateString) return '';
        try {
            // Handle Java Instant format (ISO string)
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; // Return original if invalid
            
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
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

    // Calculate average rating - only include ratings > 0, be more explicit about the check
    const ratingsOnly = comments.filter(c => typeof c.examRating === 'number' && c.examRating > 0);
    const averageRating = ratingsOnly.length > 0 
        ? ratingsOnly.reduce((sum, c) => sum + (c.examRating || 0), 0) / ratingsOnly.length 
        : null;

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
                                        <span className="meta-text">{exam.uploadedAt ? String(exam.uploadedAt) : ''}</span>
                                    </div>
                                    {averageRating && (
                                        <div className="meta-item">
                                            <Icon icon="vaadin:star" className="meta-icon"></Icon>
                                            <span className="meta-text">
                                                {averageRating.toFixed(1)} ({ratingsOnly.length} rating{ratingsOnly.length !== 1 ? 's' : ''})
                                            </span>
                                        </div>
                                    )}
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

                        {/* Display tags using new consolidated component */}
                        {exam.tags && exam.tags.length > 0 && (
                            <div className="exam-tags-section">
                                <h3 className="tags-title">
                                    <Icon icon="vaadin:tags" className="tags-icon"></Icon>
                                    Tags
                                </h3>
                                <TagDisplay
                                    tags={(exam.tags || []).filter((tag): tag is string => tag != null && tag !== undefined)}
                                    onTagClick={handleTagClick}
                                    className="exam-tags-display"
                                />
                            </div>
                        )}
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
                {exam.questions && exam.questions.length > 0 && (
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
                                                    
                                                    {/* Show explanation indicator if present */}
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
                                                
                                                {/* Display explanation if available */}
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
                )}

                {/* Comments Section */}
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
                                    
                                    {commentError && (
                                        <div className="comment-error">
                                            <Icon icon="vaadin:exclamation-circle" />
                                            {commentError}
                                        </div>
                                    )}
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
                                // More robust rating check - must be a number > 0
                                const hasRating = typeof comment.examRating === 'number' && comment.examRating > 0;
                                const canEditThisComment = canUserEditComment(comment) && commentIdStr;
                                
                                // Debug logging for rating issues
                                if (comment.examRating !== undefined && comment.examRating !== null) {
                                    console.log('Comment rating debug:', { 
                                        commentId: comment.id,
                                        examRating: comment.examRating, 
                                        typeOf: typeof comment.examRating,
                                        hasRating,
                                        isGreaterThanZero: comment.examRating > 0
                                    });
                                }
                                
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
                                                        onRatingChange={() => {}}
                                                        disabled={true}
                                                        size="small"
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
                            )})
                        ) : (
                            <div className="no-comments">
                                <Icon icon="vaadin:comment-o" className="no-comments-icon" />
                                <p>No comments yet. Be the first to share your thoughts!</p>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Action Buttons */}
                <div className="exam-actions">
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
                    
                    {/* Only show edit button if user can edit */}
                    {authenticated && canEdit && (
                        <ConfirmationButton
                            action="Edit Exam"
                            modalTitle="Edit Exam"
                            modalDescription={`Are you sure you want to modify "${exam.title}"?`}
                            buttonText="Edit Exam"
                            buttonClassName="m-s edit-button"
                            buttonTheme="secondary"
                            onYes={() => {
                                navigate(`/exams/${exam.id}/edit`);
                            }}
                        />
                    )}
                    
                    {/* Show message if user is authenticated but cannot edit */}
                    {authenticated && !canEdit && !checkingPermissions && (
                        <div className="no-edit-message">
                            <Icon icon="vaadin:info-circle" className="info-icon"></Icon>
                            <span>Only the exam creator can edit this exam</span>
                        </div>
                    )}
                    
                    {/* Show sign-in prompt if not authenticated */}
                    {!authenticated && (
                        <div className="sign-in-prompt">
                            <Icon icon="vaadin:user" className="info-icon"></Icon>
                            <span>Sign in to edit exams you've created</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}