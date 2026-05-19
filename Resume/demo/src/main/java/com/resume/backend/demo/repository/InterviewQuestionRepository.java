package com.resume.backend.demo.repository;

import com.resume.backend.demo.model.InterviewQuestion;
import com.resume.backend.demo.model.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, Long> {
    List<InterviewQuestion> findBySessionOrderBySequenceNumberAsc(InterviewSession session);
    long countBySession(InterviewSession session);
}
