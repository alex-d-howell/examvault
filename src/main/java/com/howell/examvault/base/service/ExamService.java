package com.howell.examvault.base.service;

import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import com.howell.examvault.base.domain.Answer;
import com.howell.examvault.base.domain.Comment;
import com.howell.examvault.base.domain.Exam;
import com.howell.examvault.base.domain.ExamAttempt;
import com.howell.examvault.base.repository.ExamAttemptRepository;
import com.howell.examvault.base.repository.ExamRepository;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;

import jakarta.annotation.security.PermitAll;

@BrowserCallable
@Service
public class ExamService {

    private final ExamRepository examRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final DatabaseType databaseType;
    
    public enum DatabaseType {
        POSTGRESQL, H2, OTHER
    }

    @Autowired
    public ExamService(ExamRepository examRepository, ExamAttemptRepository examAttemptRepository, DataSource dataSource) {
        this.examRepository = examRepository;
        this.examAttemptRepository = examAttemptRepository;
        this.databaseType = detectDatabaseType(dataSource);
        System.out.println("Detected database type: " + databaseType);
    }
    
    /**
     * Detect database type from DataSource URL
     */
    private DatabaseType detectDatabaseType(DataSource dataSource) {
        try {
            String url = dataSource.getConnection().getMetaData().getURL().toLowerCase();
            if (url.contains("postgresql")) {
                return DatabaseType.POSTGRESQL;
            } else if (url.contains("h2")) {
                return DatabaseType.H2;
            } else {
                return DatabaseType.OTHER;
            }
        } catch (SQLException e) {
            System.err.println("Could not detect database type: " + e.getMessage());
            return DatabaseType.OTHER;
        }
    }

