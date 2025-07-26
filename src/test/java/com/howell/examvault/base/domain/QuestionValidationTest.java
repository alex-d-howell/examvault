package com.howell.examvault.base.domain;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class QuestionValidationTest {

    @Nested
    @DisplayName("Answer Validation Tests")
    class AnswerValidationTests {

        @Test
        @DisplayName("Should validate correct single answer")
        void shouldValidateCorrectSingleAnswer() {
            // Given
            Question question = new Question(
                "What is 2 + 2?",
                List.of("2", "3", "4", "5"),
                List.of("4"),
                false,
                "Basic math"
            );

            // When & Then
            assertThat(question.validateAnswers(List.of("4"))).isTrue();
        }

        @Test
        @DisplayName("Should validate correct multiple answers")
        void shouldValidateCorrectMultipleAnswers() {
            // Given
            Question question = new Question(
                "Which are programming languages?",
                List.of("Java", "HTML", "Python", "CSS"),
                List.of("Java", "Python"),
                true,
                "Java and Python are programming languages"
            );

            // When & Then
            assertThat(question.validateAnswers(List.of("Java", "Python"))).isTrue();
            assertThat(question.validateAnswers(List.of("Python", "Java"))).isTrue(); // Order doesn't matter
        }

        @Test
        @DisplayName("Should reject incorrect answers")
        void shouldRejectIncorrectAnswers() {
            // Given
            Question question = new Question(
                "What is 2 + 2?",
                List.of("2", "3", "4", "5"),
                List.of("4"),
                false,
                "Basic math"
            );

            // When & Then
            assertThat(question.validateAnswers(List.of("3"))).isFalse();
            assertThat(question.validateAnswers(List.of("4", "5"))).isFalse(); // Too many answers
            assertThat(question.validateAnswers(List.of())).isFalse(); // No answers
        }

        @Test
        @DisplayName("Should handle null and empty cases")
        void shouldHandleNullAndEmptyCases() {
            // Given
            Question question = new Question(
                "Test question",
                List.of("A", "B"),
                List.of("A"),
                false,
                null
            );

            // When & Then
            assertThat(question.validateAnswers(null)).isFalse();
            assertThat(question.validateAnswers(List.of())).isFalse();
        }

        @Test
        @DisplayName("Should check if option is correct")
        void shouldCheckIfOptionIsCorrect() {
            // Given
            Question question = new Question(
                "Test question",
                List.of("A", "B", "C"),
                List.of("A", "C"),
                true,
                null
            );

            // When & Then
            assertThat(question.isCorrectOption("A")).isTrue();
            assertThat(question.isCorrectOption("B")).isFalse();
            assertThat(question.isCorrectOption("C")).isTrue();
            assertThat(question.isCorrectOption("D")).isFalse();
        }

        @Test
        @DisplayName("Should check if question has explanation")
        void shouldCheckIfQuestionHasExplanation() {
            // Given
            Question withExplanation = new Question("Q", List.of("A"), List.of("A"), false, "Explanation");
            Question withoutExplanation = new Question("Q", List.of("A"), List.of("A"), false, null);
            Question withEmptyExplanation = new Question("Q", List.of("A"), List.of("A"), false, "   ");

            // When & Then
            assertThat(withExplanation.hasExplanation()).isTrue();
            assertThat(withoutExplanation.hasExplanation()).isFalse();
            assertThat(withEmptyExplanation.hasExplanation()).isFalse();
        }
    }
}