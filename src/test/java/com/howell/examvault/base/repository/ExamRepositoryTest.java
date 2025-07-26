package com.howell.examvault.base.repository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;

import com.howell.examvault.base.BaseIntegrationTest;
import com.howell.examvault.base.TestDataBuilder;
import com.howell.examvault.base.domain.Exam;

class ExamRepositoryTest extends BaseIntegrationTest {

    @Autowired
    private ExamRepository examRepository;

    @Nested
    @DisplayName("PostgreSQL Array Tag Operations")
    class TagOperationsTests {

        @BeforeEach
        void setUp() {
            // Create test exams with different tags
            Exam exam1 = TestDataBuilder.examBuilder()
                    .title("Java Exam")
                    .tags(List.of("java", "programming", "backend"))
                    .uploadedBy("teacher1@example.com")
                    .build();

            Exam exam2 = TestDataBuilder.examBuilder()
                    .title("Python Exam")
                    .tags(List.of("python", "programming", "ai"))
                    .uploadedBy("teacher2@example.com")
                    .build();

            Exam exam3 = TestDataBuilder.examBuilder()
                    .title("Database Exam")
                    .tags(List.of("sql", "database", "backend"))
                    .uploadedBy("teacher1@example.com")
                    .build();

            examRepository.saveAll(List.of(exam1, exam2, exam3));
        }

        @Test
        @DisplayName("Should find all unique tags")
        void shouldFindAllUniqueTags() {
            // When
            List<String> tags = examRepository.findAllUniqueTags();

            // Then
            assertThat(tags).containsExactlyInAnyOrder(
                    "java", "python", "programming", "backend", "ai", "sql", "database"
            );
        }

        @Test
        @DisplayName("Should find exams by single tag")
        void shouldFindExamsBySingleTag() {
            // When
            List<Exam> programmingExams = examRepository.findBySingleTag("programming");

            // Then
            assertThat(programmingExams).hasSize(2);
            assertThat(programmingExams).extracting(Exam::getTitle)
                    .containsExactlyInAnyOrder("Java Exam", "Python Exam");
        }

        @Test
        @DisplayName("Should find exams by multiple tags using EXISTS")
        void shouldFindExamsByMultipleTagsUsingExists() {
            // When
            List<Exam> backendExams = examRepository.findByTagsExists(List.of("backend", "java"));

            // Then
            assertThat(backendExams).hasSize(2); // Java Exam and Database Exam have "backend"
            assertThat(backendExams).extracting(Exam::getTitle)
                    .containsExactlyInAnyOrder("Java Exam", "Database Exam");
        }

        @Test
        @DisplayName("Should count exams by tags")
        void shouldCountExamsByTags() {
            // When
            Long count = examRepository.countByTags(List.of("programming"));

            // Then
            assertThat(count).isEqualTo(2L);
        }

        @Test
        @DisplayName("Should find tags matching pattern")
        void shouldFindTagsMatchingPattern() {
            // When
            List<String> matchingTags = examRepository.findTagsMatchingPattern("prog");

            // Then
            assertThat(matchingTags).containsExactly("programming");
        }

        @Test
        @DisplayName("Should get popular tags with counts")
        void shouldGetPopularTagsWithCounts() {
            // When
            List<Object[]> popularTags = examRepository.getPopularTags(5);

            // Then
            assertThat(popularTags).hasSizeGreaterThan(0);

            // Check that each result has tag name and count
            Object[] firstTag = popularTags.get(0);
            assertThat(firstTag).hasSize(2);
            assertThat(firstTag[0]).isInstanceOf(String.class); // tag name
            assertThat(firstTag[1]).isInstanceOf(Number.class); // count
        }
    }

    @Nested
    @DisplayName("Date-based Queries")
    class DateBasedQueriesTests {

