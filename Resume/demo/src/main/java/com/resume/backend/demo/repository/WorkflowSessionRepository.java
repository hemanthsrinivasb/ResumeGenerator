package com.resume.backend.demo.repository;

import com.resume.backend.demo.model.User;
import com.resume.backend.demo.model.WorkflowSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkflowSessionRepository extends JpaRepository<WorkflowSession, Long> {
    List<WorkflowSession> findByUserOrderByCreatedAtDesc(User user);
}
