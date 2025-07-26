package com.howell.examvault.base.exception;

public class ExamVaultException extends RuntimeException {
    public ExamVaultException(String message) {
        super(message);
    }
    
    public ExamVaultException(String message, Throwable cause) {
        super(message, cause);
    }
}