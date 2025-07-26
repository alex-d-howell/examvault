package com.howell.examvault.base.domain;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

class CommentValidationTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("Should pass validation for valid comment")
    void shouldPassValidationForValidComment() {
        // Given
        Comment comment = new Comment(
            UUID.randomUUID(),
            "user@example.com",
            Instant.now(),
            "This is a valid comment"
        );
        comment.setExamRating(5);

        // When
        Set<ConstraintViolation<Comment>> violations = validator.validate(comment);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("Should fail validation for null email")
    void shouldFailValidationForNullEmail() {
        // Given
        Comment comment = new Comment(
            UUID.randomUUID(),
            null, // Invalid
            Instant.now(),
            "Comment text"
        );

        // When
        Set<ConstraintViolation<Comment>> violations = validator.validate(comment);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage())
            .isEqualTo("User email is required");
    }

    @Test
    @DisplayName("Should fail validation for invalid email format")
    void shouldFailValidationForInvalidEmailFormat() {
        // Given
        Comment comment = new Comment(
            UUID.randomUUID(),
            "invalid-email", // Invalid format
            Instant.now(),
            "Comment text"
        );

        // When
        Set<ConstraintViolation<Comment>> violations = validator.validate(comment);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage())
            .isEqualTo("Valid email is required");
    }

    @Test
    @DisplayName("Should fail validation for comment text too long")
    void shouldFailValidationForCommentTextTooLong() {
        // Given
        String longText = "a".repeat(1001); // Exceeds 1000 character limit
        Comment comment = new Comment(
            UUID.randomUUID(),
            "user@example.com",
            Instant.now(),
            longText
        );

        // When
        Set<ConstraintViolation<Comment>> violations = validator.validate(comment);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage())
            .isEqualTo("Comment must be between 1 and 1000 characters");
    }

    @Test
    @DisplayName("Should fail validation for invalid rating")
    void shouldFailValidationForInvalidRating() {
        // Given
        Comment comment = new Comment(
            UUID.randomUUID(),
            "user@example.com",
            Instant.now(),
            "Comment text"
        );
        comment.setExamRating(6); // Invalid rating (should be 0-5)

        // When
        Set<ConstraintViolation<Comment>> violations = validator.validate(comment);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage())
            .isEqualTo("Rating must be between 0 and 5");
    }
}