package com.resume.backend.demo.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "interview_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @ToString.Exclude
    private InterviewSession session;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private int sequenceNumber;

    @Column(columnDefinition = "TEXT")
    private String userAnswer;

    @Column(columnDefinition = "TEXT")
    private String aiEvaluation;

    @Column
    private Integer score; // 0–10

    @Column(columnDefinition = "TEXT")
    private String idealAnswer;

    // Voice/multimodal enrichment fields (nullable — set when user answers via voice)
    @Column
    private Integer audioConfidenceScore;

    @Column
    private Integer hesitationCount;

    @Column
    private String dominantEmotion;
}
