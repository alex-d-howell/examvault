import { useState, useEffect, useCallback, useMemo } from 'react';
import type Comment from 'Frontend/generated/com/howell/examvault/base/domain/Comment';
import { CommentService } from 'Frontend/generated/endpoints';

export interface CommentsState {
  comments: Comment[];
  loading: boolean;

  // Add comment form
  commentText: string;
  commentRating: number | null;
  submittingComment: boolean;

  // Edit comment form
  editingCommentId: string | null;
  editCommentText: string;
  editCommentRating: number | null;
}

export interface ToastFunctions {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

export const useComments = (
  examId: string | undefined,
  authenticated: boolean,
  userEmail?: string,
  toast?: ToastFunctions
) => {
  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // Add comment form state
  const [commentText, setCommentText] = useState('');
  const [commentRating, setCommentRating] = useState<number | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editCommentRating, setEditCommentRating] = useState<number | null>(null);

  // Load comments
  useEffect(() => {
    const fetchComments = async () => {
      if (!examId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fetchedComments = await CommentService.getExamComments(examId);
        setComments((fetchedComments || []).filter((comment): comment is Comment => comment !== undefined));
      } catch (error) {
        console.error('Error fetching comments:', error);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [examId]);

  // Submit new comment
  const handleSubmitComment = useCallback(async (): Promise<void> => {
    if (!authenticated) {
      toast?.showError('You must be signed in to add comments');
      return;
    }

    if (!commentText.trim()) {
      toast?.showError('Comment text is required');
      return;
    }

    if (!examId) return;

    setSubmittingComment(true);

    try {
      const newComment = await CommentService.addComment(examId, commentText.trim(), commentRating ?? undefined);

      if (newComment && newComment.id) {
        setComments((prev) => [...prev, newComment]);
        toast?.showSuccess('Comment added successfully!');
      } else {
        console.warn('Comment created but no ID returned, refreshing comments list');
        // Refresh the entire comments list
        try {
          const refreshedComments = await CommentService.getExamComments(examId);
          setComments((refreshedComments || []).filter((comment): comment is Comment => comment !== undefined));
          toast?.showSuccess('Comment added successfully!');
        } catch (refreshError) {
          console.error('Error refreshing comments:', refreshError);
          toast?.showError('Comment may have been added, but failed to refresh the list');
        }
      }

      // Reset form
      setCommentText('');
      setCommentRating(null);
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast?.showError(error.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  }, [authenticated, commentText, commentRating, examId, toast]);

  // Start editing a comment
  const startEditingComment = useCallback((comment: Comment) => {
    const commentIdStr = comment.id ? comment.id.toString() : '';

    if (!commentIdStr) {
      console.error('Cannot edit comment: missing ID', comment);
      return;
    }

    setEditingCommentId(commentIdStr);
    setEditCommentText(comment.commentString || '');
    // Only set rating if it's > 0, otherwise leave as null
    const ratingToEdit = comment.examRating && comment.examRating > 0 ? comment.examRating : null;
    setEditCommentRating(ratingToEdit);
  }, []);

  // Cancel editing
  const cancelEditingComment = useCallback(() => {
    setEditingCommentId(null);
    setEditCommentText('');
    setEditCommentRating(null);
  }, []);

  // Update comment
  const handleUpdateComment = useCallback(
    async (commentId: string): Promise<void> => {
      if (!editCommentText.trim()) {
        return;
      }

      if (!examId || !commentId) {
        console.error('Missing examId or commentId:', { examId, commentId });
        return;
      }

      try {
        const updatedComment = await CommentService.updateComment(
          examId,
          commentId,
          editCommentText.trim(),
          editCommentRating ?? undefined
        );

        if (updatedComment) {
          setComments((prev) =>
            prev
              .map((comment) => (comment.id && comment.id.toString() === commentId ? updatedComment : comment))
              .filter((comment): comment is Comment => comment !== undefined)
          );

          toast?.showSuccess('Comment updated successfully!');
        }

        cancelEditingComment();
      } catch (error: any) {
        console.error('Error updating comment:', error);
        toast?.showError('Failed to update comment. Please try again.');
      }
    },
    [editCommentText, editCommentRating, examId, cancelEditingComment, toast]
  );

  // Delete comment
  const handleDeleteComment = useCallback(
    async (commentId: string): Promise<void> => {
      if (!examId || !commentId) {
        console.error('Missing examId or commentId:', { examId, commentId });
        return;
      }

      try {
        await CommentService.deleteComment(examId, commentId);

        setComments((prev) =>
          prev.filter(
            (comment): comment is Comment =>
              comment !== undefined && comment.id !== undefined && comment.id?.toString() !== commentId
          )
        );

        toast?.showSuccess('Comment deleted successfully!');
      } catch (error: any) {
        console.error('Error deleting comment:', error);
        toast?.showError('Failed to delete comment. Please try again.');
      }
    },
    [examId, toast]
  );

  // Check if user can edit a specific comment
  const canUserEditComment = useCallback(
    (comment: Comment): boolean => {
      return authenticated && userEmail !== undefined && comment.userEmail === userEmail;
    },
    [authenticated, userEmail]
  );

  // Format date for display
  const formatDate = useCallback((dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  }, []);

  // Calculate average rating
  const averageRating = useMemo(() => {
    const ratingsOnly = comments.filter((c) => typeof c.examRating === 'number' && c.examRating > 0);
    return ratingsOnly.length > 0
      ? ratingsOnly.reduce((sum, c) => sum + (c.examRating || 0), 0) / ratingsOnly.length
      : null;
  }, [comments]);

  // Rating statistics
  const ratingStats = useMemo(() => {
    const ratingsOnly = comments.filter((c) => typeof c.examRating === 'number' && c.examRating > 0);
    return {
      averageRating,
      ratingCount: ratingsOnly.length,
      hasRatings: ratingsOnly.length > 0,
    };
  }, [comments, averageRating]);

  return {
    // Comments state
    comments,
    loading,

    // Add comment form
    commentText,
    setCommentText,
    commentRating,
    setCommentRating,
    submittingComment,
    handleSubmitComment,

    // Edit comment form
    editingCommentId,
    editCommentText,
    setEditCommentText,
    editCommentRating,
    setEditCommentRating,
    startEditingComment,
    cancelEditingComment,
    handleUpdateComment,

    // Comment management
    handleDeleteComment,
    canUserEditComment,

    // Utilities
    formatDate,
    ratingStats,
  };
};
