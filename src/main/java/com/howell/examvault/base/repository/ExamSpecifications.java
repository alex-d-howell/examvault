package com.howell.examvault.base.repository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import com.howell.examvault.base.domain.Exam;
import com.howell.examvault.base.domain.Question;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

/**
 * Production-ready ExamSpecifications using proven JPA methods
 * Focuses on database-level filtering for maximum scalability
 */
public class ExamSpecifications {
    
    /**
     * Main search specification that handles database-compatible filters
     * Tags are handled separately via repository methods for PostgreSQL array efficiency
     */
    public static Specification<Exam> searchSpecification(
            String title, 
            String uploadedBy,
            Instant startDate, 
            Instant endDate) {
        
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Title filter - case insensitive contains
            if (title != null && !title.trim().isEmpty()) {
                String pattern = "%" + title.toLowerCase().trim() + "%";
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("title")), pattern
                ));
            }
            
            // Author filter - case insensitive contains
            if (uploadedBy != null && !uploadedBy.trim().isEmpty()) {
                String pattern = "%" + uploadedBy.toLowerCase().trim() + "%";
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("uploadedBy")), pattern
                ));
            }
            
            // Date range filters
            if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                    root.get("uploadedAt"), startDate
                ));
            }
            
            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                    root.get("uploadedAt"), endDate
                ));
            }
            
            // Ensure non-null upload dates for consistent behavior
            predicates.add(criteriaBuilder.isNotNull(root.get("uploadedAt")));
            
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }
    
    /**
     * Question count filter using database subqueries - FIXED VERSION
     * Uses proper JPA relationship mapping instead of non-existent examId field
     */
    public static Specification<Exam> hasQuestionCountBetween(Integer minQuestions, Integer maxQuestions) {
        return (root, query, criteriaBuilder) -> {
            if (minQuestions == null && maxQuestions == null) {
                return criteriaBuilder.conjunction(); // Always true
            }
            
            List<Predicate> predicates = new ArrayList<>();
            
            if (minQuestions != null && minQuestions > 0) {
                // Use JOIN instead of subquery for better performance and correctness
                // Count questions through the relationship
                Subquery<Long> countSubquery = query.subquery(Long.class);
                Root<Exam> examRoot = countSubquery.from(Exam.class);
                Join<Exam, Question> questionJoin = examRoot.join("questions", JoinType.LEFT);
                
                countSubquery.select(criteriaBuilder.count(questionJoin))
                           .where(criteriaBuilder.equal(examRoot.get("id"), root.get("id")));
                
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(countSubquery, minQuestions.longValue()));
            }
            
            if (maxQuestions != null && maxQuestions > 0) {
                // Same approach for max questions
                Subquery<Long> countSubquery = query.subquery(Long.class);
                Root<Exam> examRoot = countSubquery.from(Exam.class);
                Join<Exam, Question> questionJoin = examRoot.join("questions", JoinType.LEFT);
                
                countSubquery.select(criteriaBuilder.count(questionJoin))
                           .where(criteriaBuilder.equal(examRoot.get("id"), root.get("id")));
                
                predicates.add(criteriaBuilder.lessThanOrEqualTo(countSubquery, maxQuestions.longValue()));
            }
            
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }
    
    /**
     * Alternative question count filter using SIZE function - MORE EFFICIENT
     * Leverages JPA's SIZE function for collection size
     */
    public static Specification<Exam> hasQuestionCountBetweenOptimized(Integer minQuestions, Integer maxQuestions) {
        return (root, query, criteriaBuilder) -> {
            if (minQuestions == null && maxQuestions == null) {
                return criteriaBuilder.conjunction();
            }
            
            List<Predicate> predicates = new ArrayList<>();
            
            // Use JPA's SIZE function which is more efficient
            if (minQuestions != null && minQuestions > 0) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                    criteriaBuilder.size(root.get("questions")), minQuestions
                ));
            }
            
            if (maxQuestions != null && maxQuestions > 0) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                    criteriaBuilder.size(root.get("questions")), maxQuestions
                ));
            }
            
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }
    
    // ===== INDIVIDUAL SPECIFICATIONS FOR COMPOSITION =====
    
    public static Specification<Exam> titleContains(String title) {
        return (root, query, cb) -> {
            if (title == null || title.trim().isEmpty()) {
                return cb.conjunction();
            }
            String pattern = "%" + title.toLowerCase().trim() + "%";
            return cb.like(cb.lower(root.get("title")), pattern);
        };
    }
    
    public static Specification<Exam> authorContains(String author) {
        return (root, query, cb) -> {
            if (author == null || author.trim().isEmpty()) {
                return cb.conjunction();
            }
            String pattern = "%" + author.toLowerCase().trim() + "%";
            return cb.like(cb.lower(root.get("uploadedBy")), pattern);
        };
    }
    
    public static Specification<Exam> authorEquals(String author) {
        return (root, query, cb) -> {
            if (author == null || author.trim().isEmpty()) {
                return cb.conjunction();
            }
            return cb.equal(cb.lower(root.get("uploadedBy")), author.toLowerCase().trim());
        };
    }
    
    public static Specification<Exam> uploadedAfter(Instant date) {
        return (root, query, cb) -> {
            if (date == null) {
                return cb.conjunction();
            }
            return cb.greaterThanOrEqualTo(root.get("uploadedAt"), date);
        };
    }
    
    public static Specification<Exam> uploadedBefore(Instant date) {
        return (root, query, cb) -> {
            if (date == null) {
                return cb.conjunction();
            }
            return cb.lessThanOrEqualTo(root.get("uploadedAt"), date);
        };
    }
    
    public static Specification<Exam> uploadedBetween(Instant startDate, Instant endDate) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            predicates.add(cb.isNotNull(root.get("uploadedAt")));
            
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("uploadedAt"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("uploadedAt"), endDate));
            }
            
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
    
    public static Specification<Exam> hasValidUploadDate() {
        return (root, query, cb) -> cb.isNotNull(root.get("uploadedAt"));
    }
    
    public static Specification<Exam> recentExams(int days) {
        Instant cutoffDate = Instant.now().minus(days, java.time.temporal.ChronoUnit.DAYS);
        return uploadedAfter(cutoffDate);
    }
    
    public static Specification<Exam> titleOrDescriptionContains(String searchTerm) {
        return (root, query, cb) -> {
            if (searchTerm == null || searchTerm.trim().isEmpty()) {
                return cb.conjunction();
            }
            
            String pattern = "%" + searchTerm.toLowerCase().trim() + "%";
            
            Predicate titlePredicate = cb.like(cb.lower(root.get("title")), pattern);
            Predicate descriptionPredicate = cb.like(cb.lower(root.get("description")), pattern);
            
            return cb.or(titlePredicate, descriptionPredicate);
        };
    }
    
    /**
     * NEW: Specification for exams with minimum comment count
     */
    public static Specification<Exam> hasMinimumComments(int minComments) {
        return (root, query, cb) -> {
            if (minComments <= 0) {
                return cb.conjunction();
            }
            return cb.greaterThanOrEqualTo(cb.size(root.get("comments")), minComments);
        };
    }
    
    /**
     * NEW: Specification for exams by question count range using SIZE (recommended)
     */
    public static Specification<Exam> hasQuestionCountInRange(int min, int max) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            if (min > 0) {
                predicates.add(cb.greaterThanOrEqualTo(cb.size(root.get("questions")), min));
            }
            
            if (max > 0) {
                predicates.add(cb.lessThanOrEqualTo(cb.size(root.get("questions")), max));
            }
            
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
    
    // ===== BUILDER PATTERN FOR FLEXIBLE QUERY CONSTRUCTION =====
    
    public static class SearchBuilder {
        private String title;
        private String author;
        private List<String> tags;
        private Instant startDate;
        private Instant endDate;
        private Integer minQuestions;
        private Integer maxQuestions;
        private String fullTextSearch;
        private boolean useOptimizedQuestionCount = true; // Use SIZE function by default
        
        public SearchBuilder title(String title) {
            this.title = title;
            return this;
        }
        
        public SearchBuilder author(String author) {
            this.author = author;
            return this;
        }
        
        public SearchBuilder tags(List<String> tags) {
            this.tags = tags;
            return this;
        }
        
        public SearchBuilder dateRange(Instant start, Instant end) {
            this.startDate = start;
            this.endDate = end;
            return this;
        }
        
        public SearchBuilder questionCount(Integer min, Integer max) {
            this.minQuestions = min;
            this.maxQuestions = max;
            return this;
        }
        
        public SearchBuilder fullText(String searchTerm) {
            this.fullTextSearch = searchTerm;
            return this;
        }
        
        /**
         * Choose whether to use optimized SIZE function (default) or subquery approach
         */
        public SearchBuilder useOptimizedQuestionCount(boolean optimized) {
            this.useOptimizedQuestionCount = optimized;
            return this;
        }
        
        /**
         * Build specification for core database-compatible filters
         * Excludes tags and question counts for maximum efficiency
         */
        public Specification<Exam> buildCoreSpec() {
            Specification<Exam> spec = searchSpecification(title, author, startDate, endDate);
            
            if (fullTextSearch != null && !fullTextSearch.trim().isEmpty()) {
                spec = spec.and(titleOrDescriptionContains(fullTextSearch));
            }
            
            return spec;
        }
        
        /**
         * Build specification including question count filters
         * Uses optimized SIZE function by default
         */
        public Specification<Exam> buildWithQuestionCount() {
            Specification<Exam> spec = buildCoreSpec();
            
            if (minQuestions != null || maxQuestions != null) {
                if (useOptimizedQuestionCount) {
                    // Use the more efficient SIZE function approach
                    spec = spec.and(hasQuestionCountBetweenOptimized(minQuestions, maxQuestions));
                } else {
                    // Use the subquery approach (fixed version)
                    spec = spec.and(hasQuestionCountBetween(minQuestions, maxQuestions));
                }
            }
            
            return spec;
        }
        
        // Getters for parameters that need special handling
        public String getTitle() { return title; }
        public String getAuthor() { return author; }
        public List<String> getTags() { return tags; }
        public Instant getStartDate() { return startDate; }
        public Instant getEndDate() { return endDate; }
        public Integer getMinQuestions() { return minQuestions; }
        public Integer getMaxQuestions() { return maxQuestions; }
        
        public boolean hasTags() { 
            return tags != null && !tags.isEmpty(); 
        }
        
        public boolean hasQuestionCountFilter() { 
            return minQuestions != null || maxQuestions != null; 
        }
        
        public boolean hasDateFilter() {
            return startDate != null || endDate != null;
        }
        
        public boolean hasTextFilter() {
            return (title != null && !title.trim().isEmpty()) ||
                   (author != null && !author.trim().isEmpty()) ||
                   (fullTextSearch != null && !fullTextSearch.trim().isEmpty());
        }
    }
    
    // ===== CONVENIENCE METHODS =====
    
    public static SearchBuilder builder() {
        return new SearchBuilder();
    }
    
    /**
     * Common search for text across title and description
     */
    public static Specification<Exam> commonSearch(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return hasValidUploadDate();
        }
        
        return Specification.where(hasValidUploadDate())
            .and(titleOrDescriptionContains(searchTerm));
    }
    
    /**
     * Recent exams with optional filters
     */
    public static Specification<Exam> recentWithFilters(int days, String author, String titleFilter) {
        Specification<Exam> spec = recentExams(days);
        
        if (author != null && !author.trim().isEmpty()) {
            spec = spec.and(authorContains(author));
        }
        
        if (titleFilter != null && !titleFilter.trim().isEmpty()) {
            spec = spec.and(titleContains(titleFilter));
        }
        
        return spec;
    }
    
    /**
     * Dashboard query optimized for overview pages
     */
    public static Specification<Exam> dashboardQuery() {
        return recentExams(90);  // Last 90 days for performance
    }
    
    /**
     * Author's exams with optional date filter
     */
    public static Specification<Exam> authorExams(String authorEmail, Instant since) {
        Specification<Exam> spec = Specification.where(hasValidUploadDate())
            .and(authorEquals(authorEmail));
            
        if (since != null) {
            spec = spec.and(uploadedAfter(since));
        }
        
        return spec;
    }
    
    /**
     * Combine multiple specifications with AND logic
     */
    public static Specification<Exam> combineAnd(Specification<Exam>... specs) {
        Specification<Exam> result = Specification.where(null);
        for (Specification<Exam> spec : specs) {
            if (spec != null) {
                result = result.and(spec);
            }
        }
        return result;
    }
    
    /**
     * Combine multiple specifications with OR logic
     */
    public static Specification<Exam> combineOr(Specification<Exam>... specs) {
        Specification<Exam> result = null;
        for (Specification<Exam> spec : specs) {
            if (spec != null) {
                if (result == null) {
                    result = Specification.where(spec);
                } else {
                    result = result.or(spec);
                }
            }
        }
        return result != null ? result : Specification.where(null);
    }
}