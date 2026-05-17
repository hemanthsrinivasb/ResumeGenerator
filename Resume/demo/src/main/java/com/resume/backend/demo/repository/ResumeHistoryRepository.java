package com.resume.backend.demo.repository;

import com.resume.backend.demo.model.ResumeHistory;
import com.resume.backend.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ResumeHistoryRepository extends JpaRepository<ResumeHistory, Long> {
    List<ResumeHistory> findByUserOrderByCreatedAtDesc(User user);
    Optional<ResumeHistory> findByShareCode(String shareCode);
    Optional<ResumeHistory> findByIdAndUser(Long id, User user);
}