        @BeforeEach
        void setUp() {
            Instant now = FIXED_INSTANT;
            Instant yesterday = now.minus(1, ChronoUnit.DAYS);
            Instant lastWeek = now.minus(7, ChronoUnit.DAYS);

            Exam recentExam = TestDataBuilder.examBuilder()
                    .title("Recent Exam")
                    .uploadedAt(now)
                    .build();

            Exam yesterdayExam = TestDataBuilder.examBuilder()
                    .title("Yesterday Exam")
                    .uploadedAt(yesterday)
                    .build();

            Exam oldExam = TestDataBuilder.examBuilder()
                    .title("Old Exam")
                    .uploadedAt(lastWeek)
                    .build();

            examRepository.saveAll(List.of(recentExam, yesterdayExam, oldExam));
        }

        @Test
        @DisplayName("Should find recent exams")
        void shouldFindRecentExams() {
            // Given
            Instant threeDaysAgo = FIXED_INSTANT.minus(3, ChronoUnit.DAYS);

            // When
            List<Exam> recentExams = examRepository.findRecentExams(threeDaysAgo);

            // Then
            assertThat(recentExams).hasSize(2);
            assertThat(recentExams).extracting(Exam::getTitle)
                    .containsExactlyInAnyOrder("Recent Exam", "Yesterday Exam");
        }

        @Test
        @DisplayName("Should find exams in date range")
        void shouldFindExamsInDateRange() {
            // Given
            Instant start = FIXED_INSTANT.minus(2, ChronoUnit.DAYS);
            Instant end = FIXED_INSTANT;

            // When
            List<Exam> examsInRange = examRepository.findExamsInDateRange(start, end);

            // Then
            assertThat(examsInRange).hasSize(2);
            assertThat(examsInRange).extracting(Exam::getTitle)
                    .containsExactlyInAnyOrder("Recent Exam", "Yesterday Exam");
        }
    }

    @Nested
    @DisplayName("Author-based Queries")
    class AuthorBasedQueriesTests {

        @BeforeEach
        void setUp() {
            Exam exam1 = TestDataBuilder.examBuilder()
                    .title("Exam 1")
                    .uploadedBy("author1@example.com")
                    .build();

            Exam exam2 = TestDataBuilder.examBuilder()
                    .title("Exam 2")
                    .uploadedBy("author1@example.com")
                    .build();

            Exam exam3 = TestDataBuilder.examBuilder()
                    .title("Exam 3")
                    .uploadedBy("author2@example.com")
                    .build();

            examRepository.saveAll(List.of(exam1, exam2, exam3));
        }

        @Test
        @DisplayName("Should find exams by author")
        void shouldFindExamsByAuthor() {
            // When
            List<Exam> author1Exams = examRepository.findByUploadedBy("author1@example.com");

            // Then
            assertThat(author1Exams).hasSize(2);
            assertThat(author1Exams).extracting(Exam::getTitle)
                    .containsExactlyInAnyOrder("Exam 1", "Exam 2");
        }

        @Test
        @DisplayName("Should find exams by author with sorting")
        void shouldFindExamsByAuthorWithSorting() {
            // When
            List<Exam> sortedExams = examRepository.findByUploadedBy(
                    "author1@example.com",
                    Sort.by(Sort.Direction.ASC, "title")
            );

            // Then
            assertThat(sortedExams).hasSize(2);
            assertThat(sortedExams).extracting(Exam::getTitle)
                    .containsExactly("Exam 1", "Exam 2"); // Sorted order
        }

        @Test
        @DisplayName("Should check if exam exists by title and author")
        void shouldCheckIfExamExistsByTitleAndAuthor() {
            // When & Then
            assertThat(examRepository.existsByTitleAndAuthor("Exam 1", "author1@example.com"))
                    .isTrue();

            assertThat(examRepository.existsByTitleAndAuthor("Non-existent Exam", "author1@example.com"))
                    .isFalse();

            assertThat(examRepository.existsByTitleAndAuthor("Exam 1", "different@example.com"))
                    .isFalse();
        }

