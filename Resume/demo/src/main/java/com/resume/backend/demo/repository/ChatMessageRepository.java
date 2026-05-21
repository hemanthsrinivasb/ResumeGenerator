package com.resume.backend.demo.repository;

import com.resume.backend.demo.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByUserIdAndSessionIdOrderByCreatedAtAsc(Long userId, String sessionId);

    void deleteByUserIdAndSessionId(Long userId, String sessionId);

    long countByUserId(Long userId);
}
