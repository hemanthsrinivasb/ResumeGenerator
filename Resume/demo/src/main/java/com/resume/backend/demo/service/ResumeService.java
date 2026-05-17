package com.resume.backend.demo.service;

import java.io.IOException;
import java.util.Map;

public interface ResumeService {

    // ── Core AI features ──────────────────────────────────────────
    Map<String, Object> generateResumeResponse(String userResumeDescription) throws IOException;
    Map<String, Object> analyzeResume(Map<String, Object> resumeData, String jobDescription) throws IOException;
    Map<String, Object> generateCoverLetter(Map<String, Object> resumeData, String jobDescription) throws IOException;

    // ── Tier 2: New AI features ────────────────────────────────────
    Map<String, Object> generateInterviewQuestions(Map<String, Object> resumeData, String jobDescription) throws IOException;
    Map<String, Object> generateSkillsGap(Map<String, Object> resumeData, String jobDescription) throws IOException;
    Map<String, Object> generateLinkedinPost(Map<String, Object> resumeData, String targetRole) throws IOException;

    // ── Streaming (raw accumulated response for SSE caller) ────────
    String buildResumePrompt(String userDescription) throws IOException;
}
