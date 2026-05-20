package com.resume.backend.demo.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "workflow_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowSession {

    public enum WorkflowStatus { ACTIVE, COMPLETED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private User user;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String goalText;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private WorkflowStatus status = WorkflowStatus.COMPLETED;

    @Column(columnDefinition = "TEXT")
    private String gapAnalysis;

    @Column(columnDefinition = "TEXT")
    private String learningRoadmap;

    @Column(columnDefinition = "TEXT")
    private String rewrittenResume;

    @Column(columnDefinition = "TEXT")
    private String interviewPrep;

    @Column(columnDefinition = "TEXT")
    private String masterTimeline;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
