package com.howell.examvault.base.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;

import com.howell.examvault.base.BaseIntegrationTest;
import com.howell.examvault.base.TestConfig;
import com.howell.examvault.base.TestDataBuilder;
import com.howell.examvault.base.domain.Exam;
import com.howell.examvault.base.exception.ExamNotFoundException;
import com.howell.examvault.base.exception.UnauthorizedException;
import com.howell.examvault.base.exception.ValidationException;
import com.howell.examvault.base.repository.ExamRepository;
import com.howell.examvault.base.security.UserDetails;

@Import(TestConfig.class)
class ExamCrudServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private ExamCrudService examCrudService;

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private UserService userService;

    private Exam testExam;

    @BeforeEach
    void setUp() {
        testExam = TestDataBuilder.examBuilder()
                .title("Integration Test Exam")
                .uploadedBy("test@example.com")
                .build();
    }

    @Nested
    @DisplayName("Save Exam Tests")
    class SaveExamTests {

        @Test
        @WithMockUser
        @DisplayName("Should save exam successfully when authenticated")
        void shouldSaveExamWhenAuthenticated() {
            // Given
            when(userService.isAuthenticated()).thenReturn(true);
            when(userService.getAuthenticatedUser()).thenReturn(
                    new UserDetails("test@example.com", "Test User", null, "sub123")
            );

            // When
            Exam savedExam = examCrudService.saveExam(testExam);

            // Then
            assertThat(savedExam).isNotNull();
            assertThat(savedExam.getId()).isNotNull();
            assertThat(savedExam.getTitle()).isEqualTo("Integration Test Exam");
            assertThat(savedExam.getUploadedBy()).isEqualTo("test@example.com");
            assertThat(savedExam.getUploadedAt()).isEqualTo(FIXED_INSTANT);

            // Verify it's actually in the database
            Optional<Exam> found = examRepository.findById(savedExam.getId());
            assertThat(found).isPresent();
            assertThat(found.get().getTitle()).isEqualTo("Integration Test Exam");
        }

        @Test
        @DisplayName("Should throw UnauthorizedException when not authenticated")
        void shouldThrowExceptionWhenNotAuthenticated() {
            // Given
            when(userService.isAuthenticated()).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> examCrudService.saveExam(testExam))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessage("Authentication required to create exams");
        }

        @Test
        @WithMockUser
        @DisplayName("Should throw ValidationException when title is null")
        void shouldThrowExceptionWhenTitleIsNull() {
            // Given
            when(userService.isAuthenticated()).thenReturn(true);
            when(userService.getAuthenticatedUser()).thenReturn(
                    new UserDetails("test@example.com", "Test User", null, "sub123")
            );

            testExam.setTitle(null);

            // When & Then
            assertThatThrownBy(() -> examCrudService.saveExam(testExam))
                    .isInstanceOf(ValidationException.class)
                    .hasMessage("Exam title is required");
        }

        @Test
        @WithMockUser
        @DisplayName("Should throw ValidationException when no questions")
        void shouldThrowExceptionWhenNoQuestions() {
            // Given
            when(userService.isAuthenticated()).thenReturn(true);
            when(userService.getAuthenticatedUser()).thenReturn(
                    new UserDetails("test@example.com", "Test User", null, "sub123")
            );

            testExam.setQuestions(null);

            // When & Then
            assertThatThrownBy(() -> examCrudService.saveExam(testExam))
                    .isInstanceOf(ValidationException.class)
                    .hasMessage("Exam must have at least one question");
        }

        @Test
        @WithMockUser
        @DisplayName("Should validate and normalize tags")
        void shouldValidateAndNormalizeTags() {
            // Given
            when(userService.isAuthenticated()).thenReturn(true);
            when(userService.getAuthenticatedUser()).thenReturn(
                    new UserDetails("test@example.com", "Test User", null, "sub123")
            );

            testExam.setTags(new ArrayList<>(List.of("  Java  ", "SPRING", "test")));

            // When
            Exam savedExam = examCrudService.saveExam(testExam);

            // Then
            assertThat(savedExam.getTags()).containsExactly("java", "spring", "test");
        }
    }

    @Nested
    @DisplayName("Update Exam Tests")
    class UpdateExamTests {

        private Exam existingExam;

        @BeforeEach
        void setUp() {
            // Save an exam first
            existingExam = examRepository.save(testExam);
        }

        @Test
        @WithMockUser
        @DisplayName("Should update exam when user owns it")
        void shouldUpdateExamWhenUserOwnsIt() {
            // Given
            when(userService.isAuthenticated()).thenReturn(true);
            when(userService.getAuthenticatedUser()).thenReturn(
                    new UserDetails("test@example.com", "Test User", null, "sub123")
            );

            existingExam.setTitle("Updated Title");
            existingExam.setDescription("Updated Description");

            // When
            Exam updatedExam = examCrudService.updateExam(existingExam);

            // Then
            assertThat(updatedExam.getTitle()).isEqualTo("Updated Title");
            assertThat(updatedExam.getDescription()).isEqualTo("Updated Description");
            assertThat(updatedExam.getUploadedBy()).isEqualTo("test@example.com"); // Preserved
            assertThat(updatedExam.getUploadedAt()).isEqualTo(FIXED_INSTANT); // Preserved
        }

        @Test
        @WithMockUser
        @DisplayName("Should throw UnauthorizedException when user doesn't own exam")
        void shouldThrowExceptionWhenUserDoesntOwnExam() {
            // Given
            when(userService.isAuthenticated()).thenReturn(true);
            when(userService.getAuthenticatedUser()).thenReturn(
                    new UserDetails("different@example.com", "Different User", null, "sub456")
            );

            // When & Then
            assertThatThrownBy(() -> examCrudService.updateExam(existingExam))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessage("You can only update exams you created");
        }

        @Test
        @DisplayName("Should throw ExamNotFoundException when exam doesn't exist")
        void shouldThrowExceptionWhenExamDoesntExist() {
            // Given
            when(userService.isAuthenticated()).thenReturn(true);

            Exam nonExistentExam = TestDataBuilder.examBuilder().build();
            nonExistentExam.setId(UUID.randomUUID()); // Non-existent ID

            // When & Then
            assertThatThrownBy(() -> examCrudService.updateExam(nonExistentExam))
                    .isInstanceOf(ExamNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Get Exam Tests")
    class GetExamTests {

        @Test
        @DisplayName("Should return exam when it exists")
        void shouldReturnExamWhenExists() {
            // Given
            Exam savedExam = examRepository.save(testExam);

            // When
            Exam found = examCrudService.getExamById(savedExam.getId());

            // Then
            assertThat(found).isNotNull();
            assertThat(found.getId()).isEqualTo(savedExam.getId());
            assertThat(found.getTitle()).isEqualTo("Integration Test Exam");
            assertThat(found.getQuestions()).isNotNull().hasSize(1);
        }

        @Test
        @DisplayName("Should return null when exam doesn't exist")
        void shouldReturnNullWhenExamDoesntExist() {
            // Given
            UUID nonExistentId = UUID.randomUUID();

            // When
            Exam found = examCrudService.getExamById(nonExistentId);

            // Then
            assertThat(found).isNull();
        }
    }

    @Nested
    @DisplayName("Delete Exam Tests")
    class DeleteExamTests {

        private Exam existingExam;

        @BeforeEach
        void setUp() {
            existingExam = examRepository.save(testExam);
        }

        @Test
        @WithMockUser
        @DisplayName("Should delete exam when user owns it")
        void shouldDeleteExamWhenUserOwnsIt() {
            // Given
            when(userService.isAuthenticated()).thenReturn(true);
            when(userService.getAuthenticatedUser()).thenReturn(
                    new UserDetails("test@example.com", "Test User", null, "sub123")
            );

            // When
            examCrudService.deleteExamById(existingExam.getId());

            // Then
            Optional<Exam> found = examRepository.findById(existingExam.getId());
            assertThat(found).isEmpty();
        }

        @Test
        @WithMockUser
        @DisplayName("Should throw UnauthorizedException when user doesn't own exam")
        void shouldThrowExceptionWhenUserDoesntOwnExam() {
            // Given
            when(userService.isAuthenticated()).thenReturn(true);
            when(userService.getAuthenticatedUser()).thenReturn(
                    new UserDetails("different@example.com", "Different User", null, "sub456")
            );

            // When & Then
            assertThatThrownBy(() -> examCrudService.deleteExamById(existingExam.getId()))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessage("You can only delete exams you created");
        }
    }

    @Nested
    @DisplayName("Tag Validation Tests")
    class TagValidationTests {

        @Test
        @WithMockUser
        @DisplayName("Should reject more than 10 tags")
        void shouldRejectMoreThan10Tags() {
            // Given
            when(userService.isAuthenticated()).thenReturn(true);
            when(userService.getAuthenticatedUser()).thenReturn(
                    new UserDetails("test@example.com", "Test User", null, "sub123")
            );

            List<String> tooManyTags = new ArrayList<>(List.of("tag1", "tag2", "tag3", "tag4", "tag5",
                    "tag6", "tag7", "tag8", "tag9", "tag10", "tag11"));
            testExam.setTags(tooManyTags);

            // When & Then
            assertThatThrownBy(() -> examCrudService.saveExam(testExam))
                    .isInstanceOf(ValidationException.class)
                    .hasMessage("Maximum of 10 tags allowed per exam");
        }

        @Test
        @WithMockUser
        @DisplayName("Should reject tags longer than 50 characters")
        void shouldRejectLongTags() {
            // Given
            when(userService.isAuthenticated()).thenReturn(true);
            when(userService.getAuthenticatedUser()).thenReturn(
                    new UserDetails("test@example.com", "Test User", null, "sub123")
            );

            String longTag = "a".repeat(51);
            testExam.setTags(new ArrayList<>(List.of(longTag)));

            // When & Then
            assertThatThrownBy(() -> examCrudService.saveExam(testExam))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Tags cannot exceed 50 characters");
        }

        @Test
        @WithMockUser
        @DisplayName("Should reject tags with invalid characters")
        void shouldRejectInvalidTagCharacters() {
            // Given
            when(userService.isAuthenticated()).thenReturn(true);
            when(userService.getAuthenticatedUser()).thenReturn(
                    new UserDetails("test@example.com", "Test User", null, "sub123")
            );

            testExam.setTags(new ArrayList<>(List.of("tag@invalid")));

            // When & Then
            assertThatThrownBy(() -> examCrudService.saveExam(testExam))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Tags can only contain letters, numbers, spaces, hyphens, and underscores");
        }
    }
}
