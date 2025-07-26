package com.howell.examvault.base.service;

import java.time.Clock;
import java.util.List;
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
import com.howell.examvault.base.domain.Comment;
import com.howell.examvault.base.domain.Exam;
import com.howell.examvault.base.exception.CommentNotFoundException;
import com.howell.examvault.base.exception.ExamNotFoundException;
import com.howell.examvault.base.exception.UnauthorizedException;
import com.howell.examvault.base.exception.ValidationException;
import com.howell.examvault.base.repository.CommentRepository;
import com.howell.examvault.base.repository.ExamRepository;
import com.howell.examvault.base.security.UserDetails;

@Import(TestConfig.class)
class CommentServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private CommentService commentService;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private Clock clock;

    private Exam testExam;
    private UserDetails testUser;
    private UserDetails anotherUser;

    @BeforeEach
    void setUp() {
        // Create consistent test users
        testUser = new UserDetails("test@example.com", "Test User", null, "sub123");
        anotherUser = new UserDetails("another@example.com", "Another User", null, "sub456");

        // Create test exam
        testExam = examRepository.save(
                TestDataBuilder.examBuilder()
                        .title("Test Exam for Comments")
                        .uploadedBy(testUser.email())
                        .build()
        );
    }

    @Nested
    @DisplayName("Add Comment Tests")
    class AddCommentTests {

        @Test
        @WithMockUser
        @DisplayName("Should add comment successfully when authenticated")
        void shouldAddCommentWhenAuthenticated() {
            // Given
            setupAuthenticatedUser(testUser);

            // When
            Comment savedComment = commentService.addComment(
                    testExam.getId().toString(),
                    "This is a great exam!",
                    5
            );

            // Then
            assertThat(savedComment).isNotNull()
                    .satisfies(comment -> {
                        assertThat(comment.getId()).isNotNull();
                        assertThat(comment.getExamId()).isEqualTo(testExam.getId());
                        assertThat(comment.getUserEmail()).isEqualTo(testUser.email());
                        assertThat(comment.getCommentString()).isEqualTo("This is a great exam!");
                        assertThat(comment.getExamRating()).isEqualTo(5);
                        assertThat(comment.getDateCreated()).isEqualTo(FIXED_INSTANT);
                    });

            // Verify persistence
            List<Comment> persistedComments = commentRepository.findByExamIdOrderByDateCreatedDesc(testExam.getId());
            assertThat(persistedComments)
                    .hasSize(1)
                    .first()
                    .satisfies(comment
                            -> assertThat(comment.getCommentString()).isEqualTo("This is a great exam!")
                    );
        }

        @Test
        @DisplayName("Should throw UnauthorizedException when not authenticated")
        void shouldThrowExceptionWhenNotAuthenticated() {
            // Given
            setupUnauthenticatedUser();

            // When & Then
            assertThatThrownBy(() -> commentService.addComment(
                    testExam.getId().toString(),
                    "Comment text",
                    5
            ))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessage("Authentication required to add comments");
        }

        @Test
        @WithMockUser
        @DisplayName("Should throw ExamNotFoundException when exam doesn't exist")
        void shouldThrowExceptionWhenExamDoesntExist() {
            // Given
            setupAuthenticatedUser(testUser);
            UUID nonExistentExamId = UUID.randomUUID();

            // When & Then
            assertThatThrownBy(() -> commentService.addComment(
                    nonExistentExamId.toString(),
                    "Comment text",
                    5
            ))
                    .isInstanceOf(ExamNotFoundException.class);
        }

        @Test
        @WithMockUser
        @DisplayName("Should handle comment without rating")
        void shouldHandleCommentWithoutRating() {
            // Given
            setupAuthenticatedUser(testUser);

            // When
            Comment savedComment = commentService.addComment(
                    testExam.getId().toString(),
                    "Comment without rating",
                    null
            );

            // Then
            assertThat(savedComment.getExamRating()).isEqualTo(0);
        }

        @Test
        @WithMockUser
        @DisplayName("Should throw ValidationException for invalid exam ID")
        void shouldThrowExceptionForInvalidExamId() {
            // Given
            setupAuthenticatedUser(testUser);

            // When & Then
            assertThatThrownBy(() -> commentService.addComment(
                    "invalid-uuid",
                    "Comment text",
                    5
            ))
                    .isInstanceOf(ValidationException.class)
                    .hasMessage("Invalid exam ID format");
        }
    }

    @Nested
    @DisplayName("Get Comments Tests")
    class GetCommentsTests {

        @BeforeEach
        void setUp() {
            // Create test comments with different timestamps
            Comment comment1 = TestDataBuilder.commentBuilder()
                    .examId(testExam.getId())
                    .userEmail("user1@example.com")
                    .commentString("First comment")
                    .rating(5)
                    .dateCreated(FIXED_INSTANT.minusSeconds(60))
                    .build();

            Comment comment2 = TestDataBuilder.commentBuilder()
                    .examId(testExam.getId())
                    .userEmail("user2@example.com")
                    .commentString("Second comment")
                    .rating(4)
                    .dateCreated(FIXED_INSTANT)
                    .build();

            commentRepository.saveAll(List.of(comment1, comment2));
        }

        @Test
        @DisplayName("Should get comments for existing exam")
        void shouldGetCommentsForExistingExam() {
            // When
            List<Comment> comments = commentService.getExamComments(testExam.getId().toString());

            // Then
            assertThat(comments).hasSize(2);
            assertThat(comments).extracting(Comment::getCommentString)
                    .containsExactly("Second comment", "First comment"); // Latest first
        }

        @Test
        @DisplayName("Should return empty list for exam with no comments")
        void shouldReturnEmptyListForExamWithNoComments() {
            // Given
            Exam examWithoutComments = examRepository.save(
                    TestDataBuilder.examBuilder()
                            .title("Exam Without Comments")
                            .build()
            );

            // When
            List<Comment> comments = commentService.getExamComments(examWithoutComments.getId().toString());

            // Then
            assertThat(comments).isEmpty();
        }

        @Test
        @DisplayName("Should throw ExamNotFoundException for non-existent exam")
        void shouldThrowExceptionForNonExistentExam() {
            // Given
            UUID nonExistentExamId = UUID.randomUUID();

            // When & Then
            assertThatThrownBy(() -> commentService.getExamComments(nonExistentExamId.toString()))
                    .isInstanceOf(ExamNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Delete Comment Tests")
    class DeleteCommentTests {

        private Comment testComment;

        @BeforeEach
        void setUp() {
            testComment = commentRepository.save(
                    TestDataBuilder.commentBuilder()
                            .examId(testExam.getId())
                            .userEmail(testUser.email())
                            .commentString("Comment to delete")
                            .build()
            );
        }

        @Test
        @WithMockUser
        @DisplayName("Should delete comment when user owns it")
        void shouldDeleteCommentWhenUserOwnsIt() {
            // Given
            setupAuthenticatedUser(testUser);

            // When
            commentService.deleteComment(
                    testExam.getId().toString(),
                    testComment.getId().toString()
            );

            // Then
            assertThat(commentRepository.findById(testComment.getId())).isEmpty();
        }

        @Test
        @WithMockUser
        @DisplayName("Should throw UnauthorizedException when user doesn't own comment")
        void shouldThrowExceptionWhenUserDoesntOwnComment() {
            // Given
            setupAuthenticatedUser(anotherUser);

            // When & Then
            assertThatThrownBy(() -> commentService.deleteComment(
                    testExam.getId().toString(),
                    testComment.getId().toString()
            ))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessage("You can only delete your own comments");
        }

        @Test
        @WithMockUser
        @DisplayName("Should throw CommentNotFoundException when comment doesn't exist")
        void shouldThrowExceptionWhenCommentDoesntExist() {
            // Given
            setupAuthenticatedUser(testUser);
            UUID nonExistentCommentId = UUID.randomUUID();

            // When & Then
            assertThatThrownBy(() -> commentService.deleteComment(
                    testExam.getId().toString(),
                    nonExistentCommentId.toString()
            ))
                    .isInstanceOf(CommentNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Update Comment Tests")
    class UpdateCommentTests {

        private Comment testComment;

        @BeforeEach
        void setUp() {
            testComment = commentRepository.save(
                    TestDataBuilder.commentBuilder()
                            .examId(testExam.getId())
                            .userEmail(testUser.email())
                            .commentString("Original comment")
                            .rating(3)
                            .build()
            );
        }

        @Test
        @WithMockUser
        @DisplayName("Should update comment when user owns it")
        void shouldUpdateCommentWhenUserOwnsIt() {
            // Given
            setupAuthenticatedUser(testUser);

            // When
            Comment updatedComment = commentService.updateComment(
                    testExam.getId().toString(),
                    testComment.getId().toString(),
                    "Updated comment text",
                    5
            );

            // Then
            assertThat(updatedComment)
                    .satisfies(comment -> {
                        assertThat(comment.getCommentString()).isEqualTo("Updated comment text");
                        assertThat(comment.getExamRating()).isEqualTo(5);
                        assertThat(comment.getId()).isEqualTo(testComment.getId());
                    });

            // Verify persistence
            Comment persisted = commentRepository.findById(testComment.getId()).orElseThrow();
            assertThat(persisted.getCommentString()).isEqualTo("Updated comment text");
        }

        @Test
        @WithMockUser
        @DisplayName("Should throw UnauthorizedException when user doesn't own comment")
        void shouldThrowExceptionWhenUserDoesntOwnComment() {
            // Given
            setupAuthenticatedUser(anotherUser);

            // When & Then
            assertThatThrownBy(() -> commentService.updateComment(
                    testExam.getId().toString(),
                    testComment.getId().toString(),
                    "Unauthorized update",
                    1
            ))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessage("You can only update your own comments");
        }
    }

    private void setupAuthenticatedUser(UserDetails user) {
        when(userService.isAuthenticated()).thenReturn(true);
        when(userService.getAuthenticatedUser()).thenReturn(user);
    }

    private void setupUnauthenticatedUser() {
        when(userService.isAuthenticated()).thenReturn(false);
        when(userService.getAuthenticatedUser()).thenReturn(null);
    }
}
