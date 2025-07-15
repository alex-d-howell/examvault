package com.howell.examvault.base.repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.howell.examvault.base.domain.Exam;

public interface ExamRepository extends JpaRepository<Exam, UUID> {

    List<Exam> findByTitleContainingIgnoreCaseAndUploadedByContainingIgnoreCase(String title, String uploadedBy);
    List<Exam> findByUploadedBy(String uploadedBy);
    
    // ===== POSTGRESQL-ONLY OPTIMIZED QUERIES =====
    
    /**
     * Get all unique tags using PostgreSQL's unnest function
     * Only works with PostgreSQL - fallback to service layer for other databases
     */
    @Query(value = "SELECT DISTINCT unnest(tags) as tag FROM exam WHERE tags IS NOT NULL ORDER BY tag", nativeQuery = true)
    List<String> findAllUniqueTagsPostgreSQL();
    
    /**
     * Find exams by tags using PostgreSQL array overlap operator
     * Only works with PostgreSQL - fallback to service layer for other databases
     */
    @Query(value = "SELECT * FROM exam WHERE tags && CAST(:tags AS text[])", nativeQuery = true)
    List<Exam> findByTagsInPostgreSQL(@Param("tags") List<String> tags);
    
    /**
     * Combined search with PostgreSQL array operators
     * Only works with PostgreSQL - fallback to service layer for other databases
     */
    @Query(value = """
        SELECT * FROM exam e 
        WHERE (:title IS NULL OR :title = '' OR LOWER(e.title) LIKE LOWER(CONCAT('%', :title, '%')))
        AND (:uploadedBy IS NULL OR :uploadedBy = '' OR LOWER(e.uploaded_by) LIKE LOWER(CONCAT('%', :uploadedBy, '%')))
        AND e.tags && CAST(:tags AS text[])
        """, nativeQuery = true)
    List<Exam> findByTitleAndUploadedByAndTagsPostgreSQL(
        @Param("title") String title, 
        @Param("uploadedBy") String uploadedBy, 
        @Param("tags") List<String> tags);
    
    /**
     * Advanced search with PostgreSQL array operators and additional filters
     * Only works with PostgreSQL - fallback to service layer for other databases
     */
    @Query(value = """
        SELECT e.* FROM exam e 
        LEFT JOIN (
            SELECT exam_id, COUNT(*) as question_count 
            FROM question 
            GROUP BY exam_id
        ) q ON e.id = q.exam_id
        LEFT JOIN (
            SELECT exam_id, COUNT(*) as comment_count 
            FROM comment 
            GROUP BY exam_id
        ) c ON e.id = c.exam_id
        WHERE (:title IS NULL OR :title = '' OR LOWER(e.title) LIKE LOWER(CONCAT('%', :title, '%')))
        AND (:uploadedBy IS NULL OR :uploadedBy = '' OR LOWER(e.uploaded_by) LIKE LOWER(CONCAT('%', :uploadedBy, '%')))
        AND (:examStatus IS NULL OR :examStatus = '' OR LOWER(e.exam_status) = LOWER(:examStatus))
        AND (:startDate IS NULL OR e.uploaded_at >= :startDate)
        AND (:endDate IS NULL OR e.uploaded_at <= :endDate)
        AND (:minQuestions IS NULL OR COALESCE(q.question_count, 0) >= :minQuestions)
        AND (:maxQuestions IS NULL OR COALESCE(q.question_count, 0) <= :maxQuestions)
        AND (:hasTags = false OR e.tags && CAST(:tags AS text[]))
        ORDER BY 
            CASE WHEN :sortBy = 'title' THEN e.title END ASC,
            CASE WHEN :sortBy = 'date' THEN e.uploaded_at END DESC,
            CASE WHEN :sortBy = 'questions' THEN q.question_count END DESC,
            CASE WHEN :sortBy = 'comments' THEN c.comment_count END DESC,
            e.uploaded_at DESC
        """, nativeQuery = true)
    List<Exam> advancedSearchPostgreSQL(
        @Param("title") String title,
        @Param("uploadedBy") String uploadedBy,
        @Param("examStatus") String examStatus,
        @Param("startDate") Instant startDate,
        @Param("endDate") Instant endDate,
        @Param("minQuestions") Integer minQuestions,
        @Param("maxQuestions") Integer maxQuestions,
        @Param("tags") List<String> tags,
        @Param("hasTags") boolean hasTags,
        @Param("sortBy") String sortBy
    );
    
    /**
     * Get all unique exam statuses
     */
    @Query("SELECT DISTINCT e.examStatus FROM Exam e WHERE e.examStatus IS NOT NULL ORDER BY e.examStatus")
    List<String> findAllUniqueExamStatuses();
    
    /**
     * Get exam statistics for dashboard/filtering
     */
    @Query(value = """
        SELECT 
            COUNT(*) as total_exams,
            COUNT(DISTINCT uploaded_by) as unique_authors,
            MIN(uploaded_at) as earliest_exam,
            MAX(uploaded_at) as latest_exam,
            AVG(q.question_count) as avg_questions
        FROM exam e
        LEFT JOIN (
            SELECT exam_id, COUNT(*) as question_count 
            FROM question 
            GROUP BY exam_id
        ) q ON e.id = q.exam_id
        """, nativeQuery = true)
    Object[] getExamStatistics();
    
    // ===== UNIVERSAL COMPATIBLE QUERIES =====
    
    /**
     * Get all exams for service-layer processing
     * Works on any database including H2
     */
    @Query("SELECT e FROM Exam e")
    List<Exam> findAllExamsForTagProcessing();
    
    /**
     * Find exams by exam status
     */
    @Query("SELECT e FROM Exam e WHERE LOWER(e.examStatus) = LOWER(:examStatus)")
    List<Exam> findByExamStatusIgnoreCase(@Param("examStatus") String examStatus);
    
    /**
     * Find exams within date range
     */
    @Query("SELECT e FROM Exam e WHERE e.uploadedAt BETWEEN :startDate AND :endDate ORDER BY e.uploadedAt DESC")
    List<Exam> findByUploadedAtBetween(@Param("startDate") Instant startDate, @Param("endDate") Instant endDate);
    
    /**
     * Find exams uploaded after a specific date
     */
    @Query("SELECT e FROM Exam e WHERE e.uploadedAt >= :date ORDER BY e.uploadedAt DESC")
    List<Exam> findByUploadedAtAfter(@Param("date") Instant date);
    
    /**
     * Find exams uploaded before a specific date
     */
    @Query("SELECT e FROM Exam e WHERE e.uploadedAt <= :date ORDER BY e.uploadedAt DESC")
    List<Exam> findByUploadedAtBefore(@Param("date") Instant date);
}
