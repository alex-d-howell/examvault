package com.howell.examvault.base.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.howell.examvault.base.domain.Exam;

/**
 * Production-ready ExamRepository focused on specifications and essential
 * PostgreSQL queries Leverages JpaSpecificationExecutor for dynamic queries and
 * native queries for PostgreSQL arrays
 */
public interface ExamRepository extends JpaRepository<Exam, UUID>, JpaSpecificationExecutor<Exam> {

    // ===== BASIC FINDER METHODS =====
    /**
     * Find exams by author
     */
    List<Exam> findByUploadedBy(String uploadedBy);

    /**
     * Find exams by author with sorting
     */
    List<Exam> findByUploadedBy(String uploadedBy, Sort sort);

    // ===== POSTGRESQL ARRAY TAG OPERATIONS =====
    /**
     * Get all unique tags - essential for tag suggestions and autocomplete
     */
    @Query(value = "SELECT DISTINCT unnest(tags) as tag FROM exam WHERE tags IS NOT NULL ORDER BY tag", nativeQuery = true)
    List<String> findAllUniqueTags();

    /**
     * Find exams by tags using EXISTS subquery - most reliable approach Works
     * efficiently with PostgreSQL arrays
     */
    @Query(value = """
        SELECT e.* FROM exam e 
        WHERE EXISTS (
            SELECT 1 FROM unnest(e.tags) AS exam_tag 
            WHERE exam_tag IN (:tags)
        )
        ORDER BY e.uploaded_at DESC
        """, nativeQuery = true)
    List<Exam> findByTagsExists(@Param("tags") List<String> tags);

    /**
     * Find exams by single tag - optimized for single tag searches
     */
    @Query(value = "SELECT * FROM exam WHERE :tag = ANY(tags) ORDER BY uploaded_at DESC", nativeQuery = true)
    List<Exam> findBySingleTag(@Param("tag") String tag);

    /**
     * Count exams with specific tags
     */
    @Query(value = """
        SELECT COUNT(DISTINCT e.id) FROM exam e 
        WHERE EXISTS (
            SELECT 1 FROM unnest(e.tags) AS exam_tag 
            WHERE exam_tag IN (:tags)
        )
        """, nativeQuery = true)
    Long countByTags(@Param("tags") List<String> tags);

    /**
     * Find tags matching a pattern for autocomplete
     */
    @Query(value = """
        SELECT DISTINCT tag 
        FROM (SELECT unnest(tags) as tag FROM exam WHERE tags IS NOT NULL) t 
        WHERE tag ILIKE CONCAT('%', :pattern, '%') 
        ORDER BY tag 
        LIMIT 20
        """, nativeQuery = true)
    List<String> findTagsMatchingPattern(@Param("pattern") String pattern);

    // ===== UTILITY AND ANALYTICS QUERIES =====
    /**
     * Get basic exam statistics for dashboard
     */
    @Query(value = "SELECT COUNT(*), COUNT(DISTINCT uploaded_by) FROM exam", nativeQuery = true)
    Object[] getBasicExamStatistics();

