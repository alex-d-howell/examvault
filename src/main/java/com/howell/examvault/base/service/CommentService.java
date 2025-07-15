package com.howell.examvault.base.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import com.howell.examvault.base.domain.Comment;
import com.howell.examvault.base.domain.Exam;
import com.howell.examvault.base.repository.ExamRepository;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;

import jakarta.annotation.security.PermitAll;

@BrowserCallable
@Service
public class CommentService {

    private final ExamRepository examRepository;

    public CommentService(ExamRepository examRepository) {
        this.examRepository = examRepository;
    }

    /**
     * Get the current user's email, or null if anonymous
     */
    private String getCurrentUserEmail() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof OidcUser) {
                OidcUser user = (OidcUser) auth.getPrincipal();
                return user.getEmail();
            }
        } catch (Exception e) {
            System.err.println("Error getting current user email: " + e.getMessage());
        }
        return null;
    }

    /**
     * Check if the current user is authenticated
     */
    private boolean isCurrentUserAuthenticated() {
        return getCurrentUserEmail() != null;
    }

    /**
     * Get comments for a specific exam
     * Available to everyone
     *
     * @param examId the UUID of the exam
     * @return list of comments for the exam
     */
    @AnonymousAllowed
    public List<Comment> getExamComments(String examId) {
        try {
            UUID examUuid = UUID.fromString(examId);
            Exam exam = examRepository.findById(examUuid).orElse(null);
            if (exam == null) {
                throw new RuntimeException("Exam not found");
            }

            return exam.getComments() != null ? exam.getComments() : List.of();
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid exam ID format");
        }
    }

    /**
     * Add a comment to an exam
     * Requires authentication
     *
     * @param examId the UUID of the exam to comment on
     * @param commentText the comment text
     * @param rating optional rating (1-5)
     * @return the created Comment
     */
    @PermitAll
    public Comment addComment(String examId, String commentText, Integer rating) {
        if (!isCurrentUserAuthenticated()) {
            throw new SecurityException("Authentication required to add comments");
        }

        try {
            System.out.println("Adding comment - examId: " + examId + ", rating: " + rating);
            
            UUID examUuid = UUID.fromString(examId);
            Exam exam = examRepository.findById(examUuid).orElse(null);
            if (exam == null) {
                throw new RuntimeException("Exam not found");
            }

            String userEmail = getCurrentUserEmail();
            Comment comment = new Comment(userEmail, Instant.now(), commentText);

            // Only set rating if it's a valid rating (1-5), otherwise leave as default (0)
            if (rating != null && rating >= 1 && rating <= 5) {
                comment.setExamRating(rating);
                System.out.println("Set rating to: " + rating);
            }
            // Don't set rating to 0 explicitly - let it stay at default

            exam.addComment(comment);
            Exam savedExam = examRepository.save(exam);
            
            // Find the saved comment with its generated ID
            Comment savedComment = null;
            if (savedExam.getComments() != null) {
                // Get the last comment (the one we just added) - find by user email and timestamp
                var comments = savedExam.getComments();
                for (int i = comments.size() - 1; i >= 0; i--) {
                    Comment c = comments.get(i);
                    if (c.getUserEmail().equals(userEmail) && 
                        c.getCommentString().equals(commentText)) {
                        savedComment = c;
                        break;
                    }
                }
            }
            
            System.out.println("Comment saved with ID: " + (savedComment != null ? savedComment.getId() : "null"));
            return savedComment != null ? savedComment : comment;
            
        } catch (IllegalArgumentException e) {
            System.err.println("Error parsing examId: " + examId);
            throw new RuntimeException("Invalid exam ID format");
        } catch (RuntimeException e) {
            System.err.println("Error adding comment: " + e.getMessage());
            throw e;
        }
    }

    /**
     * Update a comment made by the current user
     * Requires authentication and ownership of the comment
     *
     * @param examId the UUID of the exam
     * @param commentId the UUID of the comment to update
     * @param newCommentText the new comment text
     * @param newRating the new rating (1-5 or null)
     * @return the updated Comment
     */
    @PermitAll
    public Comment updateComment(String examId, String commentId, String newCommentText, Integer newRating) {
        if (!isCurrentUserAuthenticated()) {
            throw new SecurityException("Authentication required to update comments");
        }

        try {
            System.out.println("Updating comment - examId: " + examId + ", commentId: " + commentId);
            
            UUID examUuid = UUID.fromString(examId);
            UUID commentUuid = UUID.fromString(commentId);
            
            Exam exam = examRepository.findById(examUuid).orElse(null);
            if (exam == null) {
                throw new RuntimeException("Exam not found");
            }

            String userEmail = getCurrentUserEmail();
            
            // Find the comment to update
            Comment commentToUpdate = null;
            if (exam.getComments() != null) {
                for (Comment comment : exam.getComments()) {
                    if (comment.getId() != null && comment.getId().equals(commentUuid)) {
                        commentToUpdate = comment;
                        break;
                    }
                }
            }
            
            if (commentToUpdate == null) {
                throw new RuntimeException("Comment not found");
            }
            
            // Check if user owns this comment
            // TODO: Add admin role checking here when we implement roles
            if (!commentToUpdate.getUserEmail().equals(userEmail)) {
                throw new SecurityException("You can only update your own comments");
            }
            
            // Update the comment
            commentToUpdate.setCommentString(newCommentText);
            if (newRating != null && newRating >= 1 && newRating <= 5) {
                commentToUpdate.setExamRating(newRating);
                System.out.println("Updated rating to: " + newRating);
            } else {
                // Don't set to 0, leave it as is if they didn't provide a rating
                // Only clear if they explicitly want to remove the rating
                commentToUpdate.setExamRating(0);
                System.out.println("Cleared rating (set to 0)");
            }
            
            examRepository.save(exam);
            return commentToUpdate;
            
        } catch (IllegalArgumentException e) {
            System.err.println("Error parsing UUID - examId: " + examId + ", commentId: " + commentId);
            throw new RuntimeException("Invalid ID format");
        } catch (RuntimeException e) {
            System.err.println("Error updating comment: " + e.getMessage());
            throw e;
        }
    }

    /**
     * Delete a comment made by the current user
     * Requires authentication and ownership of the comment
     *
     * @param examId the UUID of the exam
     * @param commentId the UUID of the comment to delete
     */
    @PermitAll
    public void deleteComment(String examId, String commentId) {
        if (!isCurrentUserAuthenticated()) {
            throw new SecurityException("Authentication required to delete comments");
        }

        try {
            System.out.println("Deleting comment - examId: " + examId + ", commentId: " + commentId);
            
            UUID examUuid = UUID.fromString(examId);
            UUID commentUuid = UUID.fromString(commentId);
            
            Exam exam = examRepository.findById(examUuid).orElse(null);
            if (exam == null) {
                throw new RuntimeException("Exam not found");
            }

            String userEmail = getCurrentUserEmail();
            
            // Find and remove the comment
            if (exam.getComments() != null) {
                Comment commentToDelete = null;
                for (Comment comment : exam.getComments()) {
                    if (comment.getId() != null && comment.getId().equals(commentUuid)) {
                        commentToDelete = comment;
                        break;
                    }
                }
                
                if (commentToDelete == null) {
                    throw new RuntimeException("Comment not found");
                }
                
                // Check if user owns this comment
                // TODO: Add admin role checking here when we implement roles
                if (!commentToDelete.getUserEmail().equals(userEmail)) {
                    throw new SecurityException("You can only delete your own comments");
                }
                
                exam.getComments().remove(commentToDelete);
                examRepository.save(exam);
            }
            
        } catch (IllegalArgumentException e) {
            System.err.println("Error parsing UUID - examId: " + examId + ", commentId: " + commentId);
            throw new RuntimeException("Invalid ID format");
        } catch (RuntimeException e) {
            System.err.println("Error deleting comment: " + e.getMessage());
            throw e;
        }
    }

    /**
     * Check if the current user can modify a specific comment
     * Available to everyone to check edit permissions
     *
     * @param examId the UUID of the exam
     * @param commentId the UUID of the comment to check
     * @return true if the current user can modify the comment
     */
    @AnonymousAllowed
    public boolean canUserModifyComment(String examId, String commentId) {
        if (!isCurrentUserAuthenticated()) {
            return false;
        }

        try {
            UUID examUuid = UUID.fromString(examId);
            UUID commentUuid = UUID.fromString(commentId);
            
            Exam exam = examRepository.findById(examUuid).orElse(null);
            if (exam == null) {
                return false;
            }

            String userEmail = getCurrentUserEmail();
            
            // Find the comment
            if (exam.getComments() != null) {
                for (Comment comment : exam.getComments()) {
                    if (comment.getId() != null && comment.getId().equals(commentUuid)) {
                        // User can modify if they own the comment
                        // TODO: Add admin role checking here when we implement roles
                        return comment.getUserEmail().equals(userEmail);
                    }
                }
            }
            
            return false;
        } catch (Exception e) {
            System.err.println("Error checking comment modify permission: " + e.getMessage());
            return false;
        }
    }
}