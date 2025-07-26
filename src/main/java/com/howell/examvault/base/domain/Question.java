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
import jakarta.validation.constraints.NotNull;

/**
 * Enhanced Question entity with PostgreSQL array support and utility methods
 * Uses Hypersistence Utils for optimal PostgreSQL array performance
 */
@Entity
@Table(name = "question")
public class Question implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull(message = "Question text is required")
    @Column(name = "question_text", nullable = false)
    private String questionText;

    /**
     * Answer options stored as PostgreSQL TEXT[] array
     */
    @NotNull(message = "Options are required")
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "options", columnDefinition = "text[]", nullable = false)
    private List<String> options;

    /**
     * Correct answers stored as PostgreSQL TEXT[] array Supports both single
     * and multiple correct answers
     */
    @NotNull(message = "Correct answer is required")
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "correct_answers", columnDefinition = "text[]", nullable = false)
    private List<String> correctAnswers;

    @NotNull(message = "Multiple answers flag is required")
    @Column(name = "is_multiple_answers", nullable = false)
    private Boolean isMultipleAnswers;

    @Column(name = "explanation")
    private String explanation;

    @ManyToOne
    @JoinColumn(name = "exam_id", nullable = false)
    @JsonIgnore  // This prevents serialization issues
    private Exam exam;

    // Constructors
    public Question() {
    }

    public Question(String questionText, List<String> options, List<String> correctAnswers,
            Boolean isMultipleAnswers, String explanation) {
        this.questionText = questionText;
        this.options = options;
        this.correctAnswers = correctAnswers;
        this.isMultipleAnswers = isMultipleAnswers;
        this.explanation = explanation;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public List<String> getCorrectAnswers() {
        return correctAnswers;
    }

    public void setCorrectAnswers(List<String> correctAnswers) {
        this.correctAnswers = correctAnswers;
    }

    public Boolean getIsMultipleAnswers() {
        return isMultipleAnswers;
    }

    public void setIsMultipleAnswers(Boolean isMultipleAnswers) {
        this.isMultipleAnswers = isMultipleAnswers;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public Exam getExam() {
        return exam;
    }

    public void setExam(Exam exam) {
        this.exam = exam;
    }

    /**
     * Check if a specific option is a correct answer
     */
    public boolean isCorrectOption(String option) {
        return correctAnswers != null && correctAnswers.contains(option);
    }

    /**
     * Check if a list of selected answers is completely correct This method
     * validates both the content and the count of selected answers
     */
    public boolean validateAnswers(List<String> selectedAnswers) {
        if (selectedAnswers == null || correctAnswers == null) {
            return false;
        }

        // Check if the lists have the same size and contain the same elements
        if (selectedAnswers.size() != correctAnswers.size()) {
            return false;
        }

        // Check if all selected answers are correct and all correct answers are selected
        return selectedAnswers.containsAll(correctAnswers)
                && correctAnswers.containsAll(selectedAnswers);
    }

    /**
     * Check if the question has an explanation
     */
    public boolean hasExplanation() {
        return explanation != null && !explanation.trim().isEmpty();
    }
}
