package com.howell.examvault.base.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.howell.examvault.base.domain.Answer;
import com.howell.examvault.base.domain.Exam;
import com.howell.examvault.base.domain.ExamAttempt;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;

import jakarta.annotation.security.PermitAll;

/**
 * Simplified ExamService that delegates to specialized services Maintains
 * backward compatibility for existing frontend code
 */
@BrowserCallable
@Service
public class ExamService {

    private final ExamSearchService searchService;
    private final ExamCrudService crudService;
    private final ExamAttemptService attemptService;

    public ExamService(ExamSearchService searchService,
            ExamCrudService crudService,
            ExamAttemptService attemptService) {
        this.searchService = searchService;
        this.crudService = crudService;
        this.attemptService = attemptService;
    }

    @AnonymousAllowed
    public List<Exam> searchExams(String title, String uploadedBy, List<String> tags,
            String startDate, String endDate,
            Integer minQuestions, Integer maxQuestions, String sortBy) {
        return searchService.searchExams(title, uploadedBy, tags, startDate, endDate,
                minQuestions, maxQuestions, sortBy);
    }

    @AnonymousAllowed
    public List<Exam> searchByFullText(String searchTerm) {
        return searchService.searchByText(searchTerm);
    }

    @AnonymousAllowed
    public List<Exam> getRecentExams(int days) {
        return searchService.getRecentExams(days);
    }

    @AnonymousAllowed
    public List<String> getAllTags() {
        return searchService.getAllTags();
    }

    @PermitAll
    public Exam saveExam(Exam exam) {
        return crudService.saveExam(exam);
    }

    @PermitAll
    public Exam updateExam(Exam exam) {
        return crudService.updateExam(exam);
    }

    @PermitAll
    public void deleteExamById(UUID id) {
        crudService.deleteExamById(id);
    }

    @AnonymousAllowed
    public Exam getExamById(UUID id) {
        return crudService.getExamById(id);
    }

    @PermitAll
    public List<Exam> getMyExams() {
        return crudService.getMyExams();
    }

    @AnonymousAllowed
    public boolean canUserModifyExam(String examId) {
        return crudService.canUserModifyExam(examId);
    }

    @AnonymousAllowed
    public ExamAttempt submitExamAttempt(String examId, String startTime, String endTime, List<Answer> answers) {
        return attemptService.submitExamAttempt(examId, startTime, endTime, answers);
    }

    @PermitAll
    public List<ExamAttempt> getMyExamAttempts() {
        return attemptService.getMyExamAttempts();
    }
}
