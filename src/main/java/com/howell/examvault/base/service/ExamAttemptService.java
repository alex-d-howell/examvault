package com.howell.examvault.base.service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.howell.examvault.base.domain.Answer;
import com.howell.examvault.base.domain.Exam;
import com.howell.examvault.base.domain.ExamAttempt;
import com.howell.examvault.base.exception.ExamNotFoundException;
import com.howell.examvault.base.exception.UnauthorizedException;
import com.howell.examvault.base.exception.ValidationException;
import com.howell.examvault.base.repository.ExamAttemptRepository;
import com.howell.examvault.base.repository.ExamRepository;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;

import jakarta.annotation.security.PermitAll;

@BrowserCallable
@Service
@Transactional(readOnly = true)
public class ExamAttemptService {

    private final ExamRepository examRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final UserService userService;

    public ExamAttemptService(ExamRepository examRepository,
            ExamAttemptRepository examAttemptRepository,
            UserService userService) {
        this.examRepository = examRepository;
        this.examAttemptRepository = examAttemptRepository;
        this.userService = userService;
    }

    @AnonymousAllowed
    @Transactional
    public ExamAttempt submitExamAttempt(String examId, String startTime, String endTime, List<Answer> answers) {
        
        UUID examUuid = parseUuid(examId, "exam ID");
        Instant startInstant = parseInstant(startTime, "start time");
        Instant endInstant = parseInstant(endTime, "end time");

        Exam exam = examRepository.findByIdWithQuestions(examUuid)
                .orElseThrow(() -> new ExamNotFoundException(examUuid));

        Map<UUID, List<String>> correctAnswerMap;
        correctAnswerMap = exam.getQuestions().stream()
                .collect(Collectors.toMap(
                        question -> question.getId(),
                        question -> question.getCorrectAnswers()
                ));

        int correctCount = (int) answers.stream()
                .filter(answer -> isAnswerCorrect(answer, correctAnswerMap))
                .count();

        String userEmail = userService.isAuthenticated()
                ? userService.getAuthenticatedUser().email()
                : "anonymous-" + UUID.randomUUID().toString();

        // Create and save attempt in one go
        ExamAttempt attempt = new ExamAttempt(userEmail, startInstant, endInstant, exam, answers, correctCount);

        if (userService.isAuthenticated()) {
            // Set back-references and save in one step
            answers.forEach(answer -> answer.setExamAttempt(attempt));
            return examAttemptRepository.save(attempt); // Return directly
        }

        return attempt; // Return unsaved attempt for anonymous users
    }

    @PermitAll
    public List<ExamAttempt> getMyExamAttempts() {
        if (!userService.isAuthenticated()) {
            throw new UnauthorizedException("Authentication required to view exam history");
        }

        String userEmail = userService.getAuthenticatedUser().email();
        return examAttemptRepository.findByUserEmail(userEmail);
    }

    private boolean isAnswerCorrect(Answer answer, Map<UUID, List<String>> correctAnswerMap) {
        List<String> correctAnswers = correctAnswerMap.get(answer.getQuestionId());
        return correctAnswers != null
                && correctAnswers.size() == answer.getAnswerChoices().size()
                && correctAnswers.containsAll(answer.getAnswerChoices());
    }

    private UUID parseUuid(String uuidString, String fieldName) {
        try {
            return UUID.fromString(uuidString);
        } catch (Exception e) {
            throw new ValidationException("Invalid " + fieldName + " format");
        }
    }

    private Instant parseInstant(String instantString, String fieldName) {
        try {
            return Instant.parse(instantString);
        } catch (Exception e) {
            throw new ValidationException("Invalid " + fieldName + " format");
        }
    }
}
