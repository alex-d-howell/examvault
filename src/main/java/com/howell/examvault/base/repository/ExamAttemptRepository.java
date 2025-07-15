package com.howell.examvault.base.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.howell.examvault.base.domain.ExamAttempt;

public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, UUID> {

    public List<ExamAttempt> findByUserEmail(String userEmail);

}