    /**
     * Get the current user's email, or null if anonymous
     */
    private String getCurrentUserEmail() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof OidcUser) {
                OidcUser user = (OidcUser) auth.getPrincipal();
                return user.getEmail();
            }
        } catch (Exception e) {
            System.err.println("Error getting current user email: " + e.getMessage());
        }
        return null;
    }

    /**
     * Check if the current user is authenticated
     */
    private boolean isCurrentUserAuthenticated() {
        return getCurrentUserEmail() != null;
    }

    /**
     * Check if the current user can modify an exam (is owner or admin)
     */
    private boolean canModifyExam(Exam exam) {
        if (!isCurrentUserAuthenticated()) {
            return false;
        }

        String userEmail = getCurrentUserEmail();
        return exam.getUploadedBy() != null && exam.getUploadedBy().equals(userEmail);
    }

    // ===== ENHANCED SEARCH METHODS =====
    
    /**
     * Advanced search with multiple filter criteria
     */
    @AnonymousAllowed
    public List<Exam> advancedSearchExams(
            String title, 
            String uploadedBy, 
            List<String> tags,
            String examStatus,
            String startDate,
            String endDate,
            Integer minQuestions,
            Integer maxQuestions,
            String sortBy) {
        
        try {
            // Parse dates if provided
            Instant startInstant = null;
            Instant endInstant = null;
            
            if (startDate != null && !startDate.trim().isEmpty()) {
                try {
                    startInstant = Instant.parse(startDate + "T00:00:00Z");
                } catch (Exception dateException) {
                    System.err.println("Invalid start date format: " + startDate);
                    // Continue with null startInstant
                }
            }
            
            if (endDate != null && !endDate.trim().isEmpty()) {
                try {
                    endInstant = Instant.parse(endDate + "T23:59:59Z");
                } catch (Exception dateException) {
                    System.err.println("Invalid end date format: " + endDate);
                    // Continue with null endInstant
                }
            }
            
            // Normalize empty strings to null
            String normalizedTitle = (title != null && !title.trim().isEmpty()) ? title : null;
            String normalizedUploadedBy = (uploadedBy != null && !uploadedBy.trim().isEmpty()) ? uploadedBy : null;
            String normalizedExamStatus = (examStatus != null && !examStatus.trim().isEmpty()) ? examStatus : null;
            String normalizedSortBy = (sortBy != null && !sortBy.trim().isEmpty()) ? sortBy : "date";
            
            // Convert tags to lowercase for case-insensitive search
            List<String> lowerCaseTags = new ArrayList<>();
            boolean hasTags = false;
            
            if (tags != null && !tags.isEmpty()) {
                for (int i = 0; i < tags.size(); i++) {
                    String tag = tags.get(i);
                    if (tag != null) {
                        String trimmedTag = tag.trim();
                        if (!trimmedTag.isEmpty()) {
                            lowerCaseTags.add(trimmedTag.toLowerCase());
                        }
                    }
                }
                hasTags = !lowerCaseTags.isEmpty();
            }
            
            if (databaseType == DatabaseType.POSTGRESQL) {
                // Use PostgreSQL optimized query
                return examRepository.advancedSearchPostgreSQL(
                    normalizedTitle, normalizedUploadedBy, normalizedExamStatus, startInstant, endInstant, 
                    minQuestions, maxQuestions, lowerCaseTags, hasTags, normalizedSortBy
                );
            } else {
                // Use fallback implementation
                return advancedSearchFallback(
                    normalizedTitle, normalizedUploadedBy, normalizedExamStatus, startInstant, endInstant, 
                    minQuestions, maxQuestions, tags, normalizedSortBy
                );
            }
            
        } catch (Exception e) {
            System.err.println("Error in advanced search: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Fallback advanced search for non-PostgreSQL databases
     */
    private List<Exam> advancedSearchFallback(
            String title, String uploadedBy, String examStatus,
            Instant startDate, Instant endDate,
            Integer minQuestions, Integer maxQuestions,
            List<String> tags, String sortBy) {
        
        try {
            // Start with all exams
            List<Exam> allExams = examRepository.findAllExamsForTagProcessing();
            List<Exam> filteredExams = new ArrayList<>();
            
            for (Exam exam : allExams) {
                // Filter by title
                if (title != null && (exam.getTitle() == null || 
                    !exam.getTitle().toLowerCase().contains(title.toLowerCase()))) {
                    continue;
                }
                
                // Filter by author
                if (uploadedBy != null && (exam.getUploadedBy() == null || 
                    !exam.getUploadedBy().toLowerCase().contains(uploadedBy.toLowerCase()))) {
                    continue;
                }
                
                // Filter by exam status
                if (examStatus != null && (exam.getExamStatus() == null || 
                    !exam.getExamStatus().toLowerCase().equals(examStatus.toLowerCase()))) {
                    continue;
                }
                
                // Filter by date range
                if (startDate != null && (exam.getUploadedAt() == null || exam.getUploadedAt().isBefore(startDate))) {
                    continue;
                }
                if (endDate != null && (exam.getUploadedAt() == null || exam.getUploadedAt().isAfter(endDate))) {
                    continue;
                }
                
                // Filter by question count
                int questionCount = exam.getQuestions() != null ? exam.getQuestions().size() : 0;
                if (minQuestions != null && questionCount < minQuestions) {
                    continue;
                }
                if (maxQuestions != null && questionCount > maxQuestions) {
                    continue;
                }
                
                // Filter by tags
                if (tags != null && !tags.isEmpty()) {
                    boolean hasMatchingTag = false;
                    if (exam.getTags() != null) {
                        for (String tag : tags) {
                            if (tag != null) {
                                for (String examTag : exam.getTags()) {
                                    if (examTag != null && examTag.toLowerCase().contains(tag.toLowerCase())) {
                                        hasMatchingTag = true;
                                        break;
                                    }
                                }
                                if (hasMatchingTag) break;
                            }
                        }
                    }
                    if (!hasMatchingTag) {
                        continue;
                    }
                }
                
                filteredExams.add(exam);
            }
            
            // Sort results
            sortExams(filteredExams, sortBy);
            
            return filteredExams;
            
        } catch (Exception e) {
            System.err.println("Error in advanced search fallback: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Sort exams based on the specified criteria
     */
    private void sortExams(List<Exam> exams, String sortBy) {
        switch (sortBy.toLowerCase()) {
            case "title":
                exams.sort((a, b) -> a.getTitle().compareToIgnoreCase(b.getTitle()));
                break;
            case "questions":
                exams.sort((a, b) -> {
                    int aCount = a.getQuestions() != null ? a.getQuestions().size() : 0;
                    int bCount = b.getQuestions() != null ? b.getQuestions().size() : 0;
                    return Integer.compare(bCount, aCount); // Descending
                });
                break;
            case "comments":
                exams.sort((a, b) -> {
                    int aCount = a.getComments() != null ? a.getComments().size() : 0;
                    int bCount = b.getComments() != null ? b.getComments().size() : 0;
                    return Integer.compare(bCount, aCount); // Descending
                });
                break;
            case "author":
                exams.sort((a, b) -> {
                    String aAuthor = a.getUploadedBy() != null ? a.getUploadedBy() : "";
                    String bAuthor = b.getUploadedBy() != null ? b.getUploadedBy() : "";
                    return aAuthor.compareToIgnoreCase(bAuthor);
                });
                break;
            case "date":
            default:
                exams.sort((a, b) -> b.getUploadedAt().compareTo(a.getUploadedAt())); // Newest first
                break;
        }
    }

    /**
     * Get all unique exam statuses for filter dropdown
     */
    @AnonymousAllowed
    public List<String> getAllExamStatuses() {
        try {
            return examRepository.findAllUniqueExamStatuses();
        } catch (Exception e) {
            System.err.println("Error getting exam statuses: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Get exam statistics for display/filtering hints
     */
    @AnonymousAllowed
    public Map<String, Object> getExamStatistics() {
        try {
            if (databaseType == DatabaseType.POSTGRESQL) {
                Object[] stats = examRepository.getExamStatistics();
                Map<String, Object> result = new HashMap<>();
                if (stats != null && stats.length > 0 && stats[0] != null) {
                    result.put("totalExams", stats[0]);
                    result.put("uniqueAuthors", stats[1]);
                    result.put("earliestExam", stats[2]);
                    result.put("latestExam", stats[3]);
                    result.put("avgQuestions", stats[4]);
                }
                return result;
            } else {
                return getExamStatisticsFallback();
            }
        } catch (Exception e) {
            System.err.println("Error getting exam statistics: " + e.getMessage());
            return new HashMap<>();
        }
    }

    /**
     * Fallback statistics calculation
     */
    private Map<String, Object> getExamStatisticsFallback() {
        try {
            List<Exam> allExams = examRepository.findAllExamsForTagProcessing();
            Map<String, Object> result = new HashMap<>();
            
            result.put("totalExams", (long) allExams.size());
            
            Set<String> uniqueAuthors = new HashSet<>();
            Instant earliest = null;
            Instant latest = null;
            int totalQuestions = 0;
            
            for (Exam exam : allExams) {
                if (exam.getUploadedBy() != null) {
                    uniqueAuthors.add(exam.getUploadedBy());
                }
                
                if (exam.getUploadedAt() != null) {
                    if (earliest == null || exam.getUploadedAt().isBefore(earliest)) {
                        earliest = exam.getUploadedAt();
                    }
                    if (latest == null || exam.getUploadedAt().isAfter(latest)) {
                        latest = exam.getUploadedAt();
                    }
                }
                
                if (exam.getQuestions() != null) {
                    totalQuestions += exam.getQuestions().size();
                }
            }
            
            result.put("uniqueAuthors", (long) uniqueAuthors.size());
            result.put("earliestExam", earliest);
            result.put("latestExam", latest);
            result.put("avgQuestions", !allExams.isEmpty() ? (double) totalQuestions / allExams.size() : 0.0);
            
            return result;
            
        } catch (Exception e) {
            System.err.println("Error in statistics fallback: " + e.getMessage());
            return new HashMap<>();
        }
    }

    /**
     * Get suggested search terms based on exam content
     */
    @AnonymousAllowed
    public Map<String, List<String>> getSearchSuggestions() {
        try {
            Map<String, List<String>> suggestions = new HashMap<>();
            
            // Get recent authors
            List<Exam> recentExams = examRepository.findByUploadedAtAfter(
                Instant.now().minus(30, java.time.temporal.ChronoUnit.DAYS)
            );
            
            Set<String> authors = new HashSet<>();
            Set<String> titleWords = new HashSet<>();
            
            for (Exam exam : recentExams) {
                if (exam.getUploadedBy() != null) {
                    authors.add(exam.getUploadedBy());
                }
                
                if (exam.getTitle() != null) {
                    String[] words = exam.getTitle().toLowerCase().split("\\s+");
                    for (String word : words) {
                        if (word.length() > 3) { // Only significant words
                            titleWords.add(word);
                        }
                    }
                }
            }
            
            suggestions.put("authors", new ArrayList<>(authors).subList(0, Math.min(authors.size(), 10)));
            suggestions.put("titleWords", new ArrayList<>(titleWords).subList(0, Math.min(titleWords.size(), 15)));
            
            return suggestions;
            
        } catch (Exception e) {
            System.err.println("Error getting search suggestions: " + e.getMessage());
            return new HashMap<>();
        }
    }

    // ===== EXAM CRUD METHODS =====
    
    /**
     * Validates and normalizes exam tags to ensure they meet business rules
     * Tags are converted to lowercase for consistent storage and searching
     */
    private List<String> validateAndNormalizeExamTags(List<String> tags) {
        if (tags == null) {
            return null;
        }

        if (tags.size() > 10) {
            throw new IllegalArgumentException("Maximum of 10 tags allowed per exam");
        }

        List<String> normalizedTags = new ArrayList<>();

        // Validate individual tags and normalize them
        for (String tag : tags) {
            if (tag == null || tag.trim().isEmpty()) {
                throw new IllegalArgumentException("Tags cannot be empty");
            }

            String trimmedTag = tag.trim();
            if (trimmedTag.length() > 50) {
                throw new IllegalArgumentException("Tags cannot exceed 50 characters");
            }

            // Basic sanitization - only allow alphanumeric, spaces, hyphens, and underscores
            if (!trimmedTag.matches("^[a-zA-Z0-9\\s\\-_]+$")) {
                throw new IllegalArgumentException("Tags can only contain letters, numbers, spaces, hyphens, and underscores");
            }

            // Convert to lowercase for consistent storage
            String normalizedTag = trimmedTag.toLowerCase();

            // Add to list if not already present (avoid duplicates)
            if (!normalizedTags.contains(normalizedTag)) {
                normalizedTags.add(normalizedTag);
            }
        }

        return normalizedTags;
    }

    @PermitAll
    public void saveExam(Exam exam) {
        System.out.println("=== SAVE EXAM CALLED ===");
        System.out.println("User authenticated: " + isCurrentUserAuthenticated());

        if (!isCurrentUserAuthenticated()) {
            System.err.println("Authentication required but user not authenticated");
            throw new SecurityException("Authentication required to create exams");
        }

        String userEmail = getCurrentUserEmail();
        System.out.println("User email: " + userEmail);
        System.out.println("Exam title: " + exam.getTitle());
        System.out.println("Number of questions: " + (exam.getQuestions() != null ? exam.getQuestions().size() : 0));
        System.out.println("Original tags: " + exam.getTags());

        if (exam.getTitle() == null || exam.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Exam title is required");
        }

        if (exam.getQuestions() == null || exam.getQuestions().isEmpty()) {
            throw new IllegalArgumentException("Exam must have at least one question");
        }

        // Validate and normalize tags
        List<String> normalizedTags = validateAndNormalizeExamTags(exam.getTags());
        exam.setTags(normalizedTags);

        System.out.println("Normalized tags: " + exam.getTags());

        exam.setUploadedBy(userEmail);
        exam.setUploadedAt(Instant.now());

        try {
            examRepository.save(exam);
            System.out.println("Exam saved successfully with ID: " + exam.getId());
        } catch (Exception e) {
            System.err.println("Error saving exam: " + e.getMessage());
            throw new RuntimeException("Failed to save exam: " + e.getMessage());
        }
    }

    @PermitAll
    public void deleteExamById(UUID id) {
        if (!isCurrentUserAuthenticated()) {
            throw new SecurityException("Authentication required to delete exams");
        }

        Exam exam = examRepository.findById(id).orElse(null);
        if (exam == null) {
            throw new RuntimeException("Exam not found");
        }

        if (!canModifyExam(exam)) {
            throw new SecurityException("You can only delete exams you created");
        }

        examRepository.deleteById(id);
    }

    @PermitAll
    public void updateExam(Exam exam) {
        if (!isCurrentUserAuthenticated()) {
            throw new SecurityException("Authentication required to update exams");
        }

        Exam existingExam = examRepository.findById(exam.getId()).orElse(null);
        if (existingExam == null) {
            throw new RuntimeException("Exam not found");
        }

        if (!canModifyExam(existingExam)) {
            throw new SecurityException("You can only update exams you created");
        }

        // Validate and normalize tags before updating
        List<String> normalizedTags = validateAndNormalizeExamTags(exam.getTags());
        exam.setTags(normalizedTags);

        // Preserve original metadata
        exam.setUploadedBy(existingExam.getUploadedBy());
        exam.setUploadedAt(existingExam.getUploadedAt());

        System.out.println("Updating exam with normalized tags: " + exam.getTags());

        examRepository.save(exam);
    }

    @AnonymousAllowed
    public boolean canUserModifyExam(String examId) {
        try {
            UUID examUuid = UUID.fromString(examId);
            Exam exam = examRepository.findById(examUuid).orElse(null);
            if (exam == null) {
                return false;
            }
            return canModifyExam(exam);
        } catch (Exception e) {
            return false;
        }
    }

    // ===== TAG SEARCH METHODS =====
    
    /**
     * Get all unique tags using database-optimized queries
     * Automatically uses the best approach for your database
     */
    @AnonymousAllowed
    public List<String> getAllTags() {
        try {
            switch (databaseType) {
                case POSTGRESQL:
                    return examRepository.findAllUniqueTagsPostgreSQL();
                    
                case H2:
                case OTHER:
                default:
                    // For H2 and other databases, use service-layer processing
                    // H2 has limited array support, so this is more reliable
                    return getAllTagsFallback();
            }
        } catch (Exception e) {
            System.err.println("Database-specific query failed, using fallback: " + e.getMessage());
            return getAllTagsFallback();
        }
    }
    
    /**
     * Efficient fallback for getAllTags using simple database query + Java processing
     */
    private List<String> getAllTagsFallback() {
        try {
            // Get all exams with a simple query that works on any database
            List<Exam> allExams = examRepository.findAllExamsForTagProcessing();
            Set<String> uniqueTags = new HashSet<>();
            
            for (Exam exam : allExams) {
                if (exam.getTags() != null) {
                    for (String tag : exam.getTags()) {
                        if (tag != null && !tag.trim().isEmpty()) {
                            uniqueTags.add(tag.toLowerCase().trim());
                        }
                    }
                }
            }
            
            List<String> sortedTags = new ArrayList<>(uniqueTags);
            Collections.sort(sortedTags);
            return sortedTags;
            
        } catch (Exception e) {
            System.err.println("Error in getAllTags fallback: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * High-performance tag search using database-optimized queries for PostgreSQL only
     */
    @AnonymousAllowed
    public List<Exam> searchExamsByTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return new ArrayList<>();
        }

        // Convert to lowercase for case-insensitive search and filter out null/empty tags
        List<String> lowerCaseTags = new ArrayList<>();
        for (String tag : tags) {
            if (tag != null && !tag.trim().isEmpty()) {
                lowerCaseTags.add(tag.toLowerCase());
            }
        }
        
        // If no valid tags after filtering, return empty list
        if (lowerCaseTags.isEmpty()) {
            return new ArrayList<>();
        }

        try {
            if (databaseType == DatabaseType.POSTGRESQL) {
                // PostgreSQL: Use array overlap for maximum performance
                return examRepository.findByTagsInPostgreSQL(lowerCaseTags);
            } else {
                // H2 and other databases: Use service-layer processing
                return searchExamsByTagsFallback(lowerCaseTags);
            }
        } catch (Exception e) {
            System.err.println("Database-specific tag search failed, using fallback: " + e.getMessage());
            return searchExamsByTagsFallback(lowerCaseTags);
        }
    }
    
    /**
     * Fallback method for tag searching - uses simple query + efficient processing
     */
    private List<Exam> searchExamsByTagsFallback(List<String> tags) {
        try {
            Set<String> lowerCaseTagsSet = new HashSet<>();
            for (String tag : tags) {
                if (tag != null && !tag.trim().isEmpty()) {
                    lowerCaseTagsSet.add(tag.toLowerCase());
                }
            }
            
            // If no valid tags, return empty list
            if (lowerCaseTagsSet.isEmpty()) {
                return new ArrayList<>();
            }

            // Get all exams with simple query that works on any database
            List<Exam> allExams = examRepository.findAllExamsForTagProcessing();
            List<Exam> matchingExams = new ArrayList<>();
            
            for (Exam exam : allExams) {
                if (exam.getTags() != null) {
                    boolean hasMatchingTag = false;
                    for (String examTag : exam.getTags()) {
                        if (examTag != null && lowerCaseTagsSet.contains(examTag.toLowerCase())) {
                            hasMatchingTag = true;
                            break;
                        }
                    }
                    if (hasMatchingTag) {
                        matchingExams.add(exam);
                    }
                }
            }
            
            return matchingExams;
            
        } catch (Exception e) {
            System.err.println("Error in searchExamsByTags fallback: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * High-performance combined search using database-optimized queries for PostgreSQL only
     */
    @AnonymousAllowed
    public List<Exam> searchExams(String title, String uploadedBy, List<String> tags) {
        // Normalize parameters
        String normalizedTitle = (title != null && !title.trim().isEmpty()) ? title : "";
        String normalizedUploadedBy = (uploadedBy != null && !uploadedBy.trim().isEmpty()) ? uploadedBy : "";

        try {
            // If no tags provided, use the simple repository method
            if (tags == null || tags.isEmpty()) {
                return examRepository.findByTitleContainingIgnoreCaseAndUploadedByContainingIgnoreCase(normalizedTitle, normalizedUploadedBy);
            }

            // Convert tags to lowercase for case-insensitive search
            List<String> lowerCaseTags = new ArrayList<>();
            for (String tag : tags) {
                if (tag != null && !tag.trim().isEmpty()) {
                    lowerCaseTags.add(tag.toLowerCase());
                }
            }

            if (databaseType == DatabaseType.POSTGRESQL) {
                // PostgreSQL: Single optimized query with array operations
                return examRepository.findByTitleAndUploadedByAndTagsPostgreSQL(normalizedTitle, normalizedUploadedBy, lowerCaseTags);
            } else {
                // H2 and other databases: Use efficient hybrid approach
                return searchExamsFallback(normalizedTitle, normalizedUploadedBy, tags);
            }
        } catch (Exception e) {
            System.err.println("Database-specific search failed, using fallback: " + e.getMessage());
            return searchExamsFallback(normalizedTitle, normalizedUploadedBy, tags);
        }
    }
    
    /**
     * Efficient fallback combining database and service-layer processing
     */
    private List<Exam> searchExamsFallback(String title, String uploadedBy, List<String> tags) {
        try {
            // Step 1: Database filtering for title/author (this always works)
            List<Exam> titleAuthorMatches = examRepository.findByTitleContainingIgnoreCaseAndUploadedByContainingIgnoreCase(title, uploadedBy);
            
            if (tags == null || tags.isEmpty()) {
                return titleAuthorMatches;
            }
            
            // Step 2: Efficient tag filtering on the reduced dataset
            Set<String> lowerCaseTagsSet = new HashSet<>();
            for (String tag : tags) {
                lowerCaseTagsSet.add(tag.toLowerCase());
            }
            
            List<Exam> finalMatches = new ArrayList<>();
            for (Exam exam : titleAuthorMatches) {
                if (exam.getTags() != null && examContainsAnyTag(exam, lowerCaseTagsSet)) {
                    finalMatches.add(exam);
                }
            }
            
            return finalMatches;
            
        } catch (Exception e) {
            System.err.println("Error in searchExams fallback: " + e.getMessage());
            // Final fallback - just return title/author matches without tag filtering
            return examRepository.findByTitleContainingIgnoreCaseAndUploadedByContainingIgnoreCase(title, uploadedBy);
        }
    }
    
    /**
     * Helper method to check if an exam contains any of the required tags
     */
    private boolean examContainsAnyTag(Exam exam, Set<String> requiredTags) {
        if (exam.getTags() == null) {
            return false;
        }
        
        for (String examTag : exam.getTags()) {
            if (examTag != null && requiredTags.contains(examTag.toLowerCase())) {
                return true;
            }
        }
        
        return false;
    }

    // ===== COMMENT AND ATTEMPT METHODS =====
    
    @PermitAll
    public Comment addComment(String examId, String commentText, Integer rating) {
        if (!isCurrentUserAuthenticated()) {
            throw new SecurityException("Authentication required to add comments");
        }

        try {
            UUID examUuid = UUID.fromString(examId);
            Exam exam = examRepository.findById(examUuid).orElse(null);
            if (exam == null) {
                throw new RuntimeException("Exam not found");
            }

            String userEmail = getCurrentUserEmail();
            Comment comment = new Comment(userEmail, Instant.now(), commentText);

            if (rating != null && rating >= 1 && rating <= 5) {
                comment.setExamRating(rating);
            }

            exam.addComment(comment);
            examRepository.save(exam);

            return comment;
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid exam ID format");
        }
    }

    @AnonymousAllowed
    public List<Comment> getExamComments(String examId) {
        try {
            UUID examUuid = UUID.fromString(examId);
            Exam exam = examRepository.findById(examUuid).orElse(null);
            if (exam == null) {
                throw new RuntimeException("Exam not found");
            }

            return exam.getComments() != null ? exam.getComments() : new ArrayList<>();
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid exam ID format");
        }
    }

    @PermitAll
    public List<ExamAttempt> getMyExamAttempts() {
        if (!isCurrentUserAuthenticated()) {
            throw new SecurityException("Authentication required to view exam history");
        }

        String userEmail = getCurrentUserEmail();
        return examAttemptRepository.findByUserEmail(userEmail);
    }

    @PermitAll
    public List<ExamAttempt> getExamAttemptsByUserEmail(String userEmail) {
        if (!isCurrentUserAuthenticated()) {
            throw new SecurityException("Authentication required to view user exam history");
        }

        return examAttemptRepository.findByUserEmail(userEmail);
    }

    @PermitAll
    public List<Exam> getMyExams() {
        if (!isCurrentUserAuthenticated()) {
            throw new SecurityException("Authentication required to view your exams");
        }

        String userEmail = getCurrentUserEmail();
        return examRepository.findByUploadedBy(userEmail);
    }

    @AnonymousAllowed
    public ExamAttempt submitExamAttempt(String examId, String startTime, String endTime, List<Answer> answers) {
        UUID examUuid;
        Instant startInstant;
        Instant endInstant;

        try {
            examUuid = UUID.fromString(examId);
            startInstant = Instant.parse(startTime);
            endInstant = Instant.parse(endTime);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid parameter format: " + e.getMessage());
        }

        Exam exam = examRepository.findById(examUuid).orElse(null);
        if (exam == null) {
            throw new RuntimeException("Exam not found");
        }

        boolean isUserAuthenticated = isCurrentUserAuthenticated();

        // Calculate correct answers
        Map<UUID, List<String>> correctAnswerMap = exam.getQuestions().stream()
                .collect(Collectors.toMap(question -> question.getId(), question -> question.getCorrectAnswers()));

        int correctCount = (int) answers.stream()
                .filter(answer -> {
                    List<String> correctAnswer = correctAnswerMap.get(answer.getQuestionId());
                    return correctAnswer != null
                            && correctAnswer.size() == answer.getAnswerChoices().size()
                            && correctAnswer.containsAll(answer.getAnswerChoices());
                })
                .count();

        String userEmail = getCurrentUserEmail();
        if (userEmail == null) {
            userEmail = "anonymous-" + UUID.randomUUID().toString();
        }

        ExamAttempt attempt = new ExamAttempt(userEmail, startInstant, endInstant, exam, answers, correctCount);

        if (isUserAuthenticated) {
            examAttemptRepository.save(attempt);
        }

        return attempt;
    }

    @AnonymousAllowed
    public List<Exam> getAllExams() {
        return examRepository.findAll();
    }

    @AnonymousAllowed
    public Exam getExamById(UUID id) {
        return examRepository.findById(id).orElse(null);
    }
}