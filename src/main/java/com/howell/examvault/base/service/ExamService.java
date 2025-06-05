package com.howell.examvault.base.service;

import java.sql.Timestamp;
import java.util.List;
import java.util.UUID;

import com.howell.examvault.base.domain.Exam;
import com.howell.examvault.base.domain.ExamRepository;
import com.howell.examvault.base.domain.Question;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;

@AnonymousAllowed
@BrowserCallable
public class ExamService {
    
    private final ExamRepository examRepository;

    public ExamService(ExamRepository examRepository) {
        this.examRepository = examRepository;
    }

    public void saveExam(Exam exam) {
        // Create a new Exam object and save it to the repository
        examRepository.save(exam);
    }

    public void createSampleExams() {
        // Create and save sample exams\
        List<Question> exampleQuestions1 = List.of(
            new Question("What is the capital of France?", List.of("Paris", "London", "Berlin", "Madrid"), "Paris", false),
            new Question("Which of the following is a programming language?", List.of("Python", "Snake", "Lizard", "Crocodile"), "Python", false)
        );
        List<Question> exampleQuestions2 = List.of(
            new Question("What is the largest planet in our solar system?", List.of("Earth", "Mars", "Jupiter", "Saturn"), "Jupiter", false),
            new Question("Which element has the chemical symbol 'O'?", List.of("Oxygen", "Gold", "Silver", "Hydrogen"), "Oxygen", false)
        );
        List<Question> exampleQuestions3 = List.of(
            new Question("What is the boiling point of water?", List.of("100°C", "0°C", "50°C", "200°C"), "100°C", false),
            new Question("Who wrote 'Romeo and Juliet'?", List.of("Shakespeare", "Hemingway", "Tolkien", "Austen"), "Shakespeare", false)
        );

        Exam exam1 = new Exam(generateRandomCharSequence(10), generateRandomParagraph(6), exampleQuestions1, "admin", new Timestamp(System.currentTimeMillis()));
        Exam exam2 = new Exam(generateRandomCharSequence(10), generateRandomParagraph(5), exampleQuestions2, "admin", new Timestamp(System.currentTimeMillis()));
        Exam exam3 = new Exam(generateRandomCharSequence(10), generateRandomParagraph(3), exampleQuestions3, "admin", new Timestamp(System.currentTimeMillis()));
        examRepository.saveAll(List.of(exam1, exam2, exam3));

    }

    public void deleteAllExams() {
        // Delete all exams from the repository
        examRepository.deleteAll();
    }

    public List<Exam> getAllExams() {
        // Retrieve all exams from the repository
        return examRepository.findAll();
    }

    public Exam getExamById(UUID id) {
        // Retrieve a specific exam by its ID
        return examRepository.findById(id).orElse(null);
    }

    private String generateRandomParagraph(int length) {
        // Generate a random paragraph of specified length
        StringBuilder paragraph = new StringBuilder();
        paragraph.append(generateRandomCharSequence(length));
        for (int i = 0; i < length; i++) {
            paragraph.append("\n").append(generateRandomCharSequence(length * 6));
        }
        return paragraph.toString();
    }

    private String generateRandomCharSequence(int length) {
        // Generate a random character sequence of specified length
        StringBuilder charSequence = new StringBuilder();
        for (int i = 0; i < length; i++) {
            charSequence.append((char) ('a' + Math.random() * 26));
        }
        return charSequence.toString();
    }

}