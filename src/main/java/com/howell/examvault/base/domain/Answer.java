package com.howell.examvault.base.domain;

import java.io.Serializable;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "answer")
public class Answer implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "exam_attempt_id", nullable = false)
    @JsonIgnore  // Prevents serialization issues
    private ExamAttempt examAttempt;

    @NotNull(message = "Question ID is required")
    @Column(name = "question_id", nullable = false)
    private UUID questionId;

    @NotEmpty(message = "Answer choices are required")
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "answer_choices", columnDefinition = "text[]")
    private List<String> answerChoices;

    /**
     * Whether this answer is correct (computed automatically via database
     * trigger)
     */
    @Column(name = "is_correct")
    private Boolean isCorrect;

    // Constructors
    public Answer() {
    }

    /**
     * Main constructor with examAttempt reference (matching Question pattern)
     */
    public Answer(ExamAttempt examAttempt, UUID questionId, List<String> answerChoices) {
        this.examAttempt = examAttempt;
        this.questionId = questionId;
        this.answerChoices = answerChoices;
    }

    /**
     * Constructor with examAttemptId for backward compatibility
     */
    public Answer(UUID examAttemptId, UUID questionId, List<String> answerChoices) {
        this.questionId = questionId;
        this.answerChoices = answerChoices;
        // Note: examAttempt will be set by the service layer
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public ExamAttempt getExamAttempt() {
        return examAttempt;
    }

    public void setExamAttempt(ExamAttempt examAttempt) {
        this.examAttempt = examAttempt;
    }

    public UUID getQuestionId() {
        return questionId;
    }

    public void setQuestionId(UUID questionId) {
        this.questionId = questionId;
    }

    public List<String> getAnswerChoices() {
        return answerChoices;
    }

    public void setAnswerChoices(List<String> answerChoices) {
        this.answerChoices = answerChoices;
    }

    public Boolean getIsCorrect() {
        return isCorrect;
    }

    public void setIsCorrect(Boolean isCorrect) {
        this.isCorrect = isCorrect;
    }
}