        @Test
        @DisplayName("Should get exam counts by author")
        void shouldGetExamCountsByAuthor() {
            // When
            List<Object[]> authorCounts = examRepository.getExamCountsByAuthor();

            // Then
            assertThat(authorCounts).hasSize(2);

            // Check author1 has 2 exams
            Object[] author1Count = authorCounts.stream()
                    .filter(row -> "author1@example.com".equals(row[0]))
                    .findFirst()
                    .orElseThrow();
            assertThat(author1Count[1]).isEqualTo(2L);

            // Check author2 has 1 exam
            Object[] author2Count = authorCounts.stream()
                    .filter(row -> "author2@example.com".equals(row[0]))
                    .findFirst()
                    .orElseThrow();
            assertThat(author2Count[1]).isEqualTo(1L);
        }
    }

    @Nested
    @DisplayName("Text Search Queries")
    class TextSearchQueriesTests {

        @BeforeEach
        void setUp() {
            Exam javaExam = TestDataBuilder.examBuilder()
                    .title("Advanced Java Programming")
                    .description("Learn advanced Java concepts")
                    .uploadedBy("java.instructor@example.com")
                    .build();

            Exam pythonExam = TestDataBuilder.examBuilder()
                    .title("Python Basics")
                    .description("Introduction to Python programming")
                    .uploadedBy("python.teacher@example.com")
                    .build();

            examRepository.saveAll(List.of(javaExam, pythonExam));
        }

        @Test
        @DisplayName("Should find exams by title containing text")
        void shouldFindExamsByTitleContaining() {
            // When
            List<Exam> javaExams = examRepository.findByTitleContainingIgnoreCase("java");

            // Then
            assertThat(javaExams).hasSize(1);
            assertThat(javaExams.get(0).getTitle()).isEqualTo("Advanced Java Programming");
        }

        @Test
        @DisplayName("Should find exams by author containing text")
        void shouldFindExamsByAuthorContaining() {
            // When
            List<Exam> instructorExams = examRepository.findByUploadedByContainingIgnoreCase("instructor");

            // Then
            assertThat(instructorExams).hasSize(1);
            assertThat(instructorExams.get(0).getUploadedBy()).isEqualTo("java.instructor@example.com");
        }

        @Test
        @DisplayName("Should find exams by title or description containing text")
        void shouldFindExamsByTitleOrDescriptionContaining() {
            // When
            List<Exam> programmingExams = examRepository.findByTitleOrDescriptionContaining("programming");

            // Then
            assertThat(programmingExams).hasSize(2); // Both have "programming" in title or description
        }
    }

    @Nested
    @DisplayName("Statistics and Analytics")
    class StatisticsTests {

        @BeforeEach
        void setUp() {
            examRepository.saveAll(List.of(
                    TestDataBuilder.examBuilder().uploadedBy("author1@example.com").build(),
                    TestDataBuilder.examBuilder().uploadedBy("author1@example.com").build(),
                    TestDataBuilder.examBuilder().uploadedBy("author2@example.com").build()
            ));
        }

        @Test
        @DisplayName("Should get basic exam statistics")
        void shouldGetBasicExamStatistics() {
            // When
            Object[] stats = examRepository.getBasicExamStatistics();

            // Then
            assertThat(stats).isNotNull();

            assertThat(stats).hasSize(1);

            Object[] rowData = (Object[]) stats[0];
            assertThat(rowData).hasSize(2);

            Long totalExams = ((Number) rowData[0]).longValue();
            Long uniqueAuthors = ((Number) rowData[1]).longValue();

            assertThat(totalExams).isEqualTo(3L); // Total exams
            assertThat(uniqueAuthors).isEqualTo(2L); // Unique authors
        }

        @Test
        @DisplayName("Should count total exams")
        void shouldCountTotalExams() {
            // When
            long totalCount = examRepository.countTotalExams();

            // Then
            assertThat(totalCount).isEqualTo(3L);
        }
    }
}
