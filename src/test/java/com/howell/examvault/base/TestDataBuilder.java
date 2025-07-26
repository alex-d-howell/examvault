package com.howell.examvault.base;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import com.howell.examvault.base.domain.Comment;
import com.howell.examvault.base.domain.Exam;
import com.howell.examvault.base.domain.Question;

public class TestDataBuilder {

    private static final Clock CLOCK = Clock.fixed(BaseIntegrationTest.FIXED_INSTANT, java.time.ZoneOffset.UTC);
    
    private static final AtomicInteger examCounter = new AtomicInteger(1);
    private static final AtomicInteger questionCounter = new AtomicInteger(1);
    private static final AtomicInteger commentCounter = new AtomicInteger(1);

    public static ExamBuilder examBuilder() {
        return new ExamBuilder();
    }

    public static QuestionBuilder questionBuilder() {
        return new QuestionBuilder();
    }

    public static CommentBuilder commentBuilder() {
        return new CommentBuilder();
    }

    public static Clock getClock() {
        return CLOCK;
    }

    public static class ExamBuilder {
        private String title;
        private String description;
        private List<String> tags;
        private String uploadedBy;
        private Instant uploadedAt;
        private List<Question> questions;

        public ExamBuilder() {
            int count = examCounter.getAndIncrement();
            this.title = "Test Exam " + count;
            this.description = "Test Description " + count;
            this.tags = new ArrayList<>(List.of("test", "sample"));
            this.uploadedBy = "test" + count + "@example.com";
            this.uploadedAt = CLOCK.instant();
            this.questions = new ArrayList<>(List.of(questionBuilder().build()));
        }

        public ExamBuilder title(String title) {
            this.title = title;
            return this;
        }

        public ExamBuilder description(String description) {
            this.description = description;
            return this;
        }

        public ExamBuilder tags(List<String> tags) {
            this.tags = tags != null ? new ArrayList<>(tags) : new ArrayList<>();
            return this;
        }

        public ExamBuilder uploadedBy(String uploadedBy) {
            this.uploadedBy = uploadedBy;
            return this;
        }

        public ExamBuilder uploadedAt(Instant uploadedAt) {
            this.uploadedAt = uploadedAt;
            return this;
        }

        public ExamBuilder questions(List<Question> questions) {
            this.questions = questions != null ? new ArrayList<>(questions) : new ArrayList<>();
            return this;
        }

        public Exam build() {
            Exam exam = new Exam(title, description, questions, uploadedBy, uploadedAt, tags);
            if (questions != null) {
                questions.forEach(question -> question.setExam(exam));
            }
            return exam;
        }
    }

    public static class QuestionBuilder {
        private String questionText;
        private List<String> options;
        private List<String> correctAnswers;
        private Boolean isMultipleAnswers;
        private String explanation;

        public QuestionBuilder() {
            int count = questionCounter.getAndIncrement();
            this.questionText = "What is the answer to question " + count + "?";
            this.options = new ArrayList<>(List.of("Answer A", "Answer B", "Answer C", "Answer D"));
            this.correctAnswers = new ArrayList<>(List.of("Answer A"));
            this.isMultipleAnswers = false;
            this.explanation = "Explanation for question " + count;
        }

        public QuestionBuilder questionText(String questionText) {
            this.questionText = questionText;
            return this;
        }

        public QuestionBuilder options(List<String> options) {
            this.options = options != null ? new ArrayList<>(options) : new ArrayList<>();
            return this;
        }

        public QuestionBuilder correctAnswers(List<String> correctAnswers) {
            this.correctAnswers = correctAnswers != null ? new ArrayList<>(correctAnswers) : new ArrayList<>();
            return this;
        }

        public QuestionBuilder multipleAnswers(boolean isMultipleAnswers) {
            this.isMultipleAnswers = isMultipleAnswers;
            return this;
        }

        public QuestionBuilder explanation(String explanation) {
            this.explanation = explanation;
            return this;
        }

        public Question build() {
            return new Question(questionText, options, correctAnswers, isMultipleAnswers, explanation);
        }
    }

    public static class CommentBuilder {
        private UUID examId;
        private String userEmail;
        private Instant dateCreated;
        private String commentString;
        private int examRating;

        public CommentBuilder() {
            int count = commentCounter.getAndIncrement();
            this.examId = UUID.randomUUID();
            this.userEmail = "commenter" + count + "@example.com";
            this.dateCreated = CLOCK.instant();
            this.commentString = "Comment " + count + " - This is a test comment";
            this.examRating = 5;
        }

        public CommentBuilder examId(UUID examId) {
            this.examId = examId;
            return this;
        }

        public CommentBuilder userEmail(String userEmail) {
            this.userEmail = userEmail;
            return this;
        }

        public CommentBuilder dateCreated(Instant dateCreated) {
            this.dateCreated = dateCreated;
            return this;
        }

        public CommentBuilder commentString(String commentString) {
            this.commentString = commentString;
            return this;
        }

        public CommentBuilder rating(int rating) {
            this.examRating = rating;
            return this;
        }

        public Comment build() {
            Comment comment = new Comment(examId, userEmail, dateCreated, commentString);
            comment.setExamRating(examRating);
            return comment;
        }
    }
}