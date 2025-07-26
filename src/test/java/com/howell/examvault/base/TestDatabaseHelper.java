package com.howell.examvault.base;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.howell.examvault.base.repository.CommentRepository;
import com.howell.examvault.base.repository.ExamRepository;

import jakarta.persistence.EntityManager;

/**
 * Helper component for test database operations
 * Use this when you need to clean database state between tests
 * or perform complex test data setup
 */
@Component
@ActiveProfiles("test")
public class TestDatabaseHelper {

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private CommentRepository commentRepository;

    /**
     * Clean all test data from database
     * Use this in @BeforeEach when @Transactional rollback isn't sufficient
     */
    @Transactional
    public void cleanDatabase() {
        // Delete in correct order to avoid foreign key constraints
        commentRepository.deleteAll();
        examRepository.deleteAll();
        
        // Reset sequences if needed
        entityManager.flush();
        entityManager.clear();
    }

    /**
     * Reset database sequences to ensure consistent IDs in tests
     */
    @Transactional
    public void resetSequences() {
        // Only needed if using database-generated IDs and sequences
        // For UUID-based entities, this may not be necessary
        entityManager.createNativeQuery("ALTER SEQUENCE IF EXISTS exam_id_seq RESTART WITH 1").executeUpdate();
        entityManager.createNativeQuery("ALTER SEQUENCE IF EXISTS comment_id_seq RESTART WITH 1").executeUpdate();
        entityManager.flush();
    }

    /**
     * Force flush and clear entity manager for immediate database operations
     */
    public void flushAndClear() {
        entityManager.flush();
        entityManager.clear();
    }

    /**
     * Execute native SQL for complex test setup
     */
    @Transactional
    public void executeNativeSQL(String sql) {
        entityManager.createNativeQuery(sql).executeUpdate();
        entityManager.flush();
    }

    /**
     * Get count of entities for verification
     */
    public long getExamCount() {
        return examRepository.count();
    }

    public long getCommentCount() {
        return commentRepository.count();
    }

    /**
     * Verify database is in expected state
     */
    public void verifyDatabaseIsEmpty() {
        assert getExamCount() == 0 : "Database should be empty - found " + getExamCount() + " exams";
        assert getCommentCount() == 0 : "Database should be empty - found " + getCommentCount() + " comments";
    }

    /**
     * Setup common test data that multiple tests can use
     */
    @Transactional
    public TestDataSetup setupCommonTestData() {
        var exam1 = examRepository.save(
            TestDataBuilder.examBuilder()
                .title("Common Test Exam 1")
                .uploadedBy("common-user@example.com")
                .build()
        );

        var exam2 = examRepository.save(
            TestDataBuilder.examBuilder()
                .title("Common Test Exam 2")
                .uploadedBy("another-user@example.com")
                .build()
        );

        return new TestDataSetup(exam1, exam2);
    }

    /**
     * Record holder for common test data setup
     */
    public record TestDataSetup(
        com.howell.examvault.base.domain.Exam exam1,
        com.howell.examvault.base.domain.Exam exam2
    ) {}
}