package com.howell.examvault.base.domain;

import java.io.Serializable;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "questions")
public class Question implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull(message = "Question text is required")
    private String questionText;

    @NotNull(message = "Options are required")
    private List<String> options;

    @NotNull(message = "Correct answer is required")
    private String correctAnswer;

    @NotNull(message = "Multiple answers flag is required")
    private Boolean isMultipleAnswers;

    // Constructors, getters, and setters
    public Question() {
    }

    public Question(String questionText, List<String> options, String correctAnswer, Boolean isMultipleAnswers) {
        this.questionText = questionText;
        this.options = options;
        this.correctAnswer = correctAnswer;
        this.isMultipleAnswers = isMultipleAnswers;
    }

    public UUID getId() {
        return id;
    }

    public Boolean getIsMultipleAnswers() {
        return isMultipleAnswers;
    }

    public void setIsMultipleAnswers(Boolean isMultipleAnswers) {
        this.isMultipleAnswers = isMultipleAnswers;
    }

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(String correctAnswer) {
        this.correctAnswer = correctAnswer;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }
}
