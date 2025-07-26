package com.howell.examvault.base.exception;

import java.util.UUID;

public class CommentNotFoundException extends ExamVaultException {
    public CommentNotFoundException(String commentId) {
        super("Comment not found with ID: " + commentId);
    }
    
    public CommentNotFoundException(UUID commentId) {
        super("Comment not found with ID: " + commentId);
    }
}