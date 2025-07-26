package com.howell.examvault.base.domain;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "comment")
public class Comment implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull(message = "Exam ID is required")
    @Column(name = "exam_id", nullable = false)
    private UUID examId;

    @NotBlank(message = "User email is required")
    @Email(message = "Valid email is required")
    private String userEmail;

    @NotNull(message = "Date created is required")
    private Instant dateCreated;

    @NotBlank(message = "Comment text is required")
    @Size(min = 1, max = 1000, message = "Comment must be between 1 and 1000 characters")
    private String commentString;

    @Min(value = 0, message = "Rating must be between 0 and 5")
    @Max(value = 5, message = "Rating must be between 0 and 5")
    private int examRating;

    // Constructors
    public Comment() {}

    public Comment(UUID examId, String userEmail, Instant dateCreated, String commentString) {
        this.examId = examId;
        this.userEmail = userEmail;
        this.dateCreated = dateCreated;
        this.commentString = commentString;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public Instant getDateCreated() {
        return dateCreated;
    }

    public void setDateCreated(Instant dateCreated) {
        this.dateCreated = dateCreated;
    }

    public String getCommentString() {
        return commentString;
    }

    public void setCommentString(String commentString) {
        this.commentString = commentString;
    }

    public int getExamRating() {
        return examRating;
    }

    public void setExamRating(int examRating) {
        this.examRating = examRating;
    }

    public UUID getExamId() {
        return examId;
    }

    public void setExamId(UUID examId) {
        this.examId = examId;
    }

}
