package com.resume.backend.demo.repository;

import com.resume.backend.demo.model.AgentSession;
import com.resume.backend.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AgentSessionRepository extends JpaRepository<AgentSession, Long> {
    List<AgentSession> findByUserAndAgentTypeOrderByCreatedAtDesc(User user, String agentType);
    List<AgentSession> findByUserOrderByCreatedAtDesc(User user);
}
