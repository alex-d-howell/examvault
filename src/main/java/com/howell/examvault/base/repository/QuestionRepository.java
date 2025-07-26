package com.howell.examvault.base.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.howell.examvault.base.domain.Question;

public interface QuestionRepository extends JpaRepository<Question, UUID> {

}
