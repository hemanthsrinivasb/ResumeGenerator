package com.resume.backend.demo;

import java.util.Map;

public record InterviewQuestionsRequest(
    Map<String, Object> resumeData,
    String jobDescription
) {}
