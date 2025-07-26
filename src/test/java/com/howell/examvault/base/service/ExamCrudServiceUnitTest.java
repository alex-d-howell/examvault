package com.howell.examvault.base.service;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.howell.examvault.base.TestDataBuilder;
import com.howell.examvault.base.domain.Exam;
import com.howell.examvault.base.exception.UnauthorizedException;
import com.howell.examvault.base.exception.ValidationException;
import com.howell.examvault.base.repository.ExamRepository;
import com.howell.examvault.base.security.UserDetails;

@ExtendWith(MockitoExtension.class)
class ExamCrudServiceUnitTest {

    @Mock
    private ExamRepository examRepository;

    @Mock
    private UserService userService;

    @Mock
    private Clock clock;

    @InjectMocks
    private ExamCrudService examCrudService;

    private Exam testExam;
    private UserDetails testUser;
    private Instant fixedInstant;

    @BeforeEach
    void setUp() {
        fixedInstant = Instant.parse("2024-01-15T10:00:00Z");
        testUser = new UserDetails("test@example.com", "Test User", null, "sub123");
        
        lenient().when(clock.instant()).thenReturn(fixedInstant);
        
        testExam = TestDataBuilder.examBuilder()
                .title("Unit Test Exam")
                .uploadedBy("test@example.com")
                .build();
    }

    @Test
    @DisplayName("Should save exam with clock instant")
    void shouldSaveExamWithClockInstant() {
        // Given
        when(userService.isAuthenticated()).thenReturn(true);
        when(userService.getAuthenticatedUser()).thenReturn(testUser);
        when(examRepository.save(any(Exam.class))).thenReturn(testExam);

        // When
        Exam result = examCrudService.saveExam(testExam);

        // Then
        verify(examRepository).save(testExam);
        assertThat(testExam.getUploadedAt()).isEqualTo(fixedInstant);
        assertThat(testExam.getUploadedBy()).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("Should not save when user not authenticated")
    void shouldNotSaveWhenUserNotAuthenticated() {
        // Given
        when(userService.isAuthenticated()).thenReturn(false);

        // When & Then
        assertThatThrownBy(() -> examCrudService.saveExam(testExam))
                .isInstanceOf(UnauthorizedException.class);
        
        verify(examRepository, never()).save(any(Exam.class));
    }

    @Test
    @DisplayName("Should validate exam before saving")
    void shouldValidateExamBeforeSaving() {
        // Given
        when(userService.isAuthenticated()).thenReturn(true);
        
        testExam.setTitle(""); // Invalid title

        // When & Then
        assertThatThrownBy(() -> examCrudService.saveExam(testExam))
                .isInstanceOf(ValidationException.class)
                .hasMessage("Exam title is required");
        
        verify(examRepository, never()).save(any(Exam.class));
    }

    @Test
    @DisplayName("Should normalize tags before saving")
    void shouldNormalizeTagsBeforeSaving() {
        // Given
        when(userService.isAuthenticated()).thenReturn(true);
        when(userService.getAuthenticatedUser()).thenReturn(testUser);
        when(examRepository.save(any(Exam.class))).thenReturn(testExam);
        
        testExam.setTags(new ArrayList<>(List.of("  Java  ", "SPRING", "Test")));

        // When
        examCrudService.saveExam(testExam);

        // Then
        assertThat(testExam.getTags()).containsExactly("java", "spring", "test");
        verify(examRepository).save(testExam);
    }

    @Test
    @DisplayName("Should return exam when found")
    void shouldReturnExamWhenFound() {
        // Given
        UUID examId = UUID.randomUUID();
        when(examRepository.findByIdWithQuestions(examId)).thenReturn(Optional.of(testExam));

        // When
        Exam result = examCrudService.getExamById(examId);

        // Then
        assertThat(result).isEqualTo(testExam);
        verify(examRepository).findByIdWithQuestions(examId);
    }

    @Test
    @DisplayName("Should return null when exam not found")
    void shouldReturnNullWhenExamNotFound() {
        // Given
        UUID examId = UUID.randomUUID();
        when(examRepository.findByIdWithQuestions(examId)).thenReturn(Optional.empty());

        // When
        Exam result = examCrudService.getExamById(examId);

        // Then
        assertThat(result).isNull();
    }
}