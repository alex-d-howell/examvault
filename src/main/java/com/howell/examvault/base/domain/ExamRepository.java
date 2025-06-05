package com.howell.examvault.base.domain;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamRepository extends JpaRepository<Exam, UUID> {
    
}