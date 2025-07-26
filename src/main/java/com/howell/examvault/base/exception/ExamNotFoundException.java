package com.howell.examvault.base.exception;

import java.util.UUID;

public class ExamNotFoundException extends ExamVaultException {
    public ExamNotFoundException(String examId) {
        super("Exam not found with ID: " + examId);
    }
    
    public ExamNotFoundException(UUID examId) {
        super("Exam not found with ID: " + examId);
    }
}