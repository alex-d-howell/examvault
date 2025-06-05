package com.howell.examvault.base.domain;

import java.io.Serializable;
import java.security.Timestamp;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "exam_attempts")
public class ExamAttempt implements Serializable{

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String userEmail;

    private Timestamp startTime;

    private Timestamp endTime;

    @ManyToOne
    @JoinColumn(name = "exam_id")
    private Exam exam;

    @OneToMany
    @JoinColumn(name = "selected_answers_id")
    private List<Answer> selectedAnswers;
    
    public ExamAttempt() {
    }
    public ExamAttempt(String userEmail, Timestamp startTime, Timestamp endTime, Exam exam, List<Answer> selectedAnswers) {
        this.userEmail = userEmail;
        this.startTime = startTime;
        this.endTime = endTime;
        this.exam = exam;
        this.selectedAnswers = selectedAnswers;
    }
    
    public UUID getId() {
        return id;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public Timestamp getStartTime() {
        return startTime;
    }

    public void setStartTime(Timestamp startTime) {
        this.startTime = startTime;
    }

    public Timestamp getEndTime() {
        return endTime;
    }

    public void setEndTime(Timestamp endTime) {
        this.endTime = endTime;
    }

    public Exam getExam() {
        return exam;
    }

    public void setExam(Exam exam) {
        this.exam = exam;
    }

    public List<Answer> getSelectedAnswers() {
        return selectedAnswers;
    }

    public void setSelectedAnswers(List<Answer> selectedAnswers) {
        this.selectedAnswers = selectedAnswers;
    }
}