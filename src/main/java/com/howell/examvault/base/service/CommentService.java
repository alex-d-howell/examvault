package com.howell.examvault.base.service;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.howell.examvault.base.domain.Comment;
import com.howell.examvault.base.exception.CommentNotFoundException;
import com.howell.examvault.base.exception.ExamNotFoundException;
import com.howell.examvault.base.exception.UnauthorizedException;
import com.howell.examvault.base.exception.ValidationException;
import com.howell.examvault.base.repository.CommentRepository;
import com.howell.examvault.base.repository.ExamRepository;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;

import jakarta.annotation.security.PermitAll;

@BrowserCallable
@Service
@Transactional(readOnly = true)
public class CommentService {

    private final ExamRepository examRepository;
    private final CommentRepository commentRepository;
    private final UserService userService; // ✅ ADDED - Use UserService for consistency
    private final Clock clock;

    public CommentService(ExamRepository examRepository, 
                         CommentRepository commentRepository,
                         UserService userService, // ✅ ADDED - Inject UserService
                         Clock clock) {
        this.examRepository = examRepository;
        this.commentRepository = commentRepository;
        this.userService = userService; // ✅ ADDED
        this.clock = clock;
    }

    // ✅ REMOVED - These methods are no longer needed:
    // private String getCurrentUserEmail() { ... }
    // private boolean isCurrentUserAuthenticated() { ... }

    @AnonymousAllowed
    public List<Comment> getExamComments(String examId) {
        try {
            UUID examUuid = UUID.fromString(examId);
            
            // Verify exam exists
            if (!examRepository.existsById(examUuid)) {
                throw new ExamNotFoundException(examId);
            }

            // Get comments directly from comment repository
            return commentRepository.findByExamIdOrderByDateCreatedDesc(examUuid);
            
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid exam ID format");
        }
    }

    @PermitAll
    @Transactional
    public Comment addComment(String examId, String commentText, Integer rating) {
        if (!userService.isAuthenticated()) { // ✅ CHANGED - Use UserService
            throw new UnauthorizedException("Authentication required to add comments");
        }

        try {
            UUID examUuid = UUID.fromString(examId);
            
            // Verify exam exists
            if (!examRepository.existsById(examUuid)) {
                throw new ExamNotFoundException(examId);
            }

            String userEmail = userService.getAuthenticatedUser().email(); // ✅ CHANGED - Use UserService
            
            // Create comment with examId set manually
            Comment comment = new Comment(examUuid, userEmail, clock.instant(), commentText);

            if (rating != null && rating >= 1 && rating <= 5) {
                comment.setExamRating(rating);
            }

            // Save directly to comment repository
            return commentRepository.save(comment);
            
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid exam ID format");
        }
    }

    @PermitAll
    @Transactional
    public Comment updateComment(String examId, String commentId, String newCommentText, Integer newRating) {
        if (!userService.isAuthenticated()) { // ✅ CHANGED - Use UserService
            throw new UnauthorizedException("Authentication required to update comments");
        }

        try {
            UUID examUuid = UUID.fromString(examId);
            UUID commentUuid = UUID.fromString(commentId);
            
            // Verify exam exists
            if (!examRepository.existsById(examUuid)) {
                throw new ExamNotFoundException(examId);
            }

            // Find comment
            Comment comment = commentRepository.findById(commentUuid)
                    .orElseThrow(() -> new CommentNotFoundException("Comment not found with ID: " + commentId));
            
            // Verify comment belongs to this exam
            if (!comment.getExamId().equals(examUuid)) {
                throw new ValidationException("Comment does not belong to this exam");
            }
            
            // Check ownership
            String userEmail = userService.getAuthenticatedUser().email(); // ✅ CHANGED - Use UserService
            if (!comment.getUserEmail().equals(userEmail)) {
                throw new UnauthorizedException("You can only update your own comments");
            }
            
            // Update comment
            comment.setCommentString(newCommentText);
            if (newRating != null && newRating >= 1 && newRating <= 5) {
                comment.setExamRating(newRating);
            } else {
                comment.setExamRating(0);
            }
            
            return commentRepository.save(comment);
            
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid ID format");
        }
    }

    @PermitAll
    @Transactional
    public void deleteComment(String examId, String commentId) {
        if (!userService.isAuthenticated()) { // ✅ CHANGED - Use UserService
            throw new UnauthorizedException("Authentication required to delete comments");
        }

        try {
            UUID examUuid = UUID.fromString(examId);
            UUID commentUuid = UUID.fromString(commentId);
            
            // Verify exam exists
            if (!examRepository.existsById(examUuid)) {
                throw new ExamNotFoundException(examId);
            }

            // Find comment
            Comment comment = commentRepository.findById(commentUuid)
                    .orElseThrow(() -> new CommentNotFoundException("Comment not found with ID: " + commentId));
            
            // Verify comment belongs to this exam
            if (!comment.getExamId().equals(examUuid)) {
                throw new ValidationException("Comment does not belong to this exam");
            }
            
            // Check ownership
            String userEmail = userService.getAuthenticatedUser().email(); // ✅ CHANGED - Use UserService
            if (!comment.getUserEmail().equals(userEmail)) {
                throw new UnauthorizedException("You can only delete your own comments");
            }
            
            // Delete directly
            commentRepository.deleteById(commentUuid);
            
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid ID format");
        }
    }

    @AnonymousAllowed
    public boolean canUserModifyComment(String examId, String commentId) {
        if (!userService.isAuthenticated()) { // ✅ CHANGED - Use UserService
            return false;
        }

        try {
            UUID examUuid = UUID.fromString(examId);
            UUID commentUuid = UUID.fromString(commentId);
            
            // Verify exam exists
            if (!examRepository.existsById(examUuid)) {
                return false;
            }

            // Find comment
            Comment comment = commentRepository.findById(commentUuid).orElse(null);
            if (comment == null) {
                return false;
            }
            
            // Verify comment belongs to this exam
            if (!comment.getExamId().equals(examUuid)) {
                return false;
            }
            
            // Check ownership
            String userEmail = userService.getAuthenticatedUser().email(); // ✅ CHANGED - Use UserService
            return comment.getUserEmail().equals(userEmail);
            
        } catch (Exception e) {
            return false;
        }
    }
}