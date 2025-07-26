package com.howell.examvault.base.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.howell.examvault.base.domain.Answer;

public interface AnswerRepository extends JpaRepository<Answer, UUID> {

}
