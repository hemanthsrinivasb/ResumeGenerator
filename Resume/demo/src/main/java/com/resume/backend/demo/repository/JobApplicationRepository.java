package com.resume.backend.demo.repository;

import com.resume.backend.demo.model.JobApplication;
import com.resume.backend.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    List<JobApplication> findByUserOrderByCreatedAtDesc(User user);
    List<JobApplication> findByUserAndStatus(User user, JobApplication.AppStatus status);
    Optional<JobApplication> findByIdAndUser(Long id, User user);
}
