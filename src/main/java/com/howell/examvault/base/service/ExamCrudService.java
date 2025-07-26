package com.howell.examvault.base.service;

import java.time.Clock;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.howell.examvault.base.domain.Exam;
import com.howell.examvault.base.exception.ExamNotFoundException;
import com.howell.examvault.base.exception.UnauthorizedException;
import com.howell.examvault.base.exception.ValidationException;
import com.howell.examvault.base.repository.ExamRepository;
import com.vaadin.hilla.BrowserCallable;

import jakarta.annotation.security.PermitAll;

@BrowserCallable
@Service
@Transactional(readOnly = true)
public class ExamCrudService {

    private final ExamRepository examRepository;
    private final UserService userService;
    private final Clock clock;

    public ExamCrudService(ExamRepository examRepository, UserService userService, Clock clock) {
        this.examRepository = examRepository;
        this.userService = userService;
        this.clock = clock;
    }

    @PermitAll
    @Transactional
    public Exam saveExam(Exam exam) {
        if (!userService.isAuthenticated()) {
            throw new UnauthorizedException("Authentication required to create exams"); // Changed
        }

        validateExam(exam);

        String userEmail = userService.getAuthenticatedUser().email();

        // Set relationships
        if (exam.getQuestions() != null) {
            exam.getQuestions().forEach(question -> question.setExam(exam));
        }

        // Normalize tags
        exam.setTags(validateAndNormalizeExamTags(exam.getTags()));

        // Set metadata
        exam.setUploadedBy(userEmail);
        exam.setUploadedAt(clock.instant());

        return examRepository.save(exam);
    }

    @PermitAll
    @Transactional
    public Exam updateExam(Exam exam) {
        if (!userService.isAuthenticated()) {
            throw new UnauthorizedException("Authentication required to update exams");
        }

        Exam existingExam = examRepository.findById(exam.getId())
                .orElseThrow(() -> new ExamNotFoundException(exam.getId()));

        if (!canModifyExam(existingExam)) {
            throw new UnauthorizedException("You can only update exams you created");
        }

        validateExam(exam);

        // Set relationships
        if (exam.getQuestions() != null) {
            exam.getQuestions().forEach(question -> question.setExam(exam));
        }

        // Preserve original metadata
        exam.setUploadedBy(existingExam.getUploadedBy());
        exam.setUploadedAt(existingExam.getUploadedAt());
        exam.setTags(validateAndNormalizeExamTags(exam.getTags()));

        return examRepository.save(exam);
    }

    @PermitAll
    @Transactional
    public void deleteExamById(UUID id) {
        if (!userService.isAuthenticated()) {
            throw new UnauthorizedException("Authentication required to delete exams");
        }

        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ExamNotFoundException(id));

        if (!canModifyExam(exam)) {
            throw new UnauthorizedException("You can only delete exams you created");
        }

        examRepository.deleteById(id);
    }

    public Exam getExamById(UUID id) {
    // Load exam with questions (most commonly needed)
    Optional<Exam> examOpt = examRepository.findByIdWithQuestions(id);
    
    if (examOpt.isEmpty()) {
        return null;
    }
    
    Exam exam = examOpt.get();
    
    return exam;
}

    @PermitAll
    public List<Exam> getMyExams() {
        if (!userService.isAuthenticated()) {
            throw new UnauthorizedException("Authentication required to view your exams");
        }

        String userEmail = userService.getAuthenticatedUser().email();
        return examRepository.findByUploadedBy(userEmail, Sort.by(Sort.Direction.DESC, "uploadedAt"));
    }

    public boolean canUserModifyExam(String examId) {
        try {
            UUID examUuid = UUID.fromString(examId);
            Exam exam = examRepository.findById(examUuid).orElse(null);
            return exam != null && canModifyExam(exam);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean canModifyExam(Exam exam) {
        if (!userService.isAuthenticated()) {
            return false;
        }
        String userEmail = userService.getAuthenticatedUser().email();
        return exam.getUploadedBy() != null && exam.getUploadedBy().equals(userEmail);
    }

    private void validateExam(Exam exam) {
        if (exam.getTitle() == null || exam.getTitle().trim().isEmpty()) {
            throw new ValidationException("Exam title is required");
        }
        if (exam.getQuestions() == null || exam.getQuestions().isEmpty()) {
            throw new ValidationException("Exam must have at least one question");
        }
    }

    private List<String> validateAndNormalizeExamTags(List<String> tags) {
        if (tags == null) {
            return null;
        }

        if (tags.size() > 10) {
            throw new ValidationException("Maximum of 10 tags allowed per exam");
        }

        return tags.stream()
                .filter(tag -> tag != null && !tag.trim().isEmpty())
                .map(String::trim)
                .filter(tag -> {
                    if (tag.length() > 50) {
                        throw new ValidationException("Tags cannot exceed 50 characters: " + tag);
                    }
                    return true;
                })
                .filter(tag -> {
                    if (!tag.matches("^[a-zA-Z0-9\\s\\-_]+$")) {
                        throw new ValidationException("Tags can only contain letters, numbers, spaces, hyphens, and underscores: " + tag);
                    }
                    return true;
                })
                .map(String::toLowerCase)
                .distinct()
                .collect(Collectors.toList());
    }
}
