package com.howell.examvault.base.domain;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, UUID> {

    public List<ExamAttempt> findByUserEmail(String userEmail);

}
