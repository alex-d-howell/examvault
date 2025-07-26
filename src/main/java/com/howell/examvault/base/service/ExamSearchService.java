package com.howell.examvault.base.service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.howell.examvault.base.domain.Exam;
import com.howell.examvault.base.repository.ExamRepository;
import com.howell.examvault.base.repository.ExamSpecifications;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;

@BrowserCallable
@Service
public class ExamSearchService {

    private final ExamRepository examRepository;

    public ExamSearchService(ExamRepository examRepository) {
        this.examRepository = examRepository;
    }

    @AnonymousAllowed
    public List<Exam> searchExams(String title, String author, List<String> tags,
            String startDate, String endDate,
            Integer minQuestions, Integer maxQuestions, String sortBy) {
        try {
            // Parse dates
            Instant startInstant = parseDate(startDate);
            Instant endInstant = parseDate(endDate);

            // Build specification with date support
            Specification<Exam> spec = ExamSpecifications.builder()
                    .title(title)
                    .author(author)
                    .dateRange(startInstant, endInstant)
                    .questionCount(minQuestions, maxQuestions)
                    .buildWithQuestionCount();

            // Handle tags separately if provided
            if (tags != null && !tags.isEmpty()) {
                List<String> normalizedTags = normalizeTags(tags);
                List<Exam> tagResults = examRepository.findByTagsExists(normalizedTags);

                if (tagResults.isEmpty()) {
                    return tagResults;
                }

                // Apply other filters to tag results
                return tagResults.stream()
                        .filter(exam -> matchesDateFilter(exam, startInstant, endInstant))
                        .filter(exam -> matchesQuestionCountFilter(exam, minQuestions, maxQuestions))
                        .filter(exam -> matchesTextFilter(exam, title, author))
                        .sorted(createComparator(sortBy))
                        .collect(Collectors.toList());
            }

            Sort sort = createSort(sortBy);
            return examRepository.findAll(spec, sort);

        } catch (Exception e) {
            System.err.println("Search error: " + e.getMessage());
            return List.of();
        }
    }

    @AnonymousAllowed
    public List<Exam> searchByText(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getRecentExams(30);
        }

        Specification<Exam> spec = ExamSpecifications.commonSearch(searchTerm);
        return examRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "uploadedAt"));
    }

    @AnonymousAllowed
    public List<Exam> getRecentExams(int days) {
        Specification<Exam> spec = ExamSpecifications.recentExams(days);
        return examRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "uploadedAt"));
    }

    @AnonymousAllowed
    public List<String> getAllTags() {
        return examRepository.findAllUniqueTags();
    }

    @AnonymousAllowed
    public List<String> getPopularTags(int limit) {
        return examRepository.getPopularTags(limit).stream()
                .map(row -> (String) row[0])
                .collect(Collectors.toList());
    }

    @AnonymousAllowed
    public List<String> searchTags(String pattern) {
        return examRepository.findTagsMatchingPattern(pattern);
    }

    private Instant parseDate(String dateString) {
        if (dateString == null || dateString.trim().isEmpty()) {
            return null;
        }
        try {
            String cleanDate = dateString.trim();
            if (!cleanDate.contains("T")) {
                cleanDate = cleanDate + "T00:00:00Z";
            }
            return Instant.parse(cleanDate);
        } catch (Exception e) {
            System.err.println("Invalid date format: " + dateString);
            return null;
        }
    }

    private boolean matchesDateFilter(Exam exam, Instant startDate, Instant endDate) {
        if (exam.getUploadedAt() == null) {
            return false;
        }
        if (startDate != null && exam.getUploadedAt().isBefore(startDate)) {
            return false;
        }
        return !(endDate != null && exam.getUploadedAt().isAfter(endDate));
    }

    private boolean matchesQuestionCountFilter(Exam exam, Integer minQuestions, Integer maxQuestions) {
        int questionCount = exam.getQuestions() != null ? exam.getQuestions().size() : 0;
        if (minQuestions != null && questionCount < minQuestions) {
            return false;
        }
        return !(maxQuestions != null && questionCount > maxQuestions);
    }

    private boolean matchesTextFilter(Exam exam, String title, String author) {
        if (title != null && !title.trim().isEmpty()) {
            if (!exam.getTitle().toLowerCase().contains(title.toLowerCase().trim())) {
                return false;
            }
        }
        if (author != null && !author.trim().isEmpty()) {
            if (exam.getUploadedBy() == null
                    || !exam.getUploadedBy().toLowerCase().contains(author.toLowerCase().trim())) {
                return false;
            }
        }
        return true;
    }

    private Comparator<Exam> createComparator(String sortBy) {
        if (sortBy == null) {
            return (a, b) -> b.getUploadedAt().compareTo(a.getUploadedAt());
        }

        return switch (sortBy.toLowerCase()) {
            case "title" ->
                Comparator.comparing(Exam::getTitle);
            case "author" ->
                Comparator.comparing(Exam::getUploadedBy);
            case "date" ->
                (a, b) -> b.getUploadedAt().compareTo(a.getUploadedAt());
            default ->
                (a, b) -> b.getUploadedAt().compareTo(a.getUploadedAt());
        };
    }

    private Sort createSort(String sortBy) {
        if (sortBy == null) {
            return Sort.by(Sort.Direction.DESC, "uploadedAt");
        }

        return switch (sortBy.toLowerCase()) {
            case "title" ->
                Sort.by(Sort.Direction.ASC, "title");
            case "author" ->
                Sort.by(Sort.Direction.ASC, "uploadedBy");
            case "date" ->
                Sort.by(Sort.Direction.DESC, "uploadedAt");
            default ->
                Sort.by(Sort.Direction.DESC, "uploadedAt");
        };
    }

    private List<String> normalizeTags(List<String> tags) {
        return tags.stream()
                .filter(tag -> tag != null && !tag.trim().isEmpty())
                .map(tag -> tag.toLowerCase().trim())
                .distinct()
                .collect(Collectors.toList());
    }
}
