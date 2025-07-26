package com.howell.examvault.base.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.howell.examvault.base.domain.Comment;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
    
    List<Comment> findByExamIdOrderByDateCreatedDesc(UUID examId);
    
    long countByExamId(UUID examId);
    
    void deleteByIdAndExamId(UUID commentId, UUID examId);
}