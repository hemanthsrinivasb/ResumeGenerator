package com.resume.backend.demo.repository;

import com.resume.backend.demo.model.InterviewSession;
import com.resume.backend.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {
    List<InterviewSession> findByUserOrderByCreatedAtDesc(User user);
    Optional<InterviewSession> findByIdAndUser(Long id, User user);
}
