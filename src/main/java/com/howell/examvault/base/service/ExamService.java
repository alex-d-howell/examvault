package com.howell.examvault.base.service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import com.howell.examvault.base.domain.Answer;
import com.howell.examvault.base.domain.Exam;
import com.howell.examvault.base.domain.ExamAttempt;
import com.howell.examvault.base.domain.ExamAttemptRepository;
import com.howell.examvault.base.domain.ExamRepository;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;

@AnonymousAllowed
@BrowserCallable
public class ExamService {

    private final ExamRepository examRepository;
    private final ExamAttemptRepository examAttemptRepository;

    public ExamService(ExamRepository examRepository, ExamAttemptRepository examAttemptRepository) {
        this.examRepository = examRepository;
        this.examAttemptRepository = examAttemptRepository;
    }

    /**
     * Saves a new exam to the repository.
     *
     * @param exam the Exam object to save
     */
    public void saveExam(Exam exam) {

        exam.setUploadedBy("Test");  // Set the uploader to "Test" for demo purposes
        exam.setUploadedAt(Instant.now());  // Set the current time as the upload time
        examRepository.save(exam);
    }

    /**
     * Submits an exam attempt for a specific exam and calculates the number of
     * correct answers.
     *
     * @param examId the UUID of the exam being attempted
     * @param startTime the start time of the exam attempt
     * @param endTime the end time of the exam attempt
     * @param answers a map of question IDs to selected answer choices
     * @return the created ExamAttempt object
     */
    public ExamAttempt submitExamAttempt(UUID examId, Instant startTime, Instant endTime, List<Answer> answers) {
        Exam exam = examRepository.findById(examId).orElse(null);
        if (exam == null) {
            throw new RuntimeException("Exam not found");
        }

        System.out.println(answers);

        Map<UUID, List<String>> answeredQuestionMap = exam.getQuestions().stream()
                .collect(Collectors.toMap(question -> question.getId(), question -> question.getCorrectAnswers()));

        System.out.println("Correct Answer Map: " + answeredQuestionMap);

        int correctCount = answers.stream()
                .filter(answer -> {
                    List<String> correctAnswer = answeredQuestionMap.get(answer.getQuestionId());
                    System.out.println("Question ID: " + answer.getQuestionId() + ", Correct Answer: " + correctAnswer + ", User Answer: " + answer.getAnswerChoices());
                    return correctAnswer.containsAll(answer.getAnswerChoices());

                })
                .toList()
                .size();

        System.out.println("Number of correct answers: " + correctCount);

        // Create and save the exam attempt
        ExamAttempt attempt = new ExamAttempt("test@gmail.com", startTime, endTime, exam, answers, correctCount);
        examAttemptRepository.save(attempt);

        return attempt;
    }

    /**
     * Deletes an exam by its ID.
     *
     * @param id the UUID of the exam to delete
     */
    public void deleteExamById(UUID id) {
        // Delete a specific exam by its ID
        examRepository.deleteById(id);
    }

    /**
     * Retrieves all exams from the repository.
     *
     * @return a list of all Exam objects
     */
    public List<Exam> getAllExams() {
        // Retrieve all exams from the repository
        return examRepository.findAll();
    }

    /**
     * Retrieves a specific exam by its ID.
     *
     * @param id the UUID of the exam to retrieve
     * @return the Exam object if found, or null if not found
     */
    public Exam getExamById(UUID id) {
        // Retrieve a specific exam by its ID
        return examRepository.findById(id).orElse(null);
    }

    /**
     * Updates an existing exam in the repository.
     *
     * @param exam the Exam object containing updated information
     */
    public void updateExam(Exam exam) {
        // Update an existing exam in the repository
        examRepository.save(exam);
    }

    /**
     * Searches for exams based on a keyword in the title or description and the
     * uploader's email.
     *
     * @param title the keyword to search in exam titles
     * @param uploadedBy the email of the user who uploaded the exam
     * @return a list of Exam objects that match the search criteria
     */
    public List<Exam> searchExams(String title, String uploadedBy) {
        // Search for exams by a keyword in the title or description
        if (title == null || title.isEmpty()) {
            title = "";
        }
        if (uploadedBy == null || uploadedBy.isEmpty()) {
            uploadedBy = "";
        }
        return examRepository.findByTitleContainingIgnoreCaseAndUploadedByContainingIgnoreCase(title, uploadedBy);
    }

    /**
     * Retrieves all exam attempts made by a user identified by their email.
     *
     * @param userEmail the email of the user whose exam attempts are to be
     * retrieved
     * @return a list of ExamAttempt objects associated with the specified user
     * email
     */
    public List<ExamAttempt> getExamAttemptsByUserEmail(String userEmail) {
        return examAttemptRepository.findByUserEmail(userEmail);
    }
}