    /**
     * Get popular tags with usage counts
     */
    @Query(value = """
        SELECT tag, COUNT(*) as usage_count 
        FROM (SELECT unnest(tags) as tag FROM exam WHERE tags IS NOT NULL) t 
        GROUP BY tag 
        ORDER BY usage_count DESC, tag ASC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> getPopularTags(@Param("limit") int limit);

    /**
     * Get tag usage statistics for analytics
     */
    @Query(value = """
        SELECT tag, COUNT(*) as usage_count 
        FROM (SELECT unnest(tags) as tag FROM exam WHERE tags IS NOT NULL) t 
        GROUP BY tag 
        ORDER BY usage_count DESC, tag ASC
        """, nativeQuery = true)
    List<Object[]> getTagStatistics();

    // ===== DATE-BASED CONVENIENCE METHODS =====
    /**
     * Find recent exams - commonly used for dashboard
     */
    @Query("SELECT e FROM Exam e WHERE e.uploadedAt >= :date ORDER BY e.uploadedAt DESC")
    List<Exam> findRecentExams(@Param("date") Instant date);

    /**
     * Find exams in date range - for performance-sensitive queries
     */
    @Query("SELECT e FROM Exam e WHERE e.uploadedAt BETWEEN :start AND :end ORDER BY e.uploadedAt DESC")
    List<Exam> findExamsInDateRange(@Param("start") Instant start, @Param("end") Instant end);

    // ===== PERFORMANCE AND UTILITY QUERIES =====
    /**
     * Count total exams - cached and optimized
     */
    @Query("SELECT COUNT(e) FROM Exam e")
    long countTotalExams();

    /**
     * Get exam summaries for lightweight operations (ID, title, author, date
     * only)
     */
    @Query("SELECT e.id, e.title, e.uploadedBy, e.uploadedAt FROM Exam e ORDER BY e.uploadedAt DESC")
    List<Object[]> findExamSummaries();

    /**
     * Check if exam exists by title and author - for duplicate detection
     */
    @Query("SELECT COUNT(e) > 0 FROM Exam e WHERE LOWER(e.title) = LOWER(:title) AND e.uploadedBy = :author")
    boolean existsByTitleAndAuthor(@Param("title") String title, @Param("author") String author);

    /**
     * Get exam counts by author for analytics
     */
    @Query("SELECT e.uploadedBy, COUNT(e) FROM Exam e GROUP BY e.uploadedBy ORDER BY COUNT(e) DESC")
    List<Object[]> getExamCountsByAuthor();

    /**
     * Find exams by title containing text (case insensitive)
     */
    @Query("SELECT e FROM Exam e WHERE LOWER(e.title) LIKE LOWER(CONCAT('%', :title, '%')) ORDER BY e.uploadedAt DESC")
    List<Exam> findByTitleContainingIgnoreCase(@Param("title") String title);

    /**
     * Find exams by author containing text (case insensitive)
     */
    @Query("SELECT e FROM Exam e WHERE LOWER(e.uploadedBy) LIKE LOWER(CONCAT('%', :author, '%')) ORDER BY e.uploadedAt DESC")
    List<Exam> findByUploadedByContainingIgnoreCase(@Param("author") String author);

    /**
     * Full-text search across title and description
     */
    @Query("SELECT e FROM Exam e WHERE "
            + "LOWER(e.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR "
            + "LOWER(e.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) "
            + "ORDER BY e.uploadedAt DESC")
    List<Exam> findByTitleOrDescriptionContaining(@Param("searchTerm") String searchTerm);

    // ===== SPECIALIZED QUERIES =====
    /**
     * Find exams with null or empty tags - for data cleanup
     */
    @Query(value = "SELECT * FROM exam WHERE tags IS NULL OR array_length(tags, 1) IS NULL ORDER BY uploaded_at DESC", nativeQuery = true)
    List<Exam> findExamsWithoutTags();

    /**
     * Find exams with many tags - for analysis
     */
    @Query(value = "SELECT * FROM exam WHERE array_length(tags, 1) >= :minTags ORDER BY array_length(tags, 1) DESC", nativeQuery = true)
    List<Exam> findExamsWithManyTags(@Param("minTags") int minTags);

    /**
     * Get recent exam activity for dashboard
     */
    @Query(value = """
        SELECT 
            DATE_TRUNC('day', uploaded_at) as day,
            COUNT(*) as exam_count
        FROM exam 
        WHERE uploaded_at >= :since
        GROUP BY DATE_TRUNC('day', uploaded_at)
        ORDER BY day DESC
        """, nativeQuery = true)
    List<Object[]> getExamActivityByDay(@Param("since") Instant since);

    /**
     * Find exam with questions loaded - for exam taking
     */
    @EntityGraph(attributePaths = {"questions"})
    @Query("SELECT e FROM Exam e WHERE e.id = :id")
    Optional<Exam> findByIdWithQuestions(@Param("id") UUID id);

    /**
     * Find exam with comments loaded - for display
     */
    @EntityGraph(attributePaths = {"comments"})
    @Query("SELECT e FROM Exam e WHERE e.id = :id")
    Optional<Exam> findByIdWithComments(@Param("id") UUID id);

    /**
     * Find recent exams with questions for dashboard
     */
    @EntityGraph(attributePaths = {"questions"})
    @Query("SELECT e FROM Exam e WHERE e.uploadedAt >= :date ORDER BY e.uploadedAt DESC")
    List<Exam> findRecentExamsWithQuestions(@Param("date") Instant date);
}
