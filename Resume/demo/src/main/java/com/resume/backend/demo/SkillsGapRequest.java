package com.resume.backend.demo;

import java.util.Map;

public record SkillsGapRequest(
    Map<String, Object> resumeData,
    String jobDescription
) {}
