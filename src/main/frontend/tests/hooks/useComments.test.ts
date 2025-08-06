import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CommentService } from 'Frontend/generated/endpoints';
import { useComments } from 'Frontend/hooks/useComments';


// Mock the CommentService
vi.mock('Frontend/generated/endpoints', () => ({
  CommentService: {
    getExamComments: vi.fn(),
    addComment: vi.fn(),
    updateComment: vi.fn(),
    deleteComment: vi.fn(),
  },
}));

const mockCommentService = CommentService as any;

describe('useComments', () => {
  const mockExamId = 'exam-123';
  const mockUserEmail = 'test@example.com';
  const mockToast = {
    showSuccess: vi.fn(),
    showError: vi.fn(),
  };

  const createMockComment = (overrides = {}) => ({
    id: 'comment-123',
    commentString: 'Test comment',
    examRating: 4,
    userEmail: mockUserEmail,
    userName: 'Test User',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization and loading comments', () => {
    it('should initialize with loading state and empty comments', () => {
      mockCommentService.getExamComments.mockResolvedValue([]);

      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      expect(result.current.loading).toBe(true);
      expect(result.current.comments).toEqual([]);
      expect(result.current.commentText).toBe('');
      expect(result.current.commentRating).toBeNull();
      expect(result.current.submittingComment).toBe(false);
    });

    it('should load comments on mount', async () => {
      const mockComments = [createMockComment(), createMockComment({ id: 'comment-456' })];
      mockCommentService.getExamComments.mockResolvedValue(mockComments);

      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.comments).toEqual(mockComments);
      expect(mockCommentService.getExamComments).toHaveBeenCalledWith(mockExamId);
    });

    it('should handle no examId provided', async () => {
      const { result } = renderHook(() => useComments(undefined, true, mockUserEmail, mockToast));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.comments).toEqual([]);
      expect(mockCommentService.getExamComments).not.toHaveBeenCalled();
    });

    it('should handle API error when loading comments', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      mockCommentService.getExamComments.mockRejectedValue(new Error('Failed to fetch'));

      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.comments).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching comments:', expect.any(Error));
    });

    it('should filter out undefined comments', async () => {
      const mockCommentsWithUndefined = [
        createMockComment(),
        undefined,
        createMockComment({ id: 'comment-456' }),
        undefined,
      ];
      mockCommentService.getExamComments.mockResolvedValue(mockCommentsWithUndefined);

      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.comments).toHaveLength(2);
      expect(result.current.comments.every((comment) => comment !== undefined)).toBe(true);
    });
  });

  describe('adding comments', () => {
    it('should add comment successfully', async () => {
      const mockComments = [createMockComment()];
      const newComment = createMockComment({ id: 'new-comment', commentString: 'New comment' });

      mockCommentService.getExamComments.mockResolvedValue(mockComments);
      mockCommentService.addComment.mockResolvedValue(newComment);

      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Set comment text and rating
      act(() => {
        result.current.setCommentText('New comment');
        result.current.setCommentRating(5);
      });

      // Submit comment
      await act(async () => {
        await result.current.handleSubmitComment();
      });

      expect(mockCommentService.addComment).toHaveBeenCalledWith(mockExamId, 'New comment', 5);
      expect(result.current.comments).toHaveLength(2);
      expect(result.current.comments[1]).toEqual(newComment);
      expect(result.current.commentText).toBe('');
      expect(result.current.commentRating).toBeNull();
      expect(mockToast.showSuccess).toHaveBeenCalledWith('Comment added successfully!');
    });

    it('should handle comment text without rating', async () => {
      mockCommentService.getExamComments.mockResolvedValue([]);
      const newComment = createMockComment({ examRating: undefined });
      mockCommentService.addComment.mockResolvedValue(newComment);

      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setCommentText('Comment without rating');
      });

      await act(async () => {
        await result.current.handleSubmitComment();
      });

      expect(mockCommentService.addComment).toHaveBeenCalledWith(mockExamId, 'Comment without rating', undefined);
    });

    it('should require authentication to add comment', async () => {
      const { result } = renderHook(() => useComments(mockExamId, false, mockUserEmail, mockToast));

      act(() => {
        result.current.setCommentText('Test comment');
      });

      await act(async () => {
        await result.current.handleSubmitComment();
      });

      expect(mockCommentService.addComment).not.toHaveBeenCalled();
      expect(mockToast.showError).toHaveBeenCalledWith('You must be signed in to add comments');
      expect(result.current.submittingComment).toBe(false);
    });

    it('should require comment text', async () => {
      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      await act(async () => {
        await result.current.handleSubmitComment();
      });

      expect(mockCommentService.addComment).not.toHaveBeenCalled();
      expect(mockToast.showError).toHaveBeenCalledWith('Comment text is required');
      expect(result.current.submittingComment).toBe(false);
    });

    it('should trim whitespace from comment text', async () => {
      mockCommentService.getExamComments.mockResolvedValue([]);
      const newComment = createMockComment();
      mockCommentService.addComment.mockResolvedValue(newComment);

      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setCommentText('  Trimmed comment  ');
      });

      await act(async () => {
        await result.current.handleSubmitComment();
      });

      expect(mockCommentService.addComment).toHaveBeenCalledWith(mockExamId, 'Trimmed comment', undefined);
    });

    it('should handle API error when adding comment', async () => {
      mockCommentService.getExamComments.mockResolvedValue([]);
      mockCommentService.addComment.mockRejectedValue(new Error('Add failed'));

      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setCommentText('Test comment');
      });

      await act(async () => {
        await result.current.handleSubmitComment();
      });

      expect(mockToast.showError).toHaveBeenCalledWith('Add failed');
      expect(result.current.submittingComment).toBe(false);
    });

    it('should handle comment creation without ID returned', async () => {
      mockCommentService.getExamComments.mockResolvedValueOnce([]).mockResolvedValueOnce([createMockComment()]);
      mockCommentService.addComment.mockResolvedValue({ commentString: 'New comment' }); // No ID

      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setCommentText('New comment');
      });

      await act(async () => {
        await result.current.handleSubmitComment();
      });

      // Should refresh comments list
      expect(mockCommentService.getExamComments).toHaveBeenCalledTimes(2);
      expect(result.current.comments).toHaveLength(1);
    });

    it('should manage submitting state correctly', async () => {
      mockCommentService.getExamComments.mockResolvedValue([]);

      let resolveAddComment: (value: any) => void;
      const addCommentPromise = new Promise((resolve) => {
        resolveAddComment = resolve;
      });
      mockCommentService.addComment.mockReturnValue(addCommentPromise);

      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setCommentText('Test comment');
      });

      let submitPromise: Promise<void>;
      act(() => {
        submitPromise = result.current.handleSubmitComment();
      });

      // Check that submitting state is set immediately
      expect(result.current.submittingComment).toBe(true);

      act(() => {
        resolveAddComment!(createMockComment());
      });

      await act(async () => {
        await submitPromise!;
      });

      expect(result.current.submittingComment).toBe(false);
    });
  });

  describe('editing comments', () => {
    it('should start editing a comment', () => {
      const mockComment = createMockComment();
      mockCommentService.getExamComments.mockResolvedValue([mockComment]);

      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      act(() => {
        result.current.startEditingComment(mockComment);
      });

      expect(result.current.editingCommentId).toBe('comment-123');
      expect(result.current.editCommentText).toBe('Test comment');
      expect(result.current.editCommentRating).toBe(4);
    });

    it('should handle comment without rating when editing', () => {
      const mockComment = createMockComment({ examRating: 0 });
      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      act(() => {
        result.current.startEditingComment(mockComment);
      });

      expect(result.current.editCommentRating).toBeNull();
    });

    it('should handle comment without ID when editing', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const mockComment = createMockComment({ id: undefined });

      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      act(() => {
        result.current.startEditingComment(mockComment);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Cannot edit comment: missing ID', mockComment);
      expect(result.current.editingCommentId).toBeNull();
    });

    it('should cancel editing', () => {
      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      // Start editing
      act(() => {
        result.current.startEditingComment(createMockComment());
      });

      expect(result.current.editingCommentId).toBe('comment-123');

      // Cancel editing
      act(() => {
        result.current.cancelEditingComment();
      });

      expect(result.current.editingCommentId).toBeNull();
      expect(result.current.editCommentText).toBe('');
      expect(result.current.editCommentRating).toBeNull();
    });

    it('should update comment successfully', async () => {
      const mockComment = createMockComment();
      const updatedComment = { ...mockComment, commentString: 'Updated comment', examRating: 5 };

      mockCommentService.getExamComments.mockResolvedValue([mockComment]);
      mockCommentService.updateComment.mockResolvedValue(updatedComment);

      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start editing
      act(() => {
        result.current.startEditingComment(mockComment);
        result.current.setEditCommentText('Updated comment');
        result.current.setEditCommentRating(5);
      });

      // Update comment
      await act(async () => {
        await result.current.handleUpdateComment('comment-123');
      });

      expect(mockCommentService.updateComment).toHaveBeenCalledWith(mockExamId, 'comment-123', 'Updated comment', 5);
      expect(result.current.comments[0]).toEqual(updatedComment);
      expect(result.current.editingCommentId).toBeNull();
      expect(mockToast.showSuccess).toHaveBeenCalledWith('Comment updated successfully!');
    });

    it('should require edit comment text', async () => {
      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      await act(async () => {
        await result.current.handleUpdateComment('comment-123');
      });

      expect(mockCommentService.updateComment).not.toHaveBeenCalled();
    });

    it('should handle update API error', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      mockCommentService.updateComment.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      act(() => {
        result.current.setEditCommentText('Updated text');
      });

      await act(async () => {
        await result.current.handleUpdateComment('comment-123');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error updating comment:', expect.any(Error));
      expect(mockToast.showError).toHaveBeenCalledWith('Failed to update comment. Please try again.');
    });
  });

  describe('deleting comments', () => {
    it('should delete comment successfully', async () => {
      const mockComment = createMockComment();
      mockCommentService.getExamComments.mockResolvedValue([mockComment]);
      mockCommentService.deleteComment.mockResolvedValue(undefined);

      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.comments).toHaveLength(1);

      await act(async () => {
        await result.current.handleDeleteComment('comment-123');
      });

      expect(mockCommentService.deleteComment).toHaveBeenCalledWith(mockExamId, 'comment-123');
      expect(result.current.comments).toHaveLength(0);
      expect(mockToast.showSuccess).toHaveBeenCalledWith('Comment deleted successfully!');
    });

    it('should handle delete API error', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      mockCommentService.deleteComment.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      await act(async () => {
        await result.current.handleDeleteComment('comment-123');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error deleting comment:', expect.any(Error));
      expect(mockToast.showError).toHaveBeenCalledWith('Failed to delete comment. Please try again.');
    });

    it('should handle missing examId or commentId', async () => {
      const consoleSpy = vi.spyOn(console, 'error');

      const { result } = renderHook(() => useComments(undefined, true, mockUserEmail, mockToast));

      await act(async () => {
        await result.current.handleDeleteComment('comment-123');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Missing examId or commentId:', {
        examId: undefined,
        commentId: 'comment-123',
      });
    });
  });

  describe('comment permissions', () => {
    it('should allow user to edit their own comment', () => {
      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      const userComment = createMockComment({ userEmail: mockUserEmail });
      const canEdit = result.current.canUserEditComment(userComment);

      expect(canEdit).toBe(true);
    });

    it('should not allow user to edit others comments', () => {
      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      const otherComment = createMockComment({ userEmail: 'other@example.com' });
      const canEdit = result.current.canUserEditComment(otherComment);

      expect(canEdit).toBe(false);
    });

    it('should not allow unauthenticated user to edit any comment', () => {
      const { result } = renderHook(() => useComments(mockExamId, false, mockUserEmail, mockToast));

      const userComment = createMockComment({ userEmail: mockUserEmail });
      const canEdit = result.current.canUserEditComment(userComment);

      expect(canEdit).toBe(false);
    });

    it('should handle undefined userEmail', () => {
      const { result } = renderHook(() => useComments(mockExamId, true, undefined, mockToast));

      const userComment = createMockComment();
      const canEdit = result.current.canUserEditComment(userComment);

      expect(canEdit).toBe(false);
    });
  });

  describe('utility functions', () => {
    it('should format date correctly', () => {
      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      const formatted = result.current.formatDate('2024-01-15T14:30:00Z');
      expect(formatted).toBe('Jan 15, 2024, 02:30 PM');
    });

    it('should handle invalid date strings', () => {
      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      const invalidDate = 'invalid-date';
      const formatted = result.current.formatDate(invalidDate);
      expect(formatted).toBe(invalidDate);
    });

    it('should handle undefined date', () => {
      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      const formatted = result.current.formatDate(undefined);
      expect(formatted).toBe('');
    });

    it('should handle format date errors gracefully', () => {
      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      // Mock toLocaleDateString to throw
      const originalToLocaleDateString = Date.prototype.toLocaleDateString;
      Date.prototype.toLocaleDateString = vi.fn().mockImplementation(() => {
        throw new Error('Format error');
      });

      const dateString = '2024-01-15T14:30:00Z';
      const formatted = result.current.formatDate(dateString);
      expect(formatted).toBe(dateString);

      // Restore original method
      Date.prototype.toLocaleDateString = originalToLocaleDateString;
    });
  });

  describe('rating statistics', () => {
    it('should calculate average rating correctly', async () => {
      const commentsWithRatings = [
        createMockComment({ examRating: 5 }),
        createMockComment({ examRating: 3 }),
        createMockComment({ examRating: 4 }),
        createMockComment({ examRating: 0 }), // Should be excluded
        createMockComment({ examRating: undefined }), // Should be excluded
      ];

      mockCommentService.getExamComments.mockResolvedValue(commentsWithRatings);

      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.ratingStats.averageRating).toBe(4);
      expect(result.current.ratingStats.ratingCount).toBe(3);
      expect(result.current.ratingStats.hasRatings).toBe(true);
    });

    it('should handle no ratings', async () => {
      const commentsWithoutRatings = [
        createMockComment({ examRating: 0 }),
        createMockComment({ examRating: undefined }),
      ];

      mockCommentService.getExamComments.mockResolvedValue(commentsWithoutRatings);

      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.ratingStats.averageRating).toBeNull();
      expect(result.current.ratingStats.ratingCount).toBe(0);
      expect(result.current.ratingStats.hasRatings).toBe(false);
    });

    it('should handle empty comments array', async () => {
      mockCommentService.getExamComments.mockResolvedValue([]);

      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.ratingStats.averageRating).toBeNull();
      expect(result.current.ratingStats.ratingCount).toBe(0);
      expect(result.current.ratingStats.hasRatings).toBe(false);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle missing toast functions gracefully', async () => {
      mockCommentService.getExamComments.mockResolvedValue([]);
      mockCommentService.addComment.mockResolvedValue(createMockComment());

      const { result } = renderHook(() => useComments(mockExamId, true, mockUserEmail, undefined));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setCommentText('Test comment');
      });

      // Should not throw without toast functions
      await act(async () => {
        await result.current.handleSubmitComment();
      });

      expect(result.current.comments).toHaveLength(1);
    });

    it('should handle component unmount during async operations', async () => {
      let resolveComments: (value: any) => void;
      const commentsPromise = new Promise((resolve) => {
        resolveComments = resolve;
      });
      mockCommentService.getExamComments.mockReturnValue(commentsPromise);

      const { result, unmount } = renderHook(() => useComments(mockExamId, true, mockUserEmail, mockToast));

      expect(result.current.loading).toBe(true);

      // Unmount before comments load
      unmount();

      // Resolve promise after unmount
      act(() => {
        resolveComments!([createMockComment()]);
      });

      // Should not cause errors - just test that unmount doesn't throw
      expect(true).toBe(true); // Test passes if no errors thrown
    });

    it('should handle examId changes', async () => {
      const firstExamComments = [createMockComment({ id: 'exam1-comment' })];
      const secondExamComments = [createMockComment({ id: 'exam2-comment' })];

      mockCommentService.getExamComments
        .mockResolvedValueOnce(firstExamComments)
        .mockResolvedValueOnce(secondExamComments);

      const { result, rerender } = renderHook(({ examId }) => useComments(examId, true, mockUserEmail, mockToast), {
        initialProps: { examId: 'exam-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.comments).toEqual(firstExamComments);

      // Change examId
      rerender({ examId: 'exam-2' });

      await waitFor(() => {
        expect(result.current.comments).toEqual(secondExamComments);
      });

      expect(mockCommentService.getExamComments).toHaveBeenCalledTimes(2);
      expect(mockCommentService.getExamComments).toHaveBeenLastCalledWith('exam-2');
    });
  });
});